import React from 'react';

interface WinnerCardProps {
  company: string;
  product: string;
  category: string;
  year: number;
  image?: string;
  imageAlt?: string;
  logo?: string;
  logoAlt?: string;
  className?: string;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({
  company,
  product,
  category,
  year,
  image,
  imageAlt,
  logo,
  logoAlt,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {image && (
        <div className="aspect-video overflow-hidden">
          <img
            src={image}
            alt={imageAlt || `${company} - ${product}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {logo && (
            <img
              src={logo}
              alt={logoAlt || company}
              className="h-8 w-auto"
            />
          )}
          <span className="text-sm text-secondary">{year}</span>
        </div>
        
        <h3 className="text-xl font-semibold text-dark mb-2">
          {company}
          {product && ` – ${product}`}
        </h3>
        
        <h4 className="text-sm font-medium text-primary uppercase tracking-wide">
          {category}
        </h4>
      </div>
    </div>
  );
};

