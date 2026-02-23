const assert = require('assert');

const PIECES = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚', P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000, P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

const PST = {
    p: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

class ChessEngine {
    constructor() {
        this.reset();
    }
    reset() {
        this.board = [
            ['r','n','b','q','k','b','n','r'],
            ['p','p','p','p','p','p','p','p'],
            Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
            ['P','P','P','P','P','P','P','P'],
            ['R','N','B','Q','K','B','N','R']
        ];
        this.turn = 'white';
        this.castling = { white: { k: true, q: true }, black: { k: true, q: true } };
        this.enPassant = null;
        this.moveHistory = [];
        this.difficulty = 'normal';
        this.playerColor = 'white';
    }

    setDifficulty(l) { this.difficulty = l; }
    setPlayerColor(c) { this.playerColor = c; }
    onBoard(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    
    getColor(p) { 
        if (!p) return null;
        return p === p.toUpperCase() ? 'white' : 'black';
    }

    generateMoves(r, c, checkCastling = true) {
        const piece = this.board[r][c];
        if (!piece) return [];
        const moves = [];
        const color = this.getColor(piece);
        const type = piece.toLowerCase();
        
        const addMove = (tr, tc) => {
            if (!this.onBoard(tr, tc)) return false;
            const target = this.board[tr][tc];
            if (target === null) {
                moves.push({fr: r, fc: c, tr, tc});
                return true;
            } else if (this.getColor(target) !== color) {
                moves.push({fr: r, fc: c, tr, tc, capture: target});
                return false;
            }
            return false;
        };

        if (type === 'p') {
            const dir = color === 'white' ? -1 : 1;
            const startRow = color === 'white' ? 6 : 1;
            // Move forward 1
            if (this.onBoard(r+dir, c) && this.board[r+dir][c] === null) {
                moves.push({fr: r, fc: c, tr: r+dir, tc: c});
                // Move forward 2
                if (r === startRow && this.board[r+dir*2][c] === null) {
                    moves.push({fr: r, fc: c, tr: r+dir*2, tc: c, isDoublePawn: true});
                }
            }
            // Capture
            [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
                const tr = r+dr, tc = c+dc;
                if (this.onBoard(tr, tc)) {
                    const target = this.board[tr][tc];
                    if (target && this.getColor(target) !== color) {
                         moves.push({fr: r, fc: c, tr: tr, tc: tc, capture: target});
                    }
                    if (this.enPassant && this.enPassant.r === tr && this.enPassant.c === tc) {
                        moves.push({fr: r, fc: c, tr: tr, tc: tc, isEnPassant: true});
                    }
                }
            });
        } else {
            const dirs = {
                n: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
                b: [[-1,-1],[-1,1],[1,-1],[1,1]],
                r: [[-1,0],[1,0],[0,-1],[0,1]],
                q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]],
                k: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]
            }[type];
            
            dirs.forEach(([dr, dc]) => {
                if (type === 'n' || type === 'k') addMove(r+dr, c+dc);
                else {
                    let i = 1;
                    while (addMove(r + dr*i, c + dc*i)) { i++; }
                }
            });
        }
        
        // Castling
        // BUG FIX: Check if rook is actually there!
        if (checkCastling && type === 'k' && !this.isCheck(color)) {
            const row = color === 'white' ? 7 : 0;
            const myRook = color === 'white' ? 'R' : 'r';
            // Kingside
            if (this.castling[color].k && this.board[row][7] === myRook && !this.board[row][5] && !this.board[row][6]) {
                if (!this.isSquareAttacked(row, 5, color) && !this.isSquareAttacked(row, 6, color)) {
                    moves.push({fr: r, fc: c, tr: row, tc: 6, isCastling: 'k'});
                }
            }
            // Queenside
            if (this.castling[color].q && this.board[row][0] === myRook && !this.board[row][1] && !this.board[row][2] && !this.board[row][3]) {
                if (!this.isSquareAttacked(row, 3, color)) { // d1/d8 is checked (row, 3)
                    if(!this.isSquareAttacked(row, 2, color)) 
                        moves.push({fr: r, fc: c, tr: row, tc: 2, isCastling: 'q'});
                }
            }
        }
        return moves;
    }

    isCheck(color) {
        let kr, kc;
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) if (this.board[r][c] === (color === 'white' ? 'K' : 'k')) { kr = r; kc = c; }
        // If King not found (e.g. testing setups), return true to prevent illegal moves
        if (kr === undefined) return true;
        return this.isSquareAttacked(kr, kc, color);
    }

    isSquareAttacked(r, c, myColor) {
        const enemy = myColor === 'white' ? 'black' : 'white';
        
        const enemyPawnDir = myColor === 'white' ? -1 : 1; 
        
        if (this.onBoard(r+enemyPawnDir, c-1) && this.board[r+enemyPawnDir][c-1] === (enemy==='white'?'P':'p')) return true;
        if (this.onBoard(r+enemyPawnDir, c+1) && this.board[r+enemyPawnDir][c+1] === (enemy==='white'?'P':'p')) return true;
        
        const nMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for(let m of nMoves) { let tr=r+m[0], tc=c+m[1]; if(this.onBoard(tr,tc) && this.board[tr][tc] === (enemy==='white'?'N':'n')) return true; }
        
        const straight = [[-1,0],[1,0],[0,-1],[0,1]];
        for(let m of straight) {
            let i=1; while(true){ let tr=r+m[0]*i, tc=c+m[1]*i; if(!this.onBoard(tr,tc)) break; let p=this.board[tr][tc]; if(p){ if(p===(enemy==='white'?'R':'r')||p===(enemy==='white'?'Q':'q')) return true; break; } i++; }
        }
        const diag = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for(let m of diag) {
             let i=1; while(true){ let tr=r+m[0]*i, tc=c+m[1]*i; if(!this.onBoard(tr,tc)) break; let p=this.board[tr][tc]; if(p){ if(p===(enemy==='white'?'B':'b')||p===(enemy==='white'?'Q':'q')) return true; break; } i++; }
        }
        
        const kMoves = [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
        for(let m of kMoves) { let tr=r+m[0], tc=c+m[1]; if(this.onBoard(tr,tc) && this.board[tr][tc] === (enemy==='white'?'K':'k')) return true; }
        
        return false;
    }

    makeMove(move, dryRun = false) {
        const state = { 
            board: JSON.parse(JSON.stringify(this.board)), 
            castling: JSON.parse(JSON.stringify(this.castling)), 
            enPassant: this.enPassant, 
            turn: this.turn, 
            move: move 
        };
        this.moveHistory.push(state);
        
        const p = this.board[move.fr][move.fc];
        
        // Capture logic
        const targetPiece = this.board[move.tr][move.tc];
        // If capturing a Rook, update opponent castling rights
        if (targetPiece === 'R') {
             if (move.tr===7 && move.tc===0) this.castling.white.q=false;
             if (move.tr===7 && move.tc===7) this.castling.white.k=false;
        }
        if (targetPiece === 'r') {
             if (move.tr===0 && move.tc===0) this.castling.black.q=false;
             if (move.tr===0 && move.tc===7) this.castling.black.k=false;
        }

        this.board[move.tr][move.tc] = p;
        this.board[move.fr][move.fc] = null;
        
        if (move.isEnPassant) {
            this.board[move.tr + (this.turn==='white'?1:-1)][move.tc] = null;
        }
        
        if (move.isCastling === 'k') { this.board[move.tr][5] = this.board[move.tr][7]; this.board[move.tr][7] = null; }
        if (move.isCastling === 'q') { this.board[move.tr][3] = this.board[move.tr][0]; this.board[move.tr][0] = null; }
        
        if (p.toLowerCase() === 'p' && (move.tr===0 || move.tr===7)) {
            this.board[move.tr][move.tc] = this.turn==='white'?'Q':'q'; 
        }

        if (p==='K') this.castling.white = {k:false,q:false};
        if (p==='k') this.castling.black = {k:false,q:false};
        if (p==='R') {
             if (move.fr===7 && move.fc===0) this.castling.white.q=false;
             if (move.fr===7 && move.fc===7) this.castling.white.k=false;
        }
        if (p==='r') {
             if (move.fr===0 && move.fc===0) this.castling.black.q=false;
             if (move.fr===0 && move.fc===7) this.castling.black.k=false;
        }
        
        this.enPassant = move.isDoublePawn ? {r:(move.fr+move.tr)/2, c:move.fc} : null;

        if (this.isCheck(this.turn)) {
            this.undoMove();
            return false;
        }
        
        this.turn = this.turn==='white'?'black':'white';
        return true;
    }

    undoMove() {
        if (!this.moveHistory.length) return;
        const s = this.moveHistory.pop();
        this.board = s.board;
        this.castling = s.castling;
        this.enPassant = s.enPassant;
        this.turn = s.turn;
    }
    
    // Stub for getAllLegalMoves needed for testing
    getAllLegalMoves(color) {
        let all = [];
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            if(this.getColor(this.board[r][c]) === color) {
                const moves = this.generateMoves(r, c);
                for(let m of moves) {
                    if(this.makeMove(m, true)) { 
                        all.push(m); 
                        this.undoMove(); 
                    }
                }
            }
        }
        return all;
    }
}

