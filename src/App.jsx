import { useEffect, useState } from "react"
import LinkContainer from "./components/LinkContainer"
import Login from "./components/Login"

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('favlinks_token')
    if (savedToken) {
      // verify token with backend
      fetch('http://localhost:5000/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token')
          return res.json()
        })
        .then((data) => {
          setUser(data.user)
          setToken(savedToken)
        })
        .catch(() => {
          localStorage.removeItem('favlinks_token')
        })
    }
  }, [])

  const handleLogin = ({ user: u, token: t }) => {
    setUser(u)
    setToken(t)
    localStorage.setItem('favlinks_token', t)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('favlinks_token')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}}>
        <h3>Welcome, {user.username}</h3>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <LinkContainer />
    </div>
  )
}

export default App