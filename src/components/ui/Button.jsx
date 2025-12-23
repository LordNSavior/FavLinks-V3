import React from 'react'

function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-3 py-1.5 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-1'
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-400',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-400',
  }

  const cls = `${base} ${variants[variant] || variants.primary} ${className}`
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}

export default Button
