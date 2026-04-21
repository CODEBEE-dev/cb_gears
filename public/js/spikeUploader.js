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

    // portMap에서 역할별 포트 추출
    var leftMotorPort = null;
    var rightMotorPort = null;
    var extraMotorPorts = [];
    var sensorPorts = {}; // { 'ColorSensor': 'C', ... }

    // Spike에서 지원하는 센서 목록
    var SUPPORTED_SENSORS = {
      'ColorSensor':      'color_sensor',
      'UltrasonicSensor': 'ultrasonic_sensor',
    };

    // Spike에서 미지원 센서 (경고만)
    var UNSUPPORTED_SENSORS = ['GyroSensor', 'TouchSensor', 'GPSSensor', 'CameraSensor', 'LidarSensor', 'Pen'];

    Object.keys(portMap).forEach(function(port) {
      var device = portMap[port];
      if (device === 'NONE') return;
      if (device === 'left_motor')       { leftMotorPort = port; }
      else if (device === 'right_motor') { rightMotorPort = port; }
      else if (device === 'motor')       { extraMotorPorts.push(port); }
      else                               { sensorPorts[device] = port; }
    });

    // ── 1. # Here is where your code starts 아래 사용자 코드만 추출 ──────────
    var marker = '# Here is where your code starts';
    var markerIdx = code.indexOf(marker);
    var userCode = markerIdx !== -1 ? code.slice(markerIdx + marker.length) : code;

    // ev3.* → hub.* 치환
    userCode = userCode.replace(/\bev3\.speaker\b/g, 'hub.speaker');
    userCode = userCode.replace(/\bev3\.buttons\b/g, 'hub.buttons');
    userCode = userCode.replace(/\bev3\.screen\b/g,  'hub.display');
    userCode = userCode.replace(/\bev3\.battery\b/g, 'hub.battery');

    // float(x) → x
    userCode = userCode.replace(/\bfloat\s*\(\s*([^)]+)\s*\)/g, '$1');

    // 계속 돌기(run/dc) 호출이 있으면 프로그램이 종료되지 않도록 끝에 무한루프 추가
    if (/\b(?:motor\w*|left_motor|right_motor)\.(?:run|dc)\s*\(/.test(userCode)) {
      userCode = userCode.trimEnd() + '\nwhile True:\n    wait(100)\n';
    }

    // ── 2. 헤더 생성 ─────────────────────────────────────────────────────────
    var header = [];

    // imports
    header.push('from pybricks.parameters import Port, Color, Direction, Stop');
    header.push('from pybricks.hubs import PrimeHub');

    var pupdevices = [];
    if (leftMotorPort || rightMotorPort || extraMotorPorts.length) pupdevices.push('Motor');
    Object.keys(sensorPorts).forEach(function(cls) { pupdevices.push(cls); });
    if (pupdevices.length > 0) {
      header.push('from pybricks.pupdevices import ' + pupdevices.join(', '));
    }
    header.push('from pybricks.tools import wait');
    header.push('');

    // hub
    header.push('hub = PrimeHub()');

    // 모터 초기화
    if (leftMotorPort) {
      header.push('motorA = Motor(Port.' + leftMotorPort + ')');
      header.push('left_motor = motorA');
    }
    if (rightMotorPort) {
      header.push('motorB = Motor(Port.' + rightMotorPort + ')');
      header.push('right_motor = motorB');
    }
    extraMotorPorts.forEach(function(port) {
      header.push('motor' + port + ' = Motor(Port.' + port + ')');
    });

    // 센서 초기화
    var warnings = [];
    Object.keys(sensorPorts).forEach(function(cls) {
      var port = sensorPorts[cls];

      if (UNSUPPORTED_SENSORS.indexOf(cls) !== -1) {
        warnings.push(cls);
        return;
      }

      if (!SUPPORTED_SENSORS[cls]) return;

      // 블록 본문에서 실제 사용하는 변수명 찾기 (예: color_sensor_in1)
      var prefix = SUPPORTED_SENSORS[cls];
      var varNameMatch = userCode.match(new RegExp('\\b(' + prefix + '_in\\d+)\\b'));
      var varName = varNameMatch ? varNameMatch[1] : prefix + '_' + port;

      header.push(varName + ' = ' + cls + '(Port.' + port + ')');
      if (cls === 'ColorSensor') {
        header.push(varName + '.detectable_colors([Color.BLACK, Color.WHITE, Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW, Color.BROWN])');
      }
    });

    // move_tank 등 헬퍼 함수 (모터가 있을 때만)
    if (leftMotorPort || rightMotorPort) {
      header.push('');
      header.push('def move_tank(left, right):');
      header.push('    left_motor.run(left)');
      header.push('    right_motor.run(right)');
      header.push('');
      header.push('def move_tank_for_degrees(left, right, degrees):');
      header.push('    if degrees == 0 or (left == 0 and right == 0):');
      header.push('        left_degrees = 0');
      header.push('        right_degrees = 0');
      header.push('    elif abs(left) > abs(right):');
      header.push('        left_degrees = degrees');
      header.push('        right_degrees = abs(right / left) * degrees');
      header.push('    else:');
      header.push('        left_degrees = abs(left / right) * degrees');
      header.push('        right_degrees = degrees');
      header.push('    if abs(left) > abs(right):');
      header.push('        right_motor.run_angle(right, right_degrees, wait=False)');
      header.push('        left_motor.run_angle(left, left_degrees, wait=True)');
      header.push('    else:');
      header.push('        left_motor.run_angle(left, left_degrees, wait=False)');
      header.push('        right_motor.run_angle(right, right_degrees, wait=True)');
      header.push('');
      header.push('def move_tank_for_milliseconds(left, right, milliseconds):');
      header.push('    left_motor.run_time(left, milliseconds, wait=False)');
      header.push('    right_motor.run_time(right, milliseconds, wait=True)');
      header.push('');
      header.push('def get_speed_steering(steer, speed):');
      header.push('    left_speed = speed');
      header.push('    right_speed = speed');
      header.push('    speed_factor = (50 - abs(steer)) / 50.0');
      header.push('    if steer >= 0:');
      header.push('        right_speed *= speed_factor');
      header.push('    else:');
      header.push('        left_speed *= speed_factor');
      header.push('    return (left_speed, right_speed)');
      header.push('');
      header.push('def move_tank_dc(left, right):');
      header.push('    left_motor.dc(left)');
      header.push('    right_motor.dc(right)');
      header.push('');
      header.push('def move_steering(steer, speed):');
      header.push('    (left_speed, right_speed) = get_speed_steering(steer, speed)');
      header.push('    move_tank(left_speed, right_speed)');
      header.push('');
      header.push('def move_steering_for_degrees(steer, speed, degrees):');
      header.push('    (left_speed, right_speed) = get_speed_steering(steer, speed)');
      header.push('    move_tank_for_degrees(left_speed, right_speed, degrees)');
      header.push('');
      header.push('def move_steering_for_milliseconds(steer, speed, milliseconds):');
      header.push('    (left_speed, right_speed) = get_speed_steering(steer, speed)');
      header.push('    move_tank_for_milliseconds(left_speed, right_speed, milliseconds)');
    }

    header.push('');
    header.push(marker);

    var finalCode = header.join('\n') + userCode;

    return {
      code: finalCode,
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

  // Full flow: generate code from blocks → preprocess → compile → upload → run
  this.uploadFromEditor = function(portMap, onStatus, onProgress) {
    onStatus = onStatus || function() {};
    onProgress = onProgress || function() {};

    var rawCode;

    if (filesManager.modified) {
      // Python 탭에서 직접 수정한 경우 → 그대로 사용
      rawCode = pythonPanel.editor.getValue();
      console.log('[Spike] Using manual Python tab code (skipping preprocess)');
    } else {
      // 블록에서 생성한 경우 → 전처리 (pybricks generator로 강제 전환 후 복원)
      var prevGenerator = blockly.generator;
      pybricks_generator.load();
      var blockCode = pybricks_generator.genCode();
      if (prevGenerator !== pybricks_generator) prevGenerator.load();
      var preprocessed = self.preprocessCode(blockCode, portMap);
      rawCode = preprocessed.code;
      if (preprocessed.warnings.length > 0) {
        console.warn('[Spike] Unsupported sensors:', preprocessed.warnings.join(', '));
        onStatus('warning', 'Spike에서 지원하지 않는 센서가 있습니다: ' + preprocessed.warnings.join(', ') + '\n해당 센서 관련 코드는 동작하지 않을 수 있습니다.');
      }
      console.log('[Spike] Using preprocessed block code');
    }

    if (!rawCode.trim()) {
      onStatus('error', '코드가 없습니다.');
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
