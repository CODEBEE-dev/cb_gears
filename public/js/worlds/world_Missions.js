i18n.append({
  '#missions-shortDescription#': {
    en: 'Missions (FLL, WRO, etc)',
    ko: '미션 (FLL, WRO 등)',
  },
  '#missions-longDescription#': {
    en: '<p>This world contains various missions.</p>' +
        '<p>Currently, we only have missions based on First Lego League (FLL) and World Robot Olympiad (WRO), but we welcome contributions of any types of missions.</p>' +
        '<p>Contributed missions should be constructed using json only (ie. no javascript) to be suitable for inclusion here.</p>',
    ko: '<p>이 맵에는 다양한 미션이 포함되어 있습니다.</p>' +
        '<p>현재는 FLL(퍼스트 레고 리그)과 WRO(세계 로봇 올림피아드) 기반 미션만 있지만, 어떤 종류의 미션 기여도 환영합니다.</p>' +
        '<p>기여하는 미션은 JSON만 사용하여 구성해야 합니다(자바스크립트 제외).</p>',
  },
  '#missions-selectMission#': {
    en: 'Select Mission',
    ko: '미션 선택',
  },
  '#missions-wall#': {
    en: 'Wall',
    ko: '벽',
  },
  '#missions-wallPresent#': {
    en: 'Wall Present',
    ko: '벽 있음',
  },
  '#missions-timer#': {
    en: 'Timer',
    ko: '타이머',
  },
  '#missions-showTimer#': {
    en: 'Show Timer',
    ko: '타이머 표시',
  },
  '#missions-missions#': {
    en: 'Missions',
    ko: '미션',
  },
  '#missions-missionObjectsPresent#': {
    en: 'Mission Objects Present',
    ko: '미션 오브젝트 표시',
  },
  '#missions-missionObjectsHelp#': {
    en: 'Mission objects are only available for some missions.',
    ko: '미션 오브젝트는 일부 미션에서만 사용할 수 있습니다.',
  },
  '#missions-wallHeight#': {
    en: 'Wall Height (cm)',
    ko: '벽 높이 (cm)',
  },
  '#missions-wallThickness#': {
    en: 'Wall Thickness (cm)',
    ko: '벽 두께 (cm)',
  },
  '#missions-startPos#': {
    en: 'Starting Position',
    ko: '시작 위치',
  },
  '#missions-missionDefault#': {
    en: 'Mission Default',
    ko: '미션 기본값',
  },
  '#missions-center#': {
    en: 'Center',
    ko: '중앙',
  },
  '#missions-bottomLeft#': {
    en: 'Bottom Left',
    ko: '왼쪽 아래',
  },
  '#missions-bottomCenter#': {
    en: 'Bottom Center',
    ko: '아래 중앙',
  },
  '#missions-bottomRight#': {
    en: 'Bottom Right',
    ko: '오른쪽 아래',
  },
  '#missions-startPosXY#': {
    en: 'Starting Position (x, y)',
    ko: '시작 위치 (x, y)',
  },
  '#missions-startPosXYHelp#': {
    en: 'Enter using this format "x, y" (in cm, without quotes) and it will override the above. Center of image is "0, 0".',
    ko: '"x, y" 형식으로 입력하면 (cm 단위, 따옴표 제외) 위 설정을 덮어씁니다. 이미지 중앙이 "0, 0"입니다.',
  },
  '#missions-startRot#': {
    en: 'Starting Rotation (degrees)',
    ko: '시작 방향 (도)',
  },
  '#missions-startRotHelp#': {
    en: 'Set the starting rotation in degrees. Positive rotation is clockwise.',
    ko: '시작 방향을 도(°) 단위로 설정합니다. 양수 값은 시계 방향입니다.',
  },
});

