const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique:true,
    },
    password: {
        type: String,
        required: true,
    },
    email:{
        type:String,
        require:true,
        unique:true,
    },
    rating:{
        type:Number,
        required:true,
    },
    
});

module.exports = User = mongoose.model("user",userSchema);