import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { TranslationService } from '../services/translationService.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../config/languages.js';

const router = express.Router();
const translationService = new TranslationService();

/**
 * @swagger
 * /api/translations/plant:
 *   post:
 *     summary: Translate plant information to a target language
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plantInfo:
 *                 type: object
 *               targetLang:
 *                 type: string
 *     responses:
 *       200:
 *         description: Translated plant information
 */
router.post('/plant', authenticate, async (req, res, next) => {
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
 *   get:
 *     summary: Get list of supported languages
 *     tags: [Translations]
 *     responses:
 *       200:
 *         description: List of supported languages
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
 *   get:
 *     summary: Get verified translations for a specific context
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sourceLang
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetLang
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: context
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of verified translations
 */
router.get('/verified', authenticate, async (req, res, next) => {
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
 *   post:
 *     summary: Add or update a verified translation
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceText:
 *                 type: string
 *               translatedText:
 *                 type: string
 *               sourceLang:
 *                 type: string
 *               targetLang:
 *                 type: string
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Translation verified successfully
 */
router.post('/verify', authenticate, async (req, res, next) => {
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