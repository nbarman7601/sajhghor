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
exports.LheadController = void 0;
const lhead_model_1 = require("./lhead.model");
class LheadController {
    /**
     *
     * @param req
     * @param res
     */
    getLheadList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, page } = req.query;
                let filter = {
                    status: status
                };
                const headlist = yield lhead_model_1.Lhead.find(filter);
                res.status(200).send(headlist);
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
    addLHead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, address, phone } = req.body;
                const createdLhead = new lhead_model_1.Lhead({ name, address, phone });
                const savedlHead = yield createdLhead.save();
                res.status(200).send(savedlHead);
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
}
exports.LheadController = LheadController;
