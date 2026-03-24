/**
 * 로그인 완료 broadcast 수신
 */
new BroadcastChannel('auth').onmessage = (e) => {
  if (e.data.type === 'login') location.reload()
}