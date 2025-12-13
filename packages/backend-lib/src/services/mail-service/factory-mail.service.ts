import { MailService } from "./mail.service";
import { NodemailerEmailDriver } from "./email-drivers/nodemailer-email-driver";
import { MailConfig, MailServiceDriver } from "./types";


export class FactoryMailService {
    public static createMailService(type: MailServiceDriver, config: MailConfig): MailService {
        switch(type){
            case 'nodemailer':
                return new MailService(new NodemailerEmailDriver(config));
            default:
                return new MailService(new NodemailerEmailDriver(config));
        }
    }
}