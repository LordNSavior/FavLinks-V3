require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const db = require('./queries')
const auth = require('./auth')
const bcrypt = require('bcryptjs')

const app = express()
const port = process.env.DB_PORT

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (request, response) => {
  response.json({ info: 'FavLinks API - Node.js, Express, and PostgreSQL' })
})

// Initialize DB (create tables if needed)
db.initDb().catch((err) => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})

// Authentication endpoints
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  try {
    const user = await db.findUserByUsername(username)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    const isAdmin = !!user.is_admin
    const token = auth.generateToken({ username: user.username, id: user.id, isAdmin })
    return res.status(200).json({ token, user: { id: user.id, username: user.username, isAdmin } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Register endpoint
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  try {
    const existing = await db.findUserByUsername(username)
    if (existing) return res.status(409).json({ error: 'Username already exists' })

    const hash = await bcrypt.hash(password, 10)
    const user = await db.createUser(username, hash)
    const isAdmin = !!user.is_admin
    const token = auth.generateToken({ username: user.username, id: user.id, isAdmin })
    return res.status(201).json({ token, user: { ...user, isAdmin } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Admin routes - require authenticated user to have isAdmin flag
app.get('/admin/users', auth.authenticateToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
  try {
    const users = await db.listUsers()
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/admin/users/:id', auth.authenticateToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
  const id = parseInt(req.params.id)
  try {
    // Prevent deleting yourself
    if (req.user.id === id) return res.status(400).json({ error: 'Cannot delete your own account' })

    const target = await db.getUserById(id)
    if (!target) return res.status(404).json({ error: 'User not found' })

    // Prevent deleting last admin
    if (target.is_admin) {
      const admins = await db.countAdmins()
      if (admins <= 1) return res.status(400).json({ error: 'Cannot delete the last admin' })
    }

    const deleted = await db.deleteUserById(id)
    if (!deleted) return res.status(404).json({ error: 'User not found' })

    // Log admin deletion activity (performed by req.user)
    try {
      await db.logActivity(req.user.id, 'delete_user', JSON.stringify({ deleted }))
    } catch (e) {
      console.error('Failed to log delete_user activity', e)
    }

    res.json({ message: 'User deleted', user: deleted })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin: delete all links belonging to a user
app.delete('/admin/users/:id/links', auth.authenticateToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
  const id = parseInt(req.params.id)
  try {
    const target = await db.getUserById(id)
    if (!target) return res.status(404).json({ error: 'User not found' })

    const result = await db.deleteLinksByUser(id)

    try {
      await db.logActivity(req.user.id, 'delete_user_links', JSON.stringify({ target: id, deleted: result.deleted }))
    } catch (e) {
      console.error('Failed to log delete_user_links activity', e)
    }

    return res.json({ message: 'User links deleted', deleted: result.deleted, rows: result.rows })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.put('/admin/users/:id', auth.authenticateToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
  const id = parseInt(req.params.id)
  const { isAdmin } = req.body
  try {
    // Prevent changing your own admin status
    if (req.user.id === id) return res.status(400).json({ error: 'Cannot change your own admin status' })

    const target = await db.getUserById(id)
    if (!target) return res.status(404).json({ error: 'User not found' })

    // If demoting an admin, ensure there will still be at least one admin
    if (target.is_admin && !isAdmin) {
      const admins = await db.countAdmins()
      if (admins <= 1) return res.status(400).json({ error: 'Cannot demote the last admin' })
    }

    const updated = await db.updateUserAdmin(id, !!isAdmin)
    if (!updated) return res.status(404).json({ error: 'User not found' })

    // Log admin update (performed by req.user)
    try {
      await db.logActivity(req.user.id, 'update_user_admin', JSON.stringify({ target: updated, changed_by: req.user.id }))
    } catch (e) {
      console.error('Failed to log update_user_admin activity', e)
    }

    res.json({ message: 'User updated', user: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/auth/me', auth.authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// User activity feed (most recent actions for the authenticated user)
app.get('/activities', auth.authenticateToken, db.getActivities)

// Activity counts - return how many activities would be affected
app.get('/activities/count', auth.authenticateToken, async (req, res) => {
  const scope = req.query.scope || 'self' // self, all, user
  try {
    if (scope === 'all') {
      if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
      const count = await db.countAllActivities()
      return res.json({ count })
    }

    if (scope === 'user') {
      if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
      const userId = parseInt(req.query.userId)
      if (!userId) return res.status(400).json({ error: 'userId required' })
      const count = await db.countActivitiesByUser(userId)
      return res.json({ count })
    }

    // default: self
    const count = await db.countActivitiesByUser(req.user.id)
    return res.json({ count })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Clear activities: regular users clear their own, admins can clear all or a specific user's activities
app.delete('/activities', auth.authenticateToken, async (req, res) => {
  const scope = req.query.scope || 'self' // 'self' or 'all' or 'user'
  try {
    if (scope === 'all') {
      if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
      const count = await db.deleteAllActivities()
      await db.logActivity(req.user.id, 'clear_activity', JSON.stringify({ scope: 'all', deleted: count }))
      return res.json({ message: 'All activities cleared', deleted: count })
    }

    if (scope === 'user') {
      // admin clearing another user's activities; requires admin and ?userId=...
      if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' })
      const userId = parseInt(req.query.userId)
      if (!userId) return res.status(400).json({ error: 'userId required' })
      const count = await db.deleteActivitiesByUser(userId)
      await db.logActivity(req.user.id, 'clear_activity', JSON.stringify({ scope: 'user', target: userId, deleted: count }))
      return res.json({ message: 'User activities cleared', deleted: count })
    }

    // default: clear own activities
    const count = await db.deleteActivitiesByUser(req.user.id)
    await db.logActivity(req.user.id, 'clear_activity', JSON.stringify({ scope: 'self', deleted: count }))
    return res.json({ message: 'Your activities cleared', deleted: count })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Protect links endpoints
// Public shared links (no authentication required)
app.get('/links/public', db.getPublicLinks)

// Protect links endpoints
app.get('/links', auth.authenticateToken, db.getLinks)
app.get('/links/:id', auth.authenticateToken, db.getLinkById)
app.post('/links', auth.authenticateToken, db.createLink)
app.delete('/links/:id', auth.authenticateToken, db.deleteLink)

app.listen(port, () => {
  console.log(`FavLinks API running on port ${port}`)
})
