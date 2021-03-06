
const gameModel = require('../models/gameModel.js');
const { User } = require('../models/userModel.js');
function ulti(history, rowNow, colNow, xValue, yValue, sign, row) {
  //console.log(history)
  let i, j;
  let number;
  let array = [];
  const rowInit = rowNow - 4 * xValue;
  const colInit = colNow - 4 * yValue;
  for (i = rowInit, j = colInit, number = 0;
    Math.abs(i - rowInit) <= 8 && Math.abs(j - colInit) <= 8; i += xValue, j += yValue) {
    if (i < 0 || j < 0 || i >= row || j >= row) {
      continue;
    }
    if (history[row * i + j] === sign) {
      number++;
      array.push(row * i + j);
    } else {
      array = [];
      number = 0;
    }
    if (number === 5) {
      break;
    }
  }
  if (number === 5) {
    return array;
  } else {
    return null;
  }
}

function calculateWinner(newHistory, move, row) {
  const history = refactorArray(newHistory, row);
  const sign = history[move];
  const rowNow = Math.floor(move / row);
  const colNow = move - row * rowNow;
  const diagonal1 = ulti(history, rowNow, colNow, 1, 1, sign, row);
  if (diagonal1) {
    return diagonal1;
  } else {
    const diagonal2 = ulti(history, rowNow, colNow, -1, 1, sign, row);
    if (diagonal2)
      return diagonal2;
    else {
      const horizontal = ulti(history, rowNow, colNow, 1, 0, sign, row);
      if (horizontal) {
        return horizontal;
      } else {
        const vertical = ulti(history, rowNow, colNow, 0, 1, sign, row);
        if (vertical) {
          return vertical;
        }
      }
    }
  }
  return null;
}
function refactorArray(history, row) {
  let array = Array(row * row).fill(null);
  for (let i = 0; i < history.length; i++) {
    array[history[i]] = (i % 2 === 0) ? 'X' : 'O';
  }
  return array;
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function checkHistory(history, move) {
  for (let i = 0; i < history.length; i++) {
    if (history[i] === move) {
      return false;
    }
  }
  return true;
}


async function createGame(roomId, userFirst, userSecond) {
  const date = new Date();
  const newGame = new gameModel({
    roomId: roomId,
    user1: userFirst,
    user2: userSecond,
    history: null,
    date: date,
    winner: null
  });
  let savedGame = await newGame.save();
  console.log("Game created!!");
  return savedGame;
}

async function saveGame(roomId, history, winner, chats) {
  const update = {
    history: history,
    winner: winner,
    chat: chats
  }
  const thisGame = await gameModel.findOneAndUpdate({ roomId: roomId }, update);

  const { newRating1, newRating2 } = calculateRating(thisGame.user1.rating, thisGame.user2.rating,
    thisGame.user1.username === winner ? 1 : (thisGame.user2.username === winner) ? 3 : 2);
  await User.findOneAndUpdate({ _id: thisGame.user1._id }, { rating: newRating1 });
  await User.findOneAndUpdate({ _id: thisGame.user2._id }, { rating: newRating2 });
  return thisGame;
}

async function getGames(username) {
  console.log("find:", username);
  // const filter1 = {
  //   user1: {
  //     $elemMatch: {
  //       username: username,
  //     }
  //   }
  // };
  // const filter2 = {
  //   user2: {
  //     $elemMatch: {
  //       username: username,
  //     }
  //   }
  // };

  const games1 = await gameModel.find({ 'user1.username': username });
  const games2 = await gameModel.find({ 'user2.username': username });
  if (games1.length > 0 && games2.length > 0) {
    const games = games1.concat(games2);

    return games;
  }
  else if (games1.length > 0) {
    return games1;
  }
  else if (games2.length > 0) {
    return games2;
  }
  else return null;
}

// resultType = 1 -> user1 win
// resultType = 2 -> draw
// resultType = 3 -> user2 win
function calculateRating(rating1, rating2, resultType) {
  let newRating1, newRating2;
  let bigger = rating1 > rating2 ? rating1 : rating2;
  const threshold = bigger * 0.1;
  const distance = Math.abs(rating1 - rating2);
  let result;
  if (resultType === 1 || resultType === 3) {
    if (distance <= 0.2 * bigger) {
      result = bigger * 0.03 + distance * 0.1 <= threshold ? bigger * 0.03 + distance * 0.1 : threshold
    }
    else {
      result = bigger * 0.04 + distance * 0.1 <= threshold ? bigger * 0.04 + distance * 0.1 : threshold
    }
  }
  else {
    if (distance <= 0.2 * bigger) {
      result = distance * 0.05 <= threshold ? distance * 0.05 : threshold
    }
    else {
      result = distance * 0.08 <= threshold ? distance * 0.08 : threshold
    }
  }

  if (resultType === 1) {
    newRating1 = rating1 + result;
    newRating2 = rating2 - result;
  }
  else if (resultType === 2) {
    if (newRating1 === newRating2) {
      // do nothing
    }
    else {
      if (rating1 === bigger) {
        newRating1 = rating1 + result;
        newRating2 = rating2 - result;
      }
      else {
        newRating1 = rating1 - result;
        newRating2 = rating2 + result;
      }
    }
  }
  else {
    newRating1 = rating1 - result;
    newRating2 = rating2 + result;
  }
  newRating1 = newRating1 >= 0 ? newRating1 : 0;
  newRating2 = newRating2 >= 0 ? newRating2 : 0;
  newRating1 = Math.round(newRating1); newRating2 = Math.round(newRating2);
  return { newRating1, newRating2 };
}


const gameServices = {
  calculateWinner, refactorArray, getRandom, checkHistory, createGame, saveGame,
  getGames
};

module.exports = gameServices;
