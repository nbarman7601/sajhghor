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
const expert_model_1 = require("./expert.model");
const address_model_1 = require("../address/address.model");
class ExpertController {
    /**
     *
     * @param req
     * @param res
     */
    getExperts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const experts = yield expert_model_1.Expert.find({}, '-password').populate('address');
                res.status(200).json(experts);
            }
            catch (error) {
                res.status(400).send(error);
            }
        });
    }
    createExpert(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const createdAddress = address_model_1.Address.build(req.body.address);
                let objectId = yield createdAddress.save();
                console.log(req.body);
                const { salonID, firstName, middleName, lastName, gender, dateOfBirth, photoUrl, phone, password, cardType, identityNo, } = req.body;
                const createdExpert = expert_model_1.Expert.build({
                    salonID,
                    firstName,
                    middleName,
                    lastName,
                    gender,
                    dateOfBirth,
                    photoUrl,
                    phone,
                    password,
                    cardType,
                    identityNo,
                    address: objectId
                });
                yield createdExpert.save();
                res.status(200).json(createdExpert);
            }
            catch (error) {
                if (error.code === 11000 || error.code === 11001) {
                    res.status(400).json({ error: 'Phone number already in use. Please choose another number.' });
                }
                else {
                    res.status(500).json(error);
                }
            }
        });
    }
}
exports.default = ExpertController;
