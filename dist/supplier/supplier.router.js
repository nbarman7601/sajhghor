"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierRouter = void 0;
const express_1 = require("express");
const supplier_controller_1 = __importDefault(require("./supplier.controller"));
const router = (0, express_1.Router)();
exports.supplierRouter = router;
const supplierService = new supplier_controller_1.default();
router.post('/suppliers', supplierService.createSupplier);
router.get('/suppliers', supplierService.getAllSuppliers);
router.get('/suppliers/:id', supplierService.getSupplierById);
router.put('/suppliers/:id', supplierService.updateSupplier);
router.delete('/suppliers/:id', supplierService.deleteSupplier);
