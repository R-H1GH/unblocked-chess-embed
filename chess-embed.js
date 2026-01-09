(function () {
    if (window.__UNBLOCKED_CHESS_EMBED__) return;
    window.__UNBLOCKED_CHESS_EMBED__ = true;

    function loadScript(src, cb) {
        const s = document.createElement("script");
        s.src = src;
        s.onload = cb;
        document.head.appendChild(s);
    }

    function loadChess(cb) {
        if (window.Chess) return cb();
        loadScript("https://cdn.jsdelivr.net/npm/chess.js@1.0.0/dist/chess.min.js", cb);
    }

    function initAll() {
        document.querySelectorAll("[data-unblocked-chess]").forEach(mount);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }

    function mount(host) {
        const root = document.createElement("div");
        root.className = "unblocked-chess-root";
        host.appendChild(root);
        injectStyle(root);
        injectHtml(root);
        loadChess(() => runApp(root));
    }

    window.__UNBLOCKED_CHESS_NEXT__ = function (api) {
        window.injectStyle = api.injectStyle;
        window.injectHtml = api.injectHtml;
        window.runApp = api.runApp;
    };
})();
window.__UNBLOCKED_CHESS_NEXT__({
    injectStyle(root) {
        const style = document.createElement("style");
        style.textContent = `
:root{--bg:#0d1016;--panel:#141b26;--panel-strong:#1c2432;--panel-soft:rgba(20,27,38,.92);--text:#f4f6f9;--muted:#a5b0c2;--accent:#e4b363;--accent-2:#7bdff2;--danger:#ff6b6b;--light:#f0d9b5;--dark:#b58863;--grid-gap:12px;--white-piece:#f6f1e7;--black-piece:#242a35;--player-piece-color:var(--white-piece);--player-glow-color:rgba(0,0,0,0);--player-glow-size:0px}
:root[data-theme=midnight]{--light:#e2ebf5;--dark:#32506a;--accent:#f4d35e;--accent-2:#7cdaf9}
:root[data-theme=emerald]{--light:#e6efe8;--dark:#3e6b57;--accent:#f6b453;--accent-2:#7be0b1}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(circle at top,#1f2838 0%,#0d1016 58%);color:var(--text);font-family:Space Grotesk,Segoe UI,sans-serif}
.app{max-width:1200px;margin:0 auto;padding:28px 24px 40px;display:grid;gap:20px}
.board{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border-radius:20px;overflow:hidden}
.square{display:flex;align-items:center;justify-content:center;border:none;cursor:pointer}
.square.light{background:var(--light)}
.square.dark{background:var(--dark)}
.piece{width:70%;height:70%;display:flex;align-items:center;justify-content:center}
.piece svg{width:100%;height:100%;fill:currentColor}
    `;
        root.prepend(style);
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    injectHtml(root) {
        root.insertAdjacentHTML(
            "beforeend",
            `
<div class="app">
  <header class="header">
    <div class="brand">
      <div class="brand-icon"></div>
      <div>
        <h1>Unblocked Chess</h1>
        <p>Full rules, multiple modes, and built-in features.</p>
      </div>
    </div>
    <div class="status">
      <div class="status-text">
        <strong id="turnLabel">Start a match</strong>
        <span id="statusLabel">Choose a mode to begin.</span>
        <span class="side-label" id="sideLabel"></span>
      </div>
      <div class="wallet">
        <span>Coins</span>
        <strong id="coinsLabel">0</strong>
      </div>
    </div>
  </header>

  <main class="main">
    <section class="board-section">
      <div class="board-shell">
        <div class="board show-coords" id="board"></div>
        <div class="board-overlay" id="boardOverlay">AI thinking...</div>
      </div>
      <div class="board-controls">
        <button class="button" id="flipBtn">Flip Board</button>
        <button class="button primary" id="quitBtn">Quit</button>
      </div>
    </section>

    <aside class="side-panel">
      <div class="panel">
        <h2>Captured</h2>
        <div class="captured-row">
          <span>White</span>
          <div class="captured-list" id="capturedWhite"></div>
        </div>
        <div class="captured-row">
          <span>Black</span>
          <div class="captured-list" id="capturedBlack"></div>
        </div>
      </div>

      <div class="panel">
        <h2>Moves</h2>
        <ol class="move-list" id="moveList"></ol>
      </div>
    </aside>
  </main>
</div>

<div class="modal" id="promotionModal"></div>
<div class="start-menu show" id="startMenu"></div>
`
        );
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        const { Chess } = window;

        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

        const pieceSvgs = {
            p: `<svg viewBox="0 0 64 64"><circle cx="32" cy="20" r="10"/><rect x="22" y="30" width="20" height="14" rx="4"/><rect x="18" y="44" width="28" height="8" rx="4"/></svg>`,
            r: `<svg viewBox="0 0 64 64"><rect x="18" y="16" width="28" height="10" rx="2"/><rect x="22" y="26" width="20" height="18" rx="4"/><rect x="16" y="44" width="32" height="8" rx="3"/></svg>`,
            n: `<svg viewBox="0 0 64 64"><path d="M20 48h24v6H20z"/><path d="M24 44h16v4H24z"/><path d="M26 42l6-16 12-6 6 10-8 12H26z"/></svg>`,
            b: `<svg viewBox="0 0 64 64"><path d="M32 12c8 8 12 14 12 20 0 7-5 12-12 14-7-2-12-7-12-14 0-6 4-12 12-20z"/><rect x="22" y="42" width="20" height="8" rx="3"/><rect x="18" y="50" width="28" height="6" rx="3"/></svg>`,
            q: `<svg viewBox="0 0 64 64"><circle cx="18" cy="20" r="4"/><circle cx="32" cy="16" r="4"/><circle cx="46" cy="20" r="4"/><path d="M18 24l4 14h20l4-14H18z"/><rect x="20" y="38" width="24" height="8" rx="3"/><rect x="16" y="46" width="32" height="8" rx="3"/></svg>`,
            k: `<svg viewBox="0 0 64 64"><rect x="30" y="10" width="4" height="12"/><rect x="24" y="16" width="16" height="4"/><path d="M22 24h20l4 14H18l4-14z"/><rect x="20" y="38" width="24" height="8" rx="3"/><rect x="16" y="46" width="32" height="8" rx="3"/></svg>`
        };

        const boardEl = root.querySelector("#board");
        const turnLabel = root.querySelector("#turnLabel");
        const statusLabel = root.querySelector("#statusLabel");
        const flipBtn = root.querySelector("#flipBtn");

        const game = new Chess();
        let squares = [];
        let selected = null;
        let legal = [];
        let flipped = false;

        function squareName(r, c) { return files[c] + (8 - r) }

        function buildBoard() {
            boardEl.innerHTML = "";
            squares = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const b = document.createElement("button");
                    b.className = "square " + ((r + c) % 2 ? "dark" : "light");
                    b.dataset.r = r; b.dataset.c = c;
                    b.onclick = onSquare;
                    const slot = document.createElement("div");
                    slot.className = "piece";
                    b.appendChild(slot);
                    boardEl.appendChild(b);
                    squares.push({ b, slot, r, c });
                }
            }
        }

        function render() {
            const state = game.board();
            boardEl.classList.toggle("flipped", flipped);
            squares.forEach(s => {
                const p = state[s.r][s.c];
                s.slot.innerHTML = p ? `<div class="piece ${p.color}">${pieceSvgs[p.type]}</div>` : "";
                s.b.classList.toggle("selected", selected && selected.r === s.r && selected.c === s.c);
            });
            turnLabel.textContent = (game.turn() === "w" ? "White" : "Black") + " to move";
        }

        function onSquare(e) {
            const r = +e.currentTarget.dataset.r;
            const c = +e.currentTarget.dataset.c;
            const sq = squareName(r, c);
            if (selected) {
                const m = legal.find(x => x.to === sq);
                if (m) { game.move(m); selected = null; legal = []; render(); return; }
                selected = null; legal = [];
            }
            const p = game.get(sq);
            if (p && p.color === game.turn()) {
                selected = { r, c };
                legal = game.moves({ square: sq, verbose: true });
            }
            render();
        }

        flipBtn.onclick = () => { flipped = !flipped; render() };

        buildBoard();
        render();
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        const moveList = root.querySelector("#moveList");
        const capturedWhite = root.querySelector("#capturedWhite");
        const capturedBlack = root.querySelector("#capturedBlack");

        const origRender = root.__render__;
        root.__render__ = function () {
            origRender();

            const history = this.game.history({ verbose: true });
            moveList.innerHTML = "";

            for (let i = 0; i < history.length; i += 2) {
                const li = document.createElement("li");
                li.innerHTML = `
          <span class="move-number">${i / 2 + 1}.</span>
          <span>${history[i]?.san || ""}</span>
          <span>${history[i + 1]?.san || ""}</span>
        `;
                moveList.appendChild(li);
            }

            const cap = { w: [], b: [] };
            history.forEach(m => {
                if (m.captured) {
                    cap[m.color].push(m.captured);
                }
            });

            capturedWhite.innerHTML = cap.w.map(p => p).join("");
            capturedBlack.innerHTML = cap.b.map(p => p).join("");
        };
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        const moveList = root.querySelector("#moveList");
        const capturedWhite = root.querySelector("#capturedWhite");
        const capturedBlack = root.querySelector("#capturedBlack");

        const origRender = root.__render__;
        root.__render__ = function () {
            origRender();

            const history = this.game.history({ verbose: true });
            moveList.innerHTML = "";

            for (let i = 0; i < history.length; i += 2) {
                const li = document.createElement("li");
                li.innerHTML = `
          <span class="move-number">${i / 2 + 1}.</span>
          <span>${history[i]?.san || ""}</span>
          <span>${history[i + 1]?.san || ""}</span>
        `;
                moveList.appendChild(li);
            }

            const cap = { w: [], b: [] };
            history.forEach(m => {
                if (m.captured) {
                    cap[m.color].push(m.captured);
                }
            });

            capturedWhite.innerHTML = cap.w.map(p => p).join("");
            capturedBlack.innerHTML = cap.b.map(p => p).join("");
        };
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        const overlay = root.querySelector("#boardOverlay");
        const { Chess } = window;

        const game = root.__game__ || new Chess();
        root.__game__ = game;

        let aiEnabled = false;
        let aiColor = "b";
        let thinking = false;

        function randomAiMove() {
            const moves = game.moves({ verbose: true });
            if (!moves.length) return;
            const m = moves[Math.floor(Math.random() * moves.length)];
            game.move(m);
        }

        function maybeAi() {
            if (!aiEnabled) return;
            if (game.turn() !== aiColor) return;
            thinking = true;
            overlay.classList.add("show");
            setTimeout(() => {
                randomAiMove();
                thinking = false;
                overlay.classList.remove("show");
                root.__render__ && root.__render__();
            }, 300);
        }

        root.enableAi = function (color = "b") {
            aiEnabled = true;
            aiColor = color;
            maybeAi();
        };

        root.afterMove = maybeAi;
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        const quitBtn = root.querySelector("#quitBtn");
        const startMenu = root.querySelector("#startMenu");
        const soloBtn = root.querySelector("#soloBtn");
        const localBtn = root.querySelector("#localBtn");

        function showMenu() {
            startMenu.classList.add("show");
        }

        function hideMenu() {
            startMenu.classList.remove("show");
        }

        quitBtn && (quitBtn.onclick = showMenu);

        soloBtn && (soloBtn.onclick = () => {
            hideMenu();
            if (root.enableAi) root.enableAi("b");
        });

        localBtn && (localBtn.onclick = () => {
            hideMenu();
        });
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        const themeSelect = root.querySelector("#themeSelect");
        const showCoordsToggle = root.querySelector("#showCoords");
        const board = root.querySelector("#board");

        if (themeSelect) {
            themeSelect.onchange = () => {
                document.documentElement.dataset.theme = themeSelect.value;
            };
        }

        if (showCoordsToggle) {
            showCoordsToggle.onchange = () => {
                board.classList.toggle("show-coords", showCoordsToggle.checked);
            };
        }
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        const promotionModal = root.querySelector("#promotionModal");
        if (!promotionModal) return;

        promotionModal.innerHTML = `
      <div class="modal-card">
        <h3>Promote pawn to</h3>
        <div class="promo-options">
          <button data-piece="q">Queen</button>
          <button data-piece="r">Rook</button>
          <button data-piece="b">Bishop</button>
          <button data-piece="n">Knight</button>
        </div>
      </div>
    `;

        let pending = null;

        root.openPromotion = function (from, to) {
            pending = { from, to };
            promotionModal.classList.add("show");
        };

        root.closePromotion = function () {
            pending = null;
            promotionModal.classList.remove("show");
        };

        promotionModal.addEventListener("click", e => {
            const btn = e.target.closest("[data-piece]");
            if (!btn || !pending) return;
            const piece = btn.dataset.piece;
            root.__game__?.move({ from: pending.from, to: pending.to, promotion: piece });
            root.closePromotion();
            root.__render__ && root.__render__();
            root.afterMove && root.afterMove();
        });
    }
});
window.__UNBLOCKED_CHESS_NEXT__({
    runApp(root) {
        if (!root.__game__ || root.__initialized__) return;
        root.__initialized__ = true;

        const game = root.__game__;
        const board = root.querySelector("#board");

        root.__render__ = function () {
            const state = game.board();
            const squares = board.querySelectorAll(".square");

            squares.forEach(sq => {
                const r = +sq.dataset.r;
                const c = +sq.dataset.c;
                const piece = state[r][c];
                const slot = sq.firstChild;
                slot.innerHTML = piece
                    ? `<div class="piece ${piece.color}">${piece.type}</div>`
                    : "";
            });
        };

        const originalMove = game.move.bind(game);
        game.move = function (m) {
            const res = originalMove(m);
            if (res) {
                root.__render__();
                root.afterMove && root.afterMove();
            }
            return res;
        };

        root.__render__();
    }
});
