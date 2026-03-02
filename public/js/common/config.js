var appConfig = new function() {
    this.logo = 'codebridgeai_favicon.png';
    this.name = 'Bridge Bot';

    var self = this;

    // 헤더를 렌더링합니다.
    // options.suffix  : 앱 이름 뒤에 붙는 페이지 제목 (예: 'World Builder')
    // options.extra   : 헤더 안에 추가할 HTML 문자열 (예: input, language 선택 등)
    this.renderHeader = function(options) {
        options = options || {};
        var suffix = options.suffix || '';
        var extra = options.extra || '';
        var displayName = suffix ? self.name + ' ' + suffix : self.name;

        var headerEl = document.querySelector('header');
        if (!headerEl) return;

        headerEl.innerHTML =
            '<img class="gearsIcon" src="' + self.logo + '">' +
            '<div class="appName">' + displayName + '</div>' +
            extra;

        var favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.href = self.logo;

        document.title = displayName;
    };
};
