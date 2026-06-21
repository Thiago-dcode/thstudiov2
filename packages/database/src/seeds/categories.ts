import fs from 'node:fs';
import path from 'node:path';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import type { S3StorageConfig } from '@repo/backend-lib/services/storage-service/types';
import Logger from '@repo/backend-lib/utils/console';
import { EnumType } from "@repo/common-lib/constants/enums";
import { getConfigValue } from '@repo/common-lib/config/utils';
import { generateValidSlug } from "@repo/common-lib/utils/generate-valid-slug";
import { Query, Schema } from "../lib/facades";

/** Same S3 key pattern as {@link CategoriesService.categoryThumbnailKey}: `categories/${slug}/thumbnail.webp`. */
const CATEGORY_THUMBNAIL_REL_PATH = (slug: string) =>
  `categories/${slug}/thumbnail.webp`;

/** Matches {@link CategoriesService.storeCategoryThumbnail} / {@link Helpers.setAsset}. */
const CATEGORY_THUMB_TARGET_SIZE_BYTES = Math.floor((100 / 1024) * 1024 * 1024);
const CATEGORY_THUMB_QUALITY = 80;

const CATEGORY_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.webp', '.png'] as const;

/**
 * When the slug from the category `name` does not match the image basename
 * (e.g. `handmade.jpg` for "Crafts & Handmade" → slug `crafts-handmade`).
 */
const CATEGORY_IMAGE_SLUG_ALIASES: Record<string, string> = {
  'crafts-handmade': 'handmade',
};

function resolveCategoriesImagesDir(): string {
  const dir = path.join(process.cwd(), 'src', 'seeds', 'categories-images');
  if (fs.existsSync(dir)) {
    return dir;
  }
  throw new Error(
    `categories-images not found at ${dir}. Run dbcli from packages/database.`,
  );
}

function isS3Configured(): boolean {
  const c = getConfigValue('storage');
  return !!(
    c.bucket &&
    c.region &&
    c.accessKeyId &&
    c.secretAccessKey
  );
}

function buildS3Config(): S3StorageConfig {
  const STORAGE_CONFIG = getConfigValue('storage');
  if (
    !STORAGE_CONFIG.bucket ||
    !STORAGE_CONFIG.region ||
    !STORAGE_CONFIG.accessKeyId ||
    !STORAGE_CONFIG.secretAccessKey
  ) {
    throw new Error(
      'S3 storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_ACCESS_KEY.',
    );
  }
  return {
    driver: 's3',
    bucket: STORAGE_CONFIG.bucket,
    region: STORAGE_CONFIG.region,
    accessKeyId: STORAGE_CONFIG.accessKeyId,
    secretAccessKey: STORAGE_CONFIG.secretAccessKey,
    signedUrlExpiration: STORAGE_CONFIG.signedUrlExpiration,
  };
}

function mimeForImagePath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function multerLike(buffer: Buffer, originalname: string, mimetype: string) {
  return {
    fieldname: 'thumbnail',
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
  };
}

/** Resolve `src/seeds/categories-images/{basename}.{ext}` where basename is slug(name) or an alias. */
function findCategorySourceImageFile(categoryName: string): string | null {
  let dir: string;
  try {
    dir = resolveCategoriesImagesDir();
  } catch {
    return null;
  }
  const primarySlug = generateValidSlug(categoryName);
  const basenames = [
    primarySlug,
    CATEGORY_IMAGE_SLUG_ALIASES[primarySlug],
  ].filter((b): b is string => !!b);
  const seen = new Set<string>();
  for (const base of basenames) {
    if (seen.has(base)) continue;
    seen.add(base);
    for (const ext of CATEGORY_IMAGE_EXTENSIONS) {
      const fp = path.join(dir, `${base}${ext}`);
      if (fs.existsSync(fp)) {
        return fp;
      }
    }
  }
  return null;
}

async function uploadCategoryThumbnailFromFile(
  allocatedSlug: string,
  sourcePath: string,
  compressService: ReturnType<typeof FactoryCompressService.create>,
  storageService: ReturnType<typeof FactoryStorageService.create>,
): Promise<string> {
  const buffer = fs.readFileSync(sourcePath);
  const originalname = path.basename(sourcePath);
  const sourceFile = multerLike(buffer, originalname, mimeForImagePath(sourcePath));
  const target =
    sourceFile.size > CATEGORY_THUMB_TARGET_SIZE_BYTES
      ? CATEGORY_THUMB_TARGET_SIZE_BYTES
      : sourceFile.size;
  const compressed = await compressService.optimizeImageToWebp(
    sourceFile as Parameters<
      typeof compressService.optimizeImageToWebp
    >[0],
    target,
    CATEGORY_THUMB_QUALITY,
  );
  const out = multerLike(
    compressed.buffer,
    compressed.filename,
    'image/webp',
  );
  const key = CATEGORY_THUMBNAIL_REL_PATH(allocatedSlug);
  await storageService.write(
    out as Parameters<typeof storageService.write>[0],
    key,
  );
  return key;
}

const usedCategorySlugs = new Set<string>();

function allocateCategorySlug(name: string): string {
    const base = generateValidSlug(name);
    let candidate = base;
    let n = 2;
    while (usedCategorySlugs.has(candidate)) {
        candidate = `${base}-${n}`;
        n += 1;
    }
    usedCategorySlugs.add(candidate);
    return candidate;
}

