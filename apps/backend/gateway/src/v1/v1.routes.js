"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const images_module_1 = require("./modules/media/Images/images.module");
const projects_module_1 = require("./modules/projects/projects.module");
const modules = [images_module_1.ImagesModule, projects_module_1.ProjectsModule];
exports.routes = modules.map((module) => ({
    path: '/v1',
    module,
}));
