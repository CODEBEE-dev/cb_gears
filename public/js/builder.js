var builder = new function() {
  var self = this;

  this.worldOptions = JSON.parse(JSON.stringify(worlds[0].defaultOptions));

  this.groundTemplate = {
    optionsConfigurations: [
      {
        option: 'imageURL',
        label: '#builder-label-imageURL#',
        type: 'selectImage',
        reset: true
      },
      {
        option: 'imageURL',
        label: '#builder-label-imageURL#',
        type: 'strText',
        reset: true,
        help: '#builder-help-ground_image_url#'
      },
      {
        option: 'groundType',
        label: '#builder-label-groundType#',
        type: 'select',
        options: [
          ['#builder-opt-box#', 'box'],
          ['#builder-opt-cylinder#', 'cylinder'],
          ['#builder-opt-none#', 'none']
        ],
        reset: true,
        help: '#builder-help-ground_type#'
      },
      {
        option: 'imageScale',
        label: '#builder-label-imageScale#',
        type: 'slider',
        min: '0.1',
        max: '10',
        step: '0.1',
        reset: true,
        help: '#builder-help-image_scale#'
      },
      {
        option: 'uScale',
        label: '#builder-label-uScale#',
        type: 'slider',
        min: '0.1',
        max: '10',
        step: '0.1',
        reset: true,
        help: '#builder-help-u_scale#'
      },
      {
        option: 'vScale',
        label: '#builder-label-vScale#',
        type: 'slider',
        min: '0.1',
        max: '10',
        step: '0.1',
        reset: true,
        help: '#builder-help-v_scale#'
      },
      {
        option: 'groundFriction',
        label: '#builder-label-groundFriction#',
        type: 'slider',
        min: '0',
        max: '10',
        step: '0.1',
      },
      {
        option: 'groundRestitution',
        label: '#builder-label-groundRestitution#',
        type: 'slider',
        min: '0',
        max: '10',
        step: '0.1',
        help: '#builder-help-ground_restitution#'
      },
    ]
  };

  this.wallTemplate = {
    optionsConfigurations: [
      {
        option: 'wall',
        label: '#builder-label-wall#',
        type: 'boolean',
        reset: true
      },
      {
        option: 'wallHeight',
        label: '#builder-label-wallHeight#',
        type: 'slider',
        min: '0.1',
        max: '30',
        step: '0.1',
        reset: true
      },
      {
        option: 'wallThickness',
        label: '#builder-label-wallThickness#',
        type: 'slider',
        min: '0.1',
        max: '30',
        step: '0.1',
        reset: true
      },
      {
        option: 'wallColor',
        label: '#builder-label-wallColor#',
        type: 'color',
        help: '#builder-help-wall_color#',
        reset: true
      },
      {
        option: 'wallFriction',
        label: '#builder-label-wallFriction#',
        type: 'slider',
        min: '0',
        max: '10',
        step: '0.1',
      },
      {
        option: 'wallRestitution',
        label: '#builder-label-wallRestitution#',
        type: 'slider',
        min: '0',
        max: '10',
        step: '0.1',
        help: '#builder-help-wall_restitution#'
      },
    ]
  };

  this.timerTemplate = {
    optionsConfigurations: [
      {
        option: 'timer',
        label: '#builder-label-timer#',
        type: 'select',
        options: [
          ['#builder-opt-none#', 'none'],
          ['#builder-opt-count_up#', 'up'],
          ['#builder-opt-count_down#', 'down']
        ],
        reset: true,
      },
      {
        option: 'timerDuration',
        label: '#builder-label-timerDuration#',
        type: 'slider',
        min: '1',
        max: '300',
        step: '1',
        reset: true,
      },
      {
        option: 'timerEnd',
        label: '#builder-label-timerEnd#',
        type: 'select',
        options: [
          ['#builder-opt-continue#', 'continue'],
          ['#builder-opt-stop_timer#', 'stopTimer'],
          ['#builder-opt-stop_robot#', 'stopRobot']
        ],
      },
    ]
  };

  this.robotTemplate = {
    optionsConfigurations: [
      {
        option: 'startPosXYZ',
        label: '#builder-label-startPosXYZ#',
        type: 'vectors',
        min: '-200',
        max: '200',
        step: '1',
        reset: true
      },
      {
        option: 'startRot',
        label: '#builder-label-startRot#',
        type: 'slider',
        min: '-180',
        max: '180',
        step: '5',
        reset: true,
      },
    ]
  };

  this.animationTemplate = {
    optionsConfigurations: [
      {
        option: 'restartAnimationOnRun',
        label: '#builder-label-restartAnimationOnRun#',
        type: 'boolean',
      },
    ]
  };


  this.boxTemplate = {
    optionsConfigurations: [
      {
        type: 'buttons',
        buttons: [
          {
            label: '#builder-drop_to_ground#',
            callback: 'moveToGround'
          }
        ]
      },
      {
        option: 'position',
        label: '#builder-label-position#',
        type: 'vectors',
        min: '-100',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'rotation',
        label: '#builder-label-rotation#',
        type: 'vectors',
        min: '-180',
        max: '180',
        step: '5',
        reset: true
      },
      {
        option: 'animationMode',
        label: '#builder-label-animationMode#',
        type: 'select',
        options: [
          ['#builder-opt-none#', 'none'],
          ['#builder-opt-loop#', 'loop'],
          ['#builder-opt-alternate#', 'alternate'],
        ],
        reset: true,
        help: '#builder-help-animation_mode#'
      },
      {
        option: 'animationKeys',
        label: '#builder-label-animationKeys#',
        type: 'custom',
        generatorFunction: 'setAnimationKeys',
        help: '#builder-help-animation_keys#'
      },
      {
        option: 'size',
        label: '#builder-label-size#',
        type: 'vectors',
        min: '1',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'color',
        label: '#builder-label-color#',
        type: 'color',
        help: '#builder-help-color#',
        reset: true
      },
      {
        option: 'imageType',
        label: '#builder-label-imageType#',
        type: 'select',
        options: [
          ['#builder-opt-none#', 'none'],
          ['#builder-opt-repeat#', 'repeat'],
          ['#builder-opt-top#', 'top'],
          ['#builder-opt-front#', 'front'],
          ['#builder-opt-all#', 'all']
        ],
        reset: true
      },
      {
        option: 'imageURL',
        type: 'selectImage',
        reset: true
      },
      {
        option: 'imageURL',
        type: 'strText',
        reset: true,
        help: '#builder-image_url_help#'
      },
      {
        option: 'physicsOptions',
        label: '#builder-label-physicsOptions#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        options: [
          ['#builder-opt-fixed#', 'fixed'],
          ['#builder-opt-moveable#', 'moveable'],
          ['#builder-opt-physicsless#', 'false'],
          ['#builder-opt-custom#', 'custom']
        ],
        reset: true
      },
      {
        option: 'physics_mass',
        label: '#builder-label-physics_mass#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mass#'
      },
      {
        option: 'physics_friction',
        label: '#builder-label-physics_friction#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_friction#'
      },
      {
        option: 'physics_restitution',
        label: '#builder-label-physics_restitution#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_restitution#'
      },
      {
        option: 'physics_dampLinear',
        label: '#builder-label-physics_dampLinear#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_linear#'
      },
      {
        option: 'physics_dampAngular',
        label: '#builder-label-physics_dampAngular#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_angular#'
      },
      {
        option: 'physics_group',
        label: '#builder-label-physics_group#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_group#'
      },
      {
        option: 'physics_mask',
        label: '#builder-label-physics_mask#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mask#'
      },
      {
        option: 'magnetic',
        label: '#builder-label-magnetic#',
        type: 'boolean',
      },
      {
        option: 'laserDetection',
        label: '#builder-label-laserDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'ultrasonicDetection',
        label: '#builder-label-ultrasonicDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'receiveShadows',
        label: '#builder-label-receiveShadows#',
        type: 'boolean',
        reset: true
      },
      {
        option: 'castShadows',
        label: '#builder-label-castShadows#',
        type: 'boolean',
        reset: true
      },
    ]
  };

  this.cylinderTemplate = {
    optionsConfigurations: [
      {
        type: 'buttons',
        buttons: [
          {
            label: '#builder-drop_to_ground#',
            callback: 'moveToGround'
          }
        ]
      },
      {
        option: 'position',
        label: '#builder-label-position#',
        type: 'vectors',
        min: '-100',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'rotation',
        label: '#builder-label-rotation#',
        type: 'vectors',
        min: '-180',
        max: '180',
        step: '5',
        reset: true
      },
      {
        option: 'animationMode',
        label: '#builder-label-animationMode#',
        type: 'select',
        options: [
          ['#builder-opt-none#', 'none'],
          ['#builder-opt-loop#', 'loop'],
          ['#builder-opt-alternate#', 'alternate'],
        ],
        reset: true,
        help: '#builder-help-animation_mode#'
      },
      {
        option: 'animationKeys',
        label: '#builder-label-animationKeys#',
        type: 'custom',
        generatorFunction: 'setAnimationKeys',
        help: '#builder-help-animation_keys#'
      },
      {
        option: 'size',
        label: '#builder-label-size#',
        type: 'vectors',
        min: '1',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'color',
        label: '#builder-label-color#',
        type: 'color',
        help: '#builder-help-color#',
        reset: true
      },
      {
        option: 'imageURL',
        type: 'selectImage',
        reset: true
      },
      {
        option: 'imageURL',
        type: 'strText',
        reset: true,
        help: '#builder-image_url_help#'
      },
      {
        option: 'physicsOptions',
        label: '#builder-label-physicsOptions#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        options: [
          ['#builder-opt-fixed#', 'fixed'],
          ['#builder-opt-moveable#', 'moveable'],
          ['#builder-opt-physicsless#', 'false'],
          ['#builder-opt-custom#', 'custom']
        ],
        reset: true
      },
      {
        option: 'physics_mass',
        label: '#builder-label-physics_mass#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mass#'
      },
      {
        option: 'physics_friction',
        label: '#builder-label-physics_friction#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_friction#'
      },
      {
        option: 'physics_restitution',
        label: '#builder-label-physics_restitution#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_restitution#'
      },
      {
        option: 'physics_dampLinear',
        label: '#builder-label-physics_dampLinear#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_linear#'
      },
      {
        option: 'physics_dampAngular',
        label: '#builder-label-physics_dampAngular#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_angular#'
      },
      {
        option: 'physics_group',
        label: '#builder-label-physics_group#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_group#'
      },
      {
        option: 'physics_mask',
        label: '#builder-label-physics_mask#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mask#'
      },
      {
        option: 'magnetic',
        label: '#builder-label-magnetic#',
        type: 'boolean',
      },
      {
        option: 'laserDetection',
        label: '#builder-label-laserDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'ultrasonicDetection',
        label: '#builder-label-ultrasonicDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'receiveShadows',
        label: '#builder-label-receiveShadows#',
        type: 'boolean',
        reset: true
      },
      {
        option: 'castShadows',
        label: '#builder-label-castShadows#',
        type: 'boolean',
        reset: true
      },
    ]
  };

  this.sphereTemplate = {
    optionsConfigurations: [
      {
        type: 'buttons',
        buttons: [
          {
            label: '#builder-drop_to_ground#',
            callback: 'moveToGround'
          }
        ]
      },
      {
        option: 'position',
        label: '#builder-label-position#',
        type: 'vectors',
        min: '-100',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'rotation',
        label: '#builder-label-rotation#',
        type: 'vectors',
        min: '-180',
        max: '180',
        step: '5',
        reset: true
      },
      {
        option: 'animationMode',
        label: '#builder-label-animationMode#',
        type: 'select',
        options: [
          ['#builder-opt-none#', 'none'],
          ['#builder-opt-loop#', 'loop'],
          ['#builder-opt-alternate#', 'alternate'],
        ],
        reset: true,
        help: '#builder-help-animation_mode#'
      },
      {
        option: 'animationKeys',
        label: '#builder-label-animationKeys#',
        type: 'custom',
        generatorFunction: 'setAnimationKeys',
        help: '#builder-help-animation_keys#'
      },
      {
        option: 'size',
        label: '#builder-label-size#',
        type: 'vectors',
        min: '1',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'color',
        label: '#builder-label-color#',
        type: 'color',
        help: '#builder-help-color#',
        reset: true
      },
      {
        option: 'imageURL',
        type: 'selectImage',
        reset: true
      },
      {
        option: 'imageURL',
        type: 'strText',
        reset: true,
        help: '#builder-image_url_help#'
      },
      {
        option: 'physicsOptions',
        label: '#builder-label-physicsOptions#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        options: [
          ['#builder-opt-fixed#', 'fixed'],
          ['#builder-opt-moveable#', 'moveable'],
          ['#builder-opt-physicsless#', 'false'],
          ['#builder-opt-custom#', 'custom']
        ],
        reset: true
      },
      {
        option: 'physics_mass',
        label: '#builder-label-physics_mass#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mass#'
      },
      {
        option: 'physics_friction',
        label: '#builder-label-physics_friction#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_friction#'
      },
      {
        option: 'physics_restitution',
        label: '#builder-label-physics_restitution#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_restitution#'
      },
      {
        option: 'physics_dampLinear',
        label: '#builder-label-physics_dampLinear#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_linear#'
      },
      {
        option: 'physics_dampAngular',
        label: '#builder-label-physics_dampAngular#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_angular#'
      },
      {
        option: 'physics_group',
        label: '#builder-label-physics_group#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_group#'
      },
      {
        option: 'physics_mask',
        label: '#builder-label-physics_mask#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mask#'
      },
      {
        option: 'magnetic',
        label: '#builder-label-magnetic#',
        type: 'boolean',
      },
      {
        option: 'laserDetection',
        label: '#builder-label-laserDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'ultrasonicDetection',
        label: '#builder-label-ultrasonicDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'receiveShadows',
        label: '#builder-label-receiveShadows#',
        type: 'boolean',
        reset: true
      },
      {
        option: 'castShadows',
        label: '#builder-label-castShadows#',
        type: 'boolean',
        reset: true
      },
    ]
  };

  this.modelTemplate = {
    optionsConfigurations: [
      {
        type: 'buttons',
        buttons: [
          {
            label: '#builder-drop_to_ground#',
            callback: 'moveToGround'
          }
        ]
      },
      {
        option: 'position',
        label: '#builder-label-position#',
        type: 'vectors',
        min: '-100',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'rotation',
        label: '#builder-label-rotation#',
        type: 'vectors',
        min: '-180',
        max: '180',
        step: '5',
        reset: true
      },
      {
        option: 'animationMode',
        label: '#builder-label-animationMode#',
        type: 'select',
        options: [
          ['#builder-opt-none#', 'none'],
          ['#builder-opt-loop#', 'loop'],
          ['#builder-opt-alternate#', 'alternate'],
        ],
        reset: true,
        help: '#builder-help-animation_mode#'
      },
      {
        option: 'animationKeys',
        label: '#builder-label-animationKeys#',
        type: 'custom',
        generatorFunction: 'setAnimationKeys',
        help: '#builder-help-animation_keys#'
      },
      {
        option: 'modelURL',
        label: '#builder-label-modelURL#',
        type: 'selectModel',
        reset: true
      },
      {
        option: 'modelURL',
        label: '#builder-label-modelURL#',
        type: 'strText',
        reset: true,
        help: '#builder-help-model_url#'
      },
      {
        option: 'modelScale',
        label: '#builder-label-modelScale#',
        type: 'slider',
        min: '5',
        max: '200',
        step: '5',
        reset: true
      },
      {
        type: 'custom',
        option: 'modelAnimation',
        label: '#builder-label-modelAnimation#',
        generatorFunction: 'selectAnimation'
      },
      {
        option: 'physicsOptions',
        label: '#builder-label-physicsOptions#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        options: [
          ['#builder-opt-fixed#', 'fixed'],
          ['#builder-opt-moveable#', 'moveable'],
          ['#builder-opt-physicsless#', 'false'],
          ['#builder-opt-custom#', 'custom']
        ],
        reset: true
      },
      {
        option: 'physics_mass',
        label: '#builder-label-physics_mass#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mass#'
      },
      {
        option: 'physics_friction',
        label: '#builder-label-physics_friction#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_friction#'
      },
      {
        option: 'physics_restitution',
        label: '#builder-label-physics_restitution#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_restitution#'
      },
      {
        option: 'physics_dampLinear',
        label: '#builder-label-physics_dampLinear#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_linear#'
      },
      {
        option: 'physics_dampAngular',
        label: '#builder-label-physics_dampAngular#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_damp_angular#'
      },
      {
        option: 'physics_group',
        label: '#builder-label-physics_group#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_group#'
      },
      {
        option: 'physics_mask',
        label: '#builder-label-physics_mask#',
        type: 'custom',
        generatorFunction: 'setPhysicsOptions',
        help: '#builder-help-physics_mask#'
      },
      {
        option: 'magnetic',
        label: '#builder-label-magnetic#',
        type: 'boolean',
      },
      {
        option: 'laserDetection',
        label: '#builder-label-laserDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'ultrasonicDetection',
        label: '#builder-label-ultrasonicDetection#',
        type: 'select',
        options: [
          ['#builder-opt-default#', null],
          ['#builder-opt-invisible#', 'invisible'],
          ['#builder-opt-absorb#', 'absorb'],
          ['#builder-opt-normal#', 'normal']
        ],
        help: '#builder-help-laser_detection#'
      },
      {
        option: 'receiveShadows',
        label: '#builder-label-receiveShadows#',
        type: 'boolean',
        reset: true
      },
      {
        option: 'castShadows',
        label: '#builder-label-castShadows#',
        type: 'boolean',
        reset: true
      },
    ]
  };

  this.hingeTemplate = {
    optionsConfigurations: [
      {
        option: 'position',
        label: '#builder-label-position#',
        type: 'vectors',
        min: '-100',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'rotation',
        label: '#builder-label-rotation#',
        type: 'vectors',
        min: '-180',
        max: '180',
        step: '5',
        reset: true
      },
      {
        option: 'size',
        label: '#builder-label-size#',
        type: 'vectors',
        min: '1',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'hide',
        label: '#builder-label-hide#',
        type: 'boolean',
        help: '#builder-help-hinge_hide#',
        reset: true
      },
      {
        option: 'speed',
        label: '#builder-label-speed#',
        type: 'floatText',
        help: '#builder-help-hinge_speed#'
      },
      {
        option: 'maxForce',
        label: '#builder-label-maxForce#',
        type: 'floatText',
        help: '#builder-help-hinge_maxforce#'
      },
      {
        option: 'attachID',
        label: '#builder-label-attachID#',
        type: 'strText',
        help: '#builder-help-hinge_attachid#'
      }
    ]
  };

  this.ballJointTemplate = {
    optionsConfigurations: [
      {
        option: 'position',
        label: '#builder-label-position#',
        type: 'vectors',
        min: '-100',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'rotation',
        label: '#builder-label-rotation#',
        type: 'vectors',
        min: '-180',
        max: '180',
        step: '5',
        reset: true
      },
      {
        option: 'size',
        type: 'slider',
        min: '1',
        max: '100',
        step: '1',
        reset: true
      },
      {
        option: 'hide',
        label: '#builder-label-hide#',
        type: 'boolean',
        help: '#builder-help-balljoint_hide#',
        reset: true
      },
      {
        option: 'attachID',
        label: '#builder-label-attachID#',
        type: 'strText',
        help: '#builder-help-hinge_attachid#'
      }
    ]
  };

  this.objectDefault = {
    ...world_Custom.objectDefault,
    position: [0,0,20],
  };

  this.boxDefault = {
    ...this.objectDefault,
    type: 'box',
    imageType: 'repeat',
  };

  this.cylinderDefault = {
    ...this.objectDefault,
    type: 'cylinder',
    imageType: 'cylinder',
  };

  this.sphereDefault = {
    ...this.objectDefault,
    type: 'sphere',
    imageType: 'sphere',
  };

  this.modelDefault = {
    ...this.objectDefault,
    type: 'model',
    imageType: 'sphere',
  };

  this.compoundDefault = {
    type: 'compound',
    objects: []
  };

  this.hingeDefault = {
    type: 'hinge',
    objects: [],
    position: [0,0,20],
    rotation: [0,0,0],
    size: [10,2,0],
    hide: true,
    speed: 0,
    maxForce: 0,
  };

  this.ballJointDefault = {
    type: 'ballJoint',
    objects: [],
    position: [0,0,20],
    rotation: [0,0,0],
    size: 2,
    hide: true,
  };

  // Run on page load
  this.init = function() {
    if (typeof babylon.scene == 'undefined') {
      setTimeout(self.init, 500);
      return;
    }

    self.$navs = $('nav li');
    self.$panelControls = $('.panelControlsArea .panelControls');
    self.$panels = $('.panels .panel');
    self.$fileMenu = $('.fileMenu');
    self.$worldMenu = $('.worldMenu');
    self.$snapMenu = $('.snapMenu');
    self.$worldName = $('#worldName');
    self._dbWorldId = null;
    self._dbWorldName = null;

    self.$addObject = $('.addObject');
    self.$cloneObject = $('.cloneObject');
    self.$deleteObject = $('.deleteObject');
    self.$objectsList = $('.objectsList');
    self.$settingsArea = $('.settingsArea');
    self.$objectID = $('.objectID');
    self.$undo = $('.undo');

    self.$navs.click(self.tabClicked);
    self.$fileMenu.click(self.toggleFileMenu);
    self.$worldMenu.click(self.toggleWorldMenu);
    self.$snapMenu.click(self.toggleSnapMenu);

    self.$addObject.click(self.addObject);
    self.$cloneObject.click(self.cloneObject);
    self.$deleteObject.click(self.deleteObject);
    self.$undo.click(self.undo);

    babylon.scene.physicsEnabled = false;
    babylon.setCameraMode('arc');
    babylon.renders.push(self.render);

    self.setupDrag();

    babylon.world.animate = false;
    babylon.world.overrideHide = true;

    self.saveHistory();
    self.resetScene();
    self.updateTextLanguage();
  };

  // Update text language
  this.updateTextLanguage = function() {
    self.$fileMenu.find('.activity-label').text(i18n.get('#main-file#'));
    self.$fileMenu.attr('data-tooltip', i18n.get('#main-file#'));
    self.$worldMenu.find('.activity-label').text(i18n.get('#sim-world#'));
    self.$worldMenu.attr('data-tooltip', i18n.get('#sim-world#'));
    self.$snapMenu.find('.activity-label').text(i18n.get('#builder-snap_label#'));
    self.$snapMenu.attr('data-tooltip', i18n.get('#builder-snap_label#'));
    self.$addObject.text(i18n.get('#builder-add#'));
    self.$cloneObject.text(i18n.get('#builder-clone#'));
    self.$deleteObject.text(i18n.get('#builder-delete#'));
    self.$undo.text(i18n.get('#builder-undo#'));
  };

  // Setup drag
  this.setupDrag = function() {
    let dragBody;
    let dragBodyPos;
    let selected;

    function notClose(a, b) {
      if (Math.abs(a - b) > 0.01) {
        return true;
      }
      return false;
    }

    // Object drag start
    function dragStart(event) {
      dragBody = self.pointerDragBehavior.attachedNode;
      dragBodyPos = dragBody.position.clone();
      selected = self.$objectsList.find('li.selected');

      dragPointStart = event.dragPlanePoint;
      dragBody.computeWorldMatrix(true);
      dragOrigPos = dragBody.absolutePosition.clone();
    }

    // Object drag
    function drag(event) {
      let delta = event.delta;

      if (dragBody.parent) {
        let matrix = dragBody.parent.getWorldMatrix().clone().invert();
        matrix.setTranslation(BABYLON.Vector3.Zero());
        delta = BABYLON.Vector3.TransformCoordinates(delta, matrix);
      }
      dragBodyPos.addInPlace(delta);

      if (notClose(selected[0].object.position[0], dragBodyPos.x)) {
        dragBody.position.x = self.roundToSnap(dragBodyPos.x, self.snapStep[0]);
      }
      if (notClose(selected[0].object.position[1], dragBodyPos.y)) {
        dragBody.position.y = self.roundToSnap(dragBodyPos.y, self.snapStep[2]);
      }
      if (notClose(selected[0].object.position[2], dragBodyPos.z)) {
        dragBody.position.z = self.roundToSnap(dragBodyPos.z, self.snapStep[1]);
      }
    }

    // Object drag end
    function dragEnd(event) {
      if (typeof selected[0].object != 'undefined') {
        self.saveHistory();
        let node = self.pointerDragBehavior.attachedNode;
        let pos = node.position.clone();

        if (typeof node.pseudoParent != 'undefined') {
          let matrix = node.pseudoParent.getWorldMatrix().clone().invert();
          pos = BABYLON.Vector3.TransformCoordinates(pos, matrix);
        }

        if (notClose(selected[0].object.position[0], pos.x)) {
          selected[0].object.position[0] = self.roundToSnap(pos.x, self.snapStep[0]);
        }
        if (notClose(selected[0].object.position[1], pos.z)) {
          selected[0].object.position[1] = self.roundToSnap(pos.z, self.snapStep[1]);
        }
        if (notClose(selected[0].object.position[2], pos.y)) {
          selected[0].object.position[2] = self.roundToSnap(pos.y, self.snapStep[2]);
        }
        self.resetScene(false);
      }
    };

    self.pointerDragPlaneNormal = new BABYLON.Vector3(0,1,0);
    self.pointerDragBehavior = new BABYLON.PointerDragBehavior({dragPlaneNormal: this.pointerDragPlaneNormal});
    self.pointerDragBehavior.useObjectOrientationForDragging = false;
    self.pointerDragBehavior.moveAttached = false;

    self.pointerDragBehavior.onDragStartObservable.add(dragStart);
    self.pointerDragBehavior.onDragObservable.add(drag);
    self.pointerDragBehavior.onDragEndObservable.add(dragEnd);
  }

  // Runs every frame
  this.render = function(delta) {
    let camera = babylon.scene.activeCamera;
    let dir = camera.getTarget().subtract(camera.position);
    let x2 = dir.x ** 2;
    let y2 = dir.y ** 2;
    let z2 = dir.z ** 2;
    let max = Math.max(x2, y2, z2);

    self.pointerDragPlaneNormal.x = 0;
    self.pointerDragPlaneNormal.y = 0;
    self.pointerDragPlaneNormal.z = 0;
    if (x2 == max) {
      self.pointerDragPlaneNormal.x = 1;
    } else if (y2 == max) {
      self.pointerDragPlaneNormal.y = 1;
    } else {
      self.pointerDragPlaneNormal.z = 1;
    }
  }

  // Select animation from model
  this.selectAnimation = function(opt, objectOptions, $div) {
    let currentVal = objectOptions.modelAnimation;

    let selected = self.$objectsList.find('li.selected');
    let id = 'worldBaseObject_' + selected[0].name + selected[0].objectIndex;
    let mesh = babylon.scene.getMeshByID(id);

    if (typeof $div == 'undefined') {
      $div = $('<div>' + i18n.get('#builder-loading_model#') + '</div>');
    }

    if (mesh == null) {
      // model not loaded yet
      setTimeout(function(){
        self.selectAnimation(opt, objectOptions, $div);
      }, 200);
    } else {
      if (mesh.animations.length > 0) {
        let $select = $('<select></select>');
        let $opt = $('<option>None</option>');
        $select.append($opt);

        mesh.animations.forEach(function(animation){
          $opt = $('<option></option>');
          $opt.text(animation);
          $select.append($opt);
        });

        if (mesh.animations.indexOf(currentVal) == -1) {
          currentVal = 'None';
          objectOptions.modelAnimation = 'None';
        }

        if (currentVal) {
          $select.val(currentVal);
        }

        $select.change(function(){
          self.saveHistory();
          objectOptions.modelAnimation = $select.val();
          self.resetScene(false);
        });

        $div.text('');
        $div.append($select);

      } else {
        objectOptions.modelAnimation = 'None';
        $div.text('');
        $div.append($('<div>' + i18n.get('#builder-no_animations#') + '</div>'));
      }
    }

    return $div;
  };

  // Set custom physics options
  this.setPhysicsOptions = function(opt, objectOptions) {
    function genSelect (opt, currentVal, setter) {
      let $div = $('<div class="configuration"></div>');
      let $select = $('<select></select>');

      opt.options.forEach(function(option){
        let $opt = $('<option></option>');
        $opt.prop('value', option[1]);
        $opt.text(i18n.get(option[0]));
        if (option[1] == currentVal) {
          $opt.attr('selected', true);
        }

        $select.append($opt);
      });

      $select.change(function(){
        self.saveHistory();
        setter($select.val());
        if (opt.reset) {
          self.resetScene(false);
        }
      });

      $div.append($select);
      return $div;
    }

    function genFloatText(opt, currentVal, setter) {
      let $div = $('<div class="configuration"></div>');
      let $textBox = $('<div class="text"><input type="text"></div>');
      let $input = $textBox.find('input');

      $input.val(currentVal);

      $input.change(function(){
        let trimmed = $input.val().trim();
        if (trimmed == '') {
          self.saveHistory();
          setter('');
          if (opt.reset) {
            self.resetScene(false);
          }
          return;
        }

        let val = parseFloat(trimmed);
        if (isNaN(val)) {
          toastMsg(i18n.get('#builder-not_valid_number#'));
        } else {
          self.saveHistory();
          setter(val);
          if (opt.reset) {
            self.resetScene(false);
          }
        }
      });

      $div.append($textBox);
      return $div;
    }

    if (opt.option == 'physicsOptions') {
      let currentVal = objectOptions[opt.option];
      if (typeof objectOptions.physicsOptions == 'object') {
        currentVal = 'custom';
      }
      return genSelect(opt, currentVal, function(val){
        if (val == 'custom') {
          objectOptions[opt.option] = {};
        } else {
          objectOptions[opt.option] = val;
        }
      });
    } else {
      if (typeof objectOptions.physicsOptions != 'object') {
        return false;
      }

      let option = opt.option.replace('physics_', '');
      return genFloatText(opt, objectOptions.physicsOptions[option], function(val){
        if (val == '') {
          delete objectOptions.physicsOptions[option];
        } else {
          objectOptions.physicsOptions[option] = val;
        }
      });
    }
  };


  // Set custom animation keys options
  this.setAnimationKeys = function(opt, objectOptions) {
    if (objectOptions.animationMode == 'none') {
      return '';
    }

    if (typeof objectOptions.animationKeys == 'undefined') {
      objectOptions.animationKeys = [];
    }

    let $div = $('<div class="configuration"></div>');
    let $buttonsBox = $('<div class="buttons"></div>');
    let $keyCount = $('<span></span>');
    $keyCount.text(objectOptions.animationKeys.length);
    let $keyTime = $('<input type="number"></input>');
    let maxTime = 0;
    objectOptions.animationKeys.forEach(animationKey => maxTime = Math.max(animationKey.time, maxTime));
    $keyTime.val(maxTime);

    function edit() {
      let $body = $('<div class="editAnimationKeys"></div>');
      let $table = $(
        '<table class="animationKeys">' +
          '<thead>' +
            '<tr>' +
              '<th>Time</th>' +
              '<th colspan="3">Position</th>' +
              '<th colspan="3">Rotation</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody></tbody>' +
        '</table>'
      );
      let $tbody = $table.find('tbody');

      objectOptions.animationKeys.forEach(function(animationKey){
        function round(input) {
          return Math.round(input*100) / 100;
        }
        let $row = $('<tr></tr>');
        $row[0].animationKey = animationKey;
        let $time = $('<input type="number"></input>').val(animationKey.time);
        $row.append($('<td></td>').append($time));
        $row.append($('<td></td>').text(round(animationKey.position[0])));
        $row.append($('<td></td>').text(round(animationKey.position[1])));
        $row.append($('<td></td>').text(round(animationKey.position[2])));
        $row.append($('<td></td>').text(round(animationKey.rotation[0])));
        $row.append($('<td></td>').text(round(animationKey.rotation[1])));
        $row.append($('<td></td>').text(round(animationKey.rotation[2])));
        let $delete = $('<button class="delete">Delete</button>')
        $row.append($('<td></td>').append($delete));

        $delete.click(function(){
          $row.remove();
        });

        $tbody.append($row);
      });
      $body.append($table);

      let $buttons = $(
        '<button type="button" class="cancel btn-light">Cancel</button>' +
        '<button type="button" class="ok btn-light">Ok</button>'
      );

      let $dialog = dialog('Edit animation keys', $body, $buttons);

      $buttons.siblings('.cancel').click(function() {
        $dialog.close();
      });
      $buttons.siblings('.ok').click(function() {
        let animationKeys = [];
        $tbody.children().each(function(i, ele){
          let animationKey = ele.animationKey;
          animationKey.time = parseFloat(ele.children[0].children[0].value);
          animationKeys.push(animationKey);
        });
        let valid = true;
        animationKeys.sort(function(a, b){
          if (b.time == a.time) {
            toastMsg('Invalid animation (Duplicate key timing)');
            valid = false;
          } else if (b.time > a.time) {
            return -1;
          } else {
            return 1;
          }
        });
        if (animationKeys.length > 0 && animationKeys[0].time != 0) {
          toastMsg('Invalid animation (Start time not 0)');
          return;
        }

        if (valid) {
          objectOptions.animationKeys = animationKeys;
          $dialog.close();
          self.resetScene();
        }
      });
    }

    function addKey() {
      let time = $keyTime.val();
      if (time.trim() == '') {
        time = 0;
      } else {
        try {
          time = parseFloat(time);
        } catch (e) {
          toastMsg('Error: Invalid time');
          return;
        }
      }
      if (objectOptions.animationKeys.length == 0 && time != 0) {
        toastMsg('Error: First key must be at time 0');
        return;
      }

      if (objectOptions.animationKeys.filter(animationKey => animationKey.time == time).length > 0) {
        toastMsg('Error: Key time must be unique');
        return;
      }

      let key = {
        time: time,
        position: [...objectOptions.position],
        rotation: [...objectOptions.rotation]
      };

      objectOptions.animationKeys.push(key);
      objectOptions.animationKeys.sort(function(a, b){
        if (b.time > a.time) {
          return -1;
        } else {
          return 1;
        }
      });

      self.resetScene();
    }

    let buttons = [
      {
        label: 'Edit',
        callback: edit
      },
      {
        label: 'Add Key',
        callback: addKey
      }
    ];

    $buttonsBox.append('<span>' + i18n.get('#builder-key_time#') + '</span>');
    $buttonsBox.append($keyTime);

    let $button = $('<button></button>');
    $button.text(i18n.get('#builder-add_key#'));
    $button.click(addKey);
    $buttonsBox.append($button);

    $button = $('<button></button>');
    $button.text(i18n.get('#builder-edit#'));
    $button.click(edit);
    $buttonsBox.append($button);
    $buttonsBox.append('<span>&nbsp;</span>');
    $buttonsBox.append($keyCount);

    $div.append($buttonsBox);

    return $div;
  };

  // Apply pointerDragBehavior to selected mesh
  this.applyDragToSelected = function() {
    let selected = self.$objectsList.find('li.selected');
    if (typeof selected[0].objectIndex != 'undefined') {
      let id = 'worldBaseObject_' + selected[0].name + selected[0].objectIndex;
      let mesh = babylon.scene.getMeshByID(id);

      // Models takes a while to load
      if (mesh == null) {
        setTimeout(self.applyDragToSelected, 200);
        return;
      }

      mesh.addBehavior(self.pointerDragBehavior);
    }
  };

  // Save history
  this.saveHistory = function() {
    if (typeof self.editHistory == 'undefined') {
      self.editHistory = [];
    }

    self.editHistory.push(JSON.stringify(self.worldOptions));
  };

  // Clear history
  this.clearHistory = function() {
    if (typeof self.editHistory != 'undefined') {
      self.editHistory = [];
    }
  };

  // Undo
  this.undo = function() {
    if (typeof self.editHistory != 'undefined' && self.editHistory.length > 0) {
      var lastDesign = self.editHistory.pop();
      self.worldOptions = JSON.parse(lastDesign);
      self.resetScene();
    }
  };

  // Drop object to ground level
  this.moveToGround = function(opt, objectOptions) {
    let selected = self.$objectsList.find('li.selected');
    if (typeof selected[0].objectIndex != 'undefined') {
      let id = 'worldBaseObject_' + selected[0].name + selected[0].objectIndex;
      let mesh = babylon.scene.getMeshByID(id);

      let down = new BABYLON.Vector3(0, -1, 0);
      let ray = new BABYLON.Ray(mesh.position, down, 1000);
      mesh.isPickable = false;
      let hit = babylon.scene.pickWithRay(ray);
      mesh.isPickable = true;
      let groundY = 0;
      if (hit.hit) {
        groundY = hit.pickedPoint.y;
      }

      if (selected[0].name == 'box') {
        let extendSize = mesh.getBoundingInfo().boundingBox.extendSizeWorld;
        objectOptions.position[2] = extendSize.y + groundY;

      } else if (selected[0].name == 'sphere') {
        objectOptions.position[2] = objectOptions.size[0] / 2 + groundY;

      } else if (selected[0].name == 'cylinder') {
        let quad = mesh.absoluteRotationQuaternion;
        let origVec = new BABYLON.Vector3(0,1,0);
        let rotVec =  new BABYLON.Vector3();
        rotVec = origVec.rotateByQuaternionToRef(quad, rotVec);

        let angle = Math.acos(BABYLON.Vector3.Dot(origVec, rotVec));
        let y2 = -(objectOptions.size[1] / 2) * Math.sin(angle) + -(objectOptions.size[0] / 2) * Math.cos(angle);

        objectOptions.position[2] = -y2 + groundY;

      } else if (selected[0].name == 'model') {
        let extendSize = mesh.getBoundingInfo().boundingBox.extendSizeWorld;
        objectOptions.position[2] = extendSize.y + groundY;
      }
      self.resetScene(false);
    }
  };

  // Show options
  this.showObjectOptions = function(li) {
    let name = li.name;

    let OBJECTS = ['box', 'cylinder', 'sphere', 'model', 'hinge', 'ballJoint']
    if (OBJECTS.indexOf(name) != -1) {
      self.$objectID.text('worldBaseObject_' + li.name + li.objectIndex);
    } else {
      self.$objectID.text('');
    }

    let currentOptions = li.object;
    self.$settingsArea.empty();

    let genConfig = new GenConfig(self, self.$settingsArea);

    if (name == 'ground') {
      genConfig.displayOptionsConfigurations(self.groundTemplate, currentOptions);
    } else if (name == 'wall') {
      genConfig.displayOptionsConfigurations(self.wallTemplate, currentOptions);
    } else if (name == 'timer') {
      genConfig.displayOptionsConfigurations(self.timerTemplate, currentOptions);
    } else if (name == 'robot') {
      genConfig.displayOptionsConfigurations(self.robotTemplate, currentOptions);
    } else if (name == 'animation') {
      genConfig.displayOptionsConfigurations(self.animationTemplate, currentOptions);
    } else if (name == 'box') {
      genConfig.displayOptionsConfigurations(self.boxTemplate, currentOptions);
    } else if (name == 'cylinder') {
      genConfig.displayOptionsConfigurations(self.cylinderTemplate, currentOptions);
    } else if (name == 'sphere') {
      genConfig.displayOptionsConfigurations(self.sphereTemplate, currentOptions);
    } else if (name == 'model') {
      genConfig.displayOptionsConfigurations(self.modelTemplate, currentOptions);
    } else if (name == 'hinge') {
      genConfig.displayOptionsConfigurations(self.hingeTemplate, currentOptions);
    } else if (name == 'ballJoint') {
      genConfig.displayOptionsConfigurations(self.ballJointTemplate, currentOptions);
    }
  };

  // Setup picking ray
  this.setupPickingRay = function() {
    babylon.scene.onPointerUp = function(e, hit) {
      if (e.button != 0) {
        return;
      }

      if (hit.pickedMesh != null && hit.pickedMesh.id.match(/^worldBaseObject_/) != null) {
        let index = hit.pickedMesh.id.match(/[0-9]+$/);
        if (index) {
          index = parseInt(index[0]);
          let childList = self.$objectsList.find('li');
          for (child of childList) {
            if (typeof child.objectIndex != 'undefined' && child.objectIndex == index) {
              childList.removeClass('selected');
              $(child).addClass('selected');
              self.objectSelect(child);
              break;
            }
          }
        }
      }
    }
  };

  // Reset scene
  this.resetScene = function(reloadComponents=true) {
    simPanel.hideWorldInfoPanel();
    worlds[0].setOptions(self.worldOptions).then(function(){
      babylon.resetScene();
      babylon.scene.physicsEnabled = false;
      self.setupPickingRay();
      if (reloadComponents) {
        let selected = self.$objectsList.find('li.selected');
        let childList = self.$objectsList.find('li');
        let selectedIndex = [...childList].indexOf(selected[0]);

        self.loadIntoObjectsWindow(self.worldOptions);

        childList = self.$objectsList.find('li');
        if (typeof childList[selectedIndex] != 'undefined') {
          childList.removeClass('selected');
          $(childList[selectedIndex]).addClass('selected');
        }
      }
      let selected = self.$objectsList.find('li.selected');
      self.showObjectOptions(selected[0]);
      self.highlightSelected();
      self.applyDragToSelected();
    });
  }

  // Add a new object to selected
  this.addObject = function() {
    let $body = $('<div class="selectObject"></div>');
    let $select = $('<select></select>');
    let $description = $('<div class="description"><div class="text"></div></div>');

    let objectTypes = ['Box', 'Cylinder', 'Sphere', 'Model', 'Compound', 'Hinge', 'Ball Joint'];

    objectTypes.forEach(function(type){
      let $object = $('<option></option>');
      $object.prop('value', type);
      $object.text(i18n.get('#builder-type-' + type + '#'));
      $select.append($object);
    });

    $body.append($select);
    $body.append($description);

    let $buttons = $(
      '<button type="button" class="cancel btn-light">' + i18n.get('#sim-cancel#') + '</button>' +
      '<button type="button" class="confirm btn-success">Ok</button>'
    );

    let $dialog = dialog(i18n.get('#builder-type-select_title#'), $body, $buttons);

    $buttons.siblings('.cancel').click(function() { $dialog.close(); });
    $buttons.siblings('.confirm').click(function(){
      self.saveHistory();

      let selected = self.getSelectedComponent()[0];
      let object = null;
      if ($select.val() == 'Box') {
        object = JSON.parse(JSON.stringify(self.boxDefault));
      } else if ($select.val() == 'Cylinder') {
        object = JSON.parse(JSON.stringify(self.cylinderDefault));
      } else if ($select.val() == 'Sphere') {
        object = JSON.parse(JSON.stringify(self.sphereDefault));
      } else if ($select.val() == 'Model') {
        object = JSON.parse(JSON.stringify(self.modelDefault));
      } else if ($select.val() == 'Compound') {
        object = JSON.parse(JSON.stringify(self.compoundDefault));
      } else if ($select.val() == 'Hinge') {
        object = JSON.parse(JSON.stringify(self.hingeDefault));
      } else if ($select.val() == 'Ball Joint') {
        object = JSON.parse(JSON.stringify(self.ballJointDefault));
      }

      if ($select.val() == 'Compound') {
        if (selected.name == 'compound' && selected.object.objects.length == 0) {
            toastMsg('First object in a compound cannot be another compound');
            $dialog.close();
            return;
        }
      }

      if ($select.val() == 'Hinge') {
        if (selected.name != 'compound') {
          toastMsg('Hinges can only be added to compounds');
          $dialog.close();
          return;
        } else if (selected.object.objects.length == 0) {
          toastMsg('First object in a compound cannot be a hinge');
          $dialog.close();
          return;
        }
      }

      if ($select.val() == 'Ball Joint') {
        if (selected.name != 'compound') {
          toastMsg('Ball Joints can only be added to compounds');
          $dialog.close();
          return;
        } else if (selected.object.objects.length == 0) {
          toastMsg('First object in a compound cannot be a ball joint');
          $dialog.close();
          return;
        }
      }

      if (selected.name == 'hinge') {
        if (selected.object.objects.length > 0) {
          toastMsg('Hinges can only contain one object');
          $dialog.close();
          return
        }
      }

      if (selected.name == 'ballJoint') {
        if (selected.object.objects.length > 0) {
          toastMsg('Ball Joint can only contain one object');
          $dialog.close();
          return
        }
      }

      if (selected.name == 'compound' || selected.name == 'hinge' || selected.name == 'ballJoint') {
        selected.object.objects.push(object);
      } else {
        self.worldOptions.objects.push(object);
      }

      self.resetScene();
      $dialog.close();
    });
  };

  // Clone selected object
  this.cloneObject = function() {
    let $selected = self.getSelectedComponent();
    let VALID_OBJECTS = ['box', 'cylinder', 'sphere', 'model', 'compound', 'hinge', 'ballJoint'];
    if (VALID_OBJECTS.indexOf($selected[0].name) == -1) {
      toastMsg('Only objects can be cloned');
      return;
    }

    self.saveHistory();
    let object = JSON.parse(JSON.stringify($selected[0].object));
    let parentCompound = self.findParentCompound($selected[0].objectIndex);
    parentCompound.objects.push(object);
    self.resetScene();
  };

  // Find the parent of a child object
  this.findParentCompound = function(objectIndex) {
    let currentIndex = -1;

    function findParent(parent) {
      for (let i=0; i<parent.objects.length; i++) {
        currentIndex++;
        if (currentIndex == objectIndex) {
          return parent;
        } else if (parent.objects[i].type == 'compound' || parent.objects[i].type == 'hinge' || parent.objects[i].type == 'ballJoint') {
          let result = findParent(parent.objects[i]);
          if (result != null) {
            return result;
          }
        }
      }
      return null;
    }

    return findParent(self.worldOptions);
  };

  // Delete selected object
  this.deleteObject = function() {
    let $selected = self.getSelectedComponent();
    let VALID_OBJECTS = ['box', 'cylinder', 'sphere', 'model', 'compound', 'hinge', 'ballJoint']
    if (VALID_OBJECTS.indexOf($selected[0].name) == -1) {
      toastMsg('Only objects can be deleted');
      return;
    }

    self.saveHistory();
    let parentCompound = self.findParentCompound($selected[0].objectIndex);
    if (parentCompound !== null) {
      let index = parentCompound.objects.indexOf($selected[0].object);
      parentCompound.objects.splice(index, 1);
    } else {
      let index = self.worldOptions.objects.indexOf($selected[0].object);
      self.worldOptions.objects.splice(index, 1);
    }
    self.resetScene();
  };

  // Get selected component
  this.getSelectedComponent = function() {
    return self.$objectsList.find('li.selected');
  };

  // Select list item on click
  this.objectSelect = function(target) {
    if (target.nodeName != 'LI') {
      return;
    }
    let prevSelection = self.$objectsList.find('li.selected');
    if (typeof prevSelection[0].objectIndex != 'undefined') {
      let id = 'worldBaseObject_' + prevSelection[0].name + prevSelection[0].objectIndex;
      let mesh = babylon.scene.getMeshByID(id);
      if (mesh) {
        mesh.removeBehavior(self.pointerDragBehavior);
      }
    }
    prevSelection.removeClass('selected');

    target.classList.add('selected');
    self.applyDragToSelected();

    self.showObjectOptions(target);
    self.highlightSelected();
  };

  // Highlight selected component
  this.highlightSelected = function() {
    let $selected = self.$objectsList.find('li.selected');
    if ($selected.length < 1) {
      return;
    }

    let wireframe = babylon.scene.getMeshByID('wireframeObjectSelector');
    if (wireframe != null) {
      wireframe.dispose();
    }
    let index = $selected[0].objectIndex;
    if (typeof index != 'undefined') {
      let id = 'worldBaseObject_' + $selected[0].name + index;
      let body = babylon.scene.getMeshByID(id);

      // Models takes a while to load
      if (body == null) {
        setTimeout(self.highlightSelected, 200);
        return;
      }

      let size = body.getBoundingInfo().boundingBox.extendSize;
      let options = {
        height: size.y * 2,
        width: size.x * 2,
        depth: size.z * 2
      };
      let wireframeMat = babylon.scene.getMaterialByID('wireframeObjectSelector');
      if (wireframeMat == null) {
        wireframeMat = new BABYLON.StandardMaterial('wireframeObjectSelector', babylon.scene);
        wireframeMat.alpha = 0;
      }

      wireframe = BABYLON.MeshBuilder.CreateBox('wireframeObjectSelector', options, babylon.scene);
      wireframe.material = wireframeMat;
      wireframe.position = body.absolutePosition;
      wireframe.rotationQuaternion = body.absoluteRotationQuaternion;
      wireframe.enableEdgesRendering();
      wireframe.edgesWidth = 50;
      wireframe.isPickable = false;
      let wireframeAnimation = new BABYLON.Animation(
        'wireframeAnimation',
        'edgesColor',
        30,
        BABYLON.Animation.ANIMATIONTYPE_COLOR4,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      var keys = [];
      keys.push({
        frame: 0,
        value: new BABYLON.Color4(0, 0, 1, 1)
      });
      keys.push({
        frame: 15,
        value: new BABYLON.Color4(1, 0, 0, 1)
      });
      keys.push({
        frame: 30,
        value: new BABYLON.Color4(0, 0, 1, 1)
      });
      wireframeAnimation.setKeys(keys);
      wireframe.animations.push(wireframeAnimation);
      babylon.scene.beginAnimation(wireframe, 0, 30, true);
    }
  }

  // Load world into objects window
  this.loadIntoObjectsWindow = function(options) {
    let objectIndex = 0;

    let $ul = $('<ul></ul>');
    let $li = $('<li class="selected"></li>').text(i18n.get('#builder-list-ground#'));
    $li[0].name = 'ground';
    $li[0].object = options;
    $ul.append($li);

    $li = $('<li></li>').text(i18n.get('#builder-list-wall#'));
    $li[0].name = 'wall';
    $li[0].object = options;
    $ul.append($li);

    $li = $('<li></li>').text(i18n.get('#builder-list-timer#'));
    $li[0].name = 'timer';
    $li[0].object = options;
    $ul.append($li);

    $li = $('<li></li>').text(i18n.get('#builder-list-robot#'));
    $li[0].name = 'robot';
    $li[0].object = options;
    $ul.append($li);

    $li = $('<li></li>').text(i18n.get('#builder-list-animation#'));
    $li[0].name = 'animation';
    $li[0].object = options;
    $ul.append($li);

    $li = $('<li></li>').text(i18n.get('#builder-list-objects#'));
    $li[0].name = 'objects';
    $li[0].object = {};
    $ul.append($li);

    function listObject(object) {
      // Apply default options
      for (let key in self.objectDefault) {
        if (typeof object[key] == 'undefined') {
          object[key] = self.objectDefault[key];
        }
      }

      let $item = $('<li></li>');
      $item.text(object.type);
      $item[0].name = object.type;
      $item[0].object = object;
      $item[0].objectIndex = objectIndex++;
      if (object.type == 'compound' || object.type == 'hinge' || object.type == 'ballJoint') {
        let $subList = $('<ul></ul>');
        object.objects.forEach(function(object){
          let $subItem = listObject(object);
          $subItem[0].child = true;
          $subList.append($subItem);
        });
        $item.append($subList);
      }

      return $item;
    }

    let $list = $('<ul></ul>');
    options.objects.forEach(function(object){
      $list.append(listObject(object));
    });

    if ($list.children().length > 0) {
      $ul.append($('<li class="ulHolder"></li>').append($list));
    }

    $ul.find('li').click(function(e) {
      self.objectSelect(e.target);
      e.stopPropagation();
    });

    self.$objectsList.empty();
    self.$objectsList.append($ul);
  };

  // Save world to json file
  this.saveWorld = function() {
    let world = {
      worldName: 'custom',
      options: self.worldOptions
    };

    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:application/json;base64,' + btoa(JSON.stringify(world, null, 2));
    hiddenElement.target = '_blank';
    hiddenElement.download = 'custom_world.json';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
  };


  // Save world to DB
  this.saveWorldToDb = function() {
    const defaultName = self._dbWorldName || '';
    var $dialog = confirmDialog({
      title: i18n.get('#builder-save_world_db#'),
      message: '<label style="display:block;margin-bottom:0.3em;">' + i18n.get('#builder-world_name#') + '</label>' +
               '<input id="dbWorldNameInput" type="text" class="form-control" value="' + defaultName + '" style="width:100%;box-sizing:border-box;">',
      confirm: i18n.get('#main-save#'),
    }, function() {
      const name = document.getElementById('dbWorldNameInput').value.trim();
      if (!name) return;
      self._dbWorldName = name;
      const id = self._dbWorldId || null;

      babylon.scene.render();
      BABYLON.Tools.CreateScreenshot(babylon.engine, babylon.scene.activeCamera, { width: 300, height: 300 }, function(thumbnail) {
        fetch('/api/worlds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name, options: self.worldOptions, thumbnail })
        })
        .then(r => r.json())
        .then(data => {
          self._dbWorldId = data.world.id;
        })
        .catch(err => console.error('[DB] 월드 저장 실패:', err));
      });
    });
    setTimeout(() => document.getElementById('dbWorldNameInput')?.focus(), 100);
  };

  // Load object from json file
  this.loadObjectLocal = function() {
    var hiddenElement = document.createElement('input');
    hiddenElement.type = 'file';
    hiddenElement.accept = 'application/json,.json';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
    hiddenElement.addEventListener('change', function(e){
      var reader = new FileReader();
      reader.onload = function() {
        let objects = JSON.parse(this.result).objects;

        self.saveHistory();

        let selected = self.getSelectedComponent()[0];
        if (
          selected.name == 'compound'
          && (objects.type != 'Compound' || selected.object.objects.length > 0)
        ) {
          selected.object.objects.push(objects[0]);
        } else {
          self.worldOptions.objects.push(objects[0]);
        }

        self.resetScene();
      };
      reader.readAsText(e.target.files[0]);
    });
  };

  // Save selected object to json file
  this.saveObject = function() {
    let $selected = self.getSelectedComponent();

    let save = {
      objects: []
    };

    save.objects.push($selected[0].object);

    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:application/json;base64,' + btoa(JSON.stringify(save, null, 2));
    hiddenElement.target = '_blank';
    hiddenElement.download = 'custom_object.json';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
  };

  // New world using defaults
  this.newWorld = function() {
    let options = {
      message: i18n.get('#builder-new_world_confirm#'),
    };
    confirmDialog(options, function(){
      self.worldOptions = JSON.parse(JSON.stringify(worlds[0].defaultOptions));
      self.clearHistory();
      self.saveHistory();
      self.resetScene();
    });
  };

  // Load world from json file
  this.loadWorldLocal = function() {
    var hiddenElement = document.createElement('input');
    hiddenElement.type = 'file';
    hiddenElement.accept = 'application/json,.json';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
    hiddenElement.addEventListener('change', function(e){
      var reader = new FileReader();
      reader.onload = function() {
        let loadedJson = JSON.parse(this.result);

        if (loadedJson.worldName != 'custom') {
          let msg = i18n.get('#builder-only_custom_world#') + '<br>';
          msg += i18n.get('#builder-this_world_is#') + ' "' + loadedJson.worldName + '" ' + i18n.get('#builder-world_type#');
          showErrorModal(msg);
          return;
        }

        self.worldOptions = JSON.parse(JSON.stringify(worlds[0].defaultOptions));
        Object.assign(self.worldOptions, loadedJson.options);
        self.clearHistory();
        self.saveHistory();
        self.resetScene();
      };
      reader.readAsText(e.target.files[0]);
    });
  };

  // Toggle filemenu
  this.toggleFileMenu = function(e) {
    if ($('.fileMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      let menuItems = [
        {html: i18n.get('#builder-new_world#'), line: true, callback: self.newWorld},
        {html: i18n.get('#builder-load_world#'), line: false, callback: self.loadWorldLocal},
        {html: i18n.get('#builder-save_world#'), line: false, callback: self.saveWorld},
        {html: i18n.get('#builder-save_world_db#'), line: false, callback: self.saveWorldToDb},
        {html: i18n.get('#builder-load_object#'), line: false, callback: self.loadObjectLocal},
        {html: i18n.get('#builder-save_object#'), line: false, callback: self.saveObject},
      ];

      menuDropDown(self.$fileMenu, menuItems, {className: 'fileMenuDropDown', align: 'activityBar'});
    }
  };

  // Toggle worldmenu
  this.toggleWorldMenu = function(e) {
    if ($('.worldMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      function toggleAnimate() {
        if (babylon.world.animate) {
          babylon.world.animate = false;
        } else {
          babylon.world.animate = true;
        }
      }

      let menuItems = [
        {html: i18n.get('#builder-animate#'), line: false, callback: toggleAnimate }
      ];
      if (babylon.world.animate) {
        menuItems[0].html = '<span class="tick">&#x2713;</span> ' + menuItems[0].html;
      }

      menuDropDown(self.$worldMenu, menuItems, {className: 'worldMenuDropDown', align: 'activityBar'});
    }
  };

  // Snapping
  this.snapStep = [0, 0, 0];
  this.roundToSnap = function(value, snap) {
    if (snap == 0) {
      return value;
    }
    let inv = 1.0 / snap;
    return Math.round(value * inv) / inv;
  }

  // Toggle snapmenu
  this.toggleSnapMenu = function(e) {
    if ($('.snapMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      function snapNone() {
        self.snapStep = [0, 0, 0];
      }
      function snap02() {
        self.snapStep = [0.2, 0.2, 0.2];
      }
      function snapTechnic() {
        self.snapStep = [0.4, 0.4, 0.4];
      }
      function snapLego() {
        self.snapStep = [0.4, 0.4, 0.48];
      }
      function snap05() {
        self.snapStep = [0.5, 0.5, 0.5];
      }
      function snap10() {
        self.snapStep = [1, 1, 1];
      }
      function snap50() {
        self.snapStep = [5, 5, 5];
      }

      let menuItems = [
        {html: i18n.get('#builder-no_snapping#'), line: false, callback: snapNone},
        {html: i18n.get('#builder-snap_02#'), line: false, callback: snap02},
        {html: i18n.get('#builder-snap_04_technic#'), line: false, callback: snapTechnic},
        {html: i18n.get('#builder-snap_lego#'), line: false, callback: snapLego},
        {html: i18n.get('#builder-snap_05#'), line: false, callback: snap05},
        {html: i18n.get('#builder-snap_10#'), line: false, callback: snap10},
        {html: i18n.get('#builder-snap_50#'), line: false, callback: snap50},
      ];
      var tickIndex = 0;
      if (self.snapStep[2] == 0) {
        tickIndex = 0;
      } else if (self.snapStep[2] == 0.2) {
        tickIndex = 1;
      } else if (self.snapStep[2] == 0.4) {
        tickIndex = 2;
      } else if (self.snapStep[2] == 0.48) {
        tickIndex = 3;
      } else if (self.snapStep[2] == 0.5) {
        tickIndex = 4;
      } else if (self.snapStep[2] == 1) {
        tickIndex = 5;
      } else if (self.snapStep[2] == 5) {
        tickIndex = 6;
      }
      menuItems[tickIndex].html = '<span class="tick">&#x2713;</span> ' + menuItems[tickIndex].html;

      menuDropDown(self.$snapMenu, menuItems, {className: 'snapMenuDropDown', align: 'activityBar'});
    }
  };

  // Clicked on tab
  this.tabClicked = function(tabNav) {
  };
}

// Init class

builder.init();
