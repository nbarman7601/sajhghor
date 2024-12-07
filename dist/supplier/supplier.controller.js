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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supplier_model_1 = __importDefault(require("./supplier.model")); // Adjust the path as necessary
class SupplierController {
    // Create a new supplier
    createSupplier(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supplier = new supplier_model_1.default(req.body);
                const savedSupplier = yield supplier.save();
                res.status(201).json(savedSupplier);
            }
            catch (error) {
                res.status(500).json({ error: 'Error creating supplier' });
            }
        });
    }
    // Get all suppliers
    getAllSuppliers(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const suppliers = yield supplier_model_1.default.find();
                res.status(200).json(suppliers);
            }
            catch (error) {
                res.status(500).json({ error: 'Error fetching suppliers' });
            }
        });
    }
    // Get a specific supplier by ID
    getSupplierById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const supplier = yield supplier_model_1.default.findById(id);
                if (supplier) {
                    res.status(200).json(supplier);
                }
                else {
                    res.status(404).json({ message: 'Supplier not found' });
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Error fetching supplier', });
            }
        });
    }
    // Update a supplier by ID
    updateSupplier(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const updatedSupplier = yield supplier_model_1.default.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
                if (updatedSupplier) {
                    res.status(200).json(updatedSupplier);
                }
                else {
                    res.status(404).json({ message: 'Supplier not found' });
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Error updating supplier' });
            }
        });
    }
    // Delete a supplier by ID
    deleteSupplier(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const deletedSupplier = yield supplier_model_1.default.findByIdAndDelete(id);
                if (deletedSupplier) {
                    res.status(200).json({ message: 'Supplier deleted successfully' });
                }
                else {
                    res.status(404).json({ message: 'Supplier not found' });
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Error deleting supplier' });
            }
        });
    }
}
exports.default = SupplierController;
