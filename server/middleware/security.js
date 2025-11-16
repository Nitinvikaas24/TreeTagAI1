import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from '../config/config.js';

// Base security middleware configuration
export const configureSecurityMiddleware = (app) => {
    // Basic security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'"],
                scriptSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: "same-site" },
        dnsPrefetchControl: true,
        frameguard: { action: "deny" },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        ieNoOpen: true,
        noSniff: true,
        originAgentCluster: true,
        permittedCrossDomainPolicies: false,
        referrerPolicy: { policy: "same-origin" },
        xssFilter: true
    }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.ip === '127.0.0.1' // Skip rate limiting for local development
    });

    // Apply rate limiting to all routes
    app.use('/api/', limiter);

    // Prevent clickjacking
    app.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        next();
    });

    // Add security timestamps
    app.use((req, res, next) => {
        req.timestamp = Date.now();
        res.setHeader('X-Request-Id', generateRequestId());
        next();
    });

    // Validate content types
    app.use((req, res, next) => {
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            if (!req.is('application/json') && !req.is('multipart/form-data')) {
                return res.status(415).json({
                    error: 'Unsupported Media Type. Use application/json or multipart/form-data'
                });
            }
        }
        next();
    });
};

// Generate unique request ID
const generateRequestId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};