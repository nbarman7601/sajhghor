"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vendor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt = require("bcryptjs");
const vendorSchema = new mongoose_1.default.Schema({
    shopName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: String,
    },
    ownerName: {
        type: String,
        required: true
    },
    password: {
        required: true,
        type: String
    },
    cardType: {
        required: true,
        type: String
    },
    identityNo: {
        required: true,
        type: String
    },
    address: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Address'
    },
    services: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Service'
        }
    ],
    experts: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Expert'
        }
    ],
    noOfSeats: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
vendorSchema.statics.build = (attr) => {
    return new Vendor(attr);
};
vendorSchema.pre("save", function (next) {
    const user = this;
    if (this.isModified("password") || this.isNew) {
        bcrypt.genSalt(10, function (saltError, salt) {
            if (saltError) {
                return next(saltError);
            }
            else {
                bcrypt.hash(user.password, salt, function (hashError, hash) {
                    if (hashError) {
                        return next(hashError);
                    }
                    user.password = hash;
                    next();
                });
            }
        });
    }
    else {
        return next();
    }
});
vendorSchema.methods.comparePassword = function (password, callback) {
    bcrypt.compare(password, this.password, function (error, isMatch) {
        if (error) {
            return callback(error);
        }
        else {
            callback(null, isMatch);
        }
    });
};
const Vendor = mongoose_1.default.model('Vendor', vendorSchema);
exports.Vendor = Vendor;
