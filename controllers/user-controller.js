const userModel = require('../models/userModel');
const tokenService = require('../services/token-service');

exports.register = async (req, res) => {
    const {userName, email, password} = req.body;
    if (await userModel.findOne({email})) {
        res.status(400).send("Email is already taken.");
        return;
    }
    const newUser = new userModel({username: userName, email: email, password: password});
    let savedUser = await newUser.save();
    savedUser.password = undefined;
    if (_id) {
        res.status(201).send(tokenService.sign(savedUser));
    } else {
        res.status(500).send("Error when saving user.");
    }
}

exports.login = async (req, res) => {
    if (req.isAuthenticated()) {
        req.user.password = undefined;
        res.status(200).send(tokenService.sign(req.user));
    } else {
        res.status(500).send("Invalid user.");
    }
}

exports.getUser = async (req, res) => {
    const {token} = req.body;
    const user = tokenService.verify(token);
    if (token && user) {
        res.status(200).send(user);
    }else{
        res.status(500).send("Invalid user.");
    }
}