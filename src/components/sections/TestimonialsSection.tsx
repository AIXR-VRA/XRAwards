import React from 'react';
import { TestimonialCard } from '../ui/TestimonialCard';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string;
  logo?: string;
  logoAlt?: string;
}

interface TestimonialsSectionProps {
  title: string;
  description?: string;
  testimonials: Testimonial[];
  className?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  title,
  description,
  testimonials,
  className = '',
}) => {
  return (
    <section className={`section bg-light ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-secondary max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              quote={testimonial.quote}
              author={testimonial.author}
              company={testimonial.company}
              logo={testimonial.logo}
              logoAlt={testimonial.logoAlt}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

