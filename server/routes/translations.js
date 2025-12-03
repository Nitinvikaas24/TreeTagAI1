import express from 'express';
// --- FIX: Import 'protect' instead of 'authenticate' ---
import { protect } from '../middleware/auth.js'; 
import { TranslationService } from '../services/translationService.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../config/languages.js';

const router = express.Router();
const translationService = new TranslationService();

/**
 * @swagger
 * /api/translations/plant:
 * post:
 * summary: Translate plant information to a target language
 */
// --- FIX: Use 'protect' here ---
router.post('/plant', protect, async (req, res, next) => {
    try {
        const { plantInfo, targetLang } = req.body;

        if (!plantInfo || !targetLang) {
            return res.status(400).json({
                success: false,
                message: 'Plant info and target language are required'
            });
        }

        if (!SUPPORTED_LANGUAGES[targetLang]) {
            return res.status(400).json({
                success: false,
                message: 'Unsupported target language'
            });
        }

        const translations = await translationService.translatePlantInfo(
            plantInfo,
            targetLang
        );

        res.json({
            success: true,
            translations
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/translations/languages:
 * get:
 * summary: Get list of supported languages
 */
router.get('/languages', (req, res) => {
    res.json({
        success: true,
        languages: SUPPORTED_LANGUAGES,
        default: DEFAULT_LANGUAGE
    });
});

/**
 * @swagger
 * /api/translations/verified:
 * get:
 * summary: Get verified translations for a specific context
 */
// --- FIX: Use 'protect' here ---
router.get('/verified', protect, async (req, res, next) => {
    try {
        const { sourceLang, targetLang, context } = req.query;
        
        if (!sourceLang || !targetLang || !context) {
            return res.status(400).json({
                success: false,
                message: 'Source language, target language, and context are required'
            });
        }

        const translations = await translationService.getVerifiedTranslations(
            sourceLang,
            targetLang,
            context
        );

        res.json({
            success: true,
            translations
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/translations/verify:
 * post:
 * summary: Add or update a verified translation
 */
// --- FIX: Use 'protect' here ---
router.post('/verify', protect, async (req, res, next) => {
    try {
        const { sourceText, translatedText, sourceLang, targetLang, context } = req.body;

        const translation = await translationService.addVerifiedTranslation(
            sourceText,
            translatedText,
            sourceLang,
            targetLang,
            context
        );

        res.json({
            success: true,
            translation
        });
    } catch (error) {
        next(error);
    }
});

export default router;