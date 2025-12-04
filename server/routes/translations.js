import express from 'express';
// FIX: Changed 'authenticate' to 'protect'
import { protect } from '../middleware/auth.js'; 
import { TranslationService } from '../services/translationService.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../config/languages.js';

const router = express.Router();
const translationService = new TranslationService();

router.post('/plant', protect, async (req, res, next) => {
    try {
        const { plantInfo, targetLang } = req.body;
        if (!plantInfo || !targetLang) return res.status(400).json({ success: false, message: 'Missing data' });

        const translations = await translationService.translatePlantInfo(plantInfo, targetLang);
        res.json({ success: true, translations });
    } catch (error) { next(error); }
});

router.get('/languages', protect, (req, res) => {
    res.json({ success: true, languages: SUPPORTED_LANGUAGES, default: DEFAULT_LANGUAGE });
});

export default router;