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
const user_model_1 = __importDefault(require("./user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_device_model_1 = __importDefault(require("./user-device.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_production_1 = require("../config/config.production");
const twilio_1 = require("twilio");
class UserController {
    /**
     *
     * @param req
     * @param res
     */
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { firstName, lastName, role, gender, dob, phone, email, password } = req.body;
                const existingUser = yield user_model_1.default.findOne({ email: email });
                if (existingUser) {
                    res.status(500).json({ error: 'Email already exists' });
                }
                else {
                    const user = new user_model_1.default({ firstName, lastName, role, gender, dob, phone, email, password });
                    yield user.save();
                    res.status(201).json(user);
                }
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    /**
     *
     * @param req
     * @param res
     */
    getUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params; // Get the user ID from the request params
                const user = yield user_model_1.default.findById(id).select('-password'); // Fetch the user by ID from the database
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.status(200).json(user);
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
    saveToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const firebaseToken = req.body.firebaseToken;
                const userDevice = yield user_device_model_1.default.find({ firebaseToken: firebaseToken, userId: userId });
                if (userDevice.length > 0) {
                    res.status(200).json({ device: userDevice, msg: "token already updated" });
                }
                else {
                    const { deviceId, firebaseToken, latitude, longitude } = req.body;
                    const newEntry = new user_device_model_1.default({ userId, deviceId, firebaseToken, latitude, longitude });
                    yield newEntry.save();
                    res.status(200).json(newEntry);
                }
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
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '10', sort, search = '', status, sortBy, } = req.query;
                const pageNumber = parseInt(page, 10);
                const limitNumber = parseInt(limit, 10);
                const sortObject = {};
                let filter = {
                    status: status
                };
                if (sort) {
                    sortObject[sortBy] = sort === 'asc' ? 1 : -1;
                }
                let searchsString = req.query.search ? req.query.search.toString() : '';
                if (searchsString != '') {
                    filter['firstName'] = { $regex: search, $options: 'i' };
                }
                //const users: UserType[] = await User.find(filter, '-password');
                const users = yield user_model_1.default.aggregate([
                    {
                        $match: filter
                    },
                    { $sort: sortObject },
                    {
                        $skip: (pageNumber - 1) * limitNumber
                    },
                    {
                        $limit: limitNumber
                    }
                ]);
                const totalData = yield user_model_1.default.countDocuments(filter);
                res.json({
                    data: users,
                    currentPage: pageNumber,
                    totalCount: totalData,
                    totalPages: Math.ceil(totalData / limitNumber),
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    /**
     * @param req
     * @param res
     */
    getUserProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (userId) {
                    let loginUser = yield user_model_1.default.findById(userId, '-password');
                    res.status(200).send(loginUser);
                }
                else {
                    res.status(400).send("UserId not available");
                }
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
    changePwd(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { currentPassword, newPassword } = req.body;
                if (userId) {
                    const user = yield user_model_1.default.findById(userId);
                    if (!user) {
                        res.status(400).json({ error: 'User Does Not Exist' });
                        return;
                    }
                    const passwordMatch = yield user.comparePassword(currentPassword);
                    if (!passwordMatch) {
                        res.status(400).json({ error: 'Current Password Is Not Correct' });
                    }
                    if (passwordMatch) {
                        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
                        user.password = hashedPassword;
                        const modifiedUser = yield user.save();
                        res.status(200).send(modifiedUser);
                    }
                }
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
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                try {
                    const result = yield user_model_1.default.findOneAndUpdate({ _id: id }, 
                    // Use $unset to delete the status field
                    // Use $set to set it to null
                    { $set: { status: 'deleted' } }, { new: true });
                    if (result) {
                        res.status(200).json(result);
                    }
                    else {
                        res.status(400).json({ msg: 'User not found' });
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
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const updateData = req.body; // Get updated data from request body
                // Exclude fields like password from being updated directly
                if (updateData.password) {
                    return res.status(400).json({ message: "Password cannot be updated here." });
                }
                // Update the user by ID, return the updated document
                const user = yield user_model_1.default.findByIdAndUpdate(id, updateData, {
                    new: true,
                    runValidators: true, // Ensure validation rules are applied to updates
                }).select('-password'); // Exclude password from the response
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                res.status(200).json(user);
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
    undo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                try {
                    const result = yield user_model_1.default.findOneAndUpdate({ _id: id }, 
                    // Use $unset to delete the status field
                    // Use $set to set it to null
                    { $set: { status: 'active' } }, { new: true });
                    if (result) {
                        res.status(200).json(result);
                    }
                    else {
                        res.status(400).json({ msg: 'User not found' });
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
     * @returns
     */
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                console.log(email, password);
                // Find user by email
                const user = yield user_model_1.default.findOne({ email });
                if (!user) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                // Compare passwords
                const passwordMatch = yield user.comparePassword(password);
                if (!passwordMatch) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                if (user.status != 'active') {
                    res.status(401).json({ error: 'Your Account Is Blocked. Please Contact Admin' });
                }
                // Generate and return JWT token
                const secretKey = process.env.APP_SECRET_KEY || config_production_1.environment.APP_SECRET_KEY;
                const token = jsonwebtoken_1.default.sign({ userId: user._id }, secretKey); //{ expiresIn: '200h' }
                res.status(200).json({ token, user });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    sendOTP(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phone } = req.body;
            try {
                const user = yield user_model_1.default.findOne({ phone });
                if (!user) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                const otp = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
                const updatedUser = yield user_model_1.default.findByIdAndUpdate(user._id, { otp: otp }, { new: true });
                const accountSid = process.env.TWILLO_ACC_ID;
                const authToken = process.env.TWILLO_AUTH_TOKEN;
                const client = new twilio_1.Twilio(accountSid, authToken);
                const sendList = yield client.messages
                    .create({
                    body: 'Your login OTP ' + otp,
                    to: '+91' + phone,
                    from: process.env.TWILLO_PHONE // Your Twilio phone number (include country code)
                });
                res.status(200).send({ msg: "OTP has been send" });
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
    loginWithOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phone, otp } = req.body;
                const user = yield user_model_1.default.findOne({ phone });
                if (!user) {
                    res.status(401).json({ error: 'User does not exist' });
                    return;
                }
                if (user.otp != otp) {
                    res.status(401).json({ error: 'Invalid OTP' });
                    return;
                }
                // Generate and return JWT token
                const token = jsonwebtoken_1.default.sign({ userId: user._id }, 'swapneralo'); //{ expiresIn: '200h' }
                res.status(200).json({ token });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.default = UserController;
