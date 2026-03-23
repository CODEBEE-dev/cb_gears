const express = require('express')
const app = express()
require('dotenv').config()
const path = require('path')
const cookieParser = require('cookie-parser')
const { router: authRouter, initKeycloak } = require('./auth')
const port = process.env.WEB_BACKEND_PORT

app.use(cookieParser())
app.use('/auth', authRouter)
app.use(express.static(path.join(__dirname, '..', 'public')))

const start = async () => {
  await initKeycloak()
  app.listen(port, () => {
    console.log(`[INFO] web-backend running at ${port}`)
    console.log(`[INFO] http://localhost:${port}`)
  })
}

start()