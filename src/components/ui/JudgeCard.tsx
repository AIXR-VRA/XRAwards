import React from 'react';

interface JudgeCardProps {
  name: string;
  title: string;
  company: string;
  role: string;
  image?: string;
  imageAlt?: string;
  className?: string;
}

export const JudgeCard: React.FC<JudgeCardProps> = ({
  name,
  title,
  company,
  role,
  image,
  imageAlt,
  className = '',
}) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="relative mb-4">
        {image && (
          <img
            src={image}
            alt={imageAlt || name}
            className="w-24 h-24 rounded-full mx-auto object-cover"
          />
        )}
        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
          {role}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-dark mb-1">{name}</h3>
      <p className="text-sm font-medium text-primary mb-1">{title}</p>
      <p className="text-sm text-secondary">{company}</p>
    </div>
  );
};

