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
exports.TodoController = void 0;
const todo_model_1 = require("./todo.model");
class TodoController {
    constructor() {
    }
    /**
     *
     * @param req
     * @param res
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { title, description } = req.body;
            const todo = todo_model_1.Todo.build({ title, description });
            yield todo.save();
            res.status(200).send(todo);
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    get(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const todos = yield todo_model_1.Todo.find({});
            res.status(200).json(todos);
        });
    }
}
exports.TodoController = TodoController;
