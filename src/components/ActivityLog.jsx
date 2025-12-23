import { useEffect, useState } from 'react'

function ActivityLog() {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchActivities()
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

  if (!activities.length) return <div><h4>Recent activity</h4><p>No recent activity</p></div>

  return (
    <div>
      <h4>Recent activity</h4>
      <ul>
        {activities.map((a) => (
          <li key={a.id}>{new Date(a.created_at).toLocaleString()} — {a.action} — {a.details}</li>
        ))}
      </ul>
    </div>
  )
}

export default ActivityLog
