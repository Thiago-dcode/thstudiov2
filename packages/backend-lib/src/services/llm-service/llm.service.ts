import { MODERATION_SEVERITY } from "@repo/common-lib/constants/enums";
import { ContentModerationFields } from "@repo/common-lib/types/ai";

// llmService.ts
export type LLMMessageRole = 'system' | 'user' | 'assistant';
export type LLMUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};
export type LLMMessageContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}>;

export interface LLMMessage {
  role: LLMMessageRole;
  content: LLMMessageContent;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCompletionResponse {
  text: string;
  usage?: LLMUsage
}

export abstract class LLMService {
  /** Optional setup: load API keys, initialize clients, etc. */
  public abstract setup(): Promise<void>;

  /** Main completion method: returns AI output + optional usage info */
  public abstract complete(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse>;

  public async moderateContent(url: string) {
    const EXPECTED_JSON: ContentModerationFields = {
      is_allowed: true,
      severity: MODERATION_SEVERITY.SAFE,
      content_type: 'unknown',
      reason: '',
    };

    const result = await this.complete({
      messages: [
        {
          role: 'system',
          content: 'You are the content moderation and child-safety system of an online ART marketplace. You are zero-tolerance on exactly two things: (1) CSAM and any sexualization or exploitation of minors, (2) hard pornographic content. Everything else is judged as art: nudity, the human body, and difficult subject matter are normal here and are NOT violations by themselves. Rate what is actually visible — do not invent a violation from what an image could hypothetically be. Output valid JSON only. No extra text.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text' as const,
              text: `Analyze the image and return valid JSON with exactly these fields:
        ${JSON.stringify(EXPECTED_JSON)}
        SEVERITY SCALE (0–10)
        0      – Safe. No issues.
        1 – 2  – Minimal. Mild suggestive content, artistic nudity (paintings, sculptures, fine-art photography).
        3 – 4  – Low. Partial or full non-sexual nudity (nude studies, boudoir), mild violence in art/historical context.
        5 – 6  – Moderate. Explicit but legal adult content, graphic artistic violence.
        7 – 8  – High. Hardcore pornography, gratuitous glorified realistic violence, hate promotion.
        9      – Severe. Exploitation, abuse depiction, extreme illegal content.
        10     – Critical. CSAM detected — child sexual abuse material.
        ═══════════════════════════════════════════
        content_type (one of)
        ═══════════════════════════════════════════
        "photograph" | "painting" | "illustration" | "digital_art" | "mixed_media" | "unknown"
        ═══════════════════════════════════════════
        DECISION RULES
        ═══════════════════════════════════════════
        - is_allowed = true when severity ≤ 6; is_allowed = false when severity ≥ 7
        - MINORS: escalate to ≥ 9 ONLY when the subject appears to be a minor AND the depiction is sexual or sexualized (sexual act, sexualized posing, focus on intimate areas). Apparent age alone is NEVER a violation: children and young-looking people in ordinary, clothed, non-sexual images are severity 0. Youthful features, small stature, stylized or anime-like art are not evidence of age — do not treat them as such.
        - NUDITY is not pornography and is not blocked here: the nude is a core art subject. Nudity without explicit sexual activity stays ≤ 4, even when full-frontal. Reserve ≥ 7 for hardcore pornographic depictions (explicit sexual acts, penetration, graphic close-ups).
        - Judge ONLY what is clearly visible. If you are unsure whether something prohibited is present, it is NOT present — return the lower severity. Never block on suspicion, ambiguity, or "could be".
        - reason: ≤120 chars, neutral explanation in English user friendly. Leave it empty when severity ≤ 6.

        Base the decision ONLY on visible image content.
        Ignore filename, metadata, and URL.
        Return valid JSON only.`
            },
            {
              type: 'image_url' as const,
              image_url: { url }
            }
          ]
        }
      ],
      temperature: 0.1
    });

    // Parse JSON response, handling markdown code blocks if present
    let moderationData: Partial<ContentModerationFields> = {};
    let matchesExpectedResponse = false;
    let parseError: string | undefined;

    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = result.text.trim();

      // Remove markdown code block syntax if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      // Parse the JSON
      const parsed = JSON.parse(jsonText);

      // Clamp severity to integer 0–10
      const rawSeverity = typeof parsed.severity === 'number'
        ? Math.min(MODERATION_SEVERITY.CRITICAL, Math.max(MODERATION_SEVERITY.SAFE, Math.round(parsed.severity)))
        : MODERATION_SEVERITY.SAFE;

      // Map and validate the fields. `is_allowed` is DERIVED from the severity threshold rather
      // than trusted from the model: the two often disagree (a cautious model returns a low
      // severity next to is_allowed=false), and a missing boolean would otherwise read as a
      // rejection. Severity is the graded signal, so it decides.
      moderationData = {
        is_allowed: rawSeverity < MODERATION_SEVERITY.HIGH,
        severity: rawSeverity as ContentModerationFields['severity'],
        content_type: parsed.content_type || 'unknown',
        reason: parsed.reason || '',
      };

      // Check if response matches expected format
      matchesExpectedResponse = typeof parsed.is_allowed === 'boolean'
        && typeof parsed.severity === 'number'
    } catch (err) {
      parseError = err instanceof Error ? err.message : 'Unknown error';
      // Default to allowed if parsing fails
      moderationData = { ...EXPECTED_JSON };
    }

    return {
      moderation: moderationData as ContentModerationFields,
      matchesExpectedResponse,
      usage: result.usage,
      text: result.text,
      parseError,
    };
  }
}
