"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.todoRouter = void 0;
const express_1 = __importDefault(require("express"));
const todo_controller_1 = require("./todo.controller");
const router = express_1.default.Router();
exports.todoRouter = router;
const toDoService = new todo_controller_1.TodoController();
router.get('/', toDoService.get);
router.post('/', toDoService.create);
