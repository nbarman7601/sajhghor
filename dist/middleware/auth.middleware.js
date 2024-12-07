"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_production_1 = require("../config/config.production");
const authenticateUser = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No Bearer token provided.' });
    }
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    try {
        // req as any;
        // Verify the token
        const secretKey = process.env.APP_SECRET_KEY || config_production_1.environment.APP_SECRET_KEY;
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        // If needed, you can attach the decoded userId to the request object
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
};
exports.authenticateUser = authenticateUser;
