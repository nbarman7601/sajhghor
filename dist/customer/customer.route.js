"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRouter = void 0;
const express_1 = __importDefault(require("express"));
const customer_controller_1 = __importDefault(require("./customer.controller"));
const router = (0, express_1.default)();
exports.CustomerRouter = router;
const CustomerService = new customer_controller_1.default();
router.get('/customerlist', CustomerService.getCustomers);
router.post('/create', CustomerService.createCustomer);
router.put('/:id/mark-as-verified', CustomerService.markVerified);
router.delete('/:id/delete-customer', CustomerService.deleteCustomer);
router.get('/:id', CustomerService.getCustomer);
router.put('/:id/update-customer', CustomerService.updateCustomer);
router.post('/migrate', CustomerService.migrateData);
