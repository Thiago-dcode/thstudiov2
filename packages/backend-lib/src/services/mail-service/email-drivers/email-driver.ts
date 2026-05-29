import { EmailDriverOptions, MailConfig } from "../types";

export abstract class EmailDriver {
    constructor(protected readonly config: MailConfig) {}
    public abstract sendEmail(options: EmailDriverOptions): Promise<any>;
    public abstract sendBatch(options: EmailDriverOptions[]): Promise<any>;
}







