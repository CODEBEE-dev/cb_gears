const router = require('express').Router()
const { query } = require('../db')
const { requireAuth } = require('../auth')

// 내 월드 목록 조회
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const result = await query(
      'SELECT id, name, thumbnail, updated_at FROM worlds WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    )
    res.json({ worlds: result.rows })
  } catch (err) {
    console.error('[DB] 월드 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 월드 저장 (name 기준 upsert)
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { name, options, thumbnail } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'World name is required' })
    }

    const existing = await query(
      'SELECT id FROM worlds WHERE user_id = $1 AND name = $2',
      [userId, name.trim()]
    )

    let result
    if (existing.rows.length > 0) {
      result = await query(
        `UPDATE worlds SET options = $3, thumbnail = $4, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING id, name, updated_at`,
        [existing.rows[0].id, userId, options, thumbnail || null]
      )
    } else {
      result = await query(
        'INSERT INTO worlds (user_id, name, options, thumbnail) VALUES ($1, $2, $3, $4) RETURNING id, name, updated_at',
        [userId, name.trim(), options, thumbnail || null]
      )
    }
    res.json({ world: result.rows[0] })
  } catch (err) {
    console.error('[DB] 월드 저장 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 월드 단건 조회 (options 포함)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id } = req.params
    const result = await query(
      'SELECT id, name, options, thumbnail, updated_at FROM worlds WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ world: result.rows[0] })
  } catch (err) {
    console.error('[DB] 월드 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 월드 삭제
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id } = req.params
    const result = await query(
      'DELETE FROM worlds WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[DB] 월드 삭제 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
