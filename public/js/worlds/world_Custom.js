i18n.append({
  '#custom-shortDescription#': {
    en: 'Custom world',
    ko: '커스텀 맵',
  },
  '#custom-longDescription#': {
    en: '<p>This world is automatically generated from the provided image.</p>' +
        '<p>There are many more options available through editing of the JSON file. Please read the wiki for more details.</p>',
    ko: '<p>이 맵은 제공된 이미지로부터 자동으로 생성됩니다.</p>' +
        '<p>JSON 파일을 편집하여 더 많은 옵션을 설정할 수 있습니다. 자세한 내용은 위키를 참고하세요.</p>',
  },
  '#custom-imageURL#': {
    en: 'Image URL',
    ko: '이미지 URL',
  },
  '#custom-imageURLHelp#': {
    en: 'URL for ground image. Will not work with most webhosts; Imgur will work.',
    ko: '바닥 이미지의 URL입니다. 대부분의 웹호스트에서는 작동하지 않으며 Imgur는 사용 가능합니다.',
  },
  '#custom-uploadImage#': {
    en: 'Upload Image',
    ko: '이미지 업로드',
  },
  '#custom-uploadImageHelp#': {
    en: 'This will override both "Image URL". Will not work if map configuration is saved to a file. You must upload it manually everytime.',
    ko: '"이미지 URL"을 덮어씁니다. 맵 설정을 파일로 저장한 경우에는 작동하지 않습니다. 매번 수동으로 업로드해야 합니다.',
  },
  '#custom-groundType#': {
    en: 'Ground Type',
    ko: '바닥 유형',
  },
  '#custom-box#': {
    en: 'Box',
    ko: '박스',
  },
  '#custom-cylinder#': {
    en: 'Cylinder',
    ko: '원통',
  },
  '#custom-none#': {
    en: 'None',
    ko: '없음',
  },
  '#custom-groundTypeHelp#': {
    en: 'Walls only work with a Box ground. If None is selected, there will be no ground! This is only useful if a custom object is added to act as the ground.',
    ko: '벽은 박스 바닥에서만 작동합니다. 없음을 선택하면 바닥이 없습니다! 커스텀 오브젝트를 바닥으로 추가하는 경우에만 유용합니다.',
  },
  '#custom-displayTimer#': {
    en: 'Display Timer',
    ko: '타이머 표시',
  },
  '#custom-timerNone#': {
    en: 'None',
    ko: '없음',
  },
  '#custom-timerUp#': {
    en: 'Count up from 0',
    ko: '0부터 올라가기',
  },
  '#custom-timerDown#': {
    en: 'Count down from duration',
    ko: '설정 시간부터 내려가기',
  },
  '#custom-timerDuration#': {
    en: 'Timer Duration (s)',
    ko: '타이머 시간 (초)',
  },
  '#custom-atTimerEnd#': {
    en: 'At Timer End',
    ko: '타이머 종료 시',
  },
  '#custom-continue#': {
    en: 'Continue running',
    ko: '계속 실행',
  },
  '#custom-stopTimer#': {
    en: 'Stop the timer only',
    ko: '타이머만 정지',
  },
  '#custom-stopRobot#': {
    en: 'Stop the timer and robot',
    ko: '타이머와 로봇 모두 정지',
  },
  '#custom-atTimerEndHelp#': {
    en: 'What will happend when timer ends.',
    ko: '타이머가 종료될 때 수행할 동작입니다.',
  },
  '#custom-imageScale#': {
    en: 'Image Scale Factor',
    ko: '이미지 배율',
  },
  '#custom-imageScaleHelp#': {
    en: 'Scales the image (eg. when set to 2, each pixel will equal 2mm). Default to 1.',
    ko: '이미지를 배율로 조정합니다 (예: 2로 설정하면 픽셀당 2mm). 기본값은 1입니다.',
  },
  '#custom-wall#': {
    en: 'Wall',
    ko: '벽',
  },
  '#custom-wallPresent#': {
    en: 'Wall Present',
    ko: '벽 있음',
  },
  '#custom-wallHeight#': {
    en: 'Wall Height (cm)',
    ko: '벽 높이 (cm)',
  },
  '#custom-wallThickness#': {
    en: 'Wall Thickness (cm)',
    ko: '벽 두께 (cm)',
  },
  '#custom-startPos#': {
    en: 'Starting Position',
    ko: '시작 위치',
  },
  '#custom-center#': {
    en: 'Center',
    ko: '중앙',
  },
  '#custom-bottomLeft#': {
    en: 'Bottom Left',
    ko: '왼쪽 아래',
  },
  '#custom-bottomCenter#': {
    en: 'Bottom Center',
    ko: '아래 중앙',
  },
  '#custom-bottomRight#': {
    en: 'Bottom Right',
    ko: '오른쪽 아래',
  },
  '#custom-startPosXYZ#': {
    en: 'Starting Position (x, y, z)',
    ko: '시작 위치 (x, y, z)',
  },
  '#custom-startPosXYZHelp#': {
    en: 'Enter using this format "x, y, z" (in cm, without quotes) and it will override the above. Center of image is "0, 0, 0".',
    ko: '"x, y, z" 형식으로 입력하면 (cm 단위, 따옴표 제외) 위 설정을 덮어씁니다. 이미지 중앙이 "0, 0, 0"입니다.',
  },
  '#custom-startRot#': {
    en: 'Starting Rotation (degrees)',
    ko: '시작 방향 (도)',
  },
  '#custom-startRotHelp#': {
    en: 'Set the starting rotation in degrees. Positive rotation is clockwise.',
    ko: '시작 방향을 도(°) 단위로 설정합니다. 양수 값은 시계 방향입니다.',
  },
});

