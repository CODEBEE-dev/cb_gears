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
    const sessionRole = req.session.user.role
    const sessionGroup = req.session.user.group  // teacher의 경우 자기 그룹 path

    const ALLOWED_ROLES = ['school_admin', 'teacher', 'student']

    // teacher: 자기 그룹 멤버만 조회
    if (sessionRole === 'teacher') {
      if (!sessionGroup) return res.json({ users: [] })

      // 그룹 id 조회
      const groupName = sessionGroup.split('/').pop()
      const searchR = await keycloakFetch(`/groups?search=${encodeURIComponent(groupName)}&exact=true`)
      if (!searchR.ok) return res.status(500).json({ error: '그룹 조회 실패' })
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
      const group = findByPath(candidates)
      if (!group) return res.json({ users: [] })

      const params = new URLSearchParams({ first, max })
      if (search) params.set('search', search)
      const membersR = await keycloakFetch(`/groups/${group.id}/members?${params}`)
      if (!membersR.ok) return res.status(500).json({ error: '그룹 멤버 조회 실패' })
      const members = await membersR.json()

      const usersWithRoles = await Promise.all(members.map(async u => {
        const [rolesR, groupsR] = await Promise.all([
          keycloakFetch(`/users/${u.id}/role-mappings/realm`),
          keycloakFetch(`/users/${u.id}/groups`),
        ])
        const roles = rolesR.ok ? await rolesR.json() : []
        const groups = groupsR.ok ? await groupsR.json() : []
        const realmRoles = roles.filter(r => ALLOWED_ROLES.includes(r.name)).map(r => r.name)
        return { ...u, realmRoles, groups }
      }))

      return res.json({ users: usersWithRoles.filter(u => u.id !== req.session.user.id) })
    }

    // school_admin: 자기 root group 하위 전체 멤버 조회
    if (!sessionGroup) return res.json({ users: [] })
    const rootGroup = await getRootGroup(sessionGroup)
    if (!rootGroup) return res.json({ users: [] })

    // root group + 모든 하위 그룹 id 수집
    const subGroups = await collectSubGroupsFlat(rootGroup.id)
    const allGroupIds = [rootGroup.id, ...subGroups.map(g => g.id)]

    // 각 그룹 멤버 병렬 조회 후 중복 제거 (userId 기준)
    const memberArrays = await Promise.all(
      allGroupIds.map(gid =>
        keycloakFetch(`/groups/${gid}/members?max=500`).then(r => r.ok ? r.json() : [])
      )
    )
    const seenIds = new Set()
    let members = memberArrays.flat().filter(u => {
      if (seenIds.has(u.id)) return false
      seenIds.add(u.id)
      return true
    })

    // search 필터 (username, email, firstName, lastName)
    if (search) {
      const q = search.toLowerCase()
      members = members.filter(u =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q)
      )
    }

    const usersWithRoles = await Promise.all(members.map(async u => {
      const [rolesR, groupsR] = await Promise.all([
        keycloakFetch(`/users/${u.id}/role-mappings/realm`),
        keycloakFetch(`/users/${u.id}/groups`),
      ])
      const roles = rolesR.ok ? await rolesR.json() : []
      const groups = groupsR.ok ? await groupsR.json() : []
      const realmRoles = roles.filter(r => ALLOWED_ROLES.includes(r.name)).map(r => r.name)
      return { ...u, realmRoles, groups }
    }))

    res.json({ users: usersWithRoles.filter(u => u.id !== req.session.user.id) })
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

    // realm role + 그룹 병렬 조회
    const [rolesR, groupsR] = await Promise.all([
      keycloakFetch(`/users/${req.params.id}/role-mappings/realm`),
      keycloakFetch(`/users/${req.params.id}/groups`),
    ])
    const roles = rolesR.ok ? await rolesR.json() : []
    const groups = groupsR.ok ? await groupsR.json() : []

    res.json({ user: { ...user, realmRoles: roles.map(r => r.name), groups } })
  } catch (err) {
    console.error('[Admin] 사용자 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 사용자 생성
router.post('/users', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { username, email, firstName, lastName, password, role, enabled = true, groupId } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'username과 password는 필수입니다' })
    }

    // teacher: 자기 그룹 자동 할당 / school_admin: 프론트에서 전달한 groupId 사용
    const sessionRole = req.session.user.role
    let resolvedGroupId = groupId || null
    if (sessionRole === 'teacher' && !resolvedGroupId) {
      const sessionGroup = req.session.user.group  // ex) "/python_middle_school/1st_grade/class_1"
      if (sessionGroup) {
        const groupsR = await keycloakFetch('/groups?briefRepresentation=false')
        if (groupsR.ok) {
          const groups = await groupsR.json()
          const normalizedSession = sessionGroup.startsWith('/') ? sessionGroup : `/${sessionGroup}`

          // subGroups가 lazy라 path로 직접 검색
          const searchR = await keycloakFetch(`/groups?search=${encodeURIComponent(normalizedSession.split('/').pop())}&exact=true`)
          if (searchR.ok) {
            const candidates = await searchR.json()
            // path 정확히 일치하는 것 찾기 (재귀로 subGroups 포함)
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
            const matched = findByPath(candidates)
            resolvedGroupId = matched?.id || null
            console.log(`[Admin] teacher 그룹 자동 할당: session.group=${sessionGroup}, matched=${matched?.name}, id=${resolvedGroupId}`)
          }
        }
      }
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

    // role 할당 + 그룹 할당 병렬 처리
    const tasks = []
    if (role && userId) tasks.push(assignRole(userId, role))
    if (resolvedGroupId && userId) tasks.push(assignGroup(userId, resolvedGroupId))
    await Promise.all(tasks)

    res.status(201).json({ message: '사용자가 생성되었습니다', userId })
  } catch (err) {
    console.error('[Admin] 사용자 생성 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 사용자 수정
router.put('/users/:id', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { username, email, firstName, lastName, enabled, role, password, groupId } = req.body
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

    // role 변경 + 그룹 변경
    const tasks = []
    if (role) tasks.push(assignRole(userId, role))
    if (groupId !== undefined) tasks.push(reassignGroup(userId, groupId))
    await Promise.all(tasks)

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

// 그룹 목록 조회
// school_admin의 root 그룹 id 조회 헬퍼
async function getRootGroup(sessionGroup) {
  const rootName = sessionGroup.replace(/^\//, '').split('/')[0]
  const r = await keycloakFetch(`/groups?search=${encodeURIComponent(rootName)}&exact=true`)
  if (!r.ok) return null
  const candidates = await r.json()
  return candidates.find(g => g.name === rootName) || null
}

// 서브그룹을 트리 구조로 재귀 수집
async function collectSubGroupsTree(groupId) {
  const r = await keycloakFetch(`/groups/${groupId}/children`)
  if (!r.ok) return []
  const children = await r.json()
  return Promise.all(children.map(async child => ({
    id: child.id,
    name: child.name,
    path: child.path,
    subGroupCount: child.subGroupCount || 0,
    children: await collectSubGroupsTree(child.id),
  })))
}

// 서브그룹을 flat하게 재귀 수집 (계정 생성 드롭다운용)
async function collectSubGroupsFlat(groupId) {
  const r = await keycloakFetch(`/groups/${groupId}/children`)
  if (!r.ok) return []
  const children = await r.json()
  const result = []
  for (const child of children) {
    result.push(child)
    result.push(...await collectSubGroupsFlat(child.id))
  }
  return result
}

// 그룹 목록 조회 (트리 구조)
router.get('/groups', requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const sessionGroup = req.session.user.group
    if (!sessionGroup) return res.json({ groups: [] })
    const rootGroup = await getRootGroup(sessionGroup)
    if (!rootGroup) return res.json({ groups: [] })
    const flat = req.query.flat === 'true'
    if (flat) {
      const groups = await collectSubGroupsFlat(rootGroup.id)
      return res.json({ groups })
    }
    const tree = await collectSubGroupsTree(rootGroup.id)
    res.json({ groups: tree, rootId: rootGroup.id })
  } catch (err) {
    console.error('[Admin] 그룹 목록 조회 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 그룹 생성 (school_admin만)
router.post('/groups', requireRole('school_admin'), async (req, res) => {
  try {
    const { name, parentId } = req.body
    if (!name) {
      return res.status(400).json({ error: 'name은 필수입니다' })
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return res.status(400).json({ error: '그룹ID는 영문, 숫자, 하이픈, 언더스코어만 사용 가능합니다' })
    }

    const sessionGroup = req.session.user.group
    const rootGroup = await getRootGroup(sessionGroup)
    if (!rootGroup) return res.status(400).json({ error: 'Root 그룹을 찾을 수 없습니다' })

    const targetParentId = parentId || rootGroup.id

    const r = await keycloakFetch(`/groups/${targetParentId}/children`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    if (!r.ok) {
      const body = await r.text()
      const msg = body.includes('already exists') ? '이미 존재하는 그룹ID입니다' : `그룹 생성 실패 (${r.status})`
      return res.status(r.status).json({ error: msg })
    }
    res.status(201).json({ message: '그룹이 생성되었습니다' })
  } catch (err) {
    console.error('[Admin] 그룹 생성 실패:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 그룹 삭제 (school_admin만)
router.delete('/groups/:id', requireRole('school_admin'), async (req, res) => {
  try {
    const sessionGroup = req.session.user.group
    const rootGroup = await getRootGroup(sessionGroup)
    if (!rootGroup) return res.status(400).json({ error: 'Root 그룹을 찾을 수 없습니다' })

    // root 그룹 삭제 방지
    if (req.params.id === rootGroup.id) {
      return res.status(403).json({ error: 'Root 그룹은 삭제할 수 없습니다' })
    }

    // 멤버 또는 서브그룹 존재 여부 확인
    const [membersR, childrenR] = await Promise.all([
      keycloakFetch(`/groups/${req.params.id}/members?max=1`),
      keycloakFetch(`/groups/${req.params.id}/children?max=1`),
    ])
    const members = membersR.ok ? await membersR.json() : []
    const children = childrenR.ok ? await childrenR.json() : []
    if (members.length > 0) return res.status(409).json({ error: '그룹에 속한 멤버가 있어 삭제할 수 없습니다' })
    if (children.length > 0) return res.status(409).json({ error: '하위 그룹이 있어 삭제할 수 없습니다' })

    const r = await keycloakFetch(`/groups/${req.params.id}`, { method: 'DELETE' })
    if (!r.ok) return res.status(r.status).json({ error: '그룹 삭제 실패' })
    res.json({ message: '그룹이 삭제되었습니다' })
  } catch (err) {
    console.error('[Admin] 그룹 삭제 실패:', err)
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

// 그룹 할당 헬퍼
async function assignGroup(userId, groupId) {
  await keycloakFetch(`/users/${userId}/groups/${groupId}`, { method: 'PUT' })
}

// 그룹 재할당 헬퍼 (기존 그룹 모두 제거 후 새 그룹 할당)
async function reassignGroup(userId, groupId) {
  const groupsR = await keycloakFetch(`/users/${userId}/groups`)
  const groups = groupsR.ok ? await groupsR.json() : []
  await Promise.all(groups.map(g =>
    keycloakFetch(`/users/${userId}/groups/${g.id}`, { method: 'DELETE' })
  ))
  if (groupId) {
    await keycloakFetch(`/users/${userId}/groups/${groupId}`, { method: 'PUT' })
  }
}

module.exports = router
