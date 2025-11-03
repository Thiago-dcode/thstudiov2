import { EnumType } from "@repo/common-lib/constants/enums";
import { Query } from "src/lib/facades";

type SeedCategory = {
    name:string,
    tags:string[],
    translations: {
        code: EnumType<'LANGUAGE_CODE'>,
        name: string
    }[],
    children?: SeedCategory[]

}
export const main = async () => {

    const categories:SeedCategory[] = [
        {
            name: 'photography',
            tags: ['photo', 'photos', 'camera', 'photographer', 'pics', 'photoshoot'],
            translations: [
                { code: 'EN', name: 'Photography' },
                { code: 'ES', name: 'Fotografía' },
                { code: 'PT', name: 'Fotografia' }
            ],
            children: [
                { name: 'portrait_photography', tags: ['portrait', 'headshot', 'people', 'face', 'professional', 'studio'], translations: [{ code: 'EN', name: 'Portrait Photography' }, { code: 'ES', name: 'Fotografía de Retrato' }, { code: 'PT', name: 'Fotografia de Retrato' }] },
                { name: 'landscape_photography', tags: ['landscape', 'nature', 'scenery', 'outdoor', 'mountains', 'sunset'], translations: [{ code: 'EN', name: 'Landscape Photography' }, { code: 'ES', name: 'Fotografía de Paisaje' }, { code: 'PT', name: 'Fotografia de Paisagem' }] },
                { name: 'wildlife_photography', tags: ['wildlife', 'animals', 'nature', 'safari', 'birds', 'fauna'], translations: [{ code: 'EN', name: 'Wildlife Photography' }, { code: 'ES', name: 'Fotografía de Vida Silvestre' }, { code: 'PT', name: 'Fotografia de Vida Selvagem' }] },
                { name: 'street_photography', tags: ['street', 'urban', 'city', 'documentary', 'candid', 'lifestyle'], translations: [{ code: 'EN', name: 'Street Photography' }, { code: 'ES', name: 'Fotografía Callejera' }, { code: 'PT', name: 'Fotografia de Rua' }] },
                { name: 'fashion_photography', tags: ['fashion', 'model', 'style', 'editorial', 'runway', 'lookbook'], translations: [{ code: 'EN', name: 'Fashion Photography' }, { code: 'ES', name: 'Fotografía de Moda' }, { code: 'PT', name: 'Fotografia de Moda' }] },
                { name: 'macro_photography', tags: ['macro', 'closeup', 'close-up', 'detail', 'micro', 'insects'], translations: [{ code: 'EN', name: 'Macro Photography' }, { code: 'ES', name: 'Fotografía Macro' }, { code: 'PT', name: 'Fotografia Macro' }] },
                { name: 'sports_photography', tags: ['sports', 'action', 'athletic', 'game', 'competition', 'athlete'], translations: [{ code: 'EN', name: 'Sports Photography' }, { code: 'ES', name: 'Fotografía Deportiva' }, { code: 'PT', name: 'Fotografia Esportiva' }] },
                { name: 'architectural_photography', tags: ['architecture', 'building', 'real-estate', 'interior', 'exterior', 'construction'], translations: [{ code: 'EN', name: 'Architectural Photography' }, { code: 'ES', name: 'Fotografía Arquitectónica' }, { code: 'PT', name: 'Fotografia Arquitetônica' }] },
                { name: 'documentary_photography', tags: ['documentary', 'photojournalism', 'storytelling', 'journalism', 'reportage', 'truth'], translations: [{ code: 'EN', name: 'Documentary Photography' }, { code: 'ES', name: 'Fotografía Documental' }, { code: 'PT', name: 'Fotografia Documental' }] },
                { name: 'travel_photography', tags: ['travel', 'journey', 'adventure', 'tourism', 'destination', 'exploration'], translations: [{ code: 'EN', name: 'Travel Photography' }, { code: 'ES', name: 'Fotografía de Viajes' }, { code: 'PT', name: 'Fotografia de Viagem' }] },
                { name: 'event_photography', tags: ['event', 'wedding', 'party', 'ceremony', 'celebration', 'occasion'], translations: [{ code: 'EN', name: 'Event Photography' }, { code: 'ES', name: 'Fotografía de Eventos' }, { code: 'PT', name: 'Fotografia de Eventos' }] },
                { name: 'wedding_photography', tags: ['wedding', 'bride', 'groom', 'marriage', 'ceremony', 'engagement'], translations: [{ code: 'EN', name: 'Wedding Photography' }, { code: 'ES', name: 'Fotografía de Bodas' }, { code: 'PT', name: 'Fotografia de Casamento' }] },
                { name: 'concert_photography', tags: ['concert', 'music', 'live', 'stage', 'performance', 'band'], translations: [{ code: 'EN', name: 'Concert Photography' }, { code: 'ES', name: 'Fotografía de Conciertos' }, { code: 'PT', name: 'Fotografia de Shows' }] },
                { name: 'astrophotography', tags: ['astrophotography', 'stars', 'astronomy', 'milky-way', 'night-sky', 'space'], translations: [{ code: 'EN', name: 'Astrophotography' }, { code: 'ES', name: 'Astrofotografía' }, { code: 'PT', name: 'Astrofotografia' }] },
                { name: 'aerial_photography', tags: ['aerial', 'drone', 'sky', 'birds-eye', 'overhead', 'top-view'], translations: [{ code: 'EN', name: 'Aerial Photography' }, { code: 'ES', name: 'Fotografía Aérea' }, { code: 'PT', name: 'Fotografia Aérea' }] },
                { name: 'drone_photography', tags: ['drone', 'uav', 'aerial', 'quadcopter', 'dji', 'flying'], translations: [{ code: 'EN', name: 'Drone Photography' }, { code: 'ES', name: 'Fotografía con Dron' }, { code: 'PT', name: 'Fotografia com Drone' }] },
                { name: 'underwater_photography', tags: ['underwater', 'ocean', 'marine', 'diving', 'sea', 'aquatic'], translations: [{ code: 'EN', name: 'Underwater Photography' }, { code: 'ES', name: 'Fotografía Submarina' }, { code: 'PT', name: 'Fotografia Subaquática' }] },
                { name: 'food_photography', tags: ['food', 'culinary', 'restaurant', 'menu', 'dish', 'gastronomy'], translations: [{ code: 'EN', name: 'Food Photography' }, { code: 'ES', name: 'Fotografía Gastronómica' }, { code: 'PT', name: 'Fotografia Gastronômica' }] },
                { name: 'product_photography', tags: ['product', 'commercial', 'ecommerce', 'catalog', 'studio', 'white-background'], translations: [{ code: 'EN', name: 'Product Photography' }, { code: 'ES', name: 'Fotografía de Producto' }, { code: 'PT', name: 'Fotografia de Produto' }] },
                { name: 'still_life_photography', tags: ['still-life', 'objects', 'composition', 'tabletop', 'artistic', 'arrangement'], translations: [{ code: 'EN', name: 'Still Life Photography' }, { code: 'ES', name: 'Fotografía de Bodegones' }, { code: 'PT', name: 'Fotografia de Natureza Morta' }] },
                { name: 'fine_art_photography', tags: ['fine-art', 'artistic', 'conceptual', 'gallery', 'exhibition', 'creative'], translations: [{ code: 'EN', name: 'Fine Art Photography' }, { code: 'ES', name: 'Fotografía de Arte' }, { code: 'PT', name: 'Fotografia de Arte' }] },
                { name: 'black_white_photography', tags: ['black-and-white', 'monochrome', 'bw', 'noir', 'contrast', 'classic'], translations: [{ code: 'EN', name: 'Black and White Photography' }, { code: 'ES', name: 'Fotografía en Blanco y Negro' }, { code: 'PT', name: 'Fotografia Preto e Branco' }] },
                { name: 'long_exposure_photography', tags: ['long-exposure', 'slow-shutter', 'light-trails', 'motion-blur', 'night', 'nd-filter'], translations: [{ code: 'EN', name: 'Long Exposure Photography' }, { code: 'ES', name: 'Fotografía de Larga Exposición' }, { code: 'PT', name: 'Fotografia de Longa Exposição' }] },
                { name: 'night_photography', tags: ['night', 'low-light', 'nocturnal', 'evening', 'city-lights', 'dark'], translations: [{ code: 'EN', name: 'Night Photography' }, { code: 'ES', name: 'Fotografía Nocturna' }, { code: 'PT', name: 'Fotografia Noturna' }] },
                { name: 'abstract_photography', tags: ['abstract', 'artistic', 'experimental', 'creative', 'patterns', 'shapes'], translations: [{ code: 'EN', name: 'Abstract Photography' }, { code: 'ES', name: 'Fotografía Abstracta' }, { code: 'PT', name: 'Fotografia Abstrata' }] },
                { name: 'newborn_photography', tags: ['newborn', 'baby', 'infant', 'maternity', 'family', 'studio'], translations: [{ code: 'EN', name: 'Newborn Photography' }, { code: 'ES', name: 'Fotografía de Recién Nacidos' }, { code: 'PT', name: 'Fotografia Newborn' }] },
                { name: 'pet_photography', tags: ['pet', 'dog', 'cat', 'animal', 'pets', 'animals'], translations: [{ code: 'EN', name: 'Pet Photography' }, { code: 'ES', name: 'Fotografía de Mascotas' }, { code: 'PT', name: 'Fotografia de Pets' }] },
                { name: 'automotive_photography', tags: ['automotive', 'car', 'vehicle', 'automobile', 'motor', 'racing'], translations: [{ code: 'EN', name: 'Automotive Photography' }, { code: 'ES', name: 'Fotografía Automotriz' }, { code: 'PT', name: 'Fotografia Automotiva' }] },
                { name: 'real_estate_photography', tags: ['real-estate', 'property', 'home', 'house', 'interior', 'listing'], translations: [{ code: 'EN', name: 'Real Estate Photography' }, { code: 'ES', name: 'Fotografía Inmobiliaria' }, { code: 'PT', name: 'Fotografia Imobiliária' }] },
                { name: 'lifestyle_photography', tags: ['lifestyle', 'candid', 'natural', 'everyday', 'authentic', 'casual'], translations: [{ code: 'EN', name: 'Lifestyle Photography' }, { code: 'ES', name: 'Fotografía de Estilo de Vida' }, { code: 'PT', name: 'Fotografia Lifestyle' }] },
                { name: 'stock_photography', tags: ['stock', 'commercial', 'licensing', 'royalty-free', 'microstock', 'agency'], translations: [{ code: 'EN', name: 'Stock Photography' }, { code: 'ES', name: 'Fotografía de Stock' }, { code: 'PT', name: 'Fotografia de Stock' }] },
                { name: 'timelapse_photography', tags: ['timelapse', 'time-lapse', 'sequence', 'motion', 'video', 'interval'], translations: [{ code: 'EN', name: 'Time-Lapse Photography' }, { code: 'ES', name: 'Fotografía Time-Lapse' }, { code: 'PT', name: 'Fotografia Time-Lapse' }] },
                { name: 'panoramic_photography', tags: ['panoramic', 'panorama', 'wide-angle', '360', 'stitched', 'landscape'], translations: [{ code: 'EN', name: 'Panoramic Photography' }, { code: 'ES', name: 'Fotografía Panorámica' }, { code: 'PT', name: 'Fotografia Panorâmica' }] }
            ]
        },
        {
            name: 'graphic_design',
            tags: ['graphic', 'design', 'visual', 'creative', 'designer', 'graphics', 'layout'],
            translations: [
                { code: 'EN', name: 'Graphic Design' },
                { code: 'ES', name: 'Diseño Gráfico' },
                { code: 'PT', name: 'Design Gráfico' }
            ],
            children: [
                { name: 'logo_design', tags: ['logo', 'brand', 'identity', 'emblem', 'mark', 'symbol'], translations: [{ code: 'EN', name: 'Logo Design' }, { code: 'ES', name: 'Diseño de Logotipo' }, { code: 'PT', name: 'Design de Logotipo' }] },
                { name: 'branding_design', tags: ['branding', 'brand-identity', 'corporate', 'identity', 'style-guide', 'brand-book'], translations: [{ code: 'EN', name: 'Branding & Identity' }, { code: 'ES', name: 'Identidad de Marca' }, { code: 'PT', name: 'Branding e Identidade' }] },
                { name: 'print_design', tags: ['print', 'printing', 'printed', 'offset', 'digital-print', 'press'], translations: [{ code: 'EN', name: 'Print Design' }, { code: 'ES', name: 'Diseño de Impresión' }, { code: 'PT', name: 'Design de Impressão' }] },
                { name: 'editorial_design', tags: ['editorial', 'layout', 'typography', 'publication', 'magazine', 'newspaper'], translations: [{ code: 'EN', name: 'Editorial Design' }, { code: 'ES', name: 'Diseño Editorial' }, { code: 'PT', name: 'Design Editorial' }] },
                { name: 'poster_design', tags: ['poster', 'print', 'advertising', 'promotional', 'billboard', 'event'], translations: [{ code: 'EN', name: 'Poster Design' }, { code: 'ES', name: 'Diseño de Póster' }, { code: 'PT', name: 'Design de Pôster' }] },
                { name: 'flyer_design', tags: ['flyer', 'leaflet', 'brochure', 'handout', 'pamphlet', 'marketing'], translations: [{ code: 'EN', name: 'Flyer Design' }, { code: 'ES', name: 'Diseño de Folleto' }, { code: 'PT', name: 'Design de Folheto' }] },
                { name: 'business_card_design', tags: ['business-card', 'card', 'contact', 'corporate', 'professional', 'networking'], translations: [{ code: 'EN', name: 'Business Card Design' }, { code: 'ES', name: 'Diseño de Tarjeta de Presentación' }, { code: 'PT', name: 'Design de Cartão de Visita' }] },
                { name: 'packaging_design', tags: ['packaging', 'box', 'product', 'label', 'wrapper', 'container'], translations: [{ code: 'EN', name: 'Packaging Design' }, { code: 'ES', name: 'Diseño de Empaque' }, { code: 'PT', name: 'Design de Embalagem' }] },
                { name: 'book_cover_design', tags: ['book-cover', 'book', 'cover', 'ebook', 'novel', 'publishing'], translations: [{ code: 'EN', name: 'Book Cover Design' }, { code: 'ES', name: 'Diseño de Portada de Libro' }, { code: 'PT', name: 'Design de Capa de Livro' }] },
                { name: 'album_cover_design', tags: ['album', 'music', 'cover-art', 'cd', 'vinyl', 'artwork'], translations: [{ code: 'EN', name: 'Album Cover Design' }, { code: 'ES', name: 'Diseño de Portada de Álbum' }, { code: 'PT', name: 'Design de Capa de Álbum' }] },
                { name: 'advertising_design', tags: ['advertising', 'ads', 'marketing', 'campaign', 'commercial', 'promotion'], translations: [{ code: 'EN', name: 'Advertising Design' }, { code: 'ES', name: 'Diseño Publicitario' }, { code: 'PT', name: 'Design Publicitário' }] },
                { name: 'social_media_design', tags: ['social-media', 'instagram', 'tiktok', 'linkedin', 'post', 'content'], translations: [{ code: 'EN', name: 'Social Media Design' }, { code: 'ES', name: 'Diseño para Redes Sociales' }, { code: 'PT', name: 'Design para Redes Sociais' }] },
                { name: 'presentation_design', tags: ['presentation', 'powerpoint', 'slides', 'keynote', 'pitch-deck', 'corporate'], translations: [{ code: 'EN', name: 'Presentation Design' }, { code: 'ES', name: 'Diseño de Presentaciones' }, { code: 'PT', name: 'Design de Apresentações' }] },
                { name: 'annual_report_design', tags: ['annual-report', 'report', 'corporate', 'financial', 'business', 'document'], translations: [{ code: 'EN', name: 'Annual Report Design' }, { code: 'ES', name: 'Diseño de Informe Anual' }, { code: 'PT', name: 'Design de Relatório Anual' }] },
                { name: 'apparel_design', tags: ['apparel', 't-shirt', 'clothing', 'fashion', 'merchandise', 'textile'], translations: [{ code: 'EN', name: 'Apparel Design' }, { code: 'ES', name: 'Diseño de Ropa' }, { code: 'PT', name: 'Design de Vestuário' }] },
                { name: 'merchandise_design', tags: ['merchandise', 'merch', 'sticker', 'products', 'branding', 'swag'], translations: [{ code: 'EN', name: 'Merchandise Design' }, { code: 'ES', name: 'Diseño de Merchandising' }, { code: 'PT', name: 'Design de Merchandise' }] },
                { name: 'infographic_design', tags: ['infographic', 'data-viz', 'visualization', 'chart', 'statistics', 'information'], translations: [{ code: 'EN', name: 'Infographic Design' }, { code: 'ES', name: 'Diseño de Infografía' }, { code: 'PT', name: 'Design de Infográfico' }] }
            ]
        },
        {
            name: 'web_design',
            tags: ['web', 'website', 'online', 'digital', 'internet', 'responsive', 'webdesign'],
            translations: [
                { code: 'EN', name: 'Web Design' },
                { code: 'ES', name: 'Diseño Web' },
                { code: 'PT', name: 'Web Design' }
            ],
            children: [
                { name: 'ui_design', tags: ['ui', 'interface', 'user-interface', 'screen', 'frontend', 'interaction'], translations: [{ code: 'EN', name: 'UI Design' }, { code: 'ES', name: 'Diseño de Interfaz' }, { code: 'PT', name: 'Design de Interface' }] },
                { name: 'ux_design', tags: ['ux', 'user-experience', 'usability', 'wireframe', 'prototype', 'research'], translations: [{ code: 'EN', name: 'UX Design' }, { code: 'ES', name: 'Diseño de Experiencia de Usuario' }, { code: 'PT', name: 'Design de Experiência do Usuário' }] },
                { name: 'ux_research', tags: ['ux-research', 'user-research', 'usability-testing', 'interviews', 'personas', 'testing'], translations: [{ code: 'EN', name: 'UX Research' }, { code: 'ES', name: 'Investigación UX' }, { code: 'PT', name: 'Pesquisa UX' }] },
                { name: 'interaction_design', tags: ['interaction', 'ixd', 'microinteractions', 'animation', 'transitions', 'gestures'], translations: [{ code: 'EN', name: 'Interaction Design' }, { code: 'ES', name: 'Diseño de Interacción' }, { code: 'PT', name: 'Design de Interação' }] },
                { name: 'service_design', tags: ['service-design', 'service', 'journey-mapping', 'touchpoints', 'customer-experience', 'cx'], translations: [{ code: 'EN', name: 'Service Design' }, { code: 'ES', name: 'Diseño de Servicios' }, { code: 'PT', name: 'Design de Serviços' }] },
                { name: 'landing_page_design', tags: ['landing-page', 'conversion', 'sales', 'marketing', 'page', 'lead'], translations: [{ code: 'EN', name: 'Landing Page Design' }, { code: 'ES', name: 'Diseño de Página de Aterrizaje' }, { code: 'PT', name: 'Design de Landing Page' }] },
                { name: 'mobile_app_design', tags: ['mobile', 'app', 'ios', 'android', 'application', 'smartphone'], translations: [{ code: 'EN', name: 'Mobile App Design' }, { code: 'ES', name: 'Diseño de Aplicación Móvil' }, { code: 'PT', name: 'Design de Aplicativo Móvel' }] },
                { name: 'website_design', tags: ['website', 'site', 'homepage', 'ecommerce', 'wordpress', 'responsive'], translations: [{ code: 'EN', name: 'Website Design' }, { code: 'ES', name: 'Diseño de Sitio Web' }, { code: 'PT', name: 'Design de Website' }] },
                { name: 'icon_design', tags: ['icon', 'iconography', 'symbol', 'glyph', 'pictogram', 'ui-icon'], translations: [{ code: 'EN', name: 'Icon Design' }, { code: 'ES', name: 'Diseño de Iconos' }, { code: 'PT', name: 'Design de Ícones' }] },
                { name: 'dashboard_design', tags: ['dashboard', 'admin', 'panel', 'analytics', 'metrics', 'interface'], translations: [{ code: 'EN', name: 'Dashboard Design' }, { code: 'ES', name: 'Diseño de Dashboard' }, { code: 'PT', name: 'Design de Dashboard' }] },
                { name: 'game_interface_design', tags: ['game-ui', 'gaming', 'hud', 'game-design', 'interface', 'esports'], translations: [{ code: 'EN', name: 'Game Interface Design' }, { code: 'ES', name: 'Diseño de Interfaz de Juegos' }, { code: 'PT', name: 'Design de Interface de Games' }] }
            ]
        },
        {
            name: 'digital_art',
            tags: ['digital-art', 'art', 'digital', 'artist', 'artwork', 'drawing', 'creative'],
            translations: [
                { code: 'EN', name: 'Digital Art' },
                { code: 'ES', name: 'Arte Digital' },
                { code: 'PT', name: 'Arte Digital' }
            ],
            children: [
                { name: 'digital_painting', tags: ['painting', 'digital-painting', 'brush', 'photoshop', 'procreate', 'illustration'], translations: [{ code: 'EN', name: 'Digital Painting' }, { code: 'ES', name: 'Pintura Digital' }, { code: 'PT', name: 'Pintura Digital' }] },
                { name: 'pixel_art', tags: ['pixel', 'pixelart', '8bit', 'retro', 'sprite', 'game-art'], translations: [{ code: 'EN', name: 'Pixel Art' }, { code: 'ES', name: 'Arte Pixel' }, { code: 'PT', name: 'Arte Pixel' }] },
                { name: 'vector_art', tags: ['vector', 'illustrator', 'svg', 'scalable', 'geometric', 'flat'], translations: [{ code: 'EN', name: 'Vector Art' }, { code: 'ES', name: 'Arte Vectorial' }, { code: 'PT', name: 'Arte Vetorial' }] },
                { name: 'photo_manipulation', tags: ['photo-manipulation', 'photo-editing', 'photoshop', 'composite', 'retouch', 'fantasy'], translations: [{ code: 'EN', name: 'Photo Manipulation' }, { code: 'ES', name: 'Manipulación de Fotos' }, { code: 'PT', name: 'Manipulação de Fotos' }] },
                { name: 'photo_retouching', tags: ['retouching', 'photo-retouching', 'beauty', 'skin', 'correction', 'enhancement'], translations: [{ code: 'EN', name: 'Photo Retouching' }, { code: 'ES', name: 'Retoque Fotográfico' }, { code: 'PT', name: 'Retoque Fotográfico' }] },
                { name: 'matte_painting', tags: ['matte', 'environment', 'background', 'landscape', 'concept', 'scenic'], translations: [{ code: 'EN', name: 'Matte Painting' }, { code: 'ES', name: 'Matte Painting' }, { code: 'PT', name: 'Matte Painting' }] },
                { name: 'collage_art', tags: ['collage', 'mixed-media', 'composition', 'layered', 'montage', 'assemblage'], translations: [{ code: 'EN', name: 'Collage Art' }, { code: 'ES', name: 'Arte de Collage' }, { code: 'PT', name: 'Arte de Colagem' }] },
                { name: 'abstract_art', tags: ['abstract', 'modern', 'contemporary', 'expressionism', 'avant-garde', 'artistic'], translations: [{ code: 'EN', name: 'Abstract Art' }, { code: 'ES', name: 'Arte Abstracto' }, { code: 'PT', name: 'Arte Abstrata' }] },
                { name: 'generative_art', tags: ['generative', 'ai-art', 'algorithmic', 'procedural', 'code-art', 'ai-generated'], translations: [{ code: 'EN', name: 'Generative & AI Art' }, { code: 'ES', name: 'Arte Generativo e IA' }, { code: 'PT', name: 'Arte Generativa e IA' }] }
            ]
        },
        {
            name: 'illustration',
            tags: ['illustration', 'illustrator', 'drawing', 'art', 'sketch', 'design', 'creative'],
            translations: [
                { code: 'EN', name: 'Illustration' },
                { code: 'ES', name: 'Ilustración' },
                { code: 'PT', name: 'Ilustração' }
            ],
            children: [
                { name: 'character_design', tags: ['character', 'character-design', 'mascot', 'avatar', 'nft', 'game-character'], translations: [{ code: 'EN', name: 'Character Design' }, { code: 'ES', name: 'Diseño de Personajes' }, { code: 'PT', name: 'Design de Personagens' }] },
                { name: 'concept_art', tags: ['concept', 'concept-art', 'game-design', 'movie', 'entertainment', 'visdev'], translations: [{ code: 'EN', name: 'Concept Art' }, { code: 'ES', name: 'Arte Conceptual' }, { code: 'PT', name: 'Arte Conceitual' }] },
                { name: 'children_book_illustration', tags: ['children', 'kids', 'book', 'story', 'childrenbook', 'youth'], translations: [{ code: 'EN', name: 'Children Book Illustration' }, { code: 'ES', name: 'Ilustración de Libros Infantiles' }, { code: 'PT', name: 'Ilustração de Livros Infantis' }] },
                { name: 'editorial_illustration', tags: ['editorial', 'magazine', 'newspaper', 'article', 'publication', 'journalism'], translations: [{ code: 'EN', name: 'Editorial Illustration' }, { code: 'ES', name: 'Ilustración Editorial' }, { code: 'PT', name: 'Ilustração Editorial' }] },
                { name: 'technical_illustration', tags: ['technical', 'diagram', 'manual', 'instruction', 'engineering', 'blueprint'], translations: [{ code: 'EN', name: 'Technical Illustration' }, { code: 'ES', name: 'Ilustración Técnica' }, { code: 'PT', name: 'Ilustração Técnica' }] },
                { name: 'comic_art', tags: ['comic', 'comics', 'manga', 'graphic-novel', 'cartoon', 'sequential'], translations: [{ code: 'EN', name: 'Comic Art' }, { code: 'ES', name: 'Arte de Cómic' }, { code: 'PT', name: 'Arte de Quadrinhos' }] },
                { name: 'manga_anime', tags: ['manga', 'anime', 'japanese', 'otaku', 'webtoon', 'manhwa'], translations: [{ code: 'EN', name: 'Manga & Anime' }, { code: 'ES', name: 'Manga y Anime' }, { code: 'PT', name: 'Mangá e Anime' }] },
                { name: 'storyboard', tags: ['storyboard', 'film', 'animation', 'scene', 'sequence', 'preproduction'], translations: [{ code: 'EN', name: 'Storyboard' }, { code: 'ES', name: 'Storyboard' }, { code: 'PT', name: 'Storyboard' }] }
            ]
        },
        {
            name: '3d_modeling',
            tags: ['3d', '3d-modeling', 'modeling', 'blender', 'maya', 'unreal'],
            translations: [
                { code: 'EN', name: '3D Modeling' },
                { code: 'ES', name: 'Modelado 3D' },
                { code: 'PT', name: 'Modelagem 3D' }
            ],
            children: [
                { name: 'character_modeling', tags: ['character', '3d-character', 'rigging', 'topology', 'game-ready', 'sculpt'], translations: [{ code: 'EN', name: 'Character Modeling' }, { code: 'ES', name: 'Modelado de Personajes' }, { code: 'PT', name: 'Modelagem de Personagens' }] },
                { name: 'environment_modeling', tags: ['environment', 'landscape', 'scene', 'props', 'assets', 'level-design'], translations: [{ code: 'EN', name: 'Environment Modeling' }, { code: 'ES', name: 'Modelado de Entornos' }, { code: 'PT', name: 'Modelagem de Ambientes' }] },
                { name: 'product_modeling', tags: ['product', 'visualization', 'commercial', 'industrial', 'prototype', 'cad'], translations: [{ code: 'EN', name: 'Product Modeling' }, { code: 'ES', name: 'Modelado de Productos' }, { code: 'PT', name: 'Modelagem de Produtos' }] },
                { name: 'architectural_modeling', tags: ['architecture', 'building', 'interior', 'exterior', 'archviz', 'construction'], translations: [{ code: 'EN', name: 'Architectural Modeling' }, { code: 'ES', name: 'Modelado Arquitectónico' }, { code: 'PT', name: 'Modelagem Arquitetônica' }] },
                { name: '3d_rendering', tags: ['rendering', 'render', 'visualization', 'vray', 'octane', 'cycles'], translations: [{ code: 'EN', name: '3D Rendering' }, { code: 'ES', name: 'Renderizado 3D' }, { code: 'PT', name: 'Renderização 3D' }] },
                { name: 'digital_sculpting', tags: ['sculpting', 'zbrush', 'sculpture', 'organic', 'high-poly', 'detailing'], translations: [{ code: 'EN', name: 'Digital Sculpting' }, { code: 'ES', name: 'Escultura Digital' }, { code: 'PT', name: 'Escultura Digital' }] }
            ]
        },
        {
            name: 'animation',
            tags: ['animation', 'animated', 'animator', 'motion', 'cartoon', 'video', 'movement'],
            translations: [
                { code: 'EN', name: 'Animation' },
                { code: 'ES', name: 'Animación' },
                { code: 'PT', name: 'Animação' }
            ],
            children: [
                { name: '2d_animation', tags: ['2d', 'traditional', 'frame-by-frame', 'hand-drawn', 'toon', 'cartoon'], translations: [{ code: 'EN', name: '2D Animation' }, { code: 'ES', name: 'Animación 2D' }, { code: 'PT', name: 'Animação 2D' }] },
                { name: '3d_animation', tags: ['3d', 'cgi', 'computer-animation', 'pixar', 'metaverse', 'rigged'], translations: [{ code: 'EN', name: '3D Animation' }, { code: 'ES', name: 'Animación 3D' }, { code: 'PT', name: 'Animação 3D' }] },
                { name: 'motion_graphics', tags: ['motion', 'motiongraphics', 'kinetic', 'after-effects', 'typography', 'dynamic'], translations: [{ code: 'EN', name: 'Motion Graphics' }, { code: 'ES', name: 'Gráficos en Movimiento' }, { code: 'PT', name: 'Motion Graphics' }] },
                { name: 'stop_motion', tags: ['stopmotion', 'claymation', 'puppets', 'frame', 'physical', 'tangible'], translations: [{ code: 'EN', name: 'Stop Motion' }, { code: 'ES', name: 'Stop Motion' }, { code: 'PT', name: 'Stop Motion' }] },
                { name: 'whiteboard_animation', tags: ['whiteboard', 'explainer', 'educational', 'hand-drawn', 'sketch', 'presentation'], translations: [{ code: 'EN', name: 'Whiteboard Animation' }, { code: 'ES', name: 'Animación en Pizarra' }, { code: 'PT', name: 'Animação em Quadro Branco' }] },
                { name: 'explainer_video', tags: ['explainer', 'educational', 'tutorial', 'informational', 'business', 'promotional'], translations: [{ code: 'EN', name: 'Explainer Video' }, { code: 'ES', name: 'Video Explicativo' }, { code: 'PT', name: 'Vídeo Explicativo' }] }
            ]
        },
        {
            name: 'video_editing',
            tags: ['video', 'editing', 'editor', 'premiere', 'davinci-resolve', 'post-production'],
            translations: [
                { code: 'EN', name: 'Video Editing' },
                { code: 'ES', name: 'Edición de Video' },
                { code: 'PT', name: 'Edição de Vídeo' }
            ],
            children: [
                { name: 'video_production', tags: ['production', 'filming', 'cinematography', 'videographer', 'recording', 'shoot'], translations: [{ code: 'EN', name: 'Video Production' }, { code: 'ES', name: 'Producción de Video' }, { code: 'PT', name: 'Produção de Vídeo' }] },
                { name: 'color_grading', tags: ['color', 'grading', 'colorist', 'lut', 'davinci', 'correction'], translations: [{ code: 'EN', name: 'Color Grading' }, { code: 'ES', name: 'Corrección de Color' }, { code: 'PT', name: 'Correção de Cor' }] },
                { name: 'visual_effects', tags: ['vfx', 'effects', 'special-effects', 'compositing', 'cgi', 'after-effects'], translations: [{ code: 'EN', name: 'Visual Effects (VFX)' }, { code: 'ES', name: 'Efectos Visuales (VFX)' }, { code: 'PT', name: 'Efeitos Visuais (VFX)' }] },
                { name: 'video_intro_outro', tags: ['intro', 'outro', 'opening', 'closing', 'title', 'branding'], translations: [{ code: 'EN', name: 'Video Intro & Outro' }, { code: 'ES', name: 'Intro y Outro de Video' }, { code: 'PT', name: 'Intro e Outro de Vídeo' }] },
                { name: 'promotional_video', tags: ['promo', 'promotional', 'advertising', 'commercial', 'marketing', 'ad'], translations: [{ code: 'EN', name: 'Promotional Video' }, { code: 'ES', name: 'Video Promocional' }, { code: 'PT', name: 'Vídeo Promocional' }] },
                { name: 'music_video', tags: ['music', 'musicvideo', 'song', 'artist', 'band', 'performance'], translations: [{ code: 'EN', name: 'Music Video' }, { code: 'ES', name: 'Video Musical' }, { code: 'PT', name: 'Vídeo Musical' }] }
            ]
        },
        {
            name: 'filmmaking',
            tags: ['film', 'filmmaking', 'cinema', 'movie', 'director', 'indie-film'],
            translations: [
                { code: 'EN', name: 'Filmmaking' },
                { code: 'ES', name: 'Cinematografía' },
                { code: 'PT', name: 'Produção Cinematográfica' }
            ],
            children: [
                { name: 'screenwriting', tags: ['screenwriting', 'script', 'screenplay', 'scriptwriting', 'storytelling', 'writer'], translations: [{ code: 'EN', name: 'Screenwriting' }, { code: 'ES', name: 'Guionismo' }, { code: 'PT', name: 'Roteiro' }] },
                { name: 'film_directing', tags: ['directing', 'director', 'filmmaking', 'vision', 'creative-direction', 'set'], translations: [{ code: 'EN', name: 'Film Directing' }, { code: 'ES', name: 'Dirección de Cine' }, { code: 'PT', name: 'Direção de Cinema' }] },
                { name: 'cinematography', tags: ['cinematography', 'camera', 'dop', 'lighting', 'cinematographer', 'camera-work'], translations: [{ code: 'EN', name: 'Cinematography' }, { code: 'ES', name: 'Cinematografía' }, { code: 'PT', name: 'Cinematografia' }] },
                { name: 'film_production', tags: ['production', 'producer', 'filmmaking', 'pre-production', 'post-production', 'managing'], translations: [{ code: 'EN', name: 'Film Production' }, { code: 'ES', name: 'Producción Cinematográfica' }, { code: 'PT', name: 'Produção de Filmes' }] },
                { name: 'documentary', tags: ['documentary', 'non-fiction', 'real-life', 'journalism', 'factual', 'investigation'], translations: [{ code: 'EN', name: 'Documentary' }, { code: 'ES', name: 'Documental' }, { code: 'PT', name: 'Documentário' }] },
                { name: 'short_film', tags: ['short-film', 'short', 'independent', 'festival', 'narrative', 'storytelling'], translations: [{ code: 'EN', name: 'Short Film' }, { code: 'ES', name: 'Cortometraje' }, { code: 'PT', name: 'Curta-Metragem' }] },
                { name: 'sound_design', tags: ['sound', 'audio', 'foley', 'sound-effects', 'sfx', 'audio-mixing'], translations: [{ code: 'EN', name: 'Sound Design' }, { code: 'ES', name: 'Diseño de Sonido' }, { code: 'PT', name: 'Design de Som' }] },
                { name: 'film_editing', tags: ['editing', 'editor', 'montage', 'cutting', 'final-cut', 'premiere'], translations: [{ code: 'EN', name: 'Film Editing' }, { code: 'ES', name: 'Edición Cinematográfica' }, { code: 'PT', name: 'Edição de Cinema' }] }
            ]
        },
        {
            name: 'traditional_art',
            tags: ['traditional', 'art', 'handmade', 'physical', 'fine-art', 'analog'],
            translations: [
                { code: 'EN', name: 'Traditional Art' },
                { code: 'ES', name: 'Arte Tradicional' },
                { code: 'PT', name: 'Arte Tradicional' }
            ],
            children: [
                { name: 'painting', tags: ['painting', 'paint', 'canvas', 'fine-art', 'brush', 'artwork'], translations: [{ code: 'EN', name: 'Painting' }, { code: 'ES', name: 'Pintura' }, { code: 'PT', name: 'Pintura' }] },
                { name: 'drawing', tags: ['drawing', 'pencil', 'sketch', 'line-art', 'graphite', 'pen'], translations: [{ code: 'EN', name: 'Drawing' }, { code: 'ES', name: 'Dibujo' }, { code: 'PT', name: 'Desenho' }] },
                { name: 'watercolor', tags: ['watercolor', 'watercolour', 'aquarelle', 'wash', 'transparent', 'fluid'], translations: [{ code: 'EN', name: 'Watercolor' }, { code: 'ES', name: 'Acuarela' }, { code: 'PT', name: 'Aquarela' }] },
                { name: 'oil_painting', tags: ['oil', 'oil-painting', 'classical', 'realistic', 'traditional', 'canvas'], translations: [{ code: 'EN', name: 'Oil Painting' }, { code: 'ES', name: 'Pintura al Óleo' }, { code: 'PT', name: 'Pintura a Óleo' }] },
                { name: 'acrylic_painting', tags: ['acrylic', 'acrylic-painting', 'modern', 'vibrant', 'colorful', 'paint'], translations: [{ code: 'EN', name: 'Acrylic Painting' }, { code: 'ES', name: 'Pintura Acrílica' }, { code: 'PT', name: 'Pintura Acrílica' }] },
                { name: 'sketch', tags: ['sketch', 'sketching', 'draft', 'preliminary', 'quick', 'study'], translations: [{ code: 'EN', name: 'Sketch' }, { code: 'ES', name: 'Boceto' }, { code: 'PT', name: 'Esboço' }] },
                { name: 'charcoal_art', tags: ['charcoal', 'charcoal-drawing', 'monochrome', 'dark', 'dramatic', 'expressive'], translations: [{ code: 'EN', name: 'Charcoal Art' }, { code: 'ES', name: 'Arte con Carboncillo' }, { code: 'PT', name: 'Arte com Carvão' }] },
                { name: 'pastel_art', tags: ['pastel', 'soft-pastel', 'chalk', 'color', 'portrait', 'delicate'], translations: [{ code: 'EN', name: 'Pastel Art' }, { code: 'ES', name: 'Arte con Pastel' }, { code: 'PT', name: 'Arte em Pastel' }] }
            ]
        },
        {
            name: 'typography',
            tags: ['typography', 'type', 'font', 'lettering', 'typeface', 'text', 'letters'],
            translations: [
                { code: 'EN', name: 'Typography' },
                { code: 'ES', name: 'Tipografía' },
                { code: 'PT', name: 'Tipografia' }
            ],
            children: [
                { name: 'font_design', tags: ['font', 'typeface', 'type-design', 'glyphs', 'custom-font', 'fonts'], translations: [{ code: 'EN', name: 'Font Design' }, { code: 'ES', name: 'Diseño de Fuentes' }, { code: 'PT', name: 'Design de Fontes' }] },
                { name: 'calligraphy', tags: ['calligraphy', 'handwriting', 'script', 'elegant', 'cursive', 'pen'], translations: [{ code: 'EN', name: 'Calligraphy' }, { code: 'ES', name: 'Caligrafía' }, { code: 'PT', name: 'Caligrafia' }] },
                { name: 'hand_lettering', tags: ['lettering', 'hand-lettering', 'custom', 'handwritten', 'artistic', 'unique'], translations: [{ code: 'EN', name: 'Hand Lettering' }, { code: 'ES', name: 'Lettering a Mano' }, { code: 'PT', name: 'Lettering à Mão' }] },
                { name: 'typeface_design', tags: ['typeface', 'font-family', 'type-system', 'typography', 'design', 'characters'], translations: [{ code: 'EN', name: 'Typeface Design' }, { code: 'ES', name: 'Diseño de Tipografía' }, { code: 'PT', name: 'Design de Tipografia' }] }
            ]
        },
        {
            name: 'spatial_design',
            tags: ['spatial', 'environmental', 'experiential', 'physical', 'space', 'exhibition'],
            translations: [
                { code: 'EN', name: 'Spatial & Environmental Design' },
                { code: 'ES', name: 'Diseño Espacial y Ambiental' },
                { code: 'PT', name: 'Design Espacial e Ambiental' }
            ],
            children: [
                { name: 'environmental_design', tags: ['environmental', 'space', 'wayfinding', 'signage', 'public-space', 'architecture'], translations: [{ code: 'EN', name: 'Environmental Design' }, { code: 'ES', name: 'Diseño Ambiental' }, { code: 'PT', name: 'Design Ambiental' }] },
                { name: 'wayfinding_signage', tags: ['wayfinding', 'signage', 'navigation', 'signs', 'directional', 'orientation'], translations: [{ code: 'EN', name: 'Wayfinding & Signage' }, { code: 'ES', name: 'Señalización y Orientación' }, { code: 'PT', name: 'Sinalização e Orientação' }] },
                { name: 'exhibition_design', tags: ['exhibition', 'museum', 'gallery', 'display', 'installation', 'showcase'], translations: [{ code: 'EN', name: 'Exhibition Design' }, { code: 'ES', name: 'Diseño de Exposiciones' }, { code: 'PT', name: 'Design de Exposições' }] },
                { name: 'trade_show_design', tags: ['trade-show', 'booth', 'stand', 'fair', 'expo', 'event-design'], translations: [{ code: 'EN', name: 'Trade Show Design' }, { code: 'ES', name: 'Diseño de Stands' }, { code: 'PT', name: 'Design de Estandes' }] },
                { name: 'experiential_design', tags: ['experiential', 'immersive', 'interactive', 'experience', 'engagement', 'activation'], translations: [{ code: 'EN', name: 'Experiential Design' }, { code: 'ES', name: 'Diseño Experiencial' }, { code: 'PT', name: 'Design Experiencial' }] }
            ]
        },
        {
            name: 'fashion_design',
            tags: ['fashion', 'clothing', 'garments', 'apparel', 'designer', 'couture'],
            translations: [
                { code: 'EN', name: 'Fashion Design' },
                { code: 'ES', name: 'Diseño de Moda' },
                { code: 'PT', name: 'Design de Moda' }
            ],
            children: [
                { name: 'clothing_design', tags: ['clothing', 'garment', 'fashion', 'patterns', 'tailoring', 'sewing'], translations: [{ code: 'EN', name: 'Clothing Design' }, { code: 'ES', name: 'Diseño de Ropa' }, { code: 'PT', name: 'Design de Roupas' }] },
                { name: 'fashion_illustration', tags: ['fashion-illustration', 'sketches', 'croquis', 'runway', 'designer', 'style'], translations: [{ code: 'EN', name: 'Fashion Illustration' }, { code: 'ES', name: 'Ilustración de Moda' }, { code: 'PT', name: 'Ilustração de Moda' }] },
                { name: 'textile_design', tags: ['textile', 'fabric', 'print', 'pattern', 'surface-design', 'material'], translations: [{ code: 'EN', name: 'Textile Design' }, { code: 'ES', name: 'Diseño Textil' }, { code: 'PT', name: 'Design Têxtil' }] },
                { name: 'accessories_design', tags: ['accessories', 'bags', 'shoes', 'jewelry', 'fashion', 'luxury'], translations: [{ code: 'EN', name: 'Accessories Design' }, { code: 'ES', name: 'Diseño de Accesorios' }, { code: 'PT', name: 'Design de Acessórios' }] },
                { name: 'sustainable_fashion', tags: ['sustainable', 'eco-fashion', 'ethical', 'green', 'recycled', 'organic'], translations: [{ code: 'EN', name: 'Sustainable Fashion' }, { code: 'ES', name: 'Moda Sostenible' }, { code: 'PT', name: 'Moda Sustentável' }] },
                { name: 'streetwear_design', tags: ['streetwear', 'urban', 'casual', 'hype', 'sneakers', 'street-fashion'], translations: [{ code: 'EN', name: 'Streetwear Design' }, { code: 'ES', name: 'Diseño de Ropa Urbana' }, { code: 'PT', name: 'Design de Streetwear' }] }
            ]
        },
        {
            name: 'street_urban_art',
            tags: ['street-art', 'urban', 'graffiti', 'murals', 'public-art', 'walls'],
            translations: [
                { code: 'EN', name: 'Street & Urban Art' },
                { code: 'ES', name: 'Arte Urbano y Callejero' },
                { code: 'PT', name: 'Arte Urbana e de Rua' }
            ],
            children: [
                { name: 'mural_painting', tags: ['mural', 'wall-art', 'large-scale', 'public', 'painting', 'outdoor'], translations: [{ code: 'EN', name: 'Mural Painting' }, { code: 'ES', name: 'Pintura Mural' }, { code: 'PT', name: 'Pintura Mural' }] },
                { name: 'graffiti_art', tags: ['graffiti', 'spray-paint', 'street', 'urban', 'tag', 'bombing'], translations: [{ code: 'EN', name: 'Graffiti Art' }, { code: 'ES', name: 'Arte de Graffiti' }, { code: 'PT', name: 'Arte de Grafite' }] },
                { name: 'street_art', tags: ['street-art', 'urban-art', 'public', 'stencil', 'installation', 'contemporary'], translations: [{ code: 'EN', name: 'Street Art' }, { code: 'ES', name: 'Arte Callejero' }, { code: 'PT', name: 'Arte de Rua' }] },
                { name: 'stencil_art', tags: ['stencil', 'spray', 'template', 'urban', 'banksy', 'street'], translations: [{ code: 'EN', name: 'Stencil Art' }, { code: 'ES', name: 'Arte con Plantilla' }, { code: 'PT', name: 'Arte de Estêncil' }] }
            ]
        },
        {
            name: 'tattoo_body_art',
            tags: ['tattoo', 'ink', 'body-art', 'tattooing', 'tattoos', 'artist'],
            translations: [
                { code: 'EN', name: 'Tattoo & Body Art' },
                { code: 'ES', name: 'Tatuaje y Arte Corporal' },
                { code: 'PT', name: 'Tatuagem e Arte Corporal' }
            ],
            children: [
                { name: 'tattoo_design', tags: ['tattoo', 'ink', 'design', 'flash', 'custom', 'artist'], translations: [{ code: 'EN', name: 'Tattoo Design' }, { code: 'ES', name: 'Diseño de Tatuajes' }, { code: 'PT', name: 'Design de Tatuagem' }] },
                { name: 'traditional_tattoo', tags: ['traditional', 'old-school', 'americana', 'classic', 'bold', 'sailor'], translations: [{ code: 'EN', name: 'Traditional Tattoo' }, { code: 'ES', name: 'Tatuaje Tradicional' }, { code: 'PT', name: 'Tatuagem Tradicional' }] },
                { name: 'realism_tattoo', tags: ['realism', 'realistic', 'portrait', 'photorealistic', 'detailed', 'black-grey'], translations: [{ code: 'EN', name: 'Realism Tattoo' }, { code: 'ES', name: 'Tatuaje Realista' }, { code: 'PT', name: 'Tatuagem Realista' }] },
                { name: 'japanese_tattoo', tags: ['japanese', 'irezumi', 'oriental', 'traditional-japanese', 'dragon', 'koi'], translations: [{ code: 'EN', name: 'Japanese Tattoo' }, { code: 'ES', name: 'Tatuaje Japonés' }, { code: 'PT', name: 'Tatuagem Japonesa' }] },
                { name: 'minimalist_tattoo', tags: ['minimalist', 'minimal', 'fine-line', 'simple', 'small', 'delicate'], translations: [{ code: 'EN', name: 'Minimalist Tattoo' }, { code: 'ES', name: 'Tatuaje Minimalista' }, { code: 'PT', name: 'Tatuagem Minimalista' }] },
                { name: 'watercolor_tattoo', tags: ['watercolor', 'colorful', 'artistic', 'painterly', 'abstract', 'splashes'], translations: [{ code: 'EN', name: 'Watercolor Tattoo' }, { code: 'ES', name: 'Tatuaje Acuarela' }, { code: 'PT', name: 'Tatuagem Aquarela' }] }
            ]
        },
        {
            name: 'crafts',
            tags: ['crafts', 'handmade', 'artisan', 'diy', 'handcrafted', 'maker', 'creative'],
            translations: [
                { code: 'EN', name: 'Crafts & Handmade' },
                { code: 'ES', name: 'Artesanías y Manualidades' },
                { code: 'PT', name: 'Artesanato e Feito à Mão' }
            ],
            children: [
                { name: 'jewelry_design', tags: ['jewelry', 'jewellery', 'accessories', 'handmade', 'artisan', 'wearable'], translations: [{ code: 'EN', name: 'Jewelry Design' }, { code: 'ES', name: 'Diseño de Joyería' }, { code: 'PT', name: 'Design de Joias' }] },
                { name: 'textile_art', tags: ['textile', 'fabric', 'weaving', 'embroidery', 'fiber', 'cloth'], translations: [{ code: 'EN', name: 'Textile Art' }, { code: 'ES', name: 'Arte Textil' }, { code: 'PT', name: 'Arte Têxtil' }] },
                { name: 'ceramics', tags: ['ceramics', 'pottery', 'clay', 'porcelain', 'kiln', 'handmade'], translations: [{ code: 'EN', name: 'Ceramics' }, { code: 'ES', name: 'Cerámica' }, { code: 'PT', name: 'Cerâmica' }] },
                { name: 'woodworking', tags: ['woodworking', 'wood', 'carpentry', 'furniture', 'craft', 'carving'], translations: [{ code: 'EN', name: 'Woodworking' }, { code: 'ES', name: 'Carpintería' }, { code: 'PT', name: 'Carpintaria' }] },
                { name: 'sculpture', tags: ['sculpture', 'sculpting', '3d', 'statue', 'carving', 'art'], translations: [{ code: 'EN', name: 'Sculpture' }, { code: 'ES', name: 'Escultura' }, { code: 'PT', name: 'Escultura' }] },
                { name: 'paper_craft', tags: ['paper', 'papercraft', 'origami', 'card-making', 'scrapbook', 'cardstock'], translations: [{ code: 'EN', name: 'Paper Craft' }, { code: 'ES', name: 'Manualidades de Papel' }, { code: 'PT', name: 'Artesanato de Papel' }] }
            ]
        }
    ];

  await Query.table('categories').delete();

  await Promise.all(categories.map(async(category)=>{
   const parentCategory = await  Query.table('categories').insertAndGet(['name','tags'],[category.name,category.tags.join(',')],'id');
        await Promise.all(category.children.map(async (child)=>{
            await  Query.table('categories').insertAndGet(['name','tags','parent_id'],[child.name,child.tags.join(','),parentCategory.id],'id');
        }))
  }))
};
