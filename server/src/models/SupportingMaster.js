import mongoose, { Schema } from 'mongoose';

const SupportingMasterSchema = new Schema(
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

export const SupportingMaster = mongoose.model('SupportingMaster', SupportingMasterSchema);
