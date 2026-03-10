i18n.append({
  '#maze-shortDescription#': {
    en: 'Maze Map',
    ko: '미로 지도',
  },
  '#maze-longDescription#': {
    en: '<p>This generates a maze of configurable size.</p>' +
        '<p>See the <a href="https://github.com/QuirkyCort/gears/wiki/Maze-Map" target="_blank">wiki page</a> for some challenges to try out.</p>' +
        '<p>By default, the generated maze is randomized unless you set a random seed.</p>',
    ko: '<p>크기를 설정할 수 있는 미로를 생성합니다.</p>' +
        '<p>도전 과제는 <a href="https://github.com/QuirkyCort/gears/wiki/Maze-Map" target="_blank">위키 페이지</a>를 참고하세요.</p>' +
        '<p>기본적으로 무작위 시드가 설정되지 않으면 미로는 매번 무작위로 생성됩니다.</p>',
  },
  '#maze-mazeType#': {
    en: 'Maze Type',
    ko: '미로 유형',
  },
  '#maze-perfect#': {
    en: 'Perfect',
    ko: '완전 미로',
  },
  '#maze-imperfect#': {
    en: 'Imperfect',
    ko: '불완전 미로',
  },
  '#maze-perfectHTML#': {
    en: '<p>Perfect mazes have no loops or isolated walls. ' +
        'For this maze, your robot will always start at the bottom left corner.<p>',
    ko: '<p>완전 미로는 루프나 고립된 벽이 없습니다. ' +
        '이 미로에서 로봇은 항상 왼쪽 아래 모서리에서 시작합니다.<p>',
  },
  '#maze-imperfectHTML#': {
    en: '<p>Imperfect mazes may have loops and isolated wall segments. ' +
        'This may make it slightly easier for a human to solve, but can also make it harder for a computer.</p>' +
        '<p>When generating an imperfect maze, the columns and rows must always be an odd number. ' +
        'It\'s also preferable to generate a large maze. ' +
        'Your robot will start at the center of the maze.</p>',
    ko: '<p>불완전 미로는 루프와 고립된 벽 구간이 있을 수 있습니다. ' +
        '사람이 풀기에는 약간 더 쉬울 수 있지만, 컴퓨터에게는 더 어려울 수도 있습니다.</p>' +
        '<p>불완전 미로를 생성할 때 열과 행의 수는 항상 홀수여야 합니다. ' +
        '큰 미로를 생성하는 것이 더 좋습니다. ' +
        '로봇은 미로의 중앙에서 시작합니다.</p>',
  },
  '#maze-columns#': {
    en: 'Number of columns',
    ko: '열 수',
  },
  '#maze-rows#': {
    en: 'Number of rows',
    ko: '행 수',
  },
  '#maze-cellSize#': {
    en: 'Cell size (cm)',
    ko: '셀 크기 (cm)',
  },
  '#maze-wallHeight#': {
    en: 'Wall Height (cm)',
    ko: '벽 높이 (cm)',
  },
  '#maze-seed#': {
    en: 'Maze Seed',
    ko: '미로 시드',
  },
  '#maze-seedHelp#': {
    en: 'Leave this blank to generate a random maze',
    ko: '무작위 미로를 생성하려면 비워 두세요',
  },
});

