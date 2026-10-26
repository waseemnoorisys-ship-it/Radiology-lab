import mongoose, { Schema } from 'mongoose';

const AuditEventSchema = new Schema(
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

export const AuditEvent = mongoose.model('AuditEvent', AuditEventSchema);
