import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { AI_QUEUE, MAX_TAGS_MEDIA } from '@repo/common-lib/constants/constants';
import { QueueHelper } from '@repo/backend-lib/utils';
import { openAiLLMConfig } from 'src/config/llm';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import {
  GenerateEntityMetadataResponse,
  GenerateMediaMetadataResponse,
  MediaMetadataPromptCategory,
  MediaSeoTranslation,
  SeoTranslation,
} from '@repo/common-lib/types/ai';
import { EnumType, MODERATION_SEVERITY } from '@repo/common-lib/constants/enums';
import { FullPortfolio } from '@repo/common-lib/types/portfolio';
import { MediaPortfolio } from '@repo/common-lib/types/media';
import { FullCollection } from '@repo/common-lib/types/collection';
import { FullService } from '@repo/common-lib/types/service';
import { UserProfile } from '@repo/common-lib/types/user';
import { Helpers } from 'src/common/services/helpers.service';

const ENTITY_SEO_TITLE_MAX = 70;
const ENTITY_SEO_DESCRIPTION_MAX = 160;
const ENTITY_MEDIA_CONTEXT_CAP = 24;
const MEDIA_SEO_TITLE_MAX = 60;
const MEDIA_SEO_DESCRIPTION_MAX = 160;
const MEDIA_SEO_ALT_MAX = 125;
const MEDIA_SEO_FILENAME_MAX = 100;

/** App languages we generate SEO for, in one multilingual call. Matches i18n `LANGUAGE_CODE`. */
const SEO_LOCALES: EnumType<'LANGUAGE_CODE'>[] = ['EN', 'ES', 'PT'];

/** Minimal artist signals injected into entity SEO prompts so titles can lead with discipline + city. */
type ArtistSeoContext = {
  display_name: string | null;
  profession: string | null;
  city: string | null;
  region: string | null;
};

/**
 * What the artist contributes to a portfolio/collection prompt: WHO they are, never WHERE they are.
 * A portfolio is not the artist — a drone-shot series by a Madrid-based artist is not "in Madrid" —
 * so the location is dropped from the payload entirely rather than merely discouraged in the prompt.
 */
type ArtistSeoIdentity = Pick<ArtistSeoContext, 'display_name' | 'profession'>;

const artistIdentity = ({ display_name, profession }: ArtistSeoContext): ArtistSeoIdentity => ({
  display_name,
  profession,
});

/**
 * The text signals one image contributes to its portfolio/collection prompt. `seo_alt` matters most:
 * it is the plain literal description of what is actually in the frame, so it grounds the entity's
 * SEO in real subject matter instead of leaving the model to guess a theme.
 */
const mediaSignals = (m: MediaPortfolio) => ({
  title: m.title ?? null,
  seo_title: m.seo_title ?? null,
  seo_description: m.seo_description ?? null,
  seo_alt: m.seo_alt ?? null,
});

/** Shared instruction block kept as a STABLE prefix so OpenAI prompt-caching can discount batch runs. */
const SEO_SYSTEM_PROMPT =
  'You are an SEO copywriter for an online art marketplace. You write metadata that ranks in Google (and Google Images) and also reads like art-world writing. You write it in every requested language. Output valid JSON only. No extra text.';

/**
 * Quality rules shared by media + entity prompts (kept identical so caching stays effective).
 * Deliberately LOCATION-NEUTRAL: place handling differs per entity and is appended via
 * `SEO_EXTRA_INFO`, so nothing here may nudge the model toward naming a city.
 */
const SEO_QUALITY_RULES = `Quality rules (apply to every language):
        - FRONT-LOAD the primary keyword; art-catalog voice. Priority of signals: art style → discipline/medium → subject.
        - Real searchable terms first; evocative but NEVER keyword-stuffed. Write natural, human, art-world prose — never repeat the same word/phrase to try to rank; each word must earn its place.
        - NEVER include: the platform/brand name, the artist's username/handle/login, or filler words used as padding ("portfolio", "gallery", "collection", "photo").
        - If provided title/description look like placeholder, lorem, or non-descriptive text, IGNORE them and build from the real signals (style, discipline, subject, categories).
        - The artist's real name may appear only at the end, and only if it is a real personal name (not a handle).
        - Do NOT invent a style, medium, or subject that is not clearly present. When unsure, stay generic and honest — but ALWAYS return a real, descriptive phrase (never "untitled", "n/a", or a placeholder).
        - Every field is PLAIN TEXT: no quotes, JSON, HTML, markdown, or emoji inside the value.
        - No profanity, slurs, or offensive language — this text is public and indexed.
        Good title examples: "Minimalist Logo & Brand Design", "Analog Portrait Photography", "Brutalist Architecture Photography", "Fine-Art Wedding Photography".`;