var world_Maze = new function() {
  var self = this;

  this.name = 'maze';
  this.shortDescription = i18n.get('#maze-shortDescription#');
  this.longDescription = i18n.get('#maze-longDescription#');
  this.thumbnail = 'images/worlds/maze.jpg';

  this.options = {};
  this.robotStart = {
    position: new BABYLON.Vector3(0, 0, 0)
  };
  this.arenaStart = null;

  this.optionsConfigurations = [
    {
      option: 'mazeType',
      title: i18n.get('#maze-mazeType#'),
      type: 'selectWithHTML',
      options: [
        [i18n.get('#maze-perfect#'), 'perfect'],
        [i18n.get('#maze-imperfect#'), 'imperfect']
      ],
      optionsHTML: {
        perfect:   i18n.get('#maze-perfectHTML#'),
        imperfect: i18n.get('#maze-imperfectHTML#'),
      }
    },
    {
      option: 'columns',
      title: i18n.get('#maze-columns#'),
      type: 'slider',
      min: '2',
      max: '20',
      step: '1'
    },
    {
      option: 'rows',
      title: i18n.get('#maze-rows#'),
      type: 'slider',
      min: '2',
      max: '20',
      step: '1'
    },
    {
      option: 'size',
      title: i18n.get('#maze-cellSize#'),
      type: 'slider',
      min: '20',
      max: '100',
      step: '1'
    },
    {
      option: 'wallHeight',
      title: i18n.get('#maze-wallHeight#'),
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'seed',
      title: i18n.get('#maze-seed#'),
      type: 'text',
      help: i18n.get('#maze-seedHelp#')
    }
  ];

  this.defaultOptions = {
    mazeType: 'perfect',
    columns: 8,
    rows: 8,
    size: 40,
    seed: null,
    wallHeight: 15,
    wallThickness: 2,
    groundFriction: 1,
    wallFriction: 0.1,
    groundRestitution: 0.0,
    wallRestitution: 0.1,
    wallRemovalLimit: 0.05,
    startPos: 'center',
    arenaStartPosXY: null,
    arenaStartRot: null
  };

  // Set options, including default
  this.setOptions = function(options) {
    Object.assign(self.options, self.defaultOptions);

    for (let name in options) {
      if (typeof self.options[name] == 'undefined') {
        console.log('Unrecognized option: ' + name);
      } else {
        self.options[name] = options[name];
      }
    }

    let xPos = (self.options.columns / 2 * self.options.size) - self.options.size / 2;
    let yPos = (self.options.rows / 2 * self.options.size) - self.options.size / 2;
    if (self.options.mazeType == 'perfect') {
      self.robotStart.position = new BABYLON.Vector3(-xPos, 0, -yPos);
    } else if (self.options.mazeType == 'imperfect') {
      self.robotStart.position = new BABYLON.Vector3(0, 0, 0);
    }

    self.arenaStart = [
      {
        position: new BABYLON.Vector3(-xPos, 0, yPos),
        rotation: new BABYLON.Vector3(0, Math.PI/2, 0)
      },
      {
        position: new BABYLON.Vector3(-xPos, 0, -yPos),
        rotation: new BABYLON.Vector3(0, 0, 0)
      },
      {
        position: new BABYLON.Vector3(xPos, 0, yPos),
        rotation: new BABYLON.Vector3(0, Math.PI, 0)
      },
      {
        position: new BABYLON.Vector3(xPos, 0, -yPos),
        rotation: new BABYLON.Vector3(0, -Math.PI/2, 0)
      },
    ];

    if (self.options.arenaStartPosXY instanceof Array) {
      for (let i=0; i < self.options.arenaStartPosXY.length; i++) {
        self.arenaStart[i].position = new BABYLON.Vector3(
          self.options.arenaStartPosXY[i][0],
          0,
          self.options.arenaStartPosXY[i][1]
        );
      }
    }

    if (self.options.arenaStartRot instanceof Array) {
      for (let i=0; i < self.options.arenaStartRot.length; i++) {
        self.arenaStart[i].rotation = new BABYLON.Vector3(
          0,
          self.options.arenaStartRot[i],
          0,
        );
      }
    }

    if (self.options.mazeType == 'imperfect') {
      if (self.options.columns % 2 == 0) self.options.columns++;
      if (self.options.rows % 2 == 0) self.options.rows++;
    }

    return new Promise(function(resolve, reject) {
      resolve();
    });
  };

  // Run on page load
  this.init = function() {
    self.setOptions();
  };

  // Create the scene
  this.load = function (scene) {
    self.setSeed(self.options.seed);
    let walls = self.buildMazeArray();

    if (self.options.mazeType == 'imperfect') {
      walls = self.removeRandomWalls(walls, self.options.wallRemovalLimit);
    }

    return new Promise(function(resolve, reject) {
      self.loadBaseMap(scene, walls.colWalls, walls.rowWalls);
      resolve();
    });
  };

  // Base map
  this.loadBaseMap = function(scene, colWalls, rowWalls) {
    var options = self.options;

    let length = options.columns * options.size;
    let width = options.rows * options.size;

    var groundMat = new BABYLON.StandardMaterial('ground', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    var boxOptions = {
        width: length,
        height: 10,
        depth: width
    };

    var ground = BABYLON.MeshBuilder.CreateBox('box', boxOptions, scene);
    ground.material = groundMat;
    ground.receiveShadows = true;
    ground.position.y = -5;

    // Colored target areas
    var color1 = new BABYLON.StandardMaterial('color1', scene);
    color1.diffuseColor = new BABYLON.Color3(0, 1, 0);
    color1.specularColor = new BABYLON.Color3(0, 0, 0);
    color1.alpha = 0.5;
    var color2 = new BABYLON.StandardMaterial('color2', scene);
    color2.diffuseColor = new BABYLON.Color3(1, 0, 0);
    color2.specularColor = new BABYLON.Color3(0, 0, 0);
    color2.alpha = 0.5;
    var color3 = new BABYLON.StandardMaterial('color3', scene);
    color3.diffuseColor = new BABYLON.Color3(0, 0, 1);
    color3.specularColor = new BABYLON.Color3(0, 0, 0);
    color3.alpha = 0.5;
    var color4 = new BABYLON.StandardMaterial('color4', scene);
    color4.diffuseColor = new BABYLON.Color3(1, 1, 0);
    color4.specularColor = new BABYLON.Color3(0, 0, 0);
    color4.alpha = 0.5;

    var targetBoxOptions = {
      width: options.size,
      height: 0.4,
      depth: options.size
    };
    var targetBox1 = BABYLON.MeshBuilder.CreateBox('targetBox', targetBoxOptions, scene);
    targetBox1.material = color1;
    targetBox1.isPickable = false;
    targetBox1.position.y = 0.2;
    targetBox1.position.x = -(length / 2) + options.size / 2;
    targetBox1.position.z = -(width / 2) + options.size / 2;

    var targetBox2 = BABYLON.MeshBuilder.CreateBox('targetBox', targetBoxOptions, scene);
    targetBox2.material = color2;
    targetBox2.isPickable = false;
    targetBox2.position.y = 0.2;
    targetBox2.position.x = (length / 2) - options.size / 2;
    targetBox2.position.z = (width / 2) - options.size / 2;

    var targetBox3 = BABYLON.MeshBuilder.CreateBox('targetBox', targetBoxOptions, scene);
    targetBox3.material = color3;
    targetBox3.isPickable = false;
    targetBox3.position.y = 0.2;
    targetBox3.position.x = -(length / 2) + options.size / 2;
    targetBox3.position.z = (width / 2) - options.size / 2;

    var targetBox4 = BABYLON.MeshBuilder.CreateBox('targetBox', targetBoxOptions, scene);
    targetBox4.material = color4;
    targetBox4.isPickable = false;
    targetBox4.position.y = 0.2;
    targetBox4.position.x = (length / 2) - options.size / 2;
    targetBox4.position.z = -(width / 2) + options.size / 2;

    // Outer walls
    var wallMat = new BABYLON.StandardMaterial('wallMat', scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
    wallMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    let wall1 = {
      height: options.wallHeight + 10,
      width: length + options.wallThickness * 2,
      depth: options.wallThickness
    }

    var wallTop = BABYLON.MeshBuilder.CreateBox('wallTop', wall1, scene);
    wallTop.position.y = wall1.height / 2 - 10;
    wallTop.position.z = (width + options.wallThickness) / 2;
    wallTop.material = wallMat;

    var wallBottom = BABYLON.MeshBuilder.CreateBox('wallBottom', wall1, scene);
    wallBottom.position.y = wall1.height / 2 - 10;
    wallBottom.position.z = -(width + options.wallThickness) / 2;
    wallBottom.material = wallMat;

    let wall2 = {
      height: options.wallHeight + 10,
      width: options.wallThickness,
      depth: width
    }

    var wallLeft = BABYLON.MeshBuilder.CreateBox('wallLeft', wall2, scene);
    wallLeft.position.y = wall1.height / 2 - 10;
    wallLeft.position.x = -(length + options.wallThickness) / 2;
    wallLeft.material = wallMat;

    var wallRight = BABYLON.MeshBuilder.CreateBox('wallRight', wall2, scene);
    wallRight.position.y = wall1.height / 2 - 10;
    wallRight.position.x = (length + options.wallThickness) / 2;
    wallRight.material = wallMat;


    // Physics
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      {
        mass: 0,
        friction: options.groundFriction,
        restitution: options.groundRestitution
      },
      scene
    );

    var wallOptions = {
      mass: 0,
      friction: options.wallFriction,
      restitution: options.wallRestitution
    };
    wallTop.physicsImpostor = new BABYLON.PhysicsImpostor(
      wallTop,
      BABYLON.PhysicsImpostor.BoxImpostor,
      wallOptions,
      scene
    );
    wallBottom.physicsImpostor = new BABYLON.PhysicsImpostor(
      wallBottom,
      BABYLON.PhysicsImpostor.BoxImpostor,
      wallOptions,
      scene
    );
    wallLeft.physicsImpostor = new BABYLON.PhysicsImpostor(
      wallLeft,
      BABYLON.PhysicsImpostor.BoxImpostor,
      wallOptions,
      scene
    );
    wallRight.physicsImpostor = new BABYLON.PhysicsImpostor(
      wallRight,
      BABYLON.PhysicsImpostor.BoxImpostor,
      wallOptions,
      scene
    );

    // Internal walls, start with walls between columns
    var internalWallMat = new BABYLON.StandardMaterial('internalWallMat', scene);
    internalWallMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    internalWallMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    let box1 = {
      height: options.wallHeight,
      width: options.wallThickness,
      depth: options.size
    }
    for (let r=0; r<options.rows; r++) {
      for (let c=0; c<options.columns-1; c++) {
        if (colWalls[r][c]) {
          var cWall = BABYLON.MeshBuilder.CreateBox('cWall', box1, scene);
          cWall.position.y = box1.height / 2;
          cWall.position.x = -(length / 2) + options.size * (c + 1);
          cWall.position.z = -(width / 2) + options.size * r + options.size / 2;
          cWall.material = internalWallMat;

          cWall.physicsImpostor = new BABYLON.PhysicsImpostor(
            cWall,
            BABYLON.PhysicsImpostor.BoxImpostor,
            wallOptions,
            scene
          );
        }
      }
    }

    // walls between rows
    let box2 = {
      height: options.wallHeight,
      width: options.size,
      depth: options.wallThickness
    }
    for (let r=0; r<options.rows-1; r++) {
      for (let c=0; c<options.columns; c++) {
        if (rowWalls[r][c]) {
          var rWall = BABYLON.MeshBuilder.CreateBox('cWall', box2, scene);
          rWall.position.y = box2.height / 2;
          rWall.position.x = -(length / 2) + options.size * c + options.size / 2;
          rWall.position.z = -(width / 2) + options.size * (r + 1);
          rWall.material = internalWallMat;

          rWall.physicsImpostor = new BABYLON.PhysicsImpostor(
            rWall,
            BABYLON.PhysicsImpostor.BoxImpostor,
            wallOptions,
            scene
          );
        }
      }
    }
  };

  // Remove random walls
  this.removeRandomWalls = function(walls, limit=0.05) {
    for (let i=0; i<walls.colWalls.length; i++) {
      if (self.mulberry32() < limit) {
        walls.colWalls[i] = false;
      }
    }
    for (let i=0; i<walls.rowWalls.length; i++) {
      if (self.mulberry32() < limit) {
        walls.rowWalls[i] = false;
      }
    }

    return walls;
  };

  // Set the random number seed
  this.setSeed = function(seed) {
    if (typeof seed == 'undefined' || seed == null) {
      self.seed = Date.now();
    } else {
      self.seed = parseFloat(seed);
    }
  };

  // Generate random number
  this.mulberry32 = function() {
    var t = self.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    let result = ((t ^ t >>> 14) >>> 0) / 4294967296;
    self.seed = result * 4294967296;
    return result;
  };

  // Build a maze array
  this.buildMazeArray = function() {
    var visited = new Array(self.options.rows).fill(0);
    visited = visited.map(() => new Array(self.options.columns).fill(false));

    // Walls between columns
    var colWalls = new Array(self.options.rows).fill(0);
    colWalls = colWalls.map(() => new Array(self.options.columns - 1).fill(true));

    // Walls between rows
    var rowWalls = new Array(self.options.rows - 1).fill(0);
    rowWalls = rowWalls.map(() => new Array(self.options.columns).fill(true));

    var stack = [];
    var current = { r: 0, c: 0 };
    var count = 1;
    visited[0][0] = true;

    function isVisited(dr, dc) {
      let r = current.r + dr;
      let c = current.c + dc;

      if (
        r < 0
        || r >= self.options.rows
        || c < 0
        || c >= self.options.columns
      ) {
        return true;
      } else {
        return visited[r][c];
      }
    }

    function randomNeighbour() {
      let unvisited = [];
      if (!isVisited(-1, 0)) {
        unvisited.push([-1, 0]);
      }
      if (!isVisited(1, 0)) {
        unvisited.push([1, 0]);
      }
      if (!isVisited(0, -1)) {
        unvisited.push([0, -1]);
      }
      if (!isVisited(0, 1)) {
        unvisited.push([0, 1]);
      }
      if (unvisited.length == 0) {
        return null;
      } else {
        let selected = unvisited[Math.floor(self.mulberry32() * unvisited.length)];
        return {
          r: current.r + selected[0],
          c: current.c + selected[1]
        }
      }
    }

    function removeWall(current, next) {
      if (current.r == next.r) {
        colWalls[current.r][Math.min(current.c, next.c)] = false;
      } else {
        rowWalls[Math.min(current.r, next.r)][current.c] = false;
      }
    }

    while (count < self.options.rows * self.options.columns) {
      let next = randomNeighbour();
      if (next == null) {
        current = stack.pop();
      } else {
        removeWall(current, next);
        visited[next.r][next.c] = true;
        count++;
        stack.push(current);
        current = next;
      }
    }

    return { colWalls: colWalls, rowWalls: rowWalls };
  };
}

// Init class
world_Maze.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Maze);