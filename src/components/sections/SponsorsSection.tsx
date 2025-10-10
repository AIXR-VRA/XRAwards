import React from 'react';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  logoAlt?: string;
  href?: string;
  tier?: 'primary' | 'secondary' | 'tertiary';
}

interface SponsorsSectionProps {
  title: string;
  sponsors: Sponsor[];
  className?: string;
}

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
  title,
  sponsors,
  className = '',
}) => {
  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier || 'secondary';
    if (!acc[tier]) {
      acc[tier] = [];
    }
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  return (
    <section className={`section ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
        </div>
        
        {/* Primary Sponsors */}
        {groupedSponsors.primary && (
          <div className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
              {groupedSponsors.primary.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-80 hover:opacity-100 transition-opacity duration-300"
                >
                  <img
                    src={sponsor.logo}
                    alt={sponsor.logoAlt || sponsor.name}
                    className="h-12 w-auto mx-auto"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Secondary Sponsors */}
        {groupedSponsors.secondary && (
          <div className="mb-8">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center justify-items-center">
              {groupedSponsors.secondary.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-70 hover:opacity-100 transition-opacity duration-300"
                >
                  <img
                    src={sponsor.logo}
                    alt={sponsor.logoAlt || sponsor.name}
                    className="h-8 w-auto mx-auto"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Tertiary Sponsors */}
        {groupedSponsors.tertiary && (
          <div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 items-center justify-items-center">
              {groupedSponsors.tertiary.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity duration-300"
                >
                  <img
                    src={sponsor.logo}
                    alt={sponsor.logoAlt || sponsor.name}
                    className="h-6 w-auto mx-auto"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

