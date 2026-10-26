import {
  Patient,
  ModalityMaster,
  BodyRegionMaster,
  ExaminationMaster,
  SupportingMaster,
  ExaminationOrder,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchModalities(): Promise<ModalityMaster[]> {
  const res = await fetch(`${API_BASE}/masters/modalities`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchBodyRegions(modality?: string): Promise<BodyRegionMaster[]> {
  const url = modality
    ? `${API_BASE}/masters/body-regions?modality=${encodeURIComponent(modality)}`
    : `${API_BASE}/masters/body-regions`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function fetchExaminations(modality?: string, bodyRegion?: string): Promise<ExaminationMaster[]> {
  const params = new URLSearchParams();
  if (modality) params.append('modality', modality);
  if (bodyRegion) params.append('bodyRegion', bodyRegion);

  const res = await fetch(`${API_BASE}/masters/examinations?${params.toString()}`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchSupporting(category: string): Promise<SupportingMaster[]> {
  const res = await fetch(`${API_BASE}/masters/supporting?category=${encodeURIComponent(category)}`);
  const json = await res.json();
  return json.data || [];
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const res = await fetch(`${API_BASE}/patients?search=${encodeURIComponent(query)}`);
  const json = await res.json();
  return json.data || [];
}

export async function createPatient(data: Partial<Patient>): Promise<{ success: boolean; data?: Patient; error?: string }> {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createExamination(data: Partial<ExaminationOrder>): Promise<{ success: boolean; data?: ExaminationOrder; error?: string }> {
  const res = await fetch(`${API_BASE}/examinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchExaminationsList(): Promise<ExaminationOrder[]> {
  const res = await fetch(`${API_BASE}/examinations`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchWorklist(params?: import('../types').WorklistQuery): Promise<import('../types').WorklistResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.search) searchParams.append('search', params.search);
    if (params.modality) searchParams.append('modality', params.modality);
    if (params.workflowStatus) searchParams.append('workflowStatus', params.workflowStatus);
    if (params.imageAvailability) searchParams.append('imageAvailability', params.imageAvailability);
    if (params.dateRange) searchParams.append('dateRange', params.dateRange);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
  }

  const queryStr = searchParams.toString();
  const url = queryStr ? `${API_BASE}/worklist?${queryStr}` : `${API_BASE}/worklist`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchExaminationById(id: string): Promise<{ success: boolean; data?: ExaminationOrder; error?: string }> {
  const res = await fetch(`${API_BASE}/examinations/${encodeURIComponent(id)}`);
  return res.json();
}

export async function updateExaminationWorkflowStatus(
  id: string,
  workflowStatus: string,
  actor?: string
): Promise<{ success: boolean; data?: ExaminationOrder; error?: string }> {
  const res = await fetch(`${API_BASE}/worklist/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowStatus, actor }),
  });
  return res.json();
}

export async function uploadExaminationDicom(
  orderId: string,
  files: File[]
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  details?: Array<{ file: string; reason: string }>;
  data?: {
    orderId: string;
    accessionNumber: string;
    orthancStudyId: string;
    studyInstanceUid: string;
    seriesCount: number;
    instanceCount: number;
    imageAvailability: string;
    workflowStatus: string;
    dicomWebReady: boolean;
    ohifViewerUrl: string;
  };
}> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_BASE}/examinations/${encodeURIComponent(orderId)}/dicom`, {
    method: 'POST',
    body: formData,
  });

  return res.json();
}

export async function fetchReportByOrderId(orderId: string): Promise<{
  success: boolean;
  data?: {
    order: import('../types').ExaminationOrder;
    report: import('../types').Report | null;
    template: import('../types').ReportTemplate | null;
  };
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/reports/order/${encodeURIComponent(orderId)}`);
  return res.json();
}

export async function saveDraftReport(
  orderId: string,
  payload: any
): Promise<{ success: boolean; message?: string; data?: import('../types').Report; error?: string }> {
  const res = await fetch(`${API_BASE}/reports/order/${encodeURIComponent(orderId)}/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function finalizeReport(
  orderId: string,
  payload: any
): Promise<{ success: boolean; message?: string; data?: import('../types').Report; error?: string }> {
  const res = await fetch(`${API_BASE}/reports/order/${encodeURIComponent(orderId)}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
