import { Body, Controller, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { AddressService } from "./address.service";
import { CreateAddressRequest } from "./requests/create-address.request";
import { UpdateAddressRequest } from "./requests/update-address.request";
import { ModelExistPipe } from "src/pipes/model-exist.pipe";

@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  public async create(@Body() request: CreateAddressRequest) {
    return await this.addressService.create(request);
  }

  @Patch(':id')
  public async update(
    @Param('id', ParseIntPipe, new ModelExistPipe('addresses')) id: number,
    @Body() request: UpdateAddressRequest,
  ) {
    return await this.addressService.update(id, request);
  }
}