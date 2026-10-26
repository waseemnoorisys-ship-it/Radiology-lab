import mongoose, { Schema } from 'mongoose';

const BodyRegionMasterSchema = new Schema(
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

export const BodyRegionMaster = mongoose.model('BodyRegionMaster', BodyRegionMasterSchema);
