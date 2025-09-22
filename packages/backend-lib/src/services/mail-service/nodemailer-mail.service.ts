import { Mailable, MailService } from "./mail.service";
import { MailConfig } from "./types";
import nodemailer from "nodemailer";

export  class NodeMailerMailService extends MailService {   
private transporter: nodemailer.Transporter;
constructor(protected readonly config: MailConfig) {
    super(config);
    this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.config.username,
          pass: this.config.password,
        },
      });
}
public async send(mailable: Mailable) {
    const {from,to,subject} = mailable.envelope();
    const {text,html} = await mailable.content();

 return await this.transporter.sendMail({
        from,
        to,
        subject,
        text, // plain‑text body
        html, // HTML body
      });

}

}
