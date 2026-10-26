import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Layers,
  ChevronDown,
  Info,
  Calendar,
  X,
  Filter,
  Download,
} from 'lucide-react';
import { fetchWorklist, updateExaminationWorkflowStatus } from '../../services/api';
import { ExaminationDetailDrawer } from './ExaminationDetailDrawer';

export const WorklistPage = () => {
  // Data state
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingUpload: 0,
    pendingReport: 0,
    inProgress: 0,
    finalized: 0,
    imagesAvailable: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedModality, setSelectedModality] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Selected Order for Slide-over Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load Worklist
  const loadWorklist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWorklist({
        search: search.trim() || undefined,
        modality: selectedModality !== 'ALL' ? selectedModality : undefined,
        workflowStatus: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        imageAvailability: selectedAvailability !== 'ALL' ? selectedAvailability : undefined,
        dateRange: dateRange !== 'all' ? dateRange : undefined,
        sortBy,
        sortOrder,
        limit: 100,
      });

      if (res.success) {
        setOrders(res.data);
        if (res.stats) {
          setStats(res.stats);
        }
      } else {
        setError('Failed to retrieve examinations worklist.');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching worklist');
    } finally {
      setLoading(false);
    }
  }, [search, selectedModality, selectedStatus, selectedAvailability, dateRange, sortBy, sortOrder]);

  useEffect(() => {
    loadWorklist();
  }, [loadWorklist]);

  // Handle Quick Status Update (e.g. claim study)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await updateExaminationWorkflowStatus(orderId, newStatus, 'Radiologist');
      if (res.success && res.data) {
        // Refresh local items
        setOrders(prev =>
          prev.map(o => (o.orderId === orderId ? { ...o, workflowStatus: res.data.workflowStatus } : o))
        );
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(prev => (prev ? { ...prev, workflowStatus: res.data.workflowStatus } : null));
        }
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedModality('ALL');
    setSelectedStatus('ALL');
    setSelectedAvailability('ALL');
    setDateRange('all');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    search !== '' ||
    selectedModality !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedAvailability !== 'ALL' ||
    dateRange !== 'all';

  const modalitiesList = ['ALL', 'CT', 'MR', 'US', 'DX', 'MG'];

  return (
    <div className="page-container">
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Radiologist Worklist</h1>
          <p className="page-subtitle">Diagnostic Radiology Workspace — Study triage, image verification, and reporting</p>
        </div>
        <button
          onClick={loadWorklist}
          disabled={loading}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="kpi-grid">
        <div
          className="kpi-card"
          style={{ cursor: 'pointer', borderLeft: selectedStatus === 'ALL' ? '3px solid #0284c7' : undefined }}
          onClick={() => setSelectedStatus('ALL')}
        >
          <div className="kpi-icon" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-label">Total Studies</div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ cursor: 'pointer', borderLeft: selectedStatus === 'PENDING_UPLOAD' ? '3px solid #f59e0b' : undefined }}
          onClick={() => setSelectedStatus('PENDING_UPLOAD')}
        >
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <UploadCloud size={22} />
          </div>
          <div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{stats.pendingUpload}</div>
            <div className="kpi-label">Awaiting Upload</div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ cursor: 'pointer', borderLeft: selectedStatus === 'PENDING_REPORT' ? '3px solid #0ea5e9' : undefined }}
          onClick={() => setSelectedStatus('PENDING_REPORT')}
        >
          <div className="kpi-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="kpi-value" style={{ color: '#38bdf8' }}>{stats.pendingReport}</div>
            <div className="kpi-label">Ready for Report</div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ cursor: 'pointer', borderLeft: selectedStatus === 'IN_PROGRESS' ? '3px solid #a855f7' : undefined }}
          onClick={() => setSelectedStatus('IN_PROGRESS')}
        >
          <div className="kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="kpi-value" style={{ color: '#c084fc' }}>{stats.inProgress}</div>
            <div className="kpi-label">In Progress</div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ cursor: 'pointer', borderLeft: selectedStatus === 'FINALIZED' ? '3px solid #10b981' : undefined }}
          onClick={() => setSelectedStatus('FINALIZED')}
        >
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{stats.finalized}</div>
            <div className="kpi-label">Finalized Reports</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Row: Search and Quick Modality Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '480px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: search ? '36px' : '14px', width: '100%' }}
                placeholder="Search patient MRN, name, accession #, order ID, or exam..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Modality Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px' }}>Modality:</span>
              {modalitiesList.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedModality(m)}
                  className={`chip ${selectedModality === m ? 'active' : ''}`}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Advanced Filter Dropdowns & Sorting */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_UPLOAD">Awaiting Upload</option>
                <option value="PENDING_REPORT">Ready for Report</option>
                <option value="IN_PROGRESS">Reporting In Progress</option>
                <option value="FINALIZED">Finalized</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PACS Images:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                value={selectedAvailability}
                onChange={e => setSelectedAvailability(e.target.value)}
              >
                <option value="ALL">All States</option>
                <option value="AVAILABLE">Available in PACS</option>
                <option value="NO_IMAGES">Missing Images</option>
                <option value="FAILED">Upload Failed</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="patientName-asc">Patient Name (A-Z)</option>
                <option value="modality-asc">Modality</option>
                <option value="workflowStatus-asc">Workflow Status</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', color: '#f87171' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Worklist Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#0ea5e9' }} />
            <div>Loading radiologist worklist...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#fca5a5' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px', color: '#ef4444' }} />
            <div>{error}</div>
            <button onClick={loadWorklist} className="btn btn-secondary btn-sm" style={{ marginTop: '14px' }}>
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <Layers size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No examinations found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
              {hasActiveFilters
                ? 'No studies match your current filter parameters. Try resetting your search or filters.'
                : 'No examination orders have been registered yet.'}
            </p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="btn btn-secondary btn-sm">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="worklist-table-container">
            <table className="worklist-table">
              <thead>
                <tr>
                  <th>Identifiers</th>
                  <th>Patient Details</th>
                  <th>Modality & Procedure</th>
                  <th>Clinical Reason</th>
                  <th>PACS Imaging</th>
                  <th>Workflow Status</th>
                  <th>Study Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const isAvailable = order.imageAvailability === 'AVAILABLE' && Boolean(order.studyInstanceUid);

                  return (
                    <tr key={order._id}>
                      {/* Identifiers */}
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', fontSize: '0.88rem' }}>
                          {order.accessionNumber}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.orderId}
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{order.patientName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{order.patientId}</span>
                          {order.patient && typeof order.patient === 'object' && 'age' in order.patient && (
                            <span>• {order.patient.age || 'N/A'}y ({order.patient.gender})</span>
                          )}
                        </div>
                      </td>

                      {/* Modality & Procedure */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span className={`badge-modality badge-modality-${order.modality ? order.modality.toLowerCase() : ''}`}>
                            {order.modality}
                          </span>
                          <span style={{ fontWeight: 500, color: '#f3f4f6' }}>{order.examinationName}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {order.bodyRegion} {order.laterality !== 'NOT_APPLICABLE' && `• ${order.laterality}`}
                        </div>
                      </td>

                      {/* Clinical Reason */}
                      <td style={{ maxWidth: '220px' }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={order.clinicalIndication || 'No clinical indication provided'}
                        >
                          {order.clinicalIndication || '—'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {order.referringDoctor ? `Ref: ${order.referringDoctor}` : ''}
                        </div>
                      </td>

                      {/* PACS Image Status */}
                      <td>
                        {isAvailable ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                              AVAILABLE
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {order.instanceCount ? `${order.instanceCount} img` : 'Archived'}
                            </span>
                          </div>
                        ) : order.imageAvailability === 'UPLOADING' ? (
                          <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                            UPLOADING
                          </span>
                        ) : order.imageAvailability === 'FAILED' ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                            UPLOAD FAILED
                          </span>
                        ) : (
                          <span
                            className="badge badge-warning"
                            style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}
                            title="Awaiting DICOM upload from machine operator"
                          >
                            NO IMAGES
                          </span>
                        )}
                      </td>

                      {/* Workflow Status */}
                      <td>
                        <span
                          className={`badge ${
                            order.workflowStatus === 'FINALIZED'
                              ? 'badge-success'
                              : order.workflowStatus === 'IN_PROGRESS' || order.workflowStatus === 'DRAFT_SAVED'
                              ? 'badge-primary'
                              : order.workflowStatus === 'PENDING_REPORT'
                              ? 'badge-primary'
                              : 'badge-warning'
                          }`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {order.workflowStatus}
                        </span>
                      </td>

                      {/* Study Date */}
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* Launch OHIF Viewer Button */}
                          {isAvailable ? (
                            <Link
                              to={`/viewer/${encodeURIComponent(order.studyInstanceUid)}`}
                              className="btn btn-primary btn-sm"
                              title="Launch Integrated Medical Viewer with OHIF"
                              style={{ textDecoration: 'none', padding: '6px 10px', fontSize: '0.78rem' }}
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="btn btn-secondary btn-sm"
                              title="Cannot view: DICOM images not yet uploaded to PACS"
                              style={{ opacity: 0.4, cursor: 'not-allowed', padding: '6px 10px', fontSize: '0.78rem' }}
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </button>
                          )}

                          {/* Report Button */}
                          <Link
                            to={`/reports/${encodeURIComponent(order.orderId)}`}
                            className="btn btn-secondary btn-sm"
                            title={order.workflowStatus === 'FINALIZED' ? 'View / Amend Finalized Report' : 'Draft or Finalize Structured Report'}
                            style={{ textDecoration: 'none', padding: '6px 10px', fontSize: '0.78rem' }}
                          >
                            <FileText size={14} style={{ color: order.workflowStatus === 'FINALIZED' ? '#10b981' : '#38bdf8' }} />
                            <span>Report</span>
                          </Link>

                          {/* Quick PDF Download for Finalized Reports */}
                          {order.workflowStatus === 'FINALIZED' && (
                            <a
                              href={`/api/reports/order/${encodeURIComponent(order.orderId)}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              download={`Report_${order.accessionNumber}.pdf`}
                              className="btn btn-secondary btn-sm"
                              title="Download Signed PDF Report"
                              style={{ textDecoration: 'none', padding: '6px 8px' }}
                            >
                              <Download size={14} style={{ color: '#10b981' }} />
                            </a>
                          )}

                          {/* Examination Detail Drawer Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-secondary btn-sm"
                            title="View study & patient details"
                            style={{ padding: '6px 8px' }}
                          >
                            <Info size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Detailed Drawer */}
      <ExaminationDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
