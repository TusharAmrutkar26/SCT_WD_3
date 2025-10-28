/* script.js - Tic Tac Toe Neon
   Player X and O, toggles PvP / PvC
   AI uses minimax for optimal play.
*/

const boardEl = document.getElementById('board');
const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('modeLabel');
const resetBtn = document.getElementById('resetBtn');
const firstSelect = document.getElementById('firstSelect');
const statusEl = document.getElementById('status');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDEl = document.getElementById('scoreD');
const winLineEl = document.getElementById('winLine');

let board = Array(9).fill(null); // indices 0..8
let currentPlayer = 'X';
let gameActive = true;
let vsComputer = false;
let scores = { X: 0, O: 0, D: 0 };

// winning combos
const WIN_COMBOS = [
  [0,1,2],
  [3,4,5],
  [6,7,8],
  [0,3,6],
  [1,4,7],
  [2,5,8],
  [0,4,8],
  [2,4,6]
];

// create cells
function createBoardUI(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', onCellClick);
    const mark = document.createElement('div');
    mark.classList.add('mark');
    cell.appendChild(mark);
    boardEl.appendChild(cell);
  }
}
createBoardUI();

// audio via WebAudio (no external files)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function clickSound(){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type='sine'; o.frequency.value = 520;
  g.gain.value = 0.02;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime+0.06);
}
function winSound(){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type='sawtooth';
  o.frequency.setValueAtTime(300, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.35);
  g.gain.value = 0.04;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime+0.35);
}

// handle toggles
modeToggle.addEventListener('change', ()=>{
  vsComputer = modeToggle.checked;
  modeLabel.textContent = vsComputer ? 'Player vs Computer' : 'Player vs Player';
  restart();
});
firstSelect.addEventListener('change', ()=>{
  restart();
});
resetBtn.addEventListener('click', ()=>{
  restart(true);
});

// cell click handler
function onCellClick(e){
  if(!gameActive) return;
  const idx = Number(e.currentTarget.dataset.index);
  // if spot occupied
  if(board[idx]) return;
  // if vsComputer and it's computer's turn, block clicks
  if(vsComputer && currentPlayer === 'O' && isComputerTurn()) return;

  makeMove(idx, currentPlayer);
  clickSound();
  afterMoveActions();
}

function makeMove(idx, player){
  board[idx] = player;
  const cell = boardEl.querySelector(`.cell[data-index="${idx}"]`);
  const mark = cell.querySelector('.mark');
  mark.textContent = player;
  mark.classList.remove('x','o');
  mark.classList.add(player.toLowerCase());
  // small pop effect
  mark.style.transform = 'scale(1.06)';
  setTimeout(()=> mark.style.transform = '', 150);
}

function afterMoveActions(){
  const result = checkWinner(board);
  if(result.winner){
    endGame(result);
    return;
  }
  if(board.every(Boolean)){
    // draw
    gameActive = false;
    statusEl.textContent = 'Draw!';
    scores.D++;
    updateScores();
    playDrawEffect();
    return;
  }
  // switch
  currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
  statusEl.textContent = `${currentPlayer}'s turn`;
  // if vsComputer and it's computer's move, let AI play
  if(vsComputer && isComputerTurn() && gameActive){
    // slight delay for realism
    setTimeout(()=> {
      const aiIdx = computeBestMove(board, 'O');
      makeMove(aiIdx, 'O');
      clickSound();
      afterMoveActions();
    }, 360 + Math.random()*220);
  }
}

function isComputerTurn(){
  return vsComputer && currentPlayer === getAIPlayer();
}

function getAIPlayer(){
  // computer always plays O here (we set in UI)
  // but allow user to choose O to start
  return 'O';
}

// check winner util
function checkWinner(b){
  for(const combo of WIN_COMBOS){
    const [a,b1,c] = combo;
    if(board[a] && board[a] === board[b1] && board[a] === board[c]){
      return { winner: board[a], combo };
    }
  }
  return { winner: null };
}

function endGame(result){
  gameActive = false;
  const winner = result.winner;
  statusEl.textContent = `${winner} wins!`;
  highlightWin(result.combo);
  winSound();
  scores[winner]++;
  updateScores();
}

// highlight winning cells and draw animated SVG line
function highlightWin(combo){
  // mark winning cells
  combo.forEach(i => {
    const cell = boardEl.querySelector(`.cell[data-index="${i}"]`);
    if(cell) cell.classList.add('win');
  });

  // draw an svg line across the board
  drawWinSVG(combo);
}

