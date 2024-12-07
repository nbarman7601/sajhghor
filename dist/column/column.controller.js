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
exports.ColumnController = void 0;
const column_model_1 = require("./column.model");
class ColumnController {
    /**
     *
     * @param req
     * @param res
     */
    updateColumnPreference(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { page, displayColumns } = req.body;
                let column = yield column_model_1.Column.findOne({ userId, page });
                if (column) {
                    // If found, update the displayColumns field
                    column.displayColumns = displayColumns;
                    yield column.save();
                }
                else {
                    // If not found, create a new document
                    column = new column_model_1.Column({ userId, page, displayColumns });
                    yield column.save();
                }
                res.status(200).json({ message: 'Column updated successfully', column });
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
     * @returns
     */
    getColumnPreference(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            try {
                const page = req.params.page;
                const columns = yield column_model_1.Column.find({ userId });
                if (!columns.length) {
                    return res.status(200).json({ message: 'No columns found for this user', columns: '' });
                }
                res.status(200).json({ message: 'Columns retrieved successfully', columns: columns[0].displayColumns });
            }
            catch (error) {
                res.status(500).json({ message: 'Error retrieving columns', error });
            }
        });
    }
}
exports.ColumnController = ColumnController;
