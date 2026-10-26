import mongoose, { Schema, Document } from 'mongoose';

export interface IModalityMaster extends Document {
  code: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ModalityMasterSchema = new Schema<IModalityMaster>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ModalityMaster = mongoose.model<IModalityMaster>('ModalityMaster', ModalityMasterSchema);
