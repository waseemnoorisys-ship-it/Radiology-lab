# 🏥 Radiology Lab Management System (RadFlow) - API Documentation

A full-stack, enterprise-grade Radiology Information System (RIS) and Picture Archiving and Communication System (PACS) workflow solution built with React, Vite, Express, TypeScript, MongoDB, Orthanc PACS, and the OHIF Zero-Footprint Medical Viewer.

---

## 📑 Table of Contents
1. [Architecture & Port Allocation](#-architecture--port-allocation)
2. [Standard Response Format](#-standard-response-format)
3. [Health & System Diagnostics API](#1-health--system-diagnostics-api)
4. [Master Data Catalog API](#2-master-data-catalog-api)
5. [Patient Management API](#3-patient-management-api)
6. [Examinations & DICOM Ingestion API](#4-examinations--dicom-ingestion-api)
7. [Radiologist Worklist API](#5-radiologist-worklist-api)
8. [Structured Reporting & PDF Generation API](#6-structured-reporting--pdf-generation-api)
9. [DICOMweb & PACS Proxy Endpoints](#7-dicomweb--pacs-proxy-endpoints)

---

## 🏛 Architecture & Port Allocation

| Service / Component | Protocol / Tech | Local URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 18 / Vite / Tailwind | `http://localhost:5173` | Operator reception, radiologist worklist, viewer, report editor |
| **Backend API Server** | Node.js / Express / TypeScript | `http://localhost:5000/api` | REST API endpoints, DICOM unifier, PDF generator |
| **PACS Server** | Orthanc DICOM Server | `http://localhost:8042` | DICOM storage, DICOMweb API, REST archive |
| **DICOM Protocol Port** | C-STORE / C-FIND / C-MOVE | `localhost:4242` | DICOM DIMSE networking port for modality machines |
| **Database** | MongoDB | `mongodb://127.0.0.1:27017/radiology_lab` | Stores patients, orders, reports, masters, and audit logs |

---

## 📋 Standard Response Format

Unless explicitly noted (such as raw binary PDF downloads), all REST API responses adhere to the following unified JSON envelope:

### Success Response
```json
{
  "success": true,
  "message": "Optional descriptive human-readable message",
  "count": 12,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description or validation failure message",
  "details": [ ... ]
}
```

---

## 1. Health & System Diagnostics API

### `GET /api/health`
Checks the live connectivity status of the Express API server, the MongoDB database connection, and the Orthanc PACS server.

- **Method:** `GET`
- **URL:** `/api/health`
- **Headers:** None
- **Request Body:** None
- **Status Codes:**
  - `200 OK`: All services are healthy and connected.
  - `503 Service Unavailable`: Database or Orthanc PACS is disconnected.

#### Expected Output
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2026-10-23T16:00:00.000Z",
  "uptimeSeconds": 3600,
  "services": {
    "api": "healthy",
    "database": {
      "status": "connected",
      "name": "radiology_lab"
    },
    "orthanc": {
      "status": "connected",
      "url": "http://127.0.0.1:8042",
      "info": {
        "name": "Orthanc Radiology Lab",
        "version": "1.12.3",
        "dicomAet": "ORTHANC",
        "dicomPort": 4242,
        "httpPort": 8042
      }
    }
  }
}
```

---

## 2. Master Data Catalog API

Used to populate dynamic cascading dropdowns on the operator registration and examination forms.

### 2.1 `GET /api/masters/modalities`
Retrieves all active imaging modalities sorted by priority order.

- **Method:** `GET`
- **URL:** `/api/masters/modalities`
- **Request Body:** None
- **Status Code:** `200 OK`

#### Expected Output
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "_id": "67b93a00e4b02a11b81e1001",
      "code": "CR",
      "displayName": "Computed Radiography (X-Ray)",
      "modalityType": "CR",
      "description": "General projection radiography",
      "order": 1,
      "isActive": true
    },
    {
      "_id": "67b93a00e4b02a11b81e1002",
      "code": "CT",
      "displayName": "Computed Tomography (CT Scan)",
      "modalityType": "CT",
      "description": "Cross-sectional computed tomography",
      "order": 2,
      "isActive": true
    },
    {
      "_id": "67b93a00e4b02a11b81e1003",
      "code": "MR",
      "displayName": "Magnetic Resonance Imaging (MRI)",
      "modalityType": "MR",
      "description": "High-field magnetic resonance imaging",
      "order": 3,
      "isActive": true
    },
    {
      "_id": "67b93a00e4b02a11b81e1004",
      "code": "US",
      "displayName": "Ultrasound / Sonography",
      "modalityType": "US",
      "description": "Diagnostic medical sonography",
      "order": 4,
      "isActive": true
    }
  ]
}
```

---

### 2.2 `GET /api/masters/body-regions`
Retrieves anatomical body regions, filterable by applicable modality.

- **Method:** `GET`
- **URL:** `/api/masters/body-regions`
- **Query Parameters:**
  - `modality` *(optional)*: E.g., `CT`, `MR`, `CR`, `US`.
- **Request Body:** None
- **Status Code:** `200 OK`

#### Example Request
```http
GET /api/masters/body-regions?modality=MR HTTP/1.1
```

#### Expected Output
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "67b93a00e4b02a11b81e1010",
      "code": "HEAD_BRAIN",
      "displayName": "Head & Brain",
      "applicableModalities": ["CT", "MR", "CR"],
      "order": 1,
      "isActive": true
    },
    {
      "_id": "67b93a00e4b02a11b81e1011",
      "code": "CHEST",
      "displayName": "Chest / Thorax",
      "applicableModalities": ["CR", "CT", "MR"],
      "order": 2,
      "isActive": true
    },
    {
      "_id": "67b93a00e4b02a11b81e1012",
      "code": "SPINE",
      "displayName": "Spine (Cervical / Lumbar)",
      "applicableModalities": ["CR", "CT", "MR"],
      "order": 3,
      "isActive": true
    }
  ]
}
```

---

### 2.3 `GET /api/masters/examinations`
Retrieves the specific diagnostic examination protocols based on selected modality and body region.

- **Method:** `GET`
- **URL:** `/api/masters/examinations`
- **Query Parameters:**
  - `modality` *(optional)*: Modality code (e.g. `MR`, `CT`)
  - `bodyRegion` *(optional)*: Body region code (e.g. `HEAD_BRAIN`, `CHEST`)
- **Request Body:** None
- **Status Code:** `200 OK`

#### Example Request
```http
GET /api/masters/examinations?modality=MR&bodyRegion=HEAD_BRAIN HTTP/1.1
```

#### Expected Output
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "67b93a00e4b02a11b81e1020",
      "code": "MR_BRAIN_NC",
      "displayName": "MRI Brain without Contrast",
      "modalityCode": "MR",
      "bodyRegionCode": "HEAD_BRAIN",
      "cptCode": "70551",
      "typicalDurationMinutes": 30,
      "defaultContrast": "WITHOUT_CONTRAST",
      "defaultLaterality": "NOT_APPLICABLE",
      "order": 1,
      "isActive": true
    },
    {
      "_id": "67b93a00e4b02a11b81e1021",
      "code": "MR_BRAIN_C",
      "displayName": "MRI Brain with Contrast (Gadolinium)",
      "modalityCode": "MR",
      "bodyRegionCode": "HEAD_BRAIN",
      "cptCode": "70552",
      "typicalDurationMinutes": 45,
      "defaultContrast": "WITH_CONTRAST",
      "defaultLaterality": "NOT_APPLICABLE",
      "order": 2,
      "isActive": true
    }
  ]
}
```

---

### 2.4 `GET /api/masters/templates`
Retrieves radiologist structured report templates matching modality or examination code.

- **Method:** `GET`
- **URL:** `/api/masters/templates`
- **Query Parameters:**
  - `code` *(optional)*: Template code (e.g. `TPL_CHEST_XRAY`)
  - `modality` *(optional)*: Modality code (e.g. `CR`, `CT`, `MR`)
- **Request Body:** None
- **Status Code:** `200 OK`

#### Expected Output
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "67b93a00e4b02a11b81e1030",
      "templateCode": "TPL_CHEST_XRAY",
      "name": "Standard Chest Radiography (PA & Lateral)",
      "modalityCode": "CR",
      "applicableExaminations": ["CR_CHEST_PA", "CR_CHEST_2V"],
      "defaultTechnique": "PA and lateral views of the chest obtained in upright inspiration.",
      "defaultFindings": "Lungs are clear bilaterally without focal consolidation, pneumothorax, or pleural effusion. Cardiomediastinal silhouette is within normal limits. Osseous structures are unremarkable.",
      "defaultImpression": "No acute cardiopulmonary disease.",
      "defaultRecommendations": "None.",
      "sections": [
        { "key": "lungs", "label": "Lungs & Pleura", "defaultValue": "Clear bilaterally." },
        { "key": "heart", "label": "Heart & Mediastinum", "defaultValue": "Normal size and contour." }
      ],
      "isActive": true
    }
  ]
}
```

---

### 2.5 `GET /api/masters/supporting`
Retrieves standard medical dropdown classifications like Lateralities, Contrast Options, and Priority Tiers.

- **Method:** `GET`
- **URL:** `/api/masters/supporting`
- **Query Parameters:**
  - `category` *(optional)*: E.g., `LATERALITY`, `CONTRAST`, `WORKFLOW_STATUS`
- **Request Body:** None
- **Status Code:** `200 OK`

#### Expected Output
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "67b93a00e4b02a11b81e1041",
      "category": "CONTRAST",
      "code": "WITHOUT_CONTRAST",
      "displayName": "Without Contrast (Non-contrast)",
      "order": 1,
      "isActive": true
    },
    {
      "_id": "67b93a00e4b02a11b81e1042",
      "category": "CONTRAST",
      "code": "WITH_CONTRAST",
      "displayName": "With IV Contrast",
      "order": 2,
      "isActive": true
    }
  ]
}
```

---

## 3. Patient Management API

### 3.1 `GET /api/patients`
Search and list registered patients by Medical Record Number (MRN), full name, or phone number.

- **Method:** `GET`
- **URL:** `/api/patients`
- **Query Parameters:**
  - `search` *(optional)*: Substring search matching Patient ID, name, or phone
  - `limit` *(optional, default: 20)*: Maximum number of records to return
- **Status Code:** `200 OK`

#### Example Request
```http
GET /api/patients?search=John HTTP/1.1
```

#### Expected Output
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "67b93b50e4b02a11b81e1088",
      "patientId": "PAT-2026-001",
      "fullName": "John Doe",
      "dateOfBirth": "1985-04-12T00:00:00.000Z",
      "age": 41,
      "gender": "M",
      "contactPhone": "+1-555-0199",
      "email": "johndoe@example.com",
      "address": "742 Evergreen Terrace, Springfield",
      "createdAt": "2026-10-22T08:30:00.000Z",
      "updatedAt": "2026-10-22T08:30:00.000Z"
    }
  ]
}
```

---

### 3.2 `GET /api/patients/:id`
Retrieves a single patient record by MongoDB `_id` or `patientId`.

- **Method:** `GET`
- **URL:** `/api/patients/:id`
- **Path Parameters:**
  - `id`: MongoDB ObjectId or patient MRN string (e.g. `PAT-2026-001`)
- **Status Codes:**
  - `200 OK`: Patient found.
  - `404 Not Found`: No patient matched.

#### Expected Output
```json
{
  "success": true,
  "data": {
    "_id": "67b93b50e4b02a11b81e1088",
    "patientId": "PAT-2026-001",
    "fullName": "John Doe",
    "dateOfBirth": "1985-04-12T00:00:00.000Z",
    "age": 41,
    "gender": "M",
    "contactPhone": "+1-555-0199",
    "email": "johndoe@example.com",
    "address": "742 Evergreen Terrace, Springfield"
  }
}
```

---

### 3.3 `POST /api/patients`
Registers a new patient record and records an audit trail event.

- **Method:** `POST`
- **URL:** `/api/patients`
- **Headers:** `Content-Type: application/json`
- **Status Codes:**
  - `201 Created`: Patient created successfully.
  - `400 Bad Request`: Zod validation error (invalid email, missing name).
  - `409 Conflict`: `patientId` already registered in database.

#### Example Request Body
```json
{
  "patientId": "PAT-2026-002",
  "fullName": "Jane Smith",
  "dateOfBirth": "1992-08-25",
  "age": 34,
  "gender": "F",
  "contactPhone": "+1-555-0234",
  "email": "jane.smith@example.com",
  "address": "123 Elm Street, Cityville"
}
```

#### Expected Output
```json
{
  "success": true,
  "message": "Patient record created successfully",
  "data": {
    "_id": "67b93c80e4b02a11b81e1095",
    "patientId": "PAT-2026-002",
    "fullName": "Jane Smith",
    "dateOfBirth": "1992-08-25T00:00:00.000Z",
    "age": 34,
    "gender": "F",
    "contactPhone": "+1-555-0234",
    "email": "jane.smith@example.com",
    "address": "123 Elm Street, Cityville",
    "createdAt": "2026-10-23T16:02:00.000Z",
    "updatedAt": "2026-10-23T16:02:00.000Z"
  }
}
```

---

## 4. Examinations & DICOM Ingestion API

### 4.1 `GET /api/examinations`
Search and filter radiology examination orders.

- **Method:** `GET`
- **URL:** `/api/examinations`
- **Query Parameters:**
  - `patientId` *(optional)*: Filter by patient ID
  - `modality` *(optional)*: Filter by modality code (`CR`, `CT`, `MR`, `US`)
  - `status` *(optional)*: Filter by `workflowStatus`
  - `search` *(optional)*: Matches Order ID, Accession, Patient Name, or Exam Name
  - `limit` *(optional, default: 50)*
  - `skip` *(optional, default: 0)*
- **Status Code:** `200 OK`

#### Expected Output
```json
{
  "success": true,
  "total": 1,
  "count": 1,
  "data": [
    {
      "_id": "67b93df0e4b02a11b81e1102",
      "orderId": "ORD-20261022-4821",
      "accessionNumber": "ACC-20261022-7934",
      "patientId": "PAT-2026-001",
      "patientName": "John Doe",
      "modality": "CR",
      "bodyRegion": "CHEST",
      "examinationCode": "CR_CHEST_PA",
      "examinationName": "Chest PA View",
      "laterality": "NOT_APPLICABLE",
      "contrast": "WITHOUT_CONTRAST",
      "workflowStatus": "PENDING_REPORT",
      "imageAvailability": "AVAILABLE",
      "seriesCount": 1,
      "instanceCount": 4,
      "studyInstanceUid": "1.2.840.113619.2.55.3.604688410.551.1165564883.923",
      "createdAt": "2026-10-22T08:35:00.000Z"
    }
  ]
}
```

---

### 4.2 `GET /api/examinations/:id`
Retrieves complete examination details with the embedded patient demographic record.

- **Method:** `GET`
- **URL:** `/api/examinations/:id`
- **Path Parameters:**
  - `id`: MongoDB ObjectId, `orderId` (e.g. `ORD-20261022-4821`), or `accessionNumber`
- **Status Codes:**
  - `200 OK`: Examination found.
  - `404 Not Found`: Order not found.

#### Expected Output
```json
{
  "success": true,
  "data": {
    "_id": "67b93df0e4b02a11b81e1102",
    "orderId": "ORD-20261022-4821",
    "accessionNumber": "ACC-20261022-7934",
    "patient": {
      "_id": "67b93b50e4b02a11b81e1088",
      "patientId": "PAT-2026-001",
      "fullName": "John Doe",
      "age": 41,
      "gender": "M",
      "contactPhone": "+1-555-0199"
    },
    "patientId": "PAT-2026-001",
    "patientName": "John Doe",
    "modality": "CR",
    "bodyRegion": "CHEST",
    "examinationCode": "CR_CHEST_PA",
    "examinationName": "Chest PA View",
    "laterality": "NOT_APPLICABLE",
    "contrast": "WITHOUT_CONTRAST",
    "protocol": "Standard Posteroanterior Chest",
    "clinicalIndication": "Cough and mild dyspnea for 5 days",
    "referringDoctor": "Dr. Sarah Adams",
    "performingFacility": "Main Radiology Suite",
    "workflowStatus": "PENDING_REPORT",
    "imageAvailability": "AVAILABLE",
    "orthancStudyId": "e1f3a2c4-8b9a1d2e-3f4a5b6c-7d8e9f0a",
    "studyInstanceUid": "1.2.840.113619.2.55.3.604688410.551.1165564883.923",
    "seriesCount": 1,
    "instanceCount": 4
  }
}
```

---

### 4.3 `POST /api/examinations`
Creates a new examination order scheduled for scanning and imaging upload. Automatically allocates collision-resistant `orderId` and `accessionNumber`.

- **Method:** `POST`
- **URL:** `/api/examinations`
- **Headers:** `Content-Type: application/json`
- **Status Codes:**
  - `201 Created`: Order created.
  - `400 Bad Request`: Validation failure.
  - `404 Not Found`: Referenced `patientId` does not exist.

#### Example Request Body
```json
{
  "patientId": "PAT-2026-001",
  "modality": "CR",
  "bodyRegion": "CHEST",
  "examinationCode": "CR_CHEST_PA",
  "examinationName": "Chest PA View",
  "laterality": "NOT_APPLICABLE",
  "contrast": "WITHOUT_CONTRAST",
  "protocol": "Standard Posteroanterior Chest",
  "clinicalIndication": "Persistent cough, evaluate for infiltrates",
  "referringDoctor": "Dr. Sarah Adams",
  "performingFacility": "Main Radiology Suite",
  "additionalNotes": "Patient had mild fever yesterday."
}
```

#### Expected Output
```json
{
  "success": true,
  "message": "Examination order created successfully",
  "data": {
    "_id": "67b93df0e4b02a11b81e1102",
    "orderId": "ORD-20261023-5512",
    "accessionNumber": "ACC-20261023-8821",
    "patient": "67b93b50e4b02a11b81e1088",
    "patientId": "PAT-2026-001",
    "patientName": "John Doe",
    "modality": "CR",
    "bodyRegion": "CHEST",
    "examinationCode": "CR_CHEST_PA",
    "examinationName": "Chest PA View",
    "laterality": "NOT_APPLICABLE",
    "contrast": "WITHOUT_CONTRAST",
    "workflowStatus": "PENDING_UPLOAD",
    "imageAvailability": "NO_IMAGES",
    "createdAt": "2026-10-23T16:05:00.000Z"
  }
}
```

---

### 4.4 `POST /api/examinations/:id/dicom`
Uploads one or multiple `.dcm` DICOM slices/files for an examination order.
- Validates DICOM binary Part-10 magic bytes (`DICM` at offset 128).
- Automatically unifies disparate `StudyInstanceUID` tags across files to merge all uploaded slices into a single unified patient study in Orthanc PACS.
- Automatically transitions order `workflowStatus` to `PENDING_REPORT` and `imageAvailability` to `AVAILABLE`.

- **Method:** `POST`
- **URL:** `/api/examinations/:id/dicom`
- **Path Parameters:**
  - `id`: Order ID (e.g. `ORD-20261023-5512`), Accession Number, or Mongo ID
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:**
  - `files`: One or more binary DICOM `.dcm` files (up to 50 files per request)
- **Status Codes:**
  - `200 OK`: Upload and study unification successful.
  - `400 Bad Request`: Missing files or non-DICOM binary detected.
  - `404 Not Found`: Examination order not found.

#### Example cURL Command
```bash
curl -X POST "http://localhost:5000/api/examinations/ORD-20261023-5512/dicom" \
  -F "files=@slice1.dcm" \
  -F "files=@slice2.dcm" \
  -F "files=@slice3.dcm"
