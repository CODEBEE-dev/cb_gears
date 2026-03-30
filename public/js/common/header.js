/**
 * 공통 헤더 컴포넌트
 * - <header id="appHeader"></header> 에 내용을 주입합니다.
 * - /auth/me 로 로그인 상태를 확인하고 UI를 갱신합니다.
 * - activityBar.js 의 initActivityBar(role) 을 내부에서 호출합니다.
 *
 * 사용법:
 *   <header id="appHeader"></header>
 *   initHeader('페이지 제목').then(user => { ... })
 *
 * @param {string} title - 헤더에 표시할 앱/페이지 이름
 * @returns {Promise<object|null>} 로그인된 사용자 객체 또는 null
 */
async function initHeader(title) {
  const header = document.getElementById('appHeader');
  if (!header) return null;

  header.innerHTML = `
    <img class="gearsIcon" src="/codebridgeai_favicon.png" alt="logo">
    <div class="appName">${title}</div>
    <div class="headerRight">
      <a href="/auth/login" class="authBtn" id="loginBtn" style="display:none;">
        <span class="material-symbols-rounded">login</span>
        <span class="auth-label" id="loginLabel"></span>
      </a>
      <div id="userArea" style="display:none; align-items:center; gap:0.2em;">
        <span class="material-symbols-rounded">person</span>
        <span class="auth-label" id="welcomeLabel"></span>
        <a href="/auth/logout" class="authBtn" id="logoutBtn">
          <span class="material-symbols-rounded">logout</span>
          <span class="auth-label" id="logoutLabel"></span>
        </a>
      </div>
    </div>
  `;

  let user = null;
  try {
    const res = await fetch('/auth/me');
    const data = await res.json();
    if (data.user) {
      user = data.user;
      document.getElementById('userArea').style.display = 'flex';
      document.getElementById('welcomeLabel').textContent =
        i18n.get('#main-welcome#').replace('{name}', data.user.name);
      document.getElementById('logoutLabel').textContent = i18n.get('#main-logout#');
    } else {
      document.getElementById('loginBtn').style.display = '';
      document.getElementById('loginLabel').textContent = i18n.get('#main-login#');
    }
  } catch (e) {
    document.getElementById('loginBtn').style.display = '';
    document.getElementById('loginLabel').textContent = i18n.get('#main-login#');
  }

  initActivityBar(user ? user.role : null);
  return user;
}
