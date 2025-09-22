import { PugTemplateEngine } from "./template-engines/pug-template.engine";
import { ViewConfig,ViewServiceEngine } from "./types";
import { ViewService } from "./view.service";


export class FactoryViewService {
    public static createViewService(type: ViewServiceEngine, config: ViewConfig): ViewService {
        switch(type){
            case 'pug':
                return new ViewService(config, new PugTemplateEngine());
            default:
                return new ViewService(config, new PugTemplateEngine());
        }
    }
}