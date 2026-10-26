import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditEvent extends Document {
  eventType: string;
  entityType: 'EXAMINATION_ORDER' | 'PATIENT' | 'REPORT' | 'DICOM_UPLOAD';
  entityId: string;
  actor: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['EXAMINATION_ORDER', 'PATIENT', 'REPORT', 'DICOM_UPLOAD'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: String,
      default: 'Demo User',
    },
    details: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
