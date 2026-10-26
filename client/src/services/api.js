const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchModalities() {
  const res = await fetch(`${API_BASE}/masters/modalities`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchBodyRegions(modality) {
  const url = modality
    ? `${API_BASE}/masters/body-regions?modality=${encodeURIComponent(modality)}`
    : `${API_BASE}/masters/body-regions`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function fetchExaminations(modality, bodyRegion) {
  const params = new URLSearchParams();
  if (modality) params.append('modality', modality);
  if (bodyRegion) params.append('bodyRegion', bodyRegion);

  const res = await fetch(`${API_BASE}/masters/examinations?${params.toString()}`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchSupporting(category) {
  const res = await fetch(`${API_BASE}/masters/supporting?category=${encodeURIComponent(category)}`);
  const json = await res.json();
  return json.data || [];
}

export async function searchPatients(query) {
  const res = await fetch(`${API_BASE}/patients?search=${encodeURIComponent(query)}`);
  const json = await res.json();
  return json.data || [];
}

export async function createPatient(data) {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createExamination(data) {
  const res = await fetch(`${API_BASE}/examinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchExaminationsList() {
  const res = await fetch(`${API_BASE}/examinations`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchWorklist(params) {
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

export async function fetchExaminationById(id) {
  const res = await fetch(`${API_BASE}/examinations/${encodeURIComponent(id)}`);
  return res.json();
}

export async function updateExaminationWorkflowStatus(id, workflowStatus, actor) {
  const res = await fetch(`${API_BASE}/worklist/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowStatus, actor }),
  });
  return res.json();
}

export async function uploadExaminationDicom(orderId, files) {
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

export async function fetchReportByOrderId(orderId) {
  const res = await fetch(`${API_BASE}/reports/order/${encodeURIComponent(orderId)}`);
  return res.json();
}

export async function saveDraftReport(orderId, payload) {
  const res = await fetch(`${API_BASE}/reports/order/${encodeURIComponent(orderId)}/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function finalizeReport(orderId, payload) {
  const res = await fetch(`${API_BASE}/reports/order/${encodeURIComponent(orderId)}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function linkLocalStudyToOrder(orderId, payload) {
  const res = await fetch(`${API_BASE}/examinations/${encodeURIComponent(orderId)}/local-study`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
