// RadFlow DICOMweb In-Browser Interceptor Service Worker
// Intercepts /dicom-web/ requests made by OHIF Viewer and serves local studies
// directly from browser IndexedDB without sending any image data to the server.

const DB_NAME = 'RadFlow_LocalDicomDB';
const DB_VERSION = 1;

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

async function getLocalStudy(studyUid) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('studies', 'readonly');
      const store = tx.objectStore('studies');
      const req = store.get(studyUid);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function getLocalInstance(studyUid, sopUid) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('instances', 'readonly');
      const store = tx.objectStore('instances');
      const req = store.get(`${studyUid}_${sopUid}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function createMultipartResponse(binaryBuffer, boundary = '----RadFlowBoundary') {
  const header = `--${boundary}\r\nContent-Type: application/dicom\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);
  const footerBytes = encoder.encode(footer);

  const rawBytes = binaryBuffer instanceof ArrayBuffer ? new Uint8Array(binaryBuffer) : new Uint8Array(binaryBuffer.buffer || binaryBuffer);
  const combined = new Uint8Array(headerBytes.length + rawBytes.length + footerBytes.length);

  combined.set(headerBytes, 0);
  combined.set(rawBytes, headerBytes.length);
  combined.set(footerBytes, headerBytes.length + rawBytes.length);

  return new Response(combined, {
    status: 200,
    headers: {
      'Content-Type': `multipart/related; type="application/dicom"; boundary=${boundary}`,
      'Content-Length': String(combined.byteLength),
      'Access-Control-Allow-Origin': '*',
    },
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if this request is targeted at DICOMweb endpoints
  if (url.pathname.includes('/dicom-web/')) {
    event.respondWith(
      (async () => {
        // Path analysis
        // 1. QIDO Studies search: /dicom-web/studies?StudyInstanceUID={uid}
        const studyUidParam = url.searchParams.get('StudyInstanceUID');
        if (studyUidParam) {
          const localStudy = await getLocalStudy(studyUidParam);
          if (localStudy && localStudy.qidoStudy) {
            return new Response(JSON.stringify([localStudy.qidoStudy]), {
              headers: { 'Content-Type': 'application/dicom+json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        }

        // 1b. Single Study Search: /dicom-web/studies/{studyUid}
        const studyDirectMatch = url.pathname.match(/\/dicom-web\/studies\/([^/?#]+)\/?$/);
        if (studyDirectMatch) {
          const studyUid = decodeURIComponent(studyDirectMatch[1]);
          const localStudy = await getLocalStudy(studyUid);
          if (localStudy && localStudy.qidoStudy) {
            return new Response(JSON.stringify([localStudy.qidoStudy]), {
              headers: { 'Content-Type': 'application/dicom+json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        }

        // 2. Study Metadata: /dicom-web/studies/{studyUid}/metadata
        const metadataMatch = url.pathname.match(/\/dicom-web\/studies\/([^/]+)\/metadata/);
        if (metadataMatch) {
          const studyUid = decodeURIComponent(metadataMatch[1]);
          const localStudy = await getLocalStudy(studyUid);
          if (localStudy && localStudy.metadata) {
            return new Response(JSON.stringify(localStudy.metadata), {
              headers: { 'Content-Type': 'application/dicom+json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        }

        // 3. Series List: /dicom-web/studies/{studyUid}/series\/?$
        const seriesMatch = url.pathname.match(/\/dicom-web\/studies\/([^/]+)\/series\/?$/);
        if (seriesMatch) {
          const studyUid = decodeURIComponent(seriesMatch[1]);
          const localStudy = await getLocalStudy(studyUid);
          if (localStudy && localStudy.seriesList) {
            return new Response(JSON.stringify(localStudy.seriesList), {
              headers: { 'Content-Type': 'application/dicom+json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        }

        // 4. Instance Retrieve: /dicom-web/studies/{studyUid}/.../instances/{sopUid}(/frames/1)?
        const instanceMatch = url.pathname.match(/\/dicom-web\/studies\/([^/]+)(?:\/series\/[^/]+)?\/instances\/([^/]+)/);
        if (instanceMatch) {
          const studyUid = decodeURIComponent(instanceMatch[1]);
          const sopUid = decodeURIComponent(instanceMatch[2]);
          const instanceItem = await getLocalInstance(studyUid, sopUid);
          if (instanceItem && instanceItem.buffer) {
            return createMultipartResponse(instanceItem.buffer);
          }
        }

        // Fallback: If not found in local IndexedDB, pass through to proxy (e.g. Orthanc for existing studies)
        return fetch(event.request);
      })()
    );
  }
});
