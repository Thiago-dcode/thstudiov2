import { Content, Envelop, MailConfig } from "./types";


export abstract class MailService {   

constructor(protected readonly config: MailConfig) {
}

public abstract send(mailable: Mailable): Promise<any>;
}

export abstract class Mailable {
        public abstract  envelope():Envelop;
    public abstract content():Content;
}