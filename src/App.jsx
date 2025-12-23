import { useEffect, useState } from "react"
import LinkContainer from "./components/LinkContainer"
import Login from "./components/Login"
import Admin from "./components/Admin"
import { Button } from "./components/ui"
import { apiFetch } from "./api"
import { TOKEN_KEY } from "./config"

function App() {
  const [user, setUser] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      // verify token with backend
      apiFetch('/auth/me')
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token')
          return res.json()
        })
        .then((data) => {
          setUser(data.user)
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
        })
    }
  }, [])

  const handleLogin = ({ user: u, token: t }) => {
    setUser(u)
    localStorage.setItem(TOKEN_KEY, t)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-900 text-slate-100 p-6">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-nowrap">
            <h3 className="text-xl font-semibold m-0">Welcome, {user.username}</h3>
            <div className="flex items-center gap-2">
              {user.isAdmin && <Button onClick={() => setShowAdmin(!showAdmin)} className="!px-3 !py-1">Admin</Button>}
              <Button variant="secondary" onClick={handleLogout} className="!px-3 !py-1">Logout</Button>
            </div>
          </div>
          <div className="text-sm text-slate-400"><br /></div>
        </div>
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          {showAdmin ? <Admin /> : <LinkContainer user={user} />}
        </div>
      </div>
    </div>
  )
}

export default App