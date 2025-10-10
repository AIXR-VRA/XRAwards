import React from 'react';
import { JudgeCard } from '../ui/JudgeCard';
import { Button } from '../ui/Button';

interface Judge {
  id: string;
  name: string;
  title: string;
  company: string;
  role: string;
  image?: string;
  imageAlt?: string;
}

interface JudgesSectionProps {
  title: string;
  description?: string;
  judges: Judge[];
  viewAllHref?: string;
  className?: string;
}

export const JudgesSection: React.FC<JudgesSectionProps> = ({
  title,
  description,
  judges,
  viewAllHref,
  className = '',
}) => {
  return (
    <section className={`section ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-secondary max-w-4xl mx-auto mb-8">
              {description}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {judges.map((judge) => (
            <JudgeCard
              key={judge.id}
              name={judge.name}
              title={judge.title}
              company={judge.company}
              role={judge.role}
              image={judge.image}
              imageAlt={judge.imageAlt}
            />
          ))}
        </div>
        
        {viewAllHref && (
          <div className="text-center">
            <Button href={viewAllHref}>
              See the Full Judging Panel
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

