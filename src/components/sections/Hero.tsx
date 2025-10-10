import React from 'react';
import { Button } from '../ui/Button';

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  backgroundImage?: string;
  className?: string;
}

export const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  description,
  ctaText = 'Nominate Now',
  ctaHref = '#',
  secondaryCtaText,
  secondaryCtaHref,
  backgroundImage,
  className = '',
}) => {
  return (
    <section className={`hero relative overflow-hidden ${className}`}>
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {subtitle && (
            <p className="text-lg mb-4 text-gray-200">{subtitle}</p>
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {title}
          </h1>
          
          {description && (
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-gray-200">
              {description}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              href={ctaHref}
              className="w-full sm:w-auto"
            >
              {ctaText}
            </Button>
            
            {secondaryCtaText && secondaryCtaHref && (
              <Button 
                variant="outline" 
                size="lg" 
                href={secondaryCtaHref}
                className="w-full sm:w-auto"
              >
                {secondaryCtaText}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 opacity-20">
        <div className="w-32 h-32 bg-white rounded-full"></div>
      </div>
      <div className="absolute bottom-10 left-10 opacity-20">
        <div className="w-24 h-24 bg-primary rounded-full"></div>
      </div>
    </section>
  );
};

