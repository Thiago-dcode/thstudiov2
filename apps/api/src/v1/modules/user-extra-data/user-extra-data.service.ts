import { Injectable } from '@nestjs/common';
import { CreateUserExtraDatumDto } from './requests/create-user-extra-datum.dto';
import { UpdateUserExtraDatumDto } from './requests/update-user-extra-datum.dto';

@Injectable()
export class UserExtraDataService {
  create(createUserExtraDatumDto: CreateUserExtraDatumDto) {
    console.log(createUserExtraDatumDto);
    return 'This action adds a new userExtraDatum';
  }

  findAll() {
    return `This action returns all userExtraData`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userExtraDatum`;
  }

  update(id: number, updateUserExtraDatumDto: UpdateUserExtraDatumDto) {
    console.log(id, updateUserExtraDatumDto);
    return `This action updates a #${id} userExtraDatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} userExtraDatum`;
  }
}
