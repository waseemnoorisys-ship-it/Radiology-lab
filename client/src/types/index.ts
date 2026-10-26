export interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  gender: 'M' | 'F' | 'O' | 'UNKNOWN';
  contactPhone?: string;
  email?: string;
  address?: string;
}

export interface ModalityMaster {
  _id: string;
  code: string;
  displayName: string;
  description?: string;
  order: number;
}

export interface BodyRegionMaster {
  _id: string;
  code: string;
  displayName: string;
  applicableModalities: string[];
  supportsLaterality: boolean;
  order: number;
}

export interface ExaminationMaster {
  _id: string;
  code: string;
  displayName: string;
  modalityCode: string;
  bodyRegionCode: string;
  lateralityRequired: boolean;
  contrastApplicability: 'WITHOUT_CONTRAST' | 'WITH_CONTRAST' | 'WITHOUT_AND_WITH_CONTRAST' | 'NOT_APPLICABLE';
  standardProtocols: string[];
  clinicalIndications: string[];
  defaultTemplateCode: string;
}

export interface SupportingMaster {
  _id: string;
  category: 'REFERRING_DOCTOR' | 'FACILITY' | 'DEPARTMENT';
  code: string;
  displayName: string;
}

export interface ExaminationOrder {
  _id: string;
  orderId: string;
  accessionNumber: string;
  patient?: Patient | {
    _id?: string;
    age?: number;
    gender?: string;
    contactPhone?: string;
    dateOfBirth?: string;
  };
  patientId: string;
  patientName: string;
  modality: string;
  bodyRegion: string;
  examinationName: string;
  examinationCode?: string;
  laterality: string;
  contrast: string;
  protocol?: string;
  clinicalIndication?: string;
  referringDoctor?: string;
  performingFacility?: string;
  additionalNotes?: string;
  workflowStatus:
    | 'PENDING_UPLOAD'
    | 'PENDING_REPORT'
    | 'IN_PROGRESS'
    | 'DRAFT_SAVED'
    | 'FINALIZED'
    | 'AMENDED'
    | 'CANCELLED';
  imageAvailability: 'NO_IMAGES' | 'UPLOADING' | 'AVAILABLE' | 'FAILED';
  orthancStudyId?: string;
  studyInstanceUid?: string;
  seriesCount?: number;
  instanceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorklistQuery {
  search?: string;
  modality?: string;
  workflowStatus?: string;
  imageAvailability?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface WorklistStats {
  total: number;
  pendingUpload: number;
  pendingReport: number;
  inProgress: number;
  finalized: number;
  imagesAvailable: number;
}

export interface WorklistResponse {
  success: boolean;
  stats: WorklistStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  data: ExaminationOrder[];
}

export type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'number';

export interface TemplateField {
  fieldId: string;
  label: string;
  type: TemplateFieldType;
  options?: string[];
  unit?: string;
  required?: boolean;
  defaultValue?: any;
  helpText?: string;
}

export interface TemplateSection {
  sectionId: string;
  title: string;
  order: number;
  description?: string;
  fields: TemplateField[];
}

export interface ReportTemplate {
  _id: string;
  templateCode: string;
  name: string;
  modalityCode: string;
  applicableExaminations: string[];
  version: number;
  sections: TemplateSection[];
  isActive: boolean;
}

export interface ReportSectionValue {
  sectionId: string;
  title: string;
  fields: Record<string, any>;
}

export interface ReportAmendment {
  version: number;
  amendedAt: string;
  amendedBy: string;
  reason: string;
  previousContent: {
    sections: ReportSectionValue[];
    findings: string;
    impression: string;
    recommendations?: string;
  };
}

export interface Report {
  _id: string;
  reportId: string;
  examination: string | ExaminationOrder;
  orderId: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  modality: string;
  examinationName: string;
  templateCode: string;
  templateVersion: number;
  status: 'DRAFT' | 'FINALIZED' | 'AMENDED';
  radiologist: {
    name: string;
    licenseNumber?: string;
    role?: string;
  };
  sections: ReportSectionValue[];
  findings: string;
  impression: string;
  recommendations?: string;
  technique?: string;
  comparison?: string;
  criticalResultsNotified: boolean;
  criticalNotificationDetails?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  version: number;
  amendmentHistory?: ReportAmendment[];
  createdAt: string;
  updatedAt: string;
}


