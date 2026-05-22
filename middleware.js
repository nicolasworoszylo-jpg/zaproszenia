// Vercel Edge Middleware — multi-tenant subdomain routing dla zaproszeniaonline.com
// Co: kazda subdomena <slug>.zaproszeniaonline.com -> rewrite na /<slug>/<reszta>
// Czemu: vercel.json `rewrites` z `has: host` NIE dziala dla aliasow subdomenowych
//   (Vercel limit: host-based rewrites apply only to apex+www, nie do *.subdomenowych).
//   Middleware jest oficjalnym wzorcem Vercela dla multi-tenant subdomain routing.
//   Patrz: https://vercel.com/templates/next.js/platforms-starter-kit (canonical pattern).
//
// Dziala bo: Edge Middleware uruchamia sie PRZED routing, niezaleznie od aliasa.

import { next, rewrite } from '@vercel/edge';

// Subdomeny ktore NIE sa klientami (zarezerwowane).
const RESERVED = new Set(['www', 'api', 'admin', 'app', 'mail', 'cdn', 'static', 'm']);

// Domena glowna (apex).
const APEX = 'zaproszeniaonline.com';

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();

  // Pass-through dla apex + www (one serwuja landing/strony glowne normalnie).
  if (host === APEX || host === `www.${APEX}` || !host.endsWith(`.${APEX}`)) {
    return next();
  }

  // Wyciagnij slug ze subdomeny.
  const subdomain = host.slice(0, -1 * (APEX.length + 1)); // np. "nicolas-i-dominika-2026-07"

  // Pomin zarezerwowane / wieloczlonowe subdomeny (np. "foo.bar.zaproszeniaonline.com").
  if (subdomain.includes('.') || RESERVED.has(subdomain) || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(subdomain)) {
    return next();
  }

  // Rewrite: <slug>.zaproszeniaonline.com/<path> -> zaproszeniaonline.com/<slug>/<path>
  // Url bar uzytkownika POZOSTAJE subdomena (rewrite jest transparentny, nie redirect).
  const url = new URL(request.url);
  const originalPath = url.pathname;
  const prefix = `/${subdomain}`;

  // ANTI-DOUBLE-PREFIX: jezeli HTML referencuje assety przez absolutne paths
  // (np. <script src="/<slug>/vendor/app.js">) - browser zarequestuje
  // <slug>.zaproszeniaonline.com/<slug>/vendor/app.js. Bez tego guarda middleware
  // dodalby drugi prefix -> /<slug>/<slug>/vendor/app.js -> 404.
  // Path juz prefiksowany przez slug -> pass-through, niech Vercel serwuje statyk.
  if (originalPath === prefix || originalPath.startsWith(prefix + '/')) {
    return next();
  }

  url.pathname = `${prefix}${originalPath === '/' ? '/' : originalPath}`;

  return rewrite(url);
}

export const config = {
  // Pomin zasoby statyczne ktore nie potrzebuja routingu (przyspiesza middleware).
  // _vercel/* to wewnetrzne Vercela. .well-known, robots.txt, sitemap.xml leca przez middleware
  // zeby ewentualne pliki w <slug>/ zostaly podstawione poprawnie.
  matcher: [
    '/((?!_vercel|_next/static|favicon\\.ico).*)',
  ],
};
