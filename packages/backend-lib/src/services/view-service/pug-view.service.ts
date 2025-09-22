import path from "path";
import { ViewConfig, ViewData } from "./types";
import { ViewService } from "./view.service";
import pug from "pug";
import { checkFileExistsAsync } from "../../utils";

export class PugViewService extends ViewService {
    constructor(protected readonly config: ViewConfig) {
        super(config);
    }
    public async render(view: string, data?: ViewData): Promise<string> {
        const viewPath = path.join(this.config.basePath, view + 'pug');
        if(await checkFileExistsAsync(viewPath)) {
            throw new Error(`View path ${viewPath} not found`);
        }
        const compiledFunction = pug.compileFile(viewPath);
        return compiledFunction({globals: this.config.globals, data});
    }
}





