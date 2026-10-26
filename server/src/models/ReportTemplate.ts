import mongoose, { Schema, Document } from 'mongoose';

export type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'number';

export interface ITemplateField {
  fieldId: string;
  label: string;
  type: TemplateFieldType;
  options?: string[];
  unit?: string;
  required?: boolean;
  defaultValue?: unknown;
  helpText?: string;
}

export interface ITemplateSection {
  sectionId: string;
  title: string;
  order: number;
  description?: string;
  fields: ITemplateField[];
}

export interface IReportTemplate extends Document {
  templateCode: string;
  name: string;
  modalityCode: string;
  applicableExaminations: string[];
  version: number;
  sections: ITemplateSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateFieldSchema = new Schema<ITemplateField>(
  {
    fieldId: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'select', 'multiselect', 'boolean', 'number'],
      required: true,
    },
    options: { type: [String], default: undefined },
    unit: { type: String },
    required: { type: Boolean, default: false },
    defaultValue: { type: Schema.Types.Mixed },
    helpText: { type: String },
  },
  { _id: false }
);

const TemplateSectionSchema = new Schema<ITemplateSection>(
  {
    sectionId: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    description: { type: String },
    fields: [TemplateFieldSchema],
  },
  { _id: false }
);

const ReportTemplateSchema = new Schema<IReportTemplate>(
  {
    templateCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    modalityCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    applicableExaminations: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    sections: [TemplateSectionSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ReportTemplate = mongoose.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema);
