// Spike Prime (Pybricks) Upload Module
// Handles: code preprocessing, .mpy compilation, WebUSB upload

var spikeUploader = new function() {
  var self = this;

  // Pybricks BLE/USB GATT UUIDs
  const PYBRICKS_SERVICE_UUID = 'c5f50001-8280-46da-89f4-6d8051e4aeef';
  const PYBRICKS_CONTROL_UUID = 'c5f50002-8280-46da-89f4-6d8051e4aeef';
  const PYBRICKS_HUB_CAPS_UUID = 'c5f50003-8280-46da-89f4-6d8051e4aeef';

  // Pybricks protocol command types
  const CMD_STOP_USER_PROGRAM       = 0;
  const CMD_START_USER_PROGRAM      = 1;
  const CMD_WRITE_USER_PROGRAM_META = 3;
  const CMD_WRITE_USER_RAM          = 4;

  // Hub capability flags
  const CAP_USER_PROGRAM_MULTI_MPY6 = 1 << 1;

  // Event types from hub
  const EVENT_STATUS_REPORT = 0;

  // Status flags
  const STATUS_USER_PROGRAM_RUNNING = 1 << 6;

  self.device = null;
  self.server = null;
  self.controlChar = null;
  self.maxWriteSize = 20; // default BLE MTU safe size

  // ─── 1. Code Preprocessing ────────────────────────────────────────────────

  // Convert pybricks-mode code (EV3) → Spike Prime compatible
  // portMap: { spikePort -> deviceType }
  //   spikePort: 'A'~'F'
  //   deviceType: 'NONE' | 'left_motor' | 'right_motor' | 'motor' |
  //               'ColorSensor' | 'GyroSensor' | 'UltrasonicSensor' | 'TouchSensor'
  this.preprocessCode = function(code, portMap) {
    portMap = portMap || {};

    // Invert portMap for easy lookup by device role
    // e.g. leftMotorPort = 'A', rightMotorPort = 'B', sensorPorts = { ColorSensor: 'C', ... }
    var leftMotorPort = null;
    var rightMotorPort = null;
    var extraMotorPorts = []; // additional motors beyond left/right
    var sensorPorts = {}; // { 'ColorSensor': 'C', 'GyroSensor': 'D', ... }

    Object.keys(portMap).forEach(function(port) {
      var device = portMap[port];
      if (device === 'NONE') return;
      if (device === 'left_motor')  { leftMotorPort = port; }
      else if (device === 'right_motor') { rightMotorPort = port; }
      else if (device === 'motor')  { extraMotorPorts.push(port); }
      else { sensorPorts[device] = port; }
    });

    // Which pupdevices classes are actually needed
    var usedClasses = new Set();
    if (leftMotorPort || rightMotorPort || extraMotorPorts.length) usedClasses.add('Motor');
    Object.keys(sensorPorts).forEach(function(cls) { usedClasses.add(cls); });

    var virtualOnlySensors = ['GPSSensor', 'CameraSensor', 'LidarSensor', 'LaserRangeSensor', 'Pen'];
    var warnings = [];
    virtualOnlySensors.forEach(function(cls) {
      if (new RegExp('\\b' + cls + '\\b').test(code)) warnings.push(cls);
    });

    var lines = code.split('\n');
    var result = [];
    var headerDone = false; // track whether we've emitted the new header block

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // ── Imports / header replacements ──────────────────────────────────────

      if (line.trim() === 'from ev3dev2.sensor.virtual import *') continue;
      if (line.trim() === 'from pybricks.hubs import EV3Brick') {
        result.push('from pybricks.hubs import PrimeHub');
        continue;
      }
      if (line.trim() === 'from pybricks.ev3devices import *') {
        if (usedClasses.size > 0) {
          result.push('from pybricks.pupdevices import ' + Array.from(usedClasses).join(', '));
        }
        continue;
      }

      // ── Hub instance ────────────────────────────────────────────────────────

      if (line.trim() === 'ev3 = EV3Brick()') {
        result.push('hub = PrimeHub()');
        continue;
      }

      // ── Motor/sensor initialization lines — replace with portMap-based code ─

      // motorA = Motor(Port.A)  (hard-coded in genCode header)
      if (/^\s*motorA\s*=\s*Motor\s*\(Port\.A\)/.test(line)) {
        if (leftMotorPort) {
          result.push('motorA = Motor(Port.' + leftMotorPort + ')');
        }
        // else: no left motor → skip
        continue;
      }
      if (/^\s*motorB\s*=\s*Motor\s*\(Port\.B\)/.test(line)) {
        if (rightMotorPort) {
          result.push('motorB = Motor(Port.' + rightMotorPort + ')');
        }
        continue;
      }
      if (/^\s*left_motor\s*=\s*motorA/.test(line)) {
        if (leftMotorPort) result.push('left_motor = motorA');
        continue;
      }
      if (/^\s*right_motor\s*=\s*motorB/.test(line)) {
        if (rightMotorPort) result.push('right_motor = motorB');
        continue;
      }

      // motorC = Motor(Port.C) ... extra motors from genCode
      var extraMotorMatch = line.match(/^\s*motor([A-F])\s*=\s*Motor\s*\(Port\.([A-F])\)/);
      if (extraMotorMatch) {
        // Only keep if this port is assigned as 'motor' in portMap
        var evPort = extraMotorMatch[1];
        if (portMap[evPort] === 'motor') {
          result.push(line);
        }
        continue;
      }

      // Sensor initialization: color_sensor_in1 = ColorSensor(Port.S1) etc.
      var sensorInitMatch = line.match(/^\s*(\w+_in\d+)\s*=\s*(\w+Sensor)\s*\(Port\.S(\d+)\)/);
      if (sensorInitMatch) {
        var varBase = sensorInitMatch[1]; // e.g. color_sensor_in1
        var cls     = sensorInitMatch[2]; // e.g. ColorSensor
        var num     = sensorInitMatch[3]; // e.g. '1'
        var assignedPort = sensorPorts[cls];
        if (assignedPort) {
          // Rename variable to use port letter: color_sensor_A
          var newVar = varBase.replace(/_in\d+$/, '_' + assignedPort);
          result.push(newVar + ' = ' + cls + '(Port.' + assignedPort + ')');
        }
        // else: sensor not assigned → skip line
        continue;
      }

      // ── Body: rename sensor variables to match assigned port ───────────────

      Object.keys(sensorPorts).forEach(function(cls) {
        var assignedPort = sensorPorts[cls];
        // Replace _in1, _in2... with _<port> for any variable referencing this sensor
        line = line.replace(new RegExp('(\\b\\w+)_in(\\d+)\\b', 'g'), function(match, prefix, num) {
          // Check the sensor that was at this sim port
          // We match by class from the original init lines already rewritten above;
          // here we simply replace any _inN suffix with the assigned port for known sensor vars
          return match; // safe default — handled per-sensor below
        });
      });

      // Simpler: replace all _inN occurrences where that sim sensor is assigned a port
      // Re-build a num→port lookup from sensorPorts (reverse via original robot config order)
      // Since genCode assigns sensors to in1, in2... in order, and we know which sensor type
      // is at each port, map sim sensor number to spike port by matching types.
      // For body code, variable names like color_sensor_in1 need → color_sensor_<assignedPort>
      // We do this by checking which sim port number had which sensor type.
      var i2 = 1;
      while (robot.getComponentByPort('in' + i2)) {
        var comp = robot.getComponentByPort('in' + i2);
        var assignedPort = sensorPorts[comp.type];
        if (assignedPort) {
          line = line.replace(new RegExp('_in' + i2 + '\\b', 'g'), '_' + assignedPort);
        }
        i2++;
      }

      // ── ev3.* → hub.* ───────────────────────────────────────────────────────

      line = line.replace(/\bev3\.speaker\b/g, 'hub.speaker');
      line = line.replace(/\bev3\.buttons\b/g, 'hub.buttons');
      line = line.replace(/\bev3\.screen\b/g,  'hub.display');
      line = line.replace(/\bev3\.battery\b/g, 'hub.battery');

      // ── Remove virtual-only lines ───────────────────────────────────────────

      if (/^\s*radio\s*=\s*Radio\s*\(\s*\)/.test(line)) continue;
      if (/^\s*obtr\s*=\s*ObjectTracker\s*\(\s*\)/.test(line)) continue;

      var skipLine = false;
      virtualOnlySensors.forEach(function(cls) {
        if (new RegExp('=\\s*' + cls + '\\s*\\(').test(line)) skipLine = true;
      });
      if (skipLine) continue;

      result.push(line);
    }

    return {
      code: result.join('\n'),
      warnings: warnings
    };
  };

  // ─── 2. MicroPython Compilation ───────────────────────────────────────────

  // Compile .py source to .mpy bytecode using mpy-cross WASM
  this.compileMpy = function(pyCode) {
    return new Promise(function(resolve, reject) {
      if (typeof MpyCross === 'undefined') {
        reject(new Error('mpy-cross not loaded'));
        return;
      }

      var wasmPath = '/mpy-cross/mpy-cross-v6.wasm';

      MpyCross({
        arguments: ['main.py'],
        inputFileContents: pyCode,
        locateFile: function(path) {
          if (path === 'mpy-cross-v6.wasm') return wasmPath;
          return path;
        },
        callback: function(status, mpy, out, err) {
          if (status !== 0) {
            var errorMsg = err && err.length > 0 ? err.join('\n') : 'Compilation failed (status ' + status + ')';
            reject(new Error(errorMsg));
          } else {
            resolve(mpy);
          }
        }
      });
    });
  };

  // Wrap compiled .mpy into Pybricks MultiMpy6 format
  // Format per file: size(uint32 LE) + moduleName(C string, null-terminated) + mpy bytes
  this.wrapMultiMpy6 = function(mpyData, moduleName) {
    var encoder = new TextEncoder();
    var nameBytes = encoder.encode(moduleName + '\0'); // null-terminated C string
    var size = mpyData.byteLength;

    // size(4) + nameBytes + mpyData
    var total = 4 + nameBytes.byteLength + size;
    var buf = new Uint8Array(total);
    var view = new DataView(buf.buffer);

    view.setUint32(0, size, true); // little-endian size
    buf.set(nameBytes, 4);
    buf.set(mpyData, 4 + nameBytes.byteLength);

    return buf;
  };

  // ─── 3. WebBluetooth Connection ───────────────────────────────────────────

  this.connect = function() {
    return new Promise(function(resolve, reject) {
      if (!navigator.bluetooth) {
        reject(new Error('WebBluetooth is not supported in this browser.\nUse Chrome or Edge.'));
        return;
      }

      navigator.bluetooth.requestDevice({
        filters: [{ services: [PYBRICKS_SERVICE_UUID] }],
        optionalServices: [PYBRICKS_SERVICE_UUID]
      })
      .then(function(device) {
        self.device = device;
        self.device.addEventListener('gattserverdisconnected', self.onDisconnected);
        return device.gatt.connect();
      })
      .then(function(server) {
        self.server = server;
        return server.getPrimaryService(PYBRICKS_SERVICE_UUID);
      })
      .then(function(service) {
        return Promise.all([
          service.getCharacteristic(PYBRICKS_CONTROL_UUID),
          service.getCharacteristic(PYBRICKS_HUB_CAPS_UUID)
        ]);
      })
      .then(function(chars) {
        self.controlChar = chars[0];
        var capsChar = chars[1];

        // Must enable notifications on control characteristic before writing
        // (required by Pybricks protocol)
        return self.controlChar.stopNotifications()
          .catch(function() {}) // ignore error if not already started
          .then(function() {
            return self.controlChar.startNotifications();
          })
          .then(function() {
            // Read hub capabilities
            // Layout: maxWriteSize(uint16) + flags(uint32) + maxUserProgramSize(uint32)
            return capsChar.readValue();
          })
          .then(function(value) {
            if (value.byteLength >= 2) {
              self.maxWriteSize = value.getUint16(0, true);
            }
            var flags = value.byteLength >= 6 ? value.getUint32(2, true) : 0;
            console.log('[Spike] Hub capabilities flags:', flags, 'maxWriteSize:', self.maxWriteSize);
            resolve();
          });
      })
      .catch(function(err) {
        reject(err);
      });
    });
  };

  this.disconnect = function() {
    if (self.device && self.device.gatt.connected) {
      self.device.gatt.disconnect();
    }
  };

  this.onDisconnected = function() {
    self.device = null;
    self.server = null;
    self.controlChar = null;
    console.log('[Spike] Disconnected');
    if (typeof self.onStatusChange === 'function') {
      self.onStatusChange('disconnected');
    }
  };

  // ─── 4. Upload Protocol ───────────────────────────────────────────────────

  // Send a command to the hub via control characteristic
  this.sendCommand = function(data) {
    var cmdType = data[0];
    console.log('[Spike] sendCommand type=' + cmdType + ' len=' + data.byteLength);
    return self.controlChar.writeValueWithResponse(data.buffer)
      .then(function() {
        return new Promise(function(r) { setTimeout(r, 20); });
      });
  };

  // Upload mpy bytecode to hub and run it
  this.uploadAndRun = function(mpyData, onProgress) {
    return new Promise(function(resolve, reject) {
      if (!self.controlChar) {
        reject(new Error('Not connected to hub'));
        return;
      }

      // Wrap mpy into MultiMpy6 format: size(4) + moduleName\0 + mpy bytes
      var multiMpy = self.wrapMultiMpy6(mpyData, '__main__');
      var totalSize = multiMpy.byteLength;
      var chunkSize = Math.max(1, self.maxWriteSize - 5); // 5 bytes for WriteUserRam header

      console.log('[Spike] Uploading', totalSize, 'bytes, chunkSize:', chunkSize);

      // Official Pybricks upload sequence:
      // 1. Stop program
      // 2. WriteUserProgramMeta(size=0)  ← invalidate existing program
      // 3. WriteUserRam(chunks...)       ← upload data
      // 4. WriteUserProgramMeta(size=N)  ← finalize
      // 5. StartUserProgram

      var stopCmd = new Uint8Array(1);
      stopCmd[0] = CMD_STOP_USER_PROGRAM;

      self.sendCommand(stopCmd)
      .then(function() {
        // Step 2: Invalidate existing program
        var metaCmd = new Uint8Array(5);
        var metaView = new DataView(metaCmd.buffer);
        metaView.setUint8(0, CMD_WRITE_USER_PROGRAM_META);
        metaView.setUint32(1, 0, true); // size=0 to invalidate
        return self.sendCommand(metaCmd);
      })
      .then(function() {
        // Step 3: Send data chunks
        var offset = 0;

        function sendNextChunk() {
          if (offset >= totalSize) {
            return Promise.resolve();
          }

          var end = Math.min(offset + chunkSize, totalSize);
          var chunk = multiMpy.slice(offset, end);

          var ramCmd = new Uint8Array(5 + chunk.byteLength);
          var ramView = new DataView(ramCmd.buffer);
          ramView.setUint8(0, CMD_WRITE_USER_RAM);
          ramView.setUint32(1, offset, true);
          ramCmd.set(chunk, 5);

          offset = end;

          if (typeof onProgress === 'function') {
            onProgress(offset / totalSize);
          }

          return self.sendCommand(ramCmd).then(sendNextChunk);
        }

        return sendNextChunk();
      })
      .then(function() {
        // Step 4: Finalize with actual size
        var metaCmd = new Uint8Array(5);
        var metaView = new DataView(metaCmd.buffer);
        metaView.setUint8(0, CMD_WRITE_USER_PROGRAM_META);
        metaView.setUint32(1, totalSize, true);
        return self.sendCommand(metaCmd);
      })
      .then(function() {
        // Step 5: Start user program (slot 0)
        var startCmd = new Uint8Array(2);
        startCmd[0] = CMD_START_USER_PROGRAM;
        startCmd[1] = 0;
        return self.sendCommand(startCmd);
      })
      .then(function() {
        console.log('[Spike] Upload complete, program started');
        resolve();
      })
      .catch(function(err) {
        reject(err);
      });
    });
  };

  // ─── 5. Main Entry Point ──────────────────────────────────────────────────

  // Full flow: get code from python editor → compile → upload → run
  this.uploadFromEditor = function(onStatus, onProgress) {
    onStatus = onStatus || function() {};
    onProgress = onProgress || function() {};

    // Get code directly from the python editor (ace editor)
    var rawCode = pythonPanel.editor.getValue();

    if (!rawCode.trim()) {
      onStatus('error', '코드가 없습니다.\nPython 탭에서 코드를 작성해주세요.');
      return;
    }

    console.log('[Spike] Uploading code:\n' + rawCode);

    onStatus('compiling', '.mpy 컴파일 중...');

    self.compileMpy(rawCode)
    .then(function(mpyData) {
      onStatus('connecting', 'Spike Prime 연결 중...\n허브의 블루투스 버튼을 누르세요.');

      return self.connect().then(function() {
        onStatus('uploading', '업로드 중...');
        return self.uploadAndRun(mpyData, onProgress);
      });
    })
    .then(function() {
      onStatus('done', '업로드 완료! 프로그램이 시작됩니다.');
    })
    .catch(function(err) {
      console.error('[Spike] Upload failed:', err);
      onStatus('error', err.message || '업로드 실패');
    });
  };
};
