import type { APIRoute } from 'astro';
import { settings } from '../lib/settings';

export const GET: APIRoute = ({ site }) => {
  const body = settings.site.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