// TESTS
const game = new ChessEngine();

// 1. Test Castling Rights when Rook is missing
console.log("Test 1: Castling with missing rook...");
game.reset();
// Remove White King Rook at (7,7)
game.board[7][7] = null;
// Ensure castling right is still technically true (hasn't moved), but shouldn't be able to castle
const moves = game.generateMoves(7, 4); // King
const hasCastlingK = moves.some(m => m.isCastling === 'k');
assert.strictEqual(hasCastlingK, false, "Should not castle if Rook is missing");
console.log("PASS");

// 2. Test En Passant
console.log("Test 2: En Passant...");
game.reset();
// Setup: White Pawn at (6,4) moves to (4,4). Black Pawn at (4,3).
game.board[4][3] = 'p'; 
game.turn = 'white';
const dMove = {fr:6, fc:4, tr:4, tc:4, isDoublePawn: true};
game.makeMove(dMove); // White double move. Turn becomes Black.
assert.strictEqual(game.enPassant.r, 5);
assert.strictEqual(game.enPassant.c, 4);

// Now Black turn. Generate moves for Black Pawn at (4,3)
const bMoves = game.generateMoves(4, 3);
const epMove = bMoves.find(m => m.isEnPassant);
assert.ok(epMove, "En Passant move should be available");
assert.strictEqual(epMove.tr, 5);
assert.strictEqual(epMove.tc, 4);
console.log("PASS");

