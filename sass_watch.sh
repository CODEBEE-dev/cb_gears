#!/bin/bash

# ⚠️  주의: public/css/main.css 는 SCSS 빌드 대상에서 제외됩니다.
# main.css 는 직접 편집하는 파일입니다. scss/main.scss 로 덮어쓰지 마세요.
# widgets.css 만 SCSS 빌드 대상입니다.

pushd scss
sass --sourcemap=none --watch widgets.scss:../public/css/widgets.css
popd
