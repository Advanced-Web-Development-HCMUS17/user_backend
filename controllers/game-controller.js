const gameModel = require('../models/gameModel.js');
const gameServices = require('../services/game-service.js');


exports.create = async (req, res) => {
    let { roomId, user1, user2 } = req.body;
    if (await gameModel.findOne({ roomId: roomId })) {
        res.status(400).json({ message: "There is already a room with the same ID" });
        return;
    }
    console.log("Yess");
    let date = new Date();
    let userFirst, userSecond;
    const random = gameServices.getRandom(1, 2);
    if (random === 1) {
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
        userTurn: userFirst,
        winner: null
    });
    let savedGame = await newGame.save();
    if (savedGame._id) {
        res.status(201).json({
            message: 'Room was created sucessfully',
        });
    }
    else {
        res.status(400), json({ message: 'Error when creating room' });
    }
}

exports.save = async (req, res) => {
    const { roomId, username, move, row } = req.body;
    const game = await gameModel.findOne({ roomId: roomId });
    let update;
    let userTurn;
    let newHistory;
    let winner, winChain;
    if (game) {
        if (game.user1 === username) {
            userTurn = game.user2;
        }
        else if (game.user2 == username) {
            userTurn = game.user1;
        }

        if (!game.history) {
            newHistory = Array(1).fill(move);
        }
        else {
            newHistory = game.history.slice(0, game.history.length);
            newHistory.push(move);
            // xu li thang thua
            const { winner, winChain } = gameServices.calculateWinner(gameServices.refactorArray(newHistory, row), row);
            if (winner && winChain) {
                winner = username;
            }
            else {
                winner = null;
                winChain = null;
            }
        }
        update = {
            history: newHistory,
            userTurn: userTurn,
            winner: winner
        }
        const savedGame = await gameModel.findOneAndUpdate({ roomId: roomId }, update);
        res.status(201).json({
            newHistory: newHistory,
            winner: winner,
            winChain: winChain
        })
    }
    else {
        res.status(400).json({
            message: "Cannot find the room with this ID",
        });
    }
}

exports.isMyTurn = async (req, res) => {
    const { roomId, username } = req.body;
    const game = await gameModel.findOne({ roomId: roomId });
    if (game) {
        if (game.userTurn === username) {
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