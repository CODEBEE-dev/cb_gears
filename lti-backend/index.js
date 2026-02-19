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
    cookies: {
      secure: true,
      sameSite: ''
    },
    devMode: true
  }
)

// Set lti launch callback
lti.onConnect((token, req, res) => {
  console.log(token)
  return res.send('It\'s alive!')
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