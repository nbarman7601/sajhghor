"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const todo_route_1 = require("./todo/todo.route");
const db_1 = require("./config/db");
const auth_1 = require("./auth");
const expert_route_1 = require("./expert/expert.route");
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const service_route_1 = require("./services/service.route");
const vendor_route_1 = require("./vendor/vendor.route");
const group_route_1 = require("./groups/group.route");
const auth_middleware_1 = require("./middleware/auth.middleware");
const user_route_1 = require("./user/user.route");
const user_controller_1 = __importDefault(require("./user/user.controller"));
const customer_route_1 = require("./customer/customer.route");
const product_route_1 = require("./product/product.route");
const loan_route_1 = require("./loan/loan.route");
const calculation_router_1 = require("./calculation/calculation.router");
const dotenv = __importStar(require("dotenv"));
const config_production_1 = require("./config/config.production");
const lhead_route_1 = require("./ledger-head/lhead.route");
const column_route_1 = require("./column/column.route");
const loan_1 = require("./scheduler/loan");
const schedule_route_1 = require("./scheduler/schedule.route");
const supplier_router_1 = require("./supplier/supplier.router");
const moment = require('moment-timezone');
var cors = require('cors');
const app = (0, express_1.default)();
const userService = new user_controller_1.default();
dotenv.config();
app.use(cors());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
moment.tz.setDefault('Asia/Kolkata');
app.get('/app-version/swapnoghor', body_parser_1.default.json(), (req, res) => {
    res.status(200).json({ version: '1.0' });
});
app.use('/todo', [auth_1.validateAuth], body_parser_1.default.json(), todo_route_1.todoRouter);
app.use('/expert', [auth_1.validateAuth], body_parser_1.default.json(), expert_route_1.expertRouter);
app.use('/service', [auth_1.validateAuth], body_parser_1.default.json(), service_route_1.serviceRouter);
app.use('/vendor', [auth_1.validateAuth], body_parser_1.default.json(), vendor_route_1.vendorRouter);
/*******Swapner Alonkar******* */
app.use('/v1/api/login', body_parser_1.default.json(), userService.login);
app.use('/v1/api/send-otp', body_parser_1.default.json(), userService.sendOTP);
app.use('/v1/api/login-with-otp', body_parser_1.default.json(), userService.loginWithOtp);
app.use('/v1/api/user', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), user_route_1.userRouter);
app.use('/v1/api/customer', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), customer_route_1.CustomerRouter);
app.use('/v1/api/product', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), product_route_1.productRouter);
app.use('/v1/api/loan', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), loan_route_1.loanRouter);
app.use('/v1/api/group', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), group_route_1.groupRouter);
app.use('/v1/api/calculation', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), calculation_router_1.calcalutaionRouter);
app.use('/v1/api/ledger-head', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), lhead_route_1.lheadRouter);
app.use('/v1/api/column', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), column_route_1.columnRoter);
app.use('/v1/api/schedule', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), schedule_route_1.scheduleRouter);
app.use('/v1/api/supplier', [auth_middleware_1.authenticateUser], body_parser_1.default.json(), supplier_router_1.supplierRouter);
app.get('/v1/api/run-server', (req, res) => {
    console.log('Refresh the server');
    res.status(200).send({ msg: "Refresh the server" });
});
app.get('/*', function (req, res) {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
const dbUrl = process.env.MONGO_URI || config_production_1.environment.DB_URL; // 
//console.log(process.env)
(0, loan_1.scheduleJob)();
(0, db_1.connectDB)(dbUrl);
const port = process.env.PORT || 3001;
/**Elastic beanstock default port */
// app.listen(port, () => {
//     console.log("running at", port);
// });
