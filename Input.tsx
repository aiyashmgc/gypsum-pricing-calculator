import React from 'react';
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
  <input
    className={
      'border rounded-md px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ' +
      className
    }
    {...rest}
  />
);
