const express = require('express')
const app = express()
require('dotenv').config()
const path = require('path')
const cookieParser = require('cookie-parser')
const { router: authRouter, initKeycloak, requireAuth } = require('./auth')
const session = require('express-session')
const port = process.env.WEB_BACKEND_PORT

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, 
  saveUninitialized: false,
  /**
   * 개발모드: 24시간 
   * 일반모드: 브라우저 닫으면 쿠키 삭제
   */
  cookie: { maxAge: process.env.NODE_ENV === 'development' ? 1000 * 60 * 60 * 24 : null }
}))
app.use(cookieParser())
app.use('/auth', authRouter)

/**
 * 다른 페이지들 로그인 체크
 */
app.get('/configurator.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'configurator.html'))
})

app.get('/builder.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'builder.html'))
})

app.get('/arena.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'arena.html'))
})

app.get('/arenaFrame.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'arenaFrame.html'))
})

app.use(express.static(path.join(__dirname, '..', 'public')))

const start = async () => {
  await initKeycloak()
  app.listen(port, () => {
    console.log(`[INFO] web-backend running at ${port}`)
    console.log(`[INFO] http://localhost:${port}`)
  })
}

start()