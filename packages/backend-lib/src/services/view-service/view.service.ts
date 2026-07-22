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
        const { globals: dataGlobals, t, ...rest } = data ?? {};
        // Single translator for the whole render: prefer the lang-bound `t`
        // injected by ApiMailService, then any `globals.t` override (e.g. email
        // preview), then the ViewService default. Expose it as both top-level
        // `t` and `globals.t` so templates and includes stay consistent.
        const translator =
            (typeof t === 'function' ? t : undefined) ??
            (typeof dataGlobals?.t === 'function' ? dataGlobals.t : undefined) ??
            (typeof this.config.globals?.t === 'function' ? this.config.globals.t : undefined);
        const globals = {
            ...this.config.globals,
            ...dataGlobals,
            ...(translator ? { t: translator } : {}),
        };
        return await this.templateEngine.renderFile(viewPath, {
            ...rest,
            ...(translator ? { t: translator } : {}),
            globals,
        });
    }
}





