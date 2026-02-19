const path = require('path')
const lti = require('ltijs').Provider
require('dotenv').config()

// Setup provider(Tool)
lti.setup(process.env.LTI_KEY,
  {
    // Database configuration
    url: process.env.DB_URL,
    // connection: {}
  },
  {
    // Options
    appRoute: '/',
    loginRoute: '/login',
    staticPath: path.join(__dirname, '..', 'public'),
    cookies: {
      secure: true,
      sameSite: 'None' // iframe 사용시 반드시 설정해야 함 (연결 거부 | 무한 루프 발생 가능)
    },
    devMode: true
  }
)

// Set lti launch callback
lti.onConnect((token, req, res) => {
  console.log(`${token.user} 님이 접속했습니다.`)
  console.log(token)
  
  return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

const setup = async () => {
  await lti.deploy({ port: 3000 })

  await lti.registerPlatform({
    url: process.env.MOODLE_URL,
    name: process.env.PLATFORM_NAME,
    clientId: process.env.PLATFORM_CLIENT_ID,
    authenticationEndpoint: process.env.PLATFORM_AUTH_ENDPOINT,
    accesstokenEndpoint: process.env.PLATFORM_TOKEN_ENDPOINT,
    authConfig: { method: process.env.PLATFORM_AUTH_METHOD, key: process.env.PLATFORM_AUTH_KEY }
  })
}

setup()