const path = require('path')
const lti = require('ltijs').Provider
const express = require('express')
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

lti.app.use(express.json())
lti.app.use(express.urlencoded({ extended: true }))

// Set lti launch callback
lti.onConnect((token, req, res) => {
  console.log(`[${new Date().toISOString()}] User Connected: ${token.user}`)
  
  // 파일 서빙 OR 리디렉션 가능
  return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

// URL 직접 접속 처리
lti.onInvalidToken((req, res) => {
  if (req.path === '/') {
    console.log('[WARN] Direct access')
    return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
  } else {
    return res.send(`
      <h1>Welcome to CodeBridge Bot</h1>
      <p>CodeBridge LMS를 통해 접속해 주세요..!</p>
      <a href="https://lms.codebridge.ai.kr">LMS 이동하기</a>
      `)
  }
})

/**
 * Sending grade
 */
lti.app.post('/grade', async (req, res) => {
  try {
    const idtoken = res.locals.token
    const score = req.body.grade

    // create grade object
    const gradeObj = {
      userId: idtoken.user,
      scoreGiven: score,
      scoreMaximum: 100,
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded'
    }

    // selecting lineItem ID - Moodle 성적 DB에 꽂을 레코드 찾기
    let lineItemId = idtoken.platformContext.endpoint.lineitem

    if (!lineItemId) {
      const response = await lti.Grade.getLineItems(idtoken, { resourceLinkId: true })
      const lineItems = response.lineItems
      if (lineItems.length === 0) {
        // creating line item if there is none
        console.log('Creating new line item')
        const newLineItem = {
          scoreMaximum: 100,
          label: 'Grade',
          tag: 'grade',
          resourceLinkId: idtoken.platformContext.resource.id
        }
        const lineItem = await lti.Grade.createLineItem(idtoken, newLineItem)
        lineItemId = lineItem.id
      } else lineItemId = lineItems[0].id
    }
    // sending grade
    const responseGrade = await lti.Grade.submitScore(idtoken, lineItemId, gradeObj)
    return res.send(responseGrade)
  } catch (err) {
    return res.status(500).send({ err: err.message })
  }
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