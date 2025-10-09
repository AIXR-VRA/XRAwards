# Astro Website Template

A modern, production-ready Astro template with Tailwind CSS v4, SEO optimization, and best practices built-in.

## 🚀 Features

- **Fast Performance**: Built with Astro for optimal speed and performance
- **Tailwind CSS v4**: Modern utility-first CSS framework (no config needed!)
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, and JSON-LD structured data
- **Sitemap Generation**: Automatic XML sitemap for better search engine crawling
- **Responsive Design**: Mobile-first, fully responsive components
- **Component Architecture**: Reusable Header, Footer, and Layout components
- **404 Page**: Custom, user-friendly error page
- **GitHub Actions**: Pre-configured CI/CD for Cloudflare Pages
- **TypeScript**: Strict type checking enabled
- **Accessibility**: ARIA labels and semantic HTML

## 📦 What's Included

```
/
├── public/
│   └── _headers              # Cloudflare cache headers
├── src/
│   ├── components/
│   │   ├── Header.astro      # Navigation header with mobile menu
│   │   └── Footer.astro      # Footer with links and social
│   ├── layouts/
│   │   └── Layout.astro      # Base layout with SEO
│   ├── pages/
│   │   ├── index.astro       # Homepage with sections
│   │   ├── 404.astro         # Custom 404 page
│   │   └── robots.txt.ts     # Robots.txt generator
│   └── styles/
│       └── globals.css       # Tailwind imports
├── .github/
│   └── workflows/
│       ├── deploy-production.yml
│       └── deploy-staging.yml
└── astro.config.mjs          # Astro configuration
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and Yarn installed
- Basic knowledge of Astro and Tailwind CSS

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Start the development server:
```bash
yarn dev
```

3. Open [http://localhost:4321](http://localhost:4321) in your browser

### Build for Production

```bash
yarn build
```

Preview the production build:
```bash
yarn preview
```

## 🎨 Customization Guide

### 1. Update Site Information

**File: `src/layouts/Layout.astro`**
- Change `siteName` constant (line 18)
- Update default title, description, and image URLs (lines 12-15)

**File: `astro.config.mjs`**
- Update the `site` URL (line 8)

**File: `src/pages/robots.txt.ts`**
- Update sitemap URL (line 7)

### 2. Customize Header Navigation

**File: `src/components/Header.astro`**
- Edit the `navigation` array (lines 3-8) to add/remove menu items
- Update logo text (line 14)
- Modify CTA button text and link (lines 28-35)

### 3. Customize Footer

**File: `src/components/Footer.astro`**
- Update `footerLinks` object (lines 5-23) for footer sections
- Change company name and tagline (lines 33-37)
- Update social media links (line 68)
- Modify copyright text (line 136)

### 4. Update Homepage Content

**File: `src/pages/index.astro`**
- Replace JSON-LD structured data (lines 11-32)
- Edit hero section content (lines 39-64)
- Customize feature cards (lines 79-118)
- Update CTA section (lines 123-137)

### 5. Customize Colors & Styling

Tailwind CSS v4 is configured without a config file. To customize:

**File: `src/styles/globals.css`**
- Add custom CSS or Tailwind utilities as needed
- The template uses Tailwind's default color palette

### 6. Add Fonts

The template is configured for Google Fonts and Adobe Typekit.

**File: `src/layouts/Layout.astro`**
- Update font URLs (lines 59-84)
- Modify font-family references in `globals.css`

### 7. SEO & Meta Tags

**Per-Page SEO**: Pass props to the `Layout` component:
```astro
<Layout
  title="Your Page Title"
  description="Your page description"
  image="/your-og-image.jpg"
>
```

**Global SEO**: Edit defaults in `src/layouts/Layout.astro`

## 🚢 Deployment

### Cloudflare Pages (Recommended)

This template includes GitHub Actions workflows for automatic deployment.

**Setup:**

1. Create a Cloudflare Pages project
2. Add GitHub secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Update project names in workflow files:
   - `.github/workflows/deploy-production.yml` (line 37)
   - `.github/workflows/deploy-staging.yml` (line 37)

**Branches:**
- `main` → Production deployment
- `staging` or `develop` → Staging deployment

### Other Platforms

This template works with any static hosting platform:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

Just run `yarn build` and deploy the `dist/` folder.

## 📝 Best Practices Included

✅ **Performance**
- Asset optimization and caching headers
- Lazy loading and code splitting
- Preconnect to external resources

✅ **SEO**
- Semantic HTML structure
- Meta tags for social sharing
- XML sitemap generation
- robots.txt configuration
- JSON-LD structured data

✅ **Accessibility**
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus states on all interactive elements

✅ **Security**
- Security headers in `_headers` file
- No inline scripts (except necessary)
- HTTPS only (enforced by Cloudflare)

## 🤝 Contributing

This is a template repository. Feel free to fork and customize for your needs!

## 📄 License

MIT License - feel free to use this template for personal or commercial projects.

## 🆘 Need Help?

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

---

**Happy building!** 🎉
