import React from 'react';
import { WinnerCard } from '../ui/WinnerCard';
import { Button } from '../ui/Button';

interface Winner {
  id: string;
  company: string;
  product: string;
  category: string;
  year: number;
  image?: string;
  imageAlt?: string;
  logo?: string;
  logoAlt?: string;
}

interface WinnersShowcaseProps {
  title: string;
  description?: string;
  winners: Winner[];
  viewAllHref?: string;
  className?: string;
}

export const WinnersShowcase: React.FC<WinnersShowcaseProps> = ({
  title,
  description,
  winners,
  viewAllHref,
  className = '',
}) => {
  return (
    <section className={`section bg-light ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-secondary max-w-3xl mx-auto mb-8">
              {description}
            </p>
          )}
          {viewAllHref && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href={viewAllHref}>
                View All Winners
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {winners.map((winner) => (
            <WinnerCard
              key={winner.id}
              company={winner.company}
              product={winner.product}
              category={winner.category}
              year={winner.year}
              image={winner.image}
              imageAlt={winner.imageAlt}
              logo={winner.logo}
              logoAlt={winner.logoAlt}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

