import { Queue, JobsOptions } from "bullmq";
import { JOB_SEND_MAIL } from "@repo/common-lib/constants/constants";
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
        const { text, html } = await mailable.content();
        return await this.emailDriver.sendEmail({ from, to, subject, text, html, cc, replyTo });
    }

    public async sendRaw(options: EmailDriverOptions): Promise<any> {
        return await this.emailDriver.sendEmail(options);
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
        const { text, html } = await mailable.content();

        const payload: EmailDriverOptions = { from, to, subject, text, html, cc, replyTo };

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
}

export abstract class Mailable {
    public abstract envelope(): Promise<Envelop>;
    public abstract content(): Promise<Content>;
}