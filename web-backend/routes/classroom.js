const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { query } = require('../db')
const { requireAuth, requireRole } = require('../auth')

const ADMIN_ROLES = ['school_admin', 'teacher']

// ── multer 설정 (자료실 파일 업로드)
const UPLOAD_DIR = path.join(__dirname, '../../uploads/materials')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
})

// ── 공지사항 목록 조회 (같은 group)
router.get('/announcements', requireAuth, async (req, res) => {
  try {
    const { group } = req.session.user
    if (!group) return res.json({ announcements: [] })

    const result = await query(
      `SELECT id, author_id, author_name, title, content, created_at, updated_at
       FROM announcements
       WHERE group_name = $1
       ORDER BY created_at DESC`,
      [group]
    )
    res.json({ announcements: result.rows })
  } catch (err) {
    console.error('[DB] 공지사항 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 공지사항 단건 조회
router.get('/announcements/:id', requireAuth, async (req, res) => {
  try {
    const { group } = req.session.user
    const result = await query(
      `SELECT id, author_id, author_name, title, content, created_at, updated_at
       FROM announcements
       WHERE id = $1 AND group_name = $2`,
      [req.params.id, group]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ announcement: result.rows[0] })
  } catch (err) {
    console.error('[DB] 공지사항 단건 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 공지사항 작성 (teacher/school_admin만)
router.post('/announcements', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: authorId, name: authorName, group } = req.session.user
    const { title, content } = req.body
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'title and content are required' })
    }
    if (!group) return res.status(400).json({ error: 'No group assigned' })

    const result = await query(
      `INSERT INTO announcements (author_id, author_name, group_name, title, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, author_id, author_name, title, content, created_at, updated_at`,
      [authorId, authorName, group, title.trim(), content.trim()]
    )
    res.status(201).json({ announcement: result.rows[0] })
  } catch (err) {
    console.error('[DB] 공지사항 작성 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 공지사항 수정 (작성자만)
router.put('/announcements/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: authorId, group } = req.session.user
    const { title, content } = req.body
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'title and content are required' })
    }

    const result = await query(
      `UPDATE announcements
       SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3 AND author_id = $4 AND group_name = $5
       RETURNING id, author_id, author_name, title, content, created_at, updated_at`,
      [title.trim(), content.trim(), req.params.id, authorId, group]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or forbidden' })
    res.json({ announcement: result.rows[0] })
  } catch (err) {
    console.error('[DB] 공지사항 수정 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 공지사항 삭제 (작성자만)
router.delete('/announcements/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: authorId, group } = req.session.user
    const result = await query(
      `DELETE FROM announcements
       WHERE id = $1 AND author_id = $2 AND group_name = $3
       RETURNING id`,
      [req.params.id, authorId, group]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or forbidden' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[DB] 공지사항 삭제 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 그룹 내 학생 진행률 리더보드
// - Keycloak에서 같은 group 사용자 목록을 가져올 수 없으므로
//   challenge_progress 테이블 기준으로 그룹 내 기록된 유저만 집계
// - 총 챌린지 수는 쿼리 파라미터로 전달 (프론트에서 계산)
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const { group } = req.session.user
    if (!group) return res.json({ leaderboard: [] })

    // group이 같은 유저들의 완료 챌린지 수 집계
    // auth.js에서 group은 세션에만 있으므로, 진행률 기록이 있는 유저만 조회 가능
    // → challenge_progress 에 user_group 컬럼이 없으므로 현재 로그인 유저 본인 + 같은 그룹 내
    //   진행 기록을 join할 방법이 없음. 대신 별도 컬럼 없이 upsert 시 group도 저장하도록
    //   아래처럼 user_progress 뷰를 활용: group_name이 없으면 자기 자신만 반환 + 추후 확장
    //
    // 현재 스키마에는 group 정보가 challenge_progress에 없음.
    // → 별도 user_group 테이블을 활용하거나, challenge_progress에 group_name 추가 필요.
    // 여기서는 group_name 컬럼을 challenge_progress에 추가한 버전으로 집계.
    const result = await query(
      `SELECT user_id, user_name, COUNT(*) AS completed
       FROM challenge_progress
       WHERE group_name = $1
       GROUP BY user_id, user_name
       ORDER BY completed DESC, user_name ASC`,
      [group]
    )
    res.json({ leaderboard: result.rows })
  } catch (err) {
    console.error('[DB] 리더보드 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 학생 프로젝트 목록 조회 (teacher/school_admin만, 같은 group)
router.get('/student-projects', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { group } = req.session.user
    if (!group) return res.json({ students: [] })

    const { id: teacherId } = req.session.user
    const result = await query(
      `SELECT user_id, user_name, id AS project_id, name AS project_name, updated_at
       FROM projects
       WHERE group_name = $1 AND user_id != $2
       ORDER BY user_name ASC NULLS LAST, updated_at DESC`,
      [group, teacherId]
    )

    // user_id별로 그룹핑
    const map = new Map()
    for (const row of result.rows) {
      if (!map.has(row.user_id)) {
        map.set(row.user_id, { user_id: row.user_id, user_name: row.user_name, projects: [] })
      }
      map.get(row.user_id).projects.push({
        id: row.project_id,
        name: row.project_name,
        updated_at: row.updated_at,
      })
    }

    res.json({ students: Array.from(map.values()) })
  } catch (err) {
    console.error('[DB] 학생 프로젝트 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 자료실 목록 조회
router.get('/materials', requireAuth, async (req, res) => {
  try {
    const { group } = req.session.user
    if (!group) return res.json({ materials: [] })

    const result = await query(
      `SELECT m.id, m.author_id, m.author_name, m.title, m.content, m.created_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', f.id,
                    'original_name', f.original_name,
                    'file_size', f.file_size,
                    'mime_type', f.mime_type
                  ) ORDER BY f.id
                ) FILTER (WHERE f.id IS NOT NULL),
                '[]'
              ) AS files
       FROM materials m
       LEFT JOIN material_files f ON f.material_id = m.id
       WHERE m.group_name = $1
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
      [group]
    )
    res.json({ materials: result.rows })
  } catch (err) {
    console.error('[DB] 자료실 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 자료 등록 (teacher/school_admin만, multipart/form-data)
router.post('/materials', requireRole(...ADMIN_ROLES), (req, res, next) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 200MB per file)' })
    }
    if (err) return res.status(500).json({ error: err.message })
    next()
  })
}, async (req, res) => {
  try {
    const { id: authorId, name: authorName, group } = req.session.user
    const { title, content = '' } = req.body
    if (!title?.trim()) {
      // 업로드된 파일 정리
      for (const f of (req.files || [])) fs.unlink(f.path, () => {})
      return res.status(400).json({ error: 'title is required' })
    }
    if (!group) {
      for (const f of (req.files || [])) fs.unlink(f.path, () => {})
      return res.status(400).json({ error: 'No group assigned' })
    }

    const matResult = await query(
      `INSERT INTO materials (author_id, author_name, group_name, title, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, author_id, author_name, title, content, created_at`,
      [authorId, authorName, group, title.trim(), content.trim()]
    )
    const material = matResult.rows[0]

    const files = []
    for (const f of (req.files || [])) {
      const fResult = await query(
        `INSERT INTO material_files (material_id, original_name, stored_name, mime_type, file_size)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, original_name, file_size, mime_type`,
        [material.id, f.originalname, f.filename, f.mimetype, f.size]
      )
      files.push(fResult.rows[0])
    }

    res.status(201).json({ material: { ...material, files } })
  } catch (err) {
    console.error('[DB] 자료 등록 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 자료 삭제 (작성자 teacher만)
router.delete('/materials/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: authorId, group } = req.session.user

    // 첨부 파일 목록 조회
    const fileRows = await query(
      `SELECT f.stored_name FROM material_files f
       JOIN materials m ON m.id = f.material_id
       WHERE m.id = $1 AND m.author_id = $2 AND m.group_name = $3`,
      [req.params.id, authorId, group]
    )

    const result = await query(
      `DELETE FROM materials WHERE id = $1 AND author_id = $2 AND group_name = $3 RETURNING id`,
      [req.params.id, authorId, group]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or forbidden' })

    // 디스크 파일 삭제
    for (const row of fileRows.rows) {
      fs.unlink(path.join(UPLOAD_DIR, row.stored_name), () => {})
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('[DB] 자료 삭제 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── 파일 다운로드
router.get('/materials/files/:fileId/download', requireAuth, async (req, res) => {
  try {
    const { group } = req.session.user

    const result = await query(
      `SELECT f.stored_name, f.original_name, f.mime_type
       FROM material_files f
       JOIN materials m ON m.id = f.material_id
       WHERE f.id = $1 AND m.group_name = $2`,
      [req.params.fileId, group]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const { stored_name, original_name, mime_type } = result.rows[0]
    const filePath = path.join(UPLOAD_DIR, stored_name)

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(original_name)}`)
    if (mime_type) res.setHeader('Content-Type', mime_type)
    res.sendFile(filePath)
  } catch (err) {
    console.error('[DB] 파일 다운로드 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
