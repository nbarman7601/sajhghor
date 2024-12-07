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
exports.GroupController = void 0;
const group_model_1 = require("./group.model");
const customer_model_1 = __importDefault(require("../customer/customer.model"));
class GroupController {
    /**
     *
     * @param req
     * @param res
     */
    listGroup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '25', search = '', status = 'active' } = req.query;
                //const listGroup = await Group.find({status: 'active'}).populate('lo');
                let filter = {
                    status: status
                };
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                if (search != '') {
                    filter['name'] = { $regex: search, $options: 'i' };
                }
                const totalData = yield group_model_1.Group.countDocuments(filter);
                let groups = yield group_model_1.Group.aggregate([
                    { $match: filter },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'lo',
                            foreignField: '_id',
                            as: 'loDetails'
                        }
                    },
                    { $unwind: { path: '$loDetails', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: '_id',
                            foreignField: 'group',
                            as: 'customers',
                        },
                    },
                    //   { $unwind: { path: '$customer_details', preserveNullAndEmptyArrays: true } },
                    {
                        $addFields: {
                            lo: {
                                $cond: {
                                    if: { $and: ['$loDetails.firstName', '$loDetails.lastName'] },
                                    then: { $concat: ['$loDetails.firstName', ' ', '$loDetails.lastName'] },
                                    else: null
                                }
                            },
                        }
                    },
                    {
                        $skip: (pageNumber - 1) * limitNumber
                    },
                    {
                        $limit: limitNumber
                    },
                    {
                        $project: {
                            loDetails: 0
                        }
                    }
                ]);
                if (!groups.length) {
                    return res.status(200).json({
                        total: 0,
                        page: Number(page),
                        pageSize: Number(limit),
                        totalPages: 0,
                        data: [],
                    });
                }
                //   const listGroups = await Promise.all( groups.map(async (group: any) => {
                //             const customers = await Customer.find({ group: group._id });
                //             return { ...group.toObject(), customers };
                //   }));
                res.status(200).json({
                    currentPage: pageNumber,
                    totalCount: totalData,
                    totalPages: Math.ceil(totalData / limitNumber),
                    data: groups,
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
    createGroup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let createdGroup = new group_model_1.Group({
                    name: req.body.name,
                    weekday: req.body.weekday,
                    status: 'active',
                    lo: req.body.lo
                });
                yield createdGroup.save();
                res.status(200).json(createdGroup);
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
    getSpecificGroup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let groupId = req.params.id;
            console.log(groupId);
            try {
                let group = yield group_model_1.Group.findById(groupId);
                res.status(200).send(group);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    updateGrp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let groupId = req.params.id;
            try {
                const group = yield group_model_1.Group.findByIdAndUpdate(groupId, { name: req.body.name, weekday: req.body.weekday, lo: req.body.lo }, { new: true });
                res.status(200).send(group);
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
    deleteGrp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let groupId = req.params.id;
            console.log(groupId);
            try {
                const customers = yield customer_model_1.default.find({ group: groupId });
                if (customers.length > 0) {
                    res.status(400).json({
                        msg: "Group has active customer. Can not be deleted"
                    });
                }
                else {
                    const group = yield group_model_1.Group.findByIdAndDelete(groupId);
                    res.status(200).send(group);
                }
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
    }
}
exports.GroupController = GroupController;
