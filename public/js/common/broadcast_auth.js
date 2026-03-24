/**
 * 각 서브페이지에서 index.html에 로그인 완료 브로드캐스팅
 */
(async () => {
  const res = await fetch('/auth/me')
  const { user } = await res.json()

  if (user) {
    new BroadcastChannel('auth').postMessage({ type: 'login' })
  }
})()