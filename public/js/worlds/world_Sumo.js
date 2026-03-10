i18n.append({
  '#sumo-shortDescription#': {
    en: 'Sumo Challenges',
    ko: '스모 도전',
  },
  '#sumo-longDescription#': {
    en: '<p>Push the opponents off the stage!</p>',
    ko: '<p>상대방을 무대 밖으로 밀어내세요!</p>',
  },
  '#sumo-selectChallenge#': {
    en: 'Select Challenge',
    ko: '도전 선택',
  },
  '#sumo-fixedDummies#': {
    en: 'Fixed Dummies',
    ko: '고정 더미',
  },
  '#sumo-randomDummies#': {
    en: 'Random Dummies',
    ko: '무작위 더미',
  },
  '#sumo-noBorder#': {
    en: 'No Border',
    ko: '경계 없음',
  },
  '#sumo-pillars#': {
    en: 'Pillars',
    ko: '기둥',
  },
  '#sumo-fixedDummiesHTML#': {
    en: '<p class="bold">Training world with dummies in fixed position.</p>' +
        '<p>The dummies are always in the same position. Push them off without falling off yourself.<p>',
    ko: '<p class="bold">더미가 고정된 위치에 있는 훈련 맵입니다.</p>' +
        '<p>더미는 항상 같은 위치에 있습니다. 자신은 떨어지지 않으면서 더미를 밀어내세요.<p>',
  },
  '#sumo-randomDummiesHTML#': {
    en: '<p class="bold">Training world with dummies in random position.</p>' +
        '<p>The dummies are randomly placed. Can your robot find them all?<p>',
    ko: '<p class="bold">더미가 무작위 위치에 있는 훈련 맵입니다.</p>' +
        '<p>더미는 무작위로 배치됩니다. 로봇이 모두 찾아낼 수 있을까요?<p>',
  },
  '#sumo-noBorderHTML#': {
    en: '<p class="bold">Borderless ring.</p>' +
        '<p>How to avoid falling off without a border?<p>',
    ko: '<p class="bold">경계가 없는 링입니다.</p>' +
        '<p>경계 없이 어떻게 떨어지지 않을 수 있을까요?<p>',
  },
  '#sumo-pillarsHTML#': {
    en: '<p class="bold">Ring with pillars.</p>' +
        '<p>This sumo ring has pillars?<p>',
    ko: '<p class="bold">기둥이 있는 링입니다.</p>' +
        '<p>이 스모 링에는 기둥이 있습니다!<p>',
  },
});

