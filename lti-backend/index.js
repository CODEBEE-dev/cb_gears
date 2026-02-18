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
      secure: false,
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
    url: '',
    name: '',
    clientId: '',
    authenticationEndpoint: '',
    accesstokenEndpoint: '',
    authConfig: { method: '', key: '' }
  })
}

setup()