/**
 * SEO Utility Functions
 * Centralized SEO and Open Graph management for Astro
 */

export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  nofollow?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

/**
 * Generate absolute URL for images and other assets
 */
export function getAbsoluteUrl(path: string, baseUrl: string = 'https://xrawards.aixr.org'): string {
  if (path.startsWith('http')) {
    return path;
  }
  return new URL(path, baseUrl).href;
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string, baseUrl: string = 'https://xrawards.aixr.org'): string {
  if (path.startsWith('http')) {
    return path;
  }
  return new URL(path, baseUrl).href;
}

/**
 * Generate robots meta content
 */
export function getRobotsContent(noindex: boolean = false, nofollow: boolean = false): string {
  const index = noindex ? 'noindex' : 'index';
  const follow = nofollow ? 'nofollow' : 'follow';
  return `${index},${follow}`;
}

/**
 * Generate Open Graph image URL with fallback
 */
export function getOGImageUrl(image?: string, baseUrl: string = 'https://xrawards.aixr.org'): string {
  const defaultImage = '/XRA-share-image.png';
  const imagePath = image || defaultImage;
  return getAbsoluteUrl(imagePath, baseUrl);
}

/**
 * Validate and clean title
 */
export function cleanTitle(title: string, siteName: string = 'XR Awards'): string {
  // Remove any existing site name to avoid duplication
  const cleanTitle = title.replace(new RegExp(`\\s*-\\s*${siteName}$`, 'i'), '').trim();
  
  // If title is too long, truncate it
  if (cleanTitle.length > 60) {
    return cleanTitle.substring(0, 57) + '...';
  }
  
  return cleanTitle;
}

/**
 * Validate and clean description
 */
export function cleanDescription(description: string): string {
  // Remove HTML tags
  const cleanDesc = description.replace(/<[^>]*>/g, '').trim();
  
  // If description is too long, truncate it
  if (cleanDesc.length > 160) {
    return cleanDesc.substring(0, 157) + '...';
  }
  
  return cleanDesc;
}

/**
 * Generate structured data for articles
 */
export function generateArticleStructuredData(props: SEOProps, baseUrl: string = 'https://xrawards.aixr.org') {
  if (props.type !== 'article') return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.title,
    description: props.description,
    image: getOGImageUrl(props.image, baseUrl),
    url: getCanonicalUrl(props.canonical || '', baseUrl),
    datePublished: props.publishedTime,
    dateModified: props.modifiedTime,
    author: props.author ? {
      '@type': 'Person',
      name: props.author
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'XR Awards',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: getAbsoluteUrl('/XRA-Logo.svg', baseUrl)
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getCanonicalUrl(props.canonical || '', baseUrl)
    }
  };
}

/**
 * Generate organization structured data
 */
export function generateOrganizationStructuredData(baseUrl: string = 'https://xrawards.aixr.org') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'AIXR XR Awards',
    alternateName: 'XR Awards',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: getAbsoluteUrl('/XRA-Logo.svg', baseUrl),
      width: '1200',
      height: '630'
    },
    description: 'The AIXR XR Awards sit at the heart of recognising excellence in virtual and augmented reality.',
    knowsAbout: [
      'Virtual Reality',
      'Augmented Reality', 
      'Mixed Reality',
      'XR Technology',
      'Awards Ceremony'
    ],
    sameAs: [
      'https://www.linkedin.com/company/aixr/',
      'https://twitter.com/AIXR_org'
    ]
  };
}
