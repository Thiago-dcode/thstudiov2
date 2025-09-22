import { ViewConfig, ViewData } from "./types";


export abstract class ViewService {
    constructor(protected readonly config: ViewConfig) {
    }
    public abstract render(view: string, data?: ViewData): Promise<string>;
}