function drawWinSVG(combo){
  // compute cell centers relative to boardEl
  const rect = boardEl.getBoundingClientRect();
  const cols = 3;
  const size = boardEl.querySelector('.cell').getBoundingClientRect();
  const cellW = size.width;
  const cellH = size.height;
  const gapX = parseFloat(getComputedStyle(boardEl).gap || 16);
  const gapY = gapX;
  // calculate center for index
  const center = (index) => {
    const row = Math.floor(index/3);
    const col = index%3;
    const x = (col * (cellW + gapX)) + cellW/2 + 18; // 18 = board padding
    const y = (row * (cellH + gapY)) + cellH/2 + 18;
    return [x, y];
  };
  const [x1,y1] = center(combo[0]);
  const [x2,y2] = center(combo[2]);

  // create svg
  const ns = "http://www.w3.org/2000/svg";
  winLineEl.innerHTML = '';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${boardEl.clientWidth} ${boardEl.clientHeight}`);
  const line = document.createElementNS(ns,'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x1);
  line.setAttribute('y2', y1);
  line.setAttribute('stroke-linecap','round');
  line.setAttribute('stroke-width', 6);
  line.setAttribute('stroke', 'url(#grad)');
  line.setAttribute('filter','url(#glow)');
  svg.appendChild(line);

  // gradient
  const defs = document.createElementNS(ns,'defs');
  const grad = document.createElementNS(ns,'linearGradient');
  grad.setAttribute('id','grad');
  grad.setAttribute('x1','0%'); grad.setAttribute('y1','0%'); grad.setAttribute('x2','100%'); grad.setAttribute('y2','0%');
  const stop1 = document.createElementNS(ns,'stop'); stop1.setAttribute('offset','0%'); stop1.setAttribute('stop-color',getComputedStyle(document.documentElement).getPropertyValue('--neon1').trim());
  const stop2 = document.createElementNS(ns,'stop'); stop2.setAttribute('offset','100%'); stop2.setAttribute('stop-color',getComputedStyle(document.documentElement).getPropertyValue('--neon2').trim());
  grad.appendChild(stop1); grad.appendChild(stop2);

  const filt = document.createElementNS(ns,'filter'); filt.setAttribute('id','glow');
  const fe = document.createElementNS(ns,'feGaussianBlur'); fe.setAttribute('stdDeviation','6'); fe.setAttribute('result','coloredBlur');
  filt.appendChild(fe);
  defs.appendChild(grad);
  defs.appendChild(filt);
  svg.appendChild(defs);

  winLineEl.appendChild(svg);

  // animate to target
  setTimeout(()=> {
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.style.transition = 'all 420ms cubic-bezier(.2,.9,.2,1)';
  }, 40);

  // remove line after some time
  setTimeout(()=> { winLineEl.innerHTML = ''; }, 2400);
}

function playDrawEffect(){
  // small fade effect on board
  boardEl.animate([{opacity:1},{opacity:0.6},{opacity:1}], {duration:600, easing:'ease', iterations:1});
}

// update scores UI
function updateScores(){
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDEl.textContent = scores.D;
}

// restart game: clear board
function restart(fullReset=false){
  board = Array(9).fill(null);
  currentPlayer = firstSelect.value || 'X';
  gameActive = true;
  statusEl.textContent = `${currentPlayer}'s turn`;
  // clear cells
  boardEl.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('win');
    const m = c.querySelector('.mark');
    m.textContent = '';
    m.classList.remove('x','o');
  });
  winLineEl.innerHTML = '';
  if(fullReset){
    scores = { X:0, O:0, D:0 };
    updateScores();
  }
  // if computer should start
  if(vsComputer && isComputerTurn()){
    setTimeout(()=> {
      const aiIdx = computeBestMove(board, 'O');
      makeMove(aiIdx, 'O');
      clickSound();
      afterMoveActions();
    }, 260);
  }
}

/* ---------- AI (Minimax) ---------- */
/* We use simple minimax with depth to choose best move for O (computer).
   For performance on 3x3 it's trivial; returns index.
*/
function computeBestMove(b, aiPlayer){
  // available spots
  const avail = b.map((v,i)=> v?null:i).filter(v=>v!==null);
  // if only one spot, return it
  if(avail.length === 1) return avail[0];

  // minimax
  function minimax(newBoard, player){
    const availSpots = newBoard.map((v,i)=> v?null:i).filter(v=>v!==null);
    const winner = checkWinner(newBoard).winner;
    if(winner === aiPlayer) return {score: 10};
    if(winner && winner !== aiPlayer) return {score: -10};
    if(availSpots.length === 0) return {score: 0};

    const moves = [];
    for(const i of availSpots){
      const move = {};
      move.index = i;
      newBoard[i] = player;
      const result = minimax(newBoard, player === 'X' ? 'O' : 'X');
      move.score = result.score;
      newBoard[i] = null;
      moves.push(move);
    }

    // choose best
    let bestMove;
    if(player === aiPlayer){
      let bestScore = -Infinity;
      for(const m of moves) if(m.score > bestScore){ bestScore = m.score; bestMove = m; }
    } else {
      let bestScore = Infinity;
      for(const m of moves) if(m.score < bestScore){ bestScore = m.score; bestMove = m; }
    }
    return bestMove;
  }

  // if center free, prefer it
  if(b[4] === null) return 4;
  const best = minimax(b.slice(), aiPlayer);
  return best.index;
}

/* initialize */
updateScores();
statusEl.textContent = `${currentPlayer}'s turn`;
