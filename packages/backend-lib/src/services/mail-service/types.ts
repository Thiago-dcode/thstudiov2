export type MailConfig= {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    api_key?:string;
    fromDisplayName?: string;
}
export type MailServiceDriver = 'nodemailer' | 'resend';

export type Envelop= {
    from: string,
    to: string | string[],
    subject: string,
    cc?: string | string[],
    replyTo?: string,
}
export type Content={
    text?: string, 
    html?: string, 
}
export type EmailDriverOptions={
    from: string ,
    to: string | string[],
    subject: string,
    text?: string,
    html?: string,
    cc?: string | string[],
    replyTo?: string,
}