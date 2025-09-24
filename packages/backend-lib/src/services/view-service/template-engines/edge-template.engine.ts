import { ViewData } from "../types";
import { TemplateEngine } from "./template.engine";
import { Edge } from 'edge.js'

export class EdgeTemplateEngine extends TemplateEngine {
    constructor() {
        super('edge');
    }
    public async renderFile(view: string, data?: ViewData) {
        const edge = Edge.create()
       return   await edge.render(view, data)

    }
}




