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
const product_model_1 = require("./product.model");
const loan_item_model_1 = __importDefault(require("../loan/loan-item.model"));
const xlsx_1 = __importDefault(require("xlsx"));
class ProductController {
    /**
     *
     * @param req
     * @param res
     */
    getProducts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, search, sortBy, sort, status } = req.query;
                const query = { status: status };
                if (search) {
                    query.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { model: { $regex: search, $options: 'i' } }
                    ];
                }
                // Sorting
                let sortOption = { createdAt: -1 }; // Default sorting
                if (sortBy) {
                    sortOption = { [sortBy]: sort === 'asc' ? 1 : -1 };
                }
                // Count total products matching the query
                const totalCount = yield product_model_1.Product.countDocuments(query);
                // Pagination
                const options = {
                    limit: parseInt(limit),
                    skip: (parseInt(page) - 1) * parseInt(limit),
                    sort: sortOption
                };
                // Fetch products
                // console.log(query, options)
                const products = yield product_model_1.Product.find({ status: status })
                    .or([
                    { 'name': { $regex: new RegExp(search, 'i') } },
                    { 'model': { $regex: new RegExp(search, 'i') } }, // Add more fields if needed
                ])
                    .sort(sortOption)
                    .skip((parseInt(page) - 1) * parseInt(limit))
                    .limit(parseInt(limit));
                const productsWithDetails = yield Promise.all(products.map((product) => __awaiter(this, void 0, void 0, function* () {
                    const orders = yield loan_item_model_1.default.find({ item: product._id });
                    const totalQtySold = orders.reduce((acc, order) => acc + order.qty, 0);
                    const avgSellPrice = orders.length
                        ? orders.reduce((acc, order) => acc + order.unitSellPrice, 0) / orders.length
                        : 0;
                    return Object.assign(Object.assign({}, product.toObject()), { qtySold: totalQtySold, avgSellPrice: avgSellPrice });
                })));
                // const totalData = await Product.countDocuments(filter);
                res.status(200).json({
                    data: productsWithDetails,
                    totalCount: totalCount
                });
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getOutOfStockProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield product_model_1.Product.find({ stock: 0, status: 'active' });
                res.status(200).send(products);
            }
            catch (error) {
                res.status(200).send(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    createProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, price, eprice, stock, model } = req.body;
                const createdProduct = product_model_1.Product.build({
                    name,
                    price,
                    eprice,
                    stock,
                    model,
                    addedBy: req.userId
                });
                yield createdProduct.save();
                res.status(200).json(createdProduct);
            }
            catch (error) {
                if (error.code === 11000 || error.code === 11001) {
                    res.status(400).json({ error: 'Indentity number already in use. Please choose another number.' });
                }
                else {
                    res.status(500).json(error);
                }
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    updateProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                let updatedProduct = yield product_model_1.Product.findByIdAndUpdate(id, req.body);
                res.status(200).send(updatedProduct);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    /**
     * get Product by id
     * @param req
     * @param res
     */
    getProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const product = yield product_model_1.Product.findById(id);
                if (product) {
                    res.status(200).send({
                        data: product.toObject(),
                        status: 'SUCCESS'
                    });
                }
                else {
                    res.status(200).send({
                        msg: "Not a Valid Product ID",
                        status: 'SUCCESS'
                    });
                }
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
    markVerified(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                try {
                    const result = yield product_model_1.Product.findOneAndUpdate({ _id: id }, 
                    // Use $unset to delete the status field
                    // Use $set to set it to null
                    { $set: { isverified: true, verifiedBy: req.userId } }, { new: true });
                    if (result) {
                        res.status(200).json(result);
                    }
                    else {
                        res.status(400).json({ msg: 'Product not found' });
                    }
                }
                catch (error) {
                    res.status(500).json(error);
                }
            }
            catch (error) {
                res.status(500).json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    deleteProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                try {
                    const result = yield product_model_1.Product.findOneAndUpdate({ _id: id }, 
                    // Use $unset to delete the status field
                    // Use $set to set it to null
                    { $set: { status: 'deleted' } }, { new: true });
                    if (result) {
                        res.status(200).json(result);
                    }
                    else {
                        res.status(400).json({ msg: 'Product not found' });
                    }
                }
                catch (error) {
                    res.status(500).json(error);
                }
            }
            catch (error) {
                res.status(500).json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    uploadProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }
            try {
                const workbook = xlsx_1.default.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // Convert Excel data to JSON
                const jsonData = xlsx_1.default.utils.sheet_to_json(worksheet);
                const products = yield product_model_1.Product.insertMany(jsonData);
                res.status(200).send({ success: products.length });
            }
            catch (error) {
                res.status(500).send({ msg: 'Error importing data: ' + error.message });
            }
        });
    }
}
exports.default = ProductController;
