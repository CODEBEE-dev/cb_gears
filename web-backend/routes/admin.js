const router = require('express').Router()
const { requireRole } = require('../auth')

const ADMIN_ROLES = ['school_admin', 'teacher']

// Keycloak Admin REST API 호출용 헬퍼
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

// 사용자 목록 조회 (role 포함)
router.get('/users', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { search = '', first = 0, max = 50 } = req.query
    const params = new URLSearchParams({ first, max })
    if (search) params.set('search', search)
    const r = await keycloakFetch(`/users?${params}`)
    if (!r.ok) return res.status(r.status).json({ error: 'Keycloak 사용자 목록 조회 실패' })
    const users = await r.json()

    // 각 사용자의 realm role을 병렬 조회
    const ALLOWED_ROLES = ['school_admin', 'teacher', 'student']
    const usersWithRoles = await Promise.all(users.map(async u => {
      const rolesR = await keycloakFetch(`/users/${u.id}/role-mappings/realm`)
      const roles = rolesR.ok ? await rolesR.json() : []
      const realmRoles = roles.filter(r => ALLOWED_ROLES.includes(r.name)).map(r => r.name)
      return { ...u, realmRoles }
    }))

    res.json({ users: usersWithRoles })
  } catch (err) {
    console.error('[Admin] 사용자 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 사용자 단건 조회
router.get('/users/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const r = await keycloakFetch(`/users/${req.params.id}`)
    if (!r.ok) return res.status(r.status).json({ error: '사용자를 찾을 수 없습니다' })
    const user = await r.json()

    // realm role 조회
    const rolesR = await keycloakFetch(`/users/${req.params.id}/role-mappings/realm`)
    const roles = rolesR.ok ? await rolesR.json() : []

    res.json({ user: { ...user, realmRoles: roles.map(r => r.name) } })
  } catch (err) {
    console.error('[Admin] 사용자 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 사용자 생성
router.post('/users', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { username, email, firstName, lastName, password, role, enabled = true } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'username과 password는 필수입니다' })
    }

    // 사용자 생성
    const r = await keycloakFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        firstName,
        lastName,
        enabled,
        emailVerified: true,
        credentials: [{ type: 'password', value: password, temporary: false }],
      }),
    })

    if (!r.ok) {
      const body = await r.text()
      const msg = body.includes('User exists') ? '이미 존재하는 사용자명입니다' : `사용자 생성 실패 (${r.status})`
      return res.status(r.status).json({ error: msg })
    }

    // Location 헤더에서 생성된 userId 추출
    const location = r.headers.get('location') || ''
    const userId = location.split('/').pop()

    // role 할당
    if (role && userId) {
      await assignRole(userId, role)
    }

    res.status(201).json({ message: '사용자가 생성되었습니다', userId })
  } catch (err) {
    console.error('[Admin] 사용자 생성 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 사용자 수정
router.put('/users/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { username, email, firstName, lastName, enabled, role, password } = req.body
    const userId = req.params.id

    const updateBody = {}
    if (username !== undefined) updateBody.username = username
    if (email !== undefined) updateBody.email = email
    if (firstName !== undefined) updateBody.firstName = firstName
    if (lastName !== undefined) updateBody.lastName = lastName
    if (enabled !== undefined) updateBody.enabled = enabled

    const r = await keycloakFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateBody),
    })
    if (!r.ok) return res.status(r.status).json({ error: '사용자 수정 실패' })

    // 비밀번호 변경
    if (password) {
      const pwR = await keycloakFetch(`/users/${userId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ type: 'password', value: password, temporary: false }),
      })
      if (!pwR.ok) return res.status(pwR.status).json({ error: '비밀번호 변경 실패' })
    }

    // role 변경
    if (role) {
      await assignRole(userId, role)
    }

    res.json({ message: '사용자가 수정되었습니다' })
  } catch (err) {
    console.error('[Admin] 사용자 수정 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 사용자 삭제
router.delete('/users/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const r = await keycloakFetch(`/users/${req.params.id}`, { method: 'DELETE' })
    if (!r.ok) return res.status(r.status).json({ error: '사용자 삭제 실패' })
    res.json({ message: '사용자가 삭제되었습니다' })
  } catch (err) {
    console.error('[Admin] 사용자 삭제 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 사용 가능한 realm role 목록 조회
router.get('/roles', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const r = await keycloakFetch('/roles')
    if (!r.ok) return res.status(r.status).json({ error: 'Role 목록 조회 실패' })
    const roles = await r.json()
    res.json({ roles })
  } catch (err) {
    console.error('[Admin] Role 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// role 할당 헬퍼
async function assignRole(userId, roleName) {
  const ALLOWED_ROLES = ['school_admin', 'teacher', 'student']

  // 할당할 role을 이름으로 직접 조회 (id 확보)
  const roleR = await keycloakFetch(`/roles/${roleName}`)
  if (!roleR.ok) {
    console.error(`[Admin] role 조회 실패: ${roleName}, status: ${roleR.status}`)
    return
  }
  const roleObj = await roleR.json()

  // 기존 allowed role 제거
  const currentRolesR = await keycloakFetch(`/users/${userId}/role-mappings/realm`)
  const currentRoles = currentRolesR.ok ? await currentRolesR.json() : []
  const toRemove = currentRoles.filter(r => ALLOWED_ROLES.includes(r.name))
  if (toRemove.length > 0) {
    await keycloakFetch(`/users/${userId}/role-mappings/realm`, {
      method: 'DELETE',
      body: JSON.stringify(toRemove),
    })
  }

  // 새 role 할당
  await keycloakFetch(`/users/${userId}/role-mappings/realm`, {
    method: 'POST',
    body: JSON.stringify([roleObj]),
  })
}

module.exports = router
