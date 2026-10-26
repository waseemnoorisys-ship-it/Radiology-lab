import mongoose, { Schema, Document } from 'mongoose';

export type ReportStatus = 'DRAFT' | 'FINALIZED' | 'AMENDED';

export interface IReportSectionValue {
  sectionId: string;
  title: string;
  fields: Record<string, any>;
}

export interface IReportAmendment {
  version: number;
  amendedAt: Date;
  amendedBy: string;
  reason: string;
  previousContent: {
    sections: IReportSectionValue[];
    findings: string;
    impression: string;
    recommendations?: string;
  };
}

export interface IReport extends Document {
  reportId: string;
  examination: mongoose.Types.ObjectId;
  orderId: string;
  accessionNumber: string;
  patient: mongoose.Types.ObjectId;
  patientId: string;
  patientName: string;
  modality: string;
  examinationName: string;
  templateCode: string;
  templateVersion: number;
  status: ReportStatus;
  radiologist: {
    name: string;
    licenseNumber?: string;
    role?: string;
  };
  sections: IReportSectionValue[];
  findings: string;
  impression: string;
  recommendations?: string;
  technique?: string;
  comparison?: string;
  criticalResultsNotified: boolean;
  criticalNotificationDetails?: string;
  finalizedAt?: Date;
  finalizedBy?: string;
  version: number;
  amendmentHistory: IReportAmendment[];
  createdAt: Date;
  updatedAt: Date;
}

const ReportSectionValueSchema = new Schema<IReportSectionValue>(
  {
    sectionId: { type: String, required: true },
    title: { type: String, required: true },
    fields: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ReportAmendmentSchema = new Schema<IReportAmendment>(
  {
    version: { type: Number, required: true },
    amendedAt: { type: Date, default: Date.now },
    amendedBy: { type: String, required: true },
    reason: { type: String, required: true },
    previousContent: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
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

export const Report = mongoose.model<IReport>('Report', ReportSchema);
