import { ViewData } from "../types";
import { TemplateEngine } from "./template.engine";
import pug from "pug";

export class PugTemplateEngine extends TemplateEngine {
    constructor() {
        super('pug');
    }
    public async renderFile(view: string, data?: ViewData) {
        const compiledFunction = pug.compileFile(view);
        return compiledFunction(data);


    }
}




