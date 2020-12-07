const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    user1: {
        type: String,
        required: true,
    },
    user2: {
        type: String,
        required: true,
    },
    messages:[{
        type:String,
    }],
    //array of messages
    userSent:[{
        type:String,
    }]
    //array of username who sent the message 
});