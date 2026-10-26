import mongoose, { Schema } from 'mongoose';

const ReportSectionValueSchema = new Schema(
  {
    sectionId: { type: String, required: true },
    title: { type: String, required: true },
    fields: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ReportAmendmentSchema = new Schema(
  {
    version: { type: Number, required: true },
    amendedAt: { type: Date, default: Date.now },
    amendedBy: { type: String, required: true },
    reason: { type: String, required: true },
    previousContent: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ReportSchema = new Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    examination: {
      type: Schema.Types.ObjectId,
      ref: 'ExaminationOrder',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    accessionNumber: {
      type: String,
      required: true,
      index: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
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
    },
    modality: {
      type: String,
      required: true,
      index: true,
    },
    examinationName: {
      type: String,
      required: true,
    },
    templateCode: {
      type: String,
      required: true,
    },
    templateVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'FINALIZED', 'AMENDED'],
      default: 'DRAFT',
      index: true,
    },
    radiologist: {
      name: { type: String, required: true, default: 'Dr. Gregory House, MD' },
      licenseNumber: { type: String, default: 'RAD-98234' },
      role: { type: String, default: 'Staff Radiologist' },
    },
    sections: [ReportSectionValueSchema],
    findings: {
      type: String,
      default: '',
    },
    impression: {
      type: String,
      required: [true, 'Impression is required for finalization'],
      default: '',
    },
    recommendations: {
      type: String,
      default: '',
    },
    technique: {
      type: String,
      default: '',
    },
    comparison: {
      type: String,
      default: '',
    },
    criticalResultsNotified: {
      type: Boolean,
      default: false,
    },
    criticalNotificationDetails: {
      type: String,
      default: '',
    },
    finalizedAt: {
      type: Date,
    },
    finalizedBy: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    amendmentHistory: [ReportAmendmentSchema],
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ orderId: 1, version: -1 });

export const Report = mongoose.model('Report', ReportSchema);
