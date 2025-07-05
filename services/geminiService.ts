import { GoogleGenAI } from "@google/genai";
import { View, Language, QueryResult } from '../types';

const getSystemInstruction = (mode: View, language: Language): string => {
    const langName = language === Language.HINDI ? "Hindi" : "English";
    const diagnosisFormat = `{ "medicines": [{ "name": "string", "symptoms": "string", "potency": "string", "dosage": "string" }] }`;
    const lookupFormat = `{ "medicineName": "string", "symptoms": ["string", "string"] }`;

    const baseInstruction = `You are an expert Homeopathy assistant named 'Swasthya Homeo Voice Assistant' for a doctor. Respond ONLY in ${langName}. Your entire output MUST be a single, valid JSON object with no markdown fences, comments, or extra text.`;

    if (mode === View.DIAGNOSIS) {
        return `${baseInstruction} The user will provide symptoms. Identify the 3-5 most relevant homeopathic medicines. For each medicine, provide its name, key matching symptoms, and suggested potency/dosage. If potency or dosage isn't applicable, you can omit the fields. Use this exact JSON format: ${diagnosisFormat}`;
    } else { // MEDICINE_LOOKUP
        return `${baseInstruction} The user will provide a medicine name. List its top 5-7 key symptoms it is used for. Use this exact JSON format: ${lookupFormat}`;
    }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getSuggestions = async (userInput: string, mode: View, language: Language): Promise<QueryResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = getSystemInstruction(mode, language);
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000; // Start with 1 second

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
            return parsedData as QueryResult; // Success, exit the loop

        } catch (e: any) {
            console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, e);
            
            const isRateLimitError = e?.error?.code === 429 || (typeof e?.message === 'string' && (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED')));

            if (isRateLimitError && attempt < maxRetries - 1) {
                console.log(`Rate limit exceeded. Retrying in ${delay / 1000}s...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff
                attempt++;
            } else {
                console.error("Final error fetching or parsing Gemini response:", e);
                const langError = language === Language.HINDI ? "एआई से प्रतिक्रिया प्राप्त करने में विफल। कृपया पुनः प्रयास करें।" : "Failed to get a response from the AI. Please try again.";
                throw new Error(langError);
            }
        }
    }

    const finalLangError = language === Language.HINDI ? "कई प्रयासों के बाद भी एआई से प्रतिक्रिया प्राप्त करने में विफल।" : "Failed to get a response from the AI after multiple retries.";
    throw new Error(finalLangError);
};