```

#### Expected Output
```json
{
  "success": true,
  "message": "Successfully uploaded and archived 3 DICOM instance(s).",
  "data": {
    "orderId": "ORD-20261023-5512",
    "accessionNumber": "ACC-20261023-8821",
    "orthancStudyId": "e1f3a2c4-8b9a1d2e-3f4a5b6c-7d8e9f0a",
    "studyInstanceUid": "1.2.840.113619.2.55.3.604688410.551.1165564883.923",
    "seriesCount": 1,
    "instanceCount": 3,
    "imageAvailability": "AVAILABLE",
    "workflowStatus": "PENDING_REPORT",
    "dicomWebReady": true,
    "ohifViewerUrl": "/ohif/viewer?StudyInstanceUIDs=1.2.840.113619.2.55.3.604688410.551.1165564883.923"
  }
}
```

---

## 5. Radiologist Worklist API

### 5.1 `GET /api/worklist`
The primary operational endpoint powering the Radiologist Worklist. Provides real-time filtering, text search across multiple fields, multi-key sorting, pagination, and overall summary dashboard metrics.

- **Method:** `GET`
- **URL:** `/api/worklist`
- **Query Parameters:**
  - `search` *(optional)*: Full-text match for MRN, Patient Name, Order ID, Accession Number, Exam Name, or Doctor
  - `modality` *(optional)*: `CR`, `CT`, `MR`, `US`, or `ALL`
  - `workflowStatus` *(optional)*: Single status or comma-separated list (e.g. `PENDING_REPORT,IN_PROGRESS`)
  - `imageAvailability` *(optional)*: `AVAILABLE`, `NO_IMAGES`, `UPLOADING`, `FAILED`
  - `dateRange` *(optional)*: `today`, `yesterday`, `week`, `month`, `all`
  - `sortBy` *(optional, default: `createdAt`)*: Field to sort by
  - `sortOrder` *(optional, default: `desc`)*: `asc` or `desc`
  - `page` *(optional, default: 1)*
  - `limit` *(optional, default: 50)*
- **Status Code:** `200 OK`

#### Expected Output
```json
{
  "success": true,
  "stats": {
    "total": 15,
    "pendingUpload": 3,
    "pendingReport": 6,
    "inProgress": 2,
    "finalized": 4,
    "imagesAvailable": 12
  },
  "pagination": {
    "total": 6,
    "page": 1,
    "limit": 50,
    "pages": 1
  },
  "data": [
    {
      "_id": "67b93df0e4b02a11b81e1102",
      "orderId": "ORD-20261023-5512",
      "accessionNumber": "ACC-20261023-8821",
      "patientId": "PAT-2026-001",
      "patientName": "John Doe",
      "patient": {
        "_id": "67b93b50e4b02a11b81e1088",
        "age": 41,
        "gender": "M",
        "contactPhone": "+1-555-0199"
      },
      "modality": "CR",
      "bodyRegion": "CHEST",
      "examinationCode": "CR_CHEST_PA",
      "examinationName": "Chest PA View",
      "workflowStatus": "PENDING_REPORT",
      "imageAvailability": "AVAILABLE",
      "studyInstanceUid": "1.2.840.113619.2.55.3.604688410.551.1165564883.923",
      "seriesCount": 1,
      "instanceCount": 3,
      "referringDoctor": "Dr. Sarah Adams",
      "createdAt": "2026-10-23T16:05:00.000Z"
    }
  ]
}
```

---

### 5.2 `GET /api/worklist/stats`
Returns aggregated case counts grouped by modality and workflow status.

- **Method:** `GET`
- **URL:** `/api/worklist/stats`
- **Status Code:** `200 OK`

#### Expected Output
```json
{
  "success": true,
  "data": {
    "byStatus": {
      "PENDING_UPLOAD": 3,
      "PENDING_REPORT": 6,
      "IN_PROGRESS": 2,
      "FINALIZED": 4
    },
    "byModality": {
      "CR": 8,
      "CT": 4,
      "MR": 3
    }
  }
}
```

---

### 5.3 `PATCH /api/worklist/:id/status`
Updates the workflow stage of an examination order and creates an audit trail entry.

- **Method:** `PATCH`
- **URL:** `/api/worklist/:id/status`
- **Path Parameters:**
  - `id`: Order ID, Accession Number, or Mongo ID
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "workflowStatus": "IN_PROGRESS",
    "actor": "Dr. Gregory House, MD"
  }
  ```
