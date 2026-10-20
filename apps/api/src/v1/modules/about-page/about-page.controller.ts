import { Body, Controller, Param, ParseIntPipe, Patch, Post, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AboutPageService } from "./about-page.service";
import { CreateAboutPageRequest } from "./requests/create-about-page.request";
import {UpdateAboutPageRequest} from './requests/update-about-page.request'
import { ModelExistPipe } from "src/pipes/model-exist.pipe";
import { IMAGE_UPLOAD_OPTIONS } from 'src/common/utils/upload-limits';

@Controller('about-page')
export class AboutPageController {


    constructor(private readonly aboutPageService: AboutPageService){
    }


        @Patch(':id')
        @UseInterceptors(FileInterceptor('photo', IMAGE_UPLOAD_OPTIONS))
        public async update(
            @Param('id',ParseIntPipe,new ModelExistPipe('about_page')) id:number, 
            @Body() request:UpdateAboutPageRequest,
            @UploadedFile() photo?: Express.Multer.File
        ){
            if (photo) {
                request.photo = photo;
            }
            return await this.aboutPageService.update(id,request);
        }

        @Post()
        @UseInterceptors(FileInterceptor('photo', IMAGE_UPLOAD_OPTIONS))
        public async create(
            @Body() request:CreateAboutPageRequest,
            @UploadedFile() photo?: Express.Multer.File
        ){
            if (photo) {
                request.photo = photo;
            }
            return await this.aboutPageService.create(request);
        }

}