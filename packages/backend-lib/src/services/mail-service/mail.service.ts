import { EmailDriver } from "./email-drivers/email-driver";
import { Content, Envelop } from "./types";


export  class MailService {   

constructor( protected readonly emailDriver: EmailDriver) {
}

public async send(mailable: Mailable): Promise<any> {
    const {from,to,subject,cc,replyTo} = await mailable.envelope();
    const {text,html} = await mailable.content();
    return await this.emailDriver.sendEmail({from,to,subject,text,html,cc,replyTo});
}
}

export abstract class Mailable {
        public abstract  envelope():Promise<Envelop>;
    public abstract content():Promise<Content>;
}