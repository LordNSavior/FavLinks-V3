import React from 'react'

function Header({ user, onLogout, onToggleAdmin }){
  return (
    <header className="layout-header">
      <div>
        <div className="brand">FavLinks</div>
        <div className="muted small">Save and share helpful links</div>
      </div>
      <div className="header-controls">
        {user && <div className="muted small">Signed in as {user.username}</div>}
        {user && user.isAdmin && <button onClick={onToggleAdmin} className="small">Admin</button>}
        <button onClick={onLogout} className="small">Logout</button>
      </div>
    </header>
  )
}

export default Header
