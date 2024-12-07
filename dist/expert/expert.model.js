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
exports.Expert = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt = require("bcryptjs");
const expertSchema = new mongoose_1.default.Schema({
    salonID: {
        required: true,
        type: String
    },
    firstName: {
        required: true,
        type: String
    },
    middleName: {
        type: String
    },
    lastName: {
        type: String
    },
    gender: {
        required: true,
        type: String
    },
    dateOfBirth: { type: Date, required: true },
    photoUrl: {
        type: String
    },
    phone: {
        required: true,
        unique: true,
        type: String
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Address"
    }
}, {
    timestamps: true
});
expertSchema.statics.build = (attr) => {
    return new Expert(attr);
};
expertSchema.pre("save", function (next) {
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
expertSchema.methods.comparePassword = function (password, callback) {
    bcrypt.compare(password, this.password, function (error, isMatch) {
        if (error) {
            return callback(error);
        }
        else {
            callback(null, isMatch);
        }
    });
};
const Expert = mongoose_1.default.model('expert', expertSchema);
exports.Expert = Expert;
