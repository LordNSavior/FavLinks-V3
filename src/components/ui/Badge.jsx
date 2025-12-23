import React from 'react'

function Badge({ children, className = '' }){
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-100 ${className}`}>{children}</span>
  )
}

export default Badge
