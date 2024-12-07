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
exports.excelDateToJSDate = exports.getEndOfMonth = exports.getStartOfMonth = exports.getEndOfWeek = exports.getStartOfWeek = exports.getEndOfToday = exports.getStartOfToday = exports.generateDateSet = void 0;
const moment = __importStar(require("moment-timezone"));
const TIMEZONE = 'Asia/Kolkata';
function getStartOfToday() {
    return moment.tz(TIMEZONE).startOf('day').toDate();
}
exports.getStartOfToday = getStartOfToday;
function getEndOfToday() {
    return moment.tz(TIMEZONE).endOf('day').toDate();
}
exports.getEndOfToday = getEndOfToday;
function getStartOfWeek() {
    return moment.tz(TIMEZONE).startOf('isoWeek').toDate();
}
exports.getStartOfWeek = getStartOfWeek;
function getEndOfWeek() {
    return moment.tz(TIMEZONE).endOf('isoWeek').toDate();
}
exports.getEndOfWeek = getEndOfWeek;
function getStartOfMonth() {
    return moment.tz(TIMEZONE).startOf('month').toDate();
}
exports.getStartOfMonth = getStartOfMonth;
function getEndOfMonth() {
    return moment.tz(TIMEZONE).endOf('month').toDate();
}
exports.getEndOfMonth = getEndOfMonth;
function excelDateToJSDate(excelDate) {
    const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
    const dateString = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    return dateString;
}
exports.excelDateToJSDate = excelDateToJSDate;
function getDateAfter(startDate, duration) {
    const regex = /^(\d+)([WYMWDMY])$/; // Regex to match the format, e.g., 2W, 1Y, 1M
    const match = duration.match(regex);
    if (!match) {
        throw new Error('Invalid duration format. Use format like 2W, 1Y, 1M, etc.');
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const newDate = new Date(startDate);
    switch (unit) {
        case 'W':
            newDate.setDate(newDate.getDate() + amount * 7);
            break;
        case 'Y':
            newDate.setFullYear(newDate.getFullYear() + amount);
            break;
        case 'M':
            newDate.setMonth(newDate.getMonth() + amount);
            break;
        case 'D':
            newDate.setDate(newDate.getDate() + amount);
            break;
        default:
            throw new Error('Invalid unit. Use W, Y, M, or D.');
    }
    return newDate;
}
function generateDateSet(startDate, gapInDays, numberOfDates, outOfEMIAmount = 0, emiAmt = 0) {
    const dateSet = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < numberOfDates; i++) {
        dateSet.push({ date: new Date(currentDate), emi: emiAmt });
        currentDate = getDateAfter(currentDate, gapInDays);
        currentDate.setDate(currentDate.getDate());
    }
    if (outOfEMIAmount > 0) {
        dateSet[(dateSet.length - 1)].emi = outOfEMIAmount;
    }
    return dateSet;
}
exports.generateDateSet = generateDateSet;
