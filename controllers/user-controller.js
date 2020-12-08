const userModel = require('../models/userModel');
const tokenService = require('../services/token-service');

exports.register = async (req, res) => {
    const {userName, email, password} = req.body;
    if (await userModel.findOne({email})) {
        res.status(400).send("Email is already taken.");
        return;
    }
    const newUser = new userModel({username: userName, email: email, password: password});
    const {_id} = await newUser.save();
    if (_id) {
        res.status(201).send(tokenService.sign(_id));
    } else {
        res.status(500).send("Error when saving user.");
    }
}

exports.login = async (req, res) => {
    if (req.isAuthenticated()) {
        const {_id} = req.user;
        const token = tokenService.sign(_id);
        req.user.token = token;
        await req.user.save();
        res.status(200).send(token);
    } else {
        res.status(500).send("Invalid user.");
    }
}