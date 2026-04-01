const router = require('express').Router()
const { query } = require('../db')
const { requireAuth, requireRole } = require('../auth')

const ADMIN_ROLES = ['school_admin', 'teacher']

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
    const { id: userId, name: userName, group: groupName } = req.session.user
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' })
    }
    const dup = await query(
      'SELECT id FROM projects WHERE user_id = $1 AND name = $2',
      [userId, name.trim()]
    )
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'duplicate' })
    }
    const result = await query(
      'INSERT INTO projects (user_id, user_name, group_name, name) VALUES ($1, $2, $3, $4) RETURNING id, name, updated_at',
      [userId, userName || null, groupName || null, name.trim()]
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

// 학생 프로젝트 단건 조회 (teacher/school_admin만, 같은 group 소속 학생 것만)
router.get('/student/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { group } = req.session.user
    const { id } = req.params
    const result = await query(
      'SELECT id, name, block_xml, python, world_options, robot_options FROM projects WHERE id = $1 AND group_name = $2',
      [id, group]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ project: result.rows[0] })
  } catch (err) {
    console.error('[DB] 학생 프로젝트 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 프로젝트 저장 (name, block_xml, python, robot_options, world_options)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id: userId, name: userName, group: groupName } = req.session.user
    const { id } = req.params
    const { name, block_xml, python, robot_options, world_options } = req.body

    const result = await query(
      `UPDATE projects
       SET name          = COALESCE($3, name),
           block_xml     = COALESCE($4, block_xml),
           python        = COALESCE($5, python),
           world_options = COALESCE($6, world_options),
           robot_options = COALESCE($7, robot_options),
           group_name    = $8,
           user_name     = $9,
           updated_at    = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, name, updated_at`,
      [
        id, userId,
        name || null,
        block_xml ?? null,
        python ? python : null,
        world_options ? JSON.stringify(world_options) : null,
        robot_options ? JSON.stringify(robot_options) : null,
        groupName || null,
        userName || null,
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
