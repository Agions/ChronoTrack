import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationParams } from '../../common/types';
import { buildPaginationOptions, createPaginatedResponse } from '../../common/utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {}

  /**
   * 创建新用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existingEmail = await this.userModel.findOne({ email: createUserDto.email });
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查员工编号是否已存在
    const existingEmployeeId = await this.userModel.findOne({ employeeId: createUserDto.employeeId });
    if (existingEmployeeId) {
      throw new ConflictException('员工编号已存在');
    }

    // 创建新用户
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  /**
   * 查找所有用户（分页）
   */
  async findAll(params: PaginationParams) {
    const { page, limit, skip } = buildPaginationOptions(params);
    
    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .skip(skip)
        .limit(limit)
        .populate('department', 'name')
        .populate('manager', 'name employeeId')
        .exec(),
      this.userModel.countDocuments(),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: string): Promise<User> {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) {
      throw new BadRequestException('无效的用户ID');
    }

    const user = await this.userModel
      .findById(id)
      .populate('department', 'name')
      .populate('manager', 'name employeeId')
      .exec();
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    
    return user;
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 根据员工编号查找用户
   */
  async findByEmployeeId(employeeId: string): Promise<User> {
    const user = await this.userModel.findOne({ employeeId }).exec();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 更新用户信息
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) {
      throw new BadRequestException('无效的用户ID');
    }

    // 检查邮箱是否已被其他用户使用
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({ 
        email: updateUserDto.email,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    // 检查员工编号是否已被其他用户使用
    if (updateUserDto.employeeId) {
      const existingUser = await this.userModel.findOne({ 
        employeeId: updateUserDto.employeeId,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        throw new ConflictException('员工编号已被其他用户使用');
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    
    if (!updatedUser) {
      throw new NotFoundException('用户不存在');
    }
    
    return updatedUser;
  }

  /**
   * 修改用户密码
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<boolean> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // 验证新密码与确认密码是否一致
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('新密码与确认密码不一致');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证当前密码是否正确
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('当前密码不正确');
    }

    // 更新密码
    user.password = newPassword;
    await user.save();
    
    return true;
  }

  /**
   * 删除用户
   */
  async remove(id: string): Promise<boolean> {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) {
      throw new BadRequestException('无效的用户ID');
    }

    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('用户不存在');
    }
    
    return true;
  }

  /**
   * 更新用户刷新令牌
   */
  async setRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken }).exec();
  }

  /**
   * 更新用户最后登录时间
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { 
      lastLogin: new Date() 
    }).exec();
  }

  /**
   * 获取部门列表
   */
  async getDepartments() {
    return this.departmentModel.find().exec();
  }

  /**
   * 创建部门
   */
  async createDepartment(departmentData: any) {
    const existingDepartment = await this.departmentModel.findOne({ 
      name: departmentData.name 
    });
    
    if (existingDepartment) {
      throw new ConflictException('部门名称已存在');
    }
    
    const department = new this.departmentModel(departmentData);
    return department.save();
  }

  /**
   * 更新部门信息
   */
  async updateDepartment(id: string, departmentData: any) {
    // 检查部门名称是否已被使用
    if (departmentData.name) {
      const existingDepartment = await this.departmentModel.findOne({ 
        name: departmentData.name,
        _id: { $ne: id }
      });
      
      if (existingDepartment) {
        throw new ConflictException('部门名称已被使用');
      }
    }

    const department = await this.departmentModel
      .findByIdAndUpdate(id, departmentData, { new: true })
      .exec();
    
    if (!department) {
      throw new NotFoundException('部门不存在');
    }
    
    return department;
  }

  /**
   * 删除部门
   */
  async deleteDepartment(id: string) {
    // 检查是否有用户关联到此部门
    const usersInDepartment = await this.userModel.countDocuments({ department: id });
    if (usersInDepartment > 0) {
      throw new BadRequestException('无法删除部门，该部门下仍有员工');
    }

    const result = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('部门不存在');
    }
    
    return true;
  }
} 