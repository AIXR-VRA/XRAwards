import React from 'react';

interface CategoryCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// Helper to convert newlines to HTML
const nl2br = (text: string): string => {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map(para => para.trim())
    .filter(para => para.length > 0)
    .map(para => {
      const escaped = para
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      return `<p class="mb-2 last:mb-0">${escaped.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  icon,
  onClick,
  className = '',
}) => {
  return (
    <div 
      className={`category-card ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {icon && (
        <div className="mb-4 text-4xl text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <div 
          className="text-sm text-secondary"
          dangerouslySetInnerHTML={{ __html: nl2br(description) }}
        />
      )}
    </div>
  );
};

