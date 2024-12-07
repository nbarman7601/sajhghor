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
exports.loanSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AutoIncrementFactory = require("mongoose-sequence");
const AutoIncrement = AutoIncrementFactory(mongoose_1.default);
exports.loanSchema = new mongoose_1.default.Schema({
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    downpayment: {
        type: Number,
        required: true
    },
    totalAmt: {
        type: Number,
        required: true
    },
    loanAmt: {
        type: Number,
        required: true
    },
    fcAmount: {
        type: Number,
        default: 0
    },
    precollection_amt: {
        type: Number,
        default: 0
    },
    extra: {
        type: Number,
        required: true
    },
    installment_duration: {
        type: String,
        required: true
    },
    installment_interval: {
        type: String,
        required: true
    },
    installment_amt: {
        type: Number,
        required: true
    },
    installment_start_date: {
        type: Date,
        required: true
    },
    noOfInstallment: {
        type: Number,
        required: true
    },
    status: {
        default: 'active',
        type: String
    },
    sanctioned_date: {
        default: new Date(),
        type: Date
    },
    product: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});
exports.loanSchema.virtual('loanItems', {
    ref: 'LoanItem',
    localField: '_id',
    foreignField: 'loan',
});
exports.loanSchema.virtual('installments', {
    ref: 'Installment',
    localField: '_id',
    foreignField: 'loanId',
});
const Loan = mongoose_1.default.model('Loan', exports.loanSchema);
exports.default = Loan;
