import mongoose, { Schema, Document } from 'mongoose';

export type WorkflowStatus =
  | 'PENDING_UPLOAD'
  | 'PENDING_REPORT'
  | 'IN_PROGRESS'
  | 'DRAFT_SAVED'
  | 'FINALIZED'
  | 'AMENDED'
  | 'CANCELLED';

export type ImageAvailability =
  | 'NO_IMAGES'
  | 'UPLOADING'
  | 'AVAILABLE'
  | 'FAILED';

export interface IExaminationOrder extends Document {
  orderId: string;
  accessionNumber: string;
  patient: mongoose.Types.ObjectId;
  patientId: string;
  patientName: string;
  modality: string;
  bodyRegion: string;
  examinationName: string;
  examinationCode?: string;
  laterality: 'LEFT' | 'RIGHT' | 'BILATERAL' | 'UNILATERAL' | 'NOT_APPLICABLE';
  contrast: 'WITHOUT_CONTRAST' | 'WITH_CONTRAST' | 'WITHOUT_AND_WITH_CONTRAST' | 'NOT_APPLICABLE';
  protocol?: string;
  clinicalIndication?: string;
  referringDoctor?: string;
  performingFacility?: string;
  additionalNotes?: string;
  workflowStatus: WorkflowStatus;
  imageAvailability: ImageAvailability;
  orthancStudyId?: string;
  studyInstanceUid?: string;
  seriesCount?: number;
  instanceCount?: number;
  report?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExaminationOrderSchema = new Schema<IExaminationOrder>(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    accessionNumber: {
      type: String,
      required: [true, 'Accession Number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Associated patient is required'],
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      index: true,
    },
    modality: {
      type: String,
      required: [true, 'Modality is required'],
      trim: true,
      index: true,
    },
    bodyRegion: {
      type: String,
      required: [true, 'Body region is required'],
      trim: true,
      index: true,
    },
    examinationName: {
      type: String,
      required: [true, 'Examination name is required'],
      trim: true,
      index: true,
    },
    examinationCode: {
      type: String,
      trim: true,
    },
    laterality: {
      type: String,
      enum: ['LEFT', 'RIGHT', 'BILATERAL', 'UNILATERAL', 'NOT_APPLICABLE'],
      default: 'NOT_APPLICABLE',
    },
    contrast: {
      type: String,
      enum: ['WITHOUT_CONTRAST', 'WITH_CONTRAST', 'WITHOUT_AND_WITH_CONTRAST', 'NOT_APPLICABLE'],
      default: 'NOT_APPLICABLE',
    },
    protocol: {
      type: String,
      trim: true,
    },
    clinicalIndication: {
      type: String,
      trim: true,
    },
    referringDoctor: {
      type: String,
      trim: true,
      index: true,
    },
    performingFacility: {
      type: String,
      trim: true,
      default: 'Main Radiology Clinic',
    },
    additionalNotes: {
      type: String,
      trim: true,
    },
    workflowStatus: {
      type: String,
      enum: ['PENDING_UPLOAD', 'PENDING_REPORT', 'IN_PROGRESS', 'DRAFT_SAVED', 'FINALIZED', 'AMENDED', 'CANCELLED'],
      default: 'PENDING_UPLOAD',
      index: true,
    },
    imageAvailability: {
      type: String,
      enum: ['NO_IMAGES', 'UPLOADING', 'AVAILABLE', 'FAILED'],
      default: 'NO_IMAGES',
      index: true,
    },
    orthancStudyId: {
      type: String,
      trim: true,
      index: true,
    },
    studyInstanceUid: {
      type: String,
      trim: true,
      index: true,
    },
    seriesCount: {
      type: Number,
      default: 0,
    },
    instanceCount: {
      type: Number,
      default: 0,
    },
    report: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for frequent worklist filtering and sorting
ExaminationOrderSchema.index({ modality: 1, workflowStatus: 1 });
ExaminationOrderSchema.index({ createdAt: -1 });

export const ExaminationOrder = mongoose.model<IExaminationOrder>('ExaminationOrder', ExaminationOrderSchema);
