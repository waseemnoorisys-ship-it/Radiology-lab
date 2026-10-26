import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  FileCheck,
  AlertTriangle,
  X,
  UploadCloud,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { parseAndCacheLocalDicomFiles } from '../../services/localDicomStore';
import { linkLocalStudyToOrder } from '../../services/api';

export const LocalDicomPickerModal = ({ order, isOpen, onClose, onStudyLoaded }) => {
  const navigate = useNavigate();
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [parsingStatus, setParsingStatus] = useState('');
  const [error, setError] = useState(null);
  const [mismatchWarning, setMismatchWarning] = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);

  if (!isOpen) return null;

  const handleFileSelection = async (fileList, overrideMismatch = false) => {
    if (!fileList || fileList.length === 0) return;

    setError(null);
    setMismatchWarning(null);
    setLoading(true);
    setParsingStatus(`Reading ${fileList.length} local DICOM file(s)...`);

    try {
      const filesArray = Array.from(fileList);
      setParsingStatus('Validating DICOM headers & patient safety check...');

      const result = await parseAndCacheLocalDicomFiles(filesArray, order, {
        overrideMismatch,
      });

      if (result.mismatch && !overrideMismatch) {
        setMismatchWarning({
          message: result.warning,
          parsedPatient: result.parsedPatient,
        });
        setPendingFiles(filesArray);
        setLoading(false);
        return;
      }

      setParsingStatus('Linking local study metadata...');

      // Notify MongoDB backend that a local study is linked
      if (order && order.orderId) {
        await linkLocalStudyToOrder(order.orderId, {
          studyInstanceUid: result.studyInstanceUid,
          seriesCount: result.seriesCount,
          instanceCount: result.instanceCount,
          modality: result.modality || order.modality,
        }).catch((err) => {
          console.warn('[RadFlow] Non-critical metadata link notice:', err);
        });
      }

      setParsingStatus('Loading OHIF Medical Viewer...');

      if (onStudyLoaded) {
        onStudyLoaded(result);
      }

      onClose();
      navigate(`/viewer/${encodeURIComponent(result.studyInstanceUid)}`);
    } catch (err) {
      console.error('[RadFlow] Local DICOM parsing error:', err);
      setError(err.message || 'Failed to parse DICOM files. Ensure they are valid DICOM Part 10 files.');
    } finally {
      setLoading(false);
      setParsingStatus('');
    }
  };

  const handleFolderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files, false);
    }
  };

  const handleFilesChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files, false);
    }
  };

  const handleConfirmOverride = () => {
    if (pendingFiles) {
      handleFileSelection(pendingFiles, true);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '580px',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                Select Local DICOM Images
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Zero-upload local viewing inside OHIF Viewer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target Examination Context Card */}
          {order && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Order</div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                  {order.patientName}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{order.patientId}</span> • Acc:{' '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{order.accessionNumber}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge-modality badge-modality-${order.modality ? order.modality.toLowerCase() : ''}`}>
                  {order.modality}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {order.examinationName}
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Zero-Upload Assurance Banner */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.8rem',
              color: '#6ee7b7',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>100% Client-Side Privacy Guaranteed:</strong> DICOM files are parsed and
              streamed directly from your computer into browser memory. Zero image bytes are
              uploaded to Express or Orthanc servers.
            </div>
          </div>

          {/* Patient Safety Mismatch Warning */}
          {mismatchWarning && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fcd34d',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertTriangle size={20} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Safety Check: Patient Mismatch Detected</strong>
                  <p style={{ margin: '4px 0 0', color: '#fef3c7', fontSize: '0.8rem' }}>
                    {mismatchWarning.message}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMismatchWarning(null);
                    setPendingFiles(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  Choose Different Files
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverride}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.78rem', background: '#d97706', borderColor: '#b45309' }}
                >
                  Confirm & Open Anyway
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Action Pickers */}
          {loading ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
              }}
            >
              <RefreshCw size={32} className="spin" style={{ color: '#38bdf8', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{parsingStatus}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Parsing DICOM headers & caching slices in browser IndexedDB...
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Option 1: Select Entire DICOM Folder */}
              <div
                onClick={() => folderInputRef.current?.click()}
                style={{
                  padding: '24px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(56, 189, 248, 0.4)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)')}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <FolderOpen size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                    Select Folder
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Entire patient study with all series & slices
                  </div>
                </div>
                <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none', marginTop: '6px' }}>
                  Browse Folder
                </span>
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory=""
                  directory=""
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFolderChange}
                />
              </div>

              {/* Option 2: Select DICOM Files */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '24px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(168, 85, 247, 0.4)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#c084fc')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)')}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <FileCheck size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                    Select Files
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    One or more .dcm or Part 10 DICOM files
                  </div>
                </div>
                <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none', marginTop: '6px' }}>
                  Browse Files
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".dcm,image/dicom,*/*"
                  style={{ display: 'none' }}
                  onChange={handleFilesChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <button onClick={onClose} disabled={loading} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
