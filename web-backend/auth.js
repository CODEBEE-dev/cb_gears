const { Issuer, generators } = require('openid-client')
const router = require('express').Router()

let client

const initKeycloak = async () => {
  const issuer = await Issuer.discover(
    `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`
  )
  client = new issuer.Client({
    client_id: process.env.KEYCLOAK_CLIENT_ID,
    client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
    redirect_uris: [`${process.env.BASE_URL}/auth/callback`],
    response_type: ['code']
  })
}

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    if (req.originalUrl.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.session.returnTo = req.originalUrl
    return res.redirect('/auth/login')
  }
  next()
}

const requireRole = (...roles) => (req, res, next) => {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl
    return res.redirect('/auth/login')
  }
  if (!roles.includes(req.session.user.role)) {
    return res.status(403).sendFile(require('path').join(__dirname, '..', 'public', '403.html'), err => {
      if (err) res.status(403).send('Forbidden')
    })
  }
  next()
}

router.get('/login', (req, res) => {
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)

  res.cookie('code_verifier', codeVerifier, { httpOnly: true })

  const url = client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    /** prompt: 'login' // 항상 ID/PW 입력 강제 */
  })

  res.redirect(url)
})

router.get('/callback', async (req, res) => {
  try {
    const params = client.callbackParams(req)
    const codeVerifier = req.cookies['code_verifier']
    const returnTo = req.session.returnTo || '/'
    delete req.session.returnTo

    const tokenSet = await client.callback(
      `${process.env.BASE_URL}/auth/callback`,
      params,
      { code_verifier: codeVerifier }
    )

    const userInfo = tokenSet.claims()

    const ALLOWED_ROLES = ['super_admin', 'school_admin', 'teacher', 'student']
    const roles = (userInfo.realm_roles || []).filter(r => ALLOWED_ROLES.includes(r))
    const role = roles.find(r => r !== 'super_admin') || roles[0] || null

    const allGroups = userInfo.groups || []
    // 하위호환: 가장 depth 깊은 단일 그룹 (class.js 등에서 사용)
    const group = allGroups.reduce((a, b) =>
      a.split('/').length > b.split('/').length ? a : b
    , '') || null

    // 세션에 저장
    const displayName = [userInfo.family_name, userInfo.given_name].filter(Boolean).join(' ') || userInfo.name

    req.session.user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: displayName,
      role,
      roles,
      group,
      groups: allGroups,  // 모든 그룹 경로 배열
    }
    req.session.idToken = tokenSet.id_token

    console.log(`[SYSTEM] 로그인 성공: ${userInfo.sub}, ${userInfo.email}`)

    res.redirect(returnTo)
  } catch (err) {
    console.log('[ERROR] 로그인 콜백 처리 실패: ', err)
    res.redirect('/auth/login')
  }
})

router.get('/logout', (req, res) => {
  console.log(`[SYSTEM] 로그아웃`)
  const idToken = req.session.idToken
  req.session.destroy()

  res.redirect(`${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout` +
    `?post_logout_redirect_uri=${process.env.BASE_URL}` +
    `&client_id=${process.env.KEYCLOAK_CLIENT_ID}` +
    `&id_token_hint=${idToken}`
  )
})

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.json({ user: null })
  }
  res.json({ user: req.session.user })
})

module.exports = { router, initKeycloak, requireAuth, requireRole }