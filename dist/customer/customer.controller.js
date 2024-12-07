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
const customer_model_1 = __importDefault(require("./customer.model"));
const address_model_1 = require("../address/address.model");
const loan_model_1 = __importDefault(require("../loan/loan.model"));
const group_model_1 = require("../groups/group.model");
const mongoose_1 = __importDefault(require("mongoose"));
class CustomerController {
    /**
     *
     * @param req
     * @param res
     */
    getCustomers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '25', search = '', status = 'active', sort = 'name', sortBy = 'asc' } = req.query;
                //const listGroup = await Group.find({status: 'active'}).populate('lo');
                let filter = {
                    status: status
                };
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                if (search != '') {
                    filter['name'] = { $regex: search, $options: 'i' };
                }
                // const customers = 
                //  await Customer.find({ status: req.query.status })
                // .populate('group')
                // .populate('addedBy')
                // .populate('verifiedBy')
                // .sort({name: 1});
                const sortObject = {};
                if (sort) {
                    sortObject[sortBy] = sort === 'asc' ? 1 : -1;
                }
                const totalData = yield customer_model_1.default.countDocuments(filter);
                const customers = yield customer_model_1.default.aggregate([
                    {
                        $match: filter
                    },
                    {
                        $lookup: {
                            from: 'groups',
                            localField: 'group',
                            foreignField: '_id',
                            as: 'group'
                        }
                    },
                    { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } },
                    { $sort: sortObject },
                    {
                        $skip: (pageNumber - 1) * limitNumber
                    },
                    {
                        $limit: limitNumber
                    }
                ]);
                res.json({
                    data: customers,
                    currentPage: pageNumber,
                    totalCount: totalData,
                    totalPages: Math.ceil(totalData / limitNumber),
                });
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    getCustomer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const customer = yield customer_model_1.default.findById(id)
                    // .populate('address')
                    .populate('group');
                const loans = yield loan_model_1.default.aggregate([
                    {
                        $match: { customer: new mongoose_1.default.Types.ObjectId(id) }
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
                    }
                ]);
                res.status(200).json({ customer, loans });
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
    createCustomer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, identityProof, identityNo, guardian, age, phone, address, group } = req.body;
                console.log(req.body);
                const groupId = yield group_model_1.Group.findById(group);
                const createdCustomer = new customer_model_1.default({
                    name,
                    identityProof,
                    identityNo,
                    guardian,
                    age,
                    phone,
                    group: groupId,
                    verifiedBy: req.userId,
                    address: address,
                    addedBy: req.userId
                });
                yield createdCustomer.save();
                res.status(200).json(createdCustomer);
            }
            catch (error) {
                if (error.code === 11000 || error.code === 11001) {
                    res.status(400).json({ error: 'Indentity number already in use. Please choose another number.' });
                }
                else {
                    res.status(500).send(error);
                }
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    updateCustomer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                // const seletedAddress = Address.findById(req.body.address._id);
                const { name, identityProof, identityNo, guardian, age, phone, group, address } = req.body;
                const groupId = yield group_model_1.Group.findById(group);
                const customerUpdated = yield customer_model_1.default.findByIdAndUpdate(id, {
                    name,
                    identityProof,
                    identityNo,
                    guardian,
                    age,
                    phone,
                    group: groupId,
                    address
                }, { new: true });
                res.status(200).json(customerUpdated);
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
    markVerified(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                try {
                    const result = yield customer_model_1.default.findOneAndUpdate({ _id: id }, 
                    // Use $unset to delete the status field
                    // Use $set to set it to null
                    { $set: { isverified: true, verifiedBy: req.userId } }, { new: true });
                    if (result) {
                        res.status(200).json(result);
                    }
                    else {
                        res.status(400).json({ msg: 'Customer not found' });
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
    deleteCustomer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                try {
                    // const result = await Customer.findOneAndUpdate(
                    //   { _id: id },
                    //   // Use $unset to delete the status field
                    //   // Use $set to set it to null
                    //   { $set: { status: 'deleted' } },
                    //   { new: true }
                    // );
                    const selectedCustomer = yield customer_model_1.default.findById(id);
                    // console.log(selectedCustomer);
                    const hasLoans = yield loan_model_1.default.exists({ customer: id });
                    if (hasLoans) {
                        return res.status(400).json({ msg: 'label.msg.5002', child: selectedCustomer });
                    }
                    const deletedCustomer = yield customer_model_1.default.findByIdAndDelete(id);
                    if (!deletedCustomer) {
                        return res.status(404).json({ error: 'Customer not found' });
                    }
                    res.json({ message: 'Customer deleted successfully' });
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
    migrateData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customers = yield customer_model_1.default.find({});
                for (const customer of customers) {
                    // Retrieve the address from the Address collection using the addressId or directly from the customer document if embedded
                    const address = yield address_model_1.Address.findById(customer.address);
                    // Combine address fields
                    const combinedAddress = `${address === null || address === void 0 ? void 0 : address.address1}, ${address === null || address === void 0 ? void 0 : address.address2}, ${address === null || address === void 0 ? void 0 : address.city}, ${address === null || address === void 0 ? void 0 : address.police_station}, ${address === null || address === void 0 ? void 0 : address.post_office}, ${address === null || address === void 0 ? void 0 : address.city}, ${address === null || address === void 0 ? void 0 : address.zipCode}`;
                    // Update the customer document with the combined address
                    yield customer_model_1.default.findByIdAndUpdate(customer._id, { address: combinedAddress });
                }
                res.status(200).send({ msg: 'DONE' });
            }
            catch (error) {
                console.error('Error during migration:', error);
                res.status(500).send({ msg: 'DONE' });
            }
        });
    }
}
exports.default = CustomerController;