var world_Sumo = new function() {
  var self = this;

  this.name = 'sumo';
  this.shortDescription = i18n.get('#sumo-shortDescription#');
  this.longDescription = i18n.get('#sumo-longDescription#');
  this.thumbnail = 'images/worlds/sumo.jpg';

  this.options = {};
  this.robotStart = {
    position: new BABYLON.Vector3(0, 0, 0)
  };

  this.optionsConfigurations = [
    {
      option: 'image',
      title: i18n.get('#sumo-selectChallenge#'),
      type: 'selectWithHTML',
      options: [
        [i18n.get('#sumo-fixedDummies#'), 'fixedDummies'],
        [i18n.get('#sumo-randomDummies#'), 'randomDummies'],
        [i18n.get('#sumo-noBorder#'), 'randomNoRed'],
        [i18n.get('#sumo-pillars#'), 'fixedPillars'],
      ],
      optionsHTML: {
        fixedDummies:  i18n.get('#sumo-fixedDummiesHTML#'),
        randomDummies: i18n.get('#sumo-randomDummiesHTML#'),
        randomNoRed:   i18n.get('#sumo-noBorderHTML#'),
        fixedPillars:  i18n.get('#sumo-pillarsHTML#'),
      }
    }
  ];

  this.robotStarts = {
    fixedDummies: new BABYLON.Vector3(0, 0, 0),
    randomDummies: new BABYLON.Vector3(0, 0, 0),
    randomNoRed: new BABYLON.Vector3(0, 0, 0),
    fixedPillars: new BABYLON.Vector3(0, 0, 0),
  }

  this.defaultOptions = {
    image: 'fixedDummies',
    length: 100,
    width: 100,
    groundFriction: 1,
    wallFriction: 0.1,
    groundRestitution: 0.0,
    wallRestitution: 0.1
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

    self.robotStart.position = self.robotStarts[self.options.image];

    return new Promise(function(resolve, reject) {
      resolve();
    });
  };

  // Run on page load
  this.init = function() {
    self.setOptions();
  };

  // Load ground
  this.loadGround = function (scene, size, imageSrc) {
    var groundMat = new BABYLON.StandardMaterial('ground', scene);
    if (imageSrc) {
      var groundTexture = new BABYLON.Texture(imageSrc, scene);
      groundMat.diffuseTexture = groundTexture;
    }
    groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    var faceUV = new Array(3);
    for (var i = 0; i < 3; i++) {
      faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
    }
    faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1);

    var cylinderOptions = {
      height: 10,
      diameter: size,
      tessellation: 48,
      faceUV: faceUV
    };

    var ground = BABYLON.MeshBuilder.CreateCylinder('cylinder', cylinderOptions, scene);
    ground.material = groundMat;
    ground.receiveShadows = true;
    ground.position.y = -5;

    // Physics
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.CylinderImpostor,
      {
        mass: 0,
        friction: self.options.groundFriction,
        restitution: self.options.groundRestitution
      },
      scene
    );
  };

  // Create the scene
  this.load = function (scene) {
    return new Promise(function(resolve, reject) {
      var dummyTexture = new BABYLON.Texture('textures/maps/Sumo/Dummy Face.png', scene);
      self.dummyMat = new BABYLON.StandardMaterial('dummy', scene);
      self.dummyMat.diffuseTexture = dummyTexture;
      self.dummyMat.diffuseColor = new BABYLON.Color3(1, 1, 1);

      self.pillarMat = new BABYLON.StandardMaterial('pillar', scene);
      self.pillarMat.diffuseColor = new BABYLON.Color3(0.65, 0.33, 0);

      if (self.options.image == 'fixedDummies') {
        self.loadGround(scene, 200, 'textures/maps/Sumo/Red Circle.png');
        self.addDummy(scene, [0, 50], 0);
        self.addDummy(scene, [50, 0], Math.PI/2);
        self.addDummy(scene, [-50, 0], -Math.PI/2);
        self.addDummy(scene, [0, -50], Math.PI);
      } else if (self.options.image == 'randomDummies') {
        self.loadGround(scene, 200, 'textures/maps/Sumo/Red Circle.png');
        for (let i=0; i<6; i++) {
          let r = Math.random() * 30 + 40;
          let theta = Math.random() * Math.PI * 2;
          let x = r * Math.cos(theta);
          let y = r * Math.sin(theta);
          self.addDummy(scene, [x, y], Math.PI/2 - theta);
        }
      } else if (self.options.image == 'randomNoRed') {
        self.loadGround(scene, 200);
        for (let i=0; i<6; i++) {
          let r = Math.random() * 30 + 40;
          let theta = Math.random() * Math.PI * 2;
          let x = r * Math.cos(theta);
          let y = r * Math.sin(theta);
          self.addDummy(scene, [x, y], Math.PI/2 - theta);
        }
      } else if (self.options.image == 'fixedPillars') {
        self.loadGround(scene, 200, 'textures/maps/Sumo/Red Circle.png');
        self.addPillar(scene, [40,40]);
        self.addPillar(scene, [-40,40]);
        self.addPillar(scene, [40,-40]);
        self.addPillar(scene, [-40,-40]);
        for (let i=0; i<6; i++) {
          let r = Math.random() * 30 + 40;
          let theta = Math.random() * Math.PI * 2;
          let x = r * Math.cos(theta);
          let y = r * Math.sin(theta);
          self.addDummy(scene, [x, y], Math.PI/2 - theta);
        }
      } else {
        self.loadGround(scene, 200, 'textures/maps/Sumo/Red Circle.png');
      }
      resolve();
    });
  };

  // Add pillar
  this.addPillar = function(scene, pos, rot=0) {
    self.addBox(scene, [25, 10, 10], pos, rot, 0, self.pillarMat, 0.1);
  };

  // Add dummy
  this.addDummy = function(scene, pos, rot, mass=400) {
    self.addBox(scene, [10, 15, 15], pos, rot, mass, self.dummyMat, 0.3);
  };

  // Add static box
  this.addBox = function(scene, size, pos, rot, mass, mat, friction=0.1, restitution=0.1) {
    var faceUV = new Array(6);
    for (var i = 0; i < 6; i++) {
        faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
    }
    faceUV[1] = new BABYLON.Vector4(0, 0, 1, 1);
    var boxOptions = {
      height: size[0],
      width: size[1],
      depth: size[2],
      faceUV: faceUV
    };

    var box = BABYLON.MeshBuilder.CreateBox('obstacle', boxOptions, scene);
    box.material = mat;
    box.position.y = size[0] / 2;
    box.position.x = pos[0];
    box.position.z = pos[1];
    box.rotation.y = rot;

    box.physicsImpostor = new BABYLON.PhysicsImpostor(
      box,
      BABYLON.PhysicsImpostor.BoxImpostor,
      {
        mass: mass,
        friction: friction,
        restitution: restitution
      },
      scene
    );
  };
}

// Init class
world_Sumo.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Sumo);