const router = require('express').Router()
const { query } = require('../db')
const { requireAuth } = require('../auth')

// 내 진행도 전체 조회
router.get('/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const result = await query(
      'SELECT challenge_id, completed_at FROM challenge_progress WHERE user_id = $1',
      [userId]
    )
    res.json({ progress: result.rows })
  } catch (err) {
    console.error('[DB] 챌린지 진행도 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 챌린지 완료 처리
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const { id: userId, name: userName, group: groupName } = req.session.user
    const { challenge_id } = req.body
    if (!challenge_id) {
      return res.status(400).json({ error: 'challenge_id is required' })
    }
    await query(
      `INSERT INTO challenge_progress (user_id, user_name, group_name, challenge_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, challenge_id) DO NOTHING`,
      [userId, userName, groupName, challenge_id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('[DB] 챌린지 완료 처리 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
