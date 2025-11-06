// FIX: Implemented geminiService to resolve module not found errors and provide AI functionality.
import { GoogleGenAI, Type } from "@google/genai";
import { Location, GroundingResult, Hazard } from '../types';

// Initialize the Google AI client
// The API key is sourced from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a data URL string to a GenerativePart object for the Gemini API.
 * @param dataUrl The data URL of the image (e.g., "data:image/jpeg;base64,...").
 * @returns A GenerativePart object.
 */
const fileToGenerativePart = (dataUrl: string) => {
    const parts = dataUrl.split(';base64,');
    if (parts.length !== 2) {
        throw new Error('Invalid data URL format');
    }
    const mimeType = parts[0].split(':')[1];
    const data = parts[1];
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};

/**
 * Analyzes an image and/or text for workplace safety hazards using Gemini.
 * @param imageDataUrl The data URL of the image to analyze (optional).
 * @param task A description of the task being performed.
 * @returns A promise that resolves to an object containing an array of identified hazards.
 */
export const analyzeImageForHazards = async (imageDataUrl: string | null, task: string): Promise<{ hazards: Hazard[] }> => {
    // Using gemini-2.5-pro for its advanced reasoning capabilities for this complex analysis task.
    const model = 'gemini-2.5-pro';
    
    // FIX: Updated prompt to only include relevant risk controls.
    const prompt = `
Analyze the provided task description for potential workplace safety hazards (K3 - Keselamatan dan Kesehatan Kerja) in Indonesia. An image of the work area may also be provided for additional context.
Task Description: "${task}"

Your task is to identify all potential hazards and perform a risk assessment for each.
Present the result in a structured JSON format. The root object must have a single key "hazards", which is an array of hazard objects.

For each identified hazard, provide the following information in a hazard object:
1.  "activityDetail": A brief description of the specific activity or condition that relates to the hazard. If an image is provided, reference it.
2.  "potentialHazard": A clear and concise description of the potential hazard itself (e.g., "Tersandung kabel listrik", "Terkena percikan api gerinda").
3.  "consequence": The potential consequence if the hazard is realized (e.g., "Cedera ringan hingga berat, memar, patah tulang", "Luka bakar pada mata atau kulit").
4.  "initialRisk": An object representing the risk assessment *before* any controls are applied.
5.  "riskControl": A detailed description of recommended control measures. Follow the hierarchy of controls (Elimination, Substitution, Engineering Controls, Administrative Controls, PPE). **Only include the control levels that are relevant and applicable to the hazard.** If a level is not applicable, omit it entirely from the response. Structure the output as a multi-line string with each applicable control level on a new line, like: "REKAYASA: [description]\\nADMINISTRASI: [description]".
6.  "residualRisk": An object representing the risk assessment *after* the recommended controls are applied.

For both "initialRisk" and "residualRisk" objects, provide:
- "probability": A numerical score from 1 (very unlikely) to 5 (very likely).
- "severity": A numerical score from 1 (insignificant injury) to 5 (fatality).
- "riskScore": Calculated as probability * severity.
- "riskLevel": The risk level based on the risk score, which must be one of: 'Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi/Kritis'.
    - Sangat Rendah (1-4)
    - Rendah (5-9)
    - Sedang (10-15)
    - Tinggi (16-20)
    - Sangat Tinggi/Kritis (21-25)

Ensure your entire response is ONLY the JSON object, starting with { and ending with }. Do not include any introductory text, markdown formatting, or explanations outside the JSON structure. If no hazards are found, return an empty hazards array: {"hazards": []}.
`;

    const riskAssessmentSchema = {
        type: Type.OBJECT,
        properties: {
            probability: { type: Type.NUMBER, description: "Skor probabilitas dari 1-5" },
            severity: { type: Type.NUMBER, description: "Skor keparahan dari 1-5" },
            riskScore: { type: Type.NUMBER, description: "Skor risiko (probabilitas * keparahan)" },
            riskLevel: {
                type: Type.STRING,
                enum: ['Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi/Kritis'],
            },
        },
        required: ['probability', 'severity', 'riskScore', 'riskLevel'],
    };

    const hazardSchema = {
        type: Type.OBJECT,
        properties: {
            activityDetail: { type: Type.STRING },
            potentialHazard: { type: Type.STRING },
            consequence: { type: Type.STRING },
            initialRisk: riskAssessmentSchema,
            riskControl: { type: Type.STRING },
            residualRisk: riskAssessmentSchema,
        },
        required: ['activityDetail', 'potentialHazard', 'consequence', 'initialRisk', 'riskControl', 'residualRisk'],
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            hazards: {
                type: Type.ARRAY,
                items: hazardSchema,
            },
        },
        required: ['hazards'],
    };
    
    const contentParts: any[] = [{ text: prompt }];
    if (imageDataUrl) {
        const imagePart = fileToGenerativePart(imageDataUrl);
        contentParts.push(imagePart);
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2, // Lower temperature for more deterministic, structured output
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the API.");
        }
        return JSON.parse(text);

    } catch (error) {
        console.error("Error analyzing image for hazards:", error);
        throw new Error("Gagal menganalisis data dengan Gemini. Periksa kunci API dan koneksi jaringan Anda.");
    }
};

/**
 * Edits an image based on a textual prompt using Gemini.
 * @param imageDataUrl The data URL of the source image.
 * @param prompt The textual prompt describing the desired edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const editImage = async (imageDataUrl: string, prompt: string): Promise<string> => {
    // Using gemini-2.5-flash-image for image editing tasks as per guidelines.
    const model = 'gemini-2.5-flash-image';
    const imagePart = fileToGenerativePart(imageDataUrl);
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: ['IMAGE'],
            },
        });

        const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (imagePartResponse?.inlineData) {
            const { data, mimeType } = imagePartResponse.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
        
        throw new Error("Model tidak menghasilkan gambar. Coba prompt yang berbeda.");

    } catch (error) {
        console.error("Error editing image:", error);
        if (error instanceof Error && error.message.includes("Model tidak menghasilkan gambar")) {
            throw error;
        }
        throw new Error("Gagal mengedit gambar dengan Gemini. Coba prompt yang berbeda.");
    }
};

/**
 * Performs a grounded search using Google Search and optionally Google Maps.
 * @param prompt The search query.
 * @param location The user's current location, used for location-based queries.
 * @returns A promise that resolves to a GroundingResult object.
 */
export const performGroundedSearch = async (prompt: string, location: Location | null): Promise<GroundingResult> => {
    // Check for location-based keywords to determine if Google Maps should be used.
    const useMaps = /nearby|terdekat|lokasi|di sekitar|di dekat/i.test(prompt) || (location && /rumah sakit|hospital|clinic|klinik/i.test(prompt));
    
    // Always include Google Search; add Google Maps if relevant.
    const tools: any[] = [{ googleSearch: {} }];
    if (useMaps) {
        tools.push({ googleMaps: {} });
    }
    
    const config: any = {
        tools: tools,
    };

    // Provide user's location to the model if available and relevant.
    if (useMaps && location) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
            }
        };
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });

        const text = response.text;
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return { text, chunks };

    } catch (error) {
        console.error("Error with grounded search:", error);
        throw new Error("Gagal melakukan pencarian dengan Gemini.");
    }
};