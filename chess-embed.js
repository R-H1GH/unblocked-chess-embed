(function () {
  if (window.__UNBLOCKED_CHESS_EMBED__) return;
  window.__UNBLOCKED_CHESS_EMBED__ = true;

  /* ---------- utilities ---------- */

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* ---------- bootstrap ---------- */

  ready(async () => {
    if (!window.Chess) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/chess.js@1.0.0/dist/chess.min.js"
      );
    }

    if (!window.Chess) {
      console.error("Unblocked Chess: chess.js failed to load");
      return;
    }

    document
      .querySelectorAll("[data-unblocked-chess]")
      .forEach(initInstance);
  });

  /* ---------- instance ---------- */

  function initInstance(host) {
    const root = document.createElement("div");
    root.className = "unblocked-chess-root";
    host.appendChild(root);

    injectStyles();
    injectHTML(root);
    runApp(root);
  }

  /* ---------- styles ---------- */

  function injectStyles() {
    if (document.getElementById("unblocked-chess-styles")) return;

    const style = document.createElement("style");
    style.id = "unblocked-chess-styles";
    style.textContent = `
.unblocked-chess-root{
  --bg:#0d1016;
  --panel:#141b26;
  --panel-strong:#1c2432;
  --text:#f4f6f9;
  --muted:#a5b0c2;
  --light:#f0d9b5;
  --dark:#b58863;
  font-family:system-ui,-apple-system,Segoe UI,sans-serif;
  color:var(--text);
}

.unblocked-chess-root *{box-sizing:border-box}

.unblocked-chess-app{
  max-width:900px;
  margin:0 auto;
  padding:16px;
  display:grid;
  gap:16px;
}

.uc-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  background:var(--panel);
  padding:12px 16px;
  border-radius:12px;
}

.uc-title{font-weight:600;font-size:18px}
.uc-status{font-size:14px;color:var(--muted)}

.uc-board-shell{display:flex;justify-content:center}

.uc-board{
  width:min(90vmin,480px);
  aspect-ratio:1;
  display:grid;
  grid-template-columns:repeat(8,1fr);
  grid-template-rows:repeat(8,1fr);
  border-radius:12px;
  overflow:hidden;
  border:2px solid rgba(255,255,255,.1);
}

.uc-square{
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}

.uc-square.light{background:var(--light)}
.uc-square.dark{background:var(--dark)}

.uc-piece{
  width:70%;
  height:70%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
  user-select:none;
}

.uc-controls{
  display:flex;
  gap:8px;
  justify-content:center;
}

.uc-btn{
  padding:8px 12px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,.15);
  background:var(--panel-strong);
  color:var(--text);
  cursor:pointer;
}
`;
    document.head.appendChild(style);
  }

  /* ---------- html ---------- */

  function injectHTML(root) {
    root.innerHTML = `
<div class="unblocked-chess-app">
  <div class="uc-header">
    <div class="uc-title">Unblocked Chess</div>
    <div class="uc-status" id="ucStatus">White to move</div>
  </div>

  <div class="uc-board-shell">
    <div class="uc-board" id="ucBoard"></div>
  </div>

  <div class="uc-controls">
    <button class="uc-btn" id="ucFlip">Flip Board</button>
    <button class="uc-btn" id="ucReset">Reset</button>
  </div>
</div>
`;
  }

  /* ---------- game logic ---------- */

  function runApp(root) {
    const boardEl = root.querySelector("#ucBoard");
    const statusEl = root.querySelector("#ucStatus");
    const flipBtn = root.querySelector("#ucFlip");
    const resetBtn = root.querySelector("#ucReset");

    const game = new Chess();
    const files = ["a","b","c","d","e","f","g","h"];

    let flipped = false;
    let selected = null;
    let legal = [];

    function squareName(r,c){
      return files[c] + (8 - r);
    }

    function pieceChar(p){
      return {
        p:"♟", r:"♜", n:"♞",
        b:"♝", q:"♛", k:"♚"
      }[p.type];
    }

    function buildBoard(){
      boardEl.innerHTML="";
      for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){
          const sq=document.createElement("div");
          sq.className="uc-square "+((r+c)%2?"dark":"light");
          sq.dataset.r=r;
          sq.dataset.c=c;
          sq.onclick=onSquareClick;
          boardEl.appendChild(sq);
        }
      }
    }

    function render(){
      const state=game.board();
      boardEl.style.transform=flipped?"rotate(180deg)":"";
      [...boardEl.children].forEach(sq=>{
        const r=+sq.dataset.r;
        const c=+sq.dataset.c;
        sq.innerHTML="";
        const p=state[r][c];
        if(p){
          const el=document.createElement("div");
          el.className="uc-piece";
          el.textContent=pieceChar(p);
          if(flipped) el.style.transform="rotate(180deg)";
          sq.appendChild(el);
        }
      });
      statusEl.textContent=(game.turn()==="w"?"White":"Black")+" to move";
    }

    function onSquareClick(e){
      const r=+e.currentTarget.dataset.r;
      const c=+e.currentTarget.dataset.c;
      const sq=squareName(r,c);

      if(selected){
        const move=legal.find(m=>m.to===sq);
        if(move){
          game.move(move);
          selected=null;
          legal=[];
          render();
          return;
        }
        selected=null;
        legal=[];
      }

      const p=game.get(sq);
      if(p && p.color===game.turn()){
        selected=sq;
        legal=game.moves({square:sq,verbose:true});
      }
    }

    flipBtn.onclick=()=>{flipped=!flipped;render()};
    resetBtn.onclick=()=>{game.reset();selected=null;legal=[];flipped=false;render()};

    buildBoard();
    render();
  }
})();