- **Allowed `workflowStatus` values:**
  - `PENDING_UPLOAD`
  - `PENDING_REPORT`
  - `IN_PROGRESS`
  - `DRAFT_SAVED`
  - `FINALIZED`
  - `CANCELLED`
- **Status Codes:**
  - `200 OK`: Status updated.
  - `400 Bad Request`: Invalid status string.
  - `404 Not Found`: Order not found.

#### Expected Output
```json
{
  "success": true,
  "message": "Workflow status updated from PENDING_REPORT to IN_PROGRESS",
  "data": {
    "_id": "67b93df0e4b02a11b81e1102",
    "orderId": "ORD-20261023-5512",
    "workflowStatus": "IN_PROGRESS",
    "updatedAt": "2026-10-23T16:10:00.000Z"
  }
}
```

---

## 6. Structured Reporting & PDF Generation API

### 6.1 `GET /api/reports/order/:orderId`
Retrieves the active report, linked examination order, and the applicable structured report template.

- **Method:** `GET`
- **URL:** `/api/reports/order/:orderId`
- **Path Parameters:**
  - `orderId`: Order ID (e.g. `ORD-20261023-5512`) or Accession Number
- **Status Codes:**
  - `200 OK`: Data loaded successfully.
  - `404 Not Found`: Examination order not found.