type SeedCategory = {
    name: string,
    tags: string[],
    translations: {
        code: EnumType<'LANGUAGE_CODE'>,
        name: string
    }[],
    children?: SeedCategory[]

}
export const main = async () => {

    const categories: SeedCategory[] = [
        {
            name: 'Photography',
            tags: ['photo', 'photos', 'camera', 'photographer', 'pics', 'photoshoot'],
            translations: [
                { code: 'EN', name: 'Photography' },
                { code: 'ES', name: 'Fotografía' },
                { code: 'PT', name: 'Fotografia' }
            ],
            children: [
                { name: 'Portrait Photography', tags: ['portrait', 'headshot', 'people', 'face', 'professional', 'studio'], translations: [{ code: 'EN', name: 'Portrait Photography' }, { code: 'ES', name: 'Fotografía de Retrato' }, { code: 'PT', name: 'Fotografia de Retrato' }] },
                { name: 'Landscape Photography', tags: ['landscape', 'nature', 'scenery', 'outdoor', 'mountains', 'sunset'], translations: [{ code: 'EN', name: 'Landscape Photography' }, { code: 'ES', name: 'Fotografía de Paisaje' }, { code: 'PT', name: 'Fotografia de Paisagem' }] },
                { name: 'Wildlife Photography', tags: ['wildlife', 'animals', 'nature', 'safari', 'birds', 'fauna'], translations: [{ code: 'EN', name: 'Wildlife Photography' }, { code: 'ES', name: 'Fotografía de Vida Silvestre' }, { code: 'PT', name: 'Fotografia de Vida Selvagem' }] },
                { name: 'Street Photography', tags: ['street', 'urban', 'city', 'documentary', 'candid', 'lifestyle'], translations: [{ code: 'EN', name: 'Street Photography' }, { code: 'ES', name: 'Fotografía Callejera' }, { code: 'PT', name: 'Fotografia de Rua' }] },
                { name: 'Fashion Photography', tags: ['fashion', 'model', 'style', 'editorial', 'runway', 'lookbook'], translations: [{ code: 'EN', name: 'Fashion Photography' }, { code: 'ES', name: 'Fotografía de Moda' }, { code: 'PT', name: 'Fotografia de Moda' }] },
                { name: 'Macro Photography', tags: ['macro', 'closeup', 'close-up', 'detail', 'micro', 'insects'], translations: [{ code: 'EN', name: 'Macro Photography' }, { code: 'ES', name: 'Fotografía Macro' }, { code: 'PT', name: 'Fotografia Macro' }] },
                { name: 'Sports Photography', tags: ['sports', 'action', 'athletic', 'game', 'competition', 'athlete'], translations: [{ code: 'EN', name: 'Sports Photography' }, { code: 'ES', name: 'Fotografía Deportiva' }, { code: 'PT', name: 'Fotografia Esportiva' }] },
                { name: 'Architectural Photography', tags: ['architecture', 'building', 'real-estate', 'interior', 'exterior', 'construction'], translations: [{ code: 'EN', name: 'Architectural Photography' }, { code: 'ES', name: 'Fotografía Arquitectónica' }, { code: 'PT', name: 'Fotografia Arquitetônica' }] },
                { name: 'Documentary Photography', tags: ['documentary', 'photojournalism', 'storytelling', 'journalism', 'reportage', 'truth'], translations: [{ code: 'EN', name: 'Documentary Photography' }, { code: 'ES', name: 'Fotografía Documental' }, { code: 'PT', name: 'Fotografia Documental' }] },
                { name: 'Travel Photography', tags: ['travel', 'journey', 'adventure', 'tourism', 'destination', 'exploration'], translations: [{ code: 'EN', name: 'Travel Photography' }, { code: 'ES', name: 'Fotografía de Viajes' }, { code: 'PT', name: 'Fotografia de Viagem' }] },
                { name: 'Event Photography', tags: ['event', 'wedding', 'party', 'ceremony', 'celebration', 'occasion'], translations: [{ code: 'EN', name: 'Event Photography' }, { code: 'ES', name: 'Fotografía de Eventos' }, { code: 'PT', name: 'Fotografia de Eventos' }] },
                { name: 'Wedding Photography', tags: ['wedding', 'bride', 'groom', 'marriage', 'ceremony', 'engagement'], translations: [{ code: 'EN', name: 'Wedding Photography' }, { code: 'ES', name: 'Fotografía de Bodas' }, { code: 'PT', name: 'Fotografia de Casamento' }] },
                { name: 'Concert Photography', tags: ['concert', 'music', 'live', 'stage', 'performance', 'band'], translations: [{ code: 'EN', name: 'Concert Photography' }, { code: 'ES', name: 'Fotografía de Conciertos' }, { code: 'PT', name: 'Fotografia de Shows' }] },
                { name: 'Aerial & Drone Photography', tags: ['aerial', 'drone', 'uav', 'sky', 'birds-eye', 'overhead'], translations: [{ code: 'EN', name: 'Aerial & Drone Photography' }, { code: 'ES', name: 'Fotografía Aérea y con Dron' }, { code: 'PT', name: 'Fotografia Aérea e com Drone' }] },
                { name: 'Food Photography', tags: ['food', 'culinary', 'restaurant', 'menu', 'dish', 'gastronomy'], translations: [{ code: 'EN', name: 'Food Photography' }, { code: 'ES', name: 'Fotografía Gastronómica' }, { code: 'PT', name: 'Fotografia Gastronômica' }] },
                { name: 'Product Photography', tags: ['product', 'commercial', 'ecommerce', 'catalog', 'studio', 'white-background'], translations: [{ code: 'EN', name: 'Product Photography' }, { code: 'ES', name: 'Fotografía de Producto' }, { code: 'PT', name: 'Fotografia de Produto' }] },
                { name: 'Still Life Photography', tags: ['still-life', 'objects', 'composition', 'tabletop', 'artistic', 'arrangement'], translations: [{ code: 'EN', name: 'Still Life Photography' }, { code: 'ES', name: 'Fotografía de Bodegones' }, { code: 'PT', name: 'Fotografia de Natureza Morta' }] },
                { name: 'Fine Art Photography', tags: ['fine-art', 'artistic', 'conceptual', 'gallery', 'exhibition', 'creative'], translations: [{ code: 'EN', name: 'Fine Art Photography' }, { code: 'ES', name: 'Fotografía de Arte' }, { code: 'PT', name: 'Fotografia de Arte' }] },
                { name: 'Black and White Photography', tags: ['black-and-white', 'monochrome', 'bw', 'noir', 'contrast', 'classic'], translations: [{ code: 'EN', name: 'Black and White Photography' }, { code: 'ES', name: 'Fotografía en Blanco y Negro' }, { code: 'PT', name: 'Fotografia Preto e Branco' }] },
                { name: 'Long Exposure Photography', tags: ['long-exposure', 'slow-shutter', 'light-trails', 'motion-blur', 'night', 'nd-filter'], translations: [{ code: 'EN', name: 'Long Exposure Photography' }, { code: 'ES', name: 'Fotografía de Larga Exposición' }, { code: 'PT', name: 'Fotografia de Longa Exposição' }] },
                { name: 'Night Photography', tags: ['night', 'low-light', 'nocturnal', 'evening', 'city-lights', 'dark'], translations: [{ code: 'EN', name: 'Night Photography' }, { code: 'ES', name: 'Fotografía Nocturna' }, { code: 'PT', name: 'Fotografia Noturna' }] },
                { name: 'Abstract Photography', tags: ['abstract', 'artistic', 'experimental', 'creative', 'patterns', 'shapes'], translations: [{ code: 'EN', name: 'Abstract Photography' }, { code: 'ES', name: 'Fotografía Abstracta' }, { code: 'PT', name: 'Fotografia Abstrata' }] },
                { name: 'Newborn Photography', tags: ['newborn', 'baby', 'infant', 'maternity', 'family', 'studio'], translations: [{ code: 'EN', name: 'Newborn Photography' }, { code: 'ES', name: 'Fotografía de Recién Nacidos' }, { code: 'PT', name: 'Fotografia Newborn' }] },
                { name: 'Pet Photography', tags: ['pet', 'dog', 'cat', 'animal', 'pets', 'animals'], translations: [{ code: 'EN', name: 'Pet Photography' }, { code: 'ES', name: 'Fotografía de Mascotas' }, { code: 'PT', name: 'Fotografia de Pets' }] },
                { name: 'Automotive Photography', tags: ['automotive', 'car', 'vehicle', 'automobile', 'motor', 'racing'], translations: [{ code: 'EN', name: 'Automotive Photography' }, { code: 'ES', name: 'Fotografía Automotriz' }, { code: 'PT', name: 'Fotografia Automotiva' }] },
                { name: 'Real Estate Photography', tags: ['real-estate', 'property', 'home', 'house', 'interior', 'listing'], translations: [{ code: 'EN', name: 'Real Estate Photography' }, { code: 'ES', name: 'Fotografía Inmobiliaria' }, { code: 'PT', name: 'Fotografia Imobiliária' }] },
                { name: 'Lifestyle Photography', tags: ['lifestyle', 'candid', 'natural', 'everyday', 'authentic', 'casual'], translations: [{ code: 'EN', name: 'Lifestyle Photography' }, { code: 'ES', name: 'Fotografía de Estilo de Vida' }, { code: 'PT', name: 'Fotografia Lifestyle' }] },
                { name: 'Boudoir Photography', tags: ['boudoir', 'intimate', 'sensual', 'bedroom', 'glamorous', 'personal'], translations: [{ code: 'EN', name: 'Boudoir Photography' }, { code: 'ES', name: 'Fotografía Boudoir' }, { code: 'PT', name: 'Fotografia Boudoir' }] },
                { name: 'Corporate Photography', tags: ['corporate', 'business', 'professional', 'office', 'team', 'executive'], translations: [{ code: 'EN', name: 'Corporate Photography' }, { code: 'ES', name: 'Fotografía Corporativa' }, { code: 'PT', name: 'Fotografia Corporativa' }] },
                { name: 'Family Photography', tags: ['family', 'children', 'kids', 'parents', 'generations', 'portraits'], translations: [{ code: 'EN', name: 'Family Photography' }, { code: 'ES', name: 'Fotografía Familiar' }, { code: 'PT', name: 'Fotografia de Família' }] }
            ]
        },
        {
            name: 'Graphic Design',
            tags: ['graphic', 'design', 'visual', 'creative', 'designer', 'graphics', 'layout'],
            translations: [
                { code: 'EN', name: 'Graphic Design' },
                { code: 'ES', name: 'Diseño Gráfico' },
                { code: 'PT', name: 'Design Gráfico' }
            ],
            children: [
                { name: 'Logo Design', tags: ['logo', 'brand', 'identity', 'emblem', 'mark', 'symbol'], translations: [{ code: 'EN', name: 'Logo Design' }, { code: 'ES', name: 'Diseño de Logotipo' }, { code: 'PT', name: 'Design de Logotipo' }] },
                { name: 'Branding & Identity', tags: ['branding', 'brand-identity', 'corporate', 'identity', 'style-guide', 'brand-book'], translations: [{ code: 'EN', name: 'Branding & Identity' }, { code: 'ES', name: 'Identidad de Marca' }, { code: 'PT', name: 'Branding e Identidade' }] },
                { name: 'Print Design', tags: ['print', 'printing', 'printed', 'offset', 'digital-print', 'press'], translations: [{ code: 'EN', name: 'Print Design' }, { code: 'ES', name: 'Diseño de Impresión' }, { code: 'PT', name: 'Design de Impressão' }] },
                { name: 'Editorial Design', tags: ['editorial', 'layout', 'typography', 'publication', 'magazine', 'newspaper'], translations: [{ code: 'EN', name: 'Editorial Design' }, { code: 'ES', name: 'Diseño Editorial' }, { code: 'PT', name: 'Design Editorial' }] },
                { name: 'Poster Design', tags: ['poster', 'print', 'advertising', 'promotional', 'billboard', 'event'], translations: [{ code: 'EN', name: 'Poster Design' }, { code: 'ES', name: 'Diseño de Póster' }, { code: 'PT', name: 'Design de Pôster' }] },
                { name: 'Flyer Design', tags: ['flyer', 'leaflet', 'brochure', 'handout', 'pamphlet', 'marketing'], translations: [{ code: 'EN', name: 'Flyer Design' }, { code: 'ES', name: 'Diseño de Folleto' }, { code: 'PT', name: 'Design de Folheto' }] },
                { name: 'Business Card Design', tags: ['business-card', 'card', 'contact', 'corporate', 'professional', 'networking'], translations: [{ code: 'EN', name: 'Business Card Design' }, { code: 'ES', name: 'Diseño de Tarjeta de Presentación' }, { code: 'PT', name: 'Design de Cartão de Visita' }] },
                { name: 'Packaging Design', tags: ['packaging', 'box', 'product', 'label', 'wrapper', 'container'], translations: [{ code: 'EN', name: 'Packaging Design' }, { code: 'ES', name: 'Diseño de Empaque' }, { code: 'PT', name: 'Design de Embalagem' }] },
                { name: 'Book Cover Design', tags: ['book-cover', 'book', 'cover', 'ebook', 'novel', 'publishing'], translations: [{ code: 'EN', name: 'Book Cover Design' }, { code: 'ES', name: 'Diseño de Portada de Libro' }, { code: 'PT', name: 'Design de Capa de Livro' }] },
                { name: 'Album Cover Design', tags: ['album', 'music', 'cover-art', 'cd', 'vinyl', 'artwork'], translations: [{ code: 'EN', name: 'Album Cover Design' }, { code: 'ES', name: 'Diseño de Portada de Álbum' }, { code: 'PT', name: 'Design de Capa de Álbum' }] },
                { name: 'Advertising Design', tags: ['advertising', 'ads', 'marketing', 'campaign', 'commercial', 'promotion'], translations: [{ code: 'EN', name: 'Advertising Design' }, { code: 'ES', name: 'Diseño Publicitario' }, { code: 'PT', name: 'Design Publicitário' }] },
                { name: 'Social Media Design', tags: ['social-media', 'instagram', 'tiktok', 'linkedin', 'post', 'content'], translations: [{ code: 'EN', name: 'Social Media Design' }, { code: 'ES', name: 'Diseño para Redes Sociales' }, { code: 'PT', name: 'Design para Redes Sociais' }] },
                { name: 'Presentation Design', tags: ['presentation', 'powerpoint', 'slides', 'keynote', 'pitch-deck', 'corporate'], translations: [{ code: 'EN', name: 'Presentation Design' }, { code: 'ES', name: 'Diseño de Presentaciones' }, { code: 'PT', name: 'Design de Apresentações' }] },
                { name: 'Annual Report Design', tags: ['annual-report', 'report', 'corporate', 'financial', 'business', 'document'], translations: [{ code: 'EN', name: 'Annual Report Design' }, { code: 'ES', name: 'Diseño de Informe Anual' }, { code: 'PT', name: 'Design de Relatório Anual' }] },
                { name: 'Apparel Design', tags: ['apparel', 't-shirt', 'clothing', 'fashion', 'merchandise', 'textile'], translations: [{ code: 'EN', name: 'Apparel Design' }, { code: 'ES', name: 'Diseño de Ropa' }, { code: 'PT', name: 'Design de Vestuário' }] },
                { name: 'Merchandise Design', tags: ['merchandise', 'merch', 'sticker', 'products', 'branding', 'swag'], translations: [{ code: 'EN', name: 'Merchandise Design' }, { code: 'ES', name: 'Diseño de Merchandising' }, { code: 'PT', name: 'Design de Merchandise' }] },
                { name: 'Infographic Design', tags: ['infographic', 'data-viz', 'visualization', 'chart', 'statistics', 'information'], translations: [{ code: 'EN', name: 'Infographic Design' }, { code: 'ES', name: 'Diseño de Infografía' }, { code: 'PT', name: 'Design de Infográfico' }] },
                { name: 'Menu Design', tags: ['menu', 'restaurant', 'food-menu', 'cafe', 'dining', 'price-list'], translations: [{ code: 'EN', name: 'Menu Design' }, { code: 'ES', name: 'Diseño de Menú' }, { code: 'PT', name: 'Design de Cardápio' }] },
                { name: 'Catalog Design', tags: ['catalog', 'catalogue', 'product-catalog', 'lookbook', 'brochure', 'portfolio'], translations: [{ code: 'EN', name: 'Catalog Design' }, { code: 'ES', name: 'Diseño de Catálogo' }, { code: 'PT', name: 'Design de Catálogo' }] },
                { name: 'Label Design', tags: ['label', 'product-label', 'sticker', 'tag', 'badge', 'branding'], translations: [{ code: 'EN', name: 'Label Design' }, { code: 'ES', name: 'Diseño de Etiquetas' }, { code: 'PT', name: 'Design de Rótulos' }] }
            ]
        },
        {
            name: 'Web Design',
            tags: ['web', 'website', 'online', 'digital', 'internet', 'responsive', 'webdesign'],
            translations: [
                { code: 'EN', name: 'Web Design' },
                { code: 'ES', name: 'Diseño Web' },
                { code: 'PT', name: 'Web Design' }
            ],
            children: [
                { name: 'UI Design', tags: ['ui', 'interface', 'user-interface', 'screen', 'frontend', 'interaction'], translations: [{ code: 'EN', name: 'UI Design' }, { code: 'ES', name: 'Diseño de Interfaz' }, { code: 'PT', name: 'Design de Interface' }] },
                { name: 'UX Design', tags: ['ux', 'user-experience', 'usability', 'wireframe', 'prototype', 'research'], translations: [{ code: 'EN', name: 'UX Design' }, { code: 'ES', name: 'Diseño de Experiencia de Usuario' }, { code: 'PT', name: 'Design de Experiência do Usuário' }] },
                { name: 'Interaction Design', tags: ['interaction', 'ixd', 'microinteractions', 'animation', 'transitions', 'gestures'], translations: [{ code: 'EN', name: 'Interaction Design' }, { code: 'ES', name: 'Diseño de Interacción' }, { code: 'PT', name: 'Design de Interação' }] },
                { name: 'Landing Page Design', tags: ['landing-page', 'conversion', 'sales', 'marketing', 'page', 'lead'], translations: [{ code: 'EN', name: 'Landing Page Design' }, { code: 'ES', name: 'Diseño de Página de Aterrizaje' }, { code: 'PT', name: 'Design de Landing Page' }] },
                { name: 'Mobile App Design', tags: ['mobile', 'app', 'ios', 'android', 'application', 'smartphone'], translations: [{ code: 'EN', name: 'Mobile App Design' }, { code: 'ES', name: 'Diseño de Aplicación Móvil' }, { code: 'PT', name: 'Design de Aplicativo Móvel' }] },
                { name: 'Website Design', tags: ['website', 'site', 'homepage', 'ecommerce', 'wordpress', 'responsive'], translations: [{ code: 'EN', name: 'Website Design' }, { code: 'ES', name: 'Diseño de Sitio Web' }, { code: 'PT', name: 'Design de Website' }] },
                { name: 'Icon Design', tags: ['icon', 'iconography', 'symbol', 'glyph', 'pictogram', 'ui-icon'], translations: [{ code: 'EN', name: 'Icon Design' }, { code: 'ES', name: 'Diseño de Iconos' }, { code: 'PT', name: 'Design de Ícones' }] },
                { name: 'Dashboard Design', tags: ['dashboard', 'admin', 'panel', 'analytics', 'metrics', 'interface'], translations: [{ code: 'EN', name: 'Dashboard Design' }, { code: 'ES', name: 'Diseño de Dashboard' }, { code: 'PT', name: 'Design de Dashboard' }] },
                { name: 'Game Interface Design', tags: ['game-ui', 'gaming', 'hud', 'game-design', 'interface', 'esports'], translations: [{ code: 'EN', name: 'Game Interface Design' }, { code: 'ES', name: 'Diseño de Interfaz de Juegos' }, { code: 'PT', name: 'Design de Interface de Games' }] },
                { name: 'E-commerce Design', tags: ['ecommerce', 'e-commerce', 'shop', 'store', 'online-shop', 'shopify'], translations: [{ code: 'EN', name: 'E-commerce Design' }, { code: 'ES', name: 'Diseño de E-commerce' }, { code: 'PT', name: 'Design de E-commerce' }] },
            ]
        },
        {
            name: 'Digital Art',
            tags: ['digital-art', 'art', 'digital', 'artist', 'artwork', 'drawing', 'creative'],
            translations: [
                { code: 'EN', name: 'Digital Art' },
                { code: 'ES', name: 'Arte Digital' },
                { code: 'PT', name: 'Arte Digital' }
            ],
            children: [
                { name: 'Digital Painting', tags: ['painting', 'digital-painting', 'brush', 'photoshop', 'procreate', 'illustration'], translations: [{ code: 'EN', name: 'Digital Painting' }, { code: 'ES', name: 'Pintura Digital' }, { code: 'PT', name: 'Pintura Digital' }] },
                { name: 'Pixel Art', tags: ['pixel', 'pixelart', '8bit', 'retro', 'sprite', 'game-art'], translations: [{ code: 'EN', name: 'Pixel Art' }, { code: 'ES', name: 'Arte Pixel' }, { code: 'PT', name: 'Arte Pixel' }] },
                { name: 'Vector Art', tags: ['vector', 'illustrator', 'svg', 'scalable', 'geometric', 'flat'], translations: [{ code: 'EN', name: 'Vector Art' }, { code: 'ES', name: 'Arte Vectorial' }, { code: 'PT', name: 'Arte Vetorial' }] },
                { name: 'Photo Manipulation', tags: ['photo-manipulation', 'photo-editing', 'photoshop', 'composite', 'retouch', 'fantasy'], translations: [{ code: 'EN', name: 'Photo Manipulation' }, { code: 'ES', name: 'Manipulación de Fotos' }, { code: 'PT', name: 'Manipulação de Fotos' }] },
                { name: 'Photo Retouching', tags: ['retouching', 'photo-retouching', 'beauty', 'skin', 'correction', 'enhancement'], translations: [{ code: 'EN', name: 'Photo Retouching' }, { code: 'ES', name: 'Retoque Fotográfico' }, { code: 'PT', name: 'Retoque Fotográfico' }] },
                { name: 'Matte Painting', tags: ['matte', 'environment', 'background', 'landscape', 'concept', 'scenic'], translations: [{ code: 'EN', name: 'Matte Painting' }, { code: 'ES', name: 'Matte Painting' }, { code: 'PT', name: 'Matte Painting' }] },
                { name: 'Collage Art', tags: ['collage', 'mixed-media', 'composition', 'layered', 'montage', 'assemblage'], translations: [{ code: 'EN', name: 'Collage Art' }, { code: 'ES', name: 'Arte de Collage' }, { code: 'PT', name: 'Arte de Colagem' }] },
                { name: 'Abstract Art', tags: ['abstract', 'modern', 'contemporary', 'expressionism', 'avant-garde', 'artistic'], translations: [{ code: 'EN', name: 'Abstract Art' }, { code: 'ES', name: 'Arte Abstracto' }, { code: 'PT', name: 'Arte Abstrata' }] },
                { name: 'Generative & AI Art', tags: ['generative', 'ai-art', 'algorithmic', 'procedural', 'code-art', 'ai-generated'], translations: [{ code: 'EN', name: 'Generative & AI Art' }, { code: 'ES', name: 'Arte Generativo e IA' }, { code: 'PT', name: 'Arte Generativa e IA' }] }
            ]
        },
        {
            name: 'Illustration',
            tags: ['illustration', 'illustrator', 'drawing', 'art', 'sketch', 'design', 'creative'],
            translations: [
                { code: 'EN', name: 'Illustration' },
                { code: 'ES', name: 'Ilustración' },
                { code: 'PT', name: 'Ilustração' }
            ],
            children: [
                { name: 'Character Design', tags: ['character', 'character-design', 'mascot', 'avatar', 'nft', 'game-character'], translations: [{ code: 'EN', name: 'Character Design' }, { code: 'ES', name: 'Diseño de Personajes' }, { code: 'PT', name: 'Design de Personagens' }] },
                { name: 'Concept Art', tags: ['concept', 'concept-art', 'game-design', 'movie', 'entertainment', 'visdev'], translations: [{ code: 'EN', name: 'Concept Art' }, { code: 'ES', name: 'Arte Conceptual' }, { code: 'PT', name: 'Arte Conceitual' }] },
                { name: 'Children Book Illustration', tags: ['children', 'kids', 'book', 'story', 'childrenbook', 'youth'], translations: [{ code: 'EN', name: 'Children Book Illustration' }, { code: 'ES', name: 'Ilustración de Libros Infantiles' }, { code: 'PT', name: 'Ilustração de Livros Infantis' }] },
                { name: 'Editorial Illustration', tags: ['editorial', 'magazine', 'newspaper', 'article', 'publication', 'journalism'], translations: [{ code: 'EN', name: 'Editorial Illustration' }, { code: 'ES', name: 'Ilustración Editorial' }, { code: 'PT', name: 'Ilustração Editorial' }] },
                { name: 'Technical Illustration', tags: ['technical', 'diagram', 'manual', 'instruction', 'engineering', 'blueprint'], translations: [{ code: 'EN', name: 'Technical Illustration' }, { code: 'ES', name: 'Ilustración Técnica' }, { code: 'PT', name: 'Ilustração Técnica' }] },
                { name: 'Comic Art', tags: ['comic', 'comics', 'manga', 'graphic-novel', 'cartoon', 'sequential'], translations: [{ code: 'EN', name: 'Comic Art' }, { code: 'ES', name: 'Arte de Cómic' }, { code: 'PT', name: 'Arte de Quadrinhos' }] },
                { name: 'Manga & Anime', tags: ['manga', 'anime', 'japanese', 'otaku', 'webtoon', 'manhwa'], translations: [{ code: 'EN', name: 'Manga & Anime' }, { code: 'ES', name: 'Manga y Anime' }, { code: 'PT', name: 'Mangá e Anime' }] },
                { name: 'Storyboard', tags: ['storyboard', 'film', 'animation', 'scene', 'sequence', 'preproduction'], translations: [{ code: 'EN', name: 'Storyboard' }, { code: 'ES', name: 'Storyboard' }, { code: 'PT', name: 'Storyboard' }] },
                { name: 'Medical Illustration', tags: ['medical', 'anatomy', 'healthcare', 'scientific', 'biology', 'surgery'], translations: [{ code: 'EN', name: 'Medical Illustration' }, { code: 'ES', name: 'Ilustración Médica' }, { code: 'PT', name: 'Ilustração Médica' }] },
                { name: 'Scientific Illustration', tags: ['scientific', 'science', 'biology', 'research', 'education', 'academic'], translations: [{ code: 'EN', name: 'Scientific Illustration' }, { code: 'ES', name: 'Ilustración Científica' }, { code: 'PT', name: 'Ilustração Científica' }] },
                { name: 'Botanical Illustration', tags: ['botanical', 'plants', 'flowers', 'nature', 'flora', 'garden'], translations: [{ code: 'EN', name: 'Botanical Illustration' }, { code: 'ES', name: 'Ilustración Botánica' }, { code: 'PT', name: 'Ilustração Botânica' }] },
                { name: 'Fantasy Illustration', tags: ['fantasy', 'magic', 'dragons', 'creatures', 'mythical', 'imaginative'], translations: [{ code: 'EN', name: 'Fantasy Illustration' }, { code: 'ES', name: 'Ilustración de Fantasía' }, { code: 'PT', name: 'Ilustração de Fantasia' }] }
            ]
        },
        {
            name: '3D Modeling',
            tags: ['3d', '3d-modeling', 'modeling', 'blender', 'maya', 'unreal'],
            translations: [
                { code: 'EN', name: '3D Modeling' },
                { code: 'ES', name: 'Modelado 3D' },
                { code: 'PT', name: 'Modelagem 3D' }
            ],
            children: [
                { name: 'Character Modeling', tags: ['character', '3d-character', 'rigging', 'topology', 'game-ready', 'sculpt'], translations: [{ code: 'EN', name: 'Character Modeling' }, { code: 'ES', name: 'Modelado de Personajes' }, { code: 'PT', name: 'Modelagem de Personagens' }] },
                { name: 'Environment Modeling', tags: ['environment', 'landscape', 'scene', 'props', 'assets', 'level-design'], translations: [{ code: 'EN', name: 'Environment Modeling' }, { code: 'ES', name: 'Modelado de Entornos' }, { code: 'PT', name: 'Modelagem de Ambientes' }] },
                { name: 'Product Modeling', tags: ['product', 'visualization', 'commercial', 'industrial', 'prototype', 'cad'], translations: [{ code: 'EN', name: 'Product Modeling' }, { code: 'ES', name: 'Modelado de Productos' }, { code: 'PT', name: 'Modelagem de Produtos' }] },
                { name: 'Architectural Modeling', tags: ['architecture', 'building', 'interior', 'exterior', 'archviz', 'construction'], translations: [{ code: 'EN', name: 'Architectural Modeling' }, { code: 'ES', name: 'Modelado Arquitectónico' }, { code: 'PT', name: 'Modelagem Arquitetônica' }] },
                { name: '3D Rendering', tags: ['rendering', 'render', 'visualization', 'vray', 'octane', 'cycles'], translations: [{ code: 'EN', name: '3D Rendering' }, { code: 'ES', name: 'Renderizado 3D' }, { code: 'PT', name: 'Renderização 3D' }] },
                { name: 'Digital Sculpting', tags: ['sculpting', 'zbrush', 'sculpture', 'organic', 'high-poly', 'detailing'], translations: [{ code: 'EN', name: 'Digital Sculpting' }, { code: 'ES', name: 'Escultura Digital' }, { code: 'PT', name: 'Escultura Digital' }] },
                { name: 'Hard Surface Modeling', tags: ['hard-surface', 'mechanical', 'industrial', 'vehicles', 'props', 'technical'], translations: [{ code: 'EN', name: 'Hard Surface Modeling' }, { code: 'ES', name: 'Modelado de Superficies Duras' }, { code: 'PT', name: 'Modelagem Hard Surface' }] },
                { name: 'Texturing & Materials', tags: ['texturing', 'materials', 'substance', 'pbr', 'shading', 'uvs'], translations: [{ code: 'EN', name: 'Texturing & Materials' }, { code: 'ES', name: 'Texturizado y Materiales' }, { code: 'PT', name: 'Texturização e Materiais' }] },
                { name: 'Game Asset Modeling', tags: ['game-assets', 'game-ready', 'low-poly', 'optimization', 'unity', 'unreal'], translations: [{ code: 'EN', name: 'Game Asset Modeling' }, { code: 'ES', name: 'Modelado de Assets para Juegos' }, { code: 'PT', name: 'Modelagem de Assets para Jogos' }] }
            ]
        },
        {
            name: 'Animation',
            tags: ['animation', 'animated', 'animator', 'motion', 'cartoon', 'video', 'movement'],
            translations: [
                { code: 'EN', name: 'Animation' },
                { code: 'ES', name: 'Animación' },
                { code: 'PT', name: 'Animação' }
            ],
            children: [
                { name: '2D Animation', tags: ['2d', 'traditional', 'frame-by-frame', 'hand-drawn', 'toon', 'cartoon'], translations: [{ code: 'EN', name: '2D Animation' }, { code: 'ES', name: 'Animación 2D' }, { code: 'PT', name: 'Animação 2D' }] },
                { name: '3D Animation', tags: ['3d', 'cgi', 'computer-animation', 'pixar', 'metaverse', 'rigged'], translations: [{ code: 'EN', name: '3D Animation' }, { code: 'ES', name: 'Animación 3D' }, { code: 'PT', name: 'Animação 3D' }] },
                { name: 'Motion Graphics', tags: ['motion', 'motiongraphics', 'kinetic', 'after-effects', 'typography', 'dynamic'], translations: [{ code: 'EN', name: 'Motion Graphics' }, { code: 'ES', name: 'Gráficos en Movimiento' }, { code: 'PT', name: 'Motion Graphics' }] },
                { name: 'Stop Motion', tags: ['stopmotion', 'claymation', 'puppets', 'frame', 'physical', 'tangible'], translations: [{ code: 'EN', name: 'Stop Motion' }, { code: 'ES', name: 'Stop Motion' }, { code: 'PT', name: 'Stop Motion' }] },
                { name: 'Whiteboard Animation', tags: ['whiteboard', 'explainer', 'educational', 'hand-drawn', 'sketch', 'presentation'], translations: [{ code: 'EN', name: 'Whiteboard Animation' }, { code: 'ES', name: 'Animación en Pizarra' }, { code: 'PT', name: 'Animação em Quadro Branco' }] },
                { name: 'Explainer Video', tags: ['explainer', 'educational', 'tutorial', 'informational', 'business', 'promotional'], translations: [{ code: 'EN', name: 'Explainer Video' }, { code: 'ES', name: 'Video Explicativo' }, { code: 'PT', name: 'Vídeo Explicativo' }] },
                { name: 'Character Animation', tags: ['character-animation', 'rigging', 'walk-cycle', 'facial', 'acting', 'performance'], translations: [{ code: 'EN', name: 'Character Animation' }, { code: 'ES', name: 'Animación de Personajes' }, { code: 'PT', name: 'Animação de Personagens' }] },
                { name: 'Logo Animation', tags: ['logo-animation', 'brand', 'intro', 'motion-design', 'branding', 'reveal'], translations: [{ code: 'EN', name: 'Logo Animation' }, { code: 'ES', name: 'Animación de Logo' }, { code: 'PT', name: 'Animação de Logo' }] }
            ]
        },
        {
            name: 'Video Editing',
            tags: ['video', 'editing', 'editor', 'premiere', 'davinci-resolve', 'post-production'],
            translations: [
                { code: 'EN', name: 'Video Editing' },
                { code: 'ES', name: 'Edición de Video' },
                { code: 'PT', name: 'Edição de Vídeo' }
            ],
            children: [
                { name: 'Video Production', tags: ['production', 'filming', 'cinematography', 'videographer', 'recording', 'shoot'], translations: [{ code: 'EN', name: 'Video Production' }, { code: 'ES', name: 'Producción de Video' }, { code: 'PT', name: 'Produção de Vídeo' }] },
                { name: 'Color Grading', tags: ['color', 'grading', 'colorist', 'lut', 'davinci', 'correction'], translations: [{ code: 'EN', name: 'Color Grading' }, { code: 'ES', name: 'Corrección de Color' }, { code: 'PT', name: 'Correção de Cor' }] },
                { name: 'Visual Effects (VFX)', tags: ['vfx', 'effects', 'special-effects', 'compositing', 'cgi', 'after-effects'], translations: [{ code: 'EN', name: 'Visual Effects (VFX)' }, { code: 'ES', name: 'Efectos Visuales (VFX)' }, { code: 'PT', name: 'Efeitos Visuais (VFX)' }] },
                { name: 'Video Intro & Outro', tags: ['intro', 'outro', 'opening', 'closing', 'title', 'branding'], translations: [{ code: 'EN', name: 'Video Intro & Outro' }, { code: 'ES', name: 'Intro y Outro de Video' }, { code: 'PT', name: 'Intro e Outro de Vídeo' }] },
                { name: 'Promotional Video', tags: ['promo', 'promotional', 'advertising', 'commercial', 'marketing', 'ad'], translations: [{ code: 'EN', name: 'Promotional Video' }, { code: 'ES', name: 'Video Promocional' }, { code: 'PT', name: 'Vídeo Promocional' }] },
                { name: 'Music Video', tags: ['music', 'musicvideo', 'song', 'artist', 'band', 'performance'], translations: [{ code: 'EN', name: 'Music Video' }, { code: 'ES', name: 'Video Musical' }, { code: 'PT', name: 'Vídeo Musical' }] },
                { name: 'YouTube Video Editing', tags: ['youtube', 'vlog', 'content-creator', 'social-media', 'influencer', 'thumbnails'], translations: [{ code: 'EN', name: 'YouTube Video Editing' }, { code: 'ES', name: 'Edición de Videos de YouTube' }, { code: 'PT', name: 'Edição de Vídeos do YouTube' }] },
                { name: 'Social Media Video', tags: ['social-media', 'instagram', 'tiktok', 'shorts', 'reels', 'viral'], translations: [{ code: 'EN', name: 'Social Media Video' }, { code: 'ES', name: 'Video para Redes Sociales' }, { code: 'PT', name: 'Vídeo para Redes Sociais' }] },
                { name: 'Corporate Video', tags: ['corporate', 'business', 'company', 'training', 'internal', 'professional'], translations: [{ code: 'EN', name: 'Corporate Video' }, { code: 'ES', name: 'Video Corporativo' }, { code: 'PT', name: 'Vídeo Corporativo' }] },
                { name: 'Cinematography', tags: ['cinematography', 'camera', 'dop', 'lighting', 'cinematographer', 'camera-work'], translations: [{ code: 'EN', name: 'Cinematography' }, { code: 'ES', name: 'Cinematografía' }, { code: 'PT', name: 'Cinematografia' }] },
                { name: 'Documentary Filmmaking', tags: ['documentary', 'non-fiction', 'real-life', 'journalism', 'factual', 'film'], translations: [{ code: 'EN', name: 'Documentary Filmmaking' }, { code: 'ES', name: 'Cine Documental' }, { code: 'PT', name: 'Cinema Documental' }] },
                { name: 'Short Film', tags: ['short-film', 'short', 'independent', 'festival', 'narrative', 'storytelling'], translations: [{ code: 'EN', name: 'Short Film' }, { code: 'ES', name: 'Cortometraje' }, { code: 'PT', name: 'Curta-Metragem' }] }
            ]
        },
        {
            name: 'Traditional Art',
            tags: ['traditional', 'art', 'handmade', 'physical', 'fine-art', 'analog'],
            translations: [
                { code: 'EN', name: 'Traditional Art' },
                { code: 'ES', name: 'Arte Tradicional' },
                { code: 'PT', name: 'Arte Tradicional' }
            ],
            children: [
                { name: 'Painting', tags: ['painting', 'paint', 'canvas', 'fine-art', 'brush', 'artwork'], translations: [{ code: 'EN', name: 'Painting' }, { code: 'ES', name: 'Pintura' }, { code: 'PT', name: 'Pintura' }] },
                { name: 'Drawing', tags: ['drawing', 'pencil', 'sketch', 'line-art', 'graphite', 'pen'], translations: [{ code: 'EN', name: 'Drawing' }, { code: 'ES', name: 'Dibujo' }, { code: 'PT', name: 'Desenho' }] },
                { name: 'Watercolor', tags: ['watercolor', 'watercolour', 'aquarelle', 'wash', 'transparent', 'fluid'], translations: [{ code: 'EN', name: 'Watercolor' }, { code: 'ES', name: 'Acuarela' }, { code: 'PT', name: 'Aquarela' }] },
                { name: 'Oil Painting', tags: ['oil', 'oil-painting', 'classical', 'realistic', 'traditional', 'canvas'], translations: [{ code: 'EN', name: 'Oil Painting' }, { code: 'ES', name: 'Pintura al Óleo' }, { code: 'PT', name: 'Pintura a Óleo' }] },
                { name: 'Acrylic Painting', tags: ['acrylic', 'acrylic-painting', 'modern', 'vibrant', 'colorful', 'paint'], translations: [{ code: 'EN', name: 'Acrylic Painting' }, { code: 'ES', name: 'Pintura Acrílica' }, { code: 'PT', name: 'Pintura Acrílica' }] },
                { name: 'Sketch', tags: ['sketch', 'sketching', 'draft', 'preliminary', 'quick', 'study'], translations: [{ code: 'EN', name: 'Sketch' }, { code: 'ES', name: 'Boceto' }, { code: 'PT', name: 'Esboço' }] },
                { name: 'Charcoal Art', tags: ['charcoal', 'charcoal-drawing', 'monochrome', 'dark', 'dramatic', 'expressive'], translations: [{ code: 'EN', name: 'Charcoal Art' }, { code: 'ES', name: 'Arte con Carboncillo' }, { code: 'PT', name: 'Arte com Carvão' }] },
                { name: 'Pastel Art', tags: ['pastel', 'soft-pastel', 'chalk', 'color', 'portrait', 'delicate'], translations: [{ code: 'EN', name: 'Pastel Art' }, { code: 'ES', name: 'Arte con Pastel' }, { code: 'PT', name: 'Arte em Pastel' }] },
                { name: 'Ink Drawing', tags: ['ink', 'pen', 'line-art', 'illustration', 'black-ink', 'drawing'], translations: [{ code: 'EN', name: 'Ink Drawing' }, { code: 'ES', name: 'Dibujo a Tinta' }, { code: 'PT', name: 'Desenho a Nanquim' }] },
                { name: 'Mixed Media Art', tags: ['mixed-media', 'collage', 'multimedia', 'experimental', 'layered', 'combined'], translations: [{ code: 'EN', name: 'Mixed Media Art' }, { code: 'ES', name: 'Arte de Técnica Mixta' }, { code: 'PT', name: 'Arte de Mídia Mista' }] },
                { name: 'Gouache Painting', tags: ['gouache', 'opaque', 'watercolor', 'matte', 'paint', 'illustration'], translations: [{ code: 'EN', name: 'Gouache Painting' }, { code: 'ES', name: 'Pintura Gouache' }, { code: 'PT', name: 'Pintura Guache' }] }
            ]
        },
        {
            name: 'Typography',
            tags: ['typography', 'type', 'font', 'lettering', 'typeface', 'text', 'letters'],
            translations: [
                { code: 'EN', name: 'Typography' },
                { code: 'ES', name: 'Tipografía' },
                { code: 'PT', name: 'Tipografia' }
            ],
            children: [
                { name: 'Font Design', tags: ['font', 'typeface', 'type-design', 'glyphs', 'custom-font', 'fonts'], translations: [{ code: 'EN', name: 'Font Design' }, { code: 'ES', name: 'Diseño de Fuentes' }, { code: 'PT', name: 'Design de Fontes' }] },
                { name: 'Calligraphy', tags: ['calligraphy', 'handwriting', 'script', 'elegant', 'cursive', 'pen'], translations: [{ code: 'EN', name: 'Calligraphy' }, { code: 'ES', name: 'Caligrafía' }, { code: 'PT', name: 'Caligrafia' }] },
                { name: 'Hand Lettering', tags: ['lettering', 'hand-lettering', 'custom', 'handwritten', 'artistic', 'unique'], translations: [{ code: 'EN', name: 'Hand Lettering' }, { code: 'ES', name: 'Lettering a Mano' }, { code: 'PT', name: 'Lettering à Mão' }] },
                { name: 'Typeface Design', tags: ['typeface', 'font-family', 'type-system', 'typography', 'design', 'characters'], translations: [{ code: 'EN', name: 'Typeface Design' }, { code: 'ES', name: 'Diseño de Tipografía' }, { code: 'PT', name: 'Design de Tipografia' }] }
            ]
        },
        {
            name: 'Spatial & Environmental Design',
            tags: ['spatial', 'environmental', 'experiential', 'physical', 'space', 'exhibition'],
            translations: [
                { code: 'EN', name: 'Spatial & Environmental Design' },
                { code: 'ES', name: 'Diseño Espacial y Ambiental' },
                { code: 'PT', name: 'Design Espacial e Ambiental' }
            ],
            children: [
                { name: 'Environmental Design', tags: ['environmental', 'space', 'wayfinding', 'signage', 'public-space', 'architecture'], translations: [{ code: 'EN', name: 'Environmental Design' }, { code: 'ES', name: 'Diseño Ambiental' }, { code: 'PT', name: 'Design Ambiental' }] },
                { name: 'Wayfinding & Signage', tags: ['wayfinding', 'signage', 'navigation', 'signs', 'directional', 'orientation'], translations: [{ code: 'EN', name: 'Wayfinding & Signage' }, { code: 'ES', name: 'Señalización y Orientación' }, { code: 'PT', name: 'Sinalização e Orientação' }] },
                { name: 'Exhibition Design', tags: ['exhibition', 'museum', 'gallery', 'display', 'installation', 'showcase'], translations: [{ code: 'EN', name: 'Exhibition Design' }, { code: 'ES', name: 'Diseño de Exposiciones' }, { code: 'PT', name: 'Design de Exposições' }] },
                { name: 'Trade Show Design', tags: ['trade-show', 'booth', 'stand', 'fair', 'expo', 'event-design'], translations: [{ code: 'EN', name: 'Trade Show Design' }, { code: 'ES', name: 'Diseño de Stands' }, { code: 'PT', name: 'Design de Estandes' }] },
                { name: 'Experiential Design', tags: ['experiential', 'immersive', 'interactive', 'experience', 'engagement', 'activation'], translations: [{ code: 'EN', name: 'Experiential Design' }, { code: 'ES', name: 'Diseño Experiencial' }, { code: 'PT', name: 'Design Experiencial' }] },
                { name: 'Interior Design', tags: ['interior', 'interior-design', 'home', 'decor', 'furniture', 'residential'], translations: [{ code: 'EN', name: 'Interior Design' }, { code: 'ES', name: 'Diseño de Interiores' }, { code: 'PT', name: 'Design de Interiores' }] },
                { name: 'Retail Design', tags: ['retail', 'store', 'shop', 'commercial', 'visual-merchandising', 'display'], translations: [{ code: 'EN', name: 'Retail Design' }, { code: 'ES', name: 'Diseño de Retail' }, { code: 'PT', name: 'Design de Varejo' }] },
                { name: 'Set Design', tags: ['set-design', 'stage', 'theater', 'film-set', 'production-design', 'scenery'], translations: [{ code: 'EN', name: 'Set Design' }, { code: 'ES', name: 'Diseño de Escenografía' }, { code: 'PT', name: 'Cenografia' }] }
            ]
        },
        {
            name: 'Fashion Design',
            tags: ['fashion', 'clothing', 'garments', 'apparel', 'designer', 'couture'],
            translations: [
                { code: 'EN', name: 'Fashion Design' },
                { code: 'ES', name: 'Diseño de Moda' },
                { code: 'PT', name: 'Design de Moda' }
            ],
            children: [
                { name: 'Clothing Design', tags: ['clothing', 'garment', 'fashion', 'patterns', 'tailoring', 'sewing'], translations: [{ code: 'EN', name: 'Clothing Design' }, { code: 'ES', name: 'Diseño de Ropa' }, { code: 'PT', name: 'Design de Roupas' }] },
                { name: 'Fashion Illustration', tags: ['fashion-illustration', 'sketches', 'croquis', 'runway', 'designer', 'style'], translations: [{ code: 'EN', name: 'Fashion Illustration' }, { code: 'ES', name: 'Ilustración de Moda' }, { code: 'PT', name: 'Ilustração de Moda' }] },
                { name: 'Textile Design', tags: ['textile', 'fabric', 'print', 'pattern', 'surface-design', 'material'], translations: [{ code: 'EN', name: 'Textile Design' }, { code: 'ES', name: 'Diseño Textil' }, { code: 'PT', name: 'Design Têxtil' }] },
                { name: 'Accessories Design', tags: ['accessories', 'bags', 'shoes', 'jewelry', 'fashion', 'luxury'], translations: [{ code: 'EN', name: 'Accessories Design' }, { code: 'ES', name: 'Diseño de Accesorios' }, { code: 'PT', name: 'Design de Acessórios' }] },
                { name: 'Costume Design', tags: ['costume', 'theater', 'film', 'cosplay', 'performance', 'character'], translations: [{ code: 'EN', name: 'Costume Design' }, { code: 'ES', name: 'Diseño de Vestuario' }, { code: 'PT', name: 'Design de Figurino' }] },
                { name: 'Footwear Design', tags: ['footwear', 'shoes', 'sneakers', 'boots', 'sandals', 'design'], translations: [{ code: 'EN', name: 'Footwear Design' }, { code: 'ES', name: 'Diseño de Calzado' }, { code: 'PT', name: 'Design de Calçados' }] },
            ]
        },
        {
            name: 'Street & Urban Art',
            tags: ['street-art', 'urban', 'graffiti', 'murals', 'public-art', 'walls'],
            translations: [
                { code: 'EN', name: 'Street & Urban Art' },
                { code: 'ES', name: 'Arte Urbano y Callejero' },
                { code: 'PT', name: 'Arte Urbana e de Rua' }
            ],
            children: [
                { name: 'Mural Painting', tags: ['mural', 'wall-art', 'large-scale', 'public', 'painting', 'outdoor'], translations: [{ code: 'EN', name: 'Mural Painting' }, { code: 'ES', name: 'Pintura Mural' }, { code: 'PT', name: 'Pintura Mural' }] },
                { name: 'Graffiti Art', tags: ['graffiti', 'spray-paint', 'street', 'urban', 'tag', 'bombing'], translations: [{ code: 'EN', name: 'Graffiti Art' }, { code: 'ES', name: 'Arte de Graffiti' }, { code: 'PT', name: 'Arte de Grafite' }] },
                { name: 'Street Art', tags: ['street-art', 'urban-art', 'public', 'stencil', 'installation', 'contemporary'], translations: [{ code: 'EN', name: 'Street Art' }, { code: 'ES', name: 'Arte Callejero' }, { code: 'PT', name: 'Arte de Rua' }] },
                { name: 'Stencil Art', tags: ['stencil', 'spray', 'template', 'urban', 'banksy', 'street'], translations: [{ code: 'EN', name: 'Stencil Art' }, { code: 'ES', name: 'Arte con Plantilla' }, { code: 'PT', name: 'Arte de Estêncil' }] }
            ]
        },
        {
            name: 'Tattoo & Body Art',
            tags: ['tattoo', 'ink', 'body-art', 'tattooing', 'tattoos', 'artist'],
            translations: [
                { code: 'EN', name: 'Tattoo & Body Art' },
                { code: 'ES', name: 'Tatuaje y Arte Corporal' },
                { code: 'PT', name: 'Tatuagem e Arte Corporal' }
            ],
            children: [
                { name: 'Custom Tattoo Design', tags: ['tattoo', 'ink', 'custom', 'flash', 'artist', 'consultation'], translations: [{ code: 'EN', name: 'Custom Tattoo Design' }, { code: 'ES', name: 'Diseño de Tatuaje a Medida' }, { code: 'PT', name: 'Design de Tatuagem Personalizado' }] },
                { name: 'Traditional & Neo-Traditional', tags: ['traditional', 'neo-traditional', 'old-school', 'bold', 'classic', 'americana'], translations: [{ code: 'EN', name: 'Traditional & Neo-Traditional' }, { code: 'ES', name: 'Tradicional y Neo-Tradicional' }, { code: 'PT', name: 'Tradicional e Neo-Tradicional' }] },
                { name: 'Realism & Portrait', tags: ['realism', 'portrait', 'photorealistic', 'black-grey', 'detailed', 'shading'], translations: [{ code: 'EN', name: 'Realism & Portrait' }, { code: 'ES', name: 'Realismo y Retrato' }, { code: 'PT', name: 'Realismo e Retrato' }] },
                { name: 'Japanese & Oriental', tags: ['japanese', 'irezumi', 'oriental', 'dragon', 'koi', 'horimono'], translations: [{ code: 'EN', name: 'Japanese & Oriental' }, { code: 'ES', name: 'Japonés y Oriental' }, { code: 'PT', name: 'Japonês e Oriental' }] },
                { name: 'Tribal & Blackwork', tags: ['tribal', 'blackwork', 'polynesian', 'maori', 'black-ink', 'solid'], translations: [{ code: 'EN', name: 'Tribal & Blackwork' }, { code: 'ES', name: 'Tribal y Blackwork' }, { code: 'PT', name: 'Tribal e Blackwork' }] },
                { name: 'Geometric, Mandala & Ornamental', tags: ['geometric', 'mandala', 'dotwork', 'ornamental', 'symmetry', 'pattern'], translations: [{ code: 'EN', name: 'Geometric, Mandala & Ornamental' }, { code: 'ES', name: 'Geométrico, Mandala y Ornamental' }, { code: 'PT', name: 'Geométrico, Mandala e Ornamental' }] },
                { name: 'Fine Line & Minimal', tags: ['fine-line', 'minimalist', 'delicate', 'single-needle', 'micro', 'simple'], translations: [{ code: 'EN', name: 'Fine Line & Minimal' }, { code: 'ES', name: 'Línea Fina y Minimalista' }, { code: 'PT', name: 'Linha Fina e Minimalista' }] },
                { name: 'Lettering & Script', tags: ['lettering', 'script', 'typography', 'calligraphy', 'text', 'words'], translations: [{ code: 'EN', name: 'Lettering & Script' }, { code: 'ES', name: 'Lettering y Script' }, { code: 'PT', name: 'Lettering e Script' }] },
                { name: 'Illustrative & Color', tags: ['illustrative', 'watercolor', 'color', 'sketch', 'artistic', 'painterly'], translations: [{ code: 'EN', name: 'Illustrative & Color' }, { code: 'ES', name: 'Ilustrativo y Color' }, { code: 'PT', name: 'Ilustrativo e Cor' }] },
                { name: 'Cover-Up & Rework', tags: ['cover-up', 'rework', 'fix', 'correction', 'transformation', 'laser'], translations: [{ code: 'EN', name: 'Cover-Up & Rework' }, { code: 'ES', name: 'Cobertura y Retoque' }, { code: 'PT', name: 'Cobertura e Retrabalho' }] },
                { name: 'Henna & Temporary Body Art', tags: ['henna', 'mehndi', 'temporary', 'jagua', 'natural', 'body-art'], translations: [{ code: 'EN', name: 'Henna & Temporary Body Art' }, { code: 'ES', name: 'Henna y Arte Corporal Temporal' }, { code: 'PT', name: 'Henna e Arte Corporal Temporária' }] },
                { name: 'Piercing', tags: ['piercing', 'body-piercing', 'jewelry', 'body-modification', 'ear', 'nose'], translations: [{ code: 'EN', name: 'Piercing' }, { code: 'ES', name: 'Piercing' }, { code: 'PT', name: 'Piercing' }] }
            ]
        },
        {
            name: 'Crafts & Handmade',
            tags: ['crafts', 'handmade', 'artisan', 'diy', 'handcrafted', 'maker', 'creative'],
            translations: [
                { code: 'EN', name: 'Crafts & Handmade' },
                { code: 'ES', name: 'Artesanías y Manualidades' },
                { code: 'PT', name: 'Artesanato e Feito à Mão' }
            ],
            children: [
                { name: 'Jewelry Design', tags: ['jewelry', 'jewellery', 'accessories', 'handmade', 'artisan', 'wearable'], translations: [{ code: 'EN', name: 'Jewelry Design' }, { code: 'ES', name: 'Diseño de Joyería' }, { code: 'PT', name: 'Design de Joias' }] },
                { name: 'Textile Art', tags: ['textile', 'fabric', 'weaving', 'embroidery', 'fiber', 'cloth'], translations: [{ code: 'EN', name: 'Textile Art' }, { code: 'ES', name: 'Arte Textil' }, { code: 'PT', name: 'Arte Têxtil' }] },
                { name: 'Ceramics & Pottery', tags: ['ceramics', 'pottery', 'clay', 'porcelain', 'kiln', 'handmade'], translations: [{ code: 'EN', name: 'Ceramics & Pottery' }, { code: 'ES', name: 'Cerámica y Alfarería' }, { code: 'PT', name: 'Cerâmica e Olaria' }] },
                { name: 'Woodworking', tags: ['woodworking', 'wood', 'carpentry', 'furniture', 'craft', 'carving'], translations: [{ code: 'EN', name: 'Woodworking' }, { code: 'ES', name: 'Carpintería' }, { code: 'PT', name: 'Carpintaria' }] },
                { name: 'Sculpture', tags: ['sculpture', 'sculpting', '3d', 'statue', 'carving', 'art'], translations: [{ code: 'EN', name: 'Sculpture' }, { code: 'ES', name: 'Escultura' }, { code: 'PT', name: 'Escultura' }] },
                { name: 'Paper Craft', tags: ['paper', 'papercraft', 'origami', 'card-making', 'scrapbook', 'cardstock'], translations: [{ code: 'EN', name: 'Paper Craft' }, { code: 'ES', name: 'Manualidades de Papel' }, { code: 'PT', name: 'Artesanato de Papel' }] },
                { name: 'Leatherworking', tags: ['leather', 'leathercraft', 'leatherworking', 'handmade', 'bags', 'wallets'], translations: [{ code: 'EN', name: 'Leatherworking' }, { code: 'ES', name: 'Marroquinería' }, { code: 'PT', name: 'Couro e Artesanato em Couro' }] },
                { name: 'Resin Art', tags: ['resin', 'epoxy', 'resin-art', 'casting', 'transparent', 'crafts'], translations: [{ code: 'EN', name: 'Resin Art' }, { code: 'ES', name: 'Arte en Resina' }, { code: 'PT', name: 'Arte em Resina' }] },
                { name: 'Glass Art', tags: ['glass', 'glassblowing', 'stained-glass', 'glasswork', 'fused-glass', 'art'], translations: [{ code: 'EN', name: 'Glass Art' }, { code: 'ES', name: 'Arte en Vidrio' }, { code: 'PT', name: 'Arte em Vidro' }] },
                { name: 'Metalworking', tags: ['metalworking', 'metal', 'blacksmithing', 'forge', 'welding', 'craft'], translations: [{ code: 'EN', name: 'Metalworking' }, { code: 'ES', name: 'Herrería y Metalistería' }, { code: 'PT', name: 'Metalurgia e Ferraria' }] },
                { name: 'Macramé', tags: ['macrame', 'macramé', 'knots', 'rope', 'cord', 'wall-hanging'], translations: [{ code: 'EN', name: 'Macramé' }, { code: 'ES', name: 'Macramé' }, { code: 'PT', name: 'Macramê' }] },
                { name: 'Bookbinding', tags: ['bookbinding', 'book', 'binding', 'journal', 'handmade-books', 'craft'], translations: [{ code: 'EN', name: 'Bookbinding' }, { code: 'ES', name: 'Encuadernación' }, { code: 'PT', name: 'Encadernação' }] },
                { name: 'Printmaking', tags: ['printmaking', 'printing', 'linocut', 'screen-print', 'etching', 'art'], translations: [{ code: 'EN', name: 'Printmaking' }, { code: 'ES', name: 'Grabado' }, { code: 'PT', name: 'Gravura' }] }
            ]
        }
    ];

    const s3Ok = isS3Configured();
    const compressService = s3Ok
      ? FactoryCompressService.create({ driver: 'sharp' })
      : null;
    const storageService = s3Ok
      ? FactoryStorageService.create(buildS3Config())
      : null;

    const createCategories = async (category: SeedCategory, parentId?: number) => {
        const slug = allocateCategorySlug(category.name);
        let thumbnail: string | null = null;
        const sourcePath = findCategorySourceImageFile(category.name);
        if (sourcePath) {
          if (compressService && storageService) {
            thumbnail = await uploadCategoryThumbnailFromFile(
              slug,
              sourcePath,
              compressService,
              storageService,
            );
          } else {
            Logger.warn(
              `Category "${category.name}": found ${path.basename(sourcePath)} but S3 is not configured; skipping thumbnail upload.`,
            );
          }
        }
        const isFeatured = thumbnail != null;

        const columns = ['name', 'slug', 'tags', 'thumbnail', 'is_featured'];
        const values: unknown[] = [
          category.name,
          slug,
          category.tags.join(','),
          thumbnail,
          isFeatured,
        ];

        if (parentId !== undefined) {
            columns.push('parent_id');
            values.push(parentId);
        }
        const parentCategory = await Query.table('categories').insertAndGet(columns, values as any[], 'id');
        await Promise.all(category.translations.map(async (child) => {
            await Query.table('category_translations').insertAndGet(['name', 'language_code', 'category_id'], [child.name, child.code, parentCategory.id], 'id');
        }));
        if (category.children) {
            await Promise.all(category.children.map(child => createCategories(child, parentCategory.id)))
        }
    }

    // Truncate tables in correct order, handling foreign keys
    await Schema.table('category_translations').truncate();
    await Query.raw('TRUNCATE TABLE categories RESTART IDENTITY CASCADE');

    // Insert categories sequentially to avoid any potential issues with parallel inserts
    for (const category of categories) {
        await createCategories(category);
    }
};
