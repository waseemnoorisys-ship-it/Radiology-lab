import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  patientId: string;
  fullName: string;
  dateOfBirth?: Date;
  age?: number;
  gender: 'M' | 'F' | 'O' | 'UNKNOWN';
  contactPhone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Patient full name is required'],
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
      min: 0,
      max: 130,
    },
    gender: {
      type: String,
      enum: ['M', 'F', 'O', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search index on patientId and fullName for fast worklist and autocomplete queries
PatientSchema.index({ fullName: 'text', patientId: 'text' });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
