import { Resend } from "resend";
import Logger from "../../../utils/console";
import { EmailDriverOptions, MailConfig } from "../types";
import { EmailDriver } from "./email-driver";

export class ResendEmailDriver extends EmailDriver {
  private readonly resend: Resend;

  constructor(config: MailConfig) {
    super(config);

    if (!this.config.api_key) {
      throw new Error(
        "ResendEmailDriver: missing MailConfig.api_key (expected Resend API key).",
      );
    }

    this.resend = new Resend(this.config.api_key);
  }

  public async sendEmail({
    from,
    to,
    subject,
    text,
    html,
    cc,
    replyTo,
    headers,
  }: EmailDriverOptions): Promise<any> {
    Logger.info(from, to, subject);

    // Resend requires at least one content field (`html` or `text`).
    if (!html && (text === undefined || text === null)) {
      throw new Error(
        "ResendEmailDriver: one of `html` or `text` must be provided.",
      );
    }

    // Build payload imperatively so TypeScript can satisfy Resend's strict union types.
    const payload: Parameters<Resend["emails"]["send"]>[0] = {
      from,
      to,
      subject,
      ...(cc ? { cc } : {}),
      ...(replyTo ? { replyTo } : {}),
      ...(headers ? { headers } : {}),
    } as any;

    if (html) {
      (payload as any).html = html;
    } else {
      (payload as any).text = text;
    }

    const { data, error } = await this.resend.emails.send(payload);

    if (error) {
      Logger.error(error);
      throw error;
    }

    Logger.info(`Resend email accepted id=${data?.id ?? 'n/a'} to=${to} subject=${subject}`);
    return data;
  }

  public async sendBatch(options: EmailDriverOptions[]): Promise<any> {
    const emails = options.map(({ from, to, subject, text, html, cc, replyTo, headers }) => {
      if (!html && (text === undefined || text === null)) {
        throw new Error(
          "ResendEmailDriver: one of `html` or `text` must be provided.",
        );
      }

      const payload: Record<string, any> = {
        from,
        to,
        subject,
        ...(cc ? { cc } : {}),
        ...(replyTo ? { replyTo } : {}),
        ...(headers ? { headers } : {}),
      };

      if (html) {
        payload.html = html;
      } else {
        payload.text = text;
      }

      return payload;
    });

    const { data, error } = await this.resend.batch.send(
      emails as Parameters<Resend["batch"]["send"]>[0],
    );

    if (error) {
      Logger.error(error);
      throw error;
    }

    const ids = Array.isArray(data?.data) ? data.data.map((item) => item?.id).join(',') : String(data);
    const recipients = emails
      .map((email) => `${Array.isArray(email.to) ? email.to.join('|') : email.to}<${email.subject}>`)
      .join('; ');
    Logger.info(`Resend batch accepted count=${emails.length} ids=${ids} recipients=${recipients}`);

    return data;
  }
}







