// FIX: Create ReportDetail component to display hazard identification details and resolve module not found error.
import React, { useState } from 'react';
import { InspectionReport, Hazard, RiskAssessment } from '../types';
import { ArrowLeftIcon, TagIcon, ShieldCheckIcon, ShieldExclamationIcon, ChevronDownIcon, TableCellsIcon } from './icons/Icons';

interface ReportDetailProps {
    report: InspectionReport;
    onBack: () => void;
}

const RiskBadge: React.FC<{ level: RiskAssessment['riskLevel'] }> = ({ level }) => {
    // FIX: Changed 'Tinggi' risk level color to bright red for more urgency.
    const riskStyles: { [key in RiskAssessment['riskLevel']]: string } = {
        'Sangat Rendah': 'bg-gray-500/20 text-gray-300',
        'Rendah': 'bg-green-500/20 text-green-300',
        'Sedang': 'bg-yellow-500/20 text-yellow-300',
        'Tinggi': 'bg-red-500/20 text-red-300',
        'Sangat Tinggi/Kritis': 'bg-red-500/20 text-red-300',
    };
    
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${riskStyles[level]}`}>
            {level}
        </span>
    );
};

// NEW: Component to format risk control text with bold keywords and spacing.
const FormattedRiskControl: React.FC<{ text: string }> = ({ text }) => {
    // FIX: Added 'WORK PRACTICE' to keywords to ensure it gets bolded.
    const controlKeywords = ["ELIMINASI", "SUBSTITUSI", "REKAYASA", "ADMINISTRASI", "WORK PRACTICE", "APD"];
    const lines = text.split('\n').filter(line => line.trim() !== '');

    return (
        <div className="text-slate-400 space-y-3">
            {lines.map((line, index) => {
                const keywordMatch = controlKeywords.find(k => line.trim().toUpperCase().startsWith(k));
                
                if (keywordMatch) {
                    const colonIndex = line.indexOf(':');
                    if (colonIndex > -1) {
                        const keyword = line.substring(0, colonIndex).trim();
                        const description = line.substring(colonIndex + 1).trim();
                        return (
                            <div key={index}>
                                <p>
                                    <strong className="text-slate-200">{keyword}:</strong> {description}
                                </p>
                            </div>
                        );
                    }
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};


const HazardCard: React.FC<{ hazard: Hazard; index: number }> = ({ hazard, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0);
    
    return (
        <div className="bg-slate-800/50 rounded-lg overflow-hidden transition-shadow shadow-md hover:shadow-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sky-300">
                        {index + 1}
                    </div>
                    {/* FIX: Removed truncate to allow long activity text to wrap */}
                    <div className="min-w-0">
                        <h4 className="font-semibold text-white">{hazard.activityDetail}</h4>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                     <RiskBadge level={hazard.residualRisk.riskLevel} />
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                        <div className="bg-slate-900/50 p-3 rounded-md md:col-span-2">
                            <p className="font-semibold text-slate-300 mb-1">Potensi Bahaya</p>
                            <p className="text-slate-400">{hazard.potentialHazard}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-md md:col-span-2">
                            <p className="font-semibold text-slate-300 mb-1">Konsekuensi</p>
                            <p className="text-slate-400">{hazard.consequence}</p>
                        </div>
                        
                        {/* FIX: Made risk sections full-width for consistency */}
                        <div className="bg-slate-900/50 p-3 rounded-md md:col-span-2">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-slate-300">Risiko Awal</p>
                                <RiskBadge level={hazard.initialRisk.riskLevel} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <strong className="block font-semibold text-slate-300 text-xs">P (Probability)</strong>
                                    <span className="text-lg font-mono text-sky-300">{hazard.initialRisk.probability}</span>
                                </div>
                                <div>
                                    {/* FIX: Added whitespace-nowrap to prevent label breaking */}
                                    <strong className="block font-semibold text-slate-300 text-xs whitespace-nowrap">S (Severity/Keparahan)</strong>
                                    <span className="text-lg font-mono text-sky-300">{hazard.initialRisk.severity}</span>
                                </div>
                                <div>
                                    <strong className="block font-semibold text-slate-300 text-xs">Skor</strong>
                                    <span className="text-lg font-mono text-sky-300">{hazard.initialRisk.riskScore}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-md md:col-span-2">
                            <p className="font-semibold text-slate-300 mb-1">Pengendalian Risiko</p>
                            <FormattedRiskControl text={hazard.riskControl} />
                        </div>
                        
                         <div className="bg-slate-900/50 p-3 rounded-md md:col-span-2">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-slate-300">Risiko Sisa</p>
                                <RiskBadge level={hazard.residualRisk.riskLevel} />
                            </div>
                             <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <strong className="block font-semibold text-slate-300 text-xs">P (Probability)</strong>
                                    <span className="text-lg font-mono text-sky-300">{hazard.residualRisk.probability}</span>
                                </div>
                                <div>
                                    <strong className="block font-semibold text-slate-300 text-xs whitespace-nowrap">S (Severity/Keparahan)</strong>
                                    <span className="text-lg font-mono text-sky-300">{hazard.residualRisk.severity}</span>
                                </div>
                                <div>
                                    <strong className="block font-semibold text-slate-300 text-xs">Skor</strong>
                                    <span className="text-lg font-mono text-sky-300">{hazard.residualRisk.riskScore}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const HazardTable: React.FC<{ hazards: Hazard[] }> = ({ hazards }) => {
    return (
        <div className="overflow-x-auto bg-slate-800 rounded-xl shadow-2xl p-2">
            <table className="min-w-full text-sm text-left text-slate-300">
                <thead className="bg-slate-700/50 text-xs text-slate-300 uppercase">
                    <tr>
                        <th scope="col" className="p-3">Rincian Aktivitas</th>
                        <th scope="col" className="p-3">Potensi Bahaya</th>
                        <th scope="col" className="p-3">Konsekuensi</th>
                        <th scope="col" className="p-3 text-center border-l border-r border-slate-600" colSpan={4}>Penilaian Risiko Awal</th>
                        <th scope="col" className="p-3">Pengendalian Risiko</th>
                        <th scope="col" className="p-3 text-center border-l border-r border-slate-600" colSpan={4}>Penilaian Risiko Sisa</th>
                    </tr>
                    <tr className="bg-slate-700/50">
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                        {/* FIX: Shortened headers to just P, S, Skor, Tingkat per user request */}
                        <th className="p-2 text-center font-semibold border-l border-slate-600">P</th>
                        <th className="p-2 text-center font-semibold">S</th>
                        <th className="p-2 text-center font-semibold">Skor</th>
                        <th className="p-2 text-center font-semibold border-r border-slate-600">Tingkat</th>
                        <th className="p-1"></th>
                        <th className="p-2 text-center font-semibold border-l border-slate-600">P</th>
                        <th className="p-2 text-center font-semibold">S</th>
                        <th className="p-2 text-center font-semibold">Skor</th>
                        <th className="p-2 text-center font-semibold border-r border-slate-600">Tingkat</th>
                    </tr>
                </thead>
                <tbody>
                    {hazards.map((hazard, index) => (
                        <tr key={index} className="border-b border-slate-700">
                            <td className="p-3 whitespace-pre-wrap">{hazard.activityDetail}</td>
                            <td className="p-3">{hazard.potentialHazard}</td>
                            <td className="p-3">{hazard.consequence}</td>
                            <td className="p-3 text-center border-l border-slate-600">{hazard.initialRisk.probability}</td>
                            <td className="p-3 text-center">{hazard.initialRisk.severity}</td>
                            <td className="p-3 text-center">{hazard.initialRisk.riskScore}</td>
                            <td className="p-3 text-center border-r border-slate-600"><RiskBadge level={hazard.initialRisk.riskLevel} /></td>
                            <td className="p-3"><FormattedRiskControl text={hazard.riskControl} /></td>
                            <td className="p-3 text-center border-l border-slate-600">{hazard.residualRisk.probability}</td>
                            <td className="p-3 text-center">{hazard.residualRisk.severity}</td>
                            <td className="p-3 text-center">{hazard.residualRisk.riskScore}</td>
                            <td className="p-3 text-center border-r border-slate-600"><RiskBadge level={hazard.residualRisk.riskLevel} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ReportDetail: React.FC<ReportDetailProps> = ({ report, onBack }) => {

    const hasHazards = report.analysis && report.analysis.hazards.length > 0;
    const reportTitle = report.tasks.map(t => t.description).join('\n');

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-semibold mb-6">
                <ArrowLeftIcon className="w-5 h-5" />
                Kembali ke Daftar
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                   <div className="bg-slate-800 rounded-xl shadow-2xl p-4">
                       <h3 className="font-semibold text-lg mb-3">Tugas / Alat / Bahan</h3>
                       <div className="space-y-4">
                           {report.tasks.map((task, index) => (
                               <div key={task.id} className="bg-slate-900/50 p-3 rounded-md">
                                   <p className="font-semibold text-slate-300">#{index + 1}: {task.description}</p>
                                   {task.imageDataUrl && (
                                       <img
                                          src={task.imageDataUrl}
                                          alt={`Foto untuk ${task.description}`}
                                          className="rounded-lg w-full h-auto object-cover mt-2"
                                      />
                                   )}
                               </div>
                           ))}
                       </div>
                   </div>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
                        <p className="text-sm text-slate-400">
                            {new Date(report.date).toLocaleString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                        <h2 className="text-2xl font-bold mt-1 flex items-start gap-3">
                            <TagIcon className="w-7 h-7 text-sky-400 flex-shrink-0 mt-1" />
                            <span className="whitespace-pre-wrap">{reportTitle}</span>
                        </h2>
                     </div>

                     <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
                        {/* FIX: Title changed as per user request */}
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <ShieldExclamationIcon className="w-6 h-6 text-orange-400" />
                            RINCIAN AKTIVITAS
                        </h3>
                        {hasHazards ? (
                            <div className="space-y-4">
                                {report.analysis.hazards.map((hazard, index) => (
                                    <HazardCard key={index} hazard={hazard} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 bg-slate-900/50 rounded-lg">
                                <ShieldCheckIcon className="w-12 h-12 mx-auto text-green-400" />
                                <p className="mt-4 font-semibold">Tidak ada potensi bahaya signifikan yang teridentifikasi.</p>
                                <p className="text-sm text-slate-400 mt-1">Area kerja tampak aman berdasarkan analisis awal.</p>
                            </div>
                        )}
                     </div>

                     {hasHazards && (
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 p-1">
                                <TableCellsIcon className="w-6 h-6 text-sky-400" />
                                Tampilan Tabel IBPR Lengkap
                            </h3>
                            <HazardTable hazards={report.analysis.hazards} />
                        </div>
                     )}

                </div>
            </div>
        </div>
    );
};

export default ReportDetail;