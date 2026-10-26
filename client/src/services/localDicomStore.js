import dicomParser from 'dicom-parser';

const DB_NAME = 'RadFlow_LocalDicomDB';
const DB_VERSION = 1;

/**
 * Opens or initializes the local IndexedDB database for in-browser DICOM storage.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('studies')) {
        db.createObjectStore('studies', { keyPath: 'studyInstanceUid' });
      }
      if (!db.objectStoreNames.contains('instances')) {
        db.createObjectStore('instances', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Registers the DICOMweb Service Worker to intercept OHIF iframe requests.
 */
export async function registerDicomServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/dicom-web-sw.js', { scope: '/' });
      console.log('[RadFlow] DICOMweb Interceptor Service Worker active:', reg.scope);
      return reg;
    } catch (err) {
      console.warn('[RadFlow] Service Worker registration failed:', err);
    }
  }
}

/**
 * Helper to safely extract string tag from dicomParser dataSet.
 */
function getString(dataSet, tag) {
  try {
    return dataSet.string(tag);
  } catch {
    return undefined;
  }
}

/**
 * Helper to safely extract number tag from dicomParser dataSet.
 */
function getUint16(dataSet, tag) {
  try {
    return dataSet.uint16(tag);
  } catch {
    return undefined;
  }
}

/**
 * Parses a collection of local DICOM File objects, validates them against the active order,
 * formats DICOM Part 18 metadata, and caches them in IndexedDB for the OHIF Viewer.
 *
 * @param {File[]} files - Selected local DICOM files
 * @param {Object} targetOrder - The active MongoDB ExaminationOrder
 * @returns {Promise<Object>} Parse result with validation status and study identifiers
 */
