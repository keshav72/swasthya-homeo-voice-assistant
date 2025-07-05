// File: api/gemini.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

// --- We copy the necessary types here because this function is isolated ---
enum Language {
  HINDI = 'hi-IN',
  ENGLISH = 'en-US',
}

enum View {
  HOME,
  DIAGNOSIS,
  MEDICINE_LOOKUP,
}

// --- This is the new, stricter system instruction logic ---
const getSystemInstruction = (mode: View, language: Language): string => {
    const langName = language === Language.HINDI ? "Hindi" : "English";
    const diagnosisFormat = `{ "medicines": [{ "name": "string", "symptoms": "string", "potency": "string", "dosage": "string" }] }`;
    const lookupFormat = `{ "medicineName": "string", "symptoms": ["string", "string"] }`;

    const baseInstruction = `You are an expert Homeopathy assistant for a doctor.
RULES:
1. Respond ONLY in ${langName}.
2. The user's query may be in a different language; your response MUST still be in ${langName}.
3. Your entire output MUST be a single, valid JSON object.
4. The JSON must NOT be inside markdown fences (\`\`\`).
5. Do NOT include any comments, explanations, or introductory text.
6. Ensure all string values inside the JSON are properly escaped (e.g., use \\" for quotes within strings).
7. Do NOT use trailing commas.
8. The response must start with { and end with }.`;

    if (mode === View.DIAGNOSIS) {
        return `${baseInstruction}

TASK:
The user will provide symptoms. Identify the 3-5 most relevant homeopathic medicines. For each medicine, provide its name, key matching symptoms, and suggested potency/dosage. If potency or dosage isn't applicable, you can omit the fields from the object.

JSON FORMAT:
${diagnosisFormat}`;
    } else { // MEDICINE_LOOKUP
        return `${baseInstruction}

TASK:
The user will provide a medicine name. List its top 5-7 key symptoms it is used for.

JSON FORMAT:
${lookupFormat}`;
    }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- This is the main function that Vercel will run ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userInput, mode, language } = req.body;

    if (!userInput || mode === undefined || !language) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

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
            return res.status(200).json(parsedData); // Success

        } catch (e: any) {
            console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, e);
            const isRateLimitError = e?.error?.code === 429 || (typeof e?.message === 'string' && (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED')));

            if (isRateLimitError && attempt < maxRetries - 1) {
                await sleep(delay);
                delay *= 2;
                attempt++;
            } else {
                 return res.status(500).json({ error: e.message || "Failed to get a response from the AI." });
            }
        }
    }
    
    return res.status(500).json({ error: "Failed to get a response from the AI after multiple retries." });
}