var world_Missions = new function() {
  World_Base.call(this);
  this.parent = {};
  for (p in this) {
    this.parent[p] = this[p];
  }

  var self = this;

  this.name = 'missions';
  this.shortDescription = i18n.get('#missions-shortDescription#');
  this.longDescription = i18n.get('#missions-longDescription#');
  this.thumbnail = 'images/worlds/missions.jpg';

  this.optionsConfigurations = [
    {
      option: 'jsonFile',
      title: i18n.get('#missions-selectMission#'),
      type: 'select',
      options: [
        ['2026 WRO (Elementary)', 'worlds/missions/WRO/WRO-2026-Elementary.json?v=e728d1d8'],
        ['2026 WRO (Junior)', 'worlds/missions/WRO/WRO-2026-Junior.json?v=9b1d44c7'],
        ['2026 WRO (Senior)', 'worlds/missions/WRO/WRO-2026-Senior.json?v=0adf1193'],
        ['2025 FLL (Unearthed)', 'worlds/missions/FLL/FLL2025.json?v=00d2ba8a'],
        ['2025 WRO (Sport)', 'worlds/missions/WRO/WRO-2025-Sport.json?v=8a1dacc8'],
        ['2025 WRO (Future Engineer Simple)', 'worlds/missions/WRO/WRO-2025-Future-Engineer-Simple.json?v=f5334f91'],
        ['2025 WRO (Future Engineer Open)', 'worlds/missions/WRO/WRO-2025-Future-Engineer-Open.json?v=a63f9afa'],
        ['2025 WRO (Future Engineer Obstacle)', 'worlds/missions/WRO/WRO-2025-Future-Engineer-Obstacle.json?v=0da11813'],
        ['2025 WRO (Elementary)', 'worlds/missions/WRO/WRO-2025-Elementary.json?v=c85eb989'],
        ['2025 WRO (Junior)', 'worlds/missions/WRO/WRO-2025-Junior.json?v=97f15769'],
        ['2025 WRO (Senior)', 'worlds/missions/WRO/WRO-2025-Senior.json?v=9a88d813'],
        ['2024 FLL (Submerged)', 'worlds/missions/FLL/FLL2024.json?v=0cc112b7'],
        ['2024 WRO (Elementary)', 'worlds/missions/WRO/WRO-2024-Elementary.json?v=61a7112b'],
        ['2024 WRO (Junior)', 'worlds/missions/WRO/WRO-2024-Junior.json?v=8e6277b9'],
        ['2024 WRO (Senior)', 'worlds/missions/WRO/WRO-2024-Senior.json?v=af9c72fc'],
        ['2023 FLL (Masterpiece)', 'worlds/missions/FLL/FLL2023.json?v=02cde046'],
        ['2023 WRO (Elementary)', 'worlds/missions/WRO/WRO-2023-Elementary.json?v=bbda7305'],
        ['2023 WRO (Junior)', 'worlds/missions/WRO/WRO-2023-Junior.json?v=888f71dc'],
        ['2023 WRO (Senior) No Models', 'worlds/missions/WRO/WRO-2023-Senior.json?v=78beee40'],
        ['2022 FLL (Superpowered)', 'worlds/missions/FLL/FLL2022.json?v=8d10813a'],
        ['2022 WRO (Elementary)', 'worlds/missions/WRO/WRO-2022-Regular-Elementary-1.json?v=a2936cb0'],
        ['2022 WRO (Elementary) Randomization 2', 'worlds/missions/WRO/WRO-2022-Regular-Elementary-2.json?v=cc4e3604'],
        ['2022 WRO (Junior)', 'worlds/missions/WRO/WRO-2022-Regular-Junior.json?v=d3b135ba'],
        ['2022 WRO (Senior)', 'worlds/missions/WRO/WRO-2022-Regular-Senior.json?v=b6e40d9d'],
        ['2021 FLL (Cargo Connect)', 'worlds/missions/FLL/FLL2021.json?v=b31b8262'],
        ['2021 WRO (Elementary)', 'worlds/missions/WRO/WRO-2021-Regular-Elementary.json?v=45448002'],
        ['2021 WRO (Junior)', 'worlds/missions/WRO/WRO-2021-Regular-Junior.json?v=151e42f8'],
        ['2021 WRO (Senior)', 'worlds/missions/WRO/WRO-2021-Regular-Senior.json?v=b2fed43c'],
        ['2020 FLL (RePLAY v2)', 'worlds/missions/FLL/FLL2020v2.json?v=83106bf2'],
        ['2020 FLL (RePLAY)', 'worlds/missions/FLL/FLL2020.json?v=eeac2988'],
        ['2020 WRO (Elementary)', 'worlds/missions/WRO/WRO-2020-Regular-Elementary.json?v=136a82cb'],
        ['2020 WRO (Junior)', 'worlds/missions/WRO/WRO-2020-Regular-Junior.json?v=6f98672b'],
        ['2019 FLL (City Shaper)', 'worlds/missions/FLL/FLL2019.json?v=36e51441'],
        ['2019 WRO (Elementary)', 'worlds/missions/WRO/WRO-2019-Regular-Elementary.json?v=a22f9c7b'],
        ['2019 WRO (Junior)', 'worlds/missions/WRO/WRO-2019-Regular-Junior.json?v=deccceee'],
        ['2018 FLL (Into Orbit)', 'worlds/missions/FLL/FLL2018.json?v=55341767'],
        ['2018 WRO (Elementary)', 'worlds/missions/WRO/WRO-2018-Regular-Elementary.json?v=111cdfb9'],
        ['2018 WRO (Junior)', 'worlds/missions/WRO/WRO-2018-Regular-Junior.json?v=54491949'],
      ]
    },
    {
      option: 'wall',
      title: i18n.get('#missions-wall#'),
      type: 'checkbox',
      label: i18n.get('#missions-wallPresent#')
    },
    {
      option: 'showTimer',
      title: i18n.get('#missions-timer#'),
      type: 'checkbox',
      label: i18n.get('#missions-showTimer#')
    },
    {
      option: 'missions',
      title: i18n.get('#missions-missions#'),
      type: 'checkbox',
      label: i18n.get('#missions-missionObjectsPresent#'),
      help: i18n.get('#missions-missionObjectsHelp#')
    },
    {
      option: 'wallHeight',
      title: i18n.get('#missions-wallHeight#'),
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'wallThickness',
      title: i18n.get('#missions-wallThickness#'),
      type: 'slider',
      min: '0',
      max: '30',
      step: '0.1'
    },
    {
      option: 'startPos',
      title: i18n.get('#missions-startPos#'),
      type: 'select',
      options: [
        [i18n.get('#missions-missionDefault#'), 'missionDefault'],
        [i18n.get('#missions-center#'), 'center'],
        [i18n.get('#missions-bottomLeft#'), 'bottomLeft'],
        [i18n.get('#missions-bottomCenter#'), 'bottomCenter'],
        [i18n.get('#missions-bottomRight#'), 'bottomRight'],
        ['Player 0', 'P0'],
        ['Player 1', 'P1'],
        ['Player 2', 'P2'],
        ['Player 3', 'P3'],
      ]
    },
    {
      option: 'startPosXYZStr',
      title: i18n.get('#missions-startPosXY#'),
      type: 'text',
      help: i18n.get('#missions-startPosXYHelp#')
    },
    {
      option: 'startRotStr',
      title: i18n.get('#missions-startRot#'),
      type: 'text',
      help: i18n.get('#missions-startRotHelp#')
    }
  ];

  this.defaultOptions = Object.assign(this.defaultOptions, {
    jsonFile: this.optionsConfigurations[0].options[0][1],
    showTimer: true,
    missions: true,
    wallHeight: 7.7,
    wallThickness: 4.5,
    startPos: 'missionDefault',
  });

  // Set options, including default
  this.setOptions = function(options) {
    return fetch(options.jsonFile)
      .then(response => response.json())
      .then(function(data){
        self.options = {...self.defaultOptions};
        Object.assign(self.options, data.options);
        Object.assign(self.options, options);

        if (options.showTimer != true) {
          self.options.timer = 'none';
        }
        if (options.missions != true) {
          self.options.objects = {};
        }
        if (options.startPos != 'missionDefault') {
          self.options.startPosXYZ = null;
          self.options.startRot = null;
        }

        return self.parent.setOptions();
      });
  };

  // Run on page load
  this.init = function() {
    Object.assign(self.options, self.defaultOptions);
  };
}

// Init class
world_Missions.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Missions);