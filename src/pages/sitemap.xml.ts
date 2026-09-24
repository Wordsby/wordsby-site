import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pagePath } from '../lib/pages';

export const GET: APIRoute = async ({ site }) => {
  const pages = await getCollection('pages', (page) => !page.data.draft);
  const urls = pages.map((page) => `  <url><loc>${new URL(pagePath(page.id), site).href}</loc></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
