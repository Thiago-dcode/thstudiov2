import path from "path";
import { ViewConfig, ViewData } from "./types";
import fs from "fs";
import { TemplateEngine } from "./template-engines/template.engine";


export  class ViewService {
    constructor(protected readonly config: ViewConfig, protected readonly templateEngine: TemplateEngine) {
    }
    public async render(view: string, data?: ViewData) {
        const viewPath = path.join(this.config.basePath, view + '.' + this.templateEngine.ext);
        if(!fs.existsSync(viewPath)) {
            throw new Error(`View path ${viewPath} not found`);
        }
        return await this.templateEngine.renderFile(viewPath, {globals: this.config.globals, ...data});
    }
}





