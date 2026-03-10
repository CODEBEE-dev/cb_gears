i18n.append({
  '#grid-shortDescription#': {
    en: 'Grid Map (20cm)',
    ko: '격자 지도 (20cm)',
  },
  '#grid-longDescription#': {
    en: '<p>This is a plain grid map.</p><p>Each large square is 20cm, while each small square is 5cm.</p>',
    ko: '<p>기본 격자 지도입니다.</p><p>큰 격자 한 칸은 20cm, 작은 격자 한 칸은 5cm입니다.</p>',
  },
  '#grid-length#': {
    en: 'Length of field (cm)',
    ko: '필드 길이 (cm)',
  },
  '#grid-width#': {
    en: 'Width of field (cm)',
    ko: '필드 너비 (cm)',
  },
  '#grid-wall#': {
    en: 'Wall',
    ko: '벽',
  },
  '#grid-wallPresent#': {
    en: 'Wall Present',
    ko: '벽 있음',
  },
  '#grid-wallHeight#': {
    en: 'Wall Height (cm)',
    ko: '벽 높이 (cm)',
  },
  '#grid-wallThickness#': {
    en: 'Wall Thickness (cm)',
    ko: '벽 두께 (cm)',
  },
  '#grid-startPos#': {
    en: 'Starting Position',
    ko: '시작 위치',
  },
  '#grid-center#': {
    en: 'Center',
    ko: '중앙',
  },
  '#grid-bottomLeft#': {
    en: 'Bottom Left',
    ko: '왼쪽 아래',
  },
  '#grid-bottomCenter#': {
    en: 'Bottom Center',
    ko: '아래 중앙',
  },
  '#grid-bottomRight#': {
    en: 'Bottom Right',
    ko: '오른쪽 아래',
  },
  '#grid-startPosXYZStr#': {
    en: 'Starting Position (x, y)',
    ko: '시작 위치 (x, y)',
  },
  '#grid-startPosXYZStrHelp#': {
    en: 'Enter using this format "x, y" (without quotes) and it will override the above. Center of image is "0, 0".',
    ko: '"x, y" 형식으로 입력하면 (따옴표 제외) 위 설정을 덮어씁니다. 이미지 중앙이 "0, 0"입니다.',
  },
  '#grid-startRotStr#': {
    en: 'Starting Rotation (degrees)',
    ko: '시작 방향 (도)',
  },
  '#grid-startRotStrHelp#': {
    en: 'Set the starting rotation in degrees. Positive rotation is clockwise.',
    ko: '시작 방향을 도(°) 단위로 설정합니다. 양수 값은 시계 방향입니다.',
  },
});

var world_Grid = new function() {
  World_Base.call(this);
  this.parent = {};
  for (p in this) {
    this.parent[p] = this[p];
  }

  var self = this;

  this.name = 'grid';
  this.shortDescription = i18n.get('#grid-shortDescription#');
  this.longDescription = i18n.get('#grid-longDescription#');
  this.thumbnail = 'images/worlds/grid.jpg';

  this.optionsConfigurations = [
    {
      option: 'length',
      title: i18n.get('#grid-length#'),
      type: 'slider',
      min: '100',
      max: '1000',
      step: '10'
    },
    {
      option: 'width',
      title: i18n.get('#grid-width#'),
      type: 'slider',
      min: '100',
      max: '1000',
      step: '10'
    },
    {
      option: 'wall',
      title: i18n.get('#grid-wall#'),
      type: 'checkbox',
      label: i18n.get('#grid-wallPresent#')
    },
    {
      option: 'wallHeight',
      title: i18n.get('#grid-wallHeight#'),
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'wallThickness',
      title: i18n.get('#grid-wallThickness#'),
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'startPos',
      title: i18n.get('#grid-startPos#'),
      type: 'select',
      options: [
        [i18n.get('#grid-center#'), 'center'],
        [i18n.get('#grid-bottomLeft#'), 'bottomLeft'],
        [i18n.get('#grid-bottomCenter#'), 'bottomCenter'],
        [i18n.get('#grid-bottomRight#'), 'bottomRight'],
        ['Player 0', 'P0'],
        ['Player 1', 'P1'],
        ['Player 2', 'P2'],
        ['Player 3', 'P3'],
      ]
    },
    {
      option: 'startPosXYZStr',
      title: i18n.get('#grid-startPosXYZStr#'),
      type: 'text',
      help: i18n.get('#grid-startPosXYZStrHelp#')
    },
    {
      option: 'startRotStr',
      title: i18n.get('#grid-startRotStr#'),
      type: 'text',
      help: i18n.get('#grid-startRotStrHelp#')
    }
  ];

  this.defaultOptions = Object.assign(this.defaultOptions, {
    imageURL: 'textures/maps/grid.png',
    imageScale: '2.353',
    length: 400,
    width: 400,
    wallHeight: 10,
    wallThickness: 5,
    wallColor: 'B3B3B3'
  });

  // Set options, including default
  this.setOptions = function(options) {
    self.mergeOptionsWithDefault(options);

    self.options.uScale = self.options.width / 20;
    self.options.vScale = self.options.length / 20;

    return this.parent.setOptions(options);
  };

  // Run on page load
  this.init = function() {
    Object.assign(self.options, self.defaultOptions);
  };
}

// Init class
world_Grid.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Grid);