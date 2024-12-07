"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorRouter = void 0;
const express_1 = __importDefault(require("express"));
const vendor_controller_1 = require("./vendor.controller");
const router = (0, express_1.default)();
exports.vendorRouter = router;
const vendorService = new vendor_controller_1.VendorController();
router.post('/', vendorService.create);
router.get('/', vendorService.getVendors);
