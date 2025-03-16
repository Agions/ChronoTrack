import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserRole } from '../../../common/types';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop()
  phone: string;

  @Prop()
  avatar: string;

  @Prop({ type: [String], enum: Object.values(UserRole), default: [UserRole.EMPLOYEE] })
  roles: UserRole[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  department: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  manager: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin: Date;

  @Prop({ type: Object, default: {} })
  preferences: Record<string, any>;

  @Prop({ type: Object })
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Prop({ default: false })
  isFaceRegistered: boolean;

  @Prop({ default: false })
  isFingerRegistered: boolean;

  @Prop({ required: false })
  refreshToken: string;

  // 验证密码
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// 添加密码加密中间件
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;
  
  // 只有密码被修改时才重新加密
  if (!user.isModified('password')) {
    return next();
  }
  
  try {
    // 使用10轮盐值加密
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
}); 