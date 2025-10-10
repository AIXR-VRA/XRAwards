import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'XR Awards 2025',
      links: [
        { name: 'The Categories', href: '/categories' },
        { name: 'Previous Winners & Finalists', href: '/archive' },
        { name: 'Sponsors and Partners', href: '/sponsors-and-partners' },
        { name: 'Travel & Accommodation', href: '/travel-accommodation' },
      ],
    },
    {
      title: 'About',
      links: [
        { name: 'The Judges', href: '/judges' },
        { name: 'Book Tickets', href: '/tickets' },
        { name: 'About XR Awards', href: '/about-xr-awards' },
        { name: 'FAQs', href: '/legal/faq' },
        { name: 'XR Awards Store', href: '/store' },
      ],
    },
    {
      title: 'Ceremonies',
      links: [
        { name: '8th International XR Awards', href: '/xr-awards-2024' },
        { name: '7th International XR Awards', href: '/vr-awards-2023' },
        { name: 'View all Ceremonies', href: '/archive' },
      ],
    },
    {
      title: 'Contact Us',
      links: [
        { name: 'General Enquiries', href: 'mailto:awards@aixr.org' },
        { name: 'Sponsorship Enquiries', href: 'mailto:sponsor@aixr.org' },
        { name: 'Press Enquiries', href: 'mailto:press@aixr.org' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com/vrawards/', icon: 'f' },
    { name: 'Twitter', href: 'https://twitter.com/vrawards', icon: 't' },
    { name: 'Instagram', href: 'https://instagram.com/vrawards/', icon: 'i' },
  ];

  return (
    <footer className={`bg-dark text-light ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Event Info */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <p className="text-lg font-semibold mb-2">Nov 2025, EU</p>
              <p className="text-sm text-gray-300">
                The XR Awards is organized and hosted by the Academy of International Extended Reality
              </p>
            </div>
            <div className="text-sm text-gray-300">
              <a href="/legal/privacy-policy" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <span className="mx-2">|</span>
              <a href="/legal" className="hover:text-primary transition-colors">
                Legal
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-300 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors text-2xl"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <p className="text-sm text-gray-300">
              © The Academy of International Extended Reality {currentYear}. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

