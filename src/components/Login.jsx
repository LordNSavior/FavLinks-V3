import { useState } from "react"
import { apiPost } from "../api"
import { TOKEN_KEY } from "../config"
import { Button } from "./ui"

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
      const path = registerMode ? '/auth/register' : '/auth/login'
      const res = await apiPost(path, { username, password }, { auth: false })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || (registerMode ? 'Register failed' : 'Login failed'))
        return
      }

      const data = await res.json()
      // data: { token, user }
      localStorage.setItem(TOKEN_KEY, data.token)
      onLogin({ user: data.user, token: data.token })
    } catch (err) {
      console.error(err)
      setError('Network error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-slate-100 p-6">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 shadow-md shadow-indigo-500/30 mb-2">
            <svg width="20" height="20" className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">FavLinks</h1>
          <p className="text-slate-400 text-sm mt-1">Your personal link organizer</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/40 p-8 border border-slate-700/50">
          <h2 className="text-2xl font-semibold text-center mb-6">{registerMode ? 'Create account' : 'Welcome back'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username: </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password: </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-base font-medium bg-indigo-600 hover:bg-indigo-500 transition-colors">
              {registerMode ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400 text-sm">
              {registerMode ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => setRegisterMode(!registerMode)} 
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {registerMode ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
