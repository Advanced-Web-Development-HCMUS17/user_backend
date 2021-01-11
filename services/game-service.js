
const gameModel = require('../models/gameModel');

const COUNT2WIN = 5;

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
  return savedGame;
}

async function saveGame(roomId, history, winner, chats) {
  const update = {
    history: history,
    winner: winner,
    chat: chats
  }

  const thisGame = await gameModel.findOneAndUpdate({ roomId: roomId }, update);
  return thisGame;
}

async function getGames(username)
{
  const filter1 = {
    user1: username
  };
  const filter2 = {
    user2: username
  };
  const games1 = await gameModel.find(filter1);
  const games2 = await gameModel.find(filter2);
  if (games1 && games2)
  {
    const games = games1.concat(games2);
    console.log(games);
    
    return games;
  }
  else if (games1)
  {
    return games1;
  }
  else if (games2) {
    return games2;
  }
  else return null;
}
const gameServices = { calculateWinner, refactorArray, getRandom, checkHistory, createGame, saveGame, getGames};

module.exports = gameServices;