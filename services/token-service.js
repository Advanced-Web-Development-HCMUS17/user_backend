require('dotenv').config();
const JWT = require('jsonwebtoken');

exports.sign = (user) => {
  return "Bearer " + JWT.sign({sub: user}, process.env.JWT_SECRETKEY, {expiresIn: "1 day"});
}

exports.verify = (token) => {
  try {
    if (token) {
      return JWT.verify(token.replace("Bearer ", ""), process.env.JWT_SECRETKEY);
    }
    return null;
  } catch (e) {
    return null;
  }
}
