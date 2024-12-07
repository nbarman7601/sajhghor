"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const addressSchema = new mongoose_1.default.Schema({
    address1: {
        type: String
    },
    address2: {
        type: String
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    post_office: {
        type: String
    },
    police_station: {
        type: String
    },
    city: {
        required: true,
        type: String
    },
    state: {
        required: true,
        type: String
    },
    country: {
        required: true,
        type: String
    },
    zipCode: {
        required: true,
        type: String
    }
});
addressSchema.statics.build = (attr) => {
    return new Address(attr);
};
const Address = mongoose_1.default.model('Address', addressSchema);
exports.Address = Address;
