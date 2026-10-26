import mongoose, { Schema, Document } from 'mongoose';

export interface IBodyRegionMaster extends Document {
  code: string;
  displayName: string;
  applicableModalities: string[];
  supportsLaterality: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const BodyRegionMasterSchema = new Schema<IBodyRegionMaster>(
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
    applicableModalities: {
      type: [String],
      default: [],
      index: true,
    },
    supportsLaterality: {
      type: Boolean,
      default: false,
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

export const BodyRegionMaster = mongoose.model<IBodyRegionMaster>('BodyRegionMaster', BodyRegionMasterSchema);
