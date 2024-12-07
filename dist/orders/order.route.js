"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoute = void 0;
const express_1 = __importDefault(require("express"));
const order_controller_1 = __importDefault(require("./order.controller"));
const router = (0, express_1.default)();
exports.orderRoute = router;
const orderService = new order_controller_1.default();
router.get('/', orderService.getOrder);
router.post('/', orderService.addOrder);
