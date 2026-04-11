import { ViewData } from "../types";
import { TemplateEngine } from "./template.engine";
import ejs from 'ejs'

export class EjsTemplateEngine extends TemplateEngine {
    constructor() {
        super('ejs');
    }
    public async renderFile(view: string, data?: ViewData) {
       return   await ejs.renderFile(view, data)

    }
}




