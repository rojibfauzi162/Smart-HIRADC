// FIX: Create ReportList component to display past hazard identification reports and resolve module not found error.
import React from 'react';
import { InspectionReport, RiskAssessment } from '../types';
import { ChevronRightIcon, ShieldExclamationIcon, DocumentTextIcon } from './icons/Icons';

interface ReportListProps {
  reports: InspectionReport[];
  onSelectReport: (report: InspectionReport) => void;
}

const riskLevelOrder: { [key in RiskAssessment['riskLevel']]: number } = {
  'Sangat Rendah': 1,
  'Rendah': 2,
  'Sedang': 3,
  'Tinggi': 4,
  'Sangat Tinggi/Kritis': 5,
};

const getHighestRiskLevel = (report: InspectionReport): RiskAssessment['riskLevel'] | null => {
  if (!report.analysis || report.analysis.hazards.length === 0) {
    return null;
  }
  
  const highestRisk = report.analysis.hazards.reduce((max, hazard) => {
    const currentLevel = hazard.initialRisk.riskLevel;
    if (riskLevelOrder[currentLevel] > riskLevelOrder[max]) {
      return currentLevel;
    }
    return max;
  }, 'Sangat Rendah' as RiskAssessment['riskLevel']);

  return highestRisk;
};


const ReportList: React.FC<ReportListProps> = ({ reports, onSelectReport }) => {
  if (reports.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-slate-800 rounded-xl">
        <ShieldExclamationIcon className="mx-auto h-12 w-12 text-slate-500" />
        <h3 className="mt-2 text-lg font-medium text-white">Belum Ada Laporan</h3>
        <p className="mt-1 text-sm text-slate-400">Mulai identifikasi bahaya baru untuk melihat laporan Anda di sini.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <ul role="list" className="divide-y divide-slate-700">
        {reports.map((report) => {
          const highestRisk = getHighestRiskLevel(report);
          const firstTaskWithImage = report.tasks.find(t => t.imageDataUrl);
          const thumbnailUrl = firstTaskWithImage ? firstTaskWithImage.imageDataUrl : null;
          const reportTitle = report.tasks.map(t => t.description).join(' / ') || "Identifikasi Bahaya Tanpa Judul";

          return (
            <li
              key={report.id}
              onClick={() => onSelectReport(report)}
              className="relative flex justify-between gap-x-6 px-4 py-5 sm:px-6 hover:bg-slate-700/50 cursor-pointer transition-colors"
            >
              <div className="flex min-w-0 gap-x-4">
                {thumbnailUrl ? (
                    <img className="h-16 w-16 flex-none rounded-md bg-slate-700 object-cover" src={thumbnailUrl} alt="Task" />
                ) : (
                    <div className="h-16 w-16 flex-none rounded-md bg-slate-700 flex items-center justify-center">
                        <DocumentTextIcon className="h-8 w-8 text-slate-500" />
                    </div>
                )}
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-white">
                      {reportTitle}
                  </p>
                  <p className="mt-1 flex text-xs leading-5 text-slate-400">
                    <time dateTime={report.date}>
                      {new Date(report.date).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </p>
                  {highestRisk ? (
                     <p className="mt-1 text-xs leading-5 text-yellow-400">
                       Risiko Tertinggi: {highestRisk}
                     </p>
                  ) : (
                     <p className="mt-1 text-xs leading-5 text-green-400">
                      Tidak ada bahaya teridentifikasi
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <ChevronRightIcon className="h-5 w-5 flex-none text-slate-400" aria-hidden="true" />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
};

export default ReportList;