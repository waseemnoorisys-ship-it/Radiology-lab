import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ExternalLink,
  Eye,
  Calendar,
  User,
  HardDrive,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Phone,
  Building,
  Download,
  FolderOpen,
} from 'lucide-react';

export const ExaminationDetailDrawer = ({
  order,
  onClose,
  onStatusChange,
  onOpenLocalPicker,
}) => {
  if (!order) return null;

  const isDicomReady = order.imageAvailability === 'AVAILABLE' && Boolean(order.studyInstanceUid);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.95)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className={`badge-modality badge-modality-${order.modality ? order.modality.toLowerCase() : ''}`}>
                {order.modality}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                {order.accessionNumber}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Order ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{order.orderId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status Overview Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Workflow Status</div>
              <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                {order.workflowStatus}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PACS Imaging</div>
              <span
                className={`badge ${
                  order.imageAvailability === 'AVAILABLE'
                    ? 'badge-success'
                    : order.imageAvailability === 'FAILED'
                    ? 'badge-danger'
                    : 'badge-warning'
                }`}
                style={{ fontSize: '0.8rem' }}
              >
                {order.imageAvailability}
              </span>
            </div>
          </div>

          {/* Patient Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#38bdf8' }}>
              <User size={16} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Patient Information
              </h3>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>{' '}
                <strong style={{ color: '#fff' }}>{order.patientName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>MRN / Patient ID:</span>{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{order.patientId}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Demographics:</span>{' '}
                <span>
                  {order.patient && typeof order.patient === 'object' && 'age' in order.patient
                    ? `${order.patient.age || 'N/A'} yrs • ${order.patient.gender || 'Unknown'}`
                    : 'Standard Record'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Registered:</span>{' '}
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Procedure & Clinical Order Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#a855f7' }}>
              <Activity size={16} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Clinical & Procedure Details
              </h3>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Procedure:</span>{' '}
                <strong style={{ color: '#fff' }}>{order.examinationName}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Body Region:</span> {order.bodyRegion}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Laterality:</span> {order.laterality}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Contrast:</span> {order.contrast}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Facility:</span> {order.performingFacility || 'Main Radiology'}
                </div>
              </div>
              {order.protocol && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Scan Protocol:</span>{' '}
                  <span style={{ color: '#38bdf8' }}>{order.protocol}</span>
                </div>
              )}
              {order.clinicalIndication && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Clinical Reason / Indication:</span>
                  <div style={{ marginTop: '2px', color: '#e5e7eb' }}>{order.clinicalIndication}</div>
                </div>
              )}
              {order.referringDoctor && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Referring Physician:</span>{' '}
                  <span>{order.referringDoctor}</span>
                </div>
              )}
              {order.additionalNotes && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Technologist Notes:</span>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{order.additionalNotes}</div>
                </div>
              )}
            </div>
          </div>

          {/* PACS / DICOM Storage Information */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#10b981' }}>
              <HardDrive size={16} />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PACS & DICOM Metadata
              </h3>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Study Instance UID:</span>
                <div style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: isDicomReady ? '#38bdf8' : 'var(--text-muted)', marginTop: '2px' }}>
                  {order.studyInstanceUid || 'No UID assigned (awaiting DICOM upload)'}
                </div>
              </div>
              {order.orthancStudyId && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Orthanc Study UUID:</span>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {order.orthancStudyId}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Series Count:</span>{' '}
                  <strong>{order.seriesCount || 0}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Archived Instances:</span>{' '}
                  <strong>{order.instanceCount || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            marginTop: 'auto',
            padding: '20px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(15, 23, 42, 0.98)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {isDicomReady ? (
            <>
              <Link
                to={`/viewer/${encodeURIComponent(order.studyInstanceUid)}`}
                className="btn btn-primary"
                style={{ justifyContent: 'center', textDecoration: 'none', padding: '12px' }}
              >
                <Eye size={16} />
                <span>Open in Medical Image Viewer</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLocalPicker) onOpenLocalPicker(order);
                }}
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                <FolderOpen size={16} />
                <span>Load / Switch Local DICOM</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLocalPicker) onOpenLocalPicker(order);
                }}
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                <FolderOpen size={16} />
                <span>Select Local DICOM to View</span>
              </button>
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>Zero-upload mode: load DICOM images directly from your computer into OHIF.</span>
              </div>
            </>
          )}

          {/* Report Action Button */}
          <Link
            to={`/reports/${encodeURIComponent(order.orderId)}`}
            className="btn btn-secondary"
            style={{ justifyContent: 'center', textDecoration: 'none' }}
          >
            <FileText size={16} style={{ color: order.workflowStatus === 'FINALIZED' ? '#10b981' : '#38bdf8' }} />
            <span>{order.workflowStatus === 'FINALIZED' ? 'View Finalized Report' : 'Draft / Edit Structured Report'}</span>
          </Link>

          {/* Quick PDF Download if Finalized */}
          {order.workflowStatus === 'FINALIZED' && (
            <a
              href={`/api/reports/order/${encodeURIComponent(order.orderId)}/pdf`}
              target="_blank"
              rel="noreferrer"
              download={`Report_${order.accessionNumber}.pdf`}
              className="btn btn-secondary"
              style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <Download size={16} style={{ color: '#10b981' }} />
              <span>Download Official Signed PDF</span>
            </a>
          )}

          {order.workflowStatus === 'PENDING_REPORT' && onStatusChange && (
            <button
              onClick={() => onStatusChange(order.orderId, 'IN_PROGRESS')}
              className="btn btn-secondary"
              style={{ justifyContent: 'center' }}
            >
              <Clock size={16} />
              <span>Claim Study (Mark In Progress)</span>
            </button>
          )}

          <button onClick={onClose} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
