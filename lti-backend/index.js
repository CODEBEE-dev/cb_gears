const path = require('path')
const lti = require('ltijs').Provider
require('dotenv').config()

// Setup provider(Tool)
lti.setup(process.env.LTI_KEY,
  {
    // Database configuration
    url: process.env.DB_URL,
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
    devMode: false
  }
)

// Set lti launch callback
lti.onConnect((token, req, res) => {
  console.log(`[${new Date().toISOString()}] User Connected: ${token.user}`)
  
  // 파일 서빙 OR 리디렉션 가능
  return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

const setup = async () => {
  try {
    const port = 48121
    await lti.deploy({ port: port })
    console.log(`[INFO] LTI Provider is running on port ${port}`)
    
    const platform = await lti.getPlatform(process.env.MOODLE_URL, process.env.PLATFORM_CLIENT_ID)
    if (!platform) {
      console.log(`[INFO] No platform found. Registering new platform...`)
      await lti.registerPlatform({
        url: process.env.MOODLE_URL,
        name: process.env.PLATFORM_NAME,
        clientId: process.env.PLATFORM_CLIENT_ID,
        authenticationEndpoint: process.env.PLATFORM_AUTH_ENDPOINT,
        accesstokenEndpoint: process.env.PLATFORM_TOKEN_ENDPOINT,
        authConfig: { method: process.env.PLATFORM_AUTH_METHOD, key: process.env.PLATFORM_AUTH_KEY }
      })
      console.log(`[SUCCESS] Platform registered successfully`)
    } else {
      console.log(`[INFO] Platform already registered. Skipping registration...`)
    }
  } catch (err) {
    console.error('Server failed to start:', err)
  }
}

setup()