"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const service_model_1 = require("./service.model");
class ServiceController {
    constructor() {
    }
    /**
     *
     * @param req
     * @param res
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, code, requireTime } = req.body;
                const createService = yield service_model_1.Service.build({
                    name, code, requireTime, status: 'active'
                });
                const saved = createService.save();
                if (!saved) {
                    res.status(500).send({ "error": "Something Went Wrong" });
                }
                res.status(200).json(saved);
            }
            catch (error) {
                res.status(400).json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const services = yield service_model_1.Service.find({ status: 'active' });
                res.status(200).json(services);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getAllServices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const services = yield service_model_1.Service.find({});
                res.status(200).json(services);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getDeletedService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const services = yield service_model_1.Service.find({ status: 'delete' });
                res.status(200).json(services);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    updateService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const updatedData = req.body;
                const updatedTodo = yield service_model_1.Service.findByIdAndUpdate(id, updatedData, { new: true });
                if (!updatedTodo) {
                    res.status(404).json({ error: 'Todo not found' });
                }
                res.status(200).json(updatedTodo);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    deleteService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const deletedTodo = yield service_model_1.Service.findByIdAndUpdate(id, { status: 'delete' }, { new: false });
                if (!deletedTodo) {
                    res.status(404).json({ error: 'Todo not found' });
                }
                res.status(200).json(deletedTodo);
            }
            catch (error) {
                res.status(400).json(error);
            }
        });
    }
}
exports.ServiceController = ServiceController;
