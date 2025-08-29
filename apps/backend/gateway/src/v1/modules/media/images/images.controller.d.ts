import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
export declare class ImagesController {
    private readonly imagesService;
    constructor(imagesService: ImagesService);
    create(createImageDto: CreateImageDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateImageDto: UpdateImageDto): string;
    remove(id: string): string;
}
//# sourceMappingURL=images.controller.d.ts.map