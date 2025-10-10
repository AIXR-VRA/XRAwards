import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'dark' | 'hover';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const baseClasses = 'card';
  const variantClasses = {
    default: '',
    dark: 'card-dark',
    hover: 'hover:shadow-lg transition-all duration-300 cursor-pointer',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

