import { useEffect, useState } from 'react'
import { Button, Card } from './ui'
import { apiFetch, apiDelete, apiPut } from '../api'

function UserRow({ user, me, onToggleAdmin, onClearActivities, onDeleteLinks, onDelete }) {
  const isMe = me && me.id === user.id
  return (
    <tr className="odd:bg-slate-800">
      <td className="px-4 py-3">{user.id}</td>
      <td className="px-4 py-3">{user.username}</td>
      <td className="px-4 py-3">{user.is_admin ? 'Yes' : 'No'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onToggleAdmin(user.id, user.is_admin)} disabled={isMe} variant="secondary">{user.is_admin ? 'Revoke admin' : 'Make admin'}</Button>
          <Button onClick={() => onClearActivities(user.id, user.username)} disabled={isMe} variant="secondary">Clear activities</Button>
          <Button onClick={() => onDeleteLinks(user.id, user.username)} disabled={isMe} variant="danger">Delete links</Button>
          <Button onClick={() => onDelete(user.id)} disabled={isMe} variant="danger">Delete</Button>
        </div>
      </td>
    </tr>
  )
}

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
        const res = await apiFetch('/auth/me')
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
      const res = await apiFetch('/admin/users')
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
      const res = await apiFetch('/activities/count?scope=all')
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
      if (me && me.id === id) { setError('Cannot delete your own account'); return }
      const res = await apiDelete(`/admin/users/${id}`)
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
      const res = await apiDelete('/activities?scope=all')
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
      const resCount = await apiFetch(`/activities/count?scope=user&userId=${userId}`)
      if (!resCount.ok) { setError('Failed to fetch count'); return }
      const { count } = await resCount.json()
      if (!confirm(`Clear ${count} activities for ${username}?`)) return
      const res = await apiDelete(`/activities?scope=user&userId=${userId}`)
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
      const res = await apiDelete(`/admin/users/${userId}/links`)
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
      if (me && me.id === id) { setError('Cannot change your own admin status'); return }
      const res = await apiPut(`/admin/users/${id}`, { isAdmin: !current })
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
              <UserRow
                key={u.id}
                user={u}
                me={me}
                onToggleAdmin={toggleAdmin}
                onClearActivities={clearUserActivities}
                onDeleteLinks={deleteUserLinks}
                onDelete={deleteUser}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default Admin
