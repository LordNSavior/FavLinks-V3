import React from 'react'

function IconButton({ children, ariaLabel, className = '', ...props }){
  return (
    <button aria-label={ariaLabel} className={`p-2 rounded-md hover:bg-slate-700 ${className}`} {...props}>
      {children}
    </button>
  )
}

export default IconButton
