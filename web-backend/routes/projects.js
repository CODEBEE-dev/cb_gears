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

// 프로젝트 생성
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' })
    }
    const result = await query(
      'INSERT INTO projects (user_id, name, world_id, robot_id) VALUES ($1, $2, 1, 1) RETURNING id, name, updated_at',
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
      `SELECT p.id, p.name, p.block_xml, p.python, p.world_id, p.robot_id,
              r.options AS robot_options, w.options AS world_options
       FROM projects p
       LEFT JOIN robots r ON r.id = p.robot_id
       LEFT JOIN worlds w ON w.id = p.world_id
       WHERE p.id = $1 AND p.user_id = $2`,
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

    const projectResult = await query(
      `UPDATE projects
       SET name = COALESCE($3, name),
           block_xml = COALESCE($4, block_xml),
           python = COALESCE($5, python),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, name, updated_at, robot_id, world_id`,
      [id, userId, name || null, block_xml ?? null, python ? python : null]
    )
    if (projectResult.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const { robot_id, world_id } = projectResult.rows[0]

    if (robot_options) {
      await query(
        'UPDATE robots SET options = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(robot_options), robot_id]
      )
    }
    if (world_options) {
      await query(
        'UPDATE worlds SET options = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(world_options), world_id]
      )
    }

    res.json({ project: projectResult.rows[0] })
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
