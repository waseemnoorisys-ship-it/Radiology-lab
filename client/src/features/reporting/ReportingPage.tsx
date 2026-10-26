import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Clock,
  User,
  Activity,
  History,
  Lock,
  Sparkles,
  Printer,
  Download,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ExaminationOrder,
  Report,
  ReportTemplate,
  ReportSectionValue,
} from '../../types';
import {
  fetchReportByOrderId,
  saveDraftReport,
  finalizeReport,
} from '../../services/api';

export const ReportingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  // Load state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Entities
  const [order, setOrder] = useState<ExaminationOrder | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);

  // Form state
  const [sectionValues, setSectionValues] = useState<Record<string, Record<string, any>>>({});
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [technique, setTechnique] = useState('');
  const [comparison, setComparison] = useState('');
  const [criticalResults, setCriticalResults] = useState(false);
  const [criticalDetails, setCriticalDetails] = useState('');
  const [radiologistName, setRadiologistName] = useState('Dr. Gregory House, MD');
  const [licenseNumber, setLicenseNumber] = useState('RAD-98234');

  // Amendment state
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');

  // UI Mode: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    fetchReportByOrderId(orderId)
      .then(res => {
        if (res.success && res.data) {
          const { order: ord, report: rep, template: tpl } = res.data;
          setOrder(ord);
          setReport(rep);
          setTemplate(tpl);

          if (rep) {
            // Existing report loaded
            const secMap: Record<string, Record<string, any>> = {};
            rep.sections.forEach(s => {
              secMap[s.sectionId] = { ...s.fields };
            });
            setSectionValues(secMap);
            setFindings(rep.findings || '');
            setImpression(rep.impression || '');
            setRecommendations(rep.recommendations || '');
            setTechnique(rep.technique || '');
            setComparison(rep.comparison || '');
            setCriticalResults(rep.criticalResultsNotified || false);
            setCriticalDetails(rep.criticalNotificationDetails || '');
            if (rep.radiologist?.name) setRadiologistName(rep.radiologist.name);
            if (rep.radiologist?.licenseNumber) setLicenseNumber(rep.radiologist.licenseNumber);
          } else if (tpl) {
            // Initialize from template defaults
            const secMap: Record<string, Record<string, any>> = {};
            tpl.sections.forEach(sec => {
              secMap[sec.sectionId] = {};
              sec.fields.forEach(f => {
                if (f.defaultValue !== undefined) {
                  secMap[sec.sectionId][f.fieldId] = f.defaultValue;
                }
              });
            });
            setSectionValues(secMap);

            // Set impression default from template if present
            const impField = tpl.sections
              .flatMap(s => s.fields)
              .find(f => f.fieldId === 'impression');
            if (impField && impField.defaultValue) {
              setImpression(String(impField.defaultValue));
            }
            setTechnique(ord.protocol || '');
          }
        } else {
          setError(res.error || 'Failed to load examination order or report data.');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleFieldChange = (sectionId: string, fieldId: string, value: any) => {
    setSectionValues(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldId]: value,
      },
    }));
  };

  const constructPayload = () => {
    const sections: ReportSectionValue[] = template
      ? template.sections.map(s => ({
          sectionId: s.sectionId,
          title: s.title,
          fields: sectionValues[s.sectionId] || {},
        }))
      : [];

    return {
      templateCode: template?.templateCode || 'CUSTOM',
      templateVersion: template?.version || 1,
      radiologist: {
        name: radiologistName,
        licenseNumber,
        role: 'Staff Radiologist',
      },
      sections,
      findings,
      impression,
      recommendations,
      technique,
      comparison,
      criticalResultsNotified: criticalResults,
      criticalNotificationDetails: criticalDetails,
    };
  };

  const handleSaveDraft = async () => {
    if (!orderId) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = constructPayload();
      const res = await saveDraftReport(orderId, payload);
      if (res.success && res.data) {
        setReport(res.data);
        setSuccessMessage('Draft report saved successfully! You can resume editing anytime.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError(res.error || 'Failed to save draft report.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!orderId) return;
    if (!impression.trim()) {
      setError('A clinical impression / conclusion is required to finalize the report.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = constructPayload();
      if (report?.status === 'FINALIZED' || report?.status === 'AMENDED') {
        if (!amendmentReason.trim()) {
          setError('Please provide a reason for amending this finalized report.');
          setSubmitting(false);
          return;
        }
        payload.amendmentReason = amendmentReason;
      }

      const res = await finalizeReport(orderId, payload);
      if (res.success && res.data) {
        setReport(res.data);
        setShowAmendmentModal(false);
        setAmendmentReason('');
        setSuccessMessage(`Report finalized successfully! Version ${res.data.version} signed by ${radiologistName}.`);
        setActiveTab('preview');
      } else {
        setError(res.error || 'Failed to finalize report.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Clock size={32} className="spin" style={{ margin: '0 auto 16px', color: '#0ea5e9' }} />
        <div>Loading structured reporting workspace...</div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertTriangle size={36} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h2>Reporting Workspace Error</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error}</p>
        <button onClick={() => navigate('/worklist')} className="btn btn-secondary">
          Return to Worklist
        </button>
      </div>
    );
  }

  const isFinalized = report?.status === 'FINALIZED' || report?.status === 'AMENDED';

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header & Context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => navigate('/worklist')} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Worklist</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="page-title" style={{ fontSize: '1.4rem', margin: 0 }}>
                Structured Radiology Report
              </h1>
              {report && (
                <span
                  className={`badge ${
                    report.status === 'FINALIZED'
                      ? 'badge-success'
                      : report.status === 'AMENDED'
                      ? 'badge-warning'
                      : 'badge-primary'
                  }`}
                >
                  {report.status} {report.version > 1 ? `(v${report.version})` : ''}
                </span>
              )}
            </div>
            <p className="page-subtitle" style={{ margin: '2px 0 0' }}>
              Template: {template ? `${template.name} (${template.templateCode})` : 'Standard Clinical Report'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {report && (
            <>
              <a
                href={`/api/reports/order/${encodeURIComponent(orderId || '')}/pdf`}
                target="_blank"
                rel="noreferrer"
                download={`Report_${order?.accessionNumber || 'radiology'}.pdf`}
                className="btn btn-secondary btn-sm"
                title="Download Official PDF Report"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} style={{ color: '#10b981' }} />
                <span>Download PDF</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
                title="Print Consultation Report"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
            </>
          )}

          {order?.studyInstanceUid && (
            <Link
              to={`/viewer/${encodeURIComponent(order.studyInstanceUid)}`}
              target="_blank"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <Eye size={15} />
              <span>Inspect Images (OHIF)</span>
            </Link>
          )}

          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('editor')}
              style={{ padding: '6px 14px' }}
            >
              Editor
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('preview')}
              style={{ padding: '6px 14px' }}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Patient & Examination Banner */}
      {order && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
            <div style={{ fontWeight: 600, color: '#fff' }}>{order.patientName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MRN: {order.patientId}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Accession / Order:</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8' }}>{order.accessionNumber}</div>
            <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{order.orderId}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Procedure:</span>
            <div style={{ fontWeight: 500 }}>{order.examinationName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {order.modality} • {order.bodyRegion}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Referring Doctor:</span>
            <div>{order.referringDoctor || 'Hospital Staff'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Date: {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            color: '#86efac',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* MAIN VIEW: EDITOR or PREVIEW */}
      {activeTab === 'editor' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {isFinalized && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399' }}>
                <Lock size={18} />
                <span>
                  This report was <strong>Finalized</strong> on{' '}
                  {report?.finalizedAt ? new Date(report.finalizedAt).toLocaleString() : 'N/A'} by{' '}
                  <strong>{report?.finalizedBy}</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAmendmentModal(true)}
                className="btn btn-secondary btn-sm"
              >
                Create Amendment
              </button>
            </div>
          )}

          {/* Section 1: Dynamic Template-driven Sections */}
          {template &&
            template.sections.map(section => (
              <div key={section.sectionId} className="glass-panel" style={{ padding: '22px' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Activity size={16} />
                  <span>{section.title}</span>
                </h3>

                <div className="form-grid">
                  {section.fields.map(field => {
                    const currentVal =
                      sectionValues[section.sectionId]?.[field.fieldId] !== undefined
                        ? sectionValues[section.sectionId][field.fieldId]
                        : field.defaultValue || '';

                    return (
                      <div
                        key={field.fieldId}
                        className={`form-group ${
                          field.type === 'textarea' ? 'form-full' : ''
                        }`}
                      >
                        <label className={`form-label ${field.required ? 'required' : ''}`}>
                          {field.label} {field.unit && `(${field.unit})`}
                        </label>

                        {field.type === 'select' ? (
                          <select
                            className="form-select"
                            value={currentVal}
                            disabled={isFinalized && !showAmendmentModal}
                            onChange={e => handleFieldChange(section.sectionId, field.fieldId, e.target.value)}
                          >
                            <option value="">-- Select Finding --</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'boolean' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <input
                              type="checkbox"
                              id={`${section.sectionId}-${field.fieldId}`}
                              checked={Boolean(currentVal)}
                              disabled={isFinalized && !showAmendmentModal}
                              onChange={e =>
                                handleFieldChange(section.sectionId, field.fieldId, e.target.checked)
                              }
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label
                              htmlFor={`${section.sectionId}-${field.fieldId}`}
                              style={{ cursor: 'pointer', fontSize: '0.88rem' }}
                            >
                              {Boolean(currentVal) ? 'Yes / Present' : 'No / None'}
                            </label>
                          </div>
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={currentVal}
                            disabled={isFinalized && !showAmendmentModal}
                            onChange={e =>
                              handleFieldChange(section.sectionId, field.fieldId, parseFloat(e.target.value) || 0)
                            }
                          />
                        ) : field.type === 'textarea' ? (
                          <textarea
                            className="form-textarea"
                            rows={3}
                            value={currentVal}
                            disabled={isFinalized && !showAmendmentModal}
                            onChange={e => handleFieldChange(section.sectionId, field.fieldId, e.target.value)}
                          />
                        ) : (
                          <input
                            type="text"
                            className="form-input"
                            value={currentVal}
                            disabled={isFinalized && !showAmendmentModal}
                            onChange={e => handleFieldChange(section.sectionId, field.fieldId, e.target.value)}
                          />
                        )}
                        {field.helpText && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {field.helpText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Section 2: Clinical Impression (Required for Finalization) */}
          <div
            className="glass-panel"
            style={{ padding: '22px', borderLeft: '3px solid #0ea5e9' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileText size={18} style={{ color: '#0ea5e9' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Clinical Impression / Conclusion</h3>
              <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Required</span>
            </div>

            <div className="form-group form-full">
              <label className="form-label required">Impression Summary</label>
              <textarea
                className="form-textarea"
                rows={4}
                style={{ fontSize: '0.92rem', lineHeight: 1.5 }}
                placeholder="State primary radiologic conclusion, acute findings, or diagnostic ruling..."
                value={impression}
                disabled={isFinalized && !showAmendmentModal}
                onChange={e => setImpression(e.target.value)}
                required
              />
            </div>

            <div className="form-group form-full" style={{ marginTop: '12px' }}>
              <label className="form-label">Actionable Recommendations / Next Steps (Optional)</label>
              <input
                className="form-input"
                placeholder="e.g. Recommend follow-up MRI in 3 months; consult neurology."
                value={recommendations}
                disabled={isFinalized && !showAmendmentModal}
                onChange={e => setRecommendations(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Critical Communication & Radiologist Signature */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} />
              <span>Attestation & Radiologist Signature</span>
            </h3>

            {/* Critical Results Notification */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="criticalResults"
                  checked={criticalResults}
                  disabled={isFinalized && !showAmendmentModal}
                  onChange={e => setCriticalResults(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="criticalResults" style={{ fontWeight: 600, color: '#fca5a5', cursor: 'pointer', fontSize: '0.88rem' }}>
                  Critical Findings Direct Notification
                </label>
              </div>
              {criticalResults && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    className="form-input"
                    placeholder="Document time of direct call and receiving physician name..."
                    value={criticalDetails}
                    disabled={isFinalized && !showAmendmentModal}
                    onChange={e => setCriticalDetails(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Radiologist Info */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">Reporting Radiologist</label>
                <input
                  className="form-input"
                  value={radiologistName}
                  disabled={isFinalized && !showAmendmentModal}
                  onChange={e => setRadiologistName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Medical License / NPI #</label>
                <input
                  className="form-input"
                  value={licenseNumber}
                  disabled={isFinalized && !showAmendmentModal}
                  onChange={e => setLicenseNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            {!isFinalized ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : 'Save Draft'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={submitting || !impression.trim()}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Finalizing...' : 'Finalize & Sign Report'}</span>
                </button>
              </>
            ) : showAmendmentModal ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ width: '320px' }}
                  placeholder="Mandatory amendment reason..."
                  value={amendmentReason}
                  onChange={e => setAmendmentReason(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowAmendmentModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={!amendmentReason.trim() || submitting}
                  className="btn btn-primary"
                >
                  Sign Amendment (v{(report?.version || 1) + 1})
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAmendmentModal(true)}
                className="btn btn-primary"
              >
                Create Report Amendment
              </button>
            )}
          </div>
        </div>
      ) : (
        /* PREVIEW MODE */
        <div className="glass-panel fade-in" style={{ padding: '36px', background: '#0f172a' }}>
          {/* Header */}
          <div
            style={{
              borderBottom: '2px solid var(--border-color)',
              paddingBottom: '20px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                RADIOLOGY CONSULTATION REPORT
              </h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Main Radiology Suite • Department of Diagnostic Imaging
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                {report?.reportId || 'DRAFT-PREVIEW'}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                {report?.finalizedAt
                  ? new Date(report.finalizedAt).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Patient Header Block */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '28px',
              fontSize: '0.88rem',
            }}
          >
            <div><strong>Patient:</strong> {order?.patientName}</div>
            <div><strong>MRN:</strong> {order?.patientId}</div>
            <div><strong>Accession #:</strong> {order?.accessionNumber}</div>
            <div><strong>Order ID:</strong> {order?.orderId}</div>
            <div><strong>Examination:</strong> {order?.examinationName}</div>
            <div><strong>Modality:</strong> {order?.modality}</div>
            <div><strong>Referring Physician:</strong> {order?.referringDoctor || 'N/A'}</div>
            <div><strong>Clinical Indication:</strong> {order?.clinicalIndication || 'N/A'}</div>
          </div>

          {/* Report Sections Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '0.92rem' }}>
            {template?.sections.map(section => (
              <div key={section.sectionId}>
                <h4
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#38bdf8',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '4px',
                    marginBottom: '10px',
                  }}
                >
                  {section.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.fields.map(field => {
                    const val = sectionValues[section.sectionId]?.[field.fieldId];
                    if (val === undefined || val === '') return null;

                    return (
                      <div key={field.fieldId}>
                        <strong style={{ color: '#d1d5db' }}>{field.label}: </strong>
                        <span style={{ color: '#f3f4f6' }}>
                          {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}{' '}
                          {field.unit || ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Impression Section */}
            <div style={{ borderTop: '2px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
              <h4
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#fff',
                  marginBottom: '8px',
                }}
              >
                IMPRESSION:
              </h4>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#f9fafb', whiteSpace: 'pre-line' }}>
                {impression || 'No impression entered.'}
              </div>
              {recommendations && (
                <div style={{ marginTop: '10px', color: '#93c5fd' }}>
                  <strong>Recommendations: </strong> {recommendations}
                </div>
              )}
            </div>

            {/* Critical Notification Note */}
            {criticalResults && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                }}
              >
                <strong>Critical Results Notice: </strong> Direct physician notification documented. {criticalDetails}
              </div>
            )}

            {/* Electronic Signature Block */}
            <div
              style={{
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Electronically Signed By:</div>
                <strong style={{ color: '#fff', fontSize: '1rem' }}>{radiologistName}</strong>
                <div style={{ color: 'var(--text-secondary)' }}>Staff Radiologist • Lic #{licenseNumber}</div>
              </div>
              <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                <div>Report Version: {report?.version || 1}</div>
                <div>Status: {report?.status || 'DRAFT'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
