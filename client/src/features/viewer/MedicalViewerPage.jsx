import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  FileText,
  User,
  Activity,
  Layers,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { fetchWorklist } from '../../services/api';

export const MedicalViewerPage = () => {
  const { studyInstanceUid } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (!studyInstanceUid) return;

    // Fetch matching order details for patient & clinical context
    fetchWorklist({ limit: 100 })
      .then(res => {
        if (res.success && res.data) {
          const match = res.data.find(o => o.studyInstanceUid === studyInstanceUid);
          if (match) setOrder(match);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studyInstanceUid]);

  const copyUid = () => {
    if (studyInstanceUid) {
      navigator.clipboard.writeText(studyInstanceUid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!studyInstanceUid) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertTriangle size={36} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h2>Invalid Study Identifier</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No StudyInstanceUID provided in the URL route.</p>
        <button onClick={() => navigate('/worklist')} className="btn btn-secondary">
          Return to Worklist
        </button>
      </div>
    );
  }

  const directViewerUrl = `/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUid)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#0b0f19' }}>
      {/* Viewer Control & Context Bar */}
      <div
        style={{
          height: '52px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          zIndex: 10,
        }}
      >
        {/* Left: Back & Study Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/worklist')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <ArrowLeft size={15} />
            <span>Worklist</span>
          </button>

          {order ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`badge-modality badge-modality-${order.modality ? order.modality.toLowerCase() : ''}`}>
                  {order.modality}
                </span>
                <strong style={{ color: '#fff' }}>{order.patientName}</strong>
                <span style={{ color: 'var(--text-muted)' }}>({order.patientId})</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
              <div style={{ color: 'var(--text-secondary)' }}>
                <span>{order.examinationName}</span>
                <span style={{ fontFamily: 'var(--font-mono)', marginLeft: '8px', color: '#38bdf8' }}>
                  {order.accessionNumber}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Study:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{studyInstanceUid}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Copy UID */}
          <button
            onClick={copyUid}
            className="btn btn-secondary btn-sm"
            title="Copy Study Instance UID"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
          >
            {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'UID'}</span>
          </button>

          {/* Reload Iframe */}
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="btn btn-secondary btn-sm"
            title="Reload OHIF viewer"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw size={14} />
          </button>

          {/* Open in full external tab */}
          <a
            href={directViewerUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            title="Open in new window"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <span>Pop Out</span>
            <ExternalLink size={14} />
          </a>

          {/* Structured Report Link */}
          {order && (
            <Link
              to={`/reports/${encodeURIComponent(order.orderId)}`}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', textDecoration: 'none' }}
            >
              <FileText size={14} />
              <span>Report Study</span>
            </Link>
          )}
        </div>
      </div>

      {/* Embedded OHIF Viewport */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <iframe
          key={iframeKey}
          src={directViewerUrl}
          title="OHIF Medical Image Viewer"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            background: '#000',
          }}
          allow="fullscreen; clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
};
