import mongoose, { Schema, Document } from 'mongoose';

export interface IExaminationMaster extends Document {
  code: string;
  displayName: string;
  modalityCode: string;
  bodyRegionCode: string;
  lateralityRequired: boolean;
  contrastApplicability: 'WITHOUT_CONTRAST' | 'WITH_CONTRAST' | 'WITHOUT_AND_WITH_CONTRAST' | 'NOT_APPLICABLE';
  standardProtocols: string[];
  clinicalIndications: string[];
  defaultTemplateCode: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExaminationMasterSchema = new Schema<IExaminationMaster>(
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
      index: true,
    },
    modalityCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    bodyRegionCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    lateralityRequired: {
      type: Boolean,
      default: false,
    },
    contrastApplicability: {
      type: String,
      enum: ['WITHOUT_CONTRAST', 'WITH_CONTRAST', 'WITHOUT_AND_WITH_CONTRAST', 'NOT_APPLICABLE'],
      default: 'NOT_APPLICABLE',
    },
    standardProtocols: {
      type: [String],
      default: [],
    },
    clinicalIndications: {
      type: [String],
      default: [],
    },
    defaultTemplateCode: {
      type: String,
      required: true,
      index: true,
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

// Compound index for dependent dropdown queries (modality + region)
ExaminationMasterSchema.index({ modalityCode: 1, bodyRegionCode: 1 });

export const ExaminationMaster = mongoose.model<IExaminationMaster>('ExaminationMaster', ExaminationMasterSchema);
