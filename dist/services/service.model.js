"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt = require("bcryptjs");
const ServiceSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    requireTime: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
ServiceSchema.statics.build = (attr) => {
    return new Service(attr);
};
const Service = mongoose_1.default.model('Service', ServiceSchema);
exports.Service = Service;