/**
 * Per-entity instructions appended to the shared rules. A work's location and its AUTHOR's location
 * are different facts: a portfolio/collection is about its own content, while a service and an artist
 * profile are sold and searched locally ("wedding photographer in Madrid") — so only those two may
 * use the artist's city.
 */
const SEO_EXTRA_INFO = {
  portfolio: `Portfolio specifics:
        - A portfolio is an artist's curated BEST-OF within ONE discipline or style, gathered from many different projects — a "Wedding Photography" portfolio holds the strongest shots from every wedding they ever shot. Clients read it to judge skill and decide whether to hire.
        - So write a DISCIPLINE/STYLE page, not one shoot: read the media (titles, descriptions, alt) and the categories, and name the craft and style they have IN COMMON. Never describe a single image.
        - LOCATION: never name a city, region or country unless it appears literally in this portfolio's own title or description. There is no location in CONTEXT and you must not infer one — not from the artist, the language, the style or the subject. Aerial, landscape or studio work is not "in" anywhere. No place at all is the correct, expected outcome.
        - seo_title: start from the portfolio's own title when it is descriptive, then say what the work IS. Shape: "<title> — <medium/subject>", optionally "by <artist real name>" at the end. If the title is generic ("My Work", "Portfolio 1"), ignore it and build from the categories and media instead.
        - seo_description: one or two sentences summarizing the body of work — recurring subject, medium/technique, and the mood a visitor will actually see. Concrete nouns over adjectives; no calls to action.
        Good: "Above the Coast — Aerial Drone Photography by Jhon Doe" / "Analog portraits on 35mm film, close-framed and grain-heavy, lit by soft window light."
        Bad: "Aerial Photography in Madrid — Minimalist Views" (invented a city that appears nowhere in CONTEXT).`,
  collection: `Collection specifics:
        - A collection is ONE project, event or session kept together — "Maria & João Wedding 2024" holds the photos delivered from that single shoot. The artist's portfolio is the curated best-of across many projects; this is the record of one of them.
        - So stay SPECIFIC: keep the identity in its own title (client or event name, year) and describe THIS occasion. Do not generalize it into a discipline page — the portfolio already owns the broad term, and the two pages must not compete for the same search.
        - Its SEO otherwise comes from the media: read their titles, descriptions and alt, and name the thread that ties them together.
        - LOCATION: never name a city, region or country unless it appears literally in this collection's own title or description. Do not infer one. No place at all is the correct outcome.
        - seo_title: keep the specific project identity, then what the set shows. If the title is generic, build from the media instead.
        - seo_description: one or two sentences on the shared subject, medium and mood of this one project.`,
  service: `Service specifics:
        - This is something a client HIRES: write for commercial intent — what is delivered, for whom.
        - LOCATION: artist.city / artist.region are REAL signals here (services are searched locally). Use them when present, placed naturally at the end. Never invent a place; omit it when both are empty.
        Good: "Fine-Art Wedding Photography in Tuscany", "Brutalist Architecture Photography — Madrid".`,
  user: `Artist profile specifics:
        - This page IS the artist, so the shared rule about keeping the real name to the end does NOT apply: LEAD with their real name — it is the entity being searched for.
        - LOCATION IS REQUIRED here. Artists are hired locally, so the title must ALWAYS end with artist.city (fall back to artist.region). Omit the place ONLY when both are empty — and never invent one.
        - seo_title shape: "<Real Name> — <Discipline/Speciality> in <City>". Name the speciality the way a client would search for it, using profession + categories.
        - If there is no real personal name, lead with the speciality instead and keep the city: "<Discipline/Speciality> in <City>".
        - seo_description: one or two sentences — what they make, who they make it for, and where they work. Grounded in the biography and categories; never invented.
        Good: "Jhon Doe — Motion Graphics Designer in Madrid", "Maria Silva — Analog Portrait Photographer in Lisbon".`,
  media: `Image specifics:
        - LOCATION: include a specific place ONLY when it is unmistakably identifiable in the image itself (a landmark you can actually name). Never infer one from anything else.`,
} as const;

