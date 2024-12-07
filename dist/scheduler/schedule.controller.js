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
const loan_model_1 = __importDefault(require("../loan/loan.model"));
const ProcessEMI_model_1 = __importDefault(require("../loan/ProcessEMI.model"));
const installment_model_1 = __importDefault(require("../loan/installment.model"));
const customer_model_1 = __importDefault(require("../customer/customer.model"));
class SchedulerController {
    runScheduleLoan(req, res) {
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
                    }
                ]);
                const loanIds = loansWithAllPaidInstallments.map(loan => loan._id);
                const updateResult = yield loan_model_1.default.updateMany({ _id: { $in: loanIds } }, { $set: { status: 'closed' } } // Example: Updating status to 'completed'
                );
                res.status(200).send({ msg: "Loan Has Been Stabled Succesfully" });
            }
            catch (error) {
                res.status(400).json(error);
            }
        });
    }
    markAsPaid(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const listProcessing = yield ProcessEMI_model_1.default.find({});
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
                res.status(200).json({ msg: "Process EMI mark as paid" });
            }
            catch (error) {
                res.status(400).json(error);
            }
        });
    }
    markAllCustomersInactiveIfNoActiveLoans(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find all customers
                const customers = yield customer_model_1.default.find({ status: 'active' });
                // Array to keep track of updated customers
                const updatedCustomers = [];
                for (const customer of customers) {
                    // Check if the customer has any active loans
                    const hasActiveLoans = yield loan_model_1.default.exists({ customer: customer._id, status: 'active' });
                    // If no active loans, update customer status to inactive
                    if (!hasActiveLoans) {
                        yield customer_model_1.default.findByIdAndUpdate(customer._id, { status: 'in-active' });
                        updatedCustomers.push(customer._id);
                    }
                }
                res.status(200).json({
                    message: 'All customers without active loans have been marked as inactive',
                    updatedCustomers,
                });
            }
            catch (error) {
                res.status(500).json({ message: 'Error updating customer statuses', error });
            }
        });
    }
}
exports.default = SchedulerController;
