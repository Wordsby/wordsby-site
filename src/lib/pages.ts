/** URL path for a page in content/pages: "index" → "/", "about/team" → "/about/team/". */
export function pagePath(id: string): string {
  const slug = id.replace(/(^|\/)index$/, '');
  return slug ? `/${slug}/` : '/';
}
