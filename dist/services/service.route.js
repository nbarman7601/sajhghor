"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRouter = void 0;
const express_1 = __importDefault(require("express"));
const service_controller_1 = require("./service.controller");
const router = (0, express_1.default)();
exports.serviceRouter = router;
const serviceController = new service_controller_1.ServiceController();
router.post('/', serviceController.create);
router.get('/', serviceController.getService);
router.get('/all-service', serviceController.getAllServices);
router.get('/delete-services', serviceController.getDeletedService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);
