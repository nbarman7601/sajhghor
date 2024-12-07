"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRouter = void 0;
const express_1 = __importDefault(require("express"));
const schedule_controller_1 = __importDefault(require("./schedule.controller"));
const router = (0, express_1.default)();
exports.scheduleRouter = router;
const scheduleService = new schedule_controller_1.default();
router.put('/loan-checking', scheduleService.runScheduleLoan);
router.put('/mark-paid', scheduleService.markAsPaid);
router.put('/mark-customer-inactive', scheduleService.markAllCustomersInactiveIfNoActiveLoans);
