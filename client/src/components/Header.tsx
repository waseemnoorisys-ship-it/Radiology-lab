import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, PlusCircle, ListFilter, ShieldCheck, Database, HardDrive } from 'lucide-react';
import { fetchHealth } from '../services/api';

export const Header: React.FC = () => {
  const [health, setHealth] = useState<{
    database?: string;
    orthanc?: string;
  }>({});

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetchHealth();
        setHealth({
          database: res?.services?.database?.status,
          orthanc: res?.services?.orthanc?.status,
        });
      } catch {
        setHealth({ database: 'offline', orthanc: 'offline' });
      }
    };
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="app-header">
      <NavLink to="/new-examination" className="brand">
        <div className="brand-icon">
          <Activity size={20} />
        </div>
        <span>RadFlow <span style={{ color: '#0ea5e9', fontWeight: 500, fontSize: '0.85rem' }}>MVP</span></span>
      </NavLink>

      <nav className="nav-links">
        <NavLink
          to="/new-examination"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <PlusCircle size={16} />
          <span>New Examination</span>
        </NavLink>
        <NavLink
          to="/worklist"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <ListFilter size={16} />
          <span>Radiologist Worklist</span>
        </NavLink>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="status-pill" title="MongoDB Connection">
          <Database size={13} style={{ color: '#9ca3af' }} />
          <span>Mongo</span>
          <span className={`status-dot ${health.database === 'connected' ? 'online' : 'offline'}`} />
        </div>
        <div className="status-pill" title="Orthanc DICOM PACS Connection">
          <HardDrive size={13} style={{ color: '#9ca3af' }} />
          <span>Orthanc</span>
          <span className={`status-dot ${health.orthanc === 'connected' ? 'online' : 'offline'}`} />
        </div>
      </div>
    </header>
  );
};
