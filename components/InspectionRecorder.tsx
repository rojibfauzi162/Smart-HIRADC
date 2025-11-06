// FIX: Create InspectionRecorder component to allow users to start a new hazard identification and resolve module not found error.
import React, { useState, useRef, useEffect } from 'react';
import { InspectionReport, Location, TaskItem } from '../types';
import { analyzeImageForHazards } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { CameraIcon, SparklesIcon, MapPinIcon } from './icons/Icons';

interface InspectionRecorderProps {
  onSave: (report: InspectionReport) => void;
  onCancel: () => void;
}

const InspectionRecorder: React.FC<InspectionRecorderProps> = ({ onSave, onCancel }) => {
  const [taskCount, setTaskCount] = useState(1);
  const [tasks, setTasks] = useState<TaskItem[]>([{ id: uuidv4(), description: '', imageDataUrl: null }]);
  const [location, setLocation] = useState<Location | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fileInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => {
        console.error("Error getting location:", err);
        setLocationError("Gagal mendapatkan lokasi. Analisis mungkin kurang akurat untuk pencarian berbasis lokasi.");
      }
    );
  }, []);

  useEffect(() => {
    setTasks(currentTasks => {
      const newTasks = [...currentTasks];
      if (taskCount > newTasks.length) {
        const itemsToAdd = taskCount - newTasks.length;
        for (let i = 0; i < itemsToAdd; i++) {
            newTasks.push({ id: uuidv4(), description: '', imageDataUrl: null });
        }
      } else if (taskCount < newTasks.length) {
        newTasks.length = taskCount;
      }
      return newTasks;
    });
  }, [taskCount]);

  const handleTaskCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let count = parseInt(e.target.value, 10);
    if (isNaN(count) || count < 1) {
      count = 1;
    }
    if (count > 10) {
      count = 10;
    }
    setTaskCount(count);
  };
  
  const handleDescriptionChange = (id: string, value: string) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === id ? { ...task, description: value } : task
      )
    );
  };

  const handleImageChange = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTasks(currentTasks =>
          currentTasks.map(task =>
            task.id === id ? { ...task, imageDataUrl: e.target?.result as string } : task
          )
        );
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };
  
  const triggerFileInput = (id: string) => {
    fileInputRefs.current.get(id)?.click();
  };


  const handleAnalyze = async () => {
    const validTasks = tasks.filter(t => t.description.trim() !== '');
    if (validTasks.length === 0) {
      setError('Harap masukkan setidaknya satu deskripsi tugas.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysisPromises = validTasks.map(task => 
        analyzeImageForHazards(task.imageDataUrl, task.description)
      );
      
      const analysisResults = await Promise.all(analysisPromises);
      const allHazards = analysisResults.flatMap(result => result.hazards);
      
      const newReport: InspectionReport = {
        id: uuidv4(),
        date: new Date().toISOString(),
        tasks: validTasks,
        analysis: { hazards: allHazards },
        location: location,
      };

      onSave(newReport);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan tidak dikenal.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  
  const areTasksEmpty = tasks.every(t => t.description.trim() === '');

  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-white">Mulai Identifikasi Bahaya Baru</h2>
      
      <div className="space-y-6">
        <div>
           <label htmlFor="task-count" className="block text-sm font-medium text-slate-300 mb-2">Jumlah Tugas / Alat / Bahan</label>
           <input
                id="task-count"
                type="number"
                value={taskCount}
                onChange={handleTaskCountChange}
                min="1"
                max="10"
                className="block w-24 bg-slate-900/50 rounded-md p-2 border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
            />
        </div>
        
        <div className="space-y-8">
            {tasks.map((task, index) => (
                <div key={task.id} className="bg-slate-900/30 p-4 rounded-lg border border-slate-700">
                    <h3 className="font-semibold text-lg text-sky-400 mb-4">Tugas #{index + 1}</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor={`task-desc-${task.id}`} className="block text-sm font-medium text-slate-300 mb-1">1. Deskripsikan Tugas / Alat / Bahan</label>
                            <textarea
                                id={`task-desc-${task.id}`}
                                rows={2}
                                value={task.description}
                                onChange={(e) => handleDescriptionChange(task.id, e.target.value)}
                                placeholder={`Contoh: 'Pemasangan kabel listrik di langit-langit'`}
                                className="block w-full bg-slate-900/50 rounded-md p-3 border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">2. Unggah Foto Area Kerja (Opsional)</label>
                            <div 
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md cursor-pointer hover:border-sky-500 transition-colors"
                                onClick={() => triggerFileInput(task.id)}
                            >
                                {task.imageDataUrl ? (
                                <img src={task.imageDataUrl} alt={`Preview for task ${index + 1}`} className="max-h-60 rounded-lg object-contain" />
                                ) : (
                                <div className="space-y-1 text-center py-6">
                                    <CameraIcon className="mx-auto h-12 w-12 text-slate-400" />
                                    <div className="flex text-sm text-slate-400">
                                    <p className="pl-1">Klik untuk mengunggah gambar</p>
                                    </div>
                                    <p className="text-xs text-slate-500">PNG, JPG, GIF hingga 10MB</p>
                                </div>
                                )}
                                <input 
                                    // FIX: Use a block body for the ref callback to ensure a void return type, resolving the assignment error.
                                    ref={el => { fileInputRefs.current.set(task.id, el); }}
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleImageChange(task.id, e)}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {location && (
          <div className="text-sm text-slate-400 flex items-center justify-center gap-2 bg-slate-700/50 p-3 rounded-md">
            <MapPinIcon className="w-4 h-4 text-sky-400" />
            <span>Lokasi terdeteksi: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
          </div>
        )}
        {locationError && <p className="text-yellow-400 text-center text-sm">{locationError}</p>}
        {error && <p className="text-red-400 text-center text-sm">{error}</p>}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={onCancel}
          className="w-full sm:w-auto flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleAnalyze}
          disabled={areTasksEmpty || isAnalyzing}
          className="w-full sm:w-auto flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menganalisis...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Analisis dengan Gemini
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InspectionRecorder;
