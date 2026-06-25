import { Queue } from "bullmq";
import { MailService } from "./mail.service";
import { NodemailerEmailDriver } from "./email-drivers/nodemailer-email-driver";
import { ResendEmailDriver } from "./email-drivers/resend-email-driver";
import { MailConfig, MailServiceDriver } from "./types";


export class FactoryMailService {
    public static createMailService(type: MailServiceDriver, config: MailConfig, queue?: Queue): MailService {
        switch (type) {
            case 'nodemailer':
                return new MailService(new NodemailerEmailDriver(config), queue, config.fromDisplayName);
            case 'resend':
                return new MailService(new ResendEmailDriver(config), queue, config.fromDisplayName);
            default:
                return new MailService(new NodemailerEmailDriver(config), queue, config.fromDisplayName);
        }
    }
}