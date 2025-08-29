"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const projects_service_1 = require("./projects.service");
describe('ProjectsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [projects_service_1.ProjectsService],
        }).compile();
        service = module.get(projects_service_1.ProjectsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
