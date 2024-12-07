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
exports.LoanController = void 0;
const loan_model_1 = __importDefault(require("./loan.model"));
const loan_item_model_1 = __importDefault(require("./loan-item.model"));
const installment_model_1 = __importDefault(require("./installment.model"));
const product_model_1 = require("../product/product.model");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const mongoose_1 = __importDefault(require("mongoose"));
const ProcessEMI_model_1 = __importDefault(require("./ProcessEMI.model"));
const xlsx_1 = __importDefault(require("xlsx"));
const group_model_1 = require("../groups/group.model");
const customer_model_1 = __importDefault(require("../customer/customer.model"));
const helper_1 = require("../helper");
const exceljs_1 = __importDefault(require("exceljs"));
class LoanController {
    createLoan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { downpayment, totalAmt, loanAmt, extra, installment_duration, installment_interval, installment_amt, installment_start_date, noOfInstallment, outOfEMIAmount, sanctioned_date, precollection_amt } = req.body.loanInfo;
                const createdLoan = new loan_model_1.default({
                    downpayment,
                    totalAmt,
                    loanAmt,
                    extra,
                    installment_duration,
                    installment_interval,
                    installment_amt,
                    installment_start_date,
                    noOfInstallment,
                    precollection_amt,
                    customer: req.body.customer._id,
                    createdBy: req.userId,
                    sanctioned_date
                });
                const loan = yield createdLoan.save();
                console.log("loan created", loan);
                const items = req.body.cartItems.map((item) => {
                    return {
                        loan: loan._id,
                        item: item._id,
                        unitSellPrice: item.unitSellPrice,
                        qty: item.qty,
                        baseprice: item.baseprice
                    };
                });
                yield loan_item_model_1.default.insertMany(items);
                const installments = req.body.installments.map((dt, index) => {
                    return {
                        loanId: loan._id,
                        installmentNo: dt.installmentNo,
                        installment_date: dt.installment_date,
                        installmentAmt: dt.installmentAmt
                    };
                });
                yield installment_model_1.default.insertMany(installments);
                for (const item of req.body.cartItems) {
                    const existingItem = yield product_model_1.Product.findById(item._id);
                    if (!existingItem) {
                        console.log(`Item with ID ${item._id} not found.`);
                        continue; // Skip to the next item
                    }
                    // Calculate new stock quantity
                    const newQty = existingItem.stock - item.qty;
                    // Ensure the stock doesn't go negative
                    if (newQty < 0) {
                        console.log(`Not enough stock for item ${existingItem.name}`);
                        continue; // Skip to the next item
                    }
                    // Update the stock quantity
                    existingItem.stock = newQty;
                    // Save the updated item
                    yield existingItem.save();
                    console.log(`Stock reduced for item ${existingItem.name} to ${newQty}`);
                }
                res.status(200).send(createdLoan);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    getCustomersWithoutActiveLoans(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find customers whose loans are not active
                const customersWithActiveLoans = yield loan_model_1.default.distinct('customer', { status: 'active' });
                // Find customers who are not in the list of active loan customers
                const customersWithoutActiveLoans = yield customer_model_1.default.find({
                    _id: { $nin: customersWithActiveLoans }
                });
                res.status(200).send({ data: customersWithoutActiveLoans });
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
    ;
    /**
     *
     * @param req
     * @param res
     */
    getLoanList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '10', sort, search = '', status, sortBy, searchBy, from, to, interval } = req.query;
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                const sortObject = {};
                if (sort) {
                    sortObject[sortBy] = sort === 'asc' ? 1 : -1;
                }
                let searchsString = req.query.search ? req.query.search.toString() : '';
                let filter = {
                    status: status
                };
                if (searchBy == 'SNC_DATE') {
                    const fromDate = from != '' ? from : '';
                    const toDate = to != '' ? to : '';
                    const startDate = new Date(fromDate);
                    const endDate = new Date(toDate);
                    const startOfDay = new Date(startDate.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(endDate.setHours(23, 59, 59, 999));
                    filter['sanctioned_date'] = {
                        $gte: startOfDay,
                        $lte: endOfDay
                    };
                }
                if (searchBy == 'INTERVAL') {
                    if (interval != '') {
                        filter['installment_interval'] = interval;
                    }
                }
                if (searchBy == 'CUSTOMER') {
                    let searchsString = req.query.search ? req.query.search.toString() : '';
                    let customerIds = [];
                    if (searchsString) {
                        const customers = yield customer_model_1.default.find({ name: new RegExp(searchsString, 'i') }).select('_id');
                        customerIds = customers.map(customer => new mongoose_1.default.Types.ObjectId(customer._id));
                        filter.customer = { $in: customerIds };
                    }
                }
                if (searchBy == 'WEEKDAY') {
                    if (req.query.weekday != '') {
                        const weekdayGroups = yield group_model_1.Group.find({ weekday: req.query.weekday }).select('_id');
                        const sundayGroupIds = weekdayGroups.map(group => group._id);
                        const customers = yield customer_model_1.default.find({ group: { $in: sundayGroupIds } }).select('_id');
                        const customerIds = customers.map(customer => new mongoose_1.default.Types.ObjectId(customer._id));
                        filter.customer = { $in: customerIds };
                    }
                }
                if ((searchBy == 'GROUP') ||
                    (searchBy != 'INTERVAL'
                        && searchBy != 'SNC_DATE'
                        && searchBy != 'CUSTOMER'
                        && searchBy != 'WEEKDAY')) {
                    let groupId = req.query.groupId ? req.query.groupId.toString() : '';
                    let customerIds = [];
                    if (groupId) {
                        const customers = yield customer_model_1.default.find({ group: { $in: new mongoose_1.default.Types.ObjectId(groupId) } }).select('_id');
                        customerIds = customers.map(customer => new mongoose_1.default.Types.ObjectId(customer._id));
                    }
                    console.log('customer Ids', customerIds);
                    if (customerIds.length > 0) {
                        filter.customer = { $in: customerIds };
                    }
                }
                console.log(filter);
                const totalData = yield loan_model_1.default.countDocuments(filter);
                const loans = yield loan_model_1.default.aggregate([
                    { $match: filter },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: 'customer',
                            foreignField: '_id',
                            as: 'customerDetails'
                        }
                    },
                    { $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'groups',
                            localField: 'customerDetails.group',
                            foreignField: '_id',
                            as: 'groupDetails'
                        }
                    },
                    { $unwind: { path: '$groupDetails', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'groupDetails.lo',
                            foreignField: '_id',
                            as: 'loDetails'
                        }
                    },
                    { $unwind: { path: '$loDetails', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'installments',
                            let: { loanId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$loanId', '$$loanId'] },
                                                { $eq: ['$status', 'paid'] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$loanId',
                                        totalInstallmentAmount: { $sum: '$actualAmt' }
                                    }
                                }
                            ],
                            as: 'paidInstallments'
                        }
                    },
                    {
                        $lookup: {
                            from: 'installments',
                            let: { loanId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$loanId', '$$loanId'] },
                                                { $eq: ['$status', 'active'] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$loanId',
                                        totalInstallmentAmount: { $sum: '$installmentAmt' }
                                    }
                                }
                            ],
                            as: 'outstandingInstallments'
                        }
                    },
                    {
                        $addFields: {
                            customer: '$customerDetails.name',
                            phone: '$customerDetails.phone',
                            guardian: '$customerDetails.guardian',
                            group: '$groupDetails.name',
                            weekday: '$groupDetails.weekday',
                            lo: {
                                $cond: {
                                    if: { $and: ['$loDetails.firstName', '$loDetails.lastName'] },
                                    then: { $concat: ['$loDetails.firstName', ' ', '$loDetails.lastName'] },
                                    else: null
                                }
                            },
                            paidAmt: { $arrayElemAt: ['$paidInstallments.totalInstallmentAmount', 0] },
                            totalOutstandingSum: { $arrayElemAt: ['$outstandingInstallments.totalInstallmentAmount', 0] }
                        }
                    },
                    {
                        $sort: sortObject
                    },
                    {
                        $skip: (pageNumber - 1) * limitNumber
                    },
                    {
                        $limit: limitNumber
                    },
                    {
                        $project: {
                            customerDetails: 0,
                            groupDetails: 0,
                            loDetails: 0,
                            paidInstallments: 0,
                            outstandingInstallments: 0
                        }
                    }
                ]);
                const loanList = loans.map(loan => (Object.assign(Object.assign({}, loan), { paidAmt: loan.paidAmt || 0, totalOutstandingSum: loan.totalOutstandingSum || 0 })));
                res.json({
                    data: loanList,
                    currentPage: pageNumber,
                    totalCount: totalData,
                    totalPages: Math.ceil(totalData / limitNumber),
                });
                // res.status(200).send(loanList);
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
    dowloadLoan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '10', sort, search = '', status, sortBy, searchBy, from, to, interval } = req.query;
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                const sortObject = {};
                if (sort) {
                    sortObject[sortBy] = sort === 'asc' ? 1 : -1;
                }
                let searchsString = req.query.search ? req.query.search.toString() : '';
                let customerIds = [];
                if (searchsString) {
                    customerIds = searchsString.split(',').map(id => new mongoose_1.default.Types.ObjectId(id));
                }
                let filter = {
                    status: status
                };
                if (searchBy == 'SNC_DATE') {
                    const fromDate = from != '' ? from : '';
                    const toDate = to != '' ? to : '';
                    const startDate = new Date(fromDate);
                    const endDate = new Date(toDate);
                    const startOfDay = new Date(startDate.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(endDate.setHours(23, 59, 59, 999));
                    filter['sanctioned_date'] = {
                        $gte: startOfDay,
                        $lte: endOfDay
                    };
                }
                if (searchBy == 'INTERVAL') {
                    if (interval != '') {
                        filter['installment_interval'] = interval;
                    }
                }
                if ((searchBy == 'GROUP') || (searchBy != 'INTERVAL' && searchBy != 'SNC_DATE')) {
                    let searchsString = req.query.search ? req.query.search.toString() : '';
                    let customerIds = [];
                    if (searchsString) {
                        customerIds = searchsString.split(',').map(id => new mongoose_1.default.Types.ObjectId(id));
                    }
                    if (customerIds.length > 0) {
                        filter.customer = { $in: customerIds };
                    }
                }
                console.log(filter);
                const totalData = yield loan_model_1.default.countDocuments(filter);
                const loans = yield loan_model_1.default.aggregate([
                    { $match: filter },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: 'customer',
                            foreignField: '_id',
                            as: 'customerDetails'
                        }
                    },
                    { $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'groups',
                            localField: 'customerDetails.group',
                            foreignField: '_id',
                            as: 'groupDetails'
                        }
                    },
                    { $unwind: { path: '$groupDetails', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'groupDetails.lo',
                            foreignField: '_id',
                            as: 'loDetails'
                        }
                    },
                    { $unwind: { path: '$loDetails', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'installments',
                            let: { loanId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$loanId', '$$loanId'] },
                                                { $eq: ['$status', 'paid'] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$loanId',
                                        totalInstallmentAmount: { $sum: '$actualAmt' }
                                    }
                                }
                            ],
                            as: 'paidInstallments'
                        }
                    },
                    {
                        $lookup: {
                            from: 'installments',
                            let: { loanId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$loanId', '$$loanId'] },
                                                { $eq: ['$status', 'active'] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$loanId',
                                        totalInstallmentAmount: { $sum: '$installmentAmt' }
                                    }
                                }
                            ],
                            as: 'outstandingInstallments'
                        }
                    },
                    {
                        $addFields: {
                            customer: '$customerDetails.name',
                            phone: '$customerDetails.phone',
                            guardian: '$customerDetails.guardian',
                            group: '$groupDetails.name',
                            weekday: '$groupDetails.weekday',
                            lo: {
                                $cond: {
                                    if: { $and: ['$loDetails.firstName', '$loDetails.lastName'] },
                                    then: { $concat: ['$loDetails.firstName', ' ', '$loDetails.lastName'] },
                                    else: null
                                }
                            },
                            paidAmt: { $arrayElemAt: ['$paidInstallments.totalInstallmentAmount', 0] },
                            totalOutstandingSum: { $arrayElemAt: ['$outstandingInstallments.totalInstallmentAmount', 0] }
                        }
                    },
                    {
                        $sort: sortObject
                    },
                    // {
                    //     $skip: (pageNumber - 1) * limitNumber
                    // },
                    // {
                    //     $limit: limitNumber
                    // },
                    {
                        $project: {
                            customerDetails: 0,
                            groupDetails: 0,
                            loDetails: 0,
                            paidInstallments: 0,
                            outstandingInstallments: 0
                        }
                    }
                ]);
                const loanList = loans.map(loan => (Object.assign(Object.assign({}, loan), { paidAmt: loan.paidAmt || 0, totalOutstandingSum: loan.totalOutstandingSum || 0 })));
                const workbook = new exceljs_1.default.Workbook();
                const worksheet = workbook.addWorksheet('Data');
                // Add column headers
                worksheet.columns = [
                    { header: 'Customer', key: 'customer', width: 20 },
                    { header: 'Phone', key: 'phone', width: 20 },
                    { header: 'Group', key: 'group', width: 10 },
                    { header: 'Father/Husband', key: 'guardian', width: 30 },
                    { header: 'Loan Officer', key: 'lo', width: 20 },
                    { header: 'EMI Interval', key: 'installment_interval', width: 10 },
                    { header: 'Sanctioned Date', key: 'sanctioned_date', width: 30 },
                    { header: 'Total Amount', key: 'totalAmt', width: 20 },
                    { header: 'Advance', key: 'downpayment', width: 10 },
                    { header: 'Loan Amount', key: 'loanAmt', width: 30 },
                    { header: 'Paid', key: 'paidAmt', width: 10 },
                    { header: 'Outstanding', key: 'totalOutstandingSum', width: 10 }
                ];
                // Add rows
                loanList.forEach(item => {
                    worksheet.addRow(item);
                });
                // Set the response headers and send the file
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
                yield workbook.xlsx.write(res);
                res.end();
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
    getLoanDetail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loanId = req.params.loanId;
                const installments = yield installment_model_1.default.find({ loanId: loanId })
                    .populate('collectedBy')
                    .sort({ installment_date: 1 });
                const items = yield loan_item_model_1.default.find({ loan: loanId }).populate('item');
                const loan = yield loan_model_1.default.findById(loanId)
                    .populate({
                    path: 'customer',
                    model: 'Customer',
                    populate: {
                        path: 'group',
                        model: 'Group',
                        populate: {
                            path: 'lo',
                            model: 'User'
                        }
                    }
                });
                res.status(200).send(Object.assign(Object.assign({}, loan === null || loan === void 0 ? void 0 : loan.toObject()), { installments: installments, items }));
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
    deleteLoan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loanId = req.params.loanId;
                const installments = yield installment_model_1.default.find({ loanId: loanId, status: 'paid' });
                if (installments.length > 0) {
                    res.status(200).send({
                        deleted: false,
                        msg: 'This Loan installment are not active all. It can not be deleted'
                    });
                    return 1;
                }
                yield loan_item_model_1.default.deleteMany({ loan: loanId });
                yield installment_model_1.default.deleteMany({ loanId: loanId });
                yield loan_model_1.default.findByIdAndDelete(loanId);
                res.status(200).send({ deleted: true, msg: 'Loan deleted successfully' });
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
    forceClose(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { loanId, fcAmount } = req.body;
                yield loan_model_1.default.findByIdAndUpdate(loanId, {
                    status: 'closed',
                    fcAmount: fcAmount
                });
                const result = yield installment_model_1.default.updateMany({ loanId: loanId }, { $set: { status: 'FC', actualAmt: 0 } });
                res.status(200).send({
                    msg: "Loan has been force closed"
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
    getInstallmentList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '10', sort, search, status, sortBy } = req.query;
                //  console.log(req.query);
                // Convert query parameters to numbers
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                const filter = {};
                if (status) {
                    filter.status = status;
                }
                // Build the sort object
                // Build the search query
                const searchQuery = {};
                if (search) {
                    const searchRegExp = new RegExp(search, 'i'); // Case-insensitive search
                    // Use $or to search in multiple fields
                    searchQuery.$or = [
                        { 'loanId.customer.name': searchRegExp },
                        { 'status': searchRegExp },
                        // Add other fields as needed
                    ];
                }
                const sortObject = {};
                if (sort) {
                    sortObject[sortBy] = sort === 'asc' ? 1 : -1;
                }
                // Find users based on filter and sort, and apply pagination
                // console.log(sortObject)
                const data = yield installment_model_1.default.find(filter)
                    .populate({
                    path: 'loanId',
                    populate: {
                        path: 'customer',
                        model: 'Customer'
                    },
                })
                    .or([
                    { 'loanId.customer.name': { $regex: new RegExp(search, 'i') } },
                    { 'status': { $regex: new RegExp(search, 'i') } }, // Add more fields if needed
                ])
                    .sort(sortObject)
                    .skip((pageNumber - 1) * limitNumber)
                    .limit(limitNumber);
                // Count total users without pagination
                const totalData = yield installment_model_1.default.countDocuments(filter);
                res.json({
                    data,
                    currentPage: pageNumber,
                    totalCount: totalData,
                    totalPages: Math.ceil(totalData / limitNumber),
                });
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
    markAsPaid(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.installmentId;
                const { loanId, actualAmt, payment_date } = req.body;
                // Find the last installment of the loan
                const lastInstallment = yield installment_model_1.default.findOne({ loanId }).sort({ installmentNo: -1 });
                if (!lastInstallment) {
                    return res.status(404).json({ message: "No installment found for the given loan" });
                }
                const newProcess = new ProcessEMI_model_1.default({
                    loanId,
                    actualAmt,
                    payment_date,
                    installmentId: id,
                    collectedBy: req.userId
                });
                yield newProcess.save();
                yield installment_model_1.default.findOneAndUpdate({ _id: id }, {
                    $set: {
                        status: 'OIP',
                        collectedBy: req.userId,
                        actualAmt: actualAmt,
                        paymnentAt: new Date(payment_date)
                    }
                }, { new: true });
                res.status(200).send({ msg: "Installment has been paid.", entry: newProcess });
                /*move to migration*/
                /*
                 const loan = await Loan.findById(loanId);
                 if (!loan) {
                     return res.status(404).json({ message: "Loan not found" });
                 }
                 const normalInstallmentAmt = loan.installment_amt;
                 await Installment.findOneAndUpdate(
                     { _id: id },
                     {
                         $set: {
                             status: 'paid',
                             collectedBy: (req as any).userId,
                             actualAmt: actualAmt
                         },
                         paymnentAt: new Date(payment_date)
                     },
                     { new: true }
                 );
                 if (actualAmt > normalInstallmentAmt) {
                     const excessAmt = actualAmt - normalInstallmentAmt;
                     lastInstallment.actualAmt = normalInstallmentAmt;
                     if (lastInstallment.installmentAmt - excessAmt > 0) {
                         lastInstallment.installmentAmt = lastInstallment.installmentAmt - excessAmt;
                         await lastInstallment.save();
                     } else {
                         const eeAmt = excessAmt - lastInstallment.installmentAmt;
                         await lastInstallment.deleteOne();
                         const secondLastInstallment = await Installment.findOne({ loanId }).sort({ installmentNo: -1 });
                         if (secondLastInstallment) {
                             secondLastInstallment.installmentAmt = secondLastInstallment?.installmentAmt - eeAmt;
                             await secondLastInstallment.save();
                         }
                     }
     
                 } else if (actualAmt < normalInstallmentAmt) {
                     let restAmt = normalInstallmentAmt - actualAmt;
                     console.log('resAmt', restAmt)
                     let insDate = new Date(lastInstallment.installment_date);
                     if (loan.installment_interval == '1W') {
                         insDate.setDate(insDate.getDate() + 7);
                     } else if (loan.installment_interval == '1M') {
                         insDate.setMonth(insDate.getMonth() + 1);
                     } else {
                         insDate.setDate(insDate.getDate() + 15);
                     }
                     if (lastInstallment.installmentAmt < normalInstallmentAmt) {
                         const gapAmt = normalInstallmentAmt - lastInstallment.installmentAmt;
                         if (gapAmt > restAmt) {
                             lastInstallment.installmentAmt = lastInstallment.installmentAmt + restAmt;
                         } else {
                             const excessAmt = (lastInstallment.installmentAmt + restAmt) - normalInstallmentAmt;
                             lastInstallment.installmentAmt = normalInstallmentAmt;
                             if (excessAmt > 0) {
                                 const newInstallment = new Installment({
                                     loanId,
                                     installment_date: insDate,
                                     installmentAmt: excessAmt,
                                     installmentNo: (+lastInstallment.installmentNo) + 1,
                                     actualAmt: 0,
                                     status: 'active'
                                 });
                                 await newInstallment.save();
                             }
                         }
                         await lastInstallment.save();
                     } else {
                         if (restAmt > 0) {
                             const newInstallment = new Installment({
                                 loanId,
                                 installment_date: insDate,
                                 installmentAmt: restAmt,
                                 installmentNo: (+lastInstallment.installmentNo) + 1,
                                 actualAmt: 0,
                                 status: 'active'
                             });
                             await newInstallment.save();
                         }
                     }
                 }
     
                 return res.status(200).json({ message: "Marked as paid successfully" });
                 */
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    markAsOverDue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.installmentId;
                try {
                    const result = yield installment_model_1.default.findOneAndUpdate({ _id: id }, 
                    // Use $unset to delete the status field
                    // Use $set to set it to null
                    { $set: { status: 'overdue', collectedBy: req.userId } }, { new: true });
                    if (result) {
                        res.status(200).json(result);
                    }
                    else {
                        res.status(400).json({ msg: 'label.msg.2001' });
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
    getLoanAmountSum(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '10', sort, search = '', status, sortBy, searchBy, from, to, interval } = req.query;
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                const sortObject = {};
                // let searchsString = req.query.search ? req.query.search.toString() : '';
                // let customerIds: mongoose.Types.ObjectId[] = [];
                // if (searchsString) {
                //     customerIds = searchsString.split(',').map(id => new mongoose.Types.ObjectId(id));
                // }
                let filter = {
                    status: status
                };
                if (searchBy == 'SNC_DATE') {
                    const fromDate = from != '' ? from : '';
                    const toDate = to != '' ? to : '';
                    const startDate = new Date(fromDate);
                    const endDate = new Date(toDate);
                    const startOfDay = new Date(startDate.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(endDate.setHours(23, 59, 59, 999));
                    filter['sanctioned_date'] = {
                        $gte: startOfDay,
                        $lte: endOfDay
                    };
                }
                if (searchBy == 'INTERVAL') {
                    if (interval != '') {
                        filter['installment_interval'] = interval;
                    }
                }
                if (searchBy == 'CUSTOMER') {
                    let searchsString = req.query.search ? req.query.search.toString() : '';
                    let customerIds = [];
                    if (searchsString) {
                        const customers = yield customer_model_1.default.find({ name: new RegExp(searchsString, 'i') }).select('_id');
                        customerIds = customers.map(customer => new mongoose_1.default.Types.ObjectId(customer._id));
                        //  if (customerIds.length > 0) {
                        filter.customer = { $in: customerIds };
                        //  }
                    }
                }
                if (searchBy == 'WEEKDAY') {
                    if (req.query.weekday != '') {
                        const weekdayGroups = yield group_model_1.Group.find({ weekday: req.query.weekday }).select('_id');
                        const sundayGroupIds = weekdayGroups.map(group => group._id);
                        const customers = yield customer_model_1.default.find({ group: { $in: sundayGroupIds } }).select('_id');
                        const customerIds = customers.map(customer => new mongoose_1.default.Types.ObjectId(customer._id));
                        filter.customer = { $in: customerIds };
                    }
                }
                if ((searchBy == 'GROUP') ||
                    (searchBy != 'INTERVAL'
                        && searchBy != 'SNC_DATE'
                        && searchBy != 'CUSTOMER'
                        && searchBy != 'WEEKDAY')) {
                    let searchsString = req.query.search ? req.query.search.toString() : '';
                    let customerIds = [];
                    if (searchsString) {
                        customerIds = searchsString.split(',').map(id => new mongoose_1.default.Types.ObjectId(id));
                    }
                    if (customerIds.length > 0) {
                        filter.customer = { $in: customerIds };
                    }
                }
                const loans = yield loan_model_1.default.find(filter).select('_id');
                const loanIds = loans.map(loan => loan._id);
                const paidAmount = yield installment_model_1.default.aggregate([
                    { $match: { loanId: { $in: loanIds }, status: 'paid' } },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$actualAmt' }
                        }
                    }
                ]);
                const outstandingAmount = yield installment_model_1.default.aggregate([
                    { $match: { loanId: { $in: loanIds }, status: 'active' } },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$installmentAmt' }
                        }
                    }
                ]);
                const paidAmountSum = paidAmount.length > 0 ? paidAmount[0].totalAmount : 0;
                const outstandingAmountSum = outstandingAmount.length > 0 ? outstandingAmount[0].totalAmount : 0;
                res.status(200).send({ paidAmountSum, outstandingAmountSum });
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
    getTodaySum(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const today = (0, moment_timezone_1.default)().startOf('day').toDate();
                const tomorrow = (0, moment_timezone_1.default)().endOf('day').toDate();
                // Aggregation query to calculate sums based on status and date conditions
                const summary = yield installment_model_1.default.aggregate([
                    {
                        $match: {
                            installment_date: { $gte: today, $lte: tomorrow }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalDuePending: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", "active"] }, "$installmentAmt", 0]
                                }
                            },
                            inProcess: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", "OIP"] }, "$actualAmt", 0]
                                }
                            },
                            expectedCollection: { $sum: "$installmentAmt" },
                            alreadyCollected: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", "paid"] }, "$actualAmt", 0]
                                }
                            }
                        }
                    }
                ]);
                if (summary.length > 0) {
                    res.status(200).json({
                        totalDuePending: summary[0].totalDuePending,
                        inProcess: summary[0].inProcess,
                        expectedCollection: summary[0].expectedCollection,
                        alreadyCollected: summary[0].alreadyCollected
                    });
                }
                else {
                    res.status(200).json({
                        totalDuePending: 0,
                        inProcess: 0,
                        expectedCollection: 0,
                        alreadyCollected: 0
                    });
                }
            }
            catch (error) {
                res.status(500).json({ error });
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getTodayInstallment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                moment_timezone_1.default.tz.setDefault('Asia/Kolkata');
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                // Set the time to the last millisecond of the day to represent the end of the day
                const endOfDay = new Date(currentDate);
                endOfDay.setHours(23, 59, 59, 999);
                console.log(currentDate, endOfDay);
                const status = req.query.status || '';
                console.log(status);
                let filter = {
                    installment_date: {
                        $gte: currentDate,
                        $lt: endOfDay,
                    }
                };
                if (status !== '') {
                    filter = Object.assign(Object.assign({}, filter), { status: status });
                }
                const data = yield installment_model_1.default.aggregate([
                    {
                        $match: filter,
                    },
                    {
                        $lookup: {
                            from: 'loans',
                            localField: 'loanId',
                            foreignField: '_id',
                            as: 'loan'
                        }
                    },
                    { $unwind: "$loan" },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: 'loan.customer',
                            foreignField: '_id',
                            as: 'customer'
                        }
                    },
                    { $unwind: "$customer" },
                    {
                        $lookup: {
                            from: 'groups',
                            localField: 'customer.group',
                            foreignField: '_id',
                            as: 'group'
                        }
                    },
                    { $unwind: "$group" },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'group.lo',
                            foreignField: '_id',
                            as: 'lo'
                        }
                    },
                    { $unwind: "$lo" },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'collectedBy',
                            foreignField: '_id',
                            as: 'collectedBy'
                        }
                    },
                    { $unwind: { path: "$collectedBy", preserveNullAndEmptyArrays: true } },
                    {
                        $sort: {
                            'group.name': 1
                        }
                    }
                ]);
                res.status(200).json({
                    data
                });
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getInstallmentDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const installment = yield installment_model_1.default.findById(id)
                    .populate({
                    path: 'loanId',
                    populate: {
                        path: 'customer',
                        model: 'Customer',
                        // populate: {
                        //     path: 'address',
                        //     model: 'Address'
                        // }
                    },
                }).populate('collectedBy');
                res.status(200).json(installment);
            }
            catch (error) {
                res.status(400).json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    // async getOverdueList(req: Request, res: Response) {
    //     try {
    //         const overdueInstallments = await Installment.find({
    //             status: 'active',
    //             installment_date: { $lt: new Date() } // Find dates in the past
    //         }).populate({
    //             path: 'loanId',
    //             populate: {
    //                 path: 'customer',
    //                 model: 'Customer',
    //                 populate: {
    //                     path: 'group',
    //                     model: 'Group',
    //                     populate:{
    //                         path: 'lo',
    //                         model: 'User'
    //                     }
    //                 }
    //             }
    //         }).populate('collectedBy')
    //         res.status(200).send({ data: overdueInstallments, totalCount: overdueInstallments.length });
    //     } catch (error) {
    //         res.status(400).json(error);
    //     }
    // }
    getOverdueList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, startDate, endDate } = req.query;
                // Convert page and limit to numbers
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                // Base query for overdue installments with optional date range
                const query = {
                    status: 'active',
                    installment_date: { $lt: new Date() } // Default: find overdue dates
                };
                // Apply date range if provided
                if (startDate && endDate) {
                    query.installment_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }
                else if (startDate) {
                    query.installment_date = { $gte: new Date(startDate) };
                }
                else if (endDate) {
                    query.installment_date = { $lte: new Date(endDate) };
                }
                // Count total documents for pagination
                const totalCount = yield installment_model_1.default.countDocuments(query);
                // Retrieve data with pagination and populate fields
                const overdueInstallments = yield installment_model_1.default.find(query)
                    .skip((pageNumber - 1) * limitNumber)
                    .limit(limitNumber)
                    .populate({
                    path: 'loanId',
                    populate: {
                        path: 'customer',
                        model: 'Customer',
                        populate: {
                            path: 'group',
                            model: 'Group',
                            populate: {
                                path: 'lo',
                                model: 'User'
                            }
                        }
                    }
                })
                    .populate('collectedBy');
                res.status(200).send({
                    data: overdueInstallments,
                    totalCount,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalCount / limitNumber)
                });
            }
            catch (error) {
                res.status(400).json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getOverdueListForDownload(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate } = req.query;
                // Base query for overdue installments with optional date range
                const query = {
                    status: 'active',
                    installment_date: { $lt: new Date() } // Default: find overdue dates
                };
                // Apply date range if provided
                if (startDate && endDate) {
                    query.installment_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }
                else if (startDate) {
                    query.installment_date = { $gte: new Date(startDate) };
                }
                else if (endDate) {
                    query.installment_date = { $lte: new Date(endDate) };
                }
                // Retrieve all overdue installments and populate fields
                const overdueInstallments = yield installment_model_1.default.find(query)
                    .populate({
                    path: 'loanId',
                    populate: {
                        path: 'customer',
                        model: 'Customer',
                        populate: {
                            path: 'group',
                            model: 'Group',
                            populate: {
                                path: 'lo',
                                model: 'User'
                            }
                        }
                    }
                })
                    .populate('collectedBy');
                // Convert data to JSON for easier Excel conversion
                console.log(overdueInstallments);
                const dataToExport = overdueInstallments.map(installment => {
                    var _a, _b;
                    return ({
                        customer: installment.loanId.customer.name,
                        group: installment.loanId.customer.group.name,
                        phone: installment.loanId.customer.phone,
                        LoanOfficer: (_b = (_a = installment.loanId.customer.group) === null || _a === void 0 ? void 0 : _a.lo) === null || _b === void 0 ? void 0 : _b.firstName,
                        installment_date: installment.installment_date,
                        installmentAmt: installment.installmentAmt,
                        actualAmt: installment.actualAmt,
                        installmentNo: installment.installmentNo,
                        status: installment.status,
                    });
                });
                // Convert JSON data to worksheet and workbook
                const worksheet = xlsx_1.default.utils.json_to_sheet(dataToExport);
                const workbook = xlsx_1.default.utils.book_new();
                xlsx_1.default.utils.book_append_sheet(workbook, worksheet, 'OverdueInstallments');
                // Create buffer from workbook and send as a downloadable Excel file
                const buffer = xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Disposition', 'attachment; filename="overdue_installments.xlsx"');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.send(buffer);
            }
            catch (error) {
                console.log(error);
                res.status(400).json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getLoanInstallmentList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loanId = req.params.loanId;
                let installmentList = yield installment_model_1.default.find({ loanId: loanId })
                    .populate('collectedBy')
                    .sort({ installment_date: 'asc' });
                let loanInfo = yield loan_model_1.default.findById(loanId).populate({
                    path: 'customer',
                    model: 'Customer',
                    populate: {
                        path: 'group',
                        model: 'Group',
                        populate: {
                            path: 'lo',
                            model: 'User'
                        }
                    }
                });
                res.status(200).send({
                    data: installmentList,
                    totalCount: installmentList.length,
                    loanInfo: loanInfo
                });
            }
            catch (error) {
                res.status(400).json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getInstallmentWithDateGap(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { from, to } = req.query;
                if (from && to) {
                    const currentDate = new Date(req.query.from);
                    const endOfDay = new Date(req.query.to);
                    currentDate.setHours(0, 0, 0, 0);
                    // Set the time to the last millisecond of the day to represent the end of the day
                    endOfDay.setHours(23, 59, 59, 999);
                    const data = yield installment_model_1.default.find({
                        installment_date: {
                            $gte: currentDate,
                            $lt: endOfDay,
                        },
                    })
                        .populate({
                        path: 'loanId',
                        populate: {
                            path: 'customer',
                            model: 'Customer',
                            populate: {
                                path: 'group',
                                model: 'Group',
                                populate: {
                                    path: 'lo',
                                    model: 'User'
                                }
                            }
                        },
                    }).populate('collectedBy');
                    res.status(200).json({
                        data
                    });
                }
                else {
                    res.status(400).json({ error: "From and to date are empty" });
                }
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
    /**
     *
     */
    runMigration(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Update documents according to conditions
                const installments = yield installment_model_1.default.find();
                installments.forEach((installment) => __awaiter(this, void 0, void 0, function* () {
                    if (installment.status === 'paid') {
                        installment.actualAmt = installment.installmentAmt;
                    }
                    else if (installment.status === 'active') {
                        installment.actualAmt = 0;
                    }
                    yield installment.save();
                }));
                res.status(200).send("Successfully Migrated");
            }
            catch (error) {
                console.log(error);
                res.status(500).send(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getLoanWithNoDue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loansWithAllPaidInstallments = yield loan_model_1.default.aggregate([
                    {
                        $lookup: {
                            from: 'installments',
                            localField: '_id',
                            foreignField: 'loanId',
                            as: 'installments'
                        }
                    },
                    {
                        $match: {
                            'installments.status': { $ne: 'active' }
                        }
                    },
                    {
                        $addFields: {
                            allPaid: {
                                $allElementsTrue: {
                                    $map: {
                                        input: '$installments',
                                        as: 'inst',
                                        in: { $eq: ['$$inst.status', 'paid'] }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $match: {
                            allPaid: true
                        }
                    },
                    {
                        $lookup: {
                            from: "customers",
                            localField: "customer",
                            foreignField: "_id",
                            as: "customer"
                        }
                    },
                    {
                        $unwind: "$customer" // Unwind the "loan" array created by the $lookup stage
                    }
                ]);
                res.status(200).json(loansWithAllPaidInstallments);
            }
            catch (error) {
                res.status(500).json({ error });
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getCip(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let filter = {};
                if (req.query.collector) {
                    filter['collectedBy'] = req.query.collector;
                }
                const cipList = yield ProcessEMI_model_1.default.find(filter)
                    .populate('collectedBy')
                    .populate('installmentId')
                    .populate({
                    path: 'loanId',
                    populate: {
                        path: 'customer',
                        model: 'Customer',
                        populate: {
                            path: 'group',
                            model: 'Group'
                        }
                    }
                });
                // Apply customer filter after population
                let filteredList = cipList;
                if (req.query.customer) {
                    filteredList = cipList.filter(cip => cip.loanId.customer &&
                        new RegExp(req.query.customer, 'i').test(cip.loanId.customer.name));
                }
                res.status(200).send(filteredList);
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
    deleteCip(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cipIds, installmentIds } = req.body;
                // console.log(cipIds, installmentIds);
                if (!Array.isArray(installmentIds)) {
                    return res.status(400).send('Invalid input: installmentIds should be an array');
                }
                const result = yield installment_model_1.default.updateMany({ _id: { $in: installmentIds } }, { $set: { status: 'active' } });
                const cipDelete = yield ProcessEMI_model_1.default.deleteMany({ _id: { $in: cipIds } });
                res.status(200).json({ deleteIns: result, emiCip: cipDelete });
            }
            catch (error) {
                res.json(error);
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    modifyCip(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, installmentId, payment_date, actualAmt } = req.body;
                const ins = yield installment_model_1.default.findByIdAndUpdate(installmentId, { $set: { status: 'OIP', actualAmt: actualAmt, paymnentAt: payment_date } }, { new: true });
                const cip = yield ProcessEMI_model_1.default.findByIdAndUpdate(id, { $set: { actualAmt: actualAmt, payment_date: payment_date } }, { new: true });
                res.send({ msg: "Collection Updated Successfully", data: { cip, ins } });
            }
            catch (error) {
                res.send(error);
            }
        });
    }
    /**
     *
     * @param req ]
     * @param res
     */
    getCipforCurrentuser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let filter = {};
                if (req.userId != '') {
                    filter['collectedBy'] = req.userId;
                }
                const cipList = yield ProcessEMI_model_1.default.find(filter)
                    .populate('collectedBy')
                    .populate('installmentId')
                    .populate({
                    path: 'loanId',
                    populate: {
                        path: 'customer',
                        model: 'Customer'
                    }
                });
                res.status(200).send(cipList);
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
    confirmPaid(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ids = req.body.ids;
                const objectIds = ids.map((id) => new mongoose_1.default.Types.ObjectId(id));
                const listProcessing = yield ProcessEMI_model_1.default.aggregate([
                    {
                        $match: { _id: { $in: objectIds } }
                    }
                ]);
                yield Promise.all(listProcessing.map((pitem) => __awaiter(this, void 0, void 0, function* () {
                    const { _id, actualAmt, loanId } = pitem;
                    const loan = yield loan_model_1.default.findById(loanId);
                    if (!loan) {
                        console.log("no loan");
                    }
                    const normalInstallmentAmt = loan ? loan.installment_amt : 0;
                    const lastInstallment = yield installment_model_1.default.findOne({ loanId: loanId }).sort({ installmentNo: -1 });
                    yield installment_model_1.default.findOneAndUpdate({ _id: pitem.installmentId }, {
                        $set: {
                            status: 'paid',
                            // collectedBy: (req as any).userId,
                            actualAmt: pitem.actualAmt
                        },
                        paymnentAt: new Date(pitem.payment_date)
                    }, { new: true });
                    if (actualAmt > normalInstallmentAmt) {
                        const excessAmt = actualAmt - normalInstallmentAmt;
                        lastInstallment.actualAmt = normalInstallmentAmt;
                        if (lastInstallment.installmentAmt - excessAmt > 0) {
                            lastInstallment.installmentAmt = lastInstallment.installmentAmt - excessAmt;
                            yield lastInstallment.save();
                        }
                        else {
                            const eeAmt = excessAmt - lastInstallment.installmentAmt;
                            yield lastInstallment.deleteOne();
                            const secondLastInstallment = yield installment_model_1.default.findOne({ loanId }).sort({ installmentNo: -1 });
                            if (secondLastInstallment) {
                                secondLastInstallment.installmentAmt = (secondLastInstallment === null || secondLastInstallment === void 0 ? void 0 : secondLastInstallment.installmentAmt) - eeAmt;
                                yield secondLastInstallment.save();
                            }
                        }
                    }
                    else if (actualAmt < normalInstallmentAmt) {
                        let restAmt = normalInstallmentAmt - actualAmt;
                        console.log('resAmt', restAmt);
                        let insDate = new Date(lastInstallment.installment_date);
                        if (loan.installment_interval == '1W') {
                            insDate.setDate(insDate.getDate() + 7);
                        }
                        else if (loan.installment_interval == '1M') {
                            insDate.setMonth(insDate.getMonth() + 1);
                        }
                        else {
                            insDate.setDate(insDate.getDate() + 15);
                        }
                        if (lastInstallment.installmentAmt < normalInstallmentAmt) {
                            const gapAmt = normalInstallmentAmt - lastInstallment.installmentAmt;
                            if (gapAmt > restAmt) {
                                lastInstallment.installmentAmt = lastInstallment.installmentAmt + restAmt;
                            }
                            else {
                                const excessAmt = (lastInstallment.installmentAmt + restAmt) - normalInstallmentAmt;
                                lastInstallment.installmentAmt = normalInstallmentAmt;
                                if (excessAmt > 0) {
                                    const newInstallment = new installment_model_1.default({
                                        loanId,
                                        installment_date: insDate,
                                        installmentAmt: excessAmt,
                                        installmentNo: (+lastInstallment.installmentNo) + 1,
                                        actualAmt: 0,
                                        status: 'active'
                                    });
                                    yield newInstallment.save();
                                }
                            }
                            yield lastInstallment.save();
                        }
                        else {
                            if (restAmt > 0) {
                                const newInstallment = new installment_model_1.default({
                                    loanId,
                                    installment_date: insDate,
                                    installmentAmt: restAmt,
                                    installmentNo: (+lastInstallment.installmentNo) + 1,
                                    actualAmt: 0,
                                    status: 'active'
                                });
                                yield newInstallment.save();
                            }
                        }
                    }
                    yield ProcessEMI_model_1.default.findByIdAndDelete(_id);
                })));
                res.status(200).send({ msg: "Successfully Paid" });
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
    uploadLoan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }
            try {
                const workbook = xlsx_1.default.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = xlsx_1.default.utils.sheet_to_json(worksheet);
                yield Promise.all(jsonData.map((item) => __awaiter(this, void 0, void 0, function* () {
                    let group = yield group_model_1.Group.findOneAndUpdate({ name: item.group }, // search criteria
                    { name: item.group, weekday: item.weekday }, // values to insert or update
                    { new: true, upsert: true } // options
                    );
                    let customer = yield customer_model_1.default.findOneAndUpdate({
                        name: item.name,
                        identityNo: item.identityNo,
                    }, {
                        name: item.name,
                        group: group._id,
                        identityProof: item.identityProof,
                        identityNo: item.identityNo,
                        guardian: item.guardian,
                        age: item.age,
                        phone: item.phone,
                        address: item.group + ',' + item.address
                    }, { new: true, upsert: true });
                    const noOfInstallment = Math.ceil(item.loanAmt / item.installment_amt);
                    let overAmt = (noOfInstallment * item.installment_amt) > item.loanAmt ? item.loanAmt - ((noOfInstallment - 1) * item.installment_amt) : 0;
                    const installment_start_date = (0, helper_1.excelDateToJSDate)(item.installment_start_date);
                    const createdLoan = new loan_model_1.default({
                        downpayment: item.advance,
                        totalAmt: item.totalAmt,
                        loanAmt: item.loanAmt,
                        extra: 0,
                        installment_duration: '1Y',
                        installment_interval: item.installment_interval,
                        installment_amt: item.installment_amt,
                        installment_start_date: installment_start_date,
                        noOfInstallment: noOfInstallment,
                        precollection_amt: item.precollection_amt,
                        customer: customer._id,
                        createdBy: req.userId,
                        sanctioned_date: (0, helper_1.excelDateToJSDate)(item.sanctioned_date),
                        product: item.Product
                    });
                    const loan = yield createdLoan.save();
                    const installmentDates = yield (0, helper_1.generateDateSet)(installment_start_date, item.installment_interval, noOfInstallment, overAmt, item.installment_amt);
                    const installments = yield installmentDates.map((emi, index) => {
                        return {
                            loanId: loan._id,
                            installment_date: emi.date,
                            installmentAmt: emi.emi,
                            installmentNo: (index + 1),
                            status: 'active'
                        };
                    });
                    yield installment_model_1.default.insertMany(installments);
                })));
                const modifyJson = jsonData.map((item) => {
                    return Object.assign(Object.assign({}, item), { sanctioned_date: (0, helper_1.excelDateToJSDate)(item.sanctioned_date), installment_start_date: (0, helper_1.excelDateToJSDate)(item.installment_start_date) });
                });
                res.status(200).send(modifyJson);
            }
            catch (error) {
                res.status(500).send({ msg: 'Error importing data: ' + error.message });
            }
        });
    }
}
exports.LoanController = LoanController;
