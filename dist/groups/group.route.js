"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupRouter = void 0;
const express_1 = __importDefault(require("express"));
const goup_controller_1 = require("./goup.controller");
const router = (0, express_1.default)();
exports.groupRouter = router;
const groupService = new goup_controller_1.GroupController();
router.get('/list', groupService.listGroup);
router.get('/:id', groupService.getSpecificGroup);
router.post('/add-new-group', groupService.createGroup);
router.delete('/:id/delete', groupService.deleteGrp);
router.put('/:id/update', groupService.updateGrp);
