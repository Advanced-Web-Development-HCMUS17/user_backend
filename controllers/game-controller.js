const gameModel = require('../models/gameModel.js');
const gameServices = require('../services/game-service.js');
exports.create = async (req, res) => {
    let { roomId, user1, user2} = req.body;
    if (await gameModel.findOne({ roomId: roomId })) {
        res.status(400).json({ message: "There is already a room with the same ID" });
        return;
    }
    let date = new Date();
    let userFirst,userSecond;
    const random = gameServices.getRandom(1,2);
    if (random===1)
    {
        userFirst = user1;
        userSecond = user2;
    }
    else {
        userFirst = user2;
        userSecond = user1;
    }
    const newGame = new gameModel({
        roomId: roomId,
        user1: userFirst,
        user2: userSecond,
        history: null,
        date: date,
        userTurn: null,
        winner: null
    });
    let savedGame = await newGame.save();
    if (savedGame._id) {
        res.status(201).json({ 
            message: 'Success',
            userFirst:userFirst
         });
    }
    else {
        res.status(400), json({ message: 'Error when saving game' });
    }
}

exports.save = async (req, res) => {
    const { roomId, username, move } = req.body;
    const game = await gameModel.findOne({ roomId: roomId });
    let filter;
    let userTurn;
    let newHistory;
    if (game) {
        if (game.user1 === username)
        {
            userTurn = game.user2;
        }
        else if (game.user2 == username)
        {
            userTurn = game.user1;
        }
        if (!game.history) {
            newHistory = Array(1).fill(move);
        }
        else {
            newHistory = game.history.slice(0,game.history.length);
            newHistory.push(move);
        }
        filter = {
            history:newHistory,
            userTurn:userTurn
        }
    }
}

exports.isMyTurn = async (req, res) => {
    const { roomId, username } = req.body;
    const game = await gameModel.findOne({ roomId: roomId });
    if (game) {
        if (game.userNow === username) {
            res.status(201).json(true);
        }
        else {
            res.status(401).json(false);
        }
    }
    else {
        res.status(400).json("There is no room with this ID");
    }
}