/**
 * Junk only when it is the WHOLE value — matching these as substrings would wrongly reject legitimate
 * text (art literally titled "Untitled …", Spanish/Portuguese "todo", "for example" in prose).
 */
const SEO_WHOLE_JUNK = new Set([
  'untitled', 'na', 'n/a', 'tbd', 'todo', 'unknown', 'none', 'null', 'test',
  'sin titulo', 'sin título', 'sem titulo', 'sem título',
]);

/** Unambiguous echoed-instruction / placeholder fragments — safe to match anywhere in the value. */
const SEO_ECHO_RE =
  /lorem ipsum|placeholder|seo[- ]?(title|description|alt)|(your|the)\s+(title|text|description)\s+here|description here/i;

/** Strong profanity / slurs (en/es/pt), whole-token match. Ambiguous accent-collision words are omitted on purpose. */
const SEO_PROFANITY = new Set([
  // en
  'fuck', 'fucking', 'motherfucker', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'dick', 'pussy',
  'slut', 'whore', 'nigger', 'faggot', 'retard',
  // es
  'mierda', 'puta', 'puto', 'cabron', 'cabrón', 'gilipollas', 'joder', 'polla', 'maricon', 'maricón',
  // pt
  'merda', 'caralho', 'porra', 'buceta', 'foder', 'viado', 'corno',
]);

/** Common words (len ≥ 4, en/es/pt) excluded from the stuffing frequency check so they don't false-trigger. */
const SEO_STOPWORDS = new Set([
  'with', 'from', 'this', 'that', 'your', 'into', 'style', 'para', 'como', 'este', 'esta', 'sobre',
  'dos', 'das', 'uma', 'com', 'and', 'the', 'for',
]);

