/**
 * 공통 액티비티바 컴포넌트
 * - #activityBar 요소에 메뉴 항목을 주입하고 동작을 초기화합니다.
 * - 현재 URL 기반으로 active 항목을 자동 설정합니다.
 * - admin 항목은 school_admin / teacher 역할일 때만 표시됩니다.
 *   (role 정보는 initActivityBar(role) 호출 시 전달)
 *
 * 사용법:
 *   <nav class="activity-bar expanded" id="activityBar"></nav>
 *   initActivityBar(userRole)   // 로그인 정보 로드 후 호출
 */

const ACTIVITY_BAR_ITEMS = [
  { key: 'home',       icon: 'home',            label: '#nav-home#',     href: '/' },
  { key: 'projects',   icon: 'folder',          label: '#nav-projects#', href: '/#projects' },
  { key: 'challenges', icon: 'emoji_events',    label: '#nav-challenges#', href: '/challenges' },
  { key: 'classroom',  icon: 'school',          label: '#nav-classroom#',  href: '/classroom' },
  { key: 'settings',   icon: 'settings',        label: '#nav-settings#', href: '/settings' },
  { key: 'admin',      icon: 'manage_accounts', label: '#nav-admin#',    href: '/admin', adminOnly: true },
];

// 현재 페이지에 해당하는 key 반환
function _getActiveKey() {
  const path = window.location.pathname;
  if (path === '/challenges') return 'challenges';
  if (path === '/classroom')  return 'classroom';
  if (path === '/settings')   return 'settings';
  if (path === '/admin')      return 'admin';
  const hash = window.location.hash.replace('#', '');
  if (hash === 'projects') return 'projects';
  return 'home';
}

function initActivityBar(role) {
  const bar = document.getElementById('activityBar');
  if (!bar) return;

  const activeKey = _getActiveKey();
  const isAdmin = role === 'school_admin' || role === 'teacher';

  // 토글 버튼
  const toggle = document.createElement('div');
  toggle.className = 'activity-bar-toggle';
  toggle.id = 'activityBarToggle';
  toggle.innerHTML = '<span class="material-symbols-rounded">apps</span>';
  toggle.addEventListener('click', () => bar.classList.toggle('expanded'));
  bar.appendChild(toggle);

  // 메뉴 항목
  ACTIVITY_BAR_ITEMS.forEach(item => {
    if (item.adminOnly && !isAdmin) return;

    const label = item.label.startsWith('#') ? i18n.get(item.label) : item.label;

    const el = document.createElement('div');
    el.className = 'activity-bar-item' + (item.key === activeKey ? ' active' : '');
    el.dataset.key = item.key;
    el.setAttribute('data-tooltip', label);
    el.innerHTML = `
      <span class="material-symbols-rounded">${item.icon}</span>
      <span class="activity-label">${label}</span>
    `;

    el.addEventListener('click', () => {
      // dashboard 내부 뷰 전환은 해당 페이지가 처리하도록 이벤트 발생
      if (window.location.pathname === '/' && (item.key === 'home' || item.key === 'projects')) {
        document.querySelectorAll('.activity-bar-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        document.dispatchEvent(new CustomEvent('activityBarSwitch', { detail: item.key }));
      } else {
        window.location.href = item.href;
      }
    });

    bar.appendChild(el);
  });
}
