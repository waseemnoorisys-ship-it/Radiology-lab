import { env } from '../../config/env.js';

export interface OrthancUploadResult {
  ID: string;
  ParentPatient: string;
  ParentSeries: string;
  ParentStudy: string;
  Path: string;
  Status: string;
}

export interface OrthancStudy {
  ID: string;
  IsStable: boolean;
  MainDicomTags: {
    StudyInstanceUID: string;
    StudyDate?: string;
    StudyTime?: string;
    StudyDescription?: string;
    AccessionNumber?: string;
    ReferringPhysicianName?: string;
  };
  ParentPatient: string;
  PatientMainDicomTags: {
    PatientID?: string;
    PatientName?: string;
    PatientSex?: string;
    PatientBirthDate?: string;
  };
  Series: string[];
}

export class OrthancService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.ORTHANC_URL;
  }

  /**
   * Uploads a raw DICOM instance binary to Orthanc /instances REST API.
   */
  async uploadInstance(buffer: Buffer): Promise<OrthancUploadResult> {
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

    return (await res.json()) as OrthancUploadResult;
  }

  /**
   * Fetches study metadata from Orthanc by its internal UUID.
   */
  async getStudy(studyId: string): Promise<OrthancStudy> {
    const url = `${this.baseUrl}/studies/${encodeURIComponent(studyId)}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to retrieve Orthanc study ${studyId} (HTTP ${res.status})`);
    }

    return (await res.json()) as OrthancStudy;
  }

  /**
   * Modifies DICOM tags of an existing instance and returns the modified DICOM binary buffer.
   */
  async modifyInstance(instanceId: string, replacements: Record<string, string>): Promise<Buffer> {
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
  async deleteInstance(instanceId: string): Promise<void> {
    const url = `${this.baseUrl}/instances/${encodeURIComponent(instanceId)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      console.warn(`[OrthancService] Failed to delete instance ${instanceId}: HTTP ${res.status}`);
    }
  }

  /**
   * Deletes a study from Orthanc by its UUID.
   */
  async deleteStudy(studyId: string): Promise<void> {
    const url = `${this.baseUrl}/studies/${encodeURIComponent(studyId)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      console.warn(`[OrthancService] Failed to delete study ${studyId}: HTTP ${res.status}`);
    }
  }

  /**
   * Confirms study is retrievable via standard DICOMweb endpoint.
   */
  async verifyDicomWeb(studyInstanceUid: string): Promise<boolean> {
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
