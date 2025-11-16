import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

export const translateText = async (text, sourceLang = 'en', targetLang) => {
  try {
    if (!text || !targetLang || sourceLang === targetLang) {
      return text;
    }

    const [translation] = await translate.translate(text, {
      from: sourceLang,
      to: targetLang
    });

    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
};

export const translateBatch = async (texts, sourceLang = 'en', targetLang) => {
  try {
    if (!texts || !texts.length || !targetLang || sourceLang === targetLang) {
      return texts;
    }

    const [translations] = await translate.translate(texts, {
      from: sourceLang,
      to: targetLang
    });

    return Array.isArray(translations) ? translations : [translations];
  } catch (error) {
    console.error('Batch translation error:', error);
    // Return original texts if translation fails
    return texts;
  }
};