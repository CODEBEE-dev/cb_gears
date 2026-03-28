const router = require('express').Router()
const { query } = require('../db')
const { requireAuth } = require('../auth')

// 내 로봇 목록 조회
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const result = await query(
      'SELECT id, name, thumbnail, updated_at FROM robots WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    )
    res.json({ robots: result.rows })
  } catch (err) {
    console.error('[DB] 로봇 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 로봇 저장 (생성 또는 수정)
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id, name, options, thumbnail } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Robot name is required' })
    }

    let result
    if (id) {
      result = await query(
        `UPDATE robots SET name = $3, options = $4, thumbnail = $5, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING id, name, updated_at`,
        [id, userId, name.trim(), options, thumbnail || null]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    } else {
      result = await query(
        'INSERT INTO robots (user_id, name, options, thumbnail) VALUES ($1, $2, $3, $4) RETURNING id, name, updated_at',
        [userId, name.trim(), options, thumbnail || null]
      )
    }
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
