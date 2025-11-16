export const PLANTNET_CONFIG = {
    API_URL: 'https://my-api.plantnet.org/v2/identify/all',
    API_KEY: process.env.PLANTNET_API_KEY,
    DEFAULT_ORGANS: ['leaf', 'flower', 'fruit', 'bark'],
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png']
};