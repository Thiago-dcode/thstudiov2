import fs from 'node:fs';
import path from 'node:path';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import type { S3StorageConfig } from '@repo/backend-lib/services/storage-service/types';
import Logger from '@repo/backend-lib/utils/console';
import { EnumType } from "@repo/common-lib/constants/enums";
import { getConfigValue } from '@repo/common-lib/config/utils';
import { generateValidSlug } from "@repo/common-lib/utils/generate-valid-slug";
import { CategorySchema } from "@repo/common-lib/schemas/category";
import { Query } from "../lib/facades";

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
  'craft-object-design': 'handmade',
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

/** Reserves an already-persisted slug so later categories in the same run don't collide with it. */
function reserveExistingCategorySlug(slug: string): string {
    usedCategorySlugs.add(slug);
    return slug;
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
            tags: [
                'photo', 'photos', 'photography', 'camera', 'photographer', 'photoshoot',
                'fotografia', 'fotógrafo', 'fotografa', 'camara', 'sesión',
            ],
            translations: [
                { code: 'EN', name: 'Photography' },
                { code: 'ES', name: 'Fotografía' },
                { code: 'PT', name: 'Fotografia' },
            ],
            children: [
                {
                    name: 'Portrait Photography',
                    tags: [
                        'portrait', 'headshot', 'people', 'studio', 'professional', 'retrato',
                        'fotografia de retrato', 'retrato profesional', 'headshots',
                    ],
                    translations: [
                        { code: 'EN', name: 'Portrait Photography' },
                        { code: 'ES', name: 'Fotografía de Retrato' },
                        { code: 'PT', name: 'Fotografia de Retrato' },
                    ],
                },
                {
                    name: 'Wedding & Event Photography',
                    tags: [
                        'wedding', 'event', 'ceremony', 'celebration', 'party', 'boda', 'bodas',
                        'eventos', 'fotografia de bodas', 'casamento', 'casamentos', 'fotógrafo de bodas',
                    ],
                    translations: [
                        { code: 'EN', name: 'Wedding & Event Photography' },
                        { code: 'ES', name: 'Fotografía de Bodas y Eventos' },
                        { code: 'PT', name: 'Fotografia de Casamentos e Eventos' },
                    ],
                },
                {
                    name: 'Fashion & Editorial Photography',
                    tags: [
                        'fashion', 'editorial', 'model', 'runway', 'lookbook', 'moda',
                        'fotografia de moda', 'editorial de moda', 'pasarela', 'modelo',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fashion & Editorial Photography' },
                        { code: 'ES', name: 'Fotografía de Moda y Editorial' },
                        { code: 'PT', name: 'Fotografia de Moda e Editorial' },
                    ],
                },
                {
                    name: 'Product & Commercial Photography',
                    tags: [
                        'product', 'commercial', 'ecommerce', 'studio', 'advertising', 'producto',
                        'fotografia de producto', 'fotografia comercial', 'catálogo', 'publicitaria',
                    ],
                    translations: [
                        { code: 'EN', name: 'Product & Commercial Photography' },
                        { code: 'ES', name: 'Fotografía de Producto y Comercial' },
                        { code: 'PT', name: 'Fotografia de Produto e Comercial' },
                    ],
                },
                {
                    name: 'Architecture & Real Estate Photography',
                    tags: [
                        'architecture', 'real-estate', 'interior', 'building', 'property',
                        'arquitectura', 'inmobiliaria', 'inmuebles', 'fotografia arquitectonica',
                        'fotografia inmobiliaria', 'imóveis',
                    ],
                    translations: [
                        { code: 'EN', name: 'Architecture & Real Estate Photography' },
                        { code: 'ES', name: 'Fotografía de Arquitectura e Inmobiliaria' },
                        { code: 'PT', name: 'Fotografia de Arquitetura e Imóveis' },
                    ],
                },
                {
                    name: 'Landscape & Nature Photography',
                    tags: [
                        'landscape', 'nature', 'wildlife', 'travel', 'outdoor', 'paisaje',
                        'naturaleza', 'fotografia de paisaje', 'naturaleza salvaje', 'paisagem',
                    ],
                    translations: [
                        { code: 'EN', name: 'Landscape & Nature Photography' },
                        { code: 'ES', name: 'Fotografía de Paisaje y Naturaleza' },
                        { code: 'PT', name: 'Fotografia de Paisagem e Natureza' },
                    ],
                },
                {
                    name: 'Aerial & Drone Photography',
                    tags: [
                        'aerial', 'drone', 'uav', 'birds-eye', 'overhead', 'aerea', 'aérea',
                        'dron', 'fotografia aerea', 'fotografia aérea', 'fotografia con dron',
                        'vista aerea', 'drone photography',
                    ],
                    translations: [
                        { code: 'EN', name: 'Aerial & Drone Photography' },
                        { code: 'ES', name: 'Fotografía Aérea y Dron' },
                        { code: 'PT', name: 'Fotografia Aérea e Drone' },
                    ],
                },
                {
                    name: 'Documentary & Street Photography',
                    tags: [
                        'documentary', 'street', 'photojournalism', 'candid', 'urban',
                        'documental', 'callejera', 'fotografia callejera', 'fotoperiodismo',
                        'street photography', 'rua',
                    ],
                    translations: [
                        { code: 'EN', name: 'Documentary & Street Photography' },
                        { code: 'ES', name: 'Fotografía Documental y Callejera' },
                        { code: 'PT', name: 'Fotografia Documental e de Rua' },
                    ],
                },
            ],
        },
        {
            name: 'Film & Video',
            tags: [
                'film', 'video', 'filmmaker', 'cinema', 'footage', 'cine', 'videografo',
                'producción audiovisual', 'audiovisual',
            ],
            translations: [
                { code: 'EN', name: 'Film & Video' },
                { code: 'ES', name: 'Cine y Video' },
                { code: 'PT', name: 'Cinema e Vídeo' },
            ],
            children: [
                {
                    name: 'Film Cinematography',
                    tags: [
                        'cinematography', 'camera', 'dop', 'lighting', 'camera-work',
                        'cinematografia', 'dirección de fotografia', 'camara', 'iluminacion',
                    ],
                    translations: [
                        { code: 'EN', name: 'Film Cinematography' },
                        { code: 'ES', name: 'Cinematografía de Cine y Video' },
                        { code: 'PT', name: 'Cinematografia de Cinema e Vídeo' },
                    ],
                },
                {
                    name: 'Video Editing',
                    tags: [
                        'editing', 'editor', 'post-production', 'premiere', 'davinci',
                        'edicion', 'edición de video', 'montaje', 'postproduccion', 'edição',
                    ],
                    translations: [
                        { code: 'EN', name: 'Video Editing' },
                        { code: 'ES', name: 'Edición de Video' },
                        { code: 'PT', name: 'Edição de Vídeo' },
                    ],
                },
                {
                    name: 'Video Color Grading',
                    tags: [
                        'color', 'grading', 'colorist', 'davinci', 'lut', 'corrección de color',
                        'correccion de color', 'color grading', 'etalonaje', 'correção de cor',
                    ],
                    translations: [
                        { code: 'EN', name: 'Video Color Grading' },
                        { code: 'ES', name: 'Corrección de Color para Video' },
                        { code: 'PT', name: 'Correção de Cor para Vídeo' },
                    ],
                },
                {
                    name: 'Music Video Production',
                    tags: [
                        'music-video', 'band', 'performance', 'artist', 'song', 'videoclip',
                        'video musical', 'videos musicales', 'clip musical',
                    ],
                    translations: [
                        { code: 'EN', name: 'Music Video Production' },
                        { code: 'ES', name: 'Producción de Videos Musicales' },
                        { code: 'PT', name: 'Produção de Videoclipes' },
                    ],
                },
                {
                    name: 'Commercial & Promo Videos',
                    tags: [
                        'commercial', 'promo', 'advertising', 'brand', 'marketing',
                        'comercial', 'spot', 'video publicitario', 'promocional', 'anuncio',
                    ],
                    translations: [
                        { code: 'EN', name: 'Commercial & Promo Videos' },
                        { code: 'ES', name: 'Videos Comerciales y Promocionales' },
                        { code: 'PT', name: 'Vídeos Comerciais e Promocionais' },
                    ],
                },
                {
                    name: 'Documentary Filmmaking',
                    tags: [
                        'documentary', 'non-fiction', 'film', 'storytelling', 'reportage',
                        'documental', 'cine documental', 'reportaje', 'documentário',
                    ],
                    translations: [
                        { code: 'EN', name: 'Documentary Filmmaking' },
                        { code: 'ES', name: 'Cine Documental' },
                        { code: 'PT', name: 'Cinema Documentário' },
                    ],
                },
            ],
        },
        {
            name: 'Motion & Animation',
            tags: [
                'animation', 'motion', 'animator', 'animated', 'movement', 'animación',
                'animacion', 'motion graphics', 'animação',
            ],
            translations: [
                { code: 'EN', name: 'Motion & Animation' },
                { code: 'ES', name: 'Motion y Animación' },
                { code: 'PT', name: 'Motion e Animação' },
            ],
            children: [
                {
                    name: '2D Animation',
                    tags: [
                        '2d', 'frame-by-frame', 'hand-drawn', 'cartoon', 'traditional',
                        'animación 2d', 'animacion 2d', 'dibujo animado', 'animação 2d',
                    ],
                    translations: [
                        { code: 'EN', name: '2D Animation' },
                        { code: 'ES', name: 'Animación 2D' },
                        { code: 'PT', name: 'Animação 2D' },
                    ],
                },
                {
                    name: '3D Animation',
                    tags: [
                        '3d', 'cgi', 'rigged', 'computer-animation', 'pixar',
                        'animación 3d', 'animacion 3d', 'animación por computadora', 'animação 3d',
                    ],
                    translations: [
                        { code: 'EN', name: '3D Animation' },
                        { code: 'ES', name: 'Animación 3D' },
                        { code: 'PT', name: 'Animação 3D' },
                    ],
                },
                {
                    name: 'Motion Graphics Design',
                    tags: [
                        'motion', 'after-effects', 'kinetic', 'typography', 'dynamic',
                        'gráficos en movimiento', 'motion graphics', 'graficos en movimiento',
                    ],
                    translations: [
                        { code: 'EN', name: 'Motion Graphics Design' },
                        { code: 'ES', name: 'Diseño de Motion Graphics' },
                        { code: 'PT', name: 'Design de Motion Graphics' },
                    ],
                },
                {
                    name: 'Character Animation',
                    tags: [
                        'character', 'rigging', 'walk-cycle', 'acting', 'performance',
                        'animación de personajes', 'animacion de personajes', 'personaje',
                    ],
                    translations: [
                        { code: 'EN', name: 'Character Animation' },
                        { code: 'ES', name: 'Animación de Personajes' },
                        { code: 'PT', name: 'Animação de Personagens' },
                    ],
                },
                {
                    name: 'Logo Animation',
                    tags: [
                        'logo', 'brand', 'intro', 'reveal', 'branding',
                        'animación de logo', 'animacion de logo', 'logo animado', 'intro logo',
                    ],
                    translations: [
                        { code: 'EN', name: 'Logo Animation' },
                        { code: 'ES', name: 'Animación de Logo' },
                        { code: 'PT', name: 'Animação de Logo' },
                    ],
                },
                {
                    name: 'Visual Effects (VFX)',
                    tags: [
                        'vfx', 'compositing', 'effects', 'cgi', 'special-effects',
                        'efectos visuales', 'efectos especiales', 'compositing', 'fx',
                    ],
                    translations: [
                        { code: 'EN', name: 'Visual Effects (VFX)' },
                        { code: 'ES', name: 'Efectos Visuales (VFX)' },
                        { code: 'PT', name: 'Efeitos Visuais (VFX)' },
                    ],
                },
            ],
        },
        {
            name: 'Illustration',
            tags: [
                'illustration', 'illustrator', 'drawing', 'art', 'sketch',
                'ilustración', 'ilustracion', 'ilustrador', 'dibujo', 'ilustração',
            ],
            translations: [
                { code: 'EN', name: 'Illustration' },
                { code: 'ES', name: 'Ilustración' },
                { code: 'PT', name: 'Ilustração' },
            ],
            children: [
                {
                    name: 'Editorial Illustration',
                    tags: [
                        'editorial', 'magazine', 'article', 'publication', 'newspaper',
                        'ilustración editorial', 'ilustracion editorial', 'revista',
                    ],
                    translations: [
                        { code: 'EN', name: 'Editorial Illustration' },
                        { code: 'ES', name: 'Ilustración Editorial' },
                        { code: 'PT', name: 'Ilustração Editorial' },
                    ],
                },
                {
                    name: 'Character Design Illustration',
                    tags: [
                        'character', 'mascot', 'avatar', 'game-character', 'nft',
                        'diseño de personajes', 'personaje', 'mascota', 'character design',
                    ],
                    translations: [
                        { code: 'EN', name: 'Character Design Illustration' },
                        { code: 'ES', name: 'Ilustración y Diseño de Personajes' },
                        { code: 'PT', name: 'Ilustração e Design de Personagens' },
                    ],
                },
                {
                    name: 'Concept Art Illustration',
                    tags: [
                        'concept', 'game', 'film', 'visdev', 'entertainment',
                        'arte conceptual', 'concept art', 'diseño conceptual',
                    ],
                    translations: [
                        { code: 'EN', name: 'Concept Art Illustration' },
                        { code: 'ES', name: 'Ilustración de Arte Conceptual' },
                        { code: 'PT', name: 'Ilustração de Arte Conceitual' },
                    ],
                },
                {
                    name: 'Comic & Manga Illustration',
                    tags: [
                        'comic', 'manga', 'graphic-novel', 'cartoon', 'anime',
                        'cómic', 'comic', 'historieta', 'quadrinhos', 'mangá',
                    ],
                    translations: [
                        { code: 'EN', name: 'Comic & Manga Illustration' },
                        { code: 'ES', name: 'Ilustración de Cómic y Manga' },
                        { code: 'PT', name: 'Ilustração de Quadrinhos e Mangá' },
                    ],
                },
                {
                    name: "Children's Book Illustration",
                    tags: [
                        'children', 'kids', 'storybook', 'youth', 'picture-book',
                        'infantil', 'libros infantiles', 'cuento', 'ilustración infantil',
                    ],
                    translations: [
                        { code: 'EN', name: "Children's Book Illustration" },
                        { code: 'ES', name: 'Ilustración de Libros Infantiles' },
                        { code: 'PT', name: 'Ilustração de Livros Infantis' },
                    ],
                },
                {
                    name: 'Fantasy & Sci-Fi Illustration',
                    tags: [
                        'fantasy', 'sci-fi', 'creatures', 'imaginative', 'magic',
                        'fantasía', 'fantasia', 'ciencia ficción', 'ficção científica',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fantasy & Sci-Fi Illustration' },
                        { code: 'ES', name: 'Ilustración de Fantasía y Ciencia Ficción' },
                        { code: 'PT', name: 'Ilustração de Fantasia e Ficção Científica' },
                    ],
                },
            ],
        },
        {
            name: 'Graphic Design',
            tags: [
                'graphic', 'design', 'visual', 'designer', 'layout',
                'diseño gráfico', 'diseño grafico', 'diseñador', 'design gráfico',
            ],
            translations: [
                { code: 'EN', name: 'Graphic Design' },
                { code: 'ES', name: 'Diseño Gráfico' },
                { code: 'PT', name: 'Design Gráfico' },
            ],
            children: [
                {
                    name: 'Brand Identity Design',
                    tags: [
                        'branding', 'identity', 'brand-book', 'style-guide', 'corporate',
                        'identidad de marca', 'marca', 'identidad visual', 'branding',
                    ],
                    translations: [
                        { code: 'EN', name: 'Brand Identity Design' },
                        { code: 'ES', name: 'Diseño de Identidad de Marca' },
                        { code: 'PT', name: 'Design de Identidade de Marca' },
                    ],
                },
                {
                    name: 'Logo Design',
                    tags: [
                        'logo', 'brand', 'emblem', 'mark', 'symbol',
                        'diseño de logotipo', 'logotipo', 'logo design', 'isotipo',
                    ],
                    translations: [
                        { code: 'EN', name: 'Logo Design' },
                        { code: 'ES', name: 'Diseño de Logotipo' },
                        { code: 'PT', name: 'Design de Logotipo' },
                    ],
                },
                {
                    name: 'Print & Editorial Design',
                    tags: [
                        'print', 'editorial', 'magazine', 'layout', 'publication',
                        'diseño editorial', 'impresión', 'maquetación', 'revista',
                    ],
                    translations: [
                        { code: 'EN', name: 'Print & Editorial Design' },
                        { code: 'ES', name: 'Diseño de Impresión y Editorial' },
                        { code: 'PT', name: 'Design de Impressão e Editorial' },
                    ],
                },
                {
                    name: 'Packaging Design',
                    tags: [
                        'packaging', 'box', 'label', 'product', 'container',
                        'empaque', 'envase', 'embalaje', 'diseño de empaque', 'embalagem',
                    ],
                    translations: [
                        { code: 'EN', name: 'Packaging Design' },
                        { code: 'ES', name: 'Diseño de Empaque' },
                        { code: 'PT', name: 'Design de Embalagem' },
                    ],
                },
                {
                    name: 'Poster & Advertising Design',
                    tags: [
                        'poster', 'advertising', 'campaign', 'promotional', 'ads',
                        'póster', 'poster', 'publicidad', 'cartel', 'afiche', 'campaña',
                    ],
                    translations: [
                        { code: 'EN', name: 'Poster & Advertising Design' },
                        { code: 'ES', name: 'Diseño de Póster y Publicidad' },
                        { code: 'PT', name: 'Design de Pôster e Publicidade' },
                    ],
                },
                {
                    name: 'Typography & Lettering Design',
                    tags: [
                        'typography', 'lettering', 'type', 'font', 'calligraphy',
                        'tipografía', 'tipografia', 'lettering', 'caligrafía', 'fuentes',
                    ],
                    translations: [
                        { code: 'EN', name: 'Typography & Lettering Design' },
                        { code: 'ES', name: 'Diseño de Tipografía y Lettering' },
                        { code: 'PT', name: 'Design de Tipografia e Lettering' },
                    ],
                },
            ],
        },
        {
            name: 'Product & Web Design',
            tags: [
                'product-design', 'web', 'ui', 'ux', 'digital',
                'diseño de producto', 'diseño web', 'interfaz', 'experiencia de usuario',
            ],
            translations: [
                { code: 'EN', name: 'Product & Web Design' },
                { code: 'ES', name: 'Diseño de Producto y Web' },
                { code: 'PT', name: 'Design de Produto e Web' },
            ],
            children: [
                {
                    name: 'UI Design',
                    tags: [
                        'ui', 'interface', 'frontend', 'screen', 'visual',
                        'diseño de interfaz', 'interfaz de usuario', 'ui design',
                    ],
                    translations: [
                        { code: 'EN', name: 'UI Design' },
                        { code: 'ES', name: 'Diseño de Interfaz (UI)' },
                        { code: 'PT', name: 'Design de Interface (UI)' },
                    ],
                },
                {
                    name: 'UX Design',
                    tags: [
                        'ux', 'usability', 'wireframe', 'research', 'user-experience',
                        'diseño ux', 'experiencia de usuario', 'usabilidad', 'wireframes',
                    ],
                    translations: [
                        { code: 'EN', name: 'UX Design' },
                        { code: 'ES', name: 'Diseño de Experiencia (UX)' },
                        { code: 'PT', name: 'Design de Experiência (UX)' },
                    ],
                },
                {
                    name: 'Web Design',
                    tags: [
                        'web', 'website', 'responsive', 'landing', 'homepage',
                        'diseño web', 'sitio web', 'página web', 'landing page',
                    ],
                    translations: [
                        { code: 'EN', name: 'Web Design' },
                        { code: 'ES', name: 'Diseño Web' },
                        { code: 'PT', name: 'Design Web' },
                    ],
                },
                {
                    name: 'Mobile App Design',
                    tags: [
                        'mobile', 'app', 'ios', 'android', 'application',
                        'diseño de app', 'aplicación móvil', 'app móvil', 'app movil',
                    ],
                    translations: [
                        { code: 'EN', name: 'Mobile App Design' },
                        { code: 'ES', name: 'Diseño de App Móvil' },
                        { code: 'PT', name: 'Design de App Móvel' },
                    ],
                },
                {
                    name: 'Design Systems',
                    tags: [
                        'design-system', 'components', 'tokens', 'library', 'ui-kit',
                        'sistemas de diseño', 'sistema de diseño', 'componentes', 'ui kit',
                    ],
                    translations: [
                        { code: 'EN', name: 'Design Systems' },
                        { code: 'ES', name: 'Sistemas de Diseño' },
                        { code: 'PT', name: 'Sistemas de Design' },
                    ],
                },
            ],
        },
        {
            name: '3D & CGI',
            tags: [
                '3d', 'cgi', 'modeling', 'render', 'blender',
                'modelado 3d', 'modelagem 3d', 'tres dimensiones', 'cgi 3d',
            ],
            translations: [
                { code: 'EN', name: '3D & CGI' },
                { code: 'ES', name: '3D y CGI' },
                { code: 'PT', name: '3D e CGI' },
            ],
            children: [
                {
                    name: '3D Character Modeling',
                    tags: [
                        'character', 'sculpt', 'topology', 'game-ready', 'rigging',
                        'modelado de personajes', 'personaje 3d', 'modelagem de personagens',
                    ],
                    translations: [
                        { code: 'EN', name: '3D Character Modeling' },
                        { code: 'ES', name: 'Modelado 3D de Personajes' },
                        { code: 'PT', name: 'Modelagem 3D de Personagens' },
                    ],
                },
                {
                    name: '3D Environment Art',
                    tags: [
                        'environment', 'scene', 'props', 'level-design', 'landscape',
                        'entornos 3d', 'escenarios', 'ambientes 3d', 'environment art',
                    ],
                    translations: [
                        { code: 'EN', name: '3D Environment Art' },
                        { code: 'ES', name: 'Arte 3D de Entornos' },
                        { code: 'PT', name: 'Arte 3D de Ambientes' },
                    ],
                },
                {
                    name: '3D Product Visualization',
                    tags: [
                        'product', 'visualization', 'render', 'industrial', 'commercial',
                        'visualización de producto', 'product viz', 'render de producto',
                    ],
                    translations: [
                        { code: 'EN', name: '3D Product Visualization' },
                        { code: 'ES', name: 'Visualización 3D de Producto' },
                        { code: 'PT', name: 'Visualização 3D de Produto' },
                    ],
                },
                {
                    name: '3D Digital Sculpting',
                    tags: [
                        'sculpting', 'zbrush', 'organic', 'high-poly', 'detailing',
                        'escultura digital', 'escultura 3d', 'zbrush', 'sculpt',
                    ],
                    translations: [
                        { code: 'EN', name: '3D Digital Sculpting' },
                        { code: 'ES', name: 'Escultura Digital 3D' },
                        { code: 'PT', name: 'Escultura Digital 3D' },
                    ],
                },
                {
                    name: '3D Rendering & Lighting',
                    tags: [
                        'rendering', 'lighting', 'vray', 'octane', 'cycles',
                        'renderizado', 'iluminación', 'iluminacion', 'render 3d',
                    ],
                    translations: [
                        { code: 'EN', name: '3D Rendering & Lighting' },
                        { code: 'ES', name: 'Renderizado e Iluminación 3D' },
                        { code: 'PT', name: 'Renderização e Iluminação 3D' },
                    ],
                },
            ],
        },
        {
            name: 'Fine & Traditional Art',
            tags: [
                'fine-art', 'traditional', 'art', 'handmade', 'analog',
                'arte fino', 'arte tradicional', 'bellas artes', 'artes plásticas',
            ],
            translations: [
                { code: 'EN', name: 'Fine & Traditional Art' },
                { code: 'ES', name: 'Arte Fino y Tradicional' },
                { code: 'PT', name: 'Arte Fina e Tradicional' },
            ],
            children: [
                {
                    name: 'Fine Art Painting',
                    tags: [
                        'painting', 'canvas', 'oil', 'acrylic', 'brush',
                        'pintura', 'óleo', 'oleo', 'acrílico', 'lienzo',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fine Art Painting' },
                        { code: 'ES', name: 'Pintura Artística' },
                        { code: 'PT', name: 'Pintura Artística' },
                    ],
                },
                {
                    name: 'Fine Art Drawing',
                    tags: [
                        'drawing', 'pencil', 'sketch', 'ink', 'graphite',
                        'dibujo', 'lápiz', 'lapiz', 'boceto', 'tinta', 'desenho',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fine Art Drawing' },
                        { code: 'ES', name: 'Dibujo Artístico' },
                        { code: 'PT', name: 'Desenho Artístico' },
                    ],
                },
                {
                    name: 'Fine Art Printmaking',
                    tags: [
                        'printmaking', 'linocut', 'screen-print', 'etching', 'engraving',
                        'grabado', 'serigrafía', 'serigrafia', 'xilografía', 'gravura',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fine Art Printmaking' },
                        { code: 'ES', name: 'Grabado Artístico' },
                        { code: 'PT', name: 'Gravura Artística' },
                    ],
                },
                {
                    name: 'Watercolor Painting',
                    tags: [
                        'watercolor', 'aquarelle', 'wash', 'fluid', 'transparent',
                        'acuarela', 'aquarela', 'pintura en acuarela',
                    ],
                    translations: [
                        { code: 'EN', name: 'Watercolor Painting' },
                        { code: 'ES', name: 'Pintura en Acuarela' },
                        { code: 'PT', name: 'Pintura em Aquarela' },
                    ],
                },
                {
                    name: 'Mixed Media Art',
                    tags: [
                        'mixed-media', 'collage', 'experimental', 'layered', 'multimedia',
                        'técnica mixta', 'tecnica mixta', 'collage', 'mídia mista',
                    ],
                    translations: [
                        { code: 'EN', name: 'Mixed Media Art' },
                        { code: 'ES', name: 'Arte en Técnica Mixta' },
                        { code: 'PT', name: 'Arte em Mídia Mista' },
                    ],
                },
            ],
        },
        {
            name: 'Fashion & Textile',
            tags: [
                'fashion', 'textile', 'clothing', 'apparel', 'designer',
                'moda', 'textil', 'diseño de moda', 'vestuario', 'têxtil',
            ],
            translations: [
                { code: 'EN', name: 'Fashion & Textile' },
                { code: 'ES', name: 'Moda y Textil' },
                { code: 'PT', name: 'Moda e Têxtil' },
            ],
            children: [
                {
                    name: 'Fashion Design',
                    tags: [
                        'fashion', 'clothing', 'garment', 'couture', 'apparel',
                        'diseño de moda', 'alta costura', 'ropa', 'indumentaria',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fashion Design' },
                        { code: 'ES', name: 'Diseño de Moda' },
                        { code: 'PT', name: 'Design de Moda' },
                    ],
                },
                {
                    name: 'Textile & Pattern Design',
                    tags: [
                        'textile', 'pattern', 'fabric', 'surface-design', 'print',
                        'estampado', 'textil', 'tela', 'diseño textil', 'estampa',
                    ],
                    translations: [
                        { code: 'EN', name: 'Textile & Pattern Design' },
                        { code: 'ES', name: 'Diseño Textil y de Estampado' },
                        { code: 'PT', name: 'Design Têxtil e de Estampa' },
                    ],
                },
                {
                    name: 'Fashion Accessories Design',
                    tags: [
                        'accessories', 'bags', 'jewelry', 'footwear', 'luxury',
                        'accesorios', 'bolsos', 'calzado', 'complementos', 'acessórios',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fashion Accessories Design' },
                        { code: 'ES', name: 'Diseño de Accesorios de Moda' },
                        { code: 'PT', name: 'Design de Acessórios de Moda' },
                    ],
                },
                {
                    name: 'Costume Design',
                    tags: [
                        'costume', 'theater', 'film', 'cosplay', 'character',
                        'diseño de vestuario', 'figurino', 'vestuario teatral', 'disfraz',
                    ],
                    translations: [
                        { code: 'EN', name: 'Costume Design' },
                        { code: 'ES', name: 'Diseño de Vestuario' },
                        { code: 'PT', name: 'Design de Figurino' },
                    ],
                },
            ],
        },
        {
            name: 'Craft & Object Design',
            tags: [
                'crafts', 'handmade', 'artisan', 'maker', 'handcrafted',
                'artesanía', 'artesania', 'hecho a mano', 'artesanato', 'manualidades',
            ],
            translations: [
                { code: 'EN', name: 'Craft & Object Design' },
                { code: 'ES', name: 'Artesanía y Diseño de Objetos' },
                { code: 'PT', name: 'Artesanato e Design de Objetos' },
            ],
            children: [
                {
                    name: 'Ceramic Craft',
                    tags: [
                        'ceramics', 'pottery', 'clay', 'porcelain', 'kiln',
                        'cerámica', 'ceramica', 'alfarería', 'porcelana', 'cerâmica',
                    ],
                    translations: [
                        { code: 'EN', name: 'Ceramic Craft' },
                        { code: 'ES', name: 'Artesanía en Cerámica' },
                        { code: 'PT', name: 'Artesanato em Cerâmica' },
                    ],
                },
                {
                    name: 'Jewelry Craft',
                    tags: [
                        'jewelry', 'accessories', 'handmade', 'wearable', 'artisan',
                        'joyería', 'joyeria', 'joyas', 'bisutería', 'joalheria',
                    ],
                    translations: [
                        { code: 'EN', name: 'Jewelry Craft' },
                        { code: 'ES', name: 'Artesanía en Joyería' },
                        { code: 'PT', name: 'Artesanato em Joalheria' },
                    ],
                },
                {
                    name: 'Woodworking Craft',
                    tags: [
                        'woodworking', 'wood', 'furniture', 'carving', 'carpentry',
                        'carpintería', 'carpinteria', 'madera', 'ebanistería', 'marcenaria',
                    ],
                    translations: [
                        { code: 'EN', name: 'Woodworking Craft' },
                        { code: 'ES', name: 'Artesanía en Carpintería' },
                        { code: 'PT', name: 'Artesanato em Marcenaria' },
                    ],
                },
                {
                    name: 'Glass & Resin Craft',
                    tags: [
                        'glass', 'resin', 'epoxy', 'casting', 'glasswork',
                        'vidrio', 'resina', 'epoxi', 'vitral', 'vidro',
                    ],
                    translations: [
                        { code: 'EN', name: 'Glass & Resin Craft' },
                        { code: 'ES', name: 'Artesanía en Vidrio y Resina' },
                        { code: 'PT', name: 'Artesanato em Vidro e Resina' },
                    ],
                },
                {
                    name: 'Leatherwork Craft',
                    tags: [
                        'leather', 'leathercraft', 'handmade', 'bags', 'wallets',
                        'marroquinería', 'marroquineria', 'cuero', 'piel', 'couro',
                    ],
                    translations: [
                        { code: 'EN', name: 'Leatherwork Craft' },
                        { code: 'ES', name: 'Artesanía en Marroquinería' },
                        { code: 'PT', name: 'Artesanato em Couro' },
                    ],
                },
            ],
        },
        {
            name: 'Spatial & Interior Design',
            tags: [
                'spatial', 'interior', 'environmental', 'space', 'experiential',
                'diseño de interiores', 'espacial', 'espacios', 'interiores',
            ],
            translations: [
                { code: 'EN', name: 'Spatial & Interior Design' },
                { code: 'ES', name: 'Diseño Espacial e Interior' },
                { code: 'PT', name: 'Design Espacial e Interior' },
            ],
            children: [
                {
                    name: 'Interior Design',
                    tags: [
                        'interior', 'decor', 'furniture', 'residential', 'home',
                        'diseño de interiores', 'decoración', 'decoracion', 'hogar',
                    ],
                    translations: [
                        { code: 'EN', name: 'Interior Design' },
                        { code: 'ES', name: 'Diseño de Interiores' },
                        { code: 'PT', name: 'Design de Interiores' },
                    ],
                },
                {
                    name: 'Exhibition & Set Design',
                    tags: [
                        'exhibition', 'set-design', 'stage', 'installation', 'scenography',
                        'escenografía', 'escenografia', 'exposiciones', 'montaje', 'set design',
                    ],
                    translations: [
                        { code: 'EN', name: 'Exhibition & Set Design' },
                        { code: 'ES', name: 'Diseño de Exposiciones y Escenografía' },
                        { code: 'PT', name: 'Design de Exposições e Cenografia' },
                    ],
                },
                {
                    name: 'Environmental & Signage Design',
                    tags: [
                        'environmental', 'signage', 'wayfinding', 'public-space', 'navigation',
                        'señalización', 'senalizacion', 'ambientación', 'wayfinding', 'sinalização',
                    ],
                    translations: [
                        { code: 'EN', name: 'Environmental & Signage Design' },
                        { code: 'ES', name: 'Diseño Ambiental y de Señalización' },
                        { code: 'PT', name: 'Design Ambiental e de Sinalização' },
                    ],
                },
            ],
        },
        {
            name: 'Tattoo & Body Art',
            tags: [
                'tattoo', 'ink', 'body-art', 'tattooing', 'tattoos',
                'tatuaje', 'tatuajes', 'tatuador', 'arte corporal', 'tatuagem',
            ],
            translations: [
                { code: 'EN', name: 'Tattoo & Body Art' },
                { code: 'ES', name: 'Tatuaje y Arte Corporal' },
                { code: 'PT', name: 'Tatuagem e Arte Corporal' },
            ],
            children: [
                {
                    name: 'Fine Line Tattoo',
                    tags: [
                        'fine-line', 'minimal', 'delicate', 'single-needle', 'micro',
                        'línea fina', 'linea fina', 'tatuaje fine line', 'microrealismo',
                    ],
                    translations: [
                        { code: 'EN', name: 'Fine Line Tattoo' },
                        { code: 'ES', name: 'Tatuaje de Línea Fina' },
                        { code: 'PT', name: 'Tatuagem de Linha Fina' },
                    ],
                },
                {
                    name: 'Traditional & Neo-Traditional Tattoo',
                    tags: [
                        'traditional', 'neo-traditional', 'old-school', 'bold', 'americana',
                        'tatuaje tradicional', 'old school', 'neotradicional', 'tradicional',
                    ],
                    translations: [
                        { code: 'EN', name: 'Traditional & Neo-Traditional Tattoo' },
                        { code: 'ES', name: 'Tatuaje Tradicional y Neo-Tradicional' },
                        { code: 'PT', name: 'Tatuagem Tradicional e Neo-Tradicional' },
                    ],
                },
                {
                    name: 'Realism Tattoo',
                    tags: [
                        'realism', 'portrait', 'photorealistic', 'black-grey', 'shading',
                        'realismo', 'tatuaje realista', 'black and grey', 'retrato tatuaje',
                    ],
                    translations: [
                        { code: 'EN', name: 'Realism Tattoo' },
                        { code: 'ES', name: 'Tatuaje Realista' },
                        { code: 'PT', name: 'Tatuagem Realista' },
                    ],
                },
                {
                    name: 'Blackwork & Geometric Tattoo',
                    tags: [
                        'blackwork', 'geometric', 'tribal', 'ornamental', 'dotwork',
                        'tatuaje geometrico', 'geométrico', 'ornamental', 'dotwork', 'tribal',
                    ],
                    translations: [
                        { code: 'EN', name: 'Blackwork & Geometric Tattoo' },
                        { code: 'ES', name: 'Tatuaje Blackwork y Geométrico' },
                        { code: 'PT', name: 'Tatuagem Blackwork e Geométrica' },
                    ],
                },
            ],
        },
    ];

    // Art styles are global aesthetics shared across every discipline (a photo, a film,
    // or a logo can all be "brutalist"). They are flat, top-level, and typed ART_STYLE.
    const artStyles: SeedCategory[] = [
        // Movements & eras
        { name: 'Minimalism', tags: ['minimalism', 'minimal', 'clean', 'simple', 'negative-space', 'minimalismo', 'minimalista'], translations: [{ code: 'EN', name: 'Minimalism' }, { code: 'ES', name: 'Minimalismo' }, { code: 'PT', name: 'Minimalismo' }] },
        { name: 'Maximalism', tags: ['maximalism', 'maximal', 'bold', 'busy', 'eclectic', 'maximalismo', 'maximalista'], translations: [{ code: 'EN', name: 'Maximalism' }, { code: 'ES', name: 'Maximalismo' }, { code: 'PT', name: 'Maximalismo' }] },
        { name: 'Brutalism', tags: ['brutalism', 'brutalist', 'raw', 'concrete', 'bold', 'brutalismo', 'brutalista'], translations: [{ code: 'EN', name: 'Brutalism' }, { code: 'ES', name: 'Brutalismo' }, { code: 'PT', name: 'Brutalismo' }] },
        { name: 'Art Deco', tags: ['art-deco', 'deco', 'geometric', 'luxury', '1920s', 'art deco', 'art déco'], translations: [{ code: 'EN', name: 'Art Deco' }, { code: 'ES', name: 'Art Déco' }, { code: 'PT', name: 'Art Déco' }] },
        { name: 'Art Nouveau', tags: ['art-nouveau', 'nouveau', 'organic', 'floral', 'ornate', 'modernismo', 'art nouveau'], translations: [{ code: 'EN', name: 'Art Nouveau' }, { code: 'ES', name: 'Art Nouveau' }, { code: 'PT', name: 'Art Nouveau' }] },
        { name: 'Bauhaus', tags: ['bauhaus', 'modernist', 'geometric', 'primary-colors', 'functional', 'escuela bauhaus'], translations: [{ code: 'EN', name: 'Bauhaus' }, { code: 'ES', name: 'Bauhaus' }, { code: 'PT', name: 'Bauhaus' }] },
        { name: 'Swiss / International Style', tags: ['swiss', 'international', 'grid', 'helvetica', 'typographic', 'estilo suizo', 'estilo suíço', 'suizo'], translations: [{ code: 'EN', name: 'Swiss / International Style' }, { code: 'ES', name: 'Estilo Suizo Internacional' }, { code: 'PT', name: 'Estilo Suíço Internacional' }] },
        { name: 'Memphis Style', tags: ['memphis', 'postmodern', '80s', 'playful', 'geometric', 'estilo memphis', 'posmoderno'], translations: [{ code: 'EN', name: 'Memphis Style' }, { code: 'ES', name: 'Estilo Memphis' }, { code: 'PT', name: 'Estilo Memphis' }] },
        { name: 'Pop Art', tags: ['pop-art', 'pop', 'bold', 'comic', 'warhol', 'arte pop', 'pop art'], translations: [{ code: 'EN', name: 'Pop Art' }, { code: 'ES', name: 'Pop Art' }, { code: 'PT', name: 'Pop Art' }] },
        { name: 'Surrealism', tags: ['surrealism', 'surreal', 'dreamlike', 'oneiric', 'strange', 'surrealismo', 'surrealista'], translations: [{ code: 'EN', name: 'Surrealism' }, { code: 'ES', name: 'Surrealismo' }, { code: 'PT', name: 'Surrealismo' }] },
        { name: 'Abstract Art Style', tags: ['abstract', 'non-representational', 'shapes', 'forms', 'expressive', 'abstracto', 'abstrato', 'arte abstracto'], translations: [{ code: 'EN', name: 'Abstract Art Style' }, { code: 'ES', name: 'Estilo Abstracto' }, { code: 'PT', name: 'Estilo Abstrato' }] },
        { name: 'Psychedelic Style', tags: ['psychedelic', 'trippy', 'colorful', '60s', 'swirls', 'psicodélico', 'psicodelico', 'psicodélico'], translations: [{ code: 'EN', name: 'Psychedelic Style' }, { code: 'ES', name: 'Estilo Psicodélico' }, { code: 'PT', name: 'Estilo Psicodélico' }] },
        { name: 'Baroque Style', tags: ['baroque', 'ornate', 'dramatic', 'ornamental', 'classical', 'barroco', 'estilo barroco'], translations: [{ code: 'EN', name: 'Baroque Style' }, { code: 'ES', name: 'Estilo Barroco' }, { code: 'PT', name: 'Estilo Barroco' }] },
        { name: 'Gothic Style', tags: ['gothic', 'dark', 'medieval', 'dramatic', 'ornate', 'gótico', 'gotico', 'estilo gótico'], translations: [{ code: 'EN', name: 'Gothic Style' }, { code: 'ES', name: 'Estilo Gótico' }, { code: 'PT', name: 'Estilo Gótico' }] },
        // Mood & retro
        { name: 'Vintage & Retro Style', tags: ['vintage', 'retro', 'nostalgic', 'aged', 'classic', 'retrô', 'estilo vintage', 'estilo retro'], translations: [{ code: 'EN', name: 'Vintage & Retro Style' }, { code: 'ES', name: 'Estilo Vintage y Retro' }, { code: 'PT', name: 'Estilo Vintage e Retrô' }] },
        { name: 'Noir Style', tags: ['noir', 'film-noir', 'moody', 'high-contrast', 'shadows', 'estilo noir', 'cine negro'], translations: [{ code: 'EN', name: 'Noir Style' }, { code: 'ES', name: 'Estilo Noir' }, { code: 'PT', name: 'Estilo Noir' }] },
        { name: 'Grunge Style', tags: ['grunge', 'gritty', 'distressed', 'textured', 'raw', 'estilo grunge'], translations: [{ code: 'EN', name: 'Grunge Style' }, { code: 'ES', name: 'Estilo Grunge' }, { code: 'PT', name: 'Estilo Grunge' }] },
        { name: 'Dark Academia', tags: ['dark-academia', 'academic', 'moody', 'vintage', 'literary', 'academia oscura'], translations: [{ code: 'EN', name: 'Dark Academia' }, { code: 'ES', name: 'Dark Academia' }, { code: 'PT', name: 'Dark Academia' }] },
        { name: 'Cottagecore', tags: ['cottagecore', 'cozy', 'rural', 'pastoral', 'whimsical', 'estilo cottagecore', 'rural'], translations: [{ code: 'EN', name: 'Cottagecore' }, { code: 'ES', name: 'Cottagecore' }, { code: 'PT', name: 'Cottagecore' }] },
        { name: 'Y2K Style', tags: ['y2k', '2000s', 'chrome', 'futuristic', 'retro', 'estilo y2k', 'años 2000'], translations: [{ code: 'EN', name: 'Y2K Style' }, { code: 'ES', name: 'Estilo Y2K' }, { code: 'PT', name: 'Estilo Y2K' }] },
        // Digital & rendering
        { name: 'Flat Design Style', tags: ['flat', 'flat-design', 'minimal', 'vector', 'simple', 'diseño plano', 'design plano'], translations: [{ code: 'EN', name: 'Flat Design Style' }, { code: 'ES', name: 'Estilo de Diseño Plano' }, { code: 'PT', name: 'Estilo de Design Plano' }] },
        { name: 'Glassmorphism', tags: ['glassmorphism', 'glass', 'frosted', 'blur', 'translucent', 'efecto vidrio', 'vidrio esmerilado'], translations: [{ code: 'EN', name: 'Glassmorphism' }, { code: 'ES', name: 'Glassmorphism' }, { code: 'PT', name: 'Glassmorphism' }] },
        { name: 'Isometric Style', tags: ['isometric', '3d', 'geometric', 'perspective', 'technical', 'isométrico', 'isometrico'], translations: [{ code: 'EN', name: 'Isometric Style' }, { code: 'ES', name: 'Estilo Isométrico' }, { code: 'PT', name: 'Estilo Isométrico' }] },
        { name: 'Low Poly Style', tags: ['low-poly', 'polygonal', '3d', 'faceted', 'geometric', 'bajo poligonaje', 'low poly'], translations: [{ code: 'EN', name: 'Low Poly Style' }, { code: 'ES', name: 'Estilo Low Poly' }, { code: 'PT', name: 'Estilo Low Poly' }] },
        { name: 'Pixel Art Style', tags: ['pixel-art', 'pixel', '8bit', 'retro', 'sprite', 'pixel art', 'arte pixel'], translations: [{ code: 'EN', name: 'Pixel Art Style' }, { code: 'ES', name: 'Estilo Pixel Art' }, { code: 'PT', name: 'Estilo Pixel Art' }] },
        { name: 'Monochrome Style', tags: ['monochrome', 'monochromatic', 'single-color', 'tonal', 'grayscale', 'monocromático', 'monocromatico', 'escala de grises'], translations: [{ code: 'EN', name: 'Monochrome Style' }, { code: 'ES', name: 'Estilo Monocromático' }, { code: 'PT', name: 'Estilo Monocromático' }] },
        { name: 'Duotone Style', tags: ['duotone', 'two-tone', 'bicolor', 'gradient', 'bold', 'duotono', 'bitono'], translations: [{ code: 'EN', name: 'Duotone Style' }, { code: 'ES', name: 'Estilo Duotono' }, { code: 'PT', name: 'Estilo Duotone' }] },
        { name: 'Holographic Style', tags: ['holographic', 'iridescent', 'chrome', 'metallic', 'shimmer', 'holográfico', 'holografico', 'iridiscente'], translations: [{ code: 'EN', name: 'Holographic Style' }, { code: 'ES', name: 'Estilo Holográfico' }, { code: 'PT', name: 'Estilo Holográfico' }] },
        // Retro-futurism
        { name: 'Vaporwave', tags: ['vaporwave', 'aesthetic', '80s', 'neon', 'retro', 'estilo vaporwave', 'estética vaporwave'], translations: [{ code: 'EN', name: 'Vaporwave' }, { code: 'ES', name: 'Vaporwave' }, { code: 'PT', name: 'Vaporwave' }] },
        { name: 'Synthwave', tags: ['synthwave', 'outrun', 'retrowave', 'neon', '80s', 'estilo synthwave'], translations: [{ code: 'EN', name: 'Synthwave' }, { code: 'ES', name: 'Synthwave' }, { code: 'PT', name: 'Synthwave' }] },
        { name: 'Cyberpunk', tags: ['cyberpunk', 'neon', 'futuristic', 'dystopian', 'tech', 'ciberpunk', 'estilo cyberpunk'], translations: [{ code: 'EN', name: 'Cyberpunk' }, { code: 'ES', name: 'Cyberpunk' }, { code: 'PT', name: 'Cyberpunk' }] },
        { name: 'Steampunk', tags: ['steampunk', 'victorian', 'brass', 'gears', 'retro-futuristic', 'estilo steampunk', 'victoriano'], translations: [{ code: 'EN', name: 'Steampunk' }, { code: 'ES', name: 'Steampunk' }, { code: 'PT', name: 'Steampunk' }] },
        { name: 'Solarpunk', tags: ['solarpunk', 'eco', 'green', 'utopian', 'sustainable', 'estilo solarpunk', 'ecológico'], translations: [{ code: 'EN', name: 'Solarpunk' }, { code: 'ES', name: 'Solarpunk' }, { code: 'PT', name: 'Solarpunk' }] },
        // Craft & print
        { name: 'Hand-drawn Style', tags: ['hand-drawn', 'sketch', 'doodle', 'organic', 'illustrated', 'dibujado a mano', 'a mano', 'desenhado à mão'], translations: [{ code: 'EN', name: 'Hand-drawn Style' }, { code: 'ES', name: 'Estilo Dibujado a Mano' }, { code: 'PT', name: 'Estilo Desenhado à Mão' }] },
        { name: 'Collage Style', tags: ['collage', 'cut-paper', 'mixed-media', 'layered', 'montage', 'colagem', 'estilo collage'], translations: [{ code: 'EN', name: 'Collage Style' }, { code: 'ES', name: 'Estilo Collage' }, { code: 'PT', name: 'Estilo Colagem' }] },
        { name: 'Risograph Style', tags: ['risograph', 'riso', 'print', 'grain', 'spot-color', 'risografía', 'risografia'], translations: [{ code: 'EN', name: 'Risograph Style' }, { code: 'ES', name: 'Estilo Risografía' }, { code: 'PT', name: 'Estilo Risografia' }] },
        { name: 'Woodcut & Linocut Style', tags: ['woodcut', 'linocut', 'printmaking', 'block-print', 'carved', 'xilografía', 'xilografia', 'linograbado', 'linogravura'], translations: [{ code: 'EN', name: 'Woodcut & Linocut Style' }, { code: 'ES', name: 'Estilo Xilografía y Linograbado' }, { code: 'PT', name: 'Estilo Xilogravura e Linogravura' }] },
        { name: 'Ukiyo-e Style', tags: ['ukiyo-e', 'japanese', 'woodblock', 'traditional', 'edo', 'ukiyo e', 'japonés', 'japones'], translations: [{ code: 'EN', name: 'Ukiyo-e Style' }, { code: 'ES', name: 'Estilo Ukiyo-e' }, { code: 'PT', name: 'Estilo Ukiyo-e' }] },
        { name: 'Folk Art Style', tags: ['folk-art', 'folk', 'traditional', 'naive', 'craft', 'folclórico', 'folclorico', 'arte popular', 'naive'], translations: [{ code: 'EN', name: 'Folk Art Style' }, { code: 'ES', name: 'Estilo de Arte Folclórico' }, { code: 'PT', name: 'Estilo de Arte Folclórica' }] },
    ];

    // Content TAGS: concrete, per-image descriptors the LLM picks (never user-editable) to enrich
    // media JSON-LD keywords + on-page chips. Kept bounded — they ride in every media-tagging prompt.
    const contentTags: SeedCategory[] = [
        // Subjects — people
        { name: 'People', tags: ['people', 'person', 'human', 'personas', 'gente', 'pessoas'], translations: [{ code: 'EN', name: 'People' }, { code: 'ES', name: 'Personas' }, { code: 'PT', name: 'Pessoas' }] },
        { name: 'Portrait', tags: ['portrait', 'face', 'headshot', 'retrato', 'rosto'], translations: [{ code: 'EN', name: 'Portrait' }, { code: 'ES', name: 'Retrato' }, { code: 'PT', name: 'Retrato' }] },
        { name: 'Child', tags: ['child', 'kid', 'children', 'niño', 'niños', 'criança'], translations: [{ code: 'EN', name: 'Child' }, { code: 'ES', name: 'Niño' }, { code: 'PT', name: 'Criança' }] },
        { name: 'Woman', tags: ['woman', 'female', 'mujer', 'mulher'], translations: [{ code: 'EN', name: 'Woman' }, { code: 'ES', name: 'Mujer' }, { code: 'PT', name: 'Mulher' }] },
        { name: 'Man', tags: ['man', 'male', 'hombre', 'homem'], translations: [{ code: 'EN', name: 'Man' }, { code: 'ES', name: 'Hombre' }, { code: 'PT', name: 'Homem' }] },
        { name: 'Couple', tags: ['couple', 'pareja', 'casal'], translations: [{ code: 'EN', name: 'Couple' }, { code: 'ES', name: 'Pareja' }, { code: 'PT', name: 'Casal' }] },
        { name: 'Crowd', tags: ['crowd', 'group', 'multitud', 'grupo', 'multidão'], translations: [{ code: 'EN', name: 'Crowd' }, { code: 'ES', name: 'Multitud' }, { code: 'PT', name: 'Multidão' }] },
        // Subjects — nature & animals
        { name: 'Animal', tags: ['animal', 'wildlife', 'animales', 'fauna'], translations: [{ code: 'EN', name: 'Animal' }, { code: 'ES', name: 'Animal' }, { code: 'PT', name: 'Animal' }] },
        { name: 'Dog', tags: ['dog', 'puppy', 'perro', 'cachorro'], translations: [{ code: 'EN', name: 'Dog' }, { code: 'ES', name: 'Perro' }, { code: 'PT', name: 'Cachorro' }] },
        { name: 'Cat', tags: ['cat', 'kitten', 'gato'], translations: [{ code: 'EN', name: 'Cat' }, { code: 'ES', name: 'Gato' }, { code: 'PT', name: 'Gato' }] },
        { name: 'Bird', tags: ['bird', 'pájaro', 'pajaro', 'pássaro'], translations: [{ code: 'EN', name: 'Bird' }, { code: 'ES', name: 'Pájaro' }, { code: 'PT', name: 'Pássaro' }] },
        { name: 'Flower', tags: ['flower', 'floral', 'flor', 'flores'], translations: [{ code: 'EN', name: 'Flower' }, { code: 'ES', name: 'Flor' }, { code: 'PT', name: 'Flor' }] },
        { name: 'Plant', tags: ['plant', 'greenery', 'planta', 'plantas'], translations: [{ code: 'EN', name: 'Plant' }, { code: 'ES', name: 'Planta' }, { code: 'PT', name: 'Planta' }] },
        { name: 'Tree', tags: ['tree', 'trees', 'árbol', 'arbol', 'árvore'], translations: [{ code: 'EN', name: 'Tree' }, { code: 'ES', name: 'Árbol' }, { code: 'PT', name: 'Árvore' }] },
        // Subjects — objects
        { name: 'Food', tags: ['food', 'meal', 'dish', 'comida', 'comida'], translations: [{ code: 'EN', name: 'Food' }, { code: 'ES', name: 'Comida' }, { code: 'PT', name: 'Comida' }] },
        { name: 'Drink', tags: ['drink', 'beverage', 'bebida'], translations: [{ code: 'EN', name: 'Drink' }, { code: 'ES', name: 'Bebida' }, { code: 'PT', name: 'Bebida' }] },
        { name: 'Car', tags: ['car', 'vehicle', 'auto', 'coche', 'carro'], translations: [{ code: 'EN', name: 'Car' }, { code: 'ES', name: 'Coche' }, { code: 'PT', name: 'Carro' }] },
        { name: 'Boat', tags: ['boat', 'ship', 'barco', 'barco'], translations: [{ code: 'EN', name: 'Boat' }, { code: 'ES', name: 'Barco' }, { code: 'PT', name: 'Barco' }] },
        { name: 'Building', tags: ['building', 'architecture', 'edificio', 'edifício', 'predio'], translations: [{ code: 'EN', name: 'Building' }, { code: 'ES', name: 'Edificio' }, { code: 'PT', name: 'Edifício' }] },
        // Scene & place
        { name: 'City', tags: ['city', 'urban', 'ciudad', 'cidade'], translations: [{ code: 'EN', name: 'City' }, { code: 'ES', name: 'Ciudad' }, { code: 'PT', name: 'Cidade' }] },
        { name: 'Street', tags: ['street', 'road', 'calle', 'rua'], translations: [{ code: 'EN', name: 'Street' }, { code: 'ES', name: 'Calle' }, { code: 'PT', name: 'Rua' }] },
        { name: 'Beach', tags: ['beach', 'seaside', 'playa', 'praia'], translations: [{ code: 'EN', name: 'Beach' }, { code: 'ES', name: 'Playa' }, { code: 'PT', name: 'Praia' }] },
        { name: 'Sea', tags: ['sea', 'ocean', 'mar', 'océano', 'oceano'], translations: [{ code: 'EN', name: 'Sea' }, { code: 'ES', name: 'Mar' }, { code: 'PT', name: 'Mar' }] },
        { name: 'Mountain', tags: ['mountain', 'mountains', 'montaña', 'montanha'], translations: [{ code: 'EN', name: 'Mountain' }, { code: 'ES', name: 'Montaña' }, { code: 'PT', name: 'Montanha' }] },
        { name: 'Forest', tags: ['forest', 'woods', 'bosque', 'floresta'], translations: [{ code: 'EN', name: 'Forest' }, { code: 'ES', name: 'Bosque' }, { code: 'PT', name: 'Floresta' }] },
        { name: 'Desert', tags: ['desert', 'dunes', 'desierto', 'deserto'], translations: [{ code: 'EN', name: 'Desert' }, { code: 'ES', name: 'Desierto' }, { code: 'PT', name: 'Deserto' }] },
        { name: 'Lake', tags: ['lake', 'lago'], translations: [{ code: 'EN', name: 'Lake' }, { code: 'ES', name: 'Lago' }, { code: 'PT', name: 'Lago' }] },
        { name: 'River', tags: ['river', 'río', 'rio'], translations: [{ code: 'EN', name: 'River' }, { code: 'ES', name: 'Río' }, { code: 'PT', name: 'Rio' }] },
        { name: 'Countryside', tags: ['countryside', 'rural', 'campo', 'campo'], translations: [{ code: 'EN', name: 'Countryside' }, { code: 'ES', name: 'Campo' }, { code: 'PT', name: 'Campo' }] },
        { name: 'Garden', tags: ['garden', 'jardín', 'jardin', 'jardim'], translations: [{ code: 'EN', name: 'Garden' }, { code: 'ES', name: 'Jardín' }, { code: 'PT', name: 'Jardim' }] },
        { name: 'Interior', tags: ['interior', 'indoor', 'room', 'interior', 'ambiente interno'], translations: [{ code: 'EN', name: 'Interior' }, { code: 'ES', name: 'Interior' }, { code: 'PT', name: 'Interior' }] },
        { name: 'Sky', tags: ['sky', 'clouds', 'cielo', 'céu', 'ceu'], translations: [{ code: 'EN', name: 'Sky' }, { code: 'ES', name: 'Cielo' }, { code: 'PT', name: 'Céu' }] },
        { name: 'Waterfall', tags: ['waterfall', 'cascada', 'cachoeira'], translations: [{ code: 'EN', name: 'Waterfall' }, { code: 'ES', name: 'Cascada' }, { code: 'PT', name: 'Cachoeira' }] },
        // Setting, light & time
        { name: 'Night', tags: ['night', 'nocturnal', 'noche', 'noite'], translations: [{ code: 'EN', name: 'Night' }, { code: 'ES', name: 'Noche' }, { code: 'PT', name: 'Noite' }] },
        { name: 'Sunset', tags: ['sunset', 'dusk', 'atardecer', 'pôr do sol', 'por do sol'], translations: [{ code: 'EN', name: 'Sunset' }, { code: 'ES', name: 'Atardecer' }, { code: 'PT', name: 'Pôr do Sol' }] },
        { name: 'Sunrise', tags: ['sunrise', 'dawn', 'amanecer', 'nascer do sol'], translations: [{ code: 'EN', name: 'Sunrise' }, { code: 'ES', name: 'Amanecer' }, { code: 'PT', name: 'Nascer do Sol' }] },
        { name: 'Golden Hour', tags: ['golden-hour', 'golden hour', 'hora dorada', 'hora dourada'], translations: [{ code: 'EN', name: 'Golden Hour' }, { code: 'ES', name: 'Hora Dorada' }, { code: 'PT', name: 'Hora Dourada' }] },
        { name: 'Studio Setting', tags: ['studio', 'estudio', 'estúdio', 'estudio fotografico'], translations: [{ code: 'EN', name: 'Studio Setting' }, { code: 'ES', name: 'Estudio' }, { code: 'PT', name: 'Estúdio' }] },
        { name: 'Outdoor', tags: ['outdoor', 'outside', 'exterior', 'ao ar livre'], translations: [{ code: 'EN', name: 'Outdoor' }, { code: 'ES', name: 'Exterior' }, { code: 'PT', name: 'Ao Ar Livre' }] },
        { name: 'Natural Light', tags: ['natural-light', 'daylight', 'luz natural'], translations: [{ code: 'EN', name: 'Natural Light' }, { code: 'ES', name: 'Luz Natural' }, { code: 'PT', name: 'Luz Natural' }] },
        { name: 'Neon Lights', tags: ['neon', 'neon-lights', 'neón', 'neon'], translations: [{ code: 'EN', name: 'Neon Lights' }, { code: 'ES', name: 'Luces de Neón' }, { code: 'PT', name: 'Luzes de Neon' }] },
        { name: 'Fog', tags: ['fog', 'mist', 'niebla', 'névoa', 'nevoa'], translations: [{ code: 'EN', name: 'Fog' }, { code: 'ES', name: 'Niebla' }, { code: 'PT', name: 'Névoa' }] },
        { name: 'Rain', tags: ['rain', 'rainy', 'lluvia', 'chuva'], translations: [{ code: 'EN', name: 'Rain' }, { code: 'ES', name: 'Lluvia' }, { code: 'PT', name: 'Chuva' }] },
        { name: 'Snow', tags: ['snow', 'snowy', 'nieve', 'neve'], translations: [{ code: 'EN', name: 'Snow' }, { code: 'ES', name: 'Nieve' }, { code: 'PT', name: 'Neve' }] },
        // Season
        { name: 'Winter', tags: ['winter', 'invierno', 'inverno'], translations: [{ code: 'EN', name: 'Winter' }, { code: 'ES', name: 'Invierno' }, { code: 'PT', name: 'Inverno' }] },
        { name: 'Summer', tags: ['summer', 'verano', 'verão', 'verao'], translations: [{ code: 'EN', name: 'Summer' }, { code: 'ES', name: 'Verano' }, { code: 'PT', name: 'Verão' }] },
        { name: 'Autumn', tags: ['autumn', 'fall', 'otoño', 'otono', 'outono'], translations: [{ code: 'EN', name: 'Autumn' }, { code: 'ES', name: 'Otoño' }, { code: 'PT', name: 'Outono' }] },
        { name: 'Spring', tags: ['spring', 'primavera'], translations: [{ code: 'EN', name: 'Spring' }, { code: 'ES', name: 'Primavera' }, { code: 'PT', name: 'Primavera' }] },
        // Mood
        { name: 'Moody', tags: ['moody', 'somber', 'sombrío', 'sombrio'], translations: [{ code: 'EN', name: 'Moody' }, { code: 'ES', name: 'Sombrío' }, { code: 'PT', name: 'Sombrio' }] },
        { name: 'Serene', tags: ['serene', 'calm', 'sereno', 'tranquilo'], translations: [{ code: 'EN', name: 'Serene' }, { code: 'ES', name: 'Sereno' }, { code: 'PT', name: 'Sereno' }] },
        { name: 'Dramatic', tags: ['dramatic', 'dramático', 'dramatico'], translations: [{ code: 'EN', name: 'Dramatic' }, { code: 'ES', name: 'Dramático' }, { code: 'PT', name: 'Dramático' }] },
        { name: 'Joyful', tags: ['joyful', 'happy', 'alegre', 'feliz'], translations: [{ code: 'EN', name: 'Joyful' }, { code: 'ES', name: 'Alegre' }, { code: 'PT', name: 'Alegre' }] },
        { name: 'Melancholic', tags: ['melancholic', 'melancholy', 'melancólico', 'melancolico'], translations: [{ code: 'EN', name: 'Melancholic' }, { code: 'ES', name: 'Melancólico' }, { code: 'PT', name: 'Melancólico' }] },
        { name: 'Romantic', tags: ['romantic', 'romántico', 'romantico', 'romântico'], translations: [{ code: 'EN', name: 'Romantic' }, { code: 'ES', name: 'Romántico' }, { code: 'PT', name: 'Romântico' }] },
        { name: 'Mysterious', tags: ['mysterious', 'enigmatic', 'misterioso'], translations: [{ code: 'EN', name: 'Mysterious' }, { code: 'ES', name: 'Misterioso' }, { code: 'PT', name: 'Misterioso' }] },
        { name: 'Nostalgic', tags: ['nostalgic', 'nostálgico', 'nostalgico'], translations: [{ code: 'EN', name: 'Nostalgic' }, { code: 'ES', name: 'Nostálgico' }, { code: 'PT', name: 'Nostálgico' }] },
        // Composition & technique
        { name: 'Close-up', tags: ['close-up', 'closeup', 'primer plano', 'grande plano'], translations: [{ code: 'EN', name: 'Close-up' }, { code: 'ES', name: 'Primer Plano' }, { code: 'PT', name: 'Close-up' }] },
        { name: 'Macro', tags: ['macro', 'macro'], translations: [{ code: 'EN', name: 'Macro' }, { code: 'ES', name: 'Macro' }, { code: 'PT', name: 'Macro' }] },
        { name: 'Aerial View', tags: ['aerial', 'aerial-view', 'vista aérea', 'vista aerea'], translations: [{ code: 'EN', name: 'Aerial View' }, { code: 'ES', name: 'Vista Aérea' }, { code: 'PT', name: 'Vista Aérea' }] },
        { name: 'Symmetry', tags: ['symmetry', 'symmetrical', 'simetría', 'simetria'], translations: [{ code: 'EN', name: 'Symmetry' }, { code: 'ES', name: 'Simetría' }, { code: 'PT', name: 'Simetria' }] },
        { name: 'Long Exposure', tags: ['long-exposure', 'larga exposición', 'longa exposição'], translations: [{ code: 'EN', name: 'Long Exposure' }, { code: 'ES', name: 'Larga Exposición' }, { code: 'PT', name: 'Longa Exposição' }] },
        { name: 'Silhouette', tags: ['silhouette', 'silueta', 'silhueta'], translations: [{ code: 'EN', name: 'Silhouette' }, { code: 'ES', name: 'Silueta' }, { code: 'PT', name: 'Silhueta' }] },
        { name: 'Reflection', tags: ['reflection', 'reflejo', 'reflexo'], translations: [{ code: 'EN', name: 'Reflection' }, { code: 'ES', name: 'Reflejo' }, { code: 'PT', name: 'Reflexo' }] },
        { name: 'Black and White', tags: ['black-and-white', 'bw', 'blanco y negro', 'preto e branco'], translations: [{ code: 'EN', name: 'Black and White' }, { code: 'ES', name: 'Blanco y Negro' }, { code: 'PT', name: 'Preto e Branco' }] },
        { name: 'Texture', tags: ['texture', 'textura'], translations: [{ code: 'EN', name: 'Texture' }, { code: 'ES', name: 'Textura' }, { code: 'PT', name: 'Textura' }] },
        { name: 'Pattern', tags: ['pattern', 'patrón', 'patron', 'padrão'], translations: [{ code: 'EN', name: 'Pattern' }, { code: 'ES', name: 'Patrón' }, { code: 'PT', name: 'Padrão' }] },
        // Color
        { name: 'Colorful', tags: ['colorful', 'vivid', 'colorido'], translations: [{ code: 'EN', name: 'Colorful' }, { code: 'ES', name: 'Colorido' }, { code: 'PT', name: 'Colorido' }] },
        { name: 'Pastel Colors', tags: ['pastel', 'soft-colors', 'pastel', 'tons pastel'], translations: [{ code: 'EN', name: 'Pastel Colors' }, { code: 'ES', name: 'Colores Pastel' }, { code: 'PT', name: 'Tons Pastel' }] },
        { name: 'Warm Tones', tags: ['warm-tones', 'warm', 'tonos cálidos', 'tons quentes'], translations: [{ code: 'EN', name: 'Warm Tones' }, { code: 'ES', name: 'Tonos Cálidos' }, { code: 'PT', name: 'Tons Quentes' }] },
        { name: 'Cool Tones', tags: ['cool-tones', 'cool', 'tonos fríos', 'tons frios'], translations: [{ code: 'EN', name: 'Cool Tones' }, { code: 'ES', name: 'Tonos Fríos' }, { code: 'PT', name: 'Tons Frios' }] },
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

        const existingCategory = await Query.table('categories')
            .where('name', '=', category.name)
            .first<Pick<CategorySchema, 'id' | 'slug' | 'thumbnail'>>();

        // Reuse the persisted slug on update so thumbnail S3 keys and any external
        // references (links, category pages) stay stable across re-seeds.
        const slug = existingCategory
            ? reserveExistingCategorySlug(existingCategory.slug)
            : allocateCategorySlug(category.name);

        let thumbnail: string | null = existingCategory?.thumbnail ?? null;
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

        let categoryId: number;
        if (existingCategory) {
            categoryId = existingCategory.id;
            await Query.table('categories')
                .where('id', '=', categoryId)
                .update(columns, values as any[]);
        } else {
            const inserted = await Query.table('categories').insertAndGet(columns, values as any[], 'id');
            categoryId = inserted.id;
        }

        await Promise.all(category.translations.map(async (child) => {
            const existingTranslation = await Query.table('category_translations')
                .where('category_id', '=', categoryId)
                .where('language_code', '=', child.code)
                .first<{ id: number }>();
            if (existingTranslation) {
                await Query.table('category_translations')
                    .where('id', '=', existingTranslation.id)
                    .update(['name'], [child.name]);
            } else {
                await Query.table('category_translations').insertAndGet(['name', 'language_code', 'category_id'], [child.name, child.code, categoryId], 'id');
            }
        }));
        if (category.children) {
            await Promise.all(category.children.map(child => createCategories(child, categoryId, isActive, categoryType)))
        }
    }

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

    // Content TAGS: active (so findAllActive feeds them to the LLM) but LLM-only — the
    // user-facing pickers filter by type, so these never appear in the discipline/style selectors.
    for (const tag of contentTags) {
        await createCategories(tag, undefined, true, 'TAGS');
    }
};
