document.addEventListener('DOMContentLoaded', function() {
  var menu = document.getElementById('hamburgerMenu');
  if (!menu) return;

  var homeLink = menu.querySelector('.hamburger-dropdown a[href="/"]');
  if (homeLink && typeof i18n !== 'undefined') {
    var icon = homeLink.querySelector('span');
    homeLink.textContent = i18n.get('#main-home#');
    if (icon) homeLink.prepend(icon);
  }

  menu.addEventListener('click', function(e) {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', function() {
    menu.classList.remove('open');
  });
});
