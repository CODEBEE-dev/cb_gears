const express = require('express')
const app = express()
require('dotenv').config()
const path = require('path')
const port = process.env.WEB_BACKEND_PORT

app.use(express.static(path.join(__dirname, '..', 'public')))

app.listen(port, () => {
  console.log(`[INFO] web-backend running at ${port}`)
  console.log(`[INFO] http://localhost:${port}`)
})