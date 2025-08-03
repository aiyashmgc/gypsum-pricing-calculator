import React from 'react';
export const Label: React.FC<{ htmlFor?: string; children: React.ReactNode; className?: string }> = ({ children, className = '', ...rest }) => (
  <label className={"block text-xs font-semibold mb-1 " + className} {...rest}>
    {children}
  </label>
);
