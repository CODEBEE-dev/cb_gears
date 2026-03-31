const express = require('express')
const app = express()
require('dotenv').config()
const path = require('path')
const cookieParser = require('cookie-parser')
const { router: authRouter, initKeycloak, requireAuth } = require('./auth')
const projectsRouter = require('./routes/projects')
const robotsRouter = require('./routes/robots')
const worldsRouter = require('./routes/worlds')
const adminRouter = require('./routes/admin')
const challengesRouter = require('./routes/challenges')
const classroomRouter = require('./routes/classroom')
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
app.use(express.json())
app.use(cookieParser())
app.use('/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/robots', robotsRouter)
app.use('/api/worlds', worldsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/classroom', classroomRouter)

/**
 * 다른 페이지들 로그인 체크
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'))
})

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

app.get('/configurator', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'configurator.html'))
})

app.get('/builder', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'builder.html'))
})

app.get('/arena', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'arena.html'))
})

app.get('/arenaFrame', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'arenaFrame.html'))
})

app.get('/challenges', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'challenges.html'))
})

app.get('/classroom', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'classroom.html'))
})

app.get('/settings', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'settings.html'))
})

app.get('/admin', requireAuth, (req, res) => {
  const role = req.session.user?.role
  if (role !== 'school_admin' && role !== 'teacher') {
    return res.status(403).sendFile(path.join(__dirname, '..', 'public', '403.html'), err => {
      if (err) res.status(403).send('Forbidden')
    })
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'))
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