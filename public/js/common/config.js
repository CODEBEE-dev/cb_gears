var appConfig = new function() {
    this.logo = 'codebridgeai_favicon.png';
    this.name = 'Bridge Bot';

    var self = this;

    document.addEventListener('DOMContentLoaded', function() {
        var logoEl = document.querySelector('header .gearsIcon');
        if (logoEl) logoEl.src = self.logo;

        var nameEl = document.querySelector('header .appName');
        if (nameEl) {
            var nameSuffix = nameEl.textContent.trim();
            nameEl.textContent = nameSuffix ? self.name + ' ' + nameSuffix : self.name;
        }

        var favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.href = self.logo;

        var pageSuffix = document.title.trim();
        document.title = pageSuffix ? self.name + ' ' + pageSuffix : self.name;
    });
};
