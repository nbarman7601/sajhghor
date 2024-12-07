"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LHeadDeposit = exports.Lhead = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LHeadSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'active'
    },
    address: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
const Lhead = mongoose_1.default.model('lheads', LHeadSchema);
exports.Lhead = Lhead;
const depositSchema = new mongoose_1.default.Schema({
    headId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Lhead",
        default: null
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    deposit_on: {
        type: Date,
        default: new Date()
    }
}, { timestamps: true });
const LHeadDeposit = mongoose_1.default.model('deposits', depositSchema);
exports.LHeadDeposit = LHeadDeposit;
