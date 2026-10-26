import { env } from '../../config/env.js';

export class OrthancService {
  constructor() {
    this.baseUrl = env.ORTHANC_URL;
  }

  /**
   * Uploads a raw DICOM instance binary to Orthanc /instances REST API.
   */
  async uploadInstance(buffer) {
    const url = `${this.baseUrl}/instances`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/dicom',
      },
      body: buffer,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Orthanc upload failed (HTTP ${res.status}): ${errorText || res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Fetches study metadata from Orthanc by its internal UUID.
   */
  async getStudy(studyId) {
    const url = `${this.baseUrl}/studies/${encodeURIComponent(studyId)}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to retrieve Orthanc study ${studyId} (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * Modifies DICOM tags of an existing instance and returns the modified DICOM binary buffer.
   */
  async modifyInstance(instanceId, replacements) {
    const url = `${this.baseUrl}/instances/${encodeURIComponent(instanceId)}/modify`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Replace: replacements,
        Force: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Failed to modify Orthanc instance ${instanceId} (HTTP ${res.status}): ${errorText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Deletes an instance from Orthanc by its UUID.
   */
  async deleteInstance(instanceId) {
    const url = `${this.baseUrl}/instances/${encodeURIComponent(instanceId)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      console.warn(`[OrthancService] Failed to delete instance ${instanceId}: HTTP ${res.status}`);
    }
  }

  /**
   * Deletes a study from Orthanc by its UUID.
   */
  async deleteStudy(studyId) {
    const url = `${this.baseUrl}/studies/${encodeURIComponent(studyId)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      console.warn(`[OrthancService] Failed to delete study ${studyId}: HTTP ${res.status}`);
    }
  }

  /**
   * Confirms study is retrievable via standard DICOMweb endpoint.
   */
  async verifyDicomWeb(studyInstanceUid) {
    const url = `${this.baseUrl}/dicom-web/studies/${encodeURIComponent(studyInstanceUid)}/metadata`;

    try {
      const res = await fetch(url);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const orthancService = new OrthancService();
