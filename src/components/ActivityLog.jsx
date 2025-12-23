import { useEffect, useState } from 'react'

function ActivityLog() {
  const [activities, setActivities] = useState([])
  const [clearing, setClearing] = useState(false)
  const [me, setMe] = useState(null)

  useEffect(() => {
    fetchActivities()
    fetchMe()
  }, [])

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch('http://localhost:5000/activities', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) return
      const data = await res.json()
      setActivities(data)
    } catch (err) {
      console.error('Error fetching activities', err)
    }
  }

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch('http://localhost:5000/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) return
      const data = await res.json()
      setMe(data.user)
    } catch (err) {
      console.error('Failed to fetch current user', err)
    }
  }

  const clearActivities = async () => {
    const isAdmin = me && me.isAdmin
    const scope = isAdmin ? 'all' : 'self'
    if (!confirm(`Clear recent activity (${scope === 'all' ? 'all users' : 'your activity'})?`)) return
    setClearing(true)
    try {
      const token = localStorage.getItem('favlinks_token')
      const url = `http://localhost:5000/activities${scope === 'self' ? '' : '?scope=all'}`
      const res = await fetch(url, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {} })
      if (!res.ok) {
        console.error('Failed to clear activities')
        setClearing(false)
        return
      }
      // re-fetch to ensure server-side deletion
      await fetchActivities()
    } catch (err) {
      console.error('Error clearing activities', err)
    } finally {
      setClearing(false)
    }
  }

  const renderDetails = (a) => {
    // a: { id, user_id, username, action, details, created_at }
    let details = a.details
    let parsed = null
    try {
      parsed = JSON.parse(a.details)
    } catch (e) {
      parsed = null
    }

    if (a.action === 'create_link' && parsed) {
      const name = parsed.name || parsed.title || ''
      const url = parsed.url || parsed.URL || parsed.link || ''
      return `${a.username || 'User'} added link${name ? ` "${name}"` : ''}${url ? ` — ${url}` : ''}`
    }

    if (a.action === 'delete_link' && parsed) {
      const name = parsed.name || ''
      const url = parsed.url || parsed.URL || ''
      return `${a.username || 'User'} deleted link${name ? ` "${name}"` : ''}${url ? ` — ${url}` : ''}`
    }

    if ((a.action === 'update_user_admin' || a.action === 'update_admin_flag' || a.action === 'update_user_admin') && parsed) {
      const target = parsed.target || parsed
      return `${a.username || 'User'} changed admin status: ${JSON.stringify(target)}`
    }

    // default
    return details || a.action
  }

  return (
    <div>
      <h4>Recent activity</h4>
      <div style={{marginBottom:8}}>
        <button onClick={clearActivities} disabled={clearing || activities.length===0}>{clearing ? 'Clearing...' : 'Clear recent activity'}</button>
      </div>
      {!activities.length ? <p>No recent activity</p> : (
        <ul>
          {activities.map((a) => (
            <li key={a.id}>{new Date(a.created_at).toLocaleString()} — {renderDetails(a)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ActivityLog
