import { MailService } from "./mail.service";
import { NodeMailerMailService } from "./nodemailer-mail.service";
import { MailConfig, MailServiceDriver } from "./types";


export class FactoryMailService {
    public static createMailService(type: MailServiceDriver, config: MailConfig): MailService {
        switch(type){
            case 'nodemailer':
                return new NodeMailerMailService(config);
            default:
                return new NodeMailerMailService(config);
        }
    }
}