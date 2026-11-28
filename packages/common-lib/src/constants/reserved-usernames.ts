/**
 * Usernames nobody may register or rename to, because `a11studio.com/{username}` shares the URL
 * root with every top-level web route, metadata route and public file, and with names that would
 * impersonate the brand or a big platform.
 *
 * **Adding a top-level web route?** Add its first segment here FIRST (and check that no existing
 * user already holds it) before it ships. Otherwise that user's profile and the route collide, and
 * the edge cache may store the route's anonymous render (`isEdgeCacheablePath` in the web app).
 *
 * Every key is lowercase and trimmed. Look names up through `isReservedUsername`
 * (`utils/username.ts`), which normalizes and uses `Object.hasOwn` so prototype keys never match.
 * Entries shorter than 3 characters or containing `-`/`_` can never be registered, but the web
 * route gate (`isArtistRouteSegment`) uses the same map, so they stay.
 *
 * Groups are arrays sorted within each group; a name may appear in more than one group.
 */

/** Existing web routes (auth and legal sub-routes too), metadata routes, public files, framework. */
const ROUTES = [
  '2fa', '_next', 'about', 'android-chrome', 'api', 'apple-touch-icon', 'artists', 'atelier',
  'auth', 'callback', 'cookies', 'email-preferences', 'faqs', 'favicon', 'for', 'get-started',
  'icons', 'indexnow', 'indexnow-key', 'landing', 'legal', 'llms', 'login', 'logo', 'manifest',
  'next', 'notice', 'oauth', 'oauth2', 'og', 'og-image', 'password', 'password-recovery',
  'portfolios', 'privacy', 'recover', 'recovery', 'register', 'report', 'robots', 'session',
  'sitemap', 'sitemap_index', 'static', 'support', 'terms', 'wait-list',
] as const;

/** Locale codes and language names (a future locale prefix or language page). */
const LOCALES = [
  'ar', 'ca', 'cs', 'da', 'de', 'deutsch', 'el', 'en', 'en-gb', 'en-us', 'eng', 'english', 'es',
  'es-es', 'es-mx', 'esp', 'espanol', 'eu', 'fi', 'fr', 'francais', 'french', 'german', 'gl', 'he',
  'hi', 'hu', 'id', 'it', 'italian', 'italiano', 'ja', 'ko', 'nl', 'no', 'pl', 'por', 'portugues',
  'portuguese', 'pt', 'pt-br', 'pt-pt', 'ro', 'ru', 'spanish', 'sv', 'th', 'tr', 'uk', 'vi', 'zh',
] as const;

/** Seeds and prepositions (`/for/...`, `/in/{place}`, `/on/...`). */
const PREPOSITIONS = [
  'a', 'an', 'and', 'at', 'by', 'com', 'con', 'da', 'de', 'del', 'do', 'el', 'em', 'en', 'for',
  'from', 'in', 'la', 'las', 'los', 'of', 'on', 'or', 'para', 'por', 'sin', 'the', 'to', 'via',
  'with',
] as const;

/** Product features and planned routes. */
const PRODUCT = [
  'account', 'accounts', 'activity', 'ads', 'advertise', 'affiliate', 'affiliates', 'analytics',
  'announcements', 'app', 'apps', 'archive', 'assets', 'billing', 'blog', 'blogs', 'book',
  'booking', 'bookings', 'browse', 'business', 'buy', 'cart', 'categories', 'category', 'changelog',
  'checkout', 'cities', 'city', 'collection', 'collections', 'community', 'compare', 'contact',
  'contacts', 'countries', 'country', 'create', 'credits', 'dashboard', 'delete', 'demo',
  'directory', 'discover', 'docs', 'documentation', 'download', 'downloads', 'edit', 'editor',
  'embed', 'event', 'events', 'examples', 'explore', 'faq', 'favorites', 'feature', 'features',
  'feed', 'feedback', 'files', 'follow', 'followers', 'following', 'forum', 'free', 'galleries',
  'gallery', 'get', 'getstarted', 'gift', 'guide', 'guides', 'help', 'hire', 'home', 'how',
  'howitworks', 'inbox', 'index', 'info', 'insights', 'integrations', 'invite', 'invites',
  'invoice', 'invoices', 'jobs', 'join', 'journal', 'learn', 'library', 'license', 'licensing',
  'likes', 'link', 'links', 'live', 'local', 'location', 'locations', 'magazine', 'manage', 'map',
  'marketplace', 'me', 'media', 'members', 'membership', 'message', 'messages', 'mobile', 'my',
  'near', 'nearby', 'network', 'new', 'news', 'newsletter', 'notifications', 'offers', 'onboarding',
  'order', 'orders', 'organization', 'page', 'pages', 'partner', 'partners', 'pay', 'payment',
  'payments', 'place', 'places', 'plan', 'plans', 'policy', 'portfolio', 'post', 'posts', 'premium',
  'press', 'pricing', 'pro', 'profile', 'profiles', 'project', 'projects', 'promo', 'public',
  'publish', 'quote', 'ranking', 'rss', 'search', 'service', 'services', 'session', 'sessions',
  'settings', 'share', 'shop', 'showcase', 'sign-in', 'sign-up', 'signin', 'signout', 'signup',
  'site', 'stats', 'status', 'store', 'stories', 'story', 'studio', 'studios', 'subscribe',
  'subscription', 'subscriptions', 'tag', 'tags', 'team', 'teams', 'themes', 'tool', 'tools', 'top',
  'tos', 'trending', 'tutorial', 'tutorials', 'unsubscribe', 'upgrade', 'upload', 'uploads', 'user',
  'username', 'users', 'verification', 'verify', 'video', 'videos', 'view', 'wallet', 'webhook',
  'webhooks', 'welcome', 'wiki', 'work', 'works',
] as const;

