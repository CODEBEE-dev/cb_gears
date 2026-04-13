const router = require('express').Router()
const { query } = require('../db')
const { requireAuth, requireRole } = require('../auth')

const ADMIN_ROLES = ['school_admin', 'teacher']
const CMS_BASE = process.env.CMS_API_URL || 'http://localhost:45512'

const makeId = (prefix) => `${prefix}_${require('crypto').randomUUID()}`

// ── Keycloak Admin 헬퍼 (admin.js와 동일 패턴)
async function getAdminToken() {
  const url = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID,
    client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || process.env.KEYCLOAK_CLIENT_SECRET,
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Admin token 획득 실패: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

function adminUrl(path) {
  return `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}${path}`
}

async function keycloakFetch(path, options = {}) {
  const token = await getAdminToken()
  const res = await fetch(adminUrl(path), {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  return res
}

// 교사의 그룹 id 조회
async function getGroupIdByPath(sessionGroup) {
  const groupName = sessionGroup.split('/').pop()
  const searchR = await keycloakFetch(`/groups?search=${encodeURIComponent(groupName)}&exact=true`)
  if (!searchR.ok) return null
  const candidates = await searchR.json()
  const normalizedSession = sessionGroup.startsWith('/') ? sessionGroup : `/${sessionGroup}`
  const findByPath = (nodes) => {
    for (const g of nodes) {
      if (g.path === normalizedSession) return g
      if (g.subGroups?.length) {
        const found = findByPath(g.subGroups)
        if (found) return found
      }
    }
    return null
  }
  return findByPath(candidates)
}

// 그룹 내 student role 사용자 목록 조회
async function getStudentsInGroup(groupId) {
  const membersR = await keycloakFetch(`/groups/${groupId}/members?max=500`)
  if (!membersR.ok) return []
  const members = await membersR.json()

  const students = await Promise.all(members.map(async u => {
    const rolesR = await keycloakFetch(`/users/${u.id}/role-mappings/realm`)
    const roles = rolesR.ok ? await rolesR.json() : []
    const isStudent = roles.some(r => r.name === 'student')
    return isStudent ? u : null
  }))
  return students.filter(Boolean)
}

// CMS API에서 레슨 조회
async function fetchLesson(lessonId) {
  const res = await fetch(`${CMS_BASE}/api/lessons/${lessonId}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.data || null
}

// ── [교사] 수업 개설
// POST /api/class
// body: { api_curriculum_id, title }
router.post('/', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: teacherId, group: sessionGroup } = req.session.user
    const { api_curriculum_id, title } = req.body

    if (!api_curriculum_id?.trim() || !title?.trim()) {
      return res.status(400).json({ error: 'api_curriculum_id and title are required' })
    }
    if (!sessionGroup) {
      return res.status(400).json({ error: 'No group assigned to teacher' })
    }

    // Keycloak 그룹에서 학생 목록 조회
    const group = await getGroupIdByPath(sessionGroup)
    if (!group) return res.status(400).json({ error: '그룹을 찾을 수 없습니다' })
    const students = await getStudentsInGroup(group.id)

    // 수업 인스턴스 생성
    const classId = makeId('cls')
    await query(
      `INSERT INTO class_instances (id, api_curriculum_id, teacher_id, title, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')`,
      [classId, api_curriculum_id.trim(), teacherId, title.trim()]
    )

    // 학생 명단 bulk insert
    if (students.length > 0) {
      const values = students.map(() => `(${[...Array(3)].map((_, i) => `$${i + 1}`).join(', ')})`).join(', ')
      // 파라미터 구성
      const params = []
      const placeholders = students.map((s) => {
        const base = params.length
        params.push(makeId('ros'), classId, s.id)
        return `($${base + 1}, $${base + 2}, $${base + 3})`
      })
      await query(
        `INSERT INTO class_rosters (id, class_id, student_id) VALUES ${placeholders.join(', ')}
         ON CONFLICT (class_id, student_id) DO NOTHING`,
        params
      )
    }

    const result = await query(
      `SELECT id, api_curriculum_id, teacher_id, title, status, created_at FROM class_instances WHERE id = $1`,
      [classId]
    )
    res.status(201).json({ class: result.rows[0], rosterCount: students.length })
  } catch (err) {
    console.error('[Class] 수업 개설 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [교사] 내 수업 목록 (진도율 실시간 계산)
// GET /api/class
router.get('/', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: teacherId } = req.session.user

    const result = await query(
      `SELECT
         ci.id, ci.api_curriculum_id, ci.title, ci.status, ci.created_at,
         COUNT(DISTINCT cr.student_id) AS student_count,
         COALESCE(
           ROUND(
             COUNT(sli.id) FILTER (WHERE sli.status = 'COMPLETED')::numeric
             / NULLIF(
                 (SELECT COUNT(DISTINCT api_lesson_id) FROM student_lesson_instances WHERE class_id = ci.id) *
                 NULLIF(COUNT(DISTINCT cr.student_id), 0)
               , 0) * 100
           ), 0
         ) AS progress
       FROM class_instances ci
       LEFT JOIN class_rosters cr ON cr.class_id = ci.id
       LEFT JOIN student_lesson_instances sli ON sli.class_id = ci.id
       WHERE ci.teacher_id = $1
       GROUP BY ci.id
       ORDER BY ci.created_at DESC`,
      [teacherId]
    )
    res.json({ classes: result.rows })
  } catch (err) {
    console.error('[Class] 수업 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [학생] 내가 속한 수업 목록 + 내 진도
// GET /api/class/my
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { id: studentId } = req.session.user

    const result = await query(
      `SELECT
         ci.id, ci.api_curriculum_id, ci.title, ci.status, ci.teacher_id,
         COUNT(DISTINCT sli.api_lesson_id) FILTER (WHERE sli.status = 'COMPLETED') AS completed_lessons,
         COUNT(DISTINCT sli.api_lesson_id) AS started_lessons
       FROM class_rosters cr
       JOIN class_instances ci ON ci.id = cr.class_id
       LEFT JOIN student_lesson_instances sli ON sli.class_id = ci.id AND sli.student_id = cr.student_id
       WHERE cr.student_id = $1
       GROUP BY ci.id
       ORDER BY ci.created_at DESC`,
      [studentId]
    )
    res.json({ classes: result.rows })
  } catch (err) {
    console.error('[Class] 학생 수업 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [교사] 수업 상세 (명단 + 차시별 진도 현황)
// GET /api/class/:classId
router.get('/:classId', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: teacherId } = req.session.user
    const { classId } = req.params

    const classResult = await query(
      `SELECT id, api_curriculum_id, teacher_id, title, status, created_at, updated_at
       FROM class_instances WHERE id = $1 AND teacher_id = $2`,
      [classId, teacherId]
    )
    if (classResult.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const rosterResult = await query(
      `SELECT student_id, created_at FROM class_rosters WHERE class_id = $1 ORDER BY created_at ASC`,
      [classId]
    )

    const progressResult = await query(
      `SELECT student_id, api_lesson_id, status, completed_at, project_id
       FROM student_lesson_instances WHERE class_id = $1`,
      [classId]
    )

    // Keycloak에서 학생 이름 일괄 조회
    const roster = rosterResult.rows
    if (roster.length > 0) {
      const userInfos = await Promise.all(
        roster.map(async r => {
          try {
            const userRes = await keycloakFetch(`/users/${r.student_id}`)
            if (!userRes.ok) return { ...r, student_name: null }
            const u = await userRes.json()
            const name = [u.lastName, u.firstName].filter(Boolean).join(' ') || u.username || null
            return { ...r, student_name: name }
          } catch {
            return { ...r, student_name: null }
          }
        })
      )
      res.json({
        class: classResult.rows[0],
        roster: userInfos,
        lessonProgress: progressResult.rows,
      })
    } else {
      res.json({
        class: classResult.rows[0],
        roster: [],
        lessonProgress: progressResult.rows,
      })
    }
  } catch (err) {
    console.error('[Class] 수업 상세 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [교사] 수업 상태 변경 (ACTIVE / CLOSED)
// PATCH /api/class/:classId/status
router.patch('/:classId/status', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: teacherId } = req.session.user
    const { classId } = req.params
    const { status } = req.body

    if (!['ACTIVE', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'status must be ACTIVE or CLOSED' })
    }

    const result = await query(
      `UPDATE class_instances SET status = $1, updated_at = NOW()
       WHERE id = $2 AND teacher_id = $3
       RETURNING id, status, updated_at`,
      [status, classId, teacherId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ class: result.rows[0] })
  } catch (err) {
    console.error('[Class] 수업 상태 변경 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [교사] 학생 명단 추가
// POST /api/class/:classId/roster
// body: { student_id }
router.post('/:classId/roster', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: teacherId } = req.session.user
    const { classId } = req.params
    const { student_id } = req.body

    if (!student_id?.trim()) {
      return res.status(400).json({ error: 'student_id is required' })
    }

    // 수업 소유권 확인
    const cls = await query(
      `SELECT id FROM class_instances WHERE id = $1 AND teacher_id = $2`,
      [classId, teacherId]
    )
    if (cls.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const rosterId = makeId('ros')
    const result = await query(
      `INSERT INTO class_rosters (id, class_id, student_id) VALUES ($1, $2, $3)
       ON CONFLICT (class_id, student_id) DO NOTHING
       RETURNING id, class_id, student_id, created_at`,
      [rosterId, classId, student_id.trim()]
    )
    if (result.rows.length === 0) {
      return res.status(409).json({ error: '이미 명단에 있는 학생입니다' })
    }
    res.status(201).json({ roster: result.rows[0] })
  } catch (err) {
    console.error('[Class] 학생 추가 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [교사] 학생 명단 제거
// DELETE /api/class/:classId/roster/:studentId
router.delete('/:classId/roster/:studentId', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id: teacherId } = req.session.user
    const { classId, studentId } = req.params

    const cls = await query(
      `SELECT id FROM class_instances WHERE id = $1 AND teacher_id = $2`,
      [classId, teacherId]
    )
    if (cls.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const result = await query(
      `DELETE FROM class_rosters WHERE class_id = $1 AND student_id = $2 RETURNING id`,
      [classId, studentId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: '명단에 없는 학생입니다' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[Class] 학생 제거 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [학생] 수업 내 차시 목록 + 내 진도 상태
// GET /api/class/:classId/lessons
router.get('/:classId/lessons', requireAuth, async (req, res) => {
  try {
    const { id: studentId } = req.session.user
    const { classId } = req.params

    // 명단 소속 확인
    const roster = await query(
      `SELECT id FROM class_rosters WHERE class_id = $1 AND student_id = $2`,
      [classId, studentId]
    )
    if (roster.rows.length === 0) return res.status(403).json({ error: 'Forbidden' })

    const result = await query(
      `SELECT api_lesson_id, status, project_id, completed_at
       FROM student_lesson_instances
       WHERE class_id = $1 AND student_id = $2
       ORDER BY completed_at ASC NULLS LAST`,
      [classId, studentId]
    )
    res.json({ lessons: result.rows })
  } catch (err) {
    console.error('[Class] 차시 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [학생] 차시 시작 (project 생성 + SLI 생성)
// POST /api/class/:classId/lessons/:lessonId/start
// body: { project_name }
router.post('/:classId/lessons/:lessonId/start', requireAuth, async (req, res) => {
  try {
    const { id: studentId, name: userName, group: groupName } = req.session.user
    const { classId, lessonId } = req.params
    const { project_name } = req.body

    if (!project_name?.trim()) {
      return res.status(400).json({ error: 'project_name is required' })
    }

    // 명단 소속 + 수업 정보 확인
    const classResult = await query(
      `SELECT ci.id, ci.api_curriculum_id
       FROM class_instances ci
       JOIN class_rosters cr ON cr.class_id = ci.id
       WHERE ci.id = $1 AND cr.student_id = $2 AND ci.status = 'ACTIVE'`,
      [classId, studentId]
    )
    if (classResult.rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden or class is closed' })
    }
    const { api_curriculum_id } = classResult.rows[0]

    // 이미 시작한 차시 확인
    const existing = await query(
      `SELECT id, status, project_id FROM student_lesson_instances
       WHERE class_id = $1 AND api_lesson_id = $2 AND student_id = $3`,
      [classId, lessonId, studentId]
    )

    // 이미 시작했고 project가 살아있으면 그대로 반환
    if (existing.rows.length > 0 && existing.rows[0].project_id !== null) {
      return res.json({ lesson: existing.rows[0], alreadyStarted: true })
    }

    // CMS API에서 레슨 템플릿 조회
    const lesson = await fetchLesson(lessonId)
    const template = lesson?.projectTemplate || null

    // project 생성
    const projectResult = await query(
      `INSERT INTO projects (user_id, user_name, group_name, name, block_xml, world_options, robot_options)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        studentId,
        userName || null,
        groupName || null,
        project_name.trim(),
        template?.blockXml ?? null,
        template?.worldOptions ? JSON.stringify(template.worldOptions.options ?? template.worldOptions) : null,
        template?.robotOptions ? JSON.stringify(template.robotOptions) : null,
      ]
    )
    const projectId = projectResult.rows[0].id

    // 이미 SLI가 있으면(project만 삭제된 경우) project_id만 업데이트
    if (existing.rows.length > 0) {
      const updated = await query(
        `UPDATE student_lesson_instances SET project_id = $1
         WHERE class_id = $2 AND api_lesson_id = $3 AND student_id = $4
         RETURNING id, status, project_id`,
        [projectId, classId, lessonId, studentId]
      )
      return res.json({ lesson: updated.rows[0], alreadyStarted: false })
    }

    // SLI 생성
    const sliId = makeId('sli')
    const sliResult = await query(
      `INSERT INTO student_lesson_instances
         (id, api_curriculum_id, class_id, api_lesson_id, student_id, project_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'IN_PROGRESS')
       RETURNING id, status, project_id`,
      [sliId, api_curriculum_id, classId, lessonId, studentId, projectId]
    )

    res.status(201).json({ lesson: sliResult.rows[0], alreadyStarted: false })
  } catch (err) {
    console.error('[Class] 차시 시작 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── [학생] 차시 완료 제출
// POST /api/class/:classId/lessons/:lessonId/complete
router.post('/:classId/lessons/:lessonId/complete', requireAuth, async (req, res) => {
  try {
    const { id: studentId } = req.session.user
    const { classId, lessonId } = req.params

    const result = await query(
      `UPDATE student_lesson_instances
       SET status = 'COMPLETED', completed_at = NOW()
       WHERE class_id = $1 AND api_lesson_id = $2 AND student_id = $3
         AND status = 'IN_PROGRESS'
       RETURNING id, status, completed_at, project_id`,
      [classId, lessonId, studentId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '진행 중인 차시를 찾을 수 없습니다' })
    }
    res.json({ lesson: result.rows[0] })
  } catch (err) {
    console.error('[Class] 차시 완료 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
