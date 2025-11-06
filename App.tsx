import React, { useState, useEffect, useCallback } from 'react';
import { InspectionReport } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import InspectionRecorder from './components/InspectionRecorder';
import ReportList from './components/ReportList';
import ReportDetail from './components/ReportDetail';
import { PlusCircleIcon, BookOpenIcon } from './components/icons/Icons';

type View = 'home' | 'new' | 'detail';

const App: React.FC = () => {
  const [reports, setReports] = useLocalStorage<InspectionReport[]>('k3-reports', []);
  const [view, setView] = useState<View>('home');
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);

  const handleSaveReport = (report: InspectionReport) => {
    const updatedReports = [report, ...reports];
    setReports(updatedReports);
    setSelectedReport(report);
    setView('detail');
  };

  const handleSelectReport = (report: InspectionReport) => {
    setSelectedReport(report);
    setView('detail');
  };
  
  const handleBack = () => {
      setSelectedReport(null);
      setView('home');
  }

  const renderView = () => {
    switch (view) {
      case 'new':
        return <InspectionRecorder onSave={handleSaveReport} onCancel={() => setView('home')} />;
      case 'detail':
        return selectedReport ? <ReportDetail report={selectedReport} onBack={handleBack} /> : <div />;
      case 'home':
      default:
        return (
          <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <button onClick={() => setView('new')} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-8 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center text-center">
                    <PlusCircleIcon className="w-16 h-16 mb-4" />
                    <h2 className="text-2xl">Mulai Identifikasi Bahaya Baru</h2>
                    <p className="text-sky-200 mt-1">Ambil foto untuk memulai analisis.</p>
                </button>
                <div className="bg-slate-800 p-8 rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
                    <BookOpenIcon className="w-16 h-16 mb-4 text-sky-400" />
                    <h2 className="text-2xl">Riwayat Identifikasi Bahaya</h2>
                    <p className="text-slate-400 mt-1">Anda memiliki {reports.length} laporan tersimpan.</p>
                </div>
              </div>
            <ReportList reports={reports} onSelectReport={handleSelectReport} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Header onHomeClick={() => setView('home')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;