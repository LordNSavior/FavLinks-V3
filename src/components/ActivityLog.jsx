import { useEffect, useState } from 'react'
import { apiFetch, apiDelete } from '../api'
import { ACTIONS } from '../config'
import { Button } from './ui'

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
      const res = await apiFetch('/activities')
      if (!res.ok) return
      const data = await res.json()
      setActivities(data)
    } catch (err) {
      console.error('Error fetching activities', err)
    }
  }

  const fetchMe = async () => {
    try {
      const res = await apiFetch('/auth/me')
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
      const path = scope === 'self' ? '/activities' : '/activities?scope=all'
      const res = await apiDelete(path)
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
    let parsed = null
    try {
      parsed = JSON.parse(a.details)
    } catch {
      parsed = null
    }

    if (a.action === ACTIONS.CREATE_LINK && parsed) {
      const name = parsed.name || parsed.title || ''
      const url = parsed.url || parsed.URL || parsed.link || ''
      return `${a.username || 'User'} added link${name ? ` "${name}"` : ''}${url ? ` — ${url}` : ''}`
    }

    if (a.action === ACTIONS.DELETE_LINK && parsed) {
      const name = parsed.name || ''
      const url = parsed.url || parsed.URL || ''
      return `${a.username || 'User'} deleted link${name ? ` "${name}"` : ''}${url ? ` — ${url}` : ''}`
    }

    if ((a.action === 'update_user_admin' || a.action === ACTIONS.UPDATE_ADMIN || a.action === 'update_user_admin') && parsed) {
      const target = parsed.target || parsed
      return `${a.username || 'User'} changed admin status: ${JSON.stringify(target)}`
    }

    // default
    return a.details || a.action
  }

  return (
    <div className="my-4">
      <h4 className="text-md font-medium">Recent activity</h4>
      <div className="my-2">
        <Button onClick={clearActivities} disabled={clearing || activities.length===0} variant="secondary">{clearing ? 'Clearing...' : 'Clear recent activity'}</Button>
      </div>
      {!activities.length ? <p className="text-sm text-slate-400">No recent activity</p> : (
        <ul className="text-sm space-y-1">
          {activities.map((a) => (
            <li key={a.id} className="text-slate-300">{new Date(a.created_at).toLocaleString()} — {renderDetails(a)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ActivityLog
