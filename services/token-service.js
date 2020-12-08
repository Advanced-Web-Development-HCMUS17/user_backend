require('dotenv').config();
const JWT = require('jsonwebtoken');

exports.sign = (userID) => {
    return JWT.sign({ sub: userID }, process.env.JWT_SECRETKEY, { expiresIn: "1 day" });
}