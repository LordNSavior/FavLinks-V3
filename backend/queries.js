require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const Pool = require('pg').Pool
// Use a dedicated POSTGRES_PORT for the DB server; fall back to DB_PORT for compatibility
const dbPort = process.env.POSTGRES_PORT
  ? parseInt(process.env.POSTGRES_PORT, 10)
  : process.env.DB_PORT
  ? parseInt(process.env.DB_PORT, 10)
  : 5432
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: dbPort,
})

// Initialize DB: create users and activities tables and ensure links has user_id
async function initDb() {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE
        );
    `)

    // Create activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Ensure links table has user_id column
    await pool.query(`
      ALTER TABLE links
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    `)

    // Ensure links table has is_public column
    await pool.query(`
      ALTER TABLE links
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
    `)

    // Ensure users table has is_admin column (for upgrades)
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `)
  } catch (err) {
    console.error('Error initializing DB:', err)
    throw err
  }
}

// Getters
const getLinks = async (request, response) => {
  try {
    const userId = request.user && request.user.id
    const results = userId
      ? await pool.query('SELECT * FROM links WHERE user_id = $1 ORDER BY id DESC', [userId])
      : await pool.query('SELECT * FROM links ORDER BY id DESC')
    return response.status(200).json(results.rows)
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Database error' })
  }
}

const getPublicLinks = async (request, response) => {
  try {
    const results = await pool.query(`
      SELECT l.id, l.name, l.url, l.user_id, u.username AS shared_by
      FROM links l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.is_public = TRUE
      ORDER BY l.id DESC
    `)
    return response.status(200).json(results.rows)
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Database error' })
  }
}

const getLinkById = async (request, response) => {
  const id = parseInt(request.params.id)
  const userId = request.user && request.user.id
  try {
    const results = await pool.query('SELECT * FROM links WHERE id = $1 AND user_id = $2', [id, userId])
    if (results.rows.length === 0) {
      return response.status(404).json({ error: 'Link not found' })
    }
    return response.status(200).json(results.rows[0])
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Database error' })
  }
}

// Create and delete links
const createLink = async (request, response) => {
  const { name, URL, isPublic } = request.body
  const userId = request.user && request.user.id

  if (!name || !URL) {
    return response.status(400).json({ error: 'Name and URL are required' })
  }

  try {
    const results = await pool.query(
      'INSERT INTO links (name, url, user_id, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, URL, userId, !!isPublic]
    )

    // Log activity
    await pool.query('INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)', [userId, 'create_link', JSON.stringify(results.rows[0])])

    return response.status(201).json(results.rows[0])
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Database error' })
  }
}

const deleteLink = async (request, response) => {
  const id = parseInt(request.params.id)
  const userId = request.user && request.user.id

  try {
    // Return deleted row id
    const results = await pool.query('DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING id, name, url', [id, userId])

    if (results.rowCount === 0) {
      return response.status(404).json({ error: 'Link not found' })
    }

    // Log activity
    await pool.query('INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)', [userId, 'delete_link', JSON.stringify(results.rows[0])])

    // Reset sequence if table is now empty
    const checkEmpty = await pool.query('SELECT COUNT(*) FROM links WHERE user_id = $1', [userId])
    if (checkEmpty.rows[0].count === '0') {
      // Only restart sequence globally if no rows exist at all
      const total = await pool.query('SELECT COUNT(*) FROM links')
      if (total.rows[0].count === '0') {
        await pool.query('ALTER SEQUENCE links_id_seq RESTART WITH 1')
      }
    }

    return response.status(200).json({ message: 'Link deleted', id: results.rows[0].id })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Database error' })
  }
}

const createUser = async (username, passwordHash, isAdmin = false) => {
  const results = await pool.query('INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin', [username, passwordHash, isAdmin])
  return results.rows[0]
}

const findUserByUsername = async (username) => {
  const results = await pool.query('SELECT id, username, password_hash, is_admin FROM users WHERE username = $1', [username])
  return results.rows[0]
}

const getActivities = async (request, response) => {
  try {
    const userId = request.user && request.user.id
    if (!userId) return response.status(400).json({ error: 'Missing user' })

    // If the requester is an admin, return recent activities across all users (include username)
    if (request.user && request.user.isAdmin) {
      const results = await pool.query(`
        SELECT a.id, a.user_id, u.username, a.action, a.details, a.created_at
        FROM activities a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 100
      `)
      return response.status(200).json(results.rows)
    }

    const results = await pool.query('SELECT a.id, a.user_id, u.username, a.action, a.details, a.created_at FROM activities a LEFT JOIN users u ON a.user_id = u.id WHERE a.user_id = $1 ORDER BY a.created_at DESC LIMIT 50', [userId])
    return response.status(200).json(results.rows)
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Database error' })
  }
}

const listUsers = async () => {
  const results = await pool.query('SELECT id, username, is_admin FROM users ORDER BY id')
  return results.rows
}

const deleteUserById = async (id) => {
  const results = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id])
  return results.rows[0]
}

const deleteActivitiesByUser = async (userId) => {
  const results = await pool.query('DELETE FROM activities WHERE user_id = $1 RETURNING id', [userId])
  return results.rowCount
}

const deleteLinksByUser = async (userId) => {
  const results = await pool.query('DELETE FROM links WHERE user_id = $1 RETURNING id, name, url', [userId])
  return { deleted: results.rowCount, rows: results.rows }
}

const deleteAllActivities = async () => {
  const results = await pool.query('DELETE FROM activities RETURNING id')
  return results.rowCount
}

const countActivitiesByUser = async (userId) => {
  const results = await pool.query('SELECT COUNT(*) FROM activities WHERE user_id = $1', [userId])
  return parseInt(results.rows[0].count, 10)
}

const countAllActivities = async () => {
  const results = await pool.query('SELECT COUNT(*) FROM activities')
  return parseInt(results.rows[0].count, 10)
}

const getUserById = async (id) => {
  const results = await pool.query('SELECT id, username, is_admin FROM users WHERE id = $1', [id])
  return results.rows[0]
}

const countAdmins = async () => {
  const results = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = TRUE')
  return parseInt(results.rows[0].count, 10)
}

const logActivity = async (userId, action, details) => {
  await pool.query('INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)', [userId, action, details])
}

const updateUserAdmin = async (id, isAdmin) => {
  const results = await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, username, is_admin', [isAdmin, id])
  const updated = results.rows[0]
  // log admin change in activities
  if (updated) {
    try {
      await pool.query('INSERT INTO activities (user_id, action, details) VALUES ($1, $2, $3)', [updated.id, 'update_admin_flag', JSON.stringify({ id: updated.id, username: updated.username, is_admin: updated.is_admin })])
    } catch (err) {
      console.error('Failed to log admin update activity', err)
    }
  }
  return updated
}

module.exports = {
  initDb,
  pool,
  getLinks,
  getLinkById,
  createLink,
  deleteLink,
  createUser,
  findUserByUsername,
  getActivities,
  listUsers,
  deleteUserById,
  updateUserAdmin,
  getUserById,
  countAdmins,
  logActivity,
  deleteActivitiesByUser,
  deleteLinksByUser,
  deleteAllActivities,
  countActivitiesByUser,
  countAllActivities,
  getPublicLinks,
}

