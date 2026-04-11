import { EjsTemplateEngine } from "./template-engines/ejs-template.engine";
import { PugTemplateEngine } from "./template-engines/pug-template.engine";
import { TemplateEngine } from "./template-engines/template.engine";
import { ViewConfig,ViewServiceEngine } from "./types";
import { ViewService } from "./view.service";


export class FactoryViewService {
    public static createViewService(type: ViewServiceEngine, config: ViewConfig): ViewService {
       let templateEngine:TemplateEngine|null = null;
       switch(type){
        case 'pug':
            templateEngine = new PugTemplateEngine();
            break;
        case 'ejs':
            templateEngine = new EjsTemplateEngine();
            break;
       }
       if(!templateEngine){
        throw new Error('Template engine not found');
       }    
     return  new ViewService(config, templateEngine);
            
        
    }
}