const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    user1: {
        type: String,
        required: true,
    },
    user2: {
        type: String,
        required: true,
    },
    history:[{
        type:Number,
    }],
    date:{
        type:Date,
    },
    winner:{
        type:String,
    }
});

module.exports = Game = mongoose.model("game",gameSchema);