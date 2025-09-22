import { PugViewService } from "./pug-view.service";
import { ViewConfig,ViewServiceEngine } from "./types";
import { ViewService } from "./view.service";


export class FactoryViewService {
    public static createViewService(type: ViewServiceEngine, config: ViewConfig): ViewService {
        switch(type){
            case 'pug':
                return new PugViewService(config);
            default:
                return new PugViewService(config);
        }
    }
}