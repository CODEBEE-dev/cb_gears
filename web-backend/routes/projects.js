const router = require('express').Router()
const { query } = require('../db')
const { requireAuth } = require('../auth')

// 프로젝트 목록 조회 (기본: 최근 10개, all=true: 전체)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const all = req.query.all === 'true'
    const sql = all
      ? 'SELECT id, name, updated_at FROM projects WHERE user_id = $1 ORDER BY updated_at DESC'
      : 'SELECT id, name, updated_at FROM projects WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 10'
    const result = await query(sql, [userId])
    res.json({ projects: result.rows })
  } catch (err) {
    console.error('[DB] 프로젝트 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 프로젝트 생성 (world_options, robot_options 는 컬럼 DEFAULT 값 사용)
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' })
    }
    const result = await query(
      'INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING id, name, updated_at',
      [userId, name.trim()]
    )
    res.status(201).json({ project: result.rows[0] })
  } catch (err) {
    console.error('[DB] 프로젝트 생성 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 프로젝트 단건 조회
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id } = req.params
    const result = await query(
      'SELECT id, name, block_xml, python, world_options, robot_options FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ project: result.rows[0] })
  } catch (err) {
    console.error('[DB] 프로젝트 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 프로젝트 저장 (name, block_xml, python, robot_options, world_options)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id } = req.params
    const { name, block_xml, python, robot_options, world_options } = req.body

    const result = await query(
      `UPDATE projects
       SET name          = COALESCE($3, name),
           block_xml     = COALESCE($4, block_xml),
           python        = COALESCE($5, python),
           world_options = COALESCE($6, world_options),
           robot_options = COALESCE($7, robot_options),
           updated_at    = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, name, updated_at`,
      [
        id, userId,
        name || null,
        block_xml ?? null,
        python ? python : null,
        world_options ? JSON.stringify(world_options) : null,
        robot_options ? JSON.stringify(robot_options) : null
      ]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ project: result.rows[0] })
  } catch (err) {
    console.error('[DB] 프로젝트 저장 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 프로젝트 삭제
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { id } = req.params
    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[DB] 프로젝트 삭제 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
