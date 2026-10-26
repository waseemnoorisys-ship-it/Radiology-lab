import mongoose, { Schema } from 'mongoose';

const ExaminationOrderSchema = new Schema(
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
      default: 'PENDING_REPORT',
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

export const ExaminationOrder = mongoose.model('ExaminationOrder', ExaminationOrderSchema);
