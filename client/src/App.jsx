import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { NewExaminationPage } from './features/examinations/NewExaminationPage';
import { WorklistPage } from './features/worklist/WorklistPage';
import { MedicalViewerPage } from './features/viewer/MedicalViewerPage';
import { ReportingPage } from './features/reporting/ReportingPage';

export const App = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/worklist" replace />} />
            <Route path="/new-examination" element={<NewExaminationPage />} />
            <Route path="/worklist" element={<WorklistPage />} />
            <Route path="/viewer/:studyInstanceUid" element={<MedicalViewerPage />} />
            <Route path="/reports/:orderId" element={<ReportingPage />} />
            <Route path="*" element={<Navigate to="/worklist" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
