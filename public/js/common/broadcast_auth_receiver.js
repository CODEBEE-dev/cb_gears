/**
 * 로그인 완료 broadcast 수신
 * 이미 로그인된 상태에서는 reload 하지 않음 (로봇구성/월드빌더 탭 열 때 불필요한 새로고침 방지)
 */
new BroadcastChannel('auth').onmessage = async (e) => {
  if (e.data.type === 'login') {
    const res = await fetch('/auth/me')
    const { user } = await res.json()
    if (!user) location.reload()
  }
}