#### Expected Output
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "67b93df0e4b02a11b81e1102",
      "orderId": "ORD-20261023-5512",
      "accessionNumber": "ACC-20261023-8821",
      "patientName": "John Doe",
      "modality": "CR",
      "examinationName": "Chest PA View"
    },
    "report": {
      "_id": "67b93f00e4b02a11b81e1150",
      "reportId": "REP-20261023-1192",
      "status": "DRAFT",
      "findings": "Lungs demonstrate mild hyperinflation...",
      "impression": "No acute focal consolidation or pneumothorax.",
      "version": 1
    },
    "template": {
      "_id": "67b93a00e4b02a11b81e1030",
      "templateCode": "TPL_CHEST_XRAY",
      "name": "Standard Chest Radiography (PA & Lateral)",
      "defaultFindings": "Lungs are clear bilaterally...",
      "defaultImpression": "No acute cardiopulmonary disease."
    }
  }
}
```

---

### 6.2 `GET /api/reports/:id`
Retrieves a standalone report by its MongoDB `_id` or `reportId`.

- **Method:** `GET`
- **URL:** `/api/reports/:id`
- **Status Codes:**
  - `200 OK`: Report found.
  - `404 Not Found`: Report not found.

#### Expected Output
```json
{
  "success": true,
  "data": {
    "_id": "67b93f00e4b02a11b81e1150",
    "reportId": "REP-20261023-1192",
    "orderId": "ORD-20261023-5512",
    "accessionNumber": "ACC-20261023-8821",
    "patientId": "PAT-2026-001",
    "patientName": "John Doe",
    "status": "FINALIZED",
    "findings": "Heart size is normal. Normal pulmonary vascularity.",
    "impression": "Normal chest radiograph.",
    "finalizedBy": "Dr. Gregory House, MD",
    "finalizedAt": "2026-10-23T16:15:00.000Z",
    "version": 1
  }
}
```

---

### 6.3 `POST /api/reports/order/:orderId/draft`
Saves or auto-saves an in-progress draft report without finalizing. Automatically transitions order status to `DRAFT_SAVED`.

- **Method:** `POST`
- **URL:** `/api/reports/order/:orderId/draft`
- **Path Parameters:**
  - `orderId`: Order ID or Accession Number
- **Headers:** `Content-Type: application/json`
- **Status Codes:**
  - `200 OK`: Draft saved.
  - `400 Bad Request`: Cannot draft an already finalized report (amendment required).
  - `404 Not Found`: Examination order not found.

#### Example Request Body
```json
{
  "templateCode": "TPL_CHEST_XRAY",
  "templateVersion": 1,
  "technique": "PA view of chest in upright position.",
  "findings": "Lungs are clear without focal infiltrates. Cardiothoracic ratio is normal.",
  "impression": "No radiographic evidence of acute cardiopulmonary disease.",
  "recommendations": "Routine clinical follow-up.",
  "criticalResultsNotified": false,
  "radiologist": {
    "name": "Dr. Gregory House, MD",
    "licenseNumber": "RAD-98234",
    "role": "Consultant Radiologist"
  }
}
```

#### Expected Output
```json
{
  "success": true,
  "message": "Draft report saved successfully.",
  "data": {
    "_id": "67b93f00e4b02a11b81e1150",
    "reportId": "REP-20261023-1192",
    "orderId": "ORD-20261023-5512",
    "status": "DRAFT",
    "findings": "Lungs are clear without focal infiltrates. Cardiothoracic ratio is normal.",
    "impression": "No radiographic evidence of acute cardiopulmonary disease.",
    "version": 1,
    "updatedAt": "2026-10-23T16:12:00.000Z"
  }
}
```

---

### 6.4 `POST /api/reports/order/:orderId/finalize`
Digitally signs and finalizes the clinical report.
- Validates that non-empty `impression` is provided.
- Marks order `workflowStatus` as `FINALIZED`.
- If modifying an already finalized report, requires `amendmentReason`, increments version (`v2`, `v3`), and archives previous content into `amendmentHistory`.

- **Method:** `POST`
- **URL:** `/api/reports/order/:orderId/finalize`
- **Path Parameters:**
  - `orderId`: Order ID or Accession Number
- **Headers:** `Content-Type: application/json`
- **Status Codes:**
  - `200 OK`: Report finalized or amended.
  - `400 Bad Request`: Missing impression or missing amendment reason.
  - `404 Not Found`: Examination order not found.

#### Example Request Body
```json
{
  "technique": "PA view of chest in upright position.",
  "findings": "Lungs are clear without focal consolidations, masses, or effusions. Heart and mediastinum are within normal limits. Visualized bony structures are intact.",
  "impression": "Normal chest radiograph. No acute cardiopulmonary abnormality.",
  "recommendations": "None required.",
  "criticalResultsNotified": false,
  "radiologist": {
    "name": "Dr. Gregory House, MD",
    "licenseNumber": "RAD-98234",
    "role": "Consultant Radiologist"
  }
}
```

#### Expected Output
```json
{
  "success": true,
  "message": "Report REP-20261023-1192 successfully finalized (v1).",
  "data": {
    "_id": "67b93f00e4b02a11b81e1150",
    "reportId": "REP-20261023-1192",
    "orderId": "ORD-20261023-5512",
    "accessionNumber": "ACC-20261023-8821",
    "status": "FINALIZED",
    "findings": "Lungs are clear without focal consolidations...",
    "impression": "Normal chest radiograph. No acute cardiopulmonary abnormality.",
    "finalizedBy": "Dr. Gregory House, MD",
    "finalizedAt": "2026-10-23T16:15:00.000Z",
    "version": 1
  }
}
```

---

### 6.5 `GET /api/reports/order/:orderId/pdf`
Dynamically renders and streams a formal, high-resolution diagnostic PDF report document.
- Contains hospital banner header, two-column patient/examination demographics table, technique, clinical findings, bold clinical impression, critical notifications alert box, and official radiologist electronic signature block with timestamp.
- Directly openable in browser tab or downloadable.

- **Method:** `GET`
- **URL:** `/api/reports/order/:orderId/pdf`
- **Path Parameters:**
  - `orderId`: Order ID or Accession Number
- **Query Parameters:**
  - `user` *(optional)*: Name of clinician requesting PDF (for audit logging)
- **Status Codes:**
  - `200 OK`: Binary PDF stream.
  - `404 Not Found`: Order or report does not exist.

#### Expected Response Headers
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="Report_ACC-20261023-8821_v1.pdf"
Content-Length: 48924
```
*(Response body is binary PDF data).*

