const router = require('express').Router()
const { requireAuth } = require('../auth')

const CMS_BASE = process.env.CMS_API_URL || 'http://localhost:45512'

// GET /api/cms/curriculums
router.get('/curriculums', requireAuth, async (req, res) => {
  try {
    const r = await fetch(`${CMS_BASE}/api/curriculums`)
    if (!r.ok) return res.status(r.status).json({ error: 'CMS error' })
    const data = await r.json()
    res.json(data)
  } catch (err) {
    console.error('[CMS] curriculums 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/cms/curriculums/:id
router.get('/curriculums/:id', requireAuth, async (req, res) => {
  try {
    const r = await fetch(`${CMS_BASE}/api/curriculums/${req.params.id}`)
    if (!r.ok) return res.status(r.status).json({ error: 'CMS error' })
    const data = await r.json()
    res.json(data)
  } catch (err) {
    console.error('[CMS] curriculum 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/cms/lessons/:id
router.get('/lessons/:id', requireAuth, async (req, res) => {
  try {
    const r = await fetch(`${CMS_BASE}/api/lessons/${req.params.id}`)
    if (!r.ok) return res.status(r.status).json({ error: 'CMS error' })
    const data = await r.json()
    res.json(data)
  } catch (err) {
    console.error('[CMS] lesson 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
