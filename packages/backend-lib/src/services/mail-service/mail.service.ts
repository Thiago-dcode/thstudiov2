import { Queue, JobsOptions } from "bullmq";
import { JOB_SEND_MAIL, JOB_SEND_BATCH_EMAIL } from "@repo/common-lib/constants/constants";
import { EmailDriver } from "./email-drivers/email-driver";
import { Content, EmailDriverOptions, Envelop } from "./types";

const DEFAULT_MAIL_JOB_OPTIONS: JobsOptions = {
    priority: 10,
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
};

export class MailService {

    constructor(
        protected readonly emailDriver: EmailDriver,
        protected readonly queue?: Queue,
    ) { }

    public async send(mailable: Mailable): Promise<any> {
        const { from, to, subject, cc, replyTo } = await mailable.envelope();
        const { text, html, headers } = await mailable.content();
        if (!this.hasContent({ text, html })) {
            return null;
        }
        return await this.emailDriver.sendEmail({ from, to, subject, text, html, cc, replyTo, headers });
    }

    public async sendRaw(options: EmailDriverOptions): Promise<any> {
        return await this.emailDriver.sendEmail(options);
    }

    public async sendBatch(mailables: Mailable[]): Promise<any> {
        const payloads = await Promise.all(
            mailables.map(async (mailable) => {
                const { from, to, subject, cc, replyTo } = await mailable.envelope();
                const { text, html, headers } = await mailable.content();
                if (!this.hasContent({ text, html })) {
                    return null;
                }
                return { from, to, subject, text, html, cc, replyTo, headers } as EmailDriverOptions;
            }),
        );

        const sendablePayloads = payloads.filter((payload): payload is EmailDriverOptions => payload !== null);
        if (sendablePayloads.length === 0) {
            return null;
        }

        return await this.emailDriver.sendBatch(sendablePayloads);
    }

    public async sendBatchRaw(options: EmailDriverOptions[]): Promise<any> {
        return await this.emailDriver.sendBatch(options);
    }

    /**
     * Queues the mailable for async delivery via BullMQ.
     * Requires a Queue instance passed in the constructor.
     */
    public async sendAsync(mailable: Mailable, jobOptions?: JobsOptions): Promise<any> {
        if (!this.queue) {
            throw new Error('MailService: a BullMQ Queue is required for sendAsync. Pass it in the constructor.');
        }

        const { from, to, subject, cc, replyTo } = await mailable.envelope();
        const { text, html, headers } = await mailable.content();
        if (!this.hasContent({ text, html })) {
            return null;
        }

        const payload: EmailDriverOptions = { from, to, subject, text, html, cc, replyTo, headers };

        return await this.queue.add(
            JOB_SEND_MAIL,
            payload,
            {
                ...DEFAULT_MAIL_JOB_OPTIONS,
                jobId: `mail-${Date.now()}`,
                ...jobOptions,
            },
        );
    }

    /**
     * Queues a batch of mailables for async delivery via BullMQ.
     * Requires a Queue instance passed in the constructor.
     */
    public async sendBatchAsync(mailables: Mailable[], jobOptions?: JobsOptions): Promise<any> {
        if (!this.queue) {
            throw new Error('MailService: a BullMQ Queue is required for sendBatchAsync. Pass it in the constructor.');
        }

        const payloads = await Promise.all(
            mailables.map(async (mailable) => {
                const { from, to, subject, cc, replyTo } = await mailable.envelope();
                const { text, html, headers } = await mailable.content();
                if (!this.hasContent({ text, html })) {
                    return null;
                }
                return { from, to, subject, text, html, cc, replyTo, headers } as EmailDriverOptions;
            }),
        );

        const sendablePayloads = payloads.filter((payload): payload is EmailDriverOptions => payload !== null);
        if (sendablePayloads.length === 0) {
            return null;
        }

        return await this.queue.add(
            JOB_SEND_BATCH_EMAIL,
            sendablePayloads,
            {
                ...DEFAULT_MAIL_JOB_OPTIONS,
                jobId: `batch-mail-${Date.now()}`,
                ...jobOptions,
            },
        );
    }

    private hasContent({ text, html }: Content): boolean {
        return Boolean(text || html);
    }
}

export abstract class Mailable {
    public abstract envelope(): Promise<Envelop>;
    public abstract content(): Promise<Content>;
}