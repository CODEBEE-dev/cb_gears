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

router.get('/login', (req, res) => {
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)

  res.cookie('code_verifier', codeVerifier, { httpOnly: true })

  const url = client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  res.redirect(url)
})

router.get('/callback', async (req, res) => {
  const params = client.callbackParams(req)
  const codeVerifier = req.cookies['code_verifier']

  const tokenSet = await client.callback(
    `${process.env.BASE_URL}/auth/callback`,
    params,
    { code_verifier: codeVerifier }
  )

  const userInfo = tokenSet.claims()
  console.log(`[SYSTEM] 로그인 성공: ${userInfo.email}`)
  res.send(`로그인 성공: ${userInfo.email}`)
})

module.exports = { router, initKeycloak }