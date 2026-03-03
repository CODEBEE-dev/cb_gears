Gears
===
Generic Educational Autonomous Robotics Simulator

This simulator was created to allow anyone to experiment with robotics without owning a robot.

Try it out at https://gears.aposteriori.com.sg

...or the latest version from github https://quirkycort.github.io/gears/public/

It uses the Ev3dev api (...and some early support for Pybricks), so the code can run on an actual Lego Mindstorm EV3 if you have one.

Installation
---

The simulator is meant to be served through a webserver, and we maintain the site at https://gears.aposteriori.com.sg free for anyone to use.

If you wish to run your own local copy, download all files and put them in a directory on your server and that should be it.
Due to CORS protection on web browsers, it will not work when served from a "file://" URL.

Without a Webserver
---

If you do not have a webserver, but have Python3 installed on your computer, you can try...

1. Download Gears from https://github.com/QuirkyCort/gears/archive/refs/heads/master.zip
2. Change to the "gears/public" directory
3. Run `python -m http.server 1337`
Do not close the window with the Python command running.

This should get the site running on http://localhost:1337 (...try http://127.0.0.1:1337 if that doesn't work).

The site may also be available to other users on the same network using http://your_IP_address:1337, where "your_IP_address" is replaced with your actual IP address.
This may not work depending on your network configuration and your firewall settings.

If you do not wish to allow other users from accessing the site, you should run `python -m http.server 1337 --bind 127.0.0.1` instead.

UI 커스터마이징
---

### 색상 / 테마 변경

`scss/_variables.scss` 파일에서 CSS 변수를 수정하면 전체 UI에 반영됩니다.

```scss
:root {
  --color-primary:       #4994FB;  /* 헤더, 활성 탭, 다이얼로그 색상 */
  --color-primary-light: #76AFFC;  /* 입력창 배경 */
  --color-primary-dark:  #5781BA;  /* 입력창 테두리 */
  --color-bg:            #E4F0FE;  /* 페이지 배경 */
  --color-tab-inactive:  #D9E3F1;  /* 비활성 탭 */
  --color-border:        #bbbbbb;  /* 공통 테두리 */
  --color-text-muted:    #999999;  /* 비활성 텍스트 */
  --color-placeholder:   #95989A;  /* placeholder */
  --header-height:       2.2em;    /* 헤더 높이 */
  --python-bg:           #2F3129;  /* Python 에디터 배경 */
}
```

### 앱 이름 / 로고 변경

`public/js/common/config.js` 파일에서 수정합니다.

```js
this.logo = 'codebridgeai_favicon.png';  // 로고 이미지 파일명
this.name = 'Bridge Bot';                // 앱 이름
```

### CSS 수정

> ⚠️ **`public/css/main.css` 는 직접 편집합니다. SCSS 빌드로 덮어쓰지 마세요.**
>
> `scss/main.scss` 는 과거 버전의 소스 파일로, 현재 `main.css` 와 내용이 다릅니다.
> 빌드하면 헤더, 액티비티바, Blockly 테마 등 현재 작업이 모두 사라집니다.

UI 스타일 수정은 `public/css/main.css` 를 직접 편집하세요.

### widgets.css 재컴파일 (필요 시)

`scss/widgets.scss` 수정 후에만 아래 명령어를 사용합니다.

**1회 컴파일:**
```bash
npx sass --no-source-map scss/widgets.scss:public/css/widgets.css
```

**파일 변경 감지 자동 컴파일:**
```bash
bash sass_watch.sh
```

Credits
---
Created by A Posteriori (https://aposteriori.com.sg).

Other Contributors:

Steven Murray
* Football Arena
* ObjectTracker
* Improvements to magnet
* Wheel Actuators

humbug99
* Pen
* Multiple Python modules tabs

Yuvix25
* FLL Mission models

This simulator would not have been possible without the great people behind:

* Babylon.js https://babylonjs.org
* Blockly https://developers.google.com/blockly
* Skulpt https://skulpt.org
* Ace https://ace.c9.io
* Ammo.js https://github.com/kripken/ammo.js/ (port of Bullet https://pybullet.org/)

Translations by:

* Français: Sébastien CANET <scanet@libreduc.cc>
* Nederlands: Henry Romkes
* Ελληνικά: Eduact, https://eduact.org/en
* Español: edurobotic
* Deutsch: Annette-Gymnasiums-Team (Johanna,Jule,Felix), germanicianus
* Português: [Mateus Lima](https://github.com/martelima)
* Italiano: [Mateus Lima](https://github.com/martelima)
* עברית: Koby Fruchtnis
  

License
---
GNU General Public License v3.0

The following Open Source software are included here for convenience.
Please refer to their respective websites for license information.

* Babylon.js
* Blockly
* Ace Editor
* Skulpt
* Ammo.js
* Cannon.js
* Oimo.js
* Pep
* Jquery
* JSZip
