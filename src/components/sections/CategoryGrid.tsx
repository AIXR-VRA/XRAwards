import React from 'react';
import { CategoryCard } from '../ui/CategoryCard';

interface Category {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  href?: string;
}

interface CategoryGridProps {
  title: string;
  description?: string;
  categories: Category[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  title,
  description,
  categories,
  columns = 3,
  className = '',
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className={`section ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-secondary max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>
        
        <div className={`grid ${gridCols[columns]} gap-6`}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              onClick={() => category.href && (window.location.href = category.href)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

