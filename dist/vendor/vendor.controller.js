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
exports.VendorController = void 0;
const address_model_1 = require("../address/address.model");
const vendor_model_1 = require("./vendor.model");
class VendorController {
    constructor() {
    }
    /**
     *
     * @param req
     * @param res
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const createdAddress = address_model_1.Address.build(req.body.address);
                let objectId = yield createdAddress.save();
                const { shopName, email, contact, ownerName, password, cardType, identityNo, address, services, experts } = req.body;
                const createdVendor = vendor_model_1.Vendor.build({
                    shopName,
                    email,
                    contact,
                    ownerName,
                    password,
                    cardType,
                    identityNo,
                    address: objectId,
                    services,
                    experts,
                    noOfSeats: 0
                });
                yield createdVendor.save();
                res.status(200).json(Object.assign({ error: false }, createdVendor));
            }
            catch (error) {
                if (error.code === 11000 || error.code === 11001) {
                    res.status(200).json({
                        error: true,
                        message: 'Email number already in use. Please choose another email.'
                    });
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
    getVendors(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vendors = yield vendor_model_1.Vendor.find({}, '-password').populate('address');
                res.status(200).send(vendors);
            }
            catch (error) {
                res.status(200).send(error);
            }
        });
    }
}
exports.VendorController = VendorController;
