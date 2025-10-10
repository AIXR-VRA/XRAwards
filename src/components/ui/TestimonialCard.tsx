import React from 'react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  company: string;
  logo?: string;
  logoAlt?: string;
  className?: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  company,
  logo,
  logoAlt,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {logo && (
        <div className="mb-4">
          <img
            src={logo}
            alt={logoAlt || company}
            className="h-8 w-auto"
          />
        </div>
      )}
      
      <blockquote className="text-lg text-dark mb-4 leading-relaxed">
        "{quote}"
      </blockquote>
      
      <div className="text-sm text-secondary">
        <span className="font-medium">— {author}</span>
        {company && <span className="ml-2">{company}</span>}
      </div>
    </div>
  );
};

