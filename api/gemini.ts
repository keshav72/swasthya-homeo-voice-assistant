// api/gemini.ts

// This is a Vercel Serverless Function, which runs on the server.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

// --- We copy the necessary types and helpers here ---
enum Language {
  HINDI = 'hi-IN',
  ENGLISH = 'en-US',
}

enum View {
  HOME,
  DIAGNOSIS,
  MEDICINE_LOOKUP,
}

interface QueryResult {
  medicines?: { name: string; symptoms: string; potency?: string; dosage?: string; }[];
  symptoms?: string[];
  medicineName?: string;
}

const getSystemInstruction = (mode: View, language: Language): string => {
    const langName = language === Language.HINDI ? "Hindi" : "English";
    const diagnosisFormat = `{ "medicines": [{ "name": "string", "symptoms": "string", "potency": "string", "dosage": "string" }] }`;
    const lookupFormat = `{ "medicineName": "string", "symptoms": ["string", "string"] }`;

    const baseInstruction = `You are an expert Homeopathy assistant. Respond ONLY in ${langName}. Your entire output MUST be a single, valid JSON object with no markdown fences.`;

    if (mode === View.DIAGNOSIS) {
        return `${baseInstruction} The user will provide symptoms. Identify relevant medicines. Use this exact JSON format: ${diagnosisFormat}`;
    } else { // MEDICINE_LOOKUP
        return `${baseInstruction} The user will provide a medicine name. List its key symptoms. Use this exact JSON format: ${lookupFormat}`;
    }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- This is the main function handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userInput, mode, language } = req.body;

    if (!userInput || mode === undefined || !language) {
        return res.status(400).json({ error: 'Missing required parameters: userInput, mode, and language' });
    }
    
    // This code runs on the SERVER, so it can safely access process.env
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API_KEY environment variable not set on the server." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = getSystemInstruction(mode, language);
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: userInput,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                }
            });

            let jsonText = response.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonText.match(fenceRegex);
            if (match && match[2]) {
              jsonText = match[2].trim();
            }

            const parsedData = JSON.parse(jsonText);
            // Success! Send the data back to the browser.
            return res.status(200).json(parsedData);

        } catch (e: any) {
            console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, e);
            const isRateLimitError = e?.error?.code === 429 || (typeof e?.message === 'string' && (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED')));

            if (isRateLimitError && attempt < maxRetries - 1) {
                await sleep(delay);
                delay *= 2;
                attempt++;
            } else {
                console.error("Final error from Gemini API:", e);
                return res.status(500).json({ error: "Failed to get a response from the AI." });
            }
        }
    }
    
    return res.status(500).json({ error: "Failed to get a response from the AI after multiple retries." });
}
