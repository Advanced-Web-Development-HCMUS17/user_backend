require("dotenv").config({
  path: './.env.example',
});

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('./models/connect.js');
const cors = require('cors');
var app = express();
const PORT = process.env.PORT || 5000;
const http = require('http');
const Socket = require("socket.io");
const passport = require('./middleware/passport');
const {User} = require('./models/userModel');


const server = http.createServer(app);
// const io = new Socket.Server(server, {
//   cors: {
//     origin: "*"
//   }
// });

const usersRouter = require('./routes/user-route');
const adminRouter = require('./routes/adminRoute');

const io = Socket(server, {
  path: '/socket.io',
  cors:
    {origin: "*"}
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(cors());
app.use(passport.initialize());
app.options("*", cors());

app.set('io', io);
require('./socket/index')(app);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.get('/leaderboard', async (req, res) => {
  const ldb = await User.find().sort([['rating', -1]]).limit(15).lean();
  res.json(ldb);
});

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// //error handler
// app.use(function (err, req, res) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });


//server.listen(PORT, () => console.log(`This server has started on port ${PORT}`));
module.exports = server;