---

## 7. DICOMweb & PACS Proxy Endpoints

The Vite development server (`http://localhost:5173`) proxies DICOMweb requests directly to the Orthanc PACS server (`http://127.0.0.1:8042`), allowing secure, zero-CORS browser access for the OHIF Viewer.

| Endpoint | Target in Orthanc | Purpose | Standard |
| :--- | :--- | :--- | :--- |
| `GET /dicom-web/studies` | `http://127.0.0.1:8042/dicom-web/studies` | Query study list | QIDO-RS |
| `GET /dicom-web/studies/{uid}/metadata` | `http://127.0.0.1:8042/dicom-web/studies/{uid}/metadata` | Study metadata & SOP instances | WADO-RS |
| `GET /dicom-web/studies/{uid}/series/{sUid}/instances/{iUid}/frames/{frame}` | `.../frames/{frame}` | Render individual DICOM image frames | WADO-RS |
| `GET /ohif/viewer?StudyInstanceUIDs={uid}` | `http://127.0.0.1:8042/ohif/viewer?...` | Zero-footprint web DICOM viewer UI | OHIF Viewer Plugin |

---

## 🚀 Quick API Test Sequence (cURL / Postman)

Follow this 5-step workflow to test the entire radiology pipeline end-to-end:

```bash
# 1. Check system health
curl -X GET http://localhost:5000/api/health

# 2. Register a new patient
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"patientId":"PAT-TEST-01","fullName":"Robert Smith","age":45,"gender":"M"}'

# 3. Create an examination order
curl -X POST http://localhost:5000/api/examinations \
  -H "Content-Type: application/json" \
  -d '{"patientId":"PAT-TEST-01","modality":"CR","bodyRegion":"CHEST","examinationCode":"CR_CHEST_PA","examinationName":"Chest PA View"}'

# 4. Upload DICOM file(s)
curl -X POST http://localhost:5000/api/examinations/<ORDER_ID>/dicom \
  -F "files=@test_image.dcm"

# 5. Finalize the radiologist report
curl -X POST http://localhost:5000/api/reports/order/<ORDER_ID>/finalize \
  -H "Content-Type: application/json" \
  -d '{"impression":"Normal examination. No acute cardiopulmonary abnormality."}'

# 6. Download the generated PDF report
curl -X GET http://localhost:5000/api/reports/order/<ORDER_ID>/pdf --output report.pdf
```