var world_Custom = new function() {
  World_Base.call(this);
  this.parent = {};
  for (p in this) {
    this.parent[p] = this[p];
  }

  var self = this;

  this.name = 'custom';
  this.shortDescription = i18n.get('#custom-shortDescription#');
  this.longDescription = i18n.get('#custom-longDescription#');

  this.optionsConfigurations = [
    {
      option: 'imageURL',
      title: i18n.get('#custom-imageURL#'),
      type: 'text',
      help: i18n.get('#custom-imageURLHelp#')
    },
    {
      option: 'imageFile',
      title: i18n.get('#custom-uploadImage#'),
      type: 'file',
      accept: 'image/*',
      help: i18n.get('#custom-uploadImageHelp#')
    },
    {
      option: 'groundType',
      title: i18n.get('#custom-groundType#'),
      type: 'select',
      options: [
        [i18n.get('#custom-box#'), 'box'],
        [i18n.get('#custom-cylinder#'), 'cylinder'],
        [i18n.get('#custom-none#'), 'none']
      ],
      help: i18n.get('#custom-groundTypeHelp#')
    },
    {
      option: 'timer',
      title: i18n.get('#custom-displayTimer#'),
      type: 'select',
      options: [
        [i18n.get('#custom-timerNone#'), 'none'],
        [i18n.get('#custom-timerUp#'), 'up'],
        [i18n.get('#custom-timerDown#'), 'down']
      ]
    },
    {
      option: 'timerDuration',
      title: i18n.get('#custom-timerDuration#'),
      type: 'slider',
      min: '0',
      max: '300',
      step: '1'
    },
    {
      option: 'timerEnd',
      title: i18n.get('#custom-atTimerEnd#'),
      type: 'select',
      options: [
        [i18n.get('#custom-continue#'), 'continue'],
        [i18n.get('#custom-stopTimer#'), 'stopTimer'],
        [i18n.get('#custom-stopRobot#'), 'stopRobot']
      ],
      help: i18n.get('#custom-atTimerEndHelp#')
    },
    {
      option: 'imageScale',
      title: i18n.get('#custom-imageScale#'),
      type: 'float',
      help: i18n.get('#custom-imageScaleHelp#')
    },
    {
      option: 'wall',
      title: i18n.get('#custom-wall#'),
      type: 'checkbox',
      label: i18n.get('#custom-wallPresent#')
    },
    {
      option: 'wallHeight',
      title: i18n.get('#custom-wallHeight#'),
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'wallThickness',
      title: i18n.get('#custom-wallThickness#'),
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'startPos',
      title: i18n.get('#custom-startPos#'),
      type: 'select',
      options: [
        [i18n.get('#custom-center#'), 'center'],
        [i18n.get('#custom-bottomLeft#'), 'bottomLeft'],
        [i18n.get('#custom-bottomCenter#'), 'bottomCenter'],
        [i18n.get('#custom-bottomRight#'), 'bottomRight'],
        ['Player 0', 'P0'],
        ['Player 1', 'P1'],
        ['Player 2', 'P2'],
        ['Player 3', 'P3'],
      ]
    },
    {
      option: 'startPosXYZStr',
      title: i18n.get('#custom-startPosXYZ#'),
      type: 'text',
      help: i18n.get('#custom-startPosXYZHelp#')
    },
    {
      option: 'startRotStr',
      title: i18n.get('#custom-startRot#'),
      type: 'text',
      help: i18n.get('#custom-startRotHelp#')
    }
  ];

  this.defaultOptions = Object.assign(this.defaultOptions, {
    imageURL: 'textures/maps/custom.png',
  });

  this.setOptions = function(options) {
    self.mergeOptionsWithDefault(options);

    return this.parent.setOptions(options);
  };

  // Run on page load
  this.init = function() {
    Object.assign(self.options, self.defaultOptions);
  };
}

// Init class
world_Custom.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Custom);