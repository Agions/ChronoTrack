import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './create-user.dto';
import { User } from './user.schema';


@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdCat = await this.userModel.create(createUserDto);
    console.log(createdCat)
    return createdCat;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findOne({ _id: id }).exec();
  }

  async delete(id: string) {
    const deletedCat = await this.userModel
      .findByIdAndRemove({ _id: id })
      .exec();
    return deletedCat;
  }

}
