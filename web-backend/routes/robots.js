const router = require('express').Router()
const { query } = require('../db')
const { requireAuth } = require('../auth')

// 내 로봇 목록 조회
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const result = await query(
      'SELECT id, name, options, thumbnail, updated_at FROM robots WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    )
    res.json({ robots: result.rows })
  } catch (err) {
    console.error('[DB] 로봇 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 로봇 단건 조회
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id } = req.params
    const result = await query(
      'SELECT id, name, options, thumbnail, updated_at FROM robots WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ robot: result.rows[0] })
  } catch (err) {
    console.error('[DB] 로봇 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 로봇 저장 (이름 기준 upsert)
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { name, options, thumbnail } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Robot name is required' })
    }

    const result = await query(
      `INSERT INTO robots (user_id, name, options, thumbnail)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, name)
       DO UPDATE SET options = EXCLUDED.options, thumbnail = EXCLUDED.thumbnail, updated_at = NOW()
       RETURNING id, name, updated_at`,
      [userId, name.trim(), options, thumbnail || null]
    )
    res.json({ robot: result.rows[0] })
  } catch (err) {
    console.error('[DB] 로봇 저장 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 로봇 삭제
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id } = req.params
    const result = await query(
      'DELETE FROM robots WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[DB] 로봇 삭제 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
