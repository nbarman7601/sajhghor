"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.columnRoter = void 0;
const express_1 = __importDefault(require("express"));
const column_controller_1 = require("./column.controller");
const router = (0, express_1.default)();
exports.columnRoter = router;
const columnService = new column_controller_1.ColumnController();
router.post('/add-update-column-preference', columnService.updateColumnPreference);
router.get('/:page/list-column-preference', columnService.getColumnPreference);
