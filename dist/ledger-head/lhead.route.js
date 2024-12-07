"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lheadRouter = void 0;
const express_1 = __importDefault(require("express"));
const lhead_controller_1 = require("./lhead.controller");
const router = (0, express_1.default)();
exports.lheadRouter = router;
const lheadService = new lhead_controller_1.LheadController();
router.get('/lhead-list', lheadService.getLheadList);
router.post('/create-lhead', lheadService.addLHead);
