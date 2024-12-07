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
exports.CalculationController = void 0;
const installment_model_1 = __importDefault(require("../loan/installment.model"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const loan_model_1 = __importDefault(require("../loan/loan.model"));
const customer_model_1 = __importDefault(require("../customer/customer.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const helper_1 = require("../helper");
const product_model_1 = require("../product/product.model");
class CalculationController {
    getRevenue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activeSum = yield installment_model_1.default.aggregate([
                    {
                        $match: { status: { $in: ['paid', 'active'] } }
                    },
                    {
                        $sort: { installment_date: 1 } // Sort by installment_date in ascending order
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%B, %Y", date: "$installment_date" } },
                            expectedAmt: { $sum: '$installmentAmt' }
                        }
                    }
                ]);
                const paidSum = yield installment_model_1.default.aggregate([
                    {
                        $match: { status: 'paid' }
                    },
                    {
                        $sort: { paymnentAt: 1 } // Sort by installment_date in ascending order
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%B, %Y", date: "$paymnentAt" } },
                            collectedAmt: { $sum: '$actualAmt' }
                        }
                    }
                ]);
                // Merge activeSum and paidSum into a single array of objects
                const mergedResult = activeSum.map(active => {
                    const paid = paidSum.find(p => p._id === active._id);
                    return {
                        month: active._id,
                        expected: active.expectedAmt,
                        collected: paid ? paid.collectedAmt : 0
                    };
                });
                mergedResult.sort((a, b) => {
                    const dateA = new Date(a.month);
                    const dateB = new Date(b.month);
                    if (dateA < dateB)
                        return -1;
                    if (dateA > dateB)
                        return 1;
                    return 0;
                });
                res.json(mergedResult);
            }
            catch (error) {
                // console.error('Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    }
    getAllDayCollection(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { from, to, collectedBy } = req.body;
                const startDate = new Date(from);
                const endDate = new Date(to);
                const startOfDay = new Date(startDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(endDate.setHours(23, 59, 59, 999));
                console.log(startDate, endDate, collectedBy);
                const matchStage = {
                    $match: {
                        paymnentAt: { $gte: startOfDay, $lte: endOfDay },
                        status: 'paid'
                    }
                };
                if (collectedBy) {
                    if (![null, ''].includes(collectedBy)) {
                        matchStage.$match.collectedBy = new mongoose_1.default.Types.ObjectId(collectedBy);
                    }
                }
                console.log(startDate, endDate, collectedBy, matchStage);
                const result = yield installment_model_1.default.aggregate([
                    Object.assign({}, matchStage),
                    {
                        $lookup: {
                            from: "loans",
                            localField: "loanId",
                            foreignField: "_id",
                            as: "loan"
                        }
                    },
                    {
                        $unwind: "$loan"
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "collectedBy",
                            foreignField: "_id",
                            as: "collectedBy",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        firstName: 1,
                                        lastName: 1,
                                        email: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$collectedBy"
                    },
                    {
                        $lookup: {
                            from: "customers",
                            localField: "loan.customer",
                            foreignField: "_id",
                            as: "loan.customer"
                        }
                    },
                    {
                        $unwind: "$loan.customer" // Unwind the "customer" array created by the second $lookup stage
                    },
                    {
                        $lookup: {
                            from: "groups",
                            localField: "loan.customer.group",
                            foreignField: "_id",
                            as: "loan.customer.group"
                        }
                    },
                    {
                        $unwind: "$loan.customer.group" // Unwind the "group" array created by the third $lookup stage
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymnentAt" } },
                            totalCollection: { $sum: "$actualAmt" },
                            installments: { $push: "$$ROOT" }
                        }
                    },
                    {
                        $sort: {
                            _id: 1
                        }
                    }
                ]);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
    getTurnOver(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { from, to } = req.body;
                if (!from || !to) {
                    return res.status(400).json({ message: 'Please provide both startDate and endDate query parameters.' });
                }
                let startDate = from ? (0, moment_timezone_1.default)(from).toDate() : null;
                let endDate = to ? (0, moment_timezone_1.default)(to).toDate() : null;
                const loans = yield loan_model_1.default.find({
                    sanctioned_date: { $gte: startDate, $lte: endDate },
                }, '_id, loanAmt customer totalAmt sanctioned_date');
                const loansWithReturnAmount = yield Promise.all(loans.map((loan) => __awaiter(this, void 0, void 0, function* () {
                    const installments = yield installment_model_1.default.find({ loanId: loan._id, status: 'paid' });
                    const customer = yield customer_model_1.default.findById(loan.customer);
                    const returnAmount = installments.reduce((total, installment) => total + installment.installmentAmt, 0);
                    return Object.assign(Object.assign({}, loan.toObject()), { returnAmount, customer: customer === null || customer === void 0 ? void 0 : customer.toJSON().name });
                })));
                res.status(200).json(loansWithReturnAmount);
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getDashboardCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const todayStart = (0, helper_1.getStartOfToday)();
                const todayEnd = (0, helper_1.getEndOfToday)();
                const weekStart = (0, helper_1.getStartOfWeek)();
                const weekEnd = (0, helper_1.getEndOfWeek)();
                const monthStart = (0, helper_1.getStartOfMonth)();
                const monthEnd = (0, helper_1.getEndOfMonth)();
                const uniqueCustomers = yield loan_model_1.default.distinct('customer', { status: 'active' });
                const uniqueCustomersCount = uniqueCustomers.length;
                const totalLoanAmount = yield loan_model_1.default.aggregate([
                    { $match: { status: 'active' } },
                    { $group: { _id: null, totalAmount: { $sum: '$loanAmt' } } }
                ]);
                const totalOutstanding = yield installment_model_1.default.aggregate([
                    { $match: { status: 'active' } },
                    { $group: { _id: null, totalAmount: { $sum: '$installmentAmt' } } }
                ]);
                const now = new Date();
                const totalOverdueAmount = yield installment_model_1.default.aggregate([
                    { $match: { status: 'active', installment_date: { $lt: now } } },
                    { $group: { _id: null, totalAmount: { $sum: '$installmentAmt' } } }
                ]);
                const todayDisbursement = yield loan_model_1.default.aggregate([
                    { $match: { sanctioned_date: { $gte: todayStart, $lt: todayEnd } } },
                    { $group: { _id: null, total: { $sum: "$loanAmt" } } }
                ]);
                const weekDisbursement = yield loan_model_1.default.aggregate([
                    { $match: { sanctioned_date: { $gte: weekStart, $lt: weekEnd } } },
                    { $group: { _id: null, total: { $sum: "$loanAmt" } } }
                ]);
                const monthDisbursement = yield loan_model_1.default.aggregate([
                    { $match: { sanctioned_date: { $gte: monthStart, $lt: monthEnd } } },
                    { $group: { _id: null, total: { $sum: "$loanAmt" } } }
                ]);
                const outOfStock = yield product_model_1.Product.find({ stock: 0 }).countDocuments();
                const disbusedLoan = {
                    today: todayDisbursement.length > 0 ? Math.round(todayDisbursement[0].total) : 0,
                    thisWeek: weekDisbursement.length > 0 ? Math.round(weekDisbursement[0].total) : 0,
                    thisMonth: monthDisbursement.length > 0 ? Math.round(monthDisbursement[0].total) : 0
                };
                res.status(200).json({ outOfStock, disbusedLoan, uniqueCustomersCount, totalLoanAmount, totalOutstanding, totalOverdueAmount });
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
}
exports.CalculationController = CalculationController;
