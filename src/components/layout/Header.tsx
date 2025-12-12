import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Categories', href: '/categories/' },
    { name: 'Judges', href: '/judges/' },
    { name: 'About', href: '/about-xr-awards/' },
    { name: 'Tickets', href: '/tickets/' },
    { name: 'Sponsors', href: '/sponsors-and-partners/' },
    { name: 'Archive', href: '/archive/' },
  ];

  return (
    <header className={`bg-white shadow-sm ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="shrink-0">
            <a href="/" className="flex items-center">
              <img
                className="h-8 w-auto"
                src="/XRA-dark-Logo.svg"
                alt="XR Awards 2025"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-dark hover:text-primary transition-colors duration-200 font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Book Tickets
            </Button>
            <Button size="sm">
              Nominate Now
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-dark hover:text-primary focus:outline-none focus:text-primary"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-dark hover:text-primary transition-colors duration-200 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Book Tickets
                </Button>
                <Button size="sm" className="w-full">
                  Nominate Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

