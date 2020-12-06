const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex:true,
},
    (err) => {
        if (err) throw err;
        else {
            console.log("MongoDB connection established");
        }
    });

    module.exports = mongoose;