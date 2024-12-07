"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const expert_model_1 = require("../expert/expert.model");
const orderSchema = new mongoose_1.default.Schema({
    salonID: {
        required: true,
        type: String
    },
    userId: {
        type: String,
        required: true
    },
    seatNo: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    expert: expert_model_1.Expert
}, {
    timestamps: true
});
orderSchema.statics.build = (attr) => {
    return new Order(attr);
};
const Order = mongoose_1.default.model('Order', orderSchema);
exports.Order = Order;