export async function parseAndCacheLocalDicomFiles(files, targetOrder = null, options = {}) {
  if (!files || files.length === 0) {
    throw new Error('No files provided. Please select one or more DICOM files.');
  }

  // Ensure Service Worker is active
  await registerDicomServiceWorker();

  const parsedInstances = [];
  let primaryStudyUid = null;
  let primaryPatientId = null;
  let primaryPatientName = null;
  let primaryModality = null;
  let primaryAccession = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Verify DICOM magic bytes (128-byte preamble + "DICM")
    if (uint8Array.length < 132) continue;
    const magic = String.fromCharCode(uint8Array[128], uint8Array[129], uint8Array[130], uint8Array[131]);
    if (magic !== 'DICM') {
      // Not a standard Part 10 file, skip non-dicom auxiliary files (e.g. .DS_Store, desktop.ini)
      continue;
    }

    let dataSet;
    try {
      dataSet = dicomParser.parseDicom(uint8Array);
    } catch (err) {
      console.warn(`[RadFlow] Could not parse file '${file.name}':`, err);
      continue;
    }

    const sopInstanceUid = getString(dataSet, 'x00080018') || `local.sop.${Date.now()}.${i}`;
    const studyInstanceUid = getString(dataSet, 'x0020000d') || primaryStudyUid || `local.study.${Date.now()}`;
    const seriesInstanceUid = getString(dataSet, 'x0020000e') || `local.series.${studyInstanceUid}.1`;
    const modality = getString(dataSet, 'x00080060') || 'OT';
    const patientId = getString(dataSet, 'x00100020') || '';
    const patientName = getString(dataSet, 'x00100010') || '';
    const accession = getString(dataSet, 'x00080050') || '';
    const instanceNumber = getString(dataSet, 'x00200013') || String(i + 1);
    const seriesNumber = getString(dataSet, 'x00200011') || '1';
    const rows = getUint16(dataSet, 'x00280010') || 512;
    const columns = getUint16(dataSet, 'x00280011') || 512;

    if (!primaryStudyUid) {
      primaryStudyUid = studyInstanceUid;
      primaryPatientId = patientId;
      primaryPatientName = patientName;
      primaryModality = modality;
      primaryAccession = accession;
    }

    // Format DICOM Part 18 JSON instance metadata expected by OHIF
    const instanceMetadata = {
      '00080016': { vr: 'UI', Value: [getString(dataSet, 'x00080016') || '1.2.840.10008.5.1.4.1.1.2'] },
      '00080018': { vr: 'UI', Value: [sopInstanceUid] },
      '0020000D': { vr: 'UI', Value: [studyInstanceUid] },
      '0020000E': { vr: 'UI', Value: [seriesInstanceUid] },
      '00080060': { vr: 'CS', Value: [modality] },
      '00080020': { vr: 'DA', Value: [getString(dataSet, 'x00080020') || new Date().toISOString().slice(0, 10).replace(/-/g, '')] },
      '00080030': { vr: 'TM', Value: [getString(dataSet, 'x00080030') || '120000'] },
      '00080050': { vr: 'SH', Value: [accession || targetOrder?.accessionNumber || ''] },
      '00081030': { vr: 'LO', Value: [getString(dataSet, 'x00081030') || targetOrder?.examinationName || 'Local DICOM Examination'] },
      '0008103E': { vr: 'LO', Value: [getString(dataSet, 'x0008103e') || `${modality} Local Series`] },
      '00100010': { vr: 'PN', Value: [{ Alphabetic: patientName || targetOrder?.patientName || 'ANONYMOUS' }] },
      '00100020': { vr: 'LO', Value: [patientId || targetOrder?.patientId || 'UNKNOWN'] },
      '00200011': { vr: 'IS', Value: [seriesNumber] },
      '00200013': { vr: 'IS', Value: [instanceNumber] },
      '00280010': { vr: 'US', Value: [rows] },
      '00280011': { vr: 'US', Value: [columns] },
      '00280100': { vr: 'US', Value: [getUint16(dataSet, 'x00280100') || 16] },
      '00280101': { vr: 'US', Value: [getUint16(dataSet, 'x00280101') || 12] },
      '00280102': { vr: 'US', Value: [getUint16(dataSet, 'x00280102') || 11] },
      '00280103': { vr: 'US', Value: [getUint16(dataSet, 'x00280103') || 0] },
      '00280002': { vr: 'US', Value: [getUint16(dataSet, 'x00280002') || 1] },
      '00280004': { vr: 'CS', Value: [getString(dataSet, 'x00280004') || 'MONOCHROME2'] },
    };

    // Optional windowing & spatial positioning
    const wc = getString(dataSet, 'x00281050');
    if (wc) instanceMetadata['00281050'] = { vr: 'DS', Value: [parseFloat(wc) || 40] };
    const ww = getString(dataSet, 'x00281051');
    if (ww) instanceMetadata['00281051'] = { vr: 'DS', Value: [parseFloat(ww) || 400] };
    const ipp = getString(dataSet, 'x00200032');
    if (ipp) instanceMetadata['00200032'] = { vr: 'DS', Value: ipp.split('\\').map(Number) };
    const iop = getString(dataSet, 'x00200037');
    if (iop) instanceMetadata['00200037'] = { vr: 'DS', Value: iop.split('\\').map(Number) };
    const ps = getString(dataSet, 'x00280030');
    if (ps) instanceMetadata['00280030'] = { vr: 'DS', Value: ps.split('\\').map(Number) };
    const st = getString(dataSet, 'x00180050');
    if (st) instanceMetadata['00180050'] = { vr: 'DS', Value: [parseFloat(st) || 1.0] };

    parsedInstances.push({
      sopInstanceUid,
      seriesInstanceUid,
      studyInstanceUid,
      metadata: instanceMetadata,
      arrayBuffer,
    });
  }

  if (parsedInstances.length === 0) {
    throw new Error('None of the selected files contained valid DICOM Part 10 data.');
  }

  // Requirement #5: Validate selected study against active patient order
  let isPatientMatch = true;
  let validationWarning = null;

  if (targetOrder) {
    const targetPid = (targetOrder.patientId || '').trim().toLowerCase();
    const parsedPid = (primaryPatientId || '').trim().toLowerCase();

    const targetName = (targetOrder.patientName || '').trim().toLowerCase().replace(/[\^,\s]/g, '');
    const parsedName = (primaryPatientName || '').trim().toLowerCase().replace(/[\^,\s]/g, '');

    // Check if ID matches, or if empty ID, check name similarity
    if (parsedPid && targetPid && parsedPid !== targetPid) {
      isPatientMatch = false;
      validationWarning = `Patient ID mismatch! Active order is for Patient '${targetOrder.patientName}' (ID: ${targetOrder.patientId}), but the selected files belong to '${primaryPatientName}' (ID: ${primaryPatientId}).`;
    } else if (parsedName && targetName && !parsedName.includes(targetName) && !targetName.includes(parsedName)) {
      // Soft warning if names differ significantly
      console.warn(`[RadFlow Safety] Name variance detected: Expected '${targetOrder.patientName}', found '${primaryPatientName}'`);
    }
  }

  // If patient validation failed and user hasn't explicitly confirmed override, return warning
  if (!isPatientMatch && !options.overrideMismatch) {
    return {
      success: false,
      mismatch: true,
      warning: validationWarning,
      parsedPatient: {
        patientId: primaryPatientId,
        patientName: primaryPatientName,
      },
    };
  }

  // Group instances into unique series list for QIDO series endpoint
  const seriesMap = new Map();
  parsedInstances.forEach((inst) => {
    const sUid = inst.seriesInstanceUid;
    if (!seriesMap.has(sUid)) {
      seriesMap.set(sUid, {
        '0020000D': { vr: 'UI', Value: [primaryStudyUid] },
        '0020000E': { vr: 'UI', Value: [sUid] },
        '00080060': { vr: 'CS', Value: [inst.metadata['00080060']?.Value?.[0] || 'OT'] },
        '0008103E': { vr: 'LO', Value: [inst.metadata['0008103E']?.Value?.[0] || 'Local Series'] },
        '00200011': { vr: 'IS', Value: [1] },
        '00201209': { vr: 'IS', Value: [1] },
      });
    } else {
      const existing = seriesMap.get(sUid);
      const count = existing['00201209'].Value[0] + 1;
      existing['00201209'].Value = [count];
    }
  });

  const seriesList = Array.from(seriesMap.values());

  // Build Study QIDO object
  const qidoStudy = {
    '0020000D': { vr: 'UI', Value: [primaryStudyUid] },
    '00100010': { vr: 'PN', Value: [{ Alphabetic: primaryPatientName || targetOrder?.patientName || 'ANONYMOUS' }] },
    '00100020': { vr: 'LO', Value: [primaryPatientId || targetOrder?.patientId || 'UNKNOWN'] },
    '00080061': { vr: 'CS', Value: [primaryModality || 'OT'] },
    '00080050': { vr: 'SH', Value: [primaryAccession || targetOrder?.accessionNumber || ''] },
    '00080020': { vr: 'DA', Value: [new Date().toISOString().slice(0, 10).replace(/-/g, '')] },
    '00080030': { vr: 'TM', Value: ['120000'] },
    '00081030': { vr: 'LO', Value: [targetOrder?.examinationName || 'Local DICOM Examination'] },
    '00201206': { vr: 'IS', Value: [seriesList.length] },
    '00201208': { vr: 'IS', Value: [parsedInstances.length] },
  };

  // Write all parsed slices into IndexedDB for zero-upload local streaming
  const db = await openDB();
  const tx = db.transaction(['studies', 'instances'], 'readwrite');
  const studyStore = tx.objectStore('studies');
  const instanceStore = tx.objectStore('instances');

  // Save study metadata
  studyStore.put({
    studyInstanceUid: primaryStudyUid,
    patientId: primaryPatientId || targetOrder?.patientId,
    patientName: primaryPatientName || targetOrder?.patientName,
    modality: primaryModality,
    instanceCount: parsedInstances.length,
    seriesCount: seriesList.length,
    qidoStudy,
    seriesList,
    metadata: parsedInstances.map((i) => i.metadata),
    timestamp: Date.now(),
  });

  // Save each raw instance binary buffer
  for (const inst of parsedInstances) {
    instanceStore.put({
      id: `${primaryStudyUid}_${inst.sopInstanceUid}`,
      studyInstanceUid: primaryStudyUid,
      seriesInstanceUid: inst.seriesInstanceUid,
      sopInstanceUid: inst.sopInstanceUid,
      buffer: inst.arrayBuffer,
    });
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return {
    success: true,
    studyInstanceUid: primaryStudyUid,
    patientId: primaryPatientId,
    patientName: primaryPatientName,
    modality: primaryModality,
    instanceCount: parsedInstances.length,
    seriesCount: seriesList.length,
    ohifViewerUrl: `/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(primaryStudyUid)}`,
  };
}

/**
 * Checks if a study is available locally in IndexedDB.
 */
export async function isStudyInLocalCache(studyUid) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('studies', 'readonly');
      const store = tx.objectStore('studies');
      const req = store.get(studyUid);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