/** Spanish and Portuguese route words (future localized slugs). */
const LOCALIZED_ROUTES = [
  'acerca', 'ajuda', 'ajustes', 'artistas', 'ayuda', 'buscar', 'colecciones', 'colecoes',
  'configuracion', 'configuracoes', 'conta', 'contacto', 'contato', 'cuenta', 'diario', 'entrar',
  'eventos', 'explorar', 'fotografos', 'galeria', 'inicio', 'perfil', 'portafolio', 'portafolios',
  'precios', 'precos', 'privacidad', 'privacidade', 'registro', 'revista', 'sair', 'salir',
  'servicios', 'servicos', 'sobre', 'soporte', 'suporte', 'terminos', 'termos',
] as const;

/** Disciplines and categories (possible `/for/*` or place/category roots). */
const DISCIPLINES = [
  'architecture', 'art', 'artist', 'artists', 'arts', 'artwork', 'artworks', 'cinema', 'design',
  'designer', 'designers', 'drone', 'family', 'fashion', 'film', 'filmmaker', 'filmmakers', 'films',
  'food', 'foto', 'fotografa', 'fotografia', 'fotografo', 'fotos', 'illustration', 'illustrator',
  'illustrators', 'landscape', 'music', 'musician', 'musicians', 'nature', 'newborn', 'painter',
  'painters', 'painting', 'photo', 'photographer', 'photographers', 'photography', 'photos',
  'portrait', 'portraits', 'product', 'sports', 'street', 'tattoo', 'tattoos', 'travel',
  'videographer', 'videographers', 'videography', 'wedding', 'weddings', 'wildlife',
] as const;

/** Marketing, curation and "viral" pages. */
const MARKETING = [
  'awards', 'best', 'challenge', 'contest', 'curated', 'deals', 'editorial', 'editors', 'featured',
  'hot', 'ideas', 'inspiration', 'latest', 'picks', 'popular', 'sale', 'spotlight', 'viral',
] as const;

/** Brand, staff and impersonation names. */
const IMPERSONATION = [
  'a11', 'a11studio', 'a11studios', 'abuse', 'admin', 'administrator', 'admins', 'anonymous', 'bot',
  'ceo', 'cofounder', 'employee', 'everyone', 'external', 'founder', 'founders', 'guest',
  'helpdesk', 'hostmaster', 'internal', 'mod', 'moderator', 'moderators', 'mods', 'no-reply',
  'nobody', 'noreply', 'official', 'owner', 'postmaster', 'robot', 'root', 'safety', 'security',
  'staff', 'superuser', 'sysadmin', 'system', 'thstudio', 'trust', 'verified', 'webmaster',
] as const;

/** Technical, scanner and reserved JavaScript words (`constructor` and `prototype` on purpose). */
const TECHNICAL = [
  'cdn', 'cgi-bin', 'cgibin', 'config', 'constructor', 'debug', 'dev', 'dns', 'email', 'env',
  'false', 'ftp', 'git', 'graphql', 'health', 'healthz', 'http', 'https', 'imap', 'localhost',
  'mail', 'metrics', 'nan', 'nil', 'none', 'ns1', 'null', 'phpmyadmin', 'ping', 'pop', 'private',
  'prototype', 'rest', 'server', 'smtp', 'ssh', 'test', 'testing', 'true', 'undefined', 'v1', 'v2',
  'void', 'web', 'wordpress', 'wp', 'wp-admin', 'wp-login', 'wpadmin', 'www', 'xmlrpc',
] as const;

/** Social networks, camera makers and big brands. */
const BRANDS = [
  '500px', 'adobe', 'airbnb', 'amazon', 'anthropic', 'apple', 'artstation', 'behance', 'bing',
  'bluesky', 'canon', 'canva', 'cargo', 'carrd', 'chatgpt', 'claude', 'cloudflare', 'deviantart',
  'discord', 'dji', 'dribbble', 'etsy', 'facebook', 'figma', 'flickr', 'format', 'framer',
  'fujifilm', 'gemini', 'getty', 'gettyimages', 'github', 'gitlab', 'gmail', 'google', 'gopro',
  'hasselblad', 'icloud', 'instagram', 'kakao', 'leica', 'line', 'linkedin', 'linktree', 'mastodon',
  'medium', 'meta', 'microsoft', 'netflix', 'nikon', 'notion', 'onlyfans', 'openai', 'patreon',
  'paypal', 'pexels', 'pinterest', 'pixieset', 'readymag', 'reddit', 'samsung', 'shopify',
  'shutterstock', 'smugmug', 'snapchat', 'sony', 'soundcloud', 'spotify', 'squarespace', 'stripe',
  'substack', 'telegram', 'threads', 'tiktok', 'tumblr', 'twitch', 'twitter', 'uber', 'unsplash',
  'vimeo', 'vk', 'vsco', 'webflow', 'wechat', 'weibo', 'whatsapp', 'wix', 'x', 'yahoo', 'youtube',
  'zenfolio',
] as const;

/** Every reserved name, grouped by why it is reserved. */
export const RESERVED_USERNAME_GROUPS: Readonly<Record<string, readonly string[]>> = {
  ROUTES,
  LOCALES,
  PREPOSITIONS,
  PRODUCT,
  LOCALIZED_ROUTES,
  DISCIPLINES,
  MARKETING,
  IMPERSONATION,
  TECHNICAL,
  BRANDS,
};

/** Reserved usernames as a lookup map. Read it through `isReservedUsername`, never with `in`. */
export const RESERVED_USERNAMES: Readonly<Record<string, true>> = Object.freeze(
  Object.fromEntries(
    Object.values(RESERVED_USERNAME_GROUPS)
      .flat()
      .map((name) => [name, true] as const),
  ),
);
