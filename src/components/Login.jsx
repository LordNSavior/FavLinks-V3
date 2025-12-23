import { useState } from "react"

function Login({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [registerMode, setRegisterMode] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError("Please provide username and password.")
      return
    }
    setError("")

    try {
      const url = registerMode ? 'http://localhost:5000/auth/register' : 'http://localhost:5000/auth/login'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || (registerMode ? 'Register failed' : 'Login failed'))
        return
      }

      const data = await res.json()
      // data: { token, user }
      localStorage.setItem('favlinks_token', data.token)
      onLogin({ user: data.user, token: data.token })
    } catch (err) {
      console.error(err)
      setError('Network error')
    }
  }

  return (
    <div style={{maxWidth:400, margin:'3rem auto', padding:20, border:'1px solid #ddd', borderRadius:6}}>
      <h2>{registerMode ? 'Create account' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <label style={{display:'block', marginTop:8}}>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{width:'100%', padding:8}}
        />

        <label style={{display:'block', marginTop:8}}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{width:'100%', padding:8}}
        />

        {error && <div style={{color:'red', marginTop:8}}>{error}</div>}

        <button type="submit" style={{marginTop:12, padding:'8px 12px'}}>{registerMode ? 'Create account' : 'Login'}</button>
      </form>

      <div style={{marginTop:12, textAlign:'center'}}>
        <button onClick={() => setRegisterMode(!registerMode)} style={{background:'none', border:'none', color:'#06c', cursor:'pointer'}}>
          {registerMode ? 'Have an account? Login' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  )
}

export default Login
