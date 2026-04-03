var main = new function() {
  var self = this;

  // Run on page load
  this.init = function() {
    self.$navs = $('nav li');
    self.$panelControls = $('.panelControlsArea .panelControls');
    self.$panels = $('.panels .panel');
    self.$fileMenu = $('.fileMenu');
    self.$pythonMenu = $('.pythonMenu');
    self.$robotMenu = $('.robotMenu');
    self.$worldsMenu = $('.worldsMenu');
    self.$helpMenu = $('.helpMenu');
    self.$projectName = $('#projectName');
    self.$languageMenu = $('.language');
    self.$newsButton = $('.news');

    self.updateTextLanguage();

    self.$navs.click(self.tabClicked);
    $('#simSplitToggle').click(simPanel.toggleSplitSim);
    $('#pythonSplitToggle').click(simPanel.togglePythonSplitSim);
    self.$fileMenu.click(self.toggleFileMenu);
    self.$pythonMenu.click(self.togglePythonMenu);
    self.$robotMenu.click(self.toggleRobotMenu);
    self.$worldsMenu.click(self.toggleWorldsMenu);
    self.$helpMenu.click(self.toggleHelpMenu);
    self.$languageMenu.click(self.toggleLanguageMenu);
    self.$newsButton.click(self.showNews);

    self.$projectName.on('input change', self.onProjectNameChange);

    window.addEventListener('beforeunload', self.checkUnsaved);
    setInterval(self.autoSave, 2 * 1000);
    blocklyPanel.onActive();

    // Default: open split sim view on load
    simPanel.splitSimOpen = true;
    $('.panels').addClass('splitSim');
    $('#simPanel').addClass('splitActive');
    $('#simSplitToggle').addClass('active');


    if (self.isReadOnly) {
      self.$projectName.prop('readonly', true);
      self.$fileMenu.hide();
      document.getElementById('savingIndicator')?.style && (document.getElementById('savingIndicator').style.display = 'none');
    }
  };

  // Update text already in html
  this.updateTextLanguage = function() {
    $('#navBlocks').find('.tab-label').text(i18n.get('#main-blocks#'));
    $('#navBlocks').attr('data-tooltip', i18n.get('#main-blocks#'));
    $('#navSim').find('.tab-label').text(i18n.get('#main-sim#'));
    $('#navSim').attr('data-tooltip', i18n.get('#main-sim#'));
    self.$fileMenu.find('.activity-label').text(i18n.get('#main-file#'));
    self.$fileMenu.attr('data-tooltip', i18n.get('#main-file#'));
    self.$robotMenu.find('.activity-label').text(i18n.get('#main-robot#'));
    self.$robotMenu.attr('data-tooltip', i18n.get('#main-robot#'));
    self.$worldsMenu.find('.activity-label').text(i18n.get('#main-worlds#'));
    self.$worldsMenu.attr('data-tooltip', i18n.get('#main-worlds#'));
    self.$helpMenu.find('.activity-label').text(i18n.get('#main-help#'));
    self.$helpMenu.attr('data-tooltip', i18n.get('#main-help#'));
    $('#blocklyPages').find('.activity-label').text(i18n.get('#main-pages#'));
    $('#blocklyPages').attr('data-tooltip', i18n.get('#main-pages#'));
    self.$projectName.attr('placeholder', i18n.get('#main-project_name#'));
    document.getElementById('savingLabel').textContent = i18n.get('#main-saving#');

    const langNames = {
      de: 'Deutsch', el: 'Ελληνικά', en: 'English', es: 'Español',
      fr: 'Français', ko: '한국어', he: 'עברית', nl: 'Nederlands',
      pt: 'Português', tlh: 'tlhIngan', ru: 'Русский', hu: 'Magyar', it: 'Italiano'
    };
    self.$languageMenu.find('.lang-label').remove();
    self.$languageMenu.append('<span class="lang-label">' + (langNames[LANG] || LANG) + '</span>');

  };

  // Toggle language menu
  this.toggleLanguageMenu = function(e) {
    if ($('.languageMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      function setLang(lang) {
        localStorage.setItem('LANG', lang);
        window.location.reload();
      }

      const tick = '<span class="tick">&#x2713;</span> ';
      function langHtml(name, code) {
        return (LANG === code ? tick : '') + name;
      }

      let menuItems = [
        {html: langHtml('Deutsch', 'de'), line: false, callback: function() { setLang('de'); }},
        {html: langHtml('Ελληνικά', 'el'), line: false, callback: function() { setLang('el'); }},
        {html: langHtml('English', 'en'), line: false, callback: function() { setLang('en'); }},
        {html: langHtml('Español', 'es'), line: false, callback: function() { setLang('es'); }},
        {html: langHtml('Français', 'fr'), line: false, callback: function() { setLang('fr'); }},
        {html: langHtml('한국어', 'ko'), line: false, callback: function() { setLang('ko'); }},
        {html: langHtml('עברית', 'he'), line: false, callback: function() { setLang('he'); }},
        {html: langHtml('Nederlands', 'nl'), line: false, callback: function() { setLang('nl'); }},
        {html: langHtml('Português', 'pt'), line: false, callback: function() { setLang('pt'); }},
        {html: langHtml('tlhIngan', 'tlh'), line: false, callback: function() { setLang('tlh'); }},
        {html: langHtml('Русский', 'ru'), line: false, callback: function() { setLang('ru'); }},
        {html: langHtml('Magyar', 'hu'), line: false, callback: function() { setLang('hu'); }},
        {html: langHtml('Italiano', 'it'), line: false, callback: function() { setLang('it'); }},
      ];

      menuDropDown(self.$languageMenu, menuItems, {className: 'languageMenuDropDown', align: 'right'});
    }
  };

  // Open a window with a link to the arena page
  this.arenaWindow = function() {
    let options = {
      title: i18n.get('#main-arenaTitle#'),
      message: i18n.get('#main-arenaDescription#'),
      confirm: i18n.get('#main-arenaGo#')
    };
    confirmDialog(options, function(){
      self.openPage('arena.html');
    });
  };

  // Remove problematic characters then save project name to DB
  this.onProjectNameChange = function() {
    blockly.unsaved = true;
  };

  this.saveProjectName = function() {
  };

  // DB 로드 완료 전까지 autoSave 차단
  this.projectLoaded = false;

  // 읽기 전용 모드 (URL에 readonly=true 인 경우)
  this.isReadOnly = new URLSearchParams(window.location.search).get('readonly') === 'true';

  // Load project data from DB and apply to editor
  this.loadProjectFromDb = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    if (!projectId) {
      self.projectLoaded = true;
      return;
    }
    window.currentProjectId = projectId;
    try {
      const apiPath = self.isReadOnly ? '/api/projects/student/' : '/api/projects/';
      const res = await fetch(apiPath + projectId);
      if (!res.ok) return;
      const data = await res.json();
      const p = data.project;
      self.$projectName.val(p.name);
      blockly.loadFromDb(p.block_xml);
      filesManager.loadFromDb(p.python);
      if (p.robot_options) self.loadRobot(JSON.stringify(p.robot_options));
      if (p.world_options) simPanel.loadWorld(JSON.stringify({ worldName: 'custom', options: p.world_options }));
    } catch (err) {
      console.error('[DB] 프로젝트 로드 실패:', err);
    } finally {
      self.projectLoaded = true;
    }
  };

  // Save robot/world options to DB
  this.saveRobotToDb = function(robotOptionsJson) {
    if (self.isReadOnly) return;
    const projectId = window.currentProjectId;
    if (!projectId) return;
    fetch('/api/projects/' + projectId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ robot_options: JSON.parse(robotOptionsJson) })
    }).catch(err => console.error('[DB] 로봇 저장 실패:', err));
  };

  this.saveWorldToDb = function(worldJson) {
    if (self.isReadOnly) return;
    const projectId = window.currentProjectId;
    if (!projectId) return;
    const world = JSON.parse(worldJson);
    fetch('/api/projects/' + projectId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ world_options: world.options })
    }).catch(err => console.error('[DB] 월드 저장 실패:', err));
  };

  // Save robot to json file
  this.saveRobot = function() {
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:application/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(robot.options, null, 2));
    hiddenElement.target = '_blank';
    hiddenElement.download = robot.options.name + 'Robot.json';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
  };

  // Load robot
  this.loadRobot = function(json) {
    try {
      data = JSON.parse(json);

      // Is it a world file?
      if (typeof data.worldName != 'undefined') {
        showErrorModal(i18n.get('#main-invalid_robot_file_world#'));
        return;
      }

      // Is it a robot file?
      if (typeof data.bodyHeight == 'undefined') {
        showErrorModal(i18n.get('#main-invalid_robot_file_robot#'));
        return;
      }

      robot.options = data;
      let i = robotTemplates.findIndex(r => r.name == robot.options.name);
      if (i == -1) {
        robotTemplates.push({...data});
      } else {
        robotTemplates[i] = {...data};
      }
      babylon.resetScene();
      skulpt.hardInterrupt = true;
      simPanel.setRunIcon('run');
      simPanel.initSensorsPanel();
    } catch (e) {
      showErrorModal(i18n.get('#main-invalid_robot_file_json#'));
    }

  };

  // Load robot from local json file
  this.loadRobotLocal = function() {
    var hiddenElement = document.createElement('input');
    hiddenElement.type = 'file';
    hiddenElement.accept = 'application/json,.json';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
    hiddenElement.addEventListener('change', function(e){
      var reader = new FileReader();
      reader.onload = function() {
        self.loadRobot(this.result);
      };
      reader.readAsText(e.target.files[0]);
    });
  };

  // Load robot from URL
  this.loadRobotURL = function(url) {
    return fetch(url)
      .then(function(response) {
        if (response.ok) {
          return response.text();
        } else {
          toastMsg(i18n.get('#sim-not_found#'));
          return Promise.reject(new Error('invalid_robot'));
        }
      })
      .then(function(response) {
        self.loadRobot(response);
      });
  };

  // About page
  this.openAbout = function() {
    let $body = $(
      '<div class="about">' +
        '<div></div>' +
        '<h3>Credits</h3>' +
        '<p>Created by Cort @ <a href="https://aposteriori.com.sg" target="_blank">A Posteriori</a>.</p>' +
        '<p>This simulator would not have been possible without the great people behind:</p>' +
        '<ul>' +
          '<li><a href="https://www.babylonjs.com/" target="_blank">Babylon.js</a></li>' +
          '<li><a href="https://developers.google.com/blockly" target="_blank">Blockly</a></li>' +
          '<li><a href="https://ace.c9.io/" target="_blank">Ace Editor</a></li>' +
          '<li><a href="https://skulpt.org/" target="_blank">Skulpt</a></li>' +
          '<li><a href="https://github.com/kripken/ammo.js/" target="_blank">Ammo.js</a> (port of <a href="https://pybullet.org/wordpress/" target="_blank">Bullet</a>)</li>' +
        '</ul>' +
        '<p>Contributions from:</p>' +
        '<ul>' +
          '<li>Steven Murray</li>' +
          '<li>humbug99</li>' +
          '<li>Yuvix25</li>' +
        '</ul>' +
        '<p>Translations Contributed By:</p>' +
        '<ul>' +
          '<li>Français: Sébastien CANET &lt;scanet@libreduc.cc&gt;</li>' +
          '<li>Nederlands: Henry Romkes</li>' +
          '<li>Ελληνικά: <a href="https://eduact.org/en" target="_blank">Eduact</a></li>' +
          '<li>Español: edurobotic</li>' +
          '<li>Deutsch: Annette-Gymnasiums-Team (Johanna,Jule,Felix), germanicianus</li>' +
          '<li>עברית: Koby Fruchtnis</li>' +
          '<li>Русский: Pavel Khoroshevich &lt;khoroshevich.pa@gmail.com&gt;</li>' +
          '<li>Magyar: Niethammer Zoltán</li>' +
        '</ul>' +
        '<h3>Contact</h3>' +
        '<p>Please direct all complaints or requests to <a href="mailto:cort@aposteriori.com.sg">Cort</a>.</p>' +
        '<p>If you\'re in the market for STEM training, do consider <a href="https://aposteriori.com.sg" target="_blank">A Posteriori</a>.</p>' +
        '<h3>License</h3>' +
        '<p>GNU General Public License v3.0</p>' +
        '<p>Gears is a Free and Open Source Software</p>' +
      '</div>'
    );

    let $buttons = $(
      '<button type="button" class="confirm btn-success">Ok</button>'
    );

    let $dialog = dialog('About', $body, $buttons);

    $buttons.click(function(){
      console.log('f')
      $dialog.close();
    });
  };

  // Open page in new tab
  this.openPage = function(url) {
    window.open(url, '_blank');
  };

  // Toggle help
  this.toggleHelpMenu = function(e) {
    if ($('.helpMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      let menuItems = [
        {html: 'Wiki', line: false, callback: function() { self.openPage('https://github.com/QuirkyCort/gears/wiki'); }},
        {html: 'Github', line: false, callback: function() { self.openPage('https://github.com/QuirkyCort/gears'); }},
        {html: 'URL Generator', line: false, callback: function() { self.openPage('genURL.html'); }},
        {html: i18n.get('#main-whats_new#'), line: false, callback: function() { self.showWhatsNew(true); }},
        {html: i18n.get('#main-privacy#'), line: false, callback: function() { self.openPage('privacy.html'); }},
        {html: i18n.get('#main-about#'), line: true, callback: self.openAbout },
        {html: i18n.get('#main-display_fps#'), line: false, callback: simPanel.toggleFPS }
      ];
      if (simPanel.showFPS) {
        menuItems[6].html = '<span class="tick">&#x2713;</span> ' + menuItems[6].html;
      }

      menuDropDown(self.$helpMenu, menuItems, {className: 'helpMenuDropDown', align: 'activityBar'});
    }
  };

  // Select robot from templates
  this.selectRobot = function() {
    let $body = $('<div class="selectRobot"></div>');
    let $select = $('<select></select>');
    let $description = $('<div class="description"><img class="thumbnail" width="200" height="200"><div class="text"></div></div>');
    let $configurations = $('<div class="configurations"></div>');

    function displayRobotDescriptions(robot) {
      $description.find('.text').html(i18n.get(robot.longDescription));
      if (robot.thumbnail) {
        $description.find('.thumbnail').attr('src', robot.thumbnail);
      } else {
        $description.find('.thumbnail').attr('src', 'images/robots/default_thumbnail.png');
      }

      $configurations.html(i18n.replace(robot.longerDescription));
    }

    robotTemplates.forEach(function(robotTemplate){
      let $robot = $('<option></option>');
      $robot.prop('value', robotTemplate.name);
      $robot.text(i18n.get(robotTemplate.shortDescription));
      if (robotTemplate.name == robot.options.name) {
        $robot.attr('selected', 'selected');
        displayRobotDescriptions(robotTemplate);
      }
      $select.append($robot);
    });

    $body.append($select);
    $body.append($description);
    $body.append($configurations);

    $select.change(function(){
      let robotTemplate = robotTemplates.find(robotTemplate => robotTemplate.name == $select.val());
      displayRobotDescriptions(robotTemplate);
    });

    let $buttons = $(
      '<button type="button" class="cancel btn-light">Cancel</button>' +
      '<button type="button" class="confirm btn-success">Ok</button>'
    );

    let $dialog = dialog(i18n.get('#main-select_robot#'), $body, $buttons);

    $buttons.siblings('.cancel').click(function() { $dialog.close(); });
    $buttons.siblings('.confirm').click(function(){
      robot.options = {};
      Object.assign(robot.options, robotTemplates.find(robotTemplate => robotTemplate.name == $select.val()));
      babylon.resetScene();
      skulpt.hardInterrupt = true;
      simPanel.setRunIcon('run');
      simPanel.initSensorsPanel();
      $dialog.close();
    });
  };

  // Display current position
  this.displayPosition = function() {
    let x = Math.round(robot.body.position.x * 10) / 10;
    let y = Math.round(robot.body.position.z * 10) / 10;
    let angles = robot.body.absoluteRotationQuaternion.toEulerAngles();
    let rot = Math.round(angles.y / Math.PI * 1800) / 10;

    acknowledgeDialog({
      title: i18n.get('#main-robot_position#'),
      message: $(
        '<p>' + i18n.get('#main-position#') + ': ' + x + ', ' + y + '</p>' +
        '<p>' + i18n.get('#main-rotation#') + ': ' + rot + ' ' + i18n.get('#main-degrees#') + '</p>'
      )
    })
  };

  // Save current position
  this.savePosition = function() {
    let x = Math.round(robot.body.position.x * 10) / 10;
    let y = Math.round(robot.body.position.z * 10) / 10;
    let angles = robot.body.absoluteRotationQuaternion.toEulerAngles();
    let rot = Math.round(angles.y / Math.PI * 1800) / 10;

    if (typeof babylon.world.defaultOptions.startPosXYZStr != 'undefined') {
      babylon.world.options.startPosXYZStr = x + ',' +y;
    } else if (typeof babylon.world.defaultOptions.startPosXY != 'undefined') {
      babylon.world.options.startPosXY = x + ',' +y;
    } else {
      toastMsg(i18n.get('#main-cannot_save_position#'));
      return;
    }
    if (typeof babylon.world.defaultOptions.startRotStr != 'undefined') {
      babylon.world.options.startRotStr = rot.toString();
    } else if (typeof babylon.world.defaultOptions.startRot != 'undefined') {
      babylon.world.options.startRot = rot.toString();
    } else {
      toastMsg(i18n.get('#main-cannot_save_rotation#'));
    }
    babylon.world.setOptions();
  };

  // Clear current position
  this.clearPosition = function() {
    if (babylon.world.options.startPosXY) {
      babylon.world.options.startPosXY = '';
    }
    if (babylon.world.options.startRot) {
      babylon.world.options.startRot = '';
    }
    babylon.world.setOptions();
  };

  // Open a window with a link to the robot configurator page
  this.configuratorWindow = function() {
    let options = {
      title: i18n.get('#main-configurator_title#'),
      message: i18n.get('#main-configurator_description#'),
      confirm: i18n.get('#main-configurator_go#')
    };
    confirmDialog(options, function(){
      self.openPage('configurator.html');
    });
  };

  // Open a window with a link to the world builder page
  this.worldBuilderWindow = function() {
    let options = {
      title: i18n.get('#main-worldBuilder_title#'),
      message: i18n.get('#main-worldBuilder_description#'),
      confirm: i18n.get('#main-worldBuilder_go#')
    };
    confirmDialog(options, function(){
      self.openPage('builder.html');
    });
  };

  // Toggle robot menu
  this.toggleRobotMenu = function(e) {
    if ($('.robotMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      let menuItems = [
        {html: i18n.get('#main-select_robot#'), line: false, callback: self.selectRobot},
        {html: i18n.get('#main-robot_configurator#'), line: true, callback: self.configuratorWindow},
        {html: i18n.get('#main-robot_load_file#'), line: false, callback: self.loadRobotLocal},
        {html: i18n.get('#main-robot_save_file#'), line: true, callback: self.saveRobot},
        {html: '내 로봇 불러오기', line: true, callback: self.loadRobotFromDb},
        {html: i18n.get('#main-display_position#'), line: false, callback: self.displayPosition},
        {html: i18n.get('#main-save_position#'), line: false, callback: self.savePosition},
        {html: i18n.get('#main-clear_position#'), line: false, callback: self.clearPosition},
      ];

      menuDropDown(self.$robotMenu, menuItems, {className: 'robotMenuDropDown', align: 'activityBar'});
    }
  };

  // Load robot from DB (user's saved robots)
  this.loadRobotFromDb = async function() {
    let $body = $('<div class="dbRobotList"></div>');
    let $grid = $('<div class="dbRobotGrid"></div>');
    let $empty = $('<div class="dbRobotEmpty">저장된 로봇이 없습니다.</div>').hide();
    $body.append($grid).append($empty);

    let $footerBtns = $(
      '<button type="button" class="push-left btn-light">기본 로봇으로 초기화</button>' +
      '<button type="button" class="btn-light close-btn">닫기</button>'
    );
    let $dialog = dialog('내 로봇 불러오기', $body, $footerBtns);
    $footerBtns.siblings('.push-left').click(function() {
      robot.options = JSON.parse(JSON.stringify(defaultRobotOptions));
      main.saveRobotToDb(JSON.stringify(robot.options));
      babylon.resetScene();
      skulpt.hardInterrupt = true;
      simPanel.setRunIcon('run');
      simPanel.initSensorsPanel();
      $dialog.close();
    });
    $footerBtns.siblings('.close-btn').click(function() { $dialog.close(); });

    try {
      const res = await fetch('/api/robots');
      if (!res.ok) throw new Error();
      const { robots } = await res.json();

      if (robots.length === 0) {
        $grid.hide();
        $empty.show();
        return;
      }

      robots.forEach(function(r) {
        let $row = $('<div class="dbRobotRow"></div>');
        let $img = $('<img class="dbRobotThumb">');
        $img.attr('src', r.thumbnail || 'images/robots/default_thumbnail.png');
        let $name = $('<div class="dbRobotName"></div>').text(r.name);
        let $btns = $('<div class="dbRobotBtns"></div>');
        let $selectBtn = $('<button class="dbRobotSelectBtn">불러오기</button>');
        let $deleteBtn = $('<button class="dbRobotDeleteBtn"><span class="material-symbols-rounded">delete</span></button>');
        $btns.append($selectBtn).append($deleteBtn);
        $row.append($img).append($name).append($btns);
        $selectBtn.click(function() {
          const robotJson = JSON.stringify(r.options);
          main.loadRobot(robotJson);
          main.saveRobotToDb(robotJson);
          $dialog.close();
        });
        $deleteBtn.click(function() {
          fetch('/api/robots/' + r.id, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
              if (data.ok) $row.remove();
              if ($grid.children().length === 0) { $grid.hide(); $empty.show(); }
            })
            .catch(() => showErrorModal('로봇 삭제에 실패했습니다.'));
        });
        $grid.append($row);
      });
    } catch (e) {
      $grid.hide();
      $empty.text('로봇 목록을 불러오는 데 실패했습니다.').show();
    }
  };

  // Load world from DB (user's saved worlds)
  this.loadWorldFromDb = async function() {
    let $body = $('<div class="dbWorldList"></div>');
    let $grid = $('<div class="dbWorldGrid"></div>');
    let $empty = $('<div class="dbWorldEmpty">저장된 월드가 없습니다.</div>').hide();
    $body.append($grid).append($empty);

    let $footerBtns = $(
      '<button type="button" class="push-left btn-light">기본 월드로 초기화</button>' +
      '<button type="button" class="btn-light close-btn">닫기</button>'
    );
    let $dialog = dialog('내 월드 불러오기', $body, $footerBtns);
    $footerBtns.siblings('.push-left').click(function() {
      babylon.world = worlds[0];
      simPanel.worldOptionsSetting = {};
      simPanel.resetSim().then(function() {
        const worldJson = JSON.stringify({ worldName: babylon.world.name, options: babylon.world.options });
        main.saveWorldToDb(worldJson);
      });
      $dialog.close();
    });
    $footerBtns.siblings('.close-btn').click(function() { $dialog.close(); });

    try {
      const res = await fetch('/api/worlds');
      if (!res.ok) throw new Error();
      const { worlds: savedWorlds } = await res.json();

      if (savedWorlds.length === 0) {
        $grid.hide();
        $empty.show();
        return;
      }

      savedWorlds.forEach(function(w) {
        let $row = $('<div class="dbWorldRow"></div>');
        let $img = $('<img class="dbWorldThumb">');
        $img.attr('src', w.thumbnail || 'images/worlds/default_thumbnail.png');
        let $name = $('<div class="dbWorldName"></div>').text(w.name);
        let $btns = $('<div class="dbWorldBtns"></div>');
        let $selectBtn = $('<button class="dbWorldSelectBtn">불러오기</button>');
        let $deleteBtn = $('<button class="dbWorldDeleteBtn"><span class="material-symbols-rounded">delete</span></button>');
        $btns.append($selectBtn).append($deleteBtn);
        $row.append($img).append($name).append($btns);
        $selectBtn.click(async function() {
          try {
            const r = await fetch('/api/worlds/' + w.id);
            if (!r.ok) throw new Error();
            const { world } = await r.json();
            const worldJson = JSON.stringify({ worldName: 'custom', options: world.options });
            simPanel.loadWorld(worldJson);
            main.saveWorldToDb(worldJson);
            $dialog.close();
          } catch (e) {
            showErrorModal('월드를 불러오는 데 실패했습니다.');
          }
        });
        $deleteBtn.click(function() {
          fetch('/api/worlds/' + w.id, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
              if (data.ok) $row.remove();
              if ($grid.children().length === 0) { $grid.hide(); $empty.show(); }
            })
            .catch(() => showErrorModal('월드 삭제에 실패했습니다.'));
        });
        $grid.append($row);
      });
    } catch (e) {
      $grid.hide();
      $empty.text('월드 목록을 불러오는 데 실패했습니다.').show();
    }
  };

  // Toggle worlds menu
  this.toggleWorldsMenu = function(e) {
    if ($('.worldsMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      let menuItems = [
        {html: i18n.get('#main-select_world#'), line: false, callback: simPanel.selectWorld},
        {html: i18n.get('#main-world_builder#'), line: false, callback: self.worldBuilderWindow},
        {html: i18n.get('#main-arena#'), line: true, callback: self.arenaWindow},
        {html: i18n.get('#main-world_load_file#'), line: false, callback: simPanel.loadWorldLocal},
        {html: i18n.get('#main-world_save_file#'), line: false, callback: simPanel.saveWorld},
        {html: '내 월드 불러오기', line: false, callback: self.loadWorldFromDb},
      ];

      menuDropDown(self.$worldsMenu, menuItems, {className: 'worldsMenuDropDown', align: 'activityBar'});
    }
  };

  // Toggle python
  this.togglePythonMenu = function(e) {
    if ($('.pythonMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      let menuItems = [
        {html: 'Ev3dev Mode', line: false, callback: self.switchToEv3dev},
        {html: 'Pybricks Mode', line: true, callback: self.switchToPybricks},
        {html: 'Zoom In', line: false, callback: pythonPanel.zoomIn},
        {html: 'Zoom Out', line: false, callback: pythonPanel.zoomOut},
        {html: 'Reset Zoom', line: false, callback: pythonPanel.zoomReset},
      ];
      var tickIndex;
      if (blockly.generator == ev3dev2_generator) {
        tickIndex = 0;
      } else if (blockly.generator == pybricks_generator) {
        tickIndex = 1;
      }
      menuItems[tickIndex].html = '<span class="tick">&#x2713;</span> ' + menuItems[tickIndex].html;

      menuDropDown(self.$pythonMenu, menuItems, {className: 'pythonMenuDropDown', align: 'activityBar'});
    }
  };

  // switch to ev3dev
  this.switchToEv3dev = function() {
    blockly.generator = ev3dev2_generator;
    blockly.generator.load();
    // if (! pythonPanel.modified) {
    if (! filesManager.modified) {
      pythonPanel.loadPythonFromBlockly();
    }
  };

  // switch to pybricks
  this.switchToPybricks = function() {
    blockly.generator = pybricks_generator;
    blockly.generator.load();
    // if (! pythonPanel.modified) {
    if (! filesManager.modified) {
      pythonPanel.loadPythonFromBlockly();
    }
  };

  // Toggle filemenu
  this.toggleFileMenu = function(e) {
    if ($('.fileMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      let menuItems = [
        {html: '프로젝트 저장', line: true, callback: self.saveNow},
        {html: i18n.get('#main-new_program#'), line: true, callback: self.newProgram},
        {html: i18n.get('#main-load_blocks#'), line: false, callback: self.loadFromComputer},
        {html: i18n.get('#main-import_functions#'), line: false, callback: self.importFunctionsFromFile},
        {html: i18n.get('#main-save_blocks#'), line: true, callback: self.saveToComputer},
        {html: i18n.get('#main-load_python#'), line: false, callback: self.loadPythonFromComputer},
        {html: i18n.get('#main-save_python#'), line: true, callback: self.savePythonToComputer},
        {html: i18n.get('#main-export_zip#'), line: false, callback: self.saveZipToComputer},
        {html: i18n.get('#main-import_zip#'), line: false, callback: self.loadZipFromComputer}
      ];

      menuDropDown(self.$fileMenu, menuItems, {className: 'fileMenuDropDown', align: 'activityBar'});
    }
  };

  // New program
  this.newProgram = function() {
    confirmDialog(i18n.get('#main-start_new_warning#'), function() {
      blockly.loadDefaultWorkspace();
      filesManager.modified = false;
      blocklyPanel.setDisable(false);
      self.$projectName.val('');
      self.saveProjectName();
    });
  };

  // save Zip to computer
  this.saveZipToComputer = function() {
    let filename = self.$projectName.val();
    if (filename.trim() == '') {
      filename = 'gearsBot';
    }

    let meta = {
      name: filename,
      pythonModified: filesManager.modified
    };

    var zip = new JSZip();
    zip.file('gearsBlocks.xml', blockly.getXmlText());
    if (filesManager.modified) {
      for (let filename in filesManager.files) {
        zip.file(filename, filesManager.files[filename]);
      };
    } else {
      zip.file('main.py', blockly.generator.genCode());
    }

    zip.file('gearsRobot.json', JSON.stringify(robot.options, null, 2));
    zip.file('meta.json', JSON.stringify(meta, null, 2));

    zip.generateAsync({type:'base64'})
    .then(function(content) {
      self.downloadFile(filename + '.zip', content, 'application/xml');
    });
  };

  this.loadZipFromComputer = function() {
    var hiddenElement = document.createElement('input');
    hiddenElement.type = 'file';
    hiddenElement.accept = 'application/zip,.zip';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
    hiddenElement.addEventListener('change', function(e){
      var file = e.target.files[0];
      if (file) {
        var reader = new FileReader();

        reader.onload = function(e) {
          JSZip.loadAsync(e.target.result)
            .then(async function(zip) {
              filesManager.deleteAll();

              let pythonModified = true;
              if ('meta.json' in zip.files) {
                const metaParams = await loadFile(zip, 'meta.json');
                const meta = JSON.parse(metaParams);

                pythonModified = meta.pythonModified;
                self.$projectName.val(meta.name);
                self.saveProjectName();
              }

              if ('gearsBlocks.xml' in zip.files) {
                const xmlText = await loadFile(zip, 'gearsBlocks.xml');
                blockly.loadXmlText(xmlText);
              }

              if ('gearsRobot.json' in zip.files) {
                const robotConf = await loadFile(zip, 'gearsRobot.json')
                self.loadRobot(robotConf)
              }

              // Load Python files
              for (filename in zip.files) {
                if (filename.endsWith('.py')) {
                  const pythonCode = await loadFile(zip, filename);
                  if (filename == 'gearsPython.py') {
                    filename = 'main.py';
                  }
                  filesManager.add(filename, pythonCode);
                }
              }

              filesManager.modified = pythonModified;
              if (pythonModified) {
                blocklyPanel.setDisable(true);
                filesManager.unsaved = true;
                filesManager.saveLocalStorage();
              }
            })
            .catch(function(err) {
              console.error('JSZip error:', err);
              showErrorModal(i18n.get('#main-invalid_zip_package#'));
            });
        };

        async function loadFile(zip, filename) {
          const file = zip.file(filename);
          if (file) {
            return await file.async('text');
          }
          console.warn('File not found in zip:', filename);
          return null;
        }

        reader.onerror = function(err) {
          console.error('FileReader error:', err);
          alert('Failed to read file.');
        };

        reader.readAsArrayBuffer(file);
      } else {
        console.log('No file selected.');
      }
    });
  };

  // save to computer
  this.saveToComputer = function() {
    let filename = self.$projectName.val();
    if (filename.trim() == '') {
      filename = 'gearsBot';
    }
    self.downloadFile(filename + '.xml', encodeURIComponent(blockly.getXmlText()), 'application/xml;', encoding='charset=UTF-8');
  };

  // import functions from file
  this.importFunctionsFromFile = function() {
    var hiddenElement = document.createElement('input');
    hiddenElement.type = 'file';
    hiddenElement.accept = 'application/xml,.xml';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
    hiddenElement.addEventListener('change', function(e){
      var reader = new FileReader();
      reader.onload = function() {
        blockly.importXmlTextFunctions(this.result);
        toastMsg(i18n.get('#main-functions_imported'));
      };
      reader.readAsText(e.target.files[0]);
    });
  };

  // load from computer
  this.loadFromComputer = function() {
    var hiddenElement = document.createElement('input');
    hiddenElement.type = 'file';
    hiddenElement.accept = 'application/xml,.xml';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
    hiddenElement.addEventListener('change', function(e){
      var reader = new FileReader();
      reader.onload = function() {
        blockly.loadXmlText(this.result);
      };
      reader.readAsText(e.target.files[0]);
      let filename = e.target.files[0].name.replace(/.xml/, '');
      self.$projectName.val(filename);
      self.saveProjectName();
    });
  };

  // Download to single file
  this.downloadFile = function(filename, content, mimetype, encoding='base64') {
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:' + mimetype + ';' + encoding + ',' + content;
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.dispatchEvent(new MouseEvent('click'));
  }

  // Download to zip file
  this.downloadZipFile = function(filename, files) {
    var zip = new JSZip();
    for (let f in files) {
      zip.file(f, files[f]);
    }

    zip.generateAsync({
      type:'base64',
      compression: "DEFLATE"
    })
    .then(function(content) {
      self.downloadFile(filename + '.zip', content, 'application/zip');
    });
  }

  // save to computer
  this.savePythonToComputer = async function() {
    let filename = self.$projectName.val();
    if (filename.trim() == '') {
      filename = 'gearsBot';
    }

    if (filesManager.modified == false) {
      await pythonPanel.loadPythonFromBlockly();
    }
    filesManager.updateCurrentFile();

    self.downloadZipFile(filename, filesManager.files);
  };

  this.loadPythonFromComputer = function() {
    var hiddenElement = document.createElement('input');
    hiddenElement.type = 'file';
    hiddenElement.accept = 'text/x-python,.py,application/zip,.zip';
    hiddenElement.dispatchEvent(new MouseEvent('click'));
    hiddenElement.addEventListener('change', function(e){
      let filename = e.target.files[0].name;
      if (filename.endsWith('.zip')) {
        self.loadPythonFromComputerZip(e);
      } else {
        self.loadSinglePythonFile(e);
      }
      self.$projectName.val(filename.replace(/\.py$/, ''));
      self.saveProjectName();
    });
  };

  this.loadPythonFromComputerZip = function(e) {
    async function loadFiles(zip) {
      filesManager.deleteAll();

      let filenames = [];
      zip.forEach(function(path, file) {
        filenames.push(path);
      });

      if (! filenames.includes('main.py') && ! filenames.includes('gearsPython.py')) {
        console.log('No main.py or gearsPython.py in zip archive');
        throw new Error();
      }

      for (let filename of filenames) {
        if (filename.endsWith('.py')) {
          await zip.file(filename).async('string')
            .then(function(content){
              if (filename == 'gearsPython.py') {
                filename = 'main.py';
              }
              filesManager.add(filename, content);
            });
        }
      }

      filesManager.modified = true;
      filesManager.unsaved = true;
      filesManager.saveLocalStorage();
      self.tabClicked('navPython');
    }

    JSZip.loadAsync(e.target.files[0])
      .then(loadFiles)
      .catch(error => showErrorModal(i18n.get('#main-invalid_python_file#')));
  }

  this.loadSinglePythonFile = function(e) {
    var reader = new FileReader();
    reader.onload = function() {
      filesManager.deleteAll()
      filesManager.add('main.py', this.result);
      filesManager.modified = true;
      filesManager.unsaved = true;
      filesManager.saveLocalStorage();

      self.tabClicked('navPython');
      pythonPanel.warnModify();
    };
    reader.onerror = function() {
      console.log(reader.error);
    };
    reader.readAsText(e.target.files[0]);
  };

  // 수동 저장 — unsaved 조건 무시하고 강제 저장
  this.saveNow = function() {
    if (self.isReadOnly) return;
    const projectId = window.currentProjectId;
    if (!projectId) return;

    blockly.saveLocalStorage();
    filesManager.updateCurrentFile();
    if (!filesManager.modified) {
      filesManager.files['main.py'] = blockly.generator.genCode();
    }
    filesManager.saveToDb();

    self.saveProjectName();
    const payload = {
      name: self.$projectName.val(),
      block_xml: blockly.getXmlText(),
      python: filesManager.files
    };

    self.showSaving();
    fetch('/api/projects/' + projectId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(() => self.hideSaving())
    .catch(err => { console.error('[DB] 저장 실패:', err); self.hideSaving(); });
  };

  // 통합 자동저장 — block_xml + python 한 번에 저장
  this.autoSave = function() {
    if (self.isReadOnly) return;
    if (!self.projectLoaded) return;
    const projectId = window.currentProjectId;
    if (!projectId) return;
    const pythonEmpty = !filesManager.files['main.py'] || filesManager.files['main.py'].trim() === '';
    if (!blockly.unsaved && !filesManager.unsaved && !pythonEmpty) return;

    blockly.saveLocalStorage();
    filesManager.updateCurrentFile();
    if (!filesManager.modified || pythonEmpty) {
      filesManager.files['main.py'] = blockly.generator.genCode();
    }
    filesManager.saveToDb();

    self.saveProjectName();
    const payload = {
      name: self.$projectName.val(),
      block_xml: blockly.getXmlText(),
      python: filesManager.files
    };

    self.showSaving();
    fetch('/api/projects/' + projectId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(() => self.hideSaving())
    .catch(err => { console.error('[DB] 자동저장 실패:', err); self.hideSaving(); });
  };

  this._hideTimer = null;
  this._showStart = 0;

  this.showSaving = function() {
    const el = document.getElementById('savingIndicator');
    const label = document.getElementById('savingLabel');
    clearTimeout(self._hideTimer);
    el.classList.remove('hide', 'saved');
    label.textContent = i18n.get('#main-saving#');
    self._showStart = Date.now();
  };

  this.hideSaving = function() {
    const elapsed = Date.now() - self._showStart;
    const delay = Math.max(0, 800 - elapsed);
    clearTimeout(self._hideTimer);
    self._hideTimer = setTimeout(function() {
      const el = document.getElementById('savingIndicator');
      const label = document.getElementById('savingLabel');
      label.textContent = i18n.get('#main-saved#');
      el.classList.add('saved');
      self._hideTimer = setTimeout(function() {
        el.classList.add('hide');
      }, 1500);
    }, delay);
  };

  // 탭 닫기 전 미저장 변경사항 즉시 전송 (sendBeacon — 탭 닫혀도 보장)
  this.checkUnsaved = function() {
    const projectId = window.currentProjectId;
    if (!projectId) return;
    const pythonEmpty = !filesManager.files['main.py'] || filesManager.files['main.py'].trim() === '';
    if (!blockly.unsaved && !filesManager.unsaved && !pythonEmpty) return;

    blockly.saveLocalStorage();
    filesManager.updateCurrentFile();
    if (!filesManager.modified || pythonEmpty) {
      filesManager.files['main.py'] = blockly.generator.genCode();
    }
    filesManager.saveToDb();

    self.saveProjectName();
    const payload = {
      name: self.$projectName.val(),
      block_xml: blockly.getXmlText(),
      python: filesManager.files
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/projects/' + projectId, blob);
  };

  // Clicked on tab
  this.tabClicked = function(tabNav) {
    if (typeof tabNav == 'string') {
      var match = tabNav;
    } else {
      var match = $(this)[0].id;
    }

    // Close split view when switching to full-screen Sim tab
    // Hide split visually when going to full-screen Sim, keep flag intact
    if (match === 'navSim') {
      $('.panels').removeClass('splitSim');
      $('#simPanel').removeClass('splitActive');
      $('.panels').removeClass('pythonSplitSim');
      $('#simPanel').removeClass('pythonSplitActive');
    }

    // When leaving Python tab, hide python sim split and reset AI Tutor state
    if (match !== 'navPython') {
      if ($('.panels').hasClass('pythonSplitSim')) {
        if (!skulpt.running) {
          babylon.engine.stopRenderLoop();
        }
      }
      // Always clean up python split state
      $('.panels').removeClass('pythonSplitSim');
      $('#simPanel').removeClass('pythonSplitActive');
      // Reset pythonSplitToggle to AI Tutor mode regardless of previous state
      $('#aiTutorPanel').removeClass('hide');
      $('#pythonSplitToggle .toggleSimIcon').addClass('hide').removeClass('active');
      $('#pythonSplitToggle .toggleTutorIcon').removeClass('hide').addClass('active');
      $('#pythonSplitToggle').removeClass('simMode');
    }

    // Show toggle buttons by tab
    if (match === 'navBlocks') {
      $('#simSplitToggle').show();
      $('#pythonSplitToggle').hide();
    } else if (match === 'navPython') {
      $('#simSplitToggle').hide();
      $('#pythonSplitToggle').show();
    } else {
      $('#simSplitToggle').hide();
      $('#pythonSplitToggle').hide();
    }

    function getPanelByNav(nav) {
      if (nav == 'navBlocks') {
        return blocklyPanel;
      } else if (nav == 'navPython') {
        return pythonPanel;
      } else if (nav == 'navSim') {
        return simPanel;
      }
    };

    // when deleting a python module, inActiveNav and inActive will be undefined
    inActiveNav = self.$navs.siblings('.active').attr('id');
    inActive = getPanelByNav(inActiveNav);
    active = getPanelByNav(match);

    self.$navs.removeClass('active');
    $('#' + match).addClass('active');

    self.$panels.removeClass('active');
    self.$panels.siblings('[aria-labelledby="' + match + '"]').addClass('active');

    self.$panelControls.removeClass('active');
    self.$panelControls.siblings('[aria-labelledby="' + match + '"]').addClass('active');

    if ((inActive !== undefined) &&
        (typeof inActive.onInActive == 'function')) {
      inActive.onInActive();
    }
    if (typeof active.onActive == 'function') {
      active.onActive();
    }
  };

  this.showDialog = function(title, message) {
    let options = {
      title: title,
      message: message
    }
    acknowledgeDialog(options, function(){});
  }

  // Display what's new if not seen before
  this.showWhatsNew = function(forceShow=false) {
    return;
    let current = 20260203;
    let lastShown = localStorage.getItem('whatsNew');
    if (lastShown == null || parseInt(lastShown) < current || forceShow) {
      let options = {
        title: 'What\'s New',
        message:
          '<h3>3 Feb 2026 (WRO Future Engineer)</h3>' +
          '<p>' +
            'Added the playfield for WRO Future Engineer (2025 Playfield). ' +
            'Find it under "Worlds => Select World => Missions". ' +
            'See <a href="https://youtu.be/jc1r_H7WTIU" target="_blank">this YouTube video</a> for a demo.' +
          '</p>' +
          '<h3>31 Jan 2026 (WRO RoboSport)</h3>' +
          '<p>' +
            'Added the playfield for WRO RoboSport (2025 Playfield). ' +
            'Find it under "Worlds => Select World => Missions". ' +
            'Also available in the multi-robot arena.' +
            'See <a href="https://youtu.be/wz15pH2amHY" target="_blank">this YouTube video</a> for a demo.' +
          '</p>' +
          '<p>' +
            'A sample robot for the RoboSport challenge has also been added. ' +
            'Find it under "Robot => Select Robot => WRO RoboSport". ' +
          '</p>' +
          '<h3>22 Jan 2026 (WRO 2026)</h3>' +
          '<p>' +
            'Added the playfield for WRO 2026 Robomission Junior. ' +
            'Find it under "Worlds => Select World => Missions". ' +
            'All robomission plafields (Elementary, Junior, and Senior) are now available.' +
          '</p>'
      }
      acknowledgeDialog(options, function(){
        localStorage.setItem('whatsNew', current);
      });
    }
  };

  // Display news
  this.showNews = function() {
    let options = {
      title: 'News',
      message:
        '<h3>Open MINT Masters</h3>' +
        '<p>' +
        'Registration for the online Open MINT Masters is open for teams of up to 5 pax, age 10 to 19. ' +
        'The event is open to all teams around the world and registration closes on 31 May 2022.' +
        '</p><p>' +
        '<a href="http://m-learning.info" target="_blank">Find out more and register here.</a> (Site is in German, but readable via Google translate on Chrome.)' +
        '</p>'
    }
    acknowledgeDialog(options);
  };
}

// Init class
main.init();


