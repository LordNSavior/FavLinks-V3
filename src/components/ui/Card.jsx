import React from 'react'

function Card({ children, className = '' }){
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}

export default Card
