import { ViewData } from "../types";

export abstract class TemplateEngine {
    public readonly ext:string;
    constructor(ext:string) {
        this.ext = ext;
    }
    public abstract renderFile(view: string, data?: ViewData): Promise<string>;
}




