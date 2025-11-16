import { Translate } from '@google-cloud/translate/build/src/v2';
import mongoose from 'mongoose';

// Translation Schema for caching
const translationSchema = new mongoose.Schema({
    sourceText: { type: String, required: true },
    sourceLang: { type: String, required: true },
    targetLang: { type: String, required: true },
    translatedText: { type: String, required: true },
    context: { type: String, enum: ['plant_name', 'plant_description', 'general'], default: 'general' },
    verified: { type: Boolean, default: false },
    commonlyUsed: { type: Boolean, default: false },
    lastUsed: { type: Date, default: Date.now },
    useCount: { type: Number, default: 1 }
}, { timestamps: true });

// Create compound index for efficient lookups
translationSchema.index({ 
    sourceText: 1, 
    sourceLang: 1, 
    targetLang: 1, 
    context: 1 
});

export const Translation = mongoose.model('Translation', translationSchema);

export class TranslationService {
    constructor() {
        this.translator = new Translate({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS
        });
    }

    async translatePlantInfo(plantInfo, targetLang) {
        const translations = {
            scientificName: plantInfo.scientificName, // Keep scientific name as is
            commonNames: [],
            family: plantInfo.family, // Keep family name as is
            description: '',
            careTips: []
        };

        // Translate common names
        for (const name of plantInfo.commonNames) {
            const translatedName = await this.getTranslation(name, 'en', targetLang, 'plant_name');
            translations.commonNames.push(translatedName);
        }

        // Translate description if available
        if (plantInfo.description) {
            translations.description = await this.getTranslation(
                plantInfo.description,
                'en',
                targetLang,
                'plant_description'
            );
        }

        // Translate care tips if available
        if (plantInfo.careTips && plantInfo.careTips.length > 0) {
            for (const tip of plantInfo.careTips) {
                const translatedTip = await this.getTranslation(tip, 'en', targetLang, 'general');
                translations.careTips.push(translatedTip);
            }
        }

        return translations;
    }

    async getTranslation(text, sourceLang, targetLang, context = 'general') {
        try {
            // Check cache first
            const cachedTranslation = await Translation.findOne({
                sourceText: text,
                sourceLang,
                targetLang,
                context
            });

            if (cachedTranslation) {
                // Update usage statistics
                await Translation.updateOne(
                    { _id: cachedTranslation._id },
                    { 
                        $inc: { useCount: 1 },
                        $set: { lastUsed: new Date() }
                    }
                );
                return cachedTranslation.translatedText;
            }

            // If not in cache, use Google Translate
            const [translation] = await this.translator.translate(text, {
                from: sourceLang,
                to: targetLang
            });

            // Cache the translation
            await Translation.create({
                sourceText: text,
                sourceLang,
                targetLang,
                translatedText: translation,
                context
            });

            return translation;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text on error
        }
    }

    async getVerifiedTranslations(sourceLang, targetLang, context) {
        return await Translation.find({
            sourceLang,
            targetLang,
            context,
            verified: true
        }).sort('-useCount');
    }

    async addVerifiedTranslation(sourceText, translatedText, sourceLang, targetLang, context) {
        return await Translation.findOneAndUpdate(
            {
                sourceText,
                sourceLang,
                targetLang,
                context
            },
            {
                translatedText,
                verified: true,
                commonlyUsed: true
            },
            { upsert: true, new: true }
        );
    }
}