export type MailConfig= {
    host: string;
    port: number;
    username: string;
    password: string;
}
export type MailServiceDriver = 'nodemailer';

export type Envelop= {
    from: string,
    to: string | string[],
    subject: string,
  
}
export type Content={
    text?: string, 
    html?: string, 
}