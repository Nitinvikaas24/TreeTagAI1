import { GoogleGenAI } from "@google/genai";
import { SUPPORTED_LANGUAGES } from '../config/languages.js';

export class TranslationService {
    constructor() {
        // Initialize Gemini with your existing key
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMMA_API_KEY });
    }

    /**
     * Translates a plant info object into the target language using AI.
     * @param {Object} plantInfo - The object containing description, benefits, etc.
     * @param {string} targetLang - The target language code (e.g., 'ta', 'hi')
     */
    async translatePlantInfo(plantInfo, targetLang) {
        try {
            // 1. Check if translation is needed
            if (targetLang === 'en' || !plantInfo) {
                return plantInfo;
            }

            // Get the language name (e.g., "Tamil")
            const targetLangName = SUPPORTED_LANGUAGES[targetLang]?.name || targetLang;

            // 2. Construct the prompt for Gemini
            const prompt = `
            You are a professional agricultural translator.
            Translate the values of the following JSON object into ${targetLangName}.
            
            Rules:
            1. Keep the JSON keys exactly the same (e.g., "description", "benefits").
            2. Translate the *values* to be natural for farmers in ${targetLangName}.
            3. Keep scientific names (e.g., "Mangifera indica") in English/Latin.
            4. Respond with ONLY the valid JSON object. Do not add markdown like \`\`\`json.

            Input JSON:
            ${JSON.stringify(plantInfo)}
            `;

            // 3. Call AI
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            // 4. Clean and Parse Response
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const translatedData = JSON.parse(cleanText);

            return translatedData;

        } catch (error) {
            console.error("AI Translation Error:", error);
            // Fallback: Return original English info if translation fails
            return plantInfo;
        }
    }

    // These methods are kept to prevent errors in routes that might call them
    async getVerifiedTranslations(sourceLang, targetLang, context) { return []; }
    async addVerifiedTranslation(sourceText, translatedText, sourceLang, targetLang, context) { return {}; }
}