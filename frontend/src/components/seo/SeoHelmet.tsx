import { Helmet } from 'react-helmet-async';

interface SeoHelmetProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

const BASE_URL = 'https://kinetic-crm-app.vercel.app';
const DEFAULT_DESCRIPTION =
  'Kinetic CRM — platform enterprise untuk mengelola proyek, pengadaan, dan operasi perusahaan dalam satu sistem terintegrasi.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export default function SeoHelmet({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
}: SeoHelmetProps) {
  const fullTitle = `${title} — Kinetic CRM`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaOgTitle = ogTitle || title;
  const metaOgDescription = ogDescription || metaDescription;
  const canonicalUrl = canonical || window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={metaOgTitle} />
      <meta property="og:description" content={metaOgDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage || DEFAULT_OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
