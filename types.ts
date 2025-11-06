// FIX: Removed self-import of 'Location' to resolve declaration conflict.

// FIX: Create types file to resolve 'is not a module' errors.
export interface Location {
  latitude: number;
  longitude: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface GroundingResult {
  text: string;
  chunks: GroundingChunk[];
}

// NEW: Updated risk scoring system to 1-5 scale and 5 new risk levels.
export interface RiskAssessment {
  probability: number;
  severity: number;
  riskScore: number;
  riskLevel: 'Sangat Rendah' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi/Kritis';
}

export interface Hazard {
  activityDetail: string;
  potentialHazard: string;
  consequence: string;
  initialRisk: RiskAssessment;
  riskControl: string;
  residualRisk: RiskAssessment;
}

// NEW: Represents a single task with its description and optional image.
export interface TaskItem {
  id: string;
  description: string;
  imageDataUrl: string | null;
}

export interface InspectionReport {
  id: string;
  date: string;
  tasks: TaskItem[]; // NEW: Array of tasks for the report.
  analysis: {
    hazards: Hazard[];
  } | null;
  location: Location | null;
  groundingResults?: {
    [prompt: string]: GroundingResult;
  };
  // FIX: Add optional property to store edited image data URL, resolving type errors in ActionPanel.
  editedImageDataUrl?: string;
}