// 3. Test Checkmate Detection (Scholar's Mate / Fool's Mate)
console.log("Test 3: Fool's Mate...");
game.reset();
// 1. f3 e5 2. g4 Qh4#
game.makeMove({fr:6, fc:5, tr:5, tc:5}); // f3 (White)
game.makeMove({fr:1, fc:4, tr:3, tc:4}); // e5 (Black)
game.makeMove({fr:6, fc:6, tr:4, tc:6}); // g4 (White)
game.makeMove({fr:0, fc:3, tr:4, tc:7}); // Qh4 (Black) - Mate

// Now White turn. Should be checkmate.
assert.ok(game.isCheck('white'), "White should be in check");
const wMoves = game.getAllLegalMoves('white');
assert.strictEqual(wMoves.length, 0, "White should have no legal moves (Checkmate)");
console.log("PASS");

// 4. Test Capture
console.log("Test 4: Capture Mechanics...");
game.reset();
// White Knight (7,1) captures Black Pawn at (5,2)
game.board[5][2] = 'p';
// Check if move generated
const kMoves = game.generateMoves(7, 1);
const capMove = kMoves.find(m => m.tr === 5 && m.tc === 2);
assert.ok(capMove, "Capture move found");
assert.strictEqual(capMove.capture, 'p', "Capture target is correct");
// Execute
game.makeMove(capMove);
assert.strictEqual(game.board[5][2], 'N', "Knight moved to target");
assert.strictEqual(game.board[7][1], null, "Knight left start");
console.log("PASS");

// 5. Test Castling Rights on Capture
console.log("Test 5: Castling Rights Lost on Rook Capture...");
game.reset();
// Remove Black Pawn at h7 to open file for testing
game.board[1][7] = null;
// Place White Rook at h6, ready to capture Black Rook at h8
game.board[2][7] = 'R'; // h6
// Capture h8
game.makeMove({fr:2, fc:7, tr:0, tc:7, capture: 'r'});
assert.strictEqual(game.castling.black.k, false, "Black lost kingside castling after rook capture");
console.log("PASS");
