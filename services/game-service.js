const COUNT2WIN = 5;

function ulti(history, rowNow, colNow, xValue, yValue, sign, row) {
  console.log(history)
  let i, j;
  let number;
  let array = [];
  for (i = rowNow - 4 * xValue, j = colNow - 4 * yValue, number = 0;
       i <= rowNow + 4 * xValue && j <= colNow + 4 * yValue; i += xValue, j += yValue) {
    console.log(`i=`, i, `j=`, j, `arr=`, array);
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

function calculateWinner1(history, move, isX, row) {
  const sign = isX ? 'X' : 'O';
  const rowNow = Math.floor(move / row);
  const colNow = move % row;
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

function calculateWinner(squares, size) {
  //Kiểm tra hàng ngang
  console.log('Mảng là: '+squares);
  for (let i = 0; i < size; i++) {
    const winRow = [];
    for (let j = 0; j < size; j++) {
      const index = i * size + j;
      if (squares[index] && squares[index] === squares[i * size]) {
        winRow.push(index);
      } else {
        break;
      }
    }
    if (winRow.length === COUNT2WIN) {
      return { winner: squares[i * size], winSquares: winRow };
    }
  }

  //Kiểm tra hàng dọc
  for (let i = 0; i < size; i++) {
    const winCol = [];
    for (let j = 0; j < size; j++) {
      const index = j * size + i;
      if (squares[index] && squares[index] === squares[i]) {
        winCol.push(index);
      } else {
        break;
      }
    }
    if (winCol.length === COUNT2WIN) {
      return { winner: squares[i], winSquares: winCol };
    }
  }

  //Kiểm tra chéo chính
  const winDiag = [];
  for (let i = 0; i < size; i++) {
    const index = i * size + i;
    if (squares[index] && squares[index] === squares[0]) {
      winDiag.push(index);
    } else {
      break;
    }
  }
  if (winDiag.length === COUNT2WIN) {
    return { winner: squares[0], winSquares: winDiag };
  }

  //Kiểm tra chéo phụ
  const winDiag2 = [];
  for (let i = 1; i <= size; i++) {
    const index = i * (size - 1);
    if (squares[index] && squares[index] === squares[size - 1]) {
      winDiag2.push(index);
    } else {
      break;
    }
  }
  if (winDiag2.length === COUNT2WIN) {
    return { winner: squares[size - 1], winSquares: winDiag2 };
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
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

const gameServices = {calculateWinner, refactorArray,getRandom};

export default gameServices;