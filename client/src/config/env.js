// Environment Configuration Service
// This file provides access to environment variables and API configuration

class EnvConfig {
  // PlantNet API Configuration
  static get PLANTNET_API_KEY() {
    return import.meta.env.VITE_PLANTNET_API_KEY;
  }

  static get PLANTNET_API_URL() {
    return import.meta.env.VITE_PLANTNET_API_URL || 'https://my-api.plantnet.org/v2';
  }

  // Translation Services
  static get GOOGLE_TRANSLATE_API_KEY() {
    return import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
  }

  static get LIBRETRANSLATE_API_URL() {
    return import.meta.env.VITE_LIBRETRANSLATE_API_URL || 'https://libretranslate.com/translate';
  }

  // Backend API Configuration
  static get API_BASE_URL() {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  static get API_TIMEOUT() {
    return parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;
  }

  // Application Settings
  static get APP_NAME() {
    return import.meta.env.VITE_APP_NAME || 'TreeTagAI';
  }

  static get APP_VERSION() {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  static get ENVIRONMENT() {
    return import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';
  }

  // Feature Flags
  static get ENABLE_CAMERA() {
    return import.meta.env.VITE_ENABLE_CAMERA !== 'false';
  }

  static get ENABLE_TRANSLATION() {
    return import.meta.env.VITE_ENABLE_TRANSLATION !== 'false';
  }

  static get ENABLE_PDF_GENERATION() {
    return import.meta.env.VITE_ENABLE_PDF_GENERATION !== 'false';
  }

  static get ENABLE_ANALYTICS() {
    return import.meta.env.VITE_ENABLE_ANALYTICS !== 'false';
  }

  // Upload Settings
  static get MAX_FILE_SIZE() {
    return parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760; // 10MB default
  }

  static get ALLOWED_FILE_TYPES() {
    return import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'];
  }

  // Utility Methods
  static isDevelopment() {
    return this.ENVIRONMENT === 'development';
  }

  static isProduction() {
    return this.ENVIRONMENT === 'production';
  }

  static validateApiKeys() {
    const missing = [];
    
    if (!this.PLANTNET_API_KEY) {
      missing.push('VITE_PLANTNET_API_KEY');
    }
    
    if (this.ENABLE_TRANSLATION && !this.GOOGLE_TRANSLATE_API_KEY) {
      console.warn('Google Translate API key not found. Translation features may be limited.');
    }

    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing);
      return false;
    }
    
    return true;
  }

  static getConfig() {
    return {
      plantNet: {
        apiKey: this.PLANTNET_API_KEY,
        apiUrl: this.PLANTNET_API_URL
      },
      translation: {
        googleApiKey: this.GOOGLE_TRANSLATE_API_KEY,
        libreTranslateUrl: this.LIBRETRANSLATE_API_URL
      },
      api: {
        baseUrl: this.API_BASE_URL,
        timeout: this.API_TIMEOUT
      },
      app: {
        name: this.APP_NAME,
        version: this.APP_VERSION,
        environment: this.ENVIRONMENT
      },
      features: {
        camera: this.ENABLE_CAMERA,
        translation: this.ENABLE_TRANSLATION,
        pdfGeneration: this.ENABLE_PDF_GENERATION,
        analytics: this.ENABLE_ANALYTICS
      },
      upload: {
        maxFileSize: this.MAX_FILE_SIZE,
        allowedTypes: this.ALLOWED_FILE_TYPES
      }
    };
  }
}

export default EnvConfig;