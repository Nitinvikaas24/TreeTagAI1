import { GoogleGenerativeAI } from '@google/genai';
import { SUPPORTED_LANGUAGES } from '../config/languages.js';

export class TranslationService {
	constructor() {
		const apiKey = process.env.GEMMA_API_KEY;
		if (!apiKey) throw new Error('GEMMA_API_KEY is not set.');
		this.model = new GoogleGenerativeAI({ apiKey }).getGenerativeModel({ model: 'gemini-2.5-flash' });
	}

	async translatePlantInfo(plantInfo, targetLang) {
		if (!plantInfo) throw new Error('plantInfo is required.');
		if (!targetLang) throw new Error('targetLang is required.');
		if (targetLang === 'en') return plantInfo;

		const languageEntry = SUPPORTED_LANGUAGES.find(({ code }) => code === targetLang);
		if (!languageEntry) throw new Error(`Unsupported language code: ${targetLang}`);

		const prompt = [
			`Translate the following JSON object into ${languageEntry.name}.`,
			'Keep the JSON keys exactly the same and translate only the values.',
			'Return valid JSON only without any commentary.',
		].join(' ');

		const result = await this.model.generateContent({
			contents: [
				{
					role: 'user',
					parts: [{ text: `${prompt}\n\n${JSON.stringify(plantInfo, null, 2)}` }],
				},
			],
		});

		const raw = result.response?.text?.() ?? result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
		if (!raw) throw new Error('No translation received from the model.');

		try {
			return JSON.parse(raw);
		} catch (error) {
			throw new Error('Model response was not valid JSON.');
		}
	}

	async getVerifiedTranslations() {}

	async addVerifiedTranslation() {}
}