import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { AttendanceType, AttendanceStatus } from '../../../common/types';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, enum: Object.values(AttendanceType) })
  type: AttendanceType;

  @Prop({ required: true, enum: Object.values(AttendanceStatus), default: AttendanceStatus.NORMAL })
  status: AttendanceStatus;

  @Prop({ type: Object })
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Prop()
  device: string;

  @Prop()
  ipAddress: string;

  @Prop({ type: Object })
  meta: Record<string, any>;

  @Prop()
  note: string;

  @Prop({ type: Boolean, default: false })
  isManuallyAdded: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  addedBy: MongooseSchema.Types.ObjectId;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance); 