"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const projects_controller_1 = require("./projects.controller");
const projects_service_1 = require("./projects.service");
describe('ProjectsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [projects_controller_1.ProjectsController],
            providers: [projects_service_1.ProjectsService],
        }).compile();
        controller = module.get(projects_controller_1.ProjectsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
