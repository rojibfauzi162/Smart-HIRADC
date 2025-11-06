import React, { useState } from 'react';
import { InspectionReport, GroundingResult, GroundingChunk } from '../types';
import { editImage, performGroundedSearch } from '../services/geminiService';
import { PencilIcon, MagnifyingGlassIcon, SparklesIcon, LinkIcon } from './icons/Icons';

interface ActionPanelProps {
    report: InspectionReport;
    onUpdateReport: (report: InspectionReport) => void;
}

type ActiveTab = 'edit' | 'search';

const GroundingResultDisplay: React.FC<{ result: GroundingResult }> = ({ result }) => {
    
    const renderChunk = (chunk: GroundingChunk, index: number) => {
        if (chunk.web) {
            return <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center space-x-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors text-sm">
                <LinkIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="truncate text-slate-300">{chunk.web.title}</span>
            </a>
        }
        if (chunk.maps) {
             return <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center space-x-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors text-sm">
                <LinkIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="truncate text-slate-300">{chunk.maps.title}</span>
            </a>
        }
        return null;
    }

    return (
        <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-300 whitespace-pre-wrap">{result.text}</p>
            {result.chunks && result.chunks.length > 0 && (
                 <div className="pt-3 border-t border-slate-700">
                    <h4 className="font-semibold mb-2 text-slate-300">Sumber:</h4>
                    <div className="space-y-2">
                        {result.chunks.map(renderChunk)}
                    </div>
                </div>
            )}
        </div>
    );
};


const ActionPanel: React.FC<ActionPanelProps> = ({ report, onUpdateReport }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('search');
    const [editPrompt, setEditPrompt] = useState('');
    const [searchPrompt, setSearchPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEditImage = async () => {
        if (!editPrompt) return;
        setIsLoading(true);
        setError(null);
        try {
            // FIX: Source image logic updated to pull from tasks array since 'imageDataUrl' is no longer a direct report property. Also handles 'editedImageDataUrl'.
            const firstTaskImage = report.tasks.find(task => task.imageDataUrl)?.imageDataUrl;
            const sourceImage = report.editedImageDataUrl || firstTaskImage;

            if (!sourceImage) {
                setError('Tidak ada gambar untuk diedit dalam laporan ini.');
                setIsLoading(false);
                return;
            }

            const newImageDataUrl = await editImage(sourceImage, editPrompt);
            onUpdateReport({ ...report, editedImageDataUrl: newImageDataUrl });
            setEditPrompt('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Gagal mengedit gambar.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSearch = async () => {
        if (!searchPrompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await performGroundedSearch(searchPrompt, report.location);
            const updatedGroundingResults = { ...report.groundingResults, [searchPrompt]: result };
            onUpdateReport({ ...report, groundingResults: updatedGroundingResults });
            setSearchPrompt('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Pencarian gagal.');
        } finally {
            setIsLoading(false);
        }
    };

    const tabButtonClasses = (tab: ActiveTab) => 
        `w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold border-b-2 transition-colors ${
            activeTab === tab 
            ? 'text-sky-400 border-sky-400' 
            : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
        }`;

    return (
        <div className="bg-slate-800 rounded-xl shadow-2xl sticky top-28">
            <div className="flex">
                <button onClick={() => setActiveTab('search')} className={tabButtonClasses('search')}>
                    <MagnifyingGlassIcon className="w-5 h-5" /> Tanya
                </button>
                <button onClick={() => setActiveTab('edit')} className={tabButtonClasses('edit')}>
                    <PencilIcon className="w-5 h-5" /> Edit Gambar
                </button>
            </div>
            
            <div className="p-6">
                {activeTab === 'edit' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Edit Gambar dengan AI</h3>
                        <p className="text-sm text-slate-400 mb-4">Jelaskan perubahan, contoh: "Tambahkan lingkaran merah di sekitar kabel yang terkelupas".</p>
                        <textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Perintah..."
                            rows={3}
                            className="w-full bg-slate-900/50 rounded-md p-2 border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                        />
                        <button onClick={handleEditImage} disabled={isLoading || !editPrompt} className="w-full mt-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                             {isLoading ? 'Mengedit...' : <><SparklesIcon className="w-5 h-5" /> Hasilkan Edit</>}
                        </button>
                    </div>
                )}
                {activeTab === 'search' && (
                    <div>
                         <textarea
                            value={searchPrompt}
                            onChange={(e) => setSearchPrompt(e.target.value)}
                            placeholder="Tanya apapun terkait konteks gambar ini..."
                            rows={4}
                            className="w-full bg-slate-900/50 rounded-md p-2 border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                        />
                        <button onClick={handleSearch} disabled={isLoading || !searchPrompt} className="w-full mt-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                            {isLoading ? 'Mencari...' : <><MagnifyingGlassIcon className="w-5 h-5" /> Tanya AI</>}
                        </button>
                    </div>
                )}
                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

                {report.groundingResults && Object.keys(report.groundingResults).length > 0 && (
                     <div className="mt-6 pt-6 border-t border-slate-700 space-y-4 max-h-96 overflow-y-auto">
                        <h3 className="font-semibold text-slate-300">Riwayat Pertanyaan</h3>
                        {Object.entries(report.groundingResults).reverse().map(([prompt, result]) => (
                            <div key={prompt} className="bg-slate-900/50 p-4 rounded-lg">
                                <p className="font-semibold text-slate-200 mb-2">T: {prompt}</p>
                                <GroundingResultDisplay result={result} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionPanel;
