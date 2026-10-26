import mongoose, { Schema, Document } from 'mongoose';

export type SupportingCategory =
  | 'REFERRING_DOCTOR'
  | 'FACILITY'
  | 'DEPARTMENT';

export interface ISupportingMaster extends Document {
  category: SupportingCategory;
  code: string;
  displayName: string;
  details?: Record<string, unknown>;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SupportingMasterSchema = new Schema<ISupportingMaster>(
  {
    category: {
      type: String,
      enum: ['REFERRING_DOCTOR', 'FACILITY', 'DEPARTMENT'],
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
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

SupportingMasterSchema.index({ category: 1, code: 1 }, { unique: true });

export const SupportingMaster = mongoose.model<ISupportingMaster>('SupportingMaster', SupportingMasterSchema);
