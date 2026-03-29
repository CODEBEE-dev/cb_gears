document.addEventListener('DOMContentLoaded', function() {
  var menu = document.getElementById('hamburgerMenu');
  if (!menu) return;

  var homeLink = menu.querySelector('.hamburger-dropdown a[href="/"]');
  if (homeLink && typeof i18n !== 'undefined') {
    var icon = homeLink.querySelector('span');
    homeLink.textContent = i18n.get('#main-home#');
    if (icon) homeLink.prepend(icon);
  }

  var adminLink = document.getElementById('adminMenuLink');
  if (adminLink && typeof i18n !== 'undefined') {
    var adminIcon = adminLink.querySelector('span');
    adminLink.textContent = i18n.get('#nav-admin#');
    if (adminIcon) adminLink.prepend(adminIcon);
  }

  // admin 링크 role 조건부 표시
  fetch('/auth/me').then(function(r) { return r.json(); }).then(function(data) {
    if (data.user && (data.user.role === 'school_admin' || data.user.role === 'teacher')) {
      var link = document.getElementById('adminMenuLink');
      if (link) link.style.display = '';
    }
  });

  menu.addEventListener('click', function(e) {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', function() {
    menu.classList.remove('open');
  });
});
