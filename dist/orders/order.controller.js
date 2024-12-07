"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OrderController {
    constructor() {
    }
    /**
     *
     * @param req
     * @param res
     */
    getOrder(req, res) {
        res.status(200).json({ "nandan": "hello" });
    }
    /**
     *
     * @param req
     * @param res
     */
    addOrder(req, res) {
    }
}
exports.default = OrderController;
