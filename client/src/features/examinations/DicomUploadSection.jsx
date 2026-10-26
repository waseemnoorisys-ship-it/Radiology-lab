import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, FileUp, CheckCircle, AlertCircle, ExternalLink, HardDrive, List } from 'lucide-react';
import { uploadExaminationDicom } from '../../services/api';

export const DicomUploadSection = ({
  orderId,
  accessionNumber,
  onUploadSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one .dcm file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(`Transmitting ${selectedFiles.length} instance(s) to Orthanc PACS archive...`);

    try {
      const res = await uploadExaminationDicom(orderId, selectedFiles);
      if (res.success && res.data) {
        setUploadResult(res.data);
        if (onUploadSuccess) onUploadSuccess(res.data);
      } else {
        setError(res.error || 'Upload to Orthanc failed.');
      }
    } catch (err) {
      setError(err.message || 'Network error during upload');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <HardDrive size={18} style={{ color: '#0ea5e9' }} />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>DICOM Medical Image Ingestion</h3>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', padding: '12px 14px', borderRadius: 'var(--radius-md)', color: '#fca5a5', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {uploadResult ? (
        <div className="glass-panel fade-in" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', marginBottom: '16px' }}>
            <CheckCircle size={22} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>DICOM Study Successfully Archived in Orthanc</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem', marginBottom: '20px' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Orthanc Study UUID:</span> <span style={{ fontFamily: 'var(--font-mono)' }}>{uploadResult.orthancStudyId}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Study Instance UID:</span> <span style={{ fontFamily: 'var(--font-mono)' }}>{uploadResult.studyInstanceUid}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Instances Archived:</span> <strong>{uploadResult.instanceCount} file(s)</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Image Availability:</span> <span className="badge badge-success">{uploadResult.imageAvailability}</span></div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href={`http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(uploadResult.studyInstanceUid)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              <span>Launch OHIF Image Viewer</span>
              <ExternalLink size={16} />
            </a>
            <Link
              to="/worklist"
              className="btn btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              <List size={16} />
              <span>Go to Radiologist Worklist</span>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#0ea5e9' : 'rgba(255, 255, 255, 0.15)'}`,
              background: isDragging ? 'rgba(14, 165, 233, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '16px',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".dcm,application/dicom"
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
            <UploadCloud size={40} style={{ color: isDragging ? '#38bdf8' : '#9ca3af', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
              Drag & drop DICOM (.dcm) files here, or <span style={{ color: '#38bdf8' }}>browse your computer</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Supports multiple .dcm files belonging to this examination order ({accessionNumber})
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div style={{ background: 'var(--bg-input)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedFiles.length} file(s) selected:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total: {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>
              <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileUp size={14} style={{ color: '#38bdf8' }} />
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{file.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadProgress && (
            <div style={{ padding: '10px 14px', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', color: '#38bdf8', fontSize: '0.85rem', marginBottom: '16px' }}>
              {uploadProgress}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedFiles([])}
                disabled={uploading}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedFiles.length === 0 || uploading}
              onClick={handleUpload}
            >
              {uploading ? 'Validating & Archiving...' : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} DICOM Files to Orthanc`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
