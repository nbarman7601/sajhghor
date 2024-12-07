"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcalutaionRouter = void 0;
const express_1 = __importDefault(require("express"));
const calculation_controller_1 = require("./calculation.controller");
const calService = new calculation_controller_1.CalculationController();
const router = (0, express_1.default)();
exports.calcalutaionRouter = router;
router.get('/revenue', calService.getRevenue);
router.post('/get-collection', calService.getAllDayCollection);
router.post('/get-turn-over', calService.getTurnOver);
router.get('/dashboard', calService.getDashboardCount);
