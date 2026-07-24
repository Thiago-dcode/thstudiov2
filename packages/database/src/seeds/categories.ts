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
    /** Category kind; children inherit their parent's type. Defaults to DISCIPLINE. */
    type?: EnumType<'CATEGORY_TYPE'>,
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
            tags: ['photo', 'photos', 'camera', 'photographer', 'photoshoot'],
            translations: [
                { code: 'EN', name: 'Photography' },
                { code: 'ES', name: 'Fotografía' },
                { code: 'PT', name: 'Fotografia' }
            ],
            children: [
                { name: 'Portrait Photography', tags: ['portrait', 'headshot', 'people', 'studio', 'professional'], translations: [{ code: 'EN', name: 'Portrait Photography' }, { code: 'ES', name: 'Fotografía de Retrato' }, { code: 'PT', name: 'Fotografia de Retrato' }] },
                { name: 'Wedding & Events', tags: ['wedding', 'event', 'ceremony', 'celebration', 'party'], translations: [{ code: 'EN', name: 'Wedding & Events' }, { code: 'ES', name: 'Bodas y Eventos' }, { code: 'PT', name: 'Casamentos e Eventos' }] },
                { name: 'Fashion & Editorial', tags: ['fashion', 'editorial', 'model', 'runway', 'lookbook'], translations: [{ code: 'EN', name: 'Fashion & Editorial' }, { code: 'ES', name: 'Moda y Editorial' }, { code: 'PT', name: 'Moda e Editorial' }] },
                { name: 'Product & Commercial', tags: ['product', 'commercial', 'ecommerce', 'studio', 'advertising'], translations: [{ code: 'EN', name: 'Product & Commercial' }, { code: 'ES', name: 'Producto y Comercial' }, { code: 'PT', name: 'Produto e Comercial' }] },
                { name: 'Architecture & Real Estate', tags: ['architecture', 'real-estate', 'interior', 'building', 'property'], translations: [{ code: 'EN', name: 'Architecture & Real Estate' }, { code: 'ES', name: 'Arquitectura e Inmobiliaria' }, { code: 'PT', name: 'Arquitetura e Imóveis' }] },
                { name: 'Landscape & Nature', tags: ['landscape', 'nature', 'wildlife', 'travel', 'outdoor'], translations: [{ code: 'EN', name: 'Landscape & Nature' }, { code: 'ES', name: 'Paisaje y Naturaleza' }, { code: 'PT', name: 'Paisagem e Natureza' }] },
                { name: 'Aerial & Drone', tags: ['aerial', 'drone', 'uav', 'birds-eye', 'overhead'], translations: [{ code: 'EN', name: 'Aerial & Drone' }, { code: 'ES', name: 'Aérea y Dron' }, { code: 'PT', name: 'Aérea e Drone' }] },
                { name: 'Documentary & Street', tags: ['documentary', 'street', 'photojournalism', 'candid', 'urban'], translations: [{ code: 'EN', name: 'Documentary & Street' }, { code: 'ES', name: 'Documental y Callejera' }, { code: 'PT', name: 'Documental e de Rua' }] }
            ]
        },
        {
            name: 'Film & Video',
            tags: ['film', 'video', 'filmmaker', 'cinema', 'footage'],
            translations: [
                { code: 'EN', name: 'Film & Video' },
                { code: 'ES', name: 'Cine y Video' },
                { code: 'PT', name: 'Cinema e Vídeo' }
            ],
            children: [
                { name: 'Cinematography', tags: ['cinematography', 'camera', 'dop', 'lighting', 'camera-work'], translations: [{ code: 'EN', name: 'Cinematography' }, { code: 'ES', name: 'Cinematografía' }, { code: 'PT', name: 'Cinematografia' }] },
                { name: 'Video Editing', tags: ['editing', 'editor', 'post-production', 'premiere', 'davinci'], translations: [{ code: 'EN', name: 'Video Editing' }, { code: 'ES', name: 'Edición de Video' }, { code: 'PT', name: 'Edição de Vídeo' }] },
                { name: 'Color Grading', tags: ['color', 'grading', 'colorist', 'davinci', 'lut'], translations: [{ code: 'EN', name: 'Color Grading' }, { code: 'ES', name: 'Corrección de Color' }, { code: 'PT', name: 'Correção de Cor' }] },
                { name: 'Music Videos', tags: ['music-video', 'band', 'performance', 'artist', 'song'], translations: [{ code: 'EN', name: 'Music Videos' }, { code: 'ES', name: 'Videos Musicales' }, { code: 'PT', name: 'Videoclipes' }] },
                { name: 'Commercials & Promos', tags: ['commercial', 'promo', 'advertising', 'brand', 'marketing'], translations: [{ code: 'EN', name: 'Commercials & Promos' }, { code: 'ES', name: 'Comerciales y Promos' }, { code: 'PT', name: 'Comerciais e Promos' }] },
                { name: 'Documentary', tags: ['documentary', 'non-fiction', 'film', 'storytelling', 'reportage'], translations: [{ code: 'EN', name: 'Documentary' }, { code: 'ES', name: 'Documental' }, { code: 'PT', name: 'Documentário' }] }
            ]
        },
        {
            name: 'Motion & Animation',
            tags: ['animation', 'motion', 'animator', 'animated', 'movement'],
            translations: [
                { code: 'EN', name: 'Motion & Animation' },
                { code: 'ES', name: 'Motion y Animación' },
                { code: 'PT', name: 'Motion e Animação' }
            ],
            children: [
                { name: '2D Animation', tags: ['2d', 'frame-by-frame', 'hand-drawn', 'cartoon', 'traditional'], translations: [{ code: 'EN', name: '2D Animation' }, { code: 'ES', name: 'Animación 2D' }, { code: 'PT', name: 'Animação 2D' }] },
                { name: '3D Animation', tags: ['3d', 'cgi', 'rigged', 'computer-animation', 'pixar'], translations: [{ code: 'EN', name: '3D Animation' }, { code: 'ES', name: 'Animación 3D' }, { code: 'PT', name: 'Animação 3D' }] },
                { name: 'Motion Graphics', tags: ['motion', 'after-effects', 'kinetic', 'typography', 'dynamic'], translations: [{ code: 'EN', name: 'Motion Graphics' }, { code: 'ES', name: 'Gráficos en Movimiento' }, { code: 'PT', name: 'Motion Graphics' }] },
                { name: 'Character Animation', tags: ['character', 'rigging', 'walk-cycle', 'acting', 'performance'], translations: [{ code: 'EN', name: 'Character Animation' }, { code: 'ES', name: 'Animación de Personajes' }, { code: 'PT', name: 'Animação de Personagens' }] },
                { name: 'Logo Animation', tags: ['logo', 'brand', 'intro', 'reveal', 'branding'], translations: [{ code: 'EN', name: 'Logo Animation' }, { code: 'ES', name: 'Animación de Logo' }, { code: 'PT', name: 'Animação de Logo' }] },
                { name: 'Visual Effects (VFX)', tags: ['vfx', 'compositing', 'effects', 'cgi', 'special-effects'], translations: [{ code: 'EN', name: 'Visual Effects (VFX)' }, { code: 'ES', name: 'Efectos Visuales (VFX)' }, { code: 'PT', name: 'Efeitos Visuais (VFX)' }] }
            ]
        },
        {
            name: 'Illustration',
            tags: ['illustration', 'illustrator', 'drawing', 'art', 'sketch'],
            translations: [
                { code: 'EN', name: 'Illustration' },
                { code: 'ES', name: 'Ilustración' },
                { code: 'PT', name: 'Ilustração' }
            ],
            children: [
                { name: 'Editorial Illustration', tags: ['editorial', 'magazine', 'article', 'publication', 'newspaper'], translations: [{ code: 'EN', name: 'Editorial Illustration' }, { code: 'ES', name: 'Ilustración Editorial' }, { code: 'PT', name: 'Ilustração Editorial' }] },
                { name: 'Character Design', tags: ['character', 'mascot', 'avatar', 'game-character', 'nft'], translations: [{ code: 'EN', name: 'Character Design' }, { code: 'ES', name: 'Diseño de Personajes' }, { code: 'PT', name: 'Design de Personagens' }] },
                { name: 'Concept Art', tags: ['concept', 'game', 'film', 'visdev', 'entertainment'], translations: [{ code: 'EN', name: 'Concept Art' }, { code: 'ES', name: 'Arte Conceptual' }, { code: 'PT', name: 'Arte Conceitual' }] },
                { name: 'Comic & Manga', tags: ['comic', 'manga', 'graphic-novel', 'cartoon', 'anime'], translations: [{ code: 'EN', name: 'Comic & Manga' }, { code: 'ES', name: 'Cómic y Manga' }, { code: 'PT', name: 'Quadrinhos e Mangá' }] },
                { name: "Children's Books", tags: ['children', 'kids', 'storybook', 'youth', 'picture-book'], translations: [{ code: 'EN', name: "Children's Books" }, { code: 'ES', name: 'Libros Infantiles' }, { code: 'PT', name: 'Livros Infantis' }] },
                { name: 'Fantasy & Sci-Fi', tags: ['fantasy', 'sci-fi', 'creatures', 'imaginative', 'magic'], translations: [{ code: 'EN', name: 'Fantasy & Sci-Fi' }, { code: 'ES', name: 'Fantasía y Ciencia Ficción' }, { code: 'PT', name: 'Fantasia e Ficção Científica' }] }
            ]
        },
        {
            name: 'Graphic Design',
            tags: ['graphic', 'design', 'visual', 'designer', 'layout'],
            translations: [
                { code: 'EN', name: 'Graphic Design' },
                { code: 'ES', name: 'Diseño Gráfico' },
                { code: 'PT', name: 'Design Gráfico' }
            ],
            children: [
                { name: 'Branding & Identity', tags: ['branding', 'identity', 'brand-book', 'style-guide', 'corporate'], translations: [{ code: 'EN', name: 'Branding & Identity' }, { code: 'ES', name: 'Identidad de Marca' }, { code: 'PT', name: 'Branding e Identidade' }] },
                { name: 'Logo Design', tags: ['logo', 'brand', 'emblem', 'mark', 'symbol'], translations: [{ code: 'EN', name: 'Logo Design' }, { code: 'ES', name: 'Diseño de Logotipo' }, { code: 'PT', name: 'Design de Logotipo' }] },
                { name: 'Print & Editorial', tags: ['print', 'editorial', 'magazine', 'layout', 'publication'], translations: [{ code: 'EN', name: 'Print & Editorial' }, { code: 'ES', name: 'Impresión y Editorial' }, { code: 'PT', name: 'Impressão e Editorial' }] },
                { name: 'Packaging', tags: ['packaging', 'box', 'label', 'product', 'container'], translations: [{ code: 'EN', name: 'Packaging' }, { code: 'ES', name: 'Empaque' }, { code: 'PT', name: 'Embalagem' }] },
                { name: 'Poster & Advertising', tags: ['poster', 'advertising', 'campaign', 'promotional', 'ads'], translations: [{ code: 'EN', name: 'Poster & Advertising' }, { code: 'ES', name: 'Póster y Publicidad' }, { code: 'PT', name: 'Pôster e Publicidade' }] },
                { name: 'Typography & Lettering', tags: ['typography', 'lettering', 'type', 'font', 'calligraphy'], translations: [{ code: 'EN', name: 'Typography & Lettering' }, { code: 'ES', name: 'Tipografía y Lettering' }, { code: 'PT', name: 'Tipografia e Lettering' }] }
            ]
        },
        {
            name: 'Product & Web Design',
            tags: ['product-design', 'web', 'ui', 'ux', 'digital'],
            translations: [
                { code: 'EN', name: 'Product & Web Design' },
                { code: 'ES', name: 'Diseño de Producto y Web' },
                { code: 'PT', name: 'Design de Produto e Web' }
            ],
            children: [
                { name: 'UI Design', tags: ['ui', 'interface', 'frontend', 'screen', 'visual'], translations: [{ code: 'EN', name: 'UI Design' }, { code: 'ES', name: 'Diseño de Interfaz' }, { code: 'PT', name: 'Design de Interface' }] },
                { name: 'UX Design', tags: ['ux', 'usability', 'wireframe', 'research', 'user-experience'], translations: [{ code: 'EN', name: 'UX Design' }, { code: 'ES', name: 'Diseño UX' }, { code: 'PT', name: 'Design UX' }] },
                { name: 'Web Design', tags: ['web', 'website', 'responsive', 'landing', 'homepage'], translations: [{ code: 'EN', name: 'Web Design' }, { code: 'ES', name: 'Diseño Web' }, { code: 'PT', name: 'Web Design' }] },
                { name: 'Mobile App Design', tags: ['mobile', 'app', 'ios', 'android', 'application'], translations: [{ code: 'EN', name: 'Mobile App Design' }, { code: 'ES', name: 'Diseño de App Móvil' }, { code: 'PT', name: 'Design de App Móvel' }] },
                { name: 'Design Systems', tags: ['design-system', 'components', 'tokens', 'library', 'ui-kit'], translations: [{ code: 'EN', name: 'Design Systems' }, { code: 'ES', name: 'Sistemas de Diseño' }, { code: 'PT', name: 'Design Systems' }] }
            ]
        },
        {
            name: '3D & CGI',
            tags: ['3d', 'cgi', 'modeling', 'render', 'blender'],
            translations: [
                { code: 'EN', name: '3D & CGI' },
                { code: 'ES', name: '3D y CGI' },
                { code: 'PT', name: '3D e CGI' }
            ],
            children: [
                { name: 'Character Modeling', tags: ['character', 'sculpt', 'topology', 'game-ready', 'rigging'], translations: [{ code: 'EN', name: 'Character Modeling' }, { code: 'ES', name: 'Modelado de Personajes' }, { code: 'PT', name: 'Modelagem de Personagens' }] },
                { name: 'Environment Art', tags: ['environment', 'scene', 'props', 'level-design', 'landscape'], translations: [{ code: 'EN', name: 'Environment Art' }, { code: 'ES', name: 'Arte de Entornos' }, { code: 'PT', name: 'Arte de Ambientes' }] },
                { name: 'Product Visualization', tags: ['product', 'visualization', 'render', 'industrial', 'commercial'], translations: [{ code: 'EN', name: 'Product Visualization' }, { code: 'ES', name: 'Visualización de Producto' }, { code: 'PT', name: 'Visualização de Produto' }] },
                { name: 'Sculpting', tags: ['sculpting', 'zbrush', 'organic', 'high-poly', 'detailing'], translations: [{ code: 'EN', name: 'Sculpting' }, { code: 'ES', name: 'Escultura Digital' }, { code: 'PT', name: 'Escultura Digital' }] },
                { name: 'Rendering & Lighting', tags: ['rendering', 'lighting', 'vray', 'octane', 'cycles'], translations: [{ code: 'EN', name: 'Rendering & Lighting' }, { code: 'ES', name: 'Renderizado e Iluminación' }, { code: 'PT', name: 'Renderização e Iluminação' }] }
            ]
        },
        {
            name: 'Fine & Traditional Art',
            tags: ['fine-art', 'traditional', 'art', 'handmade', 'analog'],
            translations: [
                { code: 'EN', name: 'Fine & Traditional Art' },
                { code: 'ES', name: 'Arte Fino y Tradicional' },
                { code: 'PT', name: 'Arte Fina e Tradicional' }
            ],
            children: [
                { name: 'Painting', tags: ['painting', 'canvas', 'oil', 'acrylic', 'brush'], translations: [{ code: 'EN', name: 'Painting' }, { code: 'ES', name: 'Pintura' }, { code: 'PT', name: 'Pintura' }] },
                { name: 'Drawing', tags: ['drawing', 'pencil', 'sketch', 'ink', 'graphite'], translations: [{ code: 'EN', name: 'Drawing' }, { code: 'ES', name: 'Dibujo' }, { code: 'PT', name: 'Desenho' }] },
                { name: 'Printmaking', tags: ['printmaking', 'linocut', 'screen-print', 'etching', 'engraving'], translations: [{ code: 'EN', name: 'Printmaking' }, { code: 'ES', name: 'Grabado' }, { code: 'PT', name: 'Gravura' }] },
                { name: 'Watercolor', tags: ['watercolor', 'aquarelle', 'wash', 'fluid', 'transparent'], translations: [{ code: 'EN', name: 'Watercolor' }, { code: 'ES', name: 'Acuarela' }, { code: 'PT', name: 'Aquarela' }] },
                { name: 'Mixed Media', tags: ['mixed-media', 'collage', 'experimental', 'layered', 'multimedia'], translations: [{ code: 'EN', name: 'Mixed Media' }, { code: 'ES', name: 'Técnica Mixta' }, { code: 'PT', name: 'Mídia Mista' }] }
            ]
        },
        {
            name: 'Fashion & Textile',
            tags: ['fashion', 'textile', 'clothing', 'apparel', 'designer'],
            translations: [
                { code: 'EN', name: 'Fashion & Textile' },
                { code: 'ES', name: 'Moda y Textil' },
                { code: 'PT', name: 'Moda e Têxtil' }
            ],
            children: [
                { name: 'Fashion Design', tags: ['fashion', 'clothing', 'garment', 'couture', 'apparel'], translations: [{ code: 'EN', name: 'Fashion Design' }, { code: 'ES', name: 'Diseño de Moda' }, { code: 'PT', name: 'Design de Moda' }] },
                { name: 'Textile & Pattern', tags: ['textile', 'pattern', 'fabric', 'surface-design', 'print'], translations: [{ code: 'EN', name: 'Textile & Pattern' }, { code: 'ES', name: 'Textil y Estampado' }, { code: 'PT', name: 'Têxtil e Estampa' }] },
                { name: 'Accessories', tags: ['accessories', 'bags', 'jewelry', 'footwear', 'luxury'], translations: [{ code: 'EN', name: 'Accessories' }, { code: 'ES', name: 'Accesorios' }, { code: 'PT', name: 'Acessórios' }] },
                { name: 'Costume Design', tags: ['costume', 'theater', 'film', 'cosplay', 'character'], translations: [{ code: 'EN', name: 'Costume Design' }, { code: 'ES', name: 'Diseño de Vestuario' }, { code: 'PT', name: 'Design de Figurino' }] }
            ]
        },
        {
            name: 'Craft & Object Design',
            tags: ['crafts', 'handmade', 'artisan', 'maker', 'handcrafted'],
            translations: [
                { code: 'EN', name: 'Craft & Object Design' },
                { code: 'ES', name: 'Artesanía y Diseño de Objetos' },
                { code: 'PT', name: 'Artesanato e Design de Objetos' }
            ],
            children: [
                { name: 'Ceramics', tags: ['ceramics', 'pottery', 'clay', 'porcelain', 'kiln'], translations: [{ code: 'EN', name: 'Ceramics' }, { code: 'ES', name: 'Cerámica' }, { code: 'PT', name: 'Cerâmica' }] },
                { name: 'Jewelry', tags: ['jewelry', 'accessories', 'handmade', 'wearable', 'artisan'], translations: [{ code: 'EN', name: 'Jewelry' }, { code: 'ES', name: 'Joyería' }, { code: 'PT', name: 'Joalheria' }] },
                { name: 'Woodworking', tags: ['woodworking', 'wood', 'furniture', 'carving', 'carpentry'], translations: [{ code: 'EN', name: 'Woodworking' }, { code: 'ES', name: 'Carpintería' }, { code: 'PT', name: 'Marcenaria' }] },
                { name: 'Glass & Resin', tags: ['glass', 'resin', 'epoxy', 'casting', 'glasswork'], translations: [{ code: 'EN', name: 'Glass & Resin' }, { code: 'ES', name: 'Vidrio y Resina' }, { code: 'PT', name: 'Vidro e Resina' }] },
                { name: 'Leatherwork', tags: ['leather', 'leathercraft', 'handmade', 'bags', 'wallets'], translations: [{ code: 'EN', name: 'Leatherwork' }, { code: 'ES', name: 'Marroquinería' }, { code: 'PT', name: 'Couro' }] }
            ]
        },
        {
            name: 'Spatial & Interior',
            tags: ['spatial', 'interior', 'environmental', 'space', 'experiential'],
            translations: [
                { code: 'EN', name: 'Spatial & Interior' },
                { code: 'ES', name: 'Espacial e Interior' },
                { code: 'PT', name: 'Espacial e Interior' }
            ],
            children: [
                { name: 'Interior Design', tags: ['interior', 'decor', 'furniture', 'residential', 'home'], translations: [{ code: 'EN', name: 'Interior Design' }, { code: 'ES', name: 'Diseño de Interiores' }, { code: 'PT', name: 'Design de Interiores' }] },
                { name: 'Exhibition & Set Design', tags: ['exhibition', 'set-design', 'stage', 'installation', 'scenography'], translations: [{ code: 'EN', name: 'Exhibition & Set Design' }, { code: 'ES', name: 'Exposiciones y Escenografía' }, { code: 'PT', name: 'Exposições e Cenografia' }] },
                { name: 'Environmental & Signage', tags: ['environmental', 'signage', 'wayfinding', 'public-space', 'navigation'], translations: [{ code: 'EN', name: 'Environmental & Signage' }, { code: 'ES', name: 'Ambiental y Señalización' }, { code: 'PT', name: 'Ambiental e Sinalização' }] }
            ]
        },
        {
            name: 'Tattoo & Body Art',
            tags: ['tattoo', 'ink', 'body-art', 'tattooing', 'tattoos'],
            translations: [
                { code: 'EN', name: 'Tattoo & Body Art' },
                { code: 'ES', name: 'Tatuaje y Arte Corporal' },
                { code: 'PT', name: 'Tatuagem e Arte Corporal' }
            ],
            children: [
                { name: 'Fine Line', tags: ['fine-line', 'minimal', 'delicate', 'single-needle', 'micro'], translations: [{ code: 'EN', name: 'Fine Line' }, { code: 'ES', name: 'Línea Fina' }, { code: 'PT', name: 'Linha Fina' }] },
                { name: 'Traditional & Neo-Traditional', tags: ['traditional', 'neo-traditional', 'old-school', 'bold', 'americana'], translations: [{ code: 'EN', name: 'Traditional & Neo-Traditional' }, { code: 'ES', name: 'Tradicional y Neo-Tradicional' }, { code: 'PT', name: 'Tradicional e Neo-Tradicional' }] },
                { name: 'Realism', tags: ['realism', 'portrait', 'photorealistic', 'black-grey', 'shading'], translations: [{ code: 'EN', name: 'Realism' }, { code: 'ES', name: 'Realismo' }, { code: 'PT', name: 'Realismo' }] },
                { name: 'Blackwork & Geometric', tags: ['blackwork', 'geometric', 'tribal', 'ornamental', 'dotwork'], translations: [{ code: 'EN', name: 'Blackwork & Geometric' }, { code: 'ES', name: 'Blackwork y Geométrico' }, { code: 'PT', name: 'Blackwork e Geométrico' }] }
            ]
        }
    ];

    // Art styles are global aesthetics shared across every discipline (a photo, a film,
    // or a logo can all be "brutalist"). They are flat, top-level, and typed ART_STYLE.
    const artStyles: SeedCategory[] = [
        // Movements & eras
        { name: 'Minimalism', tags: ['minimalism', 'minimal', 'clean', 'simple', 'negative-space'], translations: [{ code: 'EN', name: 'Minimalism' }, { code: 'ES', name: 'Minimalismo' }, { code: 'PT', name: 'Minimalismo' }] },
        { name: 'Maximalism', tags: ['maximalism', 'maximal', 'bold', 'busy', 'eclectic'], translations: [{ code: 'EN', name: 'Maximalism' }, { code: 'ES', name: 'Maximalismo' }, { code: 'PT', name: 'Maximalismo' }] },
        { name: 'Brutalism', tags: ['brutalism', 'brutalist', 'raw', 'concrete', 'bold'], translations: [{ code: 'EN', name: 'Brutalism' }, { code: 'ES', name: 'Brutalismo' }, { code: 'PT', name: 'Brutalismo' }] },
        { name: 'Art Deco', tags: ['art-deco', 'deco', 'geometric', 'luxury', '1920s'], translations: [{ code: 'EN', name: 'Art Deco' }, { code: 'ES', name: 'Art Déco' }, { code: 'PT', name: 'Art Déco' }] },
        { name: 'Art Nouveau', tags: ['art-nouveau', 'nouveau', 'organic', 'floral', 'ornate'], translations: [{ code: 'EN', name: 'Art Nouveau' }, { code: 'ES', name: 'Art Nouveau' }, { code: 'PT', name: 'Art Nouveau' }] },
        { name: 'Bauhaus', tags: ['bauhaus', 'modernist', 'geometric', 'primary-colors', 'functional'], translations: [{ code: 'EN', name: 'Bauhaus' }, { code: 'ES', name: 'Bauhaus' }, { code: 'PT', name: 'Bauhaus' }] },
        { name: 'Swiss / International', tags: ['swiss', 'international', 'grid', 'helvetica', 'typographic'], translations: [{ code: 'EN', name: 'Swiss / International' }, { code: 'ES', name: 'Estilo Suizo' }, { code: 'PT', name: 'Estilo Suíço' }] },
        { name: 'Memphis', tags: ['memphis', 'postmodern', '80s', 'playful', 'geometric'], translations: [{ code: 'EN', name: 'Memphis' }, { code: 'ES', name: 'Memphis' }, { code: 'PT', name: 'Memphis' }] },
        { name: 'Pop Art', tags: ['pop-art', 'pop', 'bold', 'comic', 'warhol'], translations: [{ code: 'EN', name: 'Pop Art' }, { code: 'ES', name: 'Pop Art' }, { code: 'PT', name: 'Pop Art' }] },
        { name: 'Surrealism', tags: ['surrealism', 'surreal', 'dreamlike', 'oneiric', 'strange'], translations: [{ code: 'EN', name: 'Surrealism' }, { code: 'ES', name: 'Surrealismo' }, { code: 'PT', name: 'Surrealismo' }] },
        { name: 'Abstract', tags: ['abstract', 'non-representational', 'shapes', 'forms', 'expressive'], translations: [{ code: 'EN', name: 'Abstract' }, { code: 'ES', name: 'Abstracto' }, { code: 'PT', name: 'Abstrato' }] },
        { name: 'Psychedelic', tags: ['psychedelic', 'trippy', 'colorful', '60s', 'swirls'], translations: [{ code: 'EN', name: 'Psychedelic' }, { code: 'ES', name: 'Psicodélico' }, { code: 'PT', name: 'Psicodélico' }] },
        { name: 'Baroque', tags: ['baroque', 'ornate', 'dramatic', 'ornamental', 'classical'], translations: [{ code: 'EN', name: 'Baroque' }, { code: 'ES', name: 'Barroco' }, { code: 'PT', name: 'Barroco' }] },
        { name: 'Gothic', tags: ['gothic', 'dark', 'medieval', 'dramatic', 'ornate'], translations: [{ code: 'EN', name: 'Gothic' }, { code: 'ES', name: 'Gótico' }, { code: 'PT', name: 'Gótico' }] },
        // Mood & retro
        { name: 'Vintage & Retro', tags: ['vintage', 'retro', 'nostalgic', 'aged', 'classic'], translations: [{ code: 'EN', name: 'Vintage & Retro' }, { code: 'ES', name: 'Vintage y Retro' }, { code: 'PT', name: 'Vintage e Retrô' }] },
        { name: 'Noir', tags: ['noir', 'film-noir', 'moody', 'high-contrast', 'shadows'], translations: [{ code: 'EN', name: 'Noir' }, { code: 'ES', name: 'Noir' }, { code: 'PT', name: 'Noir' }] },
        { name: 'Grunge', tags: ['grunge', 'gritty', 'distressed', 'textured', 'raw'], translations: [{ code: 'EN', name: 'Grunge' }, { code: 'ES', name: 'Grunge' }, { code: 'PT', name: 'Grunge' }] },
        { name: 'Dark Academia', tags: ['dark-academia', 'academic', 'moody', 'vintage', 'literary'], translations: [{ code: 'EN', name: 'Dark Academia' }, { code: 'ES', name: 'Dark Academia' }, { code: 'PT', name: 'Dark Academia' }] },
        { name: 'Cottagecore', tags: ['cottagecore', 'cozy', 'rural', 'pastoral', 'whimsical'], translations: [{ code: 'EN', name: 'Cottagecore' }, { code: 'ES', name: 'Cottagecore' }, { code: 'PT', name: 'Cottagecore' }] },
        { name: 'Y2K', tags: ['y2k', '2000s', 'chrome', 'futuristic', 'retro'], translations: [{ code: 'EN', name: 'Y2K' }, { code: 'ES', name: 'Y2K' }, { code: 'PT', name: 'Y2K' }] },
        // Digital & rendering
        { name: 'Flat Design', tags: ['flat', 'flat-design', 'minimal', 'vector', 'simple'], translations: [{ code: 'EN', name: 'Flat Design' }, { code: 'ES', name: 'Diseño Plano' }, { code: 'PT', name: 'Design Plano' }] },
        { name: 'Glassmorphism', tags: ['glassmorphism', 'glass', 'frosted', 'blur', 'translucent'], translations: [{ code: 'EN', name: 'Glassmorphism' }, { code: 'ES', name: 'Glassmorphism' }, { code: 'PT', name: 'Glassmorphism' }] },
        { name: 'Isometric', tags: ['isometric', '3d', 'geometric', 'perspective', 'technical'], translations: [{ code: 'EN', name: 'Isometric' }, { code: 'ES', name: 'Isométrico' }, { code: 'PT', name: 'Isométrico' }] },
        { name: 'Low Poly', tags: ['low-poly', 'polygonal', '3d', 'faceted', 'geometric'], translations: [{ code: 'EN', name: 'Low Poly' }, { code: 'ES', name: 'Low Poly' }, { code: 'PT', name: 'Low Poly' }] },
        { name: 'Pixel Art', tags: ['pixel-art', 'pixel', '8bit', 'retro', 'sprite'], translations: [{ code: 'EN', name: 'Pixel Art' }, { code: 'ES', name: 'Pixel Art' }, { code: 'PT', name: 'Pixel Art' }] },
        { name: 'Monochrome', tags: ['monochrome', 'monochromatic', 'single-color', 'tonal', 'grayscale'], translations: [{ code: 'EN', name: 'Monochrome' }, { code: 'ES', name: 'Monocromático' }, { code: 'PT', name: 'Monocromático' }] },
        { name: 'Duotone', tags: ['duotone', 'two-tone', 'bicolor', 'gradient', 'bold'], translations: [{ code: 'EN', name: 'Duotone' }, { code: 'ES', name: 'Duotono' }, { code: 'PT', name: 'Duotone' }] },
        { name: 'Holographic', tags: ['holographic', 'iridescent', 'chrome', 'metallic', 'shimmer'], translations: [{ code: 'EN', name: 'Holographic' }, { code: 'ES', name: 'Holográfico' }, { code: 'PT', name: 'Holográfico' }] },
        // Retro-futurism
        { name: 'Vaporwave', tags: ['vaporwave', 'aesthetic', '80s', 'neon', 'retro'], translations: [{ code: 'EN', name: 'Vaporwave' }, { code: 'ES', name: 'Vaporwave' }, { code: 'PT', name: 'Vaporwave' }] },
        { name: 'Synthwave', tags: ['synthwave', 'outrun', 'retrowave', 'neon', '80s'], translations: [{ code: 'EN', name: 'Synthwave' }, { code: 'ES', name: 'Synthwave' }, { code: 'PT', name: 'Synthwave' }] },
        { name: 'Cyberpunk', tags: ['cyberpunk', 'neon', 'futuristic', 'dystopian', 'tech'], translations: [{ code: 'EN', name: 'Cyberpunk' }, { code: 'ES', name: 'Cyberpunk' }, { code: 'PT', name: 'Cyberpunk' }] },
        { name: 'Steampunk', tags: ['steampunk', 'victorian', 'brass', 'gears', 'retro-futuristic'], translations: [{ code: 'EN', name: 'Steampunk' }, { code: 'ES', name: 'Steampunk' }, { code: 'PT', name: 'Steampunk' }] },
        { name: 'Solarpunk', tags: ['solarpunk', 'eco', 'green', 'utopian', 'sustainable'], translations: [{ code: 'EN', name: 'Solarpunk' }, { code: 'ES', name: 'Solarpunk' }, { code: 'PT', name: 'Solarpunk' }] },
        // Craft & print
        { name: 'Hand-drawn', tags: ['hand-drawn', 'sketch', 'doodle', 'organic', 'illustrated'], translations: [{ code: 'EN', name: 'Hand-drawn' }, { code: 'ES', name: 'Dibujado a Mano' }, { code: 'PT', name: 'Desenhado à Mão' }] },
        { name: 'Collage', tags: ['collage', 'cut-paper', 'mixed-media', 'layered', 'montage'], translations: [{ code: 'EN', name: 'Collage' }, { code: 'ES', name: 'Collage' }, { code: 'PT', name: 'Colagem' }] },
        { name: 'Risograph', tags: ['risograph', 'riso', 'print', 'grain', 'spot-color'], translations: [{ code: 'EN', name: 'Risograph' }, { code: 'ES', name: 'Risografía' }, { code: 'PT', name: 'Risografia' }] },
        { name: 'Woodcut & Linocut', tags: ['woodcut', 'linocut', 'printmaking', 'block-print', 'carved'], translations: [{ code: 'EN', name: 'Woodcut & Linocut' }, { code: 'ES', name: 'Xilografía y Linograbado' }, { code: 'PT', name: 'Xilogravura e Linogravura' }] },
        { name: 'Ukiyo-e', tags: ['ukiyo-e', 'japanese', 'woodblock', 'traditional', 'edo'], translations: [{ code: 'EN', name: 'Ukiyo-e' }, { code: 'ES', name: 'Ukiyo-e' }, { code: 'PT', name: 'Ukiyo-e' }] },
        { name: 'Folk Art', tags: ['folk-art', 'folk', 'traditional', 'naive', 'craft'], translations: [{ code: 'EN', name: 'Folk Art' }, { code: 'ES', name: 'Arte Folclórico' }, { code: 'PT', name: 'Arte Folclórica' }] },
    ];

    const s3Ok = isS3Configured();
    const compressService = s3Ok
      ? FactoryCompressService.create({ driver: 'sharp' })
      : null;
    const storageService = s3Ok
      ? FactoryStorageService.create(buildS3Config())
      : null;

    const createCategories = async (
        category: SeedCategory,
        parentId?: number,
        isActive = false,
        inheritedType: EnumType<'CATEGORY_TYPE'> = 'DISCIPLINE',
    ) => {
        const categoryType = category.type ?? inheritedType;
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

        const columns = ['name', 'slug', 'tags', 'thumbnail', 'is_featured', 'is_active', 'type'];
        const values: unknown[] = [
          category.name,
          slug,
          category.tags.join(','),
          thumbnail,
          isFeatured,
          isActive,
          categoryType,
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
            await Promise.all(category.children.map(child => createCategories(child, parentCategory.id, isActive, categoryType)))
        }
    }

    // Truncate tables in correct order, handling foreign keys
    await Schema.table('category_translations').truncate();
    await Query.raw('TRUNCATE TABLE categories RESTART IDENTITY CASCADE');

    // Insert categories sequentially to avoid any potential issues with parallel inserts.
    // All disciplines are seeded active so the whole curated set is discoverable in the
    // funnel/portfolio pickers (previously only the Photography subtree was active).
    for (const category of categories) {
        await createCategories(category, undefined, true);
    }

    // Art styles: global, active, and typed ART_STYLE so they surface in the style pickers.
    for (const style of artStyles) {
        await createCategories(style, undefined, true, 'ART_STYLE');
    }
};
