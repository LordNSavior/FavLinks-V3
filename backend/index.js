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

    const token = auth.generateToken({ username: user.username, id: user.id })
    return res.status(200).json({ token, user: { id: user.id, username: user.username } })
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
    const token = auth.generateToken({ username: user.username, id: user.id })
    return res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/auth/me', auth.authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// User activity feed (most recent actions for the authenticated user)
app.get('/activities', auth.authenticateToken, db.getActivities)

// Protect links endpoints
app.get('/links', auth.authenticateToken, db.getLinks)
app.get('/links/:id', auth.authenticateToken, db.getLinkById)
app.post('/links', auth.authenticateToken, db.createLink)
app.delete('/links/:id', auth.authenticateToken, db.deleteLink)

app.listen(port, () => {
  console.log(`FavLinks API running on port ${port}`)
})
