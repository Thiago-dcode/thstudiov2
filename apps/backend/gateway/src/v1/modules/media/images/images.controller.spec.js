"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const images_controller_1 = require("./images.controller");
const images_service_1 = require("./images.service");
describe('ImagesController', () => {
    let controller;
    const mockImagesService = {
        create: jest.fn((dto) => {
            return {
                id: Date.now(),
                ...dto,
            };
        }),
        findAll: jest.fn(() => [
            { id: 1, name: 'test1', description: 'test1' },
            { id: 2, name: 'test2', description: 'test2' },
        ]),
        findOne: jest.fn((id) => ({ id, name: 'test', description: 'test' })),
        update: jest.fn((id, dto) => ({ id, ...dto })),
        remove: jest.fn((id) => ({ id, name: 'test', description: 'test' })),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [images_controller_1.ImagesController],
            providers: [images_service_1.ImagesService],
        })
            .overrideProvider(images_service_1.ImagesService)
            .useValue(mockImagesService)
            .compile();
        controller = module.get(images_controller_1.ImagesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should create a image', () => {
        const dto = {
            name: 'test',
            description: 'test',
        };
        const result = controller.create(dto);
        expect(result).toEqual({ id: expect.any(Number), ...dto });
        expect(mockImagesService.create).toHaveBeenCalledWith(dto);
    });
    it('should return all images', () => {
        const result = controller.findAll();
        expect(result).toEqual([
            { id: 1, name: 'test1', description: 'test1' },
            { id: 2, name: 'test2', description: 'test2' },
        ]);
        expect(mockImagesService.findAll).toHaveBeenCalled();
    });
    it('should return a single image', () => {
        const id = '1';
        const result = controller.findOne(id);
        expect(result).toEqual({ id: 1, name: 'test', description: 'test' });
        expect(mockImagesService.findOne).toHaveBeenCalledWith(1);
    });
    it('should update an image', () => {
        const id = '1';
        const dto = {
            name: 'updated',
            description: 'updated',
        };
        const result = controller.update(id, dto);
        expect(result).toEqual({ id: 1, ...dto });
        expect(mockImagesService.update).toHaveBeenCalledWith(1, dto);
    });
    it('should remove an image', () => {
        const id = '1';
        const result = controller.remove(id);
        expect(result).toEqual({ id: 1, name: 'test', description: 'test' });
        expect(mockImagesService.remove).toHaveBeenCalledWith(1);
    });
});
