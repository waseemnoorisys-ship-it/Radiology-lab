import React, { useState, useEffect } from 'react';
import {
  User,
  Search,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Patient,
  ModalityMaster,
  BodyRegionMaster,
  ExaminationMaster,
  SupportingMaster,
  ExaminationOrder,
} from '../../types';
import {
  fetchModalities,
  fetchBodyRegions,
  fetchExaminations,
  fetchSupporting,
  searchPatients,
  createPatient,
  createExamination,
} from '../../services/api';
import { DicomUploadSection } from './DicomUploadSection';

export const NewExaminationPage: React.FC = () => {
  // Master Data state
  const [modalities, setModalities] = useState<ModalityMaster[]>([]);
  const [bodyRegions, setBodyRegions] = useState<BodyRegionMaster[]>([]);
  const [examinations, setExaminations] = useState<ExaminationMaster[]>([]);
  const [doctors, setDoctors] = useState<SupportingMaster[]>([]);

  // Patient Search & Selection state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // New Patient Form state
  const [newPatient, setNewPatient] = useState({
    patientId: '',
    fullName: '',
    gender: 'UNKNOWN' as const,
    age: '',
    contactPhone: '',
    email: '',
  });

  // Examination Form state
  const [selectedModality, setSelectedModality] = useState<string>('');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<ExaminationMaster | null>(null);
  const [laterality, setLaterality] = useState<string>('NOT_APPLICABLE');
  const [contrast, setContrast] = useState<string>('NOT_APPLICABLE');
  const [protocol, setProtocol] = useState<string>('');
  const [clinicalIndication, setClinicalIndication] = useState<string>('');
  const [referringDoctor, setReferringDoctor] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<ExaminationOrder | null>(null);

  // Load initial master data
  useEffect(() => {
    fetchModalities().then(setModalities);
    fetchSupporting('REFERRING_DOCTOR').then(setDoctors);
  }, []);

  // When Modality changes, reload Body Regions & reset dependent fields
  useEffect(() => {
    if (selectedModality) {
      fetchBodyRegions(selectedModality).then(setBodyRegions);
      setSelectedBodyRegion('');
      setSelectedExam(null);
      setExaminations([]);
    } else {
      setBodyRegions([]);
    }
  }, [selectedModality]);

  // When Body Region changes, reload Examinations
  useEffect(() => {
    if (selectedModality && selectedBodyRegion) {
      fetchExaminations(selectedModality, selectedBodyRegion).then(setExaminations);
      setSelectedExam(null);
    } else {
      setExaminations([]);
    }
  }, [selectedModality, selectedBodyRegion]);

  // When Examination is selected, auto-configure defaults
  const handleExamChange = (examCode: string) => {
    const exam = examinations.find(e => e.code === examCode) || null;
    setSelectedExam(exam);
    if (exam) {
      setContrast(exam.contrastApplicability || 'NOT_APPLICABLE');
      if (exam.standardProtocols.length > 0) {
        setProtocol(exam.standardProtocols[0]);
      }
      if (exam.clinicalIndications.length > 0) {
        setClinicalIndication(exam.clinicalIndications[0]);
      }
      if (exam.lateralityRequired) {
        setLaterality('RIGHT');
      } else {
        setLaterality('NOT_APPLICABLE');
      }
    }
  };

  // Autocomplete patient search
  useEffect(() => {
    if (patientSearchQuery.trim().length >= 1) {
      const timer = setTimeout(() => {
        searchPatients(patientSearchQuery).then(setPatientSearchResults);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setPatientSearchResults([]);
    }
  }, [patientSearchQuery]);

  // Create Patient Handler
  const handleCreatePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.patientId || !newPatient.fullName) {
      setError('Patient ID and Full Name are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createPatient({
        patientId: newPatient.patientId,
        fullName: newPatient.fullName,
        gender: newPatient.gender,
        age: newPatient.age ? parseInt(newPatient.age, 10) : undefined,
        contactPhone: newPatient.contactPhone,
        email: newPatient.email,
      });

      if (res.success && res.data) {
        setSelectedPatient(res.data);
        setShowNewPatientModal(false);
        setNewPatient({ patientId: '', fullName: '', gender: 'UNKNOWN', age: '', contactPhone: '', email: '' });
      } else {
        setError(res.error || 'Failed to create patient record');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Examination Handler
  const handleSubmitExamination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select or create a patient first');
      return;
    }
    if (!selectedModality || !selectedBodyRegion || !selectedExam) {
      setError('Please select Modality, Body Region, and Examination procedure');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createExamination({
        patientId: selectedPatient.patientId,
        modality: selectedModality,
        bodyRegion: selectedBodyRegion,
        examinationCode: selectedExam.code,
        examinationName: selectedExam.displayName,
        laterality,
        contrast,
        protocol,
        clinicalIndication,
        referringDoctor,
        additionalNotes,
      });

      if (res.success && res.data) {
        setCreatedOrder(res.data);
      } else {
        setError(res.error || 'Failed to create examination order');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const currentRegion = bodyRegions.find(r => r.code === selectedBodyRegion);
  const showLateralityField = currentRegion?.supportsLaterality || selectedExam?.lateralityRequired;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">New Examination</h1>
          <p className="page-subtitle">Machine Operator Workspace — Schedule and register an imaging order</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: '#fca5a5', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Confirmation Modal / Banner */}
      {createdOrder ? (
        <div className="glass-panel fade-in" style={{ padding: '36px', textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Examination Order Created!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The order is registered in MongoDB with status <span className="badge badge-warning">PENDING_UPLOAD</span></p>

          <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '28px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Order ID:</span> <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{createdOrder.orderId}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Accession #:</span> <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{createdOrder.accessionNumber}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Patient:</span> <strong>{createdOrder.patientName}</strong> ({createdOrder.patientId})</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Modality:</span> <span className="badge badge-primary">{createdOrder.modality}</span></div>
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Procedure:</span> {createdOrder.examinationName}</div>
            </div>
          </div>

          {/* Phase 5 DICOM Upload Ingestion */}
          <DicomUploadSection
            orderId={createdOrder.orderId}
            accessionNumber={createdOrder.accessionNumber}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button
              onClick={() => {
                setCreatedOrder(null);
                setSelectedExam(null);
              }}
              className="btn btn-secondary"
            >
              Register Another Order
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitExamination} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Section 1: Patient Selection */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} style={{ color: '#0ea5e9' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Patient Identification</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPatientModal(!showNewPatientModal)}
                className="btn btn-secondary btn-sm"
              >
                <UserPlus size={14} />
                <span>{showNewPatientModal ? 'Cancel' : 'New Patient'}</span>
              </button>
            </div>

            {/* Quick New Patient Inline Creator */}
            {showNewPatientModal && (
              <div style={{ background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: '#38bdf8' }}>Register New Patient</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">Patient ID / MRN</label>
                    <input
                      className="form-input"
                      placeholder="e.g. PAT-2026-009"
                      value={newPatient.patientId}
                      onChange={e => setNewPatient({ ...newPatient, patientId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Full Legal Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Robert Williams"
                      value={newPatient.fullName}
                      onChange={e => setNewPatient({ ...newPatient, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={newPatient.gender}
                      onChange={e => setNewPatient({ ...newPatient, gender: e.target.value as any })}
                    >
                      <option value="UNKNOWN">Select Gender</option>
                      <option value="M">Male (M)</option>
                      <option value="F">Female (F)</option>
                      <option value="O">Other (O)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="e.g. 48"
                      value={newPatient.age}
                      onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      className="form-input"
                      placeholder="e.g. +1 555-0192"
                      value={newPatient.contactPhone}
                      onChange={e => setNewPatient({ ...newPatient, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="robert@example.com"
                      value={newPatient.email}
                      onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewPatientModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleCreatePatientSubmit}>Save & Select Patient</button>
                </div>
              </div>
            )}

            {/* Selected Patient Banner OR Search Input */}
            {selectedPatient ? (
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedPatient.fullName}</span>
                    <span className="badge badge-primary">{selectedPatient.patientId}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Gender: {selectedPatient.gender} {selectedPatient.age ? `• Age: ${selectedPatient.age} yrs` : ''} {selectedPatient.contactPhone ? `• Phone: ${selectedPatient.contactPhone}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Change Patient
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Search existing patients by name, ID, or phone (e.g. John Doe, PAT-1001)..."
                    value={patientSearchQuery}
                    onChange={e => setPatientSearchQuery(e.target.value)}
                  />
                </div>

                {patientSearchResults.length > 0 && (
                  <div className="search-results-box" style={{ position: 'absolute', width: '100%' }}>
                    {patientSearchResults.map(p => (
                      <div
                        key={p._id}
                        className="search-item"
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearchQuery('');
                          setPatientSearchResults([]);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{p.fullName}</strong>
                          <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{p.patientId}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Gender: {p.gender} • Age: {p.age || 'N/A'} • Phone: {p.contactPhone || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Examination Details (Dynamic Master Data) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Layers size={20} style={{ color: '#0ea5e9' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Clinical Procedure & Parameters</h2>
            </div>

            <div className="form-grid">
              {/* 1. Modality */}
              <div className="form-group">
                <label className="form-label required">1. Modality</label>
                <select
                  className="form-select"
                  value={selectedModality}
                  onChange={e => setSelectedModality(e.target.value)}
                  required
                >
                  <option value="">-- Choose Modality --</option>
                  {modalities.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Body Region (Dependent on Modality) */}
              <div className="form-group">
                <label className="form-label required">2. Body Region</label>
                <select
                  className="form-select"
                  value={selectedBodyRegion}
                  onChange={e => setSelectedBodyRegion(e.target.value)}
                  disabled={!selectedModality}
                  required
                >
                  <option value="">{selectedModality ? '-- Choose Anatomical Region --' : 'Select modality first'}</option>
                  {bodyRegions.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Examination Procedure (Dependent on Modality & Region) */}
              <div className="form-group form-full">
                <label className="form-label required">3. Examination Procedure</label>
                <select
                  className="form-select"
                  value={selectedExam?.code || ''}
                  onChange={e => handleExamChange(e.target.value)}
                  disabled={!selectedBodyRegion}
                  required
                >
                  <option value="">{selectedBodyRegion ? '-- Choose Procedure --' : 'Select body region first'}</option>
                  {examinations.map(e => (
                    <option key={e.code} value={e.code}>
                      {e.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Laterality Field */}
              {showLateralityField && (
                <div className="form-group fade-in">
                  <label className="form-label required">Laterality</label>
                  <select
                    className="form-select"
                    value={laterality}
                    onChange={e => setLaterality(e.target.value)}
                  >
                    <option value="LEFT">Left</option>
                    <option value="RIGHT">Right</option>
                    <option value="BILATERAL">Bilateral</option>
                    <option value="UNILATERAL">Unilateral (Unspecified)</option>
                  </select>
                </div>
              )}

              {/* Contrast Option */}
              <div className="form-group">
                <label className="form-label">Contrast Mode</label>
                <select
                  className="form-select"
                  value={contrast}
                  onChange={e => setContrast(e.target.value)}
                >
                  <option value="NOT_APPLICABLE">Not Applicable</option>
                  <option value="WITHOUT_CONTRAST">Without Contrast (NC)</option>
                  <option value="WITH_CONTRAST">With Contrast (IV)</option>
                  <option value="WITHOUT_AND_WITH_CONTRAST">Without and With Contrast</option>
                </select>
              </div>

              {/* Protocol with quick suggestion chips */}
              <div className="form-group form-full">
                <label className="form-label">Protocol / Sequence</label>
                <input
                  className="form-input"
                  placeholder="e.g. Standard axial 5mm spiral scan"
                  value={protocol}
                  onChange={e => setProtocol(e.target.value)}
                />
                {selectedExam && selectedExam.standardProtocols.length > 0 && (
                  <div className="chip-container">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Suggestions:</span>
                    {selectedExam.standardProtocols.map(p => (
                      <span
                        key={p}
                        className={`chip ${protocol === p ? 'active' : ''}`}
                        onClick={() => setProtocol(p)}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinical Indication with quick suggestion chips */}
              <div className="form-group form-full">
                <label className="form-label required">Clinical Indication / Reason for Exam</label>
                <input
                  className="form-input"
                  placeholder="e.g. Persistent acute headache, trauma rule-out"
                  value={clinicalIndication}
                  onChange={e => setClinicalIndication(e.target.value)}
                  required
                />
                {selectedExam && selectedExam.clinicalIndications.length > 0 && (
                  <div className="chip-container">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indications:</span>
                    {selectedExam.clinicalIndications.map(ind => (
                      <span
                        key={ind}
                        className={`chip ${clinicalIndication === ind ? 'active' : ''}`}
                        onClick={() => setClinicalIndication(ind)}
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Referring Doctor */}
              <div className="form-group">
                <label className="form-label">Referring Doctor</label>
                <select
                  className="form-select"
                  value={referringDoctor}
                  onChange={e => setReferringDoctor(e.target.value)}
                >
                  <option value="">-- Select Referring Physician --</option>
                  {doctors.map(d => (
                    <option key={d.code} value={d.displayName}>
                      {d.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Performing Facility */}
              <div className="form-group">
                <label className="form-label">Performing Facility</label>
                <input
                  className="form-input"
                  defaultValue="Main Radiology Suite"
                  disabled
                />
              </div>

              {/* Additional Operator Notes */}
              <div className="form-group form-full">
                <label className="form-label">Operator Notes / Technologist Comments</label>
                <textarea
                  className="form-textarea"
                  placeholder="Any patient limitations, allergy notes, or scan observations..."
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedPatient || !selectedExam}
              style={{ padding: '12px 28px', fontSize: '0.95rem' }}
            >
              {loading ? 'Creating Order...' : 'Register Examination Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
