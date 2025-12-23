import { useEffect, useState } from 'react'
import { Button, Card } from './ui'

function Admin() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [me, setMe] = useState(null)
  const [allCount, setAllCount] = useState(null)
  const [loadingCount, setLoadingCount] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
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
    fetchMe()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch('http://localhost:5000/admin/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) {
        setError('Failed to load users')
        return
      }
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error(err)
      setError('Network error')
    }
  }

  const fetchAllActivityCount = async () => {
    try {
      setLoadingCount(true)
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch('http://localhost:5000/activities/count?scope=all', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) { setAllCount(null); return }
      const data = await res.json()
      setAllCount(data.count)
    } catch (e) {
      console.error('Failed to fetch all activity count', e)
      setAllCount(null)
    } finally { setLoadingCount(false) }
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete user? This cannot be undone.')) return
    try {
      // prevent deleting self in UI
      if (me && me.id === id) { setError('Cannot delete your own account'); return }
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch(`http://localhost:5000/admin/users/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) {
        setError('Failed to delete user')
        return
      }
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      console.error(err)
      setError('Network error')
    }
  }

  const clearAllActivities = async () => {
    try {
      await fetchAllActivityCount()
      const count = allCount ?? 0
      if (!confirm(`Clear all activities? This will delete ${count} entries.`)) return
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch('http://localhost:5000/activities?scope=all', { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) { setError('Failed to clear all activities'); return }
      const data = await res.json()
      alert(`Deleted ${data.deleted} activities.`)
    } catch (e) {
      console.error(e)
      setError('Network error')
    }
  }

  const clearUserActivities = async (userId, username) => {
    try {
      const token = localStorage.getItem('favlinks_token')
      const resCount = await fetch(`http://localhost:5000/activities/count?scope=user&userId=${userId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!resCount.ok) { setError('Failed to fetch count'); return }
      const { count } = await resCount.json()
      if (!confirm(`Clear ${count} activities for ${username}?`)) return
      const res = await fetch(`http://localhost:5000/activities?scope=user&userId=${userId}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) { setError('Failed to clear user activities'); return }
      const data = await res.json()
      alert(`Deleted ${data.deleted} activities for ${username}.`)
    } catch (e) {
      console.error(e)
      setError('Network error')
    }
  }

  const deleteUserLinks = async (userId, username) => {
    try {
      if (!confirm(`Delete all links for ${username}? This cannot be undone.`)) return
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch(`http://localhost:5000/admin/users/${userId}/links`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) { setError('Failed to delete user links'); return }
      const data = await res.json()
      alert(`Deleted ${data.deleted} links for ${username}.`)
    } catch (e) {
      console.error(e)
      setError('Network error')
    }
  }

  const toggleAdmin = async (id, current) => {
    try {
      // prevent changing own admin status in UI
      if (me && me.id === id) { setError('Cannot change your own admin status'); return }
      const token = localStorage.getItem('favlinks_token')
      const res = await fetch(`http://localhost:5000/admin/users/${id}`, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}), body: JSON.stringify({ isAdmin: !current }) })
      if (!res.ok) {
        const err = await res.json().catch(()=> ({}))
        setError(err.error || 'Failed to update user')
        return
      }
      const data = await res.json()
      setUsers(users.map(u => u.id === id ? data.user : u))
    } catch (err) {
      console.error(err)
      setError('Network error')
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">Admin — Manage Users</h3>
      {error && <div className="text-red-400">{error}</div>}
      <div className="flex items-center gap-3 my-4">
        <Button onClick={clearAllActivities} disabled={!me || !me.isAdmin || loadingCount}>{loadingCount ? 'Checking...' : 'Clear all activities'}</Button>
        {me && me.isAdmin && <Button onClick={fetchAllActivityCount} className="bg-slate-700 hover:bg-slate-600">Refresh count ({allCount===null ? '—' : allCount})</Button>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-slate-400">ID</th>
              <th className="px-4 py-2 text-left text-slate-400">Username</th>
              <th className="px-4 py-2 text-left text-slate-400">Admin</th>
              <th className="px-4 py-2 text-left text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="odd:bg-slate-800">
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{u.is_admin ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => toggleAdmin(u.id, u.is_admin)} disabled={me && me.id === u.id} className="bg-slate-700 hover:bg-slate-600">{u.is_admin ? 'Revoke admin' : 'Make admin'}</Button>
                    <Button onClick={() => clearUserActivities(u.id, u.username)} disabled={me && me.id === u.id} className="bg-slate-700 hover:bg-slate-600">Clear activities</Button>
                    <Button onClick={() => deleteUserLinks(u.id, u.username)} disabled={me && me.id === u.id} className="bg-red-600 hover:bg-red-500">Delete links</Button>
                    <Button onClick={() => deleteUser(u.id)} disabled={me && me.id === u.id} className="bg-red-600 hover:bg-red-500">Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default Admin
