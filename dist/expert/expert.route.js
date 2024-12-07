"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expertRouter = void 0;
const express_1 = __importDefault(require("express"));
const expert_controller_1 = __importDefault(require("./expert.controller"));
const router = (0, express_1.default)();
exports.expertRouter = router;
const expertService = new expert_controller_1.default();
router.get('/', expertService.getExperts);
router.post('/', expertService.createExpert);
