import { EmailDriverOptions, MailConfig } from "../types";
import { EmailDriver } from "./email-driver";
import nodemailer from "nodemailer";
    export class NodemailerEmailDriver extends EmailDriver {
        private transporter: nodemailer.Transporter;
        constructor(config: MailConfig) {
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
        public async sendEmail({from,to,subject,text,html}: EmailDriverOptions) {

          try {
            console.log(from,to,subject);
            return await this.transporter.sendMail({
                from,
                to,
                subject,
                text, 
                html, 
              });
          } catch (error) {
            console.log(error);
            throw error;
          }
        
        }
       
}







