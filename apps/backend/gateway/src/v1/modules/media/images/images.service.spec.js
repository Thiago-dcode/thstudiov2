"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const images_service_1 = require("./images.service");
describe('ImagesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [images_service_1.ImagesService],
        }).compile();
        service = module.get(images_service_1.ImagesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
