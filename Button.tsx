import React from 'react';
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...rest }) => (
  <button
    className={
      'px-4 py-2 rounded-2xl shadow-sm bg-gradient-to-r from-slate-600 to-slate-400 text-white font-medium text-sm ' +
      className
    }
    {...rest}
  >
    {children}
  </button>
);