@Injectable()
export class AiService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'ai',
    name: 'ai',
    callback: {
      channel: 'ai/error',
      callback: Helpers.callback500ErrorMail,
    },
  });

  constructor(
    private readonly llmService: LLMService,
    @InjectQueue(AI_QUEUE) private readonly aiQueue: Queue,
  ) { }

  /**
   * Generate SEO metadata for a media image in ALL app languages (EN/ES/PT) plus category tags,
   * in ONE multilingual call. The image is analyzed once (billed once) and rendered per locale, so
   * covering 3 languages costs ~1.1–1.3× a single language instead of 3×.
   * `seo_filename` is language-neutral (one physical file); `category_ids` are language-independent.
   */
  public async generateMediaMetadata(
    mediaUrl: string,
    categories: MediaMetadataPromptCategory[],
    meta: { media_id: number; user_id: number },
  ): Promise<GenerateMediaMetadataResponse> {
    try {

      const categoriesForPrompt = categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type.toLowerCase(),
      }));

      const localesShape = SEO_LOCALES.map(
        (l) => `"${l}": { "seo_title": "", "seo_description": "", "seo_alt": "" }`,
      ).join(', ');

      const result = await this.llmService.complete({
        messages: [
          { role: 'system', content: SEO_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text' as const,
                text: `Analyze the image ONCE, then return valid JSON with EXACTLY this shape:
        { "seo_filename": "", "category_ids": [], "translations": { ${localesShape} } }

        Field rules:
        - seo_filename: ≤${MEDIA_SEO_FILENAME_MAX} chars, lowercase, hyphens instead of spaces, only letters/numbers/"-"/"_", keyword-rich. LANGUAGE-NEUTRAL (universal/English terms) — ONE value shared by all locales.
        - category_ids: ids from the CATEGORIES list below (each item has a "type"). Include:
            · every DISCIPLINE and ART_STYLE that genuinely applies (no cap), AND
            · up to ${MAX_TAGS_MEDIA} TAGS describing concrete things clearly VISIBLE in the image — subject (people, dog, car), scene/place (city, beach, street), setting/light (night, sunset, studio), or mood (moody, serene).
          Only ids from the list. Never invent. Do not over-tag: pick TAGS only when clearly present. Empty array if none.
        - translations: for EACH locale key (${SEO_LOCALES.join(', ')}), written IN THAT LANGUAGE:
            · seo_title: ≤${MEDIA_SEO_TITLE_MAX} chars.
            · seo_description: ≤${MEDIA_SEO_DESCRIPTION_MAX} chars, compelling + search-intent aligned, gallery-caption tone.
            · seo_alt: ≤${MEDIA_SEO_ALT_MAX} chars, PLAIN literal accessibility description of the actual content (not artistic).

        ${SEO_QUALITY_RULES}

        ${SEO_EXTRA_INFO.media}

        CATEGORIES:
        ${JSON.stringify(categoriesForPrompt)}

        Base everything on the image only. Ignore filename, metadata, and URL. Include a specific color/placement ONLY when clearly identifiable; never invent one.`,
              },
              { type: 'image_url' as const, image_url: { url: mediaUrl } },
            ],
          },
        ],
        temperature: 0.4,
      });

      let seoFilename: string | null = null;
      let categoryIds: number[] = [];
      let translations: MediaSeoTranslation[] = [];
      let matchesExpectedResponse = false;

      try {
        const parsed = this.parseLlmJson(result.text);

        seoFilename = this.clamp(parsed.seo_filename ?? parsed.filename, MEDIA_SEO_FILENAME_MAX);

        const typeById = new Map(categories.map((c) => [c.id, c.type]));
        const validCategoryIds = Array.isArray(parsed.category_ids)
          ? [
            ...new Set(
              (parsed.category_ids as unknown[])
                .map((n) => Number(n))
                .filter((n): n is number => Number.isInteger(n) && typeById.has(n)),
            ),
          ]
          : [];
        // Disciplines/styles are uncapped; TAGS are capped so the pivot + JSON-LD keywords stay tight.
        const tagIds = validCategoryIds.filter((id) => typeById.get(id) === 'TAGS');
        const nonTagIds = validCategoryIds.filter((id) => typeById.get(id) !== 'TAGS');
        categoryIds = [...nonTagIds, ...tagIds.slice(0, MAX_TAGS_MEDIA)];

        translations = this.buildMediaTranslations(parsed.translations);
        matchesExpectedResponse = translations.some((t) => !!(t.seo_title || t.seo_description));
      } catch (err) {
        this.logger.name('generate-media-metadata').warn('AI returned invalid JSON', {
          media_id: meta.media_id,
          user_id: meta.user_id,
          response_text: result.text,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      await this.emitUsage({
        tokens: result.usage?.totalTokens,
        user_id: meta.user_id,
        usage_type: 'GENERATE_MEDIA_METADATA',
        matches_expected_response: matchesExpectedResponse,
      });

      this.logger
        .name('generate-media-metadata')
        .info('Successfully generated media metadata for user ' + meta.user_id);

      return { seo_filename: seoFilename, category_ids: categoryIds, translations, usage: result.usage };
    } catch (error) {
      this.logger
        .channel('ai/error')
        .name('generate-media-metadata')
        .error(
          `Failed to generate media metadata for media_id [${meta.media_id}] and user [${meta.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }

  /**
   * Generate SEO (all locales) for a portfolio from its own text context: title, description,
   * categories, media and collections. The artist's location is deliberately excluded — a portfolio
   * is about its content, not about where its author happens to live.
   */
  public async generatePortfolioMetadata(
    portfolio: FullPortfolio,
    artist: ArtistSeoContext,
    meta: { portfolio_id: number; user_id: number },
  ): Promise<GenerateEntityMetadataResponse> {
    const context = {
      artist: artistIdentity(artist),
      title: portfolio.title,
      description: portfolio.description ?? null,
      categories: portfolio.categories.map((c) => ({
        name: c.name,
        type: c.type.toLowerCase(),
      })),
      // Direct media + the media inside its collections. Deduped by id: the same image can sit in
      // both, and a repeat would burn one of the limited context slots for no extra signal.
      media: [...portfolio.media, ...portfolio.collections.flatMap((c) => c.media)]
        .filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i)
        .slice(0, ENTITY_MEDIA_CONTEXT_CAP)
        .map(mediaSignals),

    };

    return this.generateEntityMetadata({
      entityLabel: 'portfolio',
      logName: 'generate-portfolio-metadata',
      usageType: 'GENERATE_PORTFOLIO_METADATA',
      extraInfo: SEO_EXTRA_INFO.portfolio,
      context,
      meta: { user_id: meta.user_id, entity_id: meta.portfolio_id, entity_id_key: 'portfolio_id' },
    });
  }

  /**
   * Generate SEO (all locales) for a collection from its own text context: title, description and the
   * media it holds. Like a portfolio, a collection carries no location of its own.
   */
  public async generateCollectionMetadata(
    collection: FullCollection,
    artist: ArtistSeoContext,
    meta: { collection_id: number; user_id: number },
  ): Promise<GenerateEntityMetadataResponse> {
    const context = {
      artist: artistIdentity(artist),
      title: collection.title,
      description: collection.description ?? null,
      media: collection.media.slice(0, ENTITY_MEDIA_CONTEXT_CAP).map(mediaSignals),
    };

    return this.generateEntityMetadata({
      entityLabel: 'collection',
      logName: 'generate-collection-metadata',
      usageType: 'GENERATE_COLLECTION_METADATA',
      extraInfo: SEO_EXTRA_INFO.collection,
      context,
      meta: { user_id: meta.user_id, entity_id: meta.collection_id, entity_id_key: 'collection_id' },
    });
  }

  /** Generate SEO (all locales) for a service from its text context. Services are searched locally,
   * so `artist.city`/`region` stay in the payload as legitimate signals. */
  public async generateServiceMetadata(
    service: FullService,
    artist: ArtistSeoContext,
    meta: { service_id: number; user_id: number },
  ): Promise<GenerateEntityMetadataResponse> {
    const context = {
      artist,
      title: service.title,
      description: service.description ?? null,
      price: service.show_price ? (service.price ?? null) : null,
      show_price: service.show_price,
      features: service.features.map((f) => f.title),
      terms: service.terms.map((t) => t.title),
      portfolio: service.portfolio
        ? { title: service.portfolio.title }
        : null,
    };

    return this.generateEntityMetadata({
      entityLabel: 'service',
      logName: 'generate-service-metadata',
      usageType: 'GENERATE_SERVICE_METADATA',
      extraInfo: SEO_EXTRA_INFO.service,
      context,
      meta: { user_id: meta.user_id, entity_id: meta.service_id, entity_id_key: 'service_id' },
    });
  }

  /** Generate SEO (all locales) for an artist profile from its own text context. This IS the artist,
   * so their city is a real signal here. */
  public async generateUserMetadata(
    profile: UserProfile,
    meta: { user_id: number },
  ): Promise<GenerateEntityMetadataResponse> {
    const context = {
      artist: {
        display_name:
          [profile.name, profile.surname].filter(Boolean).join(' ') || null,
        profession: profile.profession ?? null,
        city: profile.address?.city ?? null,
        region: profile.address?.state ?? null,
      },
      short_biography: profile.short_biography ?? null,
      biography: profile.biography ?? null,
      categories: profile.categories.map((c) => ({
        name: c.name,
        type: c.type.toLowerCase(),
      })),
    };

    return this.generateEntityMetadata({
      entityLabel: 'artist profile',
      logName: 'generate-user-metadata',
      usageType: 'GENERATE_USER_METADATA',
      extraInfo: SEO_EXTRA_INFO.user,
      context,
      meta: { user_id: meta.user_id, entity_id: meta.user_id, entity_id_key: 'user_id' },
    });
  }

  /** Moderate media content to determine if it is allowed */
  public async moderateContent(url: string, meta: { user_id: number }) {
    try {
      const { moderation, matchesExpectedResponse, usage, text, parseError } =
        await this.llmService.moderateContent(url);

      if (parseError) {
        this.logger
          .name('moderate-content')
          .warn('AI returned invalid JSON', {
            user_id: meta.user_id,
            response_text: text,
            error: parseError,
          });
      }

      // Enqueue LLM tokens usage
      if (usage?.totalTokens) {
        await QueueHelper.createLlmUsageJob(this.aiQueue, {
          tokens: usage.totalTokens,
          model: openAiLLMConfig.model,
          user_id: meta.user_id,
          usage_type: 'MODERATE_MEDIA_CONTENT',
          matches_expected_response: matchesExpectedResponse,
        });
      }

      this.logger
        .name('moderate-content')
        .info('Successfully moderated content', {
          user_id: meta.user_id,
          is_allowed: moderation.is_allowed,
          severity: moderation.severity,
          content_type: moderation.content_type,
          matches_expected_response: matchesExpectedResponse,
          tokens_used: usage?.totalTokens,
        });

      await QueueHelper.createMediaModerationJob(this.aiQueue, {
        is_allowed: moderation.is_allowed ?? true,
        severity: moderation.severity ?? MODERATION_SEVERITY.SAFE,
        content_type: moderation.content_type ?? 'unknown',
        reason: moderation.reason ?? null,
        user_id: meta.user_id,
      });

      return {
        moderation,
        usage,
      };
    } catch (error) {
      this.logger
        .channel('ai/error')
        .name('moderate-content')
        .error(
          `Failed to moderate content for user [${meta.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }

  private async generateEntityMetadata(params: {
    entityLabel: 'portfolio' | 'collection' | 'service' | 'artist profile';
    logName: string;
    usageType: EnumType<'LLM_USAGE_TYPE'>;
    /** Entity-specific instructions appended after the shared rules — see `SEO_EXTRA_INFO`. */
    extraInfo: string;
    context: Record<string, unknown>;
    meta: {
      user_id: number;
      entity_id: number;
      entity_id_key: 'portfolio_id' | 'collection_id' | 'service_id' | 'user_id';
    };
  }): Promise<GenerateEntityMetadataResponse> {
    const { entityLabel, logName, usageType, extraInfo, context, meta } = params;

    try {

      const localesShape = SEO_LOCALES.map(
        (l) => `"${l}": { "seo_title": "", "seo_description": "" }`,
      ).join(', ');

      const result = await this.llmService.complete({
        messages: [
          { role: 'system', content: SEO_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Write SEO metadata for this ${entityLabel} in ALL languages and return valid JSON with EXACTLY this shape:
        { "translations": { ${localesShape} } }

        For EACH locale key (${SEO_LOCALES.join(', ')}), written IN THAT LANGUAGE:
        - seo_title: ≤${ENTITY_SEO_TITLE_MAX} chars.
        - seo_description: ≤${ENTITY_SEO_DESCRIPTION_MAX} chars, compelling + search-intent aligned, gallery-caption tone.

        ${SEO_QUALITY_RULES}

        ${extraInfo}

        Use ONLY the signals in CONTEXT. Analyze once, then localize per language (search-optimized phrasing, not literal translation).

        CONTEXT:
        ${JSON.stringify(context)}`,
          },
        ],
        temperature: 0.4,
      });

      let translations: SeoTranslation[] = [];
      let matchesExpectedResponse = false;

      try {
        const parsed = this.parseLlmJson(result.text);
        translations = this.buildEntityTranslations(parsed.translations);
        matchesExpectedResponse = translations.some((t) => !!(t.seo_title || t.seo_description));
      } catch (err) {
        this.logger.name(logName).warn('AI returned invalid JSON', {
          [meta.entity_id_key]: meta.entity_id,
          user_id: meta.user_id,
          response_text: result.text,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      await this.emitUsage({
        tokens: result.usage?.totalTokens,
        user_id: meta.user_id,
        usage_type: usageType,
        matches_expected_response: matchesExpectedResponse,
      });

      this.logger
        .name(logName)
        .info(`Successfully generated ${entityLabel} metadata for user ${meta.user_id}`);

      return { translations, usage: result.usage };
    } catch (error) {
      this.logger
        .channel('ai/error')
        .name(logName)
        .error(
          `Failed to generate ${entityLabel} metadata for ${meta.entity_id_key} [${meta.entity_id}] and user [${meta.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }

  private clamp(value: unknown, max: number): string | null {
    if (typeof value !== 'string' || value.length === 0) return null;
    return value.length > max ? value.slice(0, max) : value;
  }

  /**
   * Validate one AI-generated SEO string and truncate it to `max` on a word boundary. Returns `null`
   * when the text is junk (placeholder / markup leak / no real content), keyword-stuffed, or contains
   * profanity — the caller then leaves the field empty so the entity's own title is used instead.
   * Deliberately does NOT dedupe against other rows in the DB (per product decision).
   */
  private sanitizeSeoText(value: unknown, max: number): string | null {
    if (typeof value !== 'string') return null;
    const text = value.replace(/\s+/g, ' ').trim();
    if (text.length < 3) return null;
    // Structural leakage (JSON/HTML) — never belongs in a meta value.
    if (/[{}<>]/.test(text)) return null;
    // Whole-value junk / echoed-instruction fragments.
    if (SEO_WHOLE_JUNK.has(text.toLowerCase()) || SEO_ECHO_RE.test(text)) return null;
    // Too little character variety ("aaaaaa", "-----", "....").
    if (new Set(text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).size < 3) return null;

    const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    // Profanity (whole-token, so "Scunthorpe"-type substrings are safe).
    if (tokens.some((t) => SEO_PROFANITY.has(t))) return null;
    // Keyword stuffing: the same word three times in a row.
    for (let i = 0; i + 2 < tokens.length; i++) {
      if (tokens[i] === tokens[i + 1] && tokens[i] === tokens[i + 2]) return null;
    }
    // Keyword stuffing: one content word repeated too often / dominating the text.
    const content = tokens.filter((t) => t.length >= 4 && !SEO_STOPWORDS.has(t));
    if (content.length) {
      const freq = new Map<string, number>();
      let peak = 0;
      for (const w of content) {
        const n = (freq.get(w) ?? 0) + 1;
        freq.set(w, n);
        if (n > peak) peak = n;
      }
      if (peak >= 4) return null;
      if (content.length >= 4 && peak >= 3 && peak / content.length >= 0.4) return null;
    }

    if (text.length <= max) return text;
    // Truncate without cutting a word in half when a clean break is available.
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
  }

  private parseLlmJson(text: string): Record<string, unknown> {
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(jsonText) as Record<string, unknown>;
  }

  private async emitUsage(params: {
    tokens?: number;
    user_id: number;
    usage_type: EnumType<'LLM_USAGE_TYPE'>;
    matches_expected_response: boolean;
  }): Promise<void> {
    if (!params.tokens) return;
    await QueueHelper.createLlmUsageJob(this.aiQueue, {
      tokens: params.tokens,
      model: openAiLLMConfig.model,
      user_id: params.user_id,
      usage_type: params.usage_type,
      matches_expected_response: params.matches_expected_response,
    });
  }

  /** Read one locale's object from the model's `translations` map (case-insensitive key). */
  private localeObject(raw: unknown, lc: EnumType<'LANGUAGE_CODE'>): Record<string, unknown> {
    const byLocale = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const v = byLocale[lc] ?? byLocale[lc.toLowerCase()];
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  }

  /** One clamped SeoTranslation per app locale; any empty locale inherits the EN value. */
  private buildEntityTranslations(raw: unknown): SeoTranslation[] {
    const rows: SeoTranslation[] = SEO_LOCALES.map((lc) => {
      const v = this.localeObject(raw, lc);
      return {
        language_code: lc,
        seo_title: this.sanitizeSeoText(v.seo_title ?? v.title, ENTITY_SEO_TITLE_MAX),
        seo_description: this.sanitizeSeoText(v.seo_description ?? v.description, ENTITY_SEO_DESCRIPTION_MAX),
      };
    });
    const en = rows.find((r) => r.language_code === 'EN');
    if (en) {
      for (const r of rows) {
        if (!r.seo_title) r.seo_title = en.seo_title;
        if (!r.seo_description) r.seo_description = en.seo_description;
      }
    }
    return rows;
  }

  /** One clamped MediaSeoTranslation per app locale; any empty field inherits the EN value. */
  private buildMediaTranslations(raw: unknown): MediaSeoTranslation[] {
    const rows: MediaSeoTranslation[] = SEO_LOCALES.map((lc) => {
      const v = this.localeObject(raw, lc);
      return {
        language_code: lc,
        seo_title: this.sanitizeSeoText(v.seo_title ?? v.title, MEDIA_SEO_TITLE_MAX),
        seo_description: this.sanitizeSeoText(v.seo_description ?? v.description, MEDIA_SEO_DESCRIPTION_MAX),
        seo_alt: this.sanitizeSeoText(v.seo_alt ?? v.alt, MEDIA_SEO_ALT_MAX),
      };
    });
    const en = rows.find((r) => r.language_code === 'EN');
    if (en) {
      for (const r of rows) {
        if (!r.seo_title) r.seo_title = en.seo_title;
        if (!r.seo_description) r.seo_description = en.seo_description;
        if (!r.seo_alt) r.seo_alt = en.seo_alt;
      }
    }
    return rows;
  }

}
