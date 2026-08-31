const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MIRAI - Care Future Teller</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #070b18;
        --panel: rgba(17, 24, 46, 0.72);
        --ink: #eaf0ff;
        --muted: #8fa0c4;
        --line: rgba(126, 150, 210, 0.22);
        --blue: #4d8dff;
        --teal: #2dd0e0;
        --green: #2dd4a7;
        --yellow: #f4b63f;
        --red: #ff5d73;
        --violet: #a78bfa;
        --shadow: 0 20px 50px rgba(2, 5, 16, 0.55);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(1100px 620px at 75% -12%, rgba(50, 70, 160, 0.55), transparent 65%),
          radial-gradient(900px 540px at -12% 34%, rgba(58, 42, 130, 0.45), transparent 62%),
          var(--bg);
        min-height: 100vh;
        color: var(--ink);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      button, input { font: inherit; }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 18px 24px;
        background: rgba(10, 14, 30, 0.65);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--line);
      }
      .brand { display: flex; align-items: center; gap: 13px; }
      .mark {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: radial-gradient(circle at 32% 28%, rgba(210, 220, 255, 0.9), rgba(120, 110, 250, 0.55) 45%, rgba(30, 30, 90, 0.9));
        box-shadow: 0 0 22px rgba(130, 140, 255, 0.55), inset 0 -8px 14px rgba(40, 40, 120, 0.8);
        animation: markPulse 3.4s ease-in-out infinite;
      }
      @keyframes markPulse {
        0%, 100% { box-shadow: 0 0 16px rgba(130, 140, 255, 0.4), inset 0 -8px 14px rgba(40, 40, 120, 0.8); }
        50% { box-shadow: 0 0 30px rgba(150, 160, 255, 0.75), inset 0 -8px 14px rgba(40, 40, 120, 0.8); }
      }
      h1 { margin: 0; font-size: 18px; line-height: 1.1; letter-spacing: 0.01em; }
      .subtitle { margin-top: 4px; color: var(--muted); font-size: 12px; letter-spacing: 0.04em; }
      main {
        padding: 20px;
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(360px, 0.7fr);
        gap: 18px;
        align-items: start;
      }
      .panel, .card {
        background: var(--panel);
        backdrop-filter: blur(12px);
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .panel { display: flex; flex-direction: column; }
      .maincol { display: grid; gap: 18px; align-content: start; min-width: 0; }
      .panel-head, .card-head {
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .title { font-weight: 700; letter-spacing: 0.01em; }
      .hint { color: var(--muted); font-size: 12.5px; margin-top: 3px; line-height: 1.45; }
      .risk-pill {
        border-radius: 999px;
        padding: 8px 13px;
        color: #061020;
        font-weight: 800;
        white-space: nowrap;
        background: var(--green);
        box-shadow: 0 0 20px rgba(45, 212, 167, 0.35);
        transition: background 300ms, box-shadow 300ms;
      }
      .stage {
        position: relative;
        aspect-ratio: 16 / 9;
        min-height: 420px;
        background: #05070f;
      }
      video, canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
      video { object-fit: contain; background: #05070f; }
      canvas { pointer-events: none; }
      /* The 3D replay is interactive (drag to orbit), so it must receive events. */
      #replay { pointer-events: auto; cursor: grab; touch-action: none; }
      #replay.grabbing { cursor: grabbing; }
      .empty-video {
        position: absolute;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        color: var(--muted);
        font-size: 12px;
        white-space: nowrap;
        background: rgba(10, 15, 32, 0.75);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 6px 13px;
      }
      .controls {
        padding: 13px 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        border-top: 1px solid var(--line);
      }
      .button {
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.045);
        border-radius: 9px;
        color: var(--ink);
        padding: 9px 13px;
        cursor: pointer;
        transition: border-color 150ms, background 150ms, transform 120ms;
      }
      .button:hover:not(:disabled) { border-color: rgba(150, 170, 255, 0.55); background: rgba(255, 255, 255, 0.08); }
      .button:active:not(:disabled) { transform: translateY(1px); }
      .button:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; filter: grayscale(0.5); }
      .button.primary {
        background: linear-gradient(135deg, var(--blue), var(--violet));
        border-color: transparent;
        color: #ffffff;
        box-shadow: 0 6px 20px rgba(90, 110, 255, 0.35);
      }
      .button.danger { background: rgba(255, 93, 115, 0.12); color: var(--red); border-color: rgba(255, 93, 115, 0.35); }
      .button.ghosted { background: rgba(45, 212, 167, 0.10); color: var(--green); border-color: rgba(45, 212, 167, 0.35); }
      .side { display: grid; gap: 16px; align-content: start; }
      .card { padding: 0; }
      .card-body { padding: 14px 16px; }
      /* ---- Full-duplex AI dialog: a talking magic ball, no chat log ---- */
      .duplex { text-align: center; }
      .duplex-orb {
        position: relative;
        width: 195px;
        height: 195px;
        margin: 8px auto 6px;
      }
      .duplex-ball {
        position: absolute;
        inset: 15px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at 32% 26%, rgba(210, 220, 255, 0.5), rgba(110, 100, 235, 0.32) 45%, rgba(18, 18, 60, 0.92) 80%);
        animation: orbPulse 3.2s ease-in-out infinite;
      }
      .duplex.speaking .duplex-ball { animation-duration: 1.1s; }
      .ball-eq { display: flex; gap: 6px; align-items: center; height: 52px; }
      .ball-eq i {
        width: 6px;
        height: 9px;
        border-radius: 3px;
        background: rgba(226, 232, 255, 0.92);
        box-shadow: 0 0 10px rgba(160, 172, 255, 0.9);
        animation: eqIdle 3.4s ease-in-out infinite;
      }
      .ball-eq i:nth-child(2) { animation-delay: 0.25s; }
      .ball-eq i:nth-child(3) { animation-delay: 0.5s; }
      .ball-eq i:nth-child(4) { animation-delay: 0.75s; }
      .ball-eq i:nth-child(5) { animation-delay: 1s; }
      @keyframes eqIdle {
        0%, 100% { height: 9px; opacity: 0.7; }
        50% { height: 16px; opacity: 1; }
      }
      .duplex.speaking .ball-eq i { animation: eqTalk 0.6s ease-in-out infinite; }
      .duplex.speaking .ball-eq i:nth-child(2) { animation-delay: 0.11s; }
      .duplex.speaking .ball-eq i:nth-child(3) { animation-delay: 0.22s; }
      .duplex.speaking .ball-eq i:nth-child(4) { animation-delay: 0.33s; }
      .duplex.speaking .ball-eq i:nth-child(5) { animation-delay: 0.44s; }
      @keyframes eqTalk {
        0%, 100% { height: 8px; }
        50% { height: 42px; }
      }
      .duplex-orb .listen-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px solid rgba(45, 208, 224, 0.6);
        opacity: 0;
      }
      .duplex.listening .listen-ring { animation: ringPulse 2.2s ease-out infinite; }
      .duplex.listening .listen-ring.lr2 { animation-delay: 1.1s; }
      .duplex-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 6px 13px;
        font-size: 12px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.04);
      }
      .duplex-status .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 8px currentColor;
      }
      .duplex.listening .duplex-status { color: var(--teal); border-color: rgba(45, 208, 224, 0.45); }
      .duplex.speaking .duplex-status { color: var(--violet); border-color: rgba(167, 139, 250, 0.45); }
      .duplex-heard {
        min-height: 18px;
        margin-top: 10px;
        font-size: 12px;
        font-style: italic;
        color: var(--teal);
        opacity: 0;
      }
      .duplex-heard.show { animation: heardFade 5s ease forwards; }
      @keyframes heardFade {
        0% { opacity: 0; }
        8%, 70% { opacity: 1; }
        100% { opacity: 0; }
      }
      .duplex-caption {
        min-height: 70px;
        margin: 6px auto 0;
        max-width: 42ch;
        font-size: 13.5px;
        line-height: 1.6;
        color: var(--ink);
      }
      .duplex .voice-row, .duplex .chips { justify-content: center; }
      .chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
      .chip {
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.035);
        color: var(--ink);
        border-radius: 999px;
        padding: 7px 11px;
        cursor: pointer;
        font-size: 12px;
        transition: border-color 150ms, background 150ms;
      }
      .chip:hover { border-color: rgba(167, 139, 250, 0.6); background: rgba(167, 139, 250, 0.12); }
      .moshirag {
        margin-top: 14px;
        padding-top: 13px;
        border-top: 1px solid var(--line);
        display: grid;
        gap: 9px;
        text-align: left;
      }
      .moshirag-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .moshirag-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: 12px;
      }
      .moshirag-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--muted);
        box-shadow: 0 0 8px currentColor;
      }
      .moshirag-dot.ok { background: var(--green); color: var(--green); }
      .moshirag-dot.warn { background: var(--yellow); color: var(--yellow); }
      .moshirag-dot.bad { background: var(--red); color: var(--red); }
      .moshirag-status {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .moshirag-context {
        font-size: 12px;
        line-height: 1.5;
        color: var(--ink);
        background: rgba(90, 100, 230, 0.10);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 9px 11px;
      }
      .moshirag-context b { color: var(--violet); }
      .moshirag-frame-wrap { display: grid; gap: 6px; }
      .moshirag-frame-wrap iframe {
        width: 100%;
        height: 640px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #05070f;
      }
      .moshirag-frame-note { font-size: 11px; color: var(--muted); line-height: 1.45; }
      #moshiragActions { justify-content: flex-start; }
      .timeline {
        height: 58px;
        display: grid;
        grid-template-columns: repeat(80, 1fr);
        gap: 2px;
      }
      .tick {
        border-radius: 3px;
        cursor: pointer;
        background: var(--green);
        min-width: 3px;
        border: none;
        padding: 0;
        opacity: 0.85;
      }
      .tick:hover { opacity: 1; }
      .tick.active { outline: 2px solid var(--ink); outline-offset: 1px; opacity: 1; }
      .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .metric {
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 10px 11px;
        background: rgba(255, 255, 255, 0.03);
      }
      .metric label { display: block; font-size: 11px; color: var(--muted); margin-bottom: 5px; }
      .metric b { font-size: 17px; }
      .bar { margin-top: 7px; height: 7px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
      .bar i { display: block; height: 100%; width: 40%; border-radius: inherit; background: var(--blue); }
      .legend {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        color: var(--muted);
        font-size: 12px;
      }
      .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; box-shadow: 0 0 8px currentColor; }
      .mini3d {
        position: relative;
        height: 300px;
        background: radial-gradient(720px 300px at 50% 110%, rgba(70, 90, 200, 0.28), transparent 70%), #070c1c;
      }
      .small { color: var(--muted); font-size: 12px; line-height: 1.5; }
      .voice-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 10px; }

      /* ---- Magic-ball vision overlay ---- */
      .vision { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 22px; }
      .vision::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(820px 520px at 50% 28%, rgba(90, 100, 230, 0.28), transparent 70%),
          rgba(3, 5, 13, 0.84);
        backdrop-filter: blur(9px);
      }
      .vision-panel {
        position: relative;
        width: min(760px, 94vw);
        max-height: 92vh;
        overflow: auto;
        text-align: center;
        background: linear-gradient(180deg, rgba(24, 31, 60, 0.95), rgba(12, 17, 36, 0.97));
        border: 1px solid rgba(140, 155, 255, 0.28);
        border-radius: 22px;
        padding: 26px 30px 24px;
        box-shadow: 0 34px 90px rgba(0, 0, 0, 0.6), 0 0 70px rgba(105, 115, 255, 0.14);
        animation: visionIn 460ms cubic-bezier(0.2, 0.9, 0.3, 1.15);
      }
      @keyframes visionIn { from { opacity: 0; transform: translateY(30px) scale(0.93); } }
      .ai-dialog { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 12px; }
      .ai-dialog-head { text-align: left; }
      .ai-name { letter-spacing: 0.24em; text-transform: uppercase; font-size: 11px; color: var(--violet); }
      .vision-title { margin: 3px 0 0; font-size: 21px; font-weight: 750; }
      .ai-avatar { position: relative; width: 48px; height: 48px; flex: none; }
      .ai-avatar .core {
        position: absolute;
        inset: 10px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #e1e8ff, #7f8cff 55%, #3b3fae);
        box-shadow: 0 0 18px rgba(130, 140, 255, 0.85);
      }
      .ai-avatar .ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px solid rgba(140, 152, 255, 0.55);
        animation: ringPulse 2.4s ease-out infinite;
      }
      .ai-avatar .ring.r2 { animation-delay: 1.2s; }
      @keyframes ringPulse {
        from { transform: scale(0.55); opacity: 1; }
        to { transform: scale(1.3); opacity: 0; }
      }
      .vision.speaking .ai-avatar .core { animation: corePulse 0.45s ease-in-out infinite alternate; }
      @keyframes corePulse { from { transform: scale(1); } to { transform: scale(1.16); } }
      .vision-close {
        position: absolute;
        top: 12px;
        right: 14px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.05);
        color: var(--muted);
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .vision-close:hover { color: var(--ink); border-color: rgba(150, 170, 255, 0.5); }
      .orb-hero {
        position: relative;
        width: 250px;
        height: 250px;
        margin: 2px auto 10px;
        animation: ballRise 750ms cubic-bezier(0.2, 0.9, 0.3, 1.25);
      }
      @keyframes ballRise { from { opacity: 0; transform: translateY(46px) scale(0.55); } }
      .orb-hero canvas {
        position: absolute;
        inset: 13px;
        width: calc(100% - 26px);
        height: calc(100% - 26px);
        border-radius: 50%;
        background: radial-gradient(circle at 32% 26%, rgba(200, 212, 255, 0.32), rgba(98, 92, 210, 0.20) 42%, rgba(18, 18, 58, 0.65) 78%);
        animation: orbPulse 3.2s ease-in-out infinite;
      }
      @keyframes orbPulse {
        0%, 100% { box-shadow: inset 0 -22px 44px rgba(58, 58, 165, 0.5), inset 0 14px 30px rgba(255, 255, 255, 0.14), 0 0 34px rgba(122, 132, 255, 0.35); }
        50% { box-shadow: inset 0 -22px 44px rgba(58, 58, 165, 0.5), inset 0 14px 30px rgba(255, 255, 255, 0.14), 0 0 66px rgba(148, 158, 255, 0.62); }
      }
      .orb-halo {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(from 0deg, transparent, rgba(146, 156, 255, 0.55), transparent 30%, transparent 52%, rgba(45, 208, 224, 0.45), transparent 82%);
        -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px));
        mask: radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px));
        animation: haloSpin 7s linear infinite;
      }
      @keyframes haloSpin { to { transform: rotate(360deg); } }
      .spark {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #ccd6ff;
        box-shadow: 0 0 10px 2px rgba(160, 172, 255, 0.85);
        animation: sparkFloat 4.6s ease-in-out infinite;
      }
      .spark.s1 { left: 4%; top: 60%; }
      .spark.s2 { left: 90%; top: 42%; animation-delay: 0.9s; }
      .spark.s3 { left: 14%; top: 14%; animation-delay: 1.7s; }
      .spark.s4 { left: 80%; top: 84%; animation-delay: 2.5s; width: 4px; height: 4px; }
      .spark.s5 { left: 50%; top: 0%; animation-delay: 3.2s; width: 4px; height: 4px; }
      @keyframes sparkFloat {
        0%, 100% { transform: translateY(0); opacity: 0.3; }
        50% { transform: translateY(-15px); opacity: 1; }
      }
      .vision-risk {
        display: inline-block;
        margin: 2px 0 12px;
        border-radius: 999px;
        padding: 6px 15px;
        color: #061020;
        font-weight: 800;
        font-size: 13px;
        background: var(--muted);
      }
      .vision-text {
        min-height: 76px;
        font-size: 15px;
        line-height: 1.65;
        max-width: 58ch;
        margin: 0 auto;
        color: var(--ink);
      }
      .vision-nav { display: flex; gap: 10px; justify-content: center; margin-top: 18px; }
      .vr-wrap {
        position: relative;
        height: 340px;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(140, 155, 255, 0.32);
        background: radial-gradient(720px 300px at 50% 118%, rgba(80, 100, 220, 0.32), transparent 70%), #04060e;
        box-shadow: inset 0 0 60px rgba(70, 80, 200, 0.16), 0 0 40px rgba(90, 100, 255, 0.10);
        margin: 4px 0 14px;
        animation: vrIn 480ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
      }
      @keyframes vrIn { from { opacity: 0; transform: scale(0.96); } }
      .vr-chip {
        position: absolute;
        top: 11px;
        left: 13px;
        z-index: 2;
        font-size: 12px;
        font-weight: 750;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: var(--ink);
        background: rgba(8, 12, 28, 0.8);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 6px 12px;
      }
      .vr-risk {
        position: absolute;
        top: 11px;
        right: 13px;
        z-index: 2;
        text-align: right;
        background: rgba(8, 12, 28, 0.8);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 8px 12px;
        min-width: 168px;
      }
      .vr-risk label {
        display: block;
        font-size: 10px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 2px;
      }
      .vr-risk b { font-size: 20px; }
      .choices { display: none; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 8px 0 6px; }
      .choice {
        text-align: left;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.035);
        color: var(--ink);
        border-radius: 14px;
        padding: 14px;
        cursor: pointer;
        display: grid;
        gap: 8px;
        justify-items: start;
        align-content: start;
        transition: border-color 150ms, transform 150ms, box-shadow 150ms;
      }
      .choice:hover {
        border-color: rgba(167, 139, 250, 0.65);
        transform: translateY(-3px);
        box-shadow: 0 14px 34px rgba(90, 100, 255, 0.22);
      }
      .choice .num {
        width: 27px;
        height: 27px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 13px;
        color: #ffffff;
        background: linear-gradient(135deg, var(--blue), var(--violet));
        box-shadow: 0 0 14px rgba(110, 120, 255, 0.45);
      }
      .choice b { font-size: 14px; }
      .choice .sum { font-size: 12px; color: var(--muted); line-height: 1.5; }
      .choice-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .choice-head b { flex: 1 1 auto; }
      .choice.seen-done { border-color: rgba(45, 212, 167, 0.5); }
      .choice .seen {
        font-size: 10.5px; font-weight: 700; letter-spacing: 0.02em;
        color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 2px 8px;
      }
      .choice.seen-done .seen { color: #061020; background: #2dd4a7; border-color: transparent; }
      .choice-actions { display: flex; gap: 8px; width: 100%; margin-top: 2px; }
      .mini {
        font: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
        border-radius: 9px; padding: 7px 12px; border: 1px solid var(--line);
        background: rgba(255,255,255,0.05); color: var(--ink);
        transition: border-color 150ms, background 150ms, opacity 150ms;
      }
      .mini.preview:hover { border-color: rgba(167, 139, 250, 0.7); background: rgba(167,139,250,0.14); }
      .mini.choose { background: linear-gradient(135deg, var(--blue), var(--violet)); border-color: transparent; color: #fff; }
      .mini.choose:hover:not(:disabled) { filter: brightness(1.08); }
      .mini.choose:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.6); }
      .vision-progress { font-size: 12.5px; font-weight: 700; color: var(--muted); margin: 4px 0 2px; text-align: center; }
      .say-hint { font-size: 12px; color: var(--muted); margin-top: 10px; }
      @media (max-width: 980px) {
        header { align-items: flex-start; flex-direction: column; }
        main { grid-template-columns: 1fr; padding: 10px; }
        .metrics { grid-template-columns: 1fr; }
        .choices { grid-template-columns: 1fr; }
        .vr-wrap { height: 250px; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="brand">
        <div class="mark" aria-hidden="true"></div>
        <div>
          <h1>MIRAI <span style="font-weight:400; color:var(--muted)">|</span> Care Future Teller</h1>
          <div class="subtitle">See the near future of care - and choose a safer one</div>
        </div>
      </div>
      <div class="legend">
        <span><i class="dot" style="background:#4d8dff"></i>Nurse 1</span>
        <span><i class="dot" style="background:#2dd0e0"></i>Nurse 2</span>
        <span><i class="dot" style="background:#a78bfa"></i>Patient</span>
        <span><i class="dot" style="background:#2dd4a7"></i>Safer pose</span>
        <span><i class="dot" style="background:#ff5d73"></i>Risk sign</span>
      </div>
    </header>

    <main>
      <div class="maincol">
      <section class="panel">
        <div class="panel-head">
          <div>
            <div class="title">Live transfer analysis</div>
            <div class="hint">Two nurses moving a patient. MIRAI watches their bodies and scores the injury risk live.</div>
          </div>
          <div class="risk-pill" id="riskPill">Risk: -</div>
        </div>
        <div class="stage">
          <video id="video" muted playsinline></video>
          <div class="empty-video" id="emptyVideo">Start here: load the anonymized keypoint demo, or choose your own video for local analysis.</div>
          <canvas id="overlay"></canvas>
        </div>
        <div class="controls">
          <button class="button primary" id="attachedBtn" type="button">Load anonymized demo</button>
          <button class="button" id="uploadBtn" type="button">Load my video</button>
          <input type="file" id="videoFile" accept="video/*" style="display:none">
          <button class="button primary" id="playBtn" type="button">Play</button>
          <button class="button ghosted" id="whatIfBtn" type="button">Show safer pose: off</button>
        </div>
        <div class="hint" id="extractStatus" style="display:none"></div>
      </section>

      <section class="card">
        <div class="card-head">
          <div>
            <div class="title">Future motion preview</div>
            <div class="hint">A 3D replay of the option you pick - drag to spin it around.</div>
          </div>
          <button class="button" id="backLiveBtn" type="button" style="display:none">Return to present</button>
        </div>
        <div class="mini3d">
          <canvas id="replay"></canvas>
        </div>
        <div class="card-body">
          <div class="small">The present plays here as true-3D mesh figures (MotionBERT-lifted) - drag to orbit the view, double-click to reset. When you choose a future in the magic ball, it replays in this same 3D scene, continuing from the present pose, before the video resumes.</div>
        </div>
      </section>
      </div>

      <aside class="side">
        <section class="card">
          <div class="card-head">
            <div>
              <div class="title">Talk to MIRAI</div>
              <div class="hint">Ask by voice with Speak, or tap a quick question below. MIRAI answers out loud.</div>
            </div>
          </div>
          <div class="card-body duplex" id="duplex">
            <div class="duplex-orb">
              <div class="orb-halo"></div>
              <span class="listen-ring"></span>
              <span class="listen-ring lr2"></span>
              <div class="duplex-ball">
                <div class="ball-eq"><i></i><i></i><i></i><i></i><i></i></div>
              </div>
              <i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i><i class="spark s4"></i><i class="spark s5"></i>
            </div>
            <div><span class="duplex-status"><span class="status-dot"></span><span id="duplexStatusText">Waking up...</span></span></div>
            <div class="duplex-heard" id="duplexHeard"></div>
            <div class="duplex-caption" id="duplexCaption"></div>
            <div class="voice-row">
              <button class="button" id="micBtn" type="button">Speak</button>
              <button class="button" id="voiceBtn" type="button">AI voice: on</button>
            </div>
            <div class="chips">
              <button class="chip" data-q="What is risky in this phase?" type="button">What's risky now?</button>
              <button class="chip" data-q="Show me the three futures" type="button">Show 3 options</button>
              <button class="chip" data-q="What should we ask the patient?" type="button">Ask the patient</button>
            </div>
            <div class="moshirag">
              <div class="moshirag-row">
                <div class="moshirag-label"><span class="moshirag-dot" id="moshiragDot"></span><span>MoshiRAG voice (live full-duplex)</span></div>
                <button class="button primary" id="moshiragUseBtn" type="button" disabled>Use MoshiRAG voice</button>
              </div>
              <div class="moshirag-status" id="moshiragStatus">Checking MoshiRAG connection...</div>
              <div class="moshirag-context" id="moshiragContext" style="display:none"></div>
              <div class="moshirag-frame-wrap" id="moshiragFrameWrap" style="display:none">
                <iframe id="moshiragFrame" title="MoshiRAG voice" allow="microphone; autoplay"></iframe>
                <div class="moshirag-frame-note">Real full-duplex voice runs here - press "Start Session" inside the frame and allow the microphone. If it stays blank, your server blocks embedding: use "Open in new tab". The live risk numbers above keep the conversation grounded; press "Copy context" to speak them to MoshiRAG.</div>
              </div>
              <div class="moshirag-row" id="moshiragActions" style="display:none">
                <button class="button" id="moshiragCopyBtn" type="button">Copy context</button>
                <button class="button" id="moshiragTabBtn" type="button">Open in new tab</button>
                <button class="button ghosted" id="moshiragStopBtn" type="button" style="display:none">Back to built-in voice</button>
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <div class="title">Risk timeline</div>
              <div class="hint">Green = safe, yellow = caution, red = risky. Click a bar to jump there in the video.</div>
            </div>
          </div>
          <div class="card-body">
            <div class="timeline" id="timeline"></div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <div class="title">Safety features</div>
              <div class="hint" id="phaseLabel">Phase: - | Patient: -</div>
            </div>
          </div>
          <div class="card-body">
            <div class="metrics" id="metrics"></div>
          </div>
        </section>

      </aside>
    </main>

    <div class="vision" id="vision" style="display:none" role="dialog" aria-modal="true">
      <div class="vision-panel">
        <button class="vision-close" id="visionClose" type="button">Close</button>
        <div class="ai-dialog">
          <div class="ai-avatar"><span class="ring"></span><span class="ring r2"></span><span class="core"></span></div>
          <div class="ai-dialog-head">
            <div class="ai-name">AI Dialog</div>
            <h2 class="vision-title" id="visionTitle"></h2>
          </div>
        </div>
        <div class="orb-hero" id="orbHero">
          <div class="orb-halo"></div>
          <canvas id="visionCanvas"></canvas>
          <i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i><i class="spark s4"></i><i class="spark s5"></i>
        </div>
        <div class="vr-wrap" id="vrWrap" style="display:none">
          <canvas id="vrCanvas"></canvas>
          <span class="vr-chip" id="vrChip"></span>
          <div class="vr-risk">
            <label>Projected risk</label>
            <b id="vrRiskNum">-</b>
            <div class="bar"><i id="vrRiskBar"></i></div>
          </div>
        </div>
        <div class="choices" id="visionChoices">
          <div class="choice" data-i="0">
            <div class="choice-head"><span class="num">1</span><b id="choiceName0"></b><span class="risk-badge" id="choiceRisk0"></span><span class="seen" id="choiceSeen0">not previewed</span></div>
            <span class="sum">Keep lifting the same way - the patient slips and your back strains more.</span>
            <div class="choice-actions">
              <button class="mini preview" data-preview="0" type="button">Watch</button>
              <button class="mini choose" data-choose="0" type="button" disabled>Choose</button>
            </div>
          </div>
          <div class="choice" data-i="1">
            <div class="choice-head"><span class="num">2</span><b id="choiceName1"></b><span class="risk-badge" id="choiceRisk1"></span><span class="seen" id="choiceSeen1">not previewed</span></div>
            <span class="sum">Let the patient stand on their own legs while you guide.</span>
            <div class="choice-actions">
              <button class="mini preview" data-preview="1" type="button">Watch</button>
              <button class="mini choose" data-choose="1" type="button" disabled>Choose</button>
            </div>
          </div>
          <div class="choice" data-i="2">
            <div class="choice-head"><span class="num">3</span><b id="choiceName2"></b><span class="risk-badge" id="choiceRisk2"></span><span class="seen" id="choiceSeen2">not previewed</span></div>
            <span class="sum">Patient looks unsteady - sit them back down and check first.</span>
            <div class="choice-actions">
              <button class="mini preview" data-preview="2" type="button">Watch</button>
              <button class="mini choose" data-choose="2" type="button" disabled>Choose</button>
            </div>
          </div>
        </div>
        <div class="vision-progress" id="visionProgress"></div>
        <div><span class="vision-risk" id="visionRisk"></span></div>
        <div class="vision-text" id="visionText"></div>
        <div class="say-hint" id="sayHint" style="display:none">Say "one", "two", or "three" - or press Choose on a card.</div>
        <div class="vision-nav">
          <button class="button primary" id="visionNext" type="button">Play</button>
          <button class="button" id="visionSkip" type="button">Back</button>
        </div>
      </div>
    </div>

    <script>
      // === logic-start === (DOM-free: geometry, features, phases, counterfactual)
      const joints = ["head","neck","lShoulder","rShoulder","lElbow","rElbow","lWrist","rWrist","hip","lKnee","rKnee","lAnkle","rAnkle"];
      const bones = [["head","neck"],["neck","lShoulder"],["neck","rShoulder"],["lShoulder","lElbow"],["lElbow","lWrist"],["rShoulder","rElbow"],["rElbow","rWrist"],["neck","hip"],["hip","lKnee"],["lKnee","lAnkle"],["hip","rKnee"],["rKnee","rAnkle"]];
      const SYNTH_DURATION = 12;
      const state = {
        frames: [],
        index: 0,
        playing: false,
        aspect: 16 / 9,
        twistBase: { nurse: 1, nurse2: 1 },
        whatIf: false,
        source: "synthetic-safe",
        oracle: { scenarios: null, baseIndex: 0, tick: 0, selected: null },
        vision: { active: false, stage: "menu", preview: 0, seen: [false, false, false], introSpoken: false, choosePrompted: false, timer: null, introText: "", baseBBox: null },
        voiceOn: true,
        listenMode: false,
        choiceListen: false,
        speaking: false,
        moshirag: { configured: false, url: "", chatUrl: "", healthy: false, active: false },
        warnArmed: true,
        lastWarnAt: 0
      };
      // The transfer video has two nurses; frames may carry "nurse" and "nurse2".
      function nurseEntries(frame) {
        const out = [];
        if (frame.nurse) out.push(["nurse", frame.nurse]);
        if (frame.nurse2) out.push(["nurse2", frame.nurse2]);
        return out;
      }

      function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
      function lerp(a, b, t) { return a + (b - a) * t; }
      function point(x, y, c) { return { x: x, y: y, c: c === undefined ? 1 : c }; }
      function conf(p) { return typeof p.c === "number" ? p.c : 1; }
      function jointOk(p) { return !!p && conf(p) > 0.15 && !(p.x === 0 && p.y === 0); }
      // Normalized coords divide x by width and y by height; multiplying x by the
      // video aspect restores true proportions so angles and distances are honest.
      function corr(p) { return { x: p.x * state.aspect, y: p.y }; }
      function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
      function angle(a, b, c) {
        const ab = { x: a.x - b.x, y: a.y - b.y };
        const cb = { x: c.x - b.x, y: c.y - b.y };
        const dot = ab.x * cb.x + ab.y * cb.y;
        const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
        return Math.acos(clamp(dot / Math.max(mag, 1e-6), -1, 1)) * 180 / Math.PI;
      }
      function median(values) {
        if (!values.length) return 0;
        const sorted = values.slice().sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
      }

      function skeleton(cx, cy, scale, lean, knee, reach, crouch, twistDeg) {
        // twist compresses the shoulder line the way a rotated torso projects in 2D,
        // so the same shoulder/knee-span proxy used on real keypoints recovers it.
        const tw = Math.cos((twistDeg || 0) * Math.PI / 180);
        return {
          head: point(cx + lean * 0.18, cy - scale * (1.40 - crouch * 0.2)),
          neck: point(cx + lean * 0.14, cy - scale * (1.14 - crouch * 0.16)),
          lShoulder: point(cx - scale * 0.22 * tw + lean * 0.12, cy - scale * (1.05 - crouch * 0.14)),
          rShoulder: point(cx + scale * 0.22 * tw + lean * 0.12, cy - scale * (1.05 - crouch * 0.14)),
          lElbow: point(cx - scale * (0.28 - reach) * tw, cy - scale * 0.78),
          rElbow: point(cx + scale * (0.28 + reach) * tw, cy - scale * 0.78),
          lWrist: point(cx - scale * (0.16 - reach * 1.5) * tw, cy - scale * 0.58),
          rWrist: point(cx + scale * (0.16 + reach * 1.5) * tw, cy - scale * 0.58),
          hip: point(cx, cy - scale * (0.52 - crouch * 0.20)),
          lKnee: point(cx - scale * 0.22, cy - scale * (0.24 + knee * 0.24)),
          rKnee: point(cx + scale * 0.22, cy - scale * (0.24 + knee * 0.24)),
          lAnkle: point(cx - scale * 0.24, cy),
          rAnkle: point(cx + scale * 0.24, cy)
        };
      }

      function generateFrames(risky) {
        const frames = [];
        for (let i = 0; i < 80; i += 1) {
          const t = i / 79;
          const lift = Math.sin(Math.PI * clamp((t - 0.15) / 0.70, 0, 1));
          const pivot = clamp((t - 0.50) / 0.32, 0, 1);
          const nurseLean = risky ? 0.72 * lift : 0.25 * lift;
          const nurseKnee = risky ? 0.12 * lift : 0.70 * lift;
          const patientLean = risky ? -0.35 * lift : -0.12 * lift;
          const supportGap = risky ? 0.17 + 0.09 * lift : 0.07 + 0.03 * lift;
          const twistDeg = (risky ? 58 : 24) * Math.sin(Math.PI * pivot);
          const nx = lerp(0.34, 0.58, pivot);
          const px = nx + supportGap;
          frames.push({
            time: t * SYNTH_DURATION,
            nurse: skeleton(nx, 0.88, 0.28, nurseLean, nurseKnee, 0.10 + lift * 0.08, nurseKnee * 0.7, twistDeg),
            patient: skeleton(px, 0.88 - lift * 0.11, 0.25, patientLean, 0.20 + lift * 0.25, -0.04, lift * 0.25, twistDeg * 0.4),
            patientFeedback: risky && t > 0.44 && t < 0.72 ? "unsteady" : "ready"
          });
        }
        return frames;
      }

      function phaseAt(t) {
        if (t < 0.18) return "preparation";
        if (t < 0.38) return "sit-to-stand";
        if (t < 0.62) return "lifting";
        if (t < 0.82) return "pivot";
        return "seating";
      }

      function fillSeries(values) {
        const out = values.slice();
        let last = null;
        for (let i = 0; i < out.length; i += 1) {
          if (out[i] === null) out[i] = last; else last = out[i];
        }
        let next = null;
        for (let i = out.length - 1; i >= 0; i -= 1) {
          if (out[i] === null) out[i] = next; else next = out[i];
        }
        return out;
      }

      function movingAvg(values, w) {
        const out = new Array(values.length);
        for (let i = 0; i < values.length; i += 1) {
          let sum = 0;
          let count = 0;
          for (let k = -w; k <= w; k += 1) {
            const j = i + k;
            if (j >= 0 && j < values.length) { sum += values[j]; count += 1; }
          }
          out[i] = sum / count;
        }
        return out;
      }

      // Phases come from the motion itself: the patient's hip rising means
      // sit-to-stand/lifting, sideways travel while raised means pivot, and
      // descending means seating. Falls back to fixed time bands only when the
      // patient barely moves vertically.
      function detectPhases(frames) {
        const n = frames.length;
        if (!n) return;
        const rawY = frames.map((f) => f.patient && jointOk(f.patient.hip) ? f.patient.hip.y : null);
        if (rawY.every((v) => v === null)) {
          frames.forEach((f, i) => { f.phase = f.phase || phaseAt(i / Math.max(n - 1, 1)); });
          return;
        }
        const w = Math.max(2, Math.round(n / 40));
        const ys = movingAvg(fillSeries(rawY), w);
        const xs = movingAvg(fillSeries(frames.map((f) => f.patient && jointOk(f.patient.hip) ? f.patient.hip.x : null)), w);
        const yMax = Math.max.apply(null, ys);
        const yMin = Math.min.apply(null, ys);
        const range = yMax - yMin;
        if (range < 0.03) {
          frames.forEach((f, i) => { f.phase = f.phase || phaseAt(i / Math.max(n - 1, 1)); });
          return;
        }
        const xRange = Math.max.apply(null, xs) - Math.min.apply(null, xs);
        const thrY = 2.4 * range * w / n;
        const thrX = 2.4 * Math.max(xRange, 0.02) * w / n;
        let started = false;
        let phase = "preparation";
        for (let i = 0; i < n; i += 1) {
          const a = Math.max(i - w, 0);
          const b = Math.min(i + w, n - 1);
          const vy = ys[b] - ys[a];
          const vx = xs[b] - xs[a];
          const lifted = (yMax - ys[i]) / range;
          if (vy < -thrY) { phase = lifted < 0.45 ? "sit-to-stand" : "lifting"; started = true; }
          else if (started && lifted > 0.35 && xRange > 0.02 && Math.abs(vx) > thrX) { phase = "pivot"; }
          else if (started && vy > thrY) { phase = "seating"; }
          else if (!started) { phase = "preparation"; }
          frames[i].phase = phase;
        }
      }

      function ensureTimes(frames, duration) {
        if (!frames.some((f) => typeof f.time !== "number")) return;
        retimeFrames(frames, duration || SYNTH_DURATION);
      }
      function retimeFrames(frames, duration) {
        if (!frames.length || !duration) return;
        const last = Math.max(frames.length - 1, 1);
        frames.forEach((f, i) => { f.time = (i / last) * duration; });
      }
      function frameIndexAtTime(t) {
        const frames = state.frames;
        if (!frames.length) return 0;
        let lo = 0;
        let hi = frames.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if ((frames[mid].time || 0) < t) lo = mid + 1; else hi = mid;
        }
        if (lo > 0 && Math.abs((frames[lo - 1].time || 0) - t) <= Math.abs((frames[lo].time || 0) - t)) lo -= 1;
        return lo;
      }

      function trunkAngle(person) {
        if (!person || !jointOk(person.neck) || !jointOk(person.hip)) return 0;
        const neck = corr(person.neck);
        const hip = corr(person.hip);
        return Math.atan2(Math.abs(neck.x - hip.x), Math.max(hip.y - neck.y, 1e-6)) * 180 / Math.PI;
      }
      // Partial detections sometimes place the neck at/below the hip; such a
      // degenerate trunk cannot support angle or trunk-length measurements.
      function trunkOk(person) {
        return !!person && jointOk(person.neck) && jointOk(person.hip) && (person.hip.y - person.neck.y) > 0.02;
      }
      function trunkLen(person) {
        if (!person || !jointOk(person.neck) || !jointOk(person.hip)) return 0;
        return dist(corr(person.neck), corr(person.hip));
      }
      function legBend(person, side) {
        const hip = person.hip;
        const knee = person[side + "Knee"];
        const ankle = person[side + "Ankle"];
        if (!jointOk(hip) || !jointOk(knee) || !jointOk(ankle)) return null;
        return clamp(180 - angle(corr(hip), corr(knee), corr(ankle)), 0, 120);
      }
      function shoulderKneeRatio(person) {
        if (![person.lShoulder, person.rShoulder, person.lKnee, person.rKnee].every(jointOk)) return null;
        const shoulders = Math.abs(person.lShoulder.x - person.rShoulder.x);
        const knees = Math.abs(person.lKnee.x - person.rKnee.x);
        if (knees < 0.015) return null;
        return shoulders / knees;
      }
      // Torso rotation shows up in 2D as a narrowed shoulder line relative to the
      // pelvis; the ratio is self-calibrated per nurse against the opening frames.
      function calibrateTwist(frames) {
        const sample = frames.slice(0, Math.max(5, Math.floor(frames.length * 0.1)));
        const bases = {};
        ["nurse", "nurse2"].forEach((key) => {
          const ratios = sample.map((f) => f[key] ? shoulderKneeRatio(f[key]) : null).filter((r) => r !== null);
          bases[key] = ratios.length ? median(ratios) : 1;
        });
        state.twistBase = bases;
      }
      function twistProxy(person, roleKey) {
        if (!person) return 0;
        const base = (state.twistBase && state.twistBase[roleKey]) || 1;
        const ratio = shoulderKneeRatio(person);
        if (ratio === null) return 0;
        return clamp(Math.acos(clamp(ratio / base, 0.02, 1)) * 180 / Math.PI, 0, 90);
      }

      function features(frame) {
        let nurses = frame ? nurseEntries(frame) : [];
        const measurable = nurses.filter(([key, n]) => trunkOk(n));
        if (measurable.length) nurses = measurable;
        if (!frame || !nurses.length || !frame.patient) {
          return { trunkFlexion: 0, kneeBend: 0, supportDistance: 0, patientTilt: 0, twist: 0, risk: 0, lead: "nurse", valid: false };
        }
        const p = frame.patient;
        // The lead nurse (worst trunk posture) drives the postural risk terms.
        let lead = nurses[0][1];
        let leadKey = nurses[0][0];
        let trunkFlexion = -1;
        nurses.forEach(([key, n]) => {
          const a = clamp(trunkAngle(n), 0, 90);
          if (a > trunkFlexion) { trunkFlexion = a; lead = n; leadKey = key; }
        });
        const bends = [legBend(lead, "l"), legBend(lead, "r")].filter((v) => v !== null);
        // null = knees/ankles not visible; unknown is neutral, not penalized.
        const kneeBend = bends.length ? clamp(bends.reduce((a, b) => a + b, 0) / bends.length, 0, 90) : null;
        // Support distance = patient to the closest nurse, in that nurse's trunk lengths.
        let supportDistance = null;
        nurses.forEach(([key, n]) => {
          if (!jointOk(n.hip) || !jointOk(p.hip)) return;
          const d = clamp(dist(corr(n.hip), corr(p.hip)) / Math.max(trunkLen(n), 1e-3) * 100, 0, 300);
          if (supportDistance === null || d < supportDistance) supportDistance = d;
        });
        if (supportDistance === null) supportDistance = 0;
        const patientTilt = clamp(trunkAngle(p), 0, 80);
        const twist = twistProxy(lead, leadKey);
        const lifting = frame.phase === "sit-to-stand" || frame.phase === "lifting";
        const kneeWeight = lifting ? 0.22 : 0.04;
        const distanceWeight = frame.phase === "preparation" ? 0.07 : 0.22;
        const risk = clamp(
          0.30 * (trunkFlexion / 55) +
          (kneeBend === null ? 0 : kneeWeight * Math.max(1 - kneeBend / 60, 0)) +
          distanceWeight * (supportDistance / 180) +
          0.16 * (patientTilt / 45) +
          0.10 * (twist / 70),
          0,
          1
        );
        return { trunkFlexion, kneeBend, supportDistance, patientTilt, twist, risk, lead: leadKey, valid: true };
      }

      function riskLevel(score) {
        if (score < 0.40) return { label: "Low", color: "#2dd4a7" };
        if (score < 0.60) return { label: "Medium", color: "#f4b63f" };
        return { label: "High", color: "#ff5d73" };
      }

      function signsFor(frame, f) {
        const lifting = frame.phase === "sit-to-stand" || frame.phase === "lifting";
        const signs = [];
        if (f.trunkFlexion > 45) signs.push("nurse trunk flexion is high (" + Math.round(f.trunkFlexion) + " deg)");
        if (lifting && f.kneeBend !== null && f.kneeBend < 25) signs.push("knee bend is low for a lift (" + Math.round(f.kneeBend) + " deg)");
        if (frame.phase !== "preparation" && f.supportDistance > 140) signs.push("patient is far from the nurse (" + Math.round(f.supportDistance) + "% of trunk length)");
        if (f.patientTilt > 25) signs.push("patient posture is tilted (" + Math.round(f.patientTilt) + " deg)");
        if (f.twist > 45) signs.push("trunk twist during pivot is high (" + Math.round(f.twist) + " deg)");
        return signs;
      }

      function copyJoints(person) {
        const out = {};
        joints.forEach((j) => {
          if (person[j]) out[j] = { x: person[j].x, y: person[j].y, c: conf(person[j]) };
        });
        return out;
      }

      // The what-if counterfactual edits the skeleton geometry (upright trunk and
      // deeper knee bend for every nurse, patient pulled within reach of the
      // closest one) and lets features() re-score it, so the forecast is
      // recomputed rather than scripted.
      const UPPER_JOINTS = ["head", "neck", "lShoulder", "rShoulder", "lElbow", "rElbow", "lWrist", "rWrist"];
      // Shear the upper body sideways, proportional to height above the hip,
      // the way a trunk rotates about the pelvis. Positive dx leans further.
      function leanUpperBody(person, dx) {
        const trunkH = Math.max(person.hip.y - person.neck.y, 1e-4);
        UPPER_JOINTS.forEach((j) => {
          const q = person[j];
          if (!q) return;
          const share = clamp((person.hip.y - q.y) / trunkH, 0, 1.6);
          q.x += dx * share;
        });
      }
      function straightenTrunk(person, factor) {
        if (!trunkOk(person)) return;
        leanUpperBody(person, -(person.neck.x - person.hip.x) * factor);
      }
      function fixNursePosture(n) {
        if (!trunkOk(n)) return;
        straightenTrunk(n, 0.65);
        const kneeYs = ["lKnee", "rKnee"].map((k) => n[k]).filter(jointOk).map((q) => q.y);
        if (kneeYs.length) {
          const kneeY = kneeYs.reduce((a, b) => a + b, 0) / kneeYs.length;
          const drop = Math.max((kneeY - n.hip.y) * 0.25, 0);
          UPPER_JOINTS.forEach((j) => { if (n[j]) n[j].y += drop; });
          n.hip.y += drop;
        }
      }
      function counterfactual(frame) {
        const cf = {
          time: frame.time,
          phase: frame.phase,
          patientFeedback: frame.patientFeedback,
          nurse: frame.nurse ? copyJoints(frame.nurse) : null,
          nurse2: frame.nurse2 ? copyJoints(frame.nurse2) : null,
          patient: frame.patient ? copyJoints(frame.patient) : null
        };
        fixNursePosture(cf.nurse);
        fixNursePosture(cf.nurse2);
        const p = cf.patient;
        if (!p || !jointOk(p.hip)) return cf;
        let closest = null;
        [cf.nurse, cf.nurse2].forEach((n) => {
          if (!trunkOk(n)) return;
          const d = dist(corr(n.hip), corr(p.hip));
          if (!closest || d < closest.d) closest = { n: n, d: d };
        });
        if (closest) {
          const n = closest.n;
          const tlen = Math.max(trunkLen(n), 1e-4);
          const nh = corr(n.hip);
          const ph = corr(p.hip);
          const gx = ph.x - nh.x;
          const gy = ph.y - nh.y;
          const g = Math.hypot(gx, gy);
          const desired = 1.05 * tlen;
          if (g > desired) {
            const targetGx = Math.sqrt(Math.max(desired * desired - gy * gy, 0)) * (gx < 0 ? -1 : 1);
            const shift = (targetGx - gx) / state.aspect;
            joints.forEach((j) => { if (p[j]) p[j].x += shift; });
          }
        }
        return cf;
      }

      function whatIfSummary(frame) {
        return { before: features(frame), after: features(counterfactual(frame)) };
      }

      // ---- Magic-ball future projection -----------------------------------
      // Each scenario continues the CURRENT motion forward (~14 s) in several
      // detailed phases and re-scores every projected frame with features(),
      // so the three futures are computed cause-and-effect, not scripted.
      const FUTURE_STEPS = 90;

      function pct(x) { return Math.round(x * 100); }
      function easeInOut(t) { return t * t * (3 - 2 * t); }

      function copyFrameRoles(frame) {
        return {
          time: frame.time,
          phase: frame.phase,
          patientFeedback: frame.patientFeedback,
          nurse: frame.nurse ? copyJoints(frame.nurse) : null,
          nurse2: frame.nurse2 ? copyJoints(frame.nurse2) : null,
          patient: frame.patient ? copyJoints(frame.patient) : null
        };
      }

      function blendRoles(start, target, t) {
        const out = { time: start.time, phase: start.phase, patientFeedback: start.patientFeedback };
        ["nurse", "nurse2", "patient"].forEach((role) => {
          const a = start[role];
          const b = target[role];
          if (!a && !b) return;
          if (!a) { out[role] = copyJoints(b); return; }
          if (!b) { out[role] = copyJoints(a); return; }
          const o = {};
          joints.forEach((j) => {
            const pa = a[j];
            const pb = b[j];
            if (!pa && !pb) return;
            if (!pa) { o[j] = { x: pb.x, y: pb.y, c: conf(pb) }; return; }
            if (!pb) { o[j] = { x: pa.x, y: pa.y, c: conf(pa) }; return; }
            o[j] = { x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t), c: Math.min(conf(pa), conf(pb)) };
          });
          out[role] = o;
        });
        return out;
      }

      // Piecewise keyframe animation: blend through a list of target poses,
      // each reached at a fraction of the total duration, then hold the last.
      function keyframeSequence(start, keys, steps) {
        const frames = [];
        let prevTarget = start;
        let prevAt = 0;
        keys.forEach((key) => {
          const at = Math.min(Math.max(key.at, prevAt + 0.01), 1);
          const segSteps = Math.max(Math.round((at - prevAt) * steps), 1);
          for (let k = 1; k <= segSteps; k += 1) {
            frames.push(blendRoles(prevTarget, key.target, easeInOut(k / segSteps)));
          }
          prevTarget = key.target;
          prevAt = at;
        });
        while (frames.length < steps) frames.push(blendRoles(prevTarget, prevTarget, 1));
        return frames.slice(0, steps);
      }

      function translateRole(person, dx, dy) {
        if (!person) return;
        joints.forEach((j) => {
          if (person[j]) { person[j].x += dx; person[j].y += dy; }
        });
      }

      // A gentle coordinated lift: the patient rises, the nurses extend a bit.
      function liftTogether(frame, amount) {
        const out = copyFrameRoles(frame);
        if (out.patient) translateRole(out.patient, 0, -amount);
        ["nurse", "nurse2"].forEach((r) => { if (out[r]) translateRole(out[r], 0, -amount * 0.25); });
        return out;
      }

      function roleVelocities(baseIndex, span) {
        const cur = state.frames[baseIndex];
        const pastIndex = Math.max(baseIndex - span, 0);
        const past = state.frames[pastIndex];
        const n = Math.max(baseIndex - pastIndex, 1);
        const out = {};
        if (!cur || !past) return out;
        ["nurse", "nurse2", "patient"].forEach((role) => {
          if (!cur[role] || !past[role]) return;
          const v = {};
          joints.forEach((j) => {
            const a = past[role][j];
            const b = cur[role][j];
            if (!jointOk(a) || !jointOk(b)) return;
            v[j] = { x: (b.x - a.x) / n, y: (b.y - a.y) / n };
          });
          out[role] = v;
        });
        return out;
      }

      // Future 1: keep going. Three phases: the pattern deepens, then the
      // patient starts slipping away and sinking, then the near-fall - all
      // scaled by how risky the posture already is, so a safe posture
      // projects an almost unchanged future.
      function projectContinue(base, baseIndex, steps) {
        const vel = roleVelocities(baseIndex, 5);
        const f0 = features(base);
        const drift = clamp((f0.risk - 0.3) / 0.5, 0, 1);
        const leadKey = f0.lead;
        const frames = [];
        let prev = copyFrameRoles(base);
        let damp = 1;
        // Cumulative velocity displacement is capped per joint so the carried
        // motion adds life without collapsing the skeleton (which would push a
        // nurse out of measurement and fake a risk drop).
        const carried = {};
        for (let s = 1; s <= steps; s += 1) {
          const t = s / steps;
          const f = copyFrameRoles(prev);
          // Current motion fades quickly; what persists is the pattern itself.
          damp *= 0.9;
          ["nurse", "nurse2", "patient"].forEach((role) => {
            const rv = vel[role];
            if (!rv || !f[role]) return;
            const acc = carried[role] = carried[role] || {};
            joints.forEach((j) => {
              const q = f[role][j];
              const v = rv[j];
              if (!q || !v) return;
              const a = acc[j] = acc[j] || { x: 0, y: 0 };
              const nx = a.x + v.x * damp;
              const ny = a.y + v.y * damp;
              if (Math.hypot(nx, ny) > 0.025) return;
              q.x += v.x * damp;
              q.y += v.y * damp;
              a.x = nx;
              a.y = ny;
            });
          });
          const phaseMul = t < 0.35 ? 1 : (t < 0.7 ? 1.6 : 2.2);
          const lead = f[leadKey];
          if (lead && trunkOk(lead)) {
            const lean = lead.neck.x - lead.hip.x;
            leanUpperBody(lead, (lean >= 0 ? 1 : -1) * 0.0013 * drift * phaseMul);
          }
          if (f.patient && trunkOk(f.patient)) {
            const tilt = f.patient.neck.x - f.patient.hip.x;
            leanUpperBody(f.patient, (tilt >= 0 ? 1 : -1) * 0.001 * drift * phaseMul);
          }
          // From the slip phase on, the patient drifts out of the lead
          // nurse's grip and sinks toward the floor.
          if (t >= 0.35 && f.patient && lead && jointOk(lead.hip) && jointOk(f.patient.hip)) {
            const away = f.patient.hip.x >= lead.hip.x ? 1 : -1;
            translateRole(f.patient, away * 0.0007 * drift * phaseMul, 0.0008 * drift * phaseMul);
          }
          frames.push(f);
          prev = f;
        }
        return frames;
      }

      // Extend the patient's knees toward straight (hip-knee-ankle opening up)
      // as they take their own weight - the geometric signature of standing.
      function extendKnees(person, amount) {
        ["l", "r"].forEach((side) => {
          const hip = person.hip;
          const knee = person[side + "Knee"];
          const ankle = person[side + "Ankle"];
          if (!jointOk(hip) || !jointOk(knee) || !jointOk(ankle)) return;
          // Pull the knee toward the hip-ankle line: straighter leg, weight-bearing.
          const mx = (hip.x + ankle.x) / 2;
          const my = (hip.y + ankle.y) / 2;
          knee.x += (mx - knee.x) * amount;
          knee.y += (my - knee.y) * amount;
        });
      }

      // Future 2: ready the patient and let them do the standing. Bring them to
      // the edge within reach (counterfactual closeness), sit them up, hold for
      // a shared count, then the patient pushes up through their own legs while
      // both nurses stay upright and only guide. Every change is geometric
      // (trunk, patient tilt, support distance), so features() re-scores it.
      function readyAssist(start) {
        const cf = counterfactual(start);
        if (trunkOk(cf.patient)) straightenTrunk(cf.patient, 0.5); // patient sits up, set
        return cf;
      }
      function patientRises(ready, rise) {
        const out = copyFrameRoles(ready);
        if (out.patient) {
          straightenTrunk(out.patient, 0.85);   // upright the whole way up
          extendKnees(out.patient, 0.6);          // weight through their own legs
          translateRole(out.patient, 0, -rise);   // the patient stands
        }
        // The nurses only guide - a small rise, posture already upright.
        ["nurse", "nurse2"].forEach((r) => { if (out[r]) translateRole(out[r], 0, -rise * 0.18); });
        return out;
      }
      function projectAssist(base, steps) {
        const start = copyFrameRoles(base);
        const ready = readyAssist(start);
        const stand = patientRises(ready, 0.06);
        return keyframeSequence(start, [
          { target: ready, at: 0.30 },  // slide to the edge, plant feet, sit up
          { target: ready, at: 0.46 },  // "on three - one, two, three"
          { target: stand, at: 0.90 },  // the patient pushes up, nurses guide
          { target: stand, at: 1 }
        ], steps);
      }

      // Future 3: pause and reassess. The patient is unsteady, so instead of
      // forcing the lift the nurses ease them back into the seat, straighten
      // up out of the lift, and steady them - the risky maneuver is defused.
      function stabilizeSeated(start) {
        const cf = counterfactual(start);
        ["nurse", "nurse2"].forEach((r) => { if (trunkOk(cf[r])) straightenTrunk(cf[r], 0.9); });
        if (trunkOk(cf.patient)) {
          straightenTrunk(cf.patient, 0.9);       // eased upright and steady
          translateRole(cf.patient, 0, 0.02);      // settled back down into the seat
        }
        return cf;
      }
      function projectPause(base, steps) {
        const start = copyFrameRoles(base);
        const stable = stabilizeSeated(start);
        const frames = keyframeSequence(start, [
          { target: stable, at: 0.45 },  // lower the patient back, straighten up
          { target: stable, at: 1 }      // hold - stable, reassessing before any lift
        ], steps);
        // The lift is aborted: the moment is no longer a mid-transfer lift but a
        // settled, pre-transfer state. features() weights the preparation phase
        // far lower for knee bend and support distance, so the risk it computes
        // reflects that the dangerous maneuver has actually stopped.
        frames.forEach((f, i) => { if (i > steps * 0.4) f.phase = "preparation"; });
        return frames;
      }

      function scenarioBBox(frames) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        frames.forEach((f, i) => {
          if (i % 4) return;
          ["nurse", "nurse2", "patient"].forEach((role) => {
            const person = f[role];
            if (!person) return;
            joints.forEach((j) => {
              if (!jointOk(person[j])) return;
              const c = corr(person[j]);
              if (c.x < minX) minX = c.x;
              if (c.x > maxX) maxX = c.x;
              if (c.y < minY) minY = c.y;
              if (c.y > maxY) maxY = c.y;
            });
          });
        });
        if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
        return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
      }

      function buildScenarios(baseIndex) {
        const base = state.frames[baseIndex];
        if (!base) return [];
        const defs = [
          { id: "continue", name: "Continue as is", frames: projectContinue(base, baseIndex, FUTURE_STEPS) },
          { id: "assist", name: "Let the patient help", frames: projectAssist(base, FUTURE_STEPS) },
          { id: "pause", name: "Pause and check", frames: projectPause(base, FUTURE_STEPS) }
        ];
        const baseRisk = features(base).risk;
        defs.forEach((sc) => {
          sc.risks = sc.frames.map((f) => features(f).risk);
          sc.startRisk = baseRisk;
          sc.endRisk = sc.risks.length ? sc.risks[sc.risks.length - 1] : 0;
          sc.bbox = scenarioBBox(sc.frames);
        });
        return defs;
      }
      // === logic-end ===

      const video = document.getElementById("video");
      const emptyVideo = document.getElementById("emptyVideo");
      const overlay = document.getElementById("overlay");
      const octx = overlay.getContext("2d");
      const replay = document.getElementById("replay");
      const rctx = replay.getContext("2d");
      const duplex = document.getElementById("duplex");
      const duplexStatusText = document.getElementById("duplexStatusText");
      const duplexHeard = document.getElementById("duplexHeard");
      const duplexCaption = document.getElementById("duplexCaption");
      const timeline = document.getElementById("timeline");
      const metrics = document.getElementById("metrics");
      const riskPill = document.getElementById("riskPill");
      const phaseLabel = document.getElementById("phaseLabel");
      const playBtn = document.getElementById("playBtn");
      const whatIfBtn = document.getElementById("whatIfBtn");
      const micBtn = document.getElementById("micBtn");
      const voiceBtn = document.getElementById("voiceBtn");
      const moshiragUseBtn = document.getElementById("moshiragUseBtn");
      const moshiragDot = document.getElementById("moshiragDot");
      const moshiragStatus = document.getElementById("moshiragStatus");
      const moshiragContext = document.getElementById("moshiragContext");
      const moshiragFrameWrap = document.getElementById("moshiragFrameWrap");
      const moshiragFrame = document.getElementById("moshiragFrame");
      const moshiragActions = document.getElementById("moshiragActions");
      const moshiragCopyBtn = document.getElementById("moshiragCopyBtn");
      const moshiragTabBtn = document.getElementById("moshiragTabBtn");
      const moshiragStopBtn = document.getElementById("moshiragStopBtn");
      const backLiveBtn = document.getElementById("backLiveBtn");
      const vision = document.getElementById("vision");
      const visionTitle = document.getElementById("visionTitle");
      const visionText = document.getElementById("visionText");
      const visionRisk = document.getElementById("visionRisk");
      const visionCanvas = document.getElementById("visionCanvas");
      const visionChoices = document.getElementById("visionChoices");
      const visionNext = document.getElementById("visionNext");
      const visionSkip = document.getElementById("visionSkip");
      const visionClose = document.getElementById("visionClose");
      const orbHero = document.getElementById("orbHero");
      const vrWrap = document.getElementById("vrWrap");
      const vrCanvas = document.getElementById("vrCanvas");
      const vrChip = document.getElementById("vrChip");
      const vrRiskNum = document.getElementById("vrRiskNum");
      const vrRiskBar = document.getElementById("vrRiskBar");
      const sayHint = document.getElementById("sayHint");
      const visionProgress = document.getElementById("visionProgress");
      const previewButtons = Array.prototype.slice.call(document.querySelectorAll("[data-preview]"));
      const chooseButtons = Array.prototype.slice.call(document.querySelectorAll("[data-choose]"));
      const choiceCards = [0, 1, 2].map((i) => document.querySelector('.choice[data-i="' + i + '"]'));

      window.addEventListener("error", (event) => addAi("Startup error: " + event.message, true));

      // No chat log: the ball itself talks. The AI's words appear as a live
      // caption under the ball while they are spoken; what the nurse says shows
      // briefly, then fades - a full-duplex voice exchange, not a transcript.
      function syncDuplex() {
        const listening = !!(state.listenMode || state.choiceListen);
        duplex.classList.toggle("speaking", state.speaking);
        duplex.classList.toggle("listening", listening);
        if (state.speaking) duplexStatusText.textContent = listening ? "Speaking - interrupt me anytime" : "Speaking - tap Speak to interrupt";
        else if (listening) duplexStatusText.textContent = "Listening - just talk";
        else duplexStatusText.textContent = "Standing by - tap Speak to talk";
      }
      function addAi(text, silent) {
        typewriter(duplexCaption, text);
        // In MoshiRAG mode only the FREE replies (routed through addAi) go
        // quiet, because Moshi answers those. The scripted magic-ball
        // narration (risk warning, the three futures, the choice offer) calls
        // speak() directly and always plays - Moshi is passive and cannot be
        // triggered by the system to announce the risk itself.
        if (!silent && !state.moshirag.active) speak(text);
      }
      function addUser(text) {
        duplexHeard.textContent = 'You: "' + text + '"';
        duplexHeard.classList.remove("show");
        void duplexHeard.offsetWidth; // restart the fade animation
        duplexHeard.classList.add("show");
      }

      function setMoshiRagStatus(kind, text) {
        moshiragDot.className = "moshirag-dot" + (kind ? " " + kind : "");
        moshiragStatus.textContent = text;
      }
      function displayMoshiRagUrl() {
        try {
          const u = new URL(state.moshirag.url);
          return u.host;
        } catch {
          return state.moshirag.url || "MoshiRAG";
        }
      }
      // One-line plain-language intent per scenario, for the grounding text.
      function scenarioIntent(sc) {
        if (sc.id === "continue") return "keep lifting the same way, so the patient slips and your back strains more";
        if (sc.id === "assist") return "bring the patient to the edge of the seat, count to three, and let them stand on their own legs while you guide";
        if (sc.id === "pause") return "sit the unsteady patient back down and check before trying again";
        return sc.name;
      }
      // The live risk context that keeps a conversation grounded. Moshi's
      // generic voice client cannot receive injected numbers, so MIRAI shows
      // the current risk/phase/signs (and any projected futures) beside the
      // embedded voice and offers a one-tap "Copy context" to speak to it.
      function buildMoshiContext() {
        const frame = state.frames[state.index];
        if (!frame) return { html: "", plain: "" };
        const f = features(frame);
        const level = riskLevel(f.risk);
        const signs = signsFor(frame, f);
        const top = signs[0] || "movement signs are within the safer range";
        let futures = "";
        const scs = state.oracle.scenarios;
        if (scs && scs.length === 3) {
          futures = " Projected futures: continue " + pct(scs[0].endRisk) + ", ready+assist " + pct(scs[1].endRisk) + ", pause " + pct(scs[2].endRisk) + ".";
        }
        // When a future is chosen in MIRAI, the context leads with that choice
        // so whatever you hand to MoshiRAG matches the option you picked.
        const sel = state.oracle.selected;
        const chosenHtml = sel ? "<b>Chosen:</b> " + sel.name + " (risk " + pct(sel.startRisk) + " &rarr; " + pct(sel.endRisk) + "). " : "";
        const chosenPlain = sel
          ? "The nurse has chosen this future: '" + sel.name + "' - " + scenarioIntent(sel) + ". Projected risk goes from " + pct(sel.startRisk) + " to " + pct(sel.endRisk) + ". "
          : "";
        const html = chosenHtml + "<b>Now:</b> risk " + pct(f.risk) + " (" + level.label + ") &middot; phase " + (frame.phase || "-")
          + " &middot; nurse trunk " + Math.round(f.trunkFlexion) + "&deg;"
          + (f.kneeBend === null ? "" : " &middot; knee " + Math.round(f.kneeBend) + "&deg;")
          + " &middot; patient distance " + Math.round(f.supportDistance) + "%. <b>Sign:</b> " + top + ".";
        const plain = chosenPlain + "Live patient-transfer context for your advice. Current transfer risk is " + pct(f.risk) + " out of 100 ("
          + level.label + "), phase " + (frame.phase || "unknown") + ". Nurse trunk flexion " + Math.round(f.trunkFlexion)
          + " degrees, " + (f.kneeBend === null ? "knee bend not visible" : "knee bend " + Math.round(f.kneeBend) + " degrees")
          + ", patient is at " + Math.round(f.supportDistance) + " percent of the nurse's trunk length, patient tilt "
          + Math.round(f.patientTilt) + " degrees. Main sign: " + top + "." + futures
          + (sel ? " Talk about the chosen future above and why it is safer." : " Give safe patient-handling advice grounded in these numbers.");
        return { html, plain };
      }
      function updateMoshiRagContext() {
        if (!state.moshirag.configured) return;
        const ctx = buildMoshiContext();
        state.moshirag.context = ctx.plain;
        if (ctx.html && (state.moshirag.healthy || state.moshirag.active)) {
          moshiragContext.innerHTML = ctx.html;
          moshiragContext.style.display = "";
        } else if (!ctx.html) {
          moshiragContext.style.display = "none";
        }
      }
      // Push the live context to the MoshiRAG server so it can inject it into
      // the model's system prompt. This is the MIRAI half of automatic
      // grounding; it only has an effect once the server exposes the context
      // endpoint (see README). Silent + best-effort: a 404 just means the
      // server side has not been added yet.
      async function pushMoshiContext(event) {
        if (!state.moshirag.configured || state.moshirag.contextUnsupported) return;
        const frame = state.frames[state.index];
        if (!frame) return;
        const f = features(frame);
        const sel = state.oracle.selected;
        const payload = {
          event: event || "update",
          risk: pct(f.risk),
          level: riskLevel(f.risk).label,
          high: f.risk >= 0.6,
          phase: frame.phase || "",
          chosen: sel ? sel.name : null,
          context: buildMoshiContext().plain,
        };
        try {
          const r = await fetch("/api/moshirag/context", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const body = await r.json();
          if (body.ok && body.upstreamStatus && body.upstreamStatus < 300) {
            state.moshirag.contextPushed = true;
          } else if ((body.upstreamStatus >= 400 || body.error) && !state.moshirag.contextUnsupported) {
            // Server has no context endpoint yet: stop trying, hint once.
            state.moshirag.contextUnsupported = true;
            if (state.moshirag.active || state.moshirag.healthy) {
              setMoshiRagStatus(state.moshirag.active ? "ok" : "ok",
                "Live voice runs here. Automatic grounding needs a small server change: add a POST /api/context endpoint that injects the context into the model's system prompt (see README). Until then, use 'Copy context' to ground it by hand.");
            }
          }
        } catch { void 0; }
      }
      async function loadMoshiRagConfig() {
        try {
          const response = await fetch("/api/moshirag/config", { cache: "no-store" });
          const cfg = await response.json();
          if (!response.ok) throw new Error(cfg.error || ("HTTP " + response.status));
          state.moshirag.configured = !!cfg.configured;
          state.moshirag.url = cfg.url || "";
          state.moshirag.chatUrl = cfg.chatUrl || "";
          state.moshirag.healthy = false;
          if (!state.moshirag.configured) {
            moshiragUseBtn.disabled = true;
            moshiragActions.style.display = "none";
            setMoshiRagStatus("warn", "Set MOSHIRAG_URL to the RunPod Gradio URL, then restart npm run dev. Built-in voice is active meanwhile.");
            return;
          }
          moshiragUseBtn.title = state.moshirag.url;
          setMoshiRagStatus("warn", "Configured at " + displayMoshiRagUrl() + ". Checking health...");
          checkMoshiRagHealth();
        } catch (error) {
          moshiragUseBtn.disabled = true;
          setMoshiRagStatus("bad", "MoshiRAG config endpoint failed: " + (error && error.message ? error.message : "unknown error"));
        }
      }
      async function checkMoshiRagHealth() {
        if (!state.moshirag.configured) return;
        try {
          const response = await fetch("/api/moshirag/health", { cache: "no-store" });
          const body = await response.json();
          if (!response.ok || body.ok === false) throw new Error(body.error || ("HTTP " + response.status));
          state.moshirag.healthy = true;
          moshiragUseBtn.disabled = false;
          moshiragActions.style.display = "";
          setMoshiRagStatus("ok", "Connected to " + displayMoshiRagUrl() + ". Press 'Use MoshiRAG voice' to run the live full-duplex model in this panel.");
          updateMoshiRagContext();
        } catch (error) {
          state.moshirag.healthy = false;
          moshiragUseBtn.disabled = false; // still allow trying / opening a tab
          moshiragActions.style.display = "";
          setMoshiRagStatus("bad", "Configured, but health check failed: " + (error && error.message ? error.message : "no response") + " The server may be asleep - built-in voice stays available.");
          updateMoshiRagContext();
        }
      }
      // Embed the native MoshiRAG full-duplex client in the panel. MIRAI's own
      // TTS is muted so the two voices never overlap; the scripted magic-ball
      // narration and the built-in mock stay available when you switch back.
      function activateMoshiRag() {
        if (!state.moshirag.configured || !state.moshirag.url) {
          addAi("MoshiRAG is not configured yet. Start this app with MOSHIRAG_URL set to your RunPod Gradio URL.", true);
          return;
        }
        // Load the client's own URL untouched - Kyutai's Moshi client is a
        // React SPA; an injected hash could interfere with its routing, and it
        // does not read our context anyway (the strip + Copy context ground it).
        moshiragFrame.src = state.moshirag.url;
        moshiragFrameWrap.style.display = "";
        moshiragUseBtn.style.display = "none";
        moshiragStopBtn.style.display = "";
        state.moshirag.active = true;
        // MIRAI keeps speaking the scripted risk narration (the embedded Moshi
        // is passive and cannot be triggered by the system); only free replies
        // go to Moshi. So the built-in voice stays ON here.
        setMoshiRagStatus("ok", "MoshiRAG handles your free questions - talk to it below. MIRAI still announces the risk and explains the three futures itself, because the embedded Moshi client is passive and cannot be triggered by the system. Press 'Back to built-in voice' to switch off.");
        updateMoshiRagContext();
        pushMoshiContext("start");
      }
      function deactivateMoshiRag() {
        moshiragFrame.src = "about:blank";
        moshiragFrameWrap.style.display = "none";
        moshiragUseBtn.style.display = "";
        moshiragStopBtn.style.display = "none";
        state.moshirag.active = false;
        setMoshiRagStatus(state.moshirag.healthy ? "ok" : "warn", "Back to MIRAI's built-in voice for everything. Press 'Use MoshiRAG voice' to hand free conversation back to the live model.");
      }
      function openMoshiRagTab() {
        if (!state.moshirag.configured || !state.moshirag.url) {
          addAi("MoshiRAG is not configured yet. Start this app with MOSHIRAG_URL set to your RunPod Gradio URL.", true);
          return;
        }
        const opened = window.open(state.moshirag.url, "_blank", "noopener,noreferrer");
        if (!opened) addAi("The browser blocked the MoshiRAG tab. Allow pop-ups for this page, then try again.", true);
        else addAi("MoshiRAG opened in a new tab for the native full-duplex voice; this MIRAI tab keeps the skeleton risk and future previews.", true);
      }
      async function copyMoshiContext() {
        const plain = buildMoshiContext().plain;
        if (!plain) { addAi("No live context yet - load a video first.", true); return; }
        try {
          await navigator.clipboard.writeText(plain);
          setMoshiRagStatus(state.moshirag.active ? "ok" : (state.moshirag.healthy ? "ok" : "warn"), "Live context copied - speak or paste it to MoshiRAG so its advice is grounded in the current numbers.");
        } catch {
          addAi("Could not copy automatically. Here is the live context to give MoshiRAG: " + plain, true);
        }
      }

      // ---- Voice: TTS for every AI reply, STT for the nurse, with barge-in.
      const synth = window.speechSynthesis || null;
      if (synth) synth.getVoices();
      function pickVoice() {
        if (!synth) return null;
        const voices = synth.getVoices();
        return voices.find((v) => v.lang === "en-US" && /Google|Samantha|Aria|Zira/.test(v.name))
          || voices.find((v) => v.lang && v.lang.indexOf("en") === 0)
          || null;
      }
      function speak(text, onDone) {
        if (!state.voiceOn || !synth) return false;
        try {
          synth.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "en-US";
          u.rate = 1.02;
          const v = pickVoice();
          if (v) u.voice = v;
          state.speaking = true;
          vision.classList.add("speaking");
          syncDuplex();
          // Pause the mic while the AI talks so it does not hear itself;
          // resume as soon as the utterance ends (or is interrupted).
          stopRecognition();
          let finished = false;
          const done = () => {
            if (finished) return;
            finished = true;
            state.speaking = false;
            vision.classList.remove("speaking");
            syncDuplex();
            if (state.listenMode || state.choiceListen) startRecognition();
            if (onDone) onDone();
          };
          u.onend = done;
          u.onerror = done;
          synth.speak(u);
          return true;
        } catch (err) {
          state.speaking = false;
          vision.classList.remove("speaking");
          syncDuplex();
          return false;
        }
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
      let recognition = null;
      function startRecognition() {
        syncDuplex();
        if (!SR || recognition || !(state.listenMode || state.choiceListen)) return;
        recognition = new SR();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (!transcript || !transcript.trim()) return;
          // On the list, once any future is previewed, spoken words pick one.
          if (state.vision.active && state.vision.stage === "menu" && state.vision.seen.some(Boolean)) {
            handleChoiceSpeech(transcript);
            return;
          }
          ask(transcript);
        };
        recognition.onend = () => {
          recognition = null;
          if ((state.listenMode || state.choiceListen) && !state.speaking) startRecognition();
        };
        recognition.onerror = (event) => {
          recognition = null;
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            state.listenMode = false;
            state.choiceListen = false;
            micBtn.textContent = "Speak";
            syncDuplex();
            addAi("Microphone access was blocked, so please use the quick chips instead. The AI will still answer aloud.");
          }
        };
        try { recognition.start(); } catch (err) { recognition = null; }
      }
      function stopRecognition() {
        syncDuplex();
        if (!recognition) return;
        const r = recognition;
        recognition = null;
        try { r.abort(); } catch (err) { void err; }
      }

      function resizeCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(rect.width * scale));
        canvas.height = Math.max(1, Math.floor(rect.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
      }

      // Keypoints are normalized to the video image; object-fit: contain letterboxes
      // it inside the stage, so the overlay must map into the displayed rect.
      function videoDisplayRect() {
        const w = overlay.clientWidth;
        const h = overlay.clientHeight;
        if (!video.src || !video.videoWidth || !video.videoHeight) return { x: 0, y: 0, w: w, h: h };
        const scale = Math.min(w / video.videoWidth, h / video.videoHeight);
        const dw = video.videoWidth * scale;
        const dh = video.videoHeight * scale;
        return { x: (w - dw) / 2, y: (h - dh) / 2, w: dw, h: dh };
      }

      function drawPerson(ctx, person, color, label, mapFn, ghost) {
        if (!person) return;
        ctx.save();
        ctx.lineWidth = ghost ? 3 : 4;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        if (ghost) {
          ctx.globalAlpha = 0.85;
          ctx.setLineDash([7, 5]);
        }
        bones.forEach(([a, b]) => {
          if (!jointOk(person[a]) || !jointOk(person[b])) return;
          const pa = mapFn(person[a]);
          const pb = mapFn(person[b]);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        });
        joints.forEach((j) => {
          if (!jointOk(person[j])) return;
          const pt = mapFn(person[j]);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ghost ? 4 : 5, 0, Math.PI * 2);
          ctx.fill();
        });
        if (label && jointOk(person.head)) {
          const head = mapFn(person.head);
          ctx.setLineDash([]);
          ctx.font = "bold 13px system-ui";
          ctx.fillText(label, head.x + 10, head.y - 10);
        }
        ctx.restore();
      }

      function drawOverlay() {
        resizeCanvas(overlay);
        const w = overlay.clientWidth;
        const h = overlay.clientHeight;
        octx.clearRect(0, 0, w, h);
        if (!video.src) {
          octx.fillStyle = "rgba(8, 12, 26, 0.55)";
          octx.fillRect(0, 0, w, h);
          octx.strokeStyle = "rgba(126, 150, 210, 0.14)";
          for (let i = 0; i < 8; i += 1) {
            octx.beginPath();
            octx.moveTo(0, h * (i / 8));
            octx.lineTo(w, h * (i / 8));
            octx.stroke();
          }
        }
        const frame = state.frames[state.index];
        if (!frame) return;
        const rect = videoDisplayRect();
        const mapFn = (p) => ({ x: rect.x + p.x * rect.w, y: rect.y + p.y * rect.h });
        drawPerson(octx, frame.nurse, "#4d8dff", "nurse 1", mapFn, false);
        drawPerson(octx, frame.nurse2, "#2dd0e0", "nurse 2", mapFn, false);
        drawPerson(octx, frame.patient, "#a78bfa", "patient", mapFn, false);
        if (state.whatIf) {
          const cf = counterfactual(frame);
          drawPerson(octx, cf.nurse, "#2dd4a7", "what-if", mapFn, true);
          drawPerson(octx, cf.nurse2, "#2dd4a7", "", mapFn, true);
          drawPerson(octx, cf.patient, "#2dd4a7", "", mapFn, true);
        }
        const f = features(frame);
        if (f.risk > 0.60) {
          const topSign = signsFor(frame, f)[0] || "overall movement risk is high";
          octx.fillStyle = "rgba(255, 93, 115, 0.13)";
          octx.fillRect(0, 0, w, h);
          octx.fillStyle = "#ff5d73";
          octx.font = "bold 18px system-ui";
          octx.fillText("Risk sign: " + topSign, 24, 34);
        }
      }

      // Replay = the extracted motion mapped out of the camera frame: both skeletons
      // are re-centered and re-scaled so the movement itself is what you compare.
      // When a magic-ball future is selected, the replay steps into that future.
      // ---- 3D replay view (MotionBERT-lifted poses) ----------------------
      // Both the live present and the chosen future render as 3D mesh figures
      // in one orbitable scene. Live uses frame.pose3d directly; futures are
      // lifted from the base frame's 3D pose (see build3dFuture) so they start
      // exactly where the live figure is and animate in the same space.
      // Each figure's own pose is real 3D; depth BETWEEN people is not
      // measurable from one camera, so figures share a ground plane and are
      // spread by their 2D hip positions.
      const view3d = { yaw: -0.5, pitch: -0.16, auto: true, dragging: false, lastX: 0, lastY: 0, pid: 0 };
      replay.addEventListener("pointerdown", (event) => {
        view3d.dragging = true;
        view3d.auto = false;
        view3d.lastX = event.clientX;
        view3d.lastY = event.clientY;
        view3d.pid = event.pointerId;
        replay.classList.add("grabbing");
        if (replay.setPointerCapture) { try { replay.setPointerCapture(event.pointerId); } catch (e) { void e; } }
        event.preventDefault();
      });
      replay.addEventListener("pointermove", (event) => {
        if (!view3d.dragging) return;
        view3d.yaw += (event.clientX - view3d.lastX) * 0.013;
        view3d.pitch = clamp(view3d.pitch + (event.clientY - view3d.lastY) * 0.009, -1.25, 1.25);
        view3d.lastX = event.clientX;
        view3d.lastY = event.clientY;
        drawReplay();
        event.preventDefault();
      });
      function endDrag() { view3d.dragging = false; replay.classList.remove("grabbing"); }
      replay.addEventListener("pointerup", endDrag);
      replay.addEventListener("pointercancel", endDrag);
      replay.addEventListener("dblclick", () => { view3d.auto = true; view3d.pitch = -0.16; });

      function rot3(v, cy, sy, cp, sp) {
        const x1 = v[0] * cy + v[2] * sy;
        const z1 = -v[0] * sy + v[2] * cy;
        return { x: x1, y: v[1] * cp - z1 * sp, z: v[1] * sp + z1 * cp };
      }

      // A tapered, round-capped "flesh" segment between two projected points.
      function fleshCapsule(a, b, wA, wB) {
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        rctx.beginPath();
        rctx.moveTo(a.x + nx * wA, a.y + ny * wA);
        rctx.lineTo(b.x + nx * wB, b.y + ny * wB);
        rctx.lineTo(b.x - nx * wB, b.y - ny * wB);
        rctx.lineTo(a.x - nx * wA, a.y - ny * wA);
        rctx.closePath();
        rctx.fill();
        rctx.beginPath(); rctx.arc(a.x, a.y, wA, 0, Math.PI * 2); rctx.fill();
        rctx.beginPath(); rctx.arc(b.x, b.y, wB, 0, Math.PI * 2); rctx.fill();
      }

      // Render one role as a solid mesh body from its projected joints, with
      // body parts painted back-to-front so nearer limbs occlude farther ones.
      function drawMeshFigure3d(m, color) {
        if (!m.neck || !m.hip) return;
        const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const unit = Math.max(d(m.neck, m.hip), 10);
        const ax = (m.hip.x - m.neck.x) / unit;
        const ay = (m.hip.y - m.neck.y) / unit;
        const px = -ay;
        const py = ax;
        const hipW = unit * 0.17;
        const shW = unit * 0.22;
        const lHip = { x: m.hip.x + px * hipW, y: m.hip.y + py * hipW, z: m.hip.z };
        const rHip = { x: m.hip.x - px * hipW, y: m.hip.y - py * hipW, z: m.hip.z };
        const lSh = m.lShoulder || { x: m.neck.x + px * shW, y: m.neck.y + py * shW, z: m.neck.z };
        const rSh = m.rShoulder || { x: m.neck.x - px * shW, y: m.neck.y - py * shW, z: m.neck.z };
        const parts = [];
        const cap = (a, b, wA, wB) => { if (a && b) parts.push({ z: (a.z + b.z) / 2, fn: () => fleshCapsule(a, b, wA, wB) }); };
        parts.push({ z: (lSh.z + rSh.z + lHip.z + rHip.z) / 4, fn: () => {
          rctx.beginPath();
          rctx.moveTo(lSh.x, lSh.y); rctx.lineTo(rSh.x, rSh.y);
          rctx.lineTo(rHip.x, rHip.y); rctx.lineTo(lHip.x, lHip.y);
          rctx.closePath(); rctx.fill();
        } });
        if (m.head) {
          cap(m.neck, m.head, unit * 0.12, unit * 0.12);
          const hr = clamp(d(m.head, m.neck) * 0.62, unit * 0.16, unit * 0.42);
          parts.push({ z: m.head.z, fn: () => { rctx.beginPath(); rctx.arc(m.head.x, m.head.y, hr, 0, Math.PI * 2); rctx.fill(); } });
        }
        cap(lSh, m.lElbow, unit * 0.15, unit * 0.11); cap(m.lElbow, m.lWrist, unit * 0.11, unit * 0.08);
        cap(rSh, m.rElbow, unit * 0.15, unit * 0.11); cap(m.rElbow, m.rWrist, unit * 0.11, unit * 0.08);
        cap(lHip, m.lKnee, unit * 0.19, unit * 0.13); cap(m.lKnee, m.lAnkle, unit * 0.13, unit * 0.09);
        cap(rHip, m.rKnee, unit * 0.19, unit * 0.13); cap(m.rKnee, m.rAnkle, unit * 0.13, unit * 0.09);
        parts.sort((a, b) => b.z - a.z);
        rctx.save();
        rctx.lineJoin = "round";
        rctx.lineCap = "round";
        parts.forEach((p) => {
          const alpha = clamp(0.6 - p.z * 0.26, 0.3, 0.82);
          rctx.fillStyle = hexA(color, alpha);
          p.fn();
        });
        // Bright skeleton on top for definition (mocap x-ray look).
        rctx.strokeStyle = "rgba(238, 243, 255, 0.5)";
        rctx.lineWidth = Math.max(unit * 0.03, 1);
        bones.forEach(([a, b]) => {
          if (!m[a] || !m[b]) return;
          rctx.beginPath(); rctx.moveTo(m[a].x, m[a].y); rctx.lineTo(m[b].x, m[b].y); rctx.stroke();
        });
        rctx.restore();
      }

      // Draw a scene of 3D figures. poseMap: {role: {joint:[x,y,z]}} (root-
      // relative meters). frame2d supplies each role's 2D hip for horizontal
      // placement. Returns false if nothing to draw (caller falls back to 2D).
      function draw3dScene(poseMap, frame2d, w, h, caption, captionColor) {
        const roles = ["nurse", "nurse2", "patient"].filter((r) => poseMap[r] && frame2d[r]);
        if (!roles.length) return false;
        const cy = Math.cos(view3d.yaw);
        const sy = Math.sin(view3d.yaw);
        const cp = Math.cos(view3d.pitch);
        const sp = Math.sin(view3d.pitch);
        const scale = (h - 78) / 2.1; // ~2.1 m of body height fits the panel
        const groundY = h * 0.56;
        const colors = { nurse: "#4d8dff", nurse2: "#2dd0e0", patient: "#a78bfa" };
        const figs = roles.map((role) => {
          const hip2d = frame2d[role].hip;
          const anchorX = w * (0.18 + clamp(hip2d ? hip2d.x : 0.5, 0, 1) * 0.64);
          const p3 = poseMap[role];
          const proj = {};
          let zsum = 0;
          let zc = 0;
          joints.forEach((name) => {
            const v = p3[name];
            if (!v) return;
            const r = rot3(v, cy, sy, cp, sp);
            proj[name] = { x: anchorX + r.x * scale, y: groundY + r.y * scale, z: r.z };
            zsum += r.z; zc += 1;
          });
          return { role, proj, color: colors[role], z: zc ? zsum / zc : 0 };
        });
        // Ground shadows first (all figures), then figures far-to-near.
        figs.forEach((fig) => {
          const p = fig.proj;
          if (!p.lAnkle && !p.rAnkle && !p.hip) return;
          const feet = [p.lAnkle, p.rAnkle].filter(Boolean);
          const cx = feet.length ? feet.reduce((s, q) => s + q.x, 0) / feet.length : p.hip.x;
          const fy = feet.length ? Math.max.apply(null, feet.map((q) => q.y)) : p.hip.y + scale * 0.9;
          rctx.fillStyle = "rgba(6, 10, 26, 0.5)";
          rctx.beginPath();
          rctx.ellipse(cx, fy + 4, scale * 0.34, scale * 0.08, 0, 0, Math.PI * 2);
          rctx.fill();
        });
        figs.sort((a, b) => b.z - a.z);
        figs.forEach((fig) => drawMeshFigure3d(fig.proj, fig.color));
        // Labels (drawn last, unshaded).
        figs.forEach((fig) => {
          const head = fig.proj.head || fig.proj.neck;
          if (!head) return;
          rctx.fillStyle = fig.color;
          rctx.font = "bold 12px system-ui";
          rctx.fillText(fig.role === "nurse" ? "nurse 1" : fig.role === "nurse2" ? "nurse 2" : "patient", head.x + 8, head.y - 10);
        });
        if (caption) {
          rctx.fillStyle = captionColor || "rgba(200, 214, 246, 0.92)";
          rctx.font = "bold 13px system-ui";
          rctx.fillText(caption, 14, 22);
        }
        rctx.fillStyle = "rgba(170, 190, 235, 0.7)";
        rctx.font = "11px system-ui";
        rctx.fillText("3D mesh (MotionBERT) - drag to rotate, double-click to reset", 14, h - 10);
        return true;
      }

      // Lift a projected 2D future into the same 3D space as the live view.
      // Each joint starts from the base frame's real 3D position and moves by
      // the projected 2D displacement, scaled from image space to metric by
      // the role's trunk ratio and taken relative to the hip so the pose stays
      // root-relative (the hip's own travel is carried by the 2D anchor).
      // Depth (z) is held from the base pose. A role the base had no 3D for
      // (e.g. a synthesized second nurse) gets a flat, camera-facing billboard.
      function build3dFuture(sc, baseIndex) {
        const base = state.frames[baseIndex];
        if (!base || !base.pose3d) return null;
        const roleScale = {};
        const scales = [];
        ["nurse", "nurse2", "patient"].forEach((role) => {
          const b3 = base.pose3d[role];
          const b2 = base[role];
          if (!b3 || !b2 || !jointOk(b2.neck) || !jointOk(b2.hip)) return;
          const t2 = Math.hypot((b2.neck.x - b2.hip.x) * state.aspect, b2.neck.y - b2.hip.y);
          const t3 = Math.hypot(b3.neck[0] - b3.hip[0], b3.neck[1] - b3.hip[1]);
          if (t2 > 1e-4 && t3 > 1e-4) { roleScale[role] = t3 / t2; scales.push(t3 / t2); }
        });
        const defScale = scales.length ? scales.slice().sort((a, b) => a - b)[scales.length >> 1] : 5;
        return sc.frames.map((f) => {
          const fr = {};
          ["nurse", "nurse2", "patient"].forEach((role) => {
            const f2 = f[role];
            if (!f2 || !jointOk(f2.hip)) return;
            const b3 = base.pose3d[role];
            const b2 = base[role];
            if (b3 && b2 && roleScale[role] && jointOk(b2.hip)) {
              const s = roleScale[role];
              const hdx = (f2.hip.x - b2.hip.x) * state.aspect * s;
              const hdy = (f2.hip.y - b2.hip.y) * s;
              const pose = {};
              joints.forEach((j) => {
                const base3 = b3[j];
                if (!base3) return;
                const bj = b2[j];
                const fj = f2[j];
                if (bj && fj && jointOk(bj) && jointOk(fj)) {
                  pose[j] = [base3[0] + (fj.x - bj.x) * state.aspect * s - hdx, base3[1] + (fj.y - bj.y) * s - hdy, base3[2]];
                } else {
                  pose[j] = base3.slice();
                }
              });
              fr[role] = pose;
            } else if (jointOk(f2.neck)) {
              const pose = {};
              joints.forEach((j) => {
                const q = f2[j];
                if (!q || !jointOk(q)) return;
                pose[j] = [(q.x - f2.hip.x) * state.aspect * defScale, (q.y - f2.hip.y) * defScale, 0];
              });
              if (pose.neck && pose.hip) fr[role] = pose;
            }
          });
          return fr;
        });
      }

      function drawReplay() {
        resizeCanvas(replay);
        const w = replay.clientWidth;
        const h = replay.clientHeight;
        rctx.clearRect(0, 0, w, h);
        rctx.strokeStyle = "rgba(126, 150, 210, 0.16)";
        for (let i = 0; i < 6; i += 1) {
          rctx.beginPath();
          rctx.moveTo(20 + i * 70, h - 24);
          rctx.lineTo(90 + i * 70, 34);
          rctx.stroke();
        }
        const sel = state.oracle.selected;
        let frame;
        let box = null;
        if (sel) {
          const fi = state.oracle.tick % sel.frames.length;
          frame = sel.frames[fi];
          box = sel.bbox;
          // Future in the same 3D scene as the live view: lifted from the base
          // frame's real 3D pose, so it starts exactly where the present figure
          // is and moves in the same space. Falls back to the 2D humanoid only
          // if the base moment had no 3D (early frames with no detection).
          if (sel.frames3d && draw3dScene(
            sel.frames3d[fi], frame, w, h,
            "FUTURE - " + sel.name + ": risk " + pct(sel.startRisk) + " -> " + pct(sel.endRisk),
            riskLevel(sel.endRisk).color
          )) return;
        } else {
          frame = state.frames[state.index];
        }
        if (!frame) return;
        if (!sel && frame.pose3d && draw3dScene(frame.pose3d, frame, w, h)) return;
        if (!box) {
          const pts = [];
          [frame.nurse, frame.nurse2, frame.patient].forEach((person) => {
            if (!person) return;
            joints.forEach((j) => { if (jointOk(person[j])) pts.push(corr(person[j])); });
          });
          if (pts.length < 4) return;
          box = {
            minX: Math.min.apply(null, pts.map((p) => p.x)),
            maxX: Math.max.apply(null, pts.map((p) => p.x)),
            minY: Math.min.apply(null, pts.map((p) => p.y)),
            maxY: Math.max.apply(null, pts.map((p) => p.y))
          };
        }
        const spanX = Math.max(box.maxX - box.minX, 0.05);
        const spanY = Math.max(box.maxY - box.minY, 0.05);
        const pad = 26;
        const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
        const ox = (w - spanX * scale) / 2;
        const oy = (h - spanY * scale) / 2;
        const mapFn = (p) => {
          const c = corr(p);
          return { x: ox + (c.x - box.minX) * scale, y: oy + (c.y - box.minY) * scale };
        };
        // A chosen future replays as full humanoid figures; the live present
        // stays a plain skeleton, mirroring the video overlay.
        const draw = sel
          ? (person, color) => drawHuman(rctx, person, color, "", mapFn)
          : (person, color) => drawPerson(rctx, person, color, "", mapFn, false);
        draw(frame.nurse, "#4d8dff");
        draw(frame.nurse2, "#2dd0e0");
        draw(frame.patient, "#a78bfa");
        if (sel) {
          rctx.fillStyle = riskLevel(sel.endRisk).color;
          rctx.font = "bold 13px system-ui";
          rctx.fillText("FUTURE - " + sel.name + ": risk " + pct(sel.startRisk) + " -> " + pct(sel.endRisk), 14, 22);
        } else if (state.whatIf) {
          const cf = counterfactual(frame);
          drawPerson(rctx, cf.nurse, "#2dd4a7", "", mapFn, true);
          drawPerson(rctx, cf.nurse2, "#2dd4a7", "", mapFn, true);
          drawPerson(rctx, cf.patient, "#2dd4a7", "", mapFn, true);
        }
      }

      // ---- Humanoid rendering for the projected futures --------------------
      // The same 13 keypoints, fleshed out into a body: filled torso, head and
      // capsule limbs, with the skeleton still drawn on top (mocap x-ray look).
      function hexA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
      }
      function drawHuman(ctx, person, color, label, mapFn) {
        if (!person) return;
        // Without a measurable trunk there is no body to flesh out.
        if (!jointOk(person.neck) || !jointOk(person.hip)) {
          drawPerson(ctx, person, color, label, mapFn, false);
          return;
        }
        const m = {};
        joints.forEach((j) => { if (jointOk(person[j])) m[j] = mapFn(person[j]); });
        const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const unit = Math.max(d(m.neck, m.hip), 8);
        // Perpendicular to the trunk axis: widens the hip point into a pelvis
        // and stands in for missing shoulders.
        const ax = (m.hip.x - m.neck.x) / unit;
        const ay = (m.hip.y - m.neck.y) / unit;
        const px = -ay;
        const py = ax;
        const hipW = unit * 0.17;
        const lHip = { x: m.hip.x + px * hipW, y: m.hip.y + py * hipW };
        const rHip = { x: m.hip.x - px * hipW, y: m.hip.y - py * hipW };
        const shW = unit * 0.21;
        const lSh = m.lShoulder || { x: m.neck.x + px * shW, y: m.neck.y + py * shW };
        const rSh = m.rShoulder || { x: m.neck.x - px * shW, y: m.neck.y - py * shW };
        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const body = hexA(color, 0.4);
        ctx.fillStyle = body;
        ctx.strokeStyle = body;
        const capsule = (a, b, w) => {
          if (!a || !b) return;
          ctx.lineWidth = Math.max(w, 1.5);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        };
        // Torso: shoulders down to the widened pelvis, thick-stroked so the
        // corners round off into flesh rather than a hard quad.
        ctx.beginPath();
        ctx.moveTo(lSh.x, lSh.y);
        ctx.lineTo(rSh.x, rSh.y);
        ctx.lineTo(rHip.x, rHip.y);
        ctx.lineTo(lHip.x, lHip.y);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = unit * 0.24;
        ctx.stroke();
        let headR = unit * 0.2;
        if (m.head) {
          headR = clamp(d(m.head, m.neck) * 0.6, unit * 0.14, unit * 0.4);
          capsule(m.neck, m.head, unit * 0.13);
          ctx.beginPath();
          ctx.arc(m.head.x, m.head.y, headR, 0, Math.PI * 2);
          ctx.fill();
        }
        capsule(lSh, m.lElbow, unit * 0.15);
        capsule(m.lElbow, m.lWrist, unit * 0.12);
        capsule(rSh, m.rElbow, unit * 0.15);
        capsule(m.rElbow, m.rWrist, unit * 0.12);
        capsule(lHip, m.lKnee, unit * 0.19);
        capsule(m.lKnee, m.lAnkle, unit * 0.14);
        capsule(rHip, m.rKnee, unit * 0.19);
        capsule(m.rKnee, m.rAnkle, unit * 0.14);
        // The skeleton stays visible on top of the body.
        ctx.strokeStyle = "rgba(238, 243, 255, 0.7)";
        ctx.fillStyle = "rgba(238, 243, 255, 0.9)";
        ctx.lineWidth = Math.max(unit * 0.035, 1.2);
        bones.forEach(([a, b]) => {
          if (!m[a] || !m[b]) return;
          ctx.beginPath();
          ctx.moveTo(m[a].x, m[a].y);
          ctx.lineTo(m[b].x, m[b].y);
          ctx.stroke();
        });
        const dotR = Math.max(unit * 0.045, 2);
        joints.forEach((j) => {
          if (!m[j]) return;
          ctx.beginPath();
          ctx.arc(m[j].x, m[j].y, dotR, 0, Math.PI * 2);
          ctx.fill();
        });
        if (label && m.head) {
          ctx.fillStyle = color;
          ctx.font = "bold 13px system-ui";
          ctx.fillText(label, m.head.x + headR + 5, m.head.y - headR);
        }
        ctx.restore();
      }

      // ---- Magic-ball vision: cinematic full-screen sequence ---------------
      // Risk detected -> video pauses -> the ball wakes -> each future is shown
      // one by one with narration -> all three appear together for the choice.
      function drawSkeletonInBall(canvas, frame, bbox, vrFloor) {
        resizeCanvas(canvas);
        const ctx = canvas.getContext("2d");
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.clearRect(0, 0, w, h);
        if (vrFloor) {
          // Simple VR-room floor: converging perspective lines and a horizon.
          ctx.strokeStyle = "rgba(126, 150, 210, 0.14)";
          const horizon = h * 0.62;
          for (let i = 0; i <= 8; i += 1) {
            ctx.beginPath();
            ctx.moveTo((w / 8) * i, h);
            ctx.lineTo(w / 2 + (((w / 8) * i) - w / 2) * 0.25, horizon);
            ctx.stroke();
          }
          for (let i = 0; i < 4; i += 1) {
            const y = horizon + (h - horizon) * (i / 4);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }
        }
        if (!frame || !bbox) return;
        const spanX = Math.max(bbox.maxX - bbox.minX, 0.05);
        const spanY = Math.max(bbox.maxY - bbox.minY, 0.05);
        const pad = Math.max(vrFloor ? 26 : 12, w * (vrFloor ? 0.06 : 0.1));
        const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
        const ox = (w - spanX * scale) / 2;
        const oy = (h - spanY * scale) / 2;
        const mapFn = (p) => {
          const c = corr(p);
          return { x: ox + (c.x - bbox.minX) * scale, y: oy + (c.y - bbox.minY) * scale };
        };
        ctx.shadowColor = "rgba(150, 170, 255, 0.9)";
        ctx.shadowBlur = vrFloor ? 14 : 10;
        drawHuman(ctx, frame.nurse, "#4d8dff", vrFloor ? "nurse 1" : "", mapFn);
        drawHuman(ctx, frame.nurse2, "#2dd0e0", vrFloor ? "nurse 2" : "", mapFn);
        drawHuman(ctx, frame.patient, "#a78bfa", vrFloor ? "patient" : "", mapFn);
        ctx.shadowBlur = 0;
      }

      function drawVision() {
        if (!state.vision.active || !state.oracle.scenarios) return;
        const stage = state.vision.stage;
        // The list ("menu") shows no canvas; the ball ("orb") holds this exact
        // moment while its future is explained; the motion ("vr") plays large.
        if (stage === "orb") {
          drawSkeletonInBall(visionCanvas, state.frames[state.oracle.baseIndex], state.vision.baseBBox, false);
          return;
        }
        if (stage !== "vr") return;
        const sc = state.oracle.scenarios[state.vision.preview];
        if (!sc) return;
        const idx = state.oracle.tick % sc.frames.length;
        drawSkeletonInBall(vrCanvas, sc.frames[idx], sc.bbox, true);
        const riskNow = sc.risks[idx];
        const level = riskLevel(riskNow);
        vrRiskNum.textContent = pct(riskNow) + " - " + level.label;
        vrRiskNum.style.color = level.color;
        vrRiskBar.style.width = pct(riskNow) + "%";
        vrRiskBar.style.background = level.color;
      }

      // One timer per element: the ball caption and the vision text can both
      // type at once without cancelling each other.
      const typeTimers = new Map();
      function typewriter(el, text) {
        stopTypewriter(el);
        el.textContent = "";
        let i = 0;
        const timer = setInterval(() => {
          i += 2;
          el.textContent = text.slice(0, i);
          if (i >= text.length) { clearInterval(timer); typeTimers.delete(el); }
        }, 22);
        typeTimers.set(el, timer);
      }
      function stopTypewriter(el) {
        const timer = typeTimers.get(el);
        if (timer) { clearInterval(timer); typeTimers.delete(el); }
      }

      function pauseAll() {
        if (video.src && !video.paused) video.pause();
        state.playing = false;
        if (!video.src) playBtn.textContent = "Play";
      }

      function visionStory(sc) {
        const from = pct(sc.startRisk);
        const to = pct(sc.endRisk);
        if (sc.id === "continue") {
          return "You keep lifting the same way. The patient slips, your back rounds, and the weight moves out to arm's length - one slip from a fall. Risk goes up, " + from + " to " + to + ". Done every day, this is how a nurse's back gets hurt.";
        }
        if (sc.id === "assist") {
          return "You bring the patient to the edge of the seat, count to three, and let them stand on their own legs while you just guide. Both backs stay straight. Risk drops, " + from + " to " + to + ". The patient does the standing - you make it safe.";
        }
        return "The patient looks unsteady, so you stop and sit them back down, steady them, and check before trying again. No strain, no fall. Risk drops the most, " + from + " to " + to + " - the safest choice.";
      }

      // A short "what this future is" for the ball explanation step.
      function visionExplain(sc) {
        const delta = "Risk goes " + pct(sc.startRisk) + " to " + pct(sc.endRisk) + ".";
        if (sc.id === "continue") return "Keep lifting the same way. The patient slips and your back strains more. " + delta + " Tap Play to watch it.";
        if (sc.id === "assist") return "Bring the patient to the edge of the seat, count to three, and let them stand on their own legs while you guide. " + delta + " Tap Play to watch it.";
        return "Sit the unsteady patient back down and check before trying again - the safest choice. " + delta + " Tap Play to watch it.";
      }

      // The magic-ball vision is a LIST first: three short options are shown up
      // front, each can be previewed (ball explanation -> motion) in any order,
      // and only once all three motions have been previewed does choosing
      // unlock. Stages: "menu" | "orb" (ball + explanation for v.preview) |
      // "vr" (that future's motion). v.seen[] tracks which were previewed.
      function setStage(stage, preview) {
        const v = state.vision;
        v.stage = stage;
        if (typeof preview === "number") v.preview = preview;
        if (v.timer) { clearTimeout(v.timer); v.timer = null; }
        state.oracle.tick = 0;
        state.choiceListen = false;
        const scenarios = state.oracle.scenarios;
        // Choosing unlocks as soon as ANY future has been previewed - you can
        // watch just one and pick, or preview more first; you don't have to
        // watch all three.
        const anySeen = v.seen.some(Boolean);
        const isMenu = stage === "menu";
        const isOrb = stage === "orb";
        const isVr = stage === "vr";
        if (isVr) v.seen[v.preview] = true; // previewing the motion marks it seen
        orbHero.style.display = isOrb ? "" : "none";
        vrWrap.style.display = isVr ? "" : "none";
        visionChoices.style.display = isMenu ? "grid" : "none";
        visionProgress.style.display = isMenu ? "" : "none";
        sayHint.style.display = (isMenu && anySeen) ? "" : "none";
        visionRisk.style.display = isMenu ? "" : "none";
        visionNext.style.display = isMenu ? "none" : "";
        visionSkip.style.display = isMenu ? "none" : "";

        if (isMenu) {
          const f = features(state.frames[state.oracle.baseIndex]);
          visionRisk.textContent = "Current risk " + pct(f.risk) + " - " + riskLevel(f.risk).label;
          visionRisk.style.background = riskLevel(f.risk).color;
          scenarios.forEach((sc, i) => {
            document.getElementById("choiceName" + i).textContent = sc.name;
            const badge = document.getElementById("choiceRisk" + i);
            badge.textContent = "risk " + pct(sc.startRisk) + " -> " + pct(sc.endRisk);
            badge.style.background = riskLevel(sc.endRisk).color;
            const seenBadge = document.getElementById("choiceSeen" + i);
            seenBadge.textContent = v.seen[i] ? "watched" : "not watched yet";
            choiceCards[i].classList.toggle("seen-done", v.seen[i]);
            chooseButtons[i].disabled = !anySeen;
          });
          const nSeen = v.seen.filter(Boolean).length;
          visionProgress.textContent = anySeen
            ? "You can choose now" + (nSeen < 3 ? " - or watch the others first" : "") + " (" + nSeen + " / 3 watched)."
            : "Watch any option to unlock your choice.";
          visionTitle.textContent = anySeen ? "Pick the safest option" : "Three ways forward - watch, then pick";
          if (anySeen && !v.choosePrompted) {
            v.choosePrompted = true;
            const prompt = "You can choose now, or watch the others first. Say one, two, or three, or press Choose on a card.";
            typewriter(visionText, prompt);
            const spoken = speak(prompt, () => startChoiceListening());
            if (!spoken) startChoiceListening();
          } else if (!v.introSpoken) {
            v.introSpoken = true;
            // Grounded spoken briefing names all three futures and offers the
            // choice; MIRAI always speaks it (even with MoshiRAG active). The
            // ON-SCREEN text stays a short line - the cards already list the
            // three options, so the full wording only needs to be heard.
            const enumerate = scenarios
              .map((sc, i) => (i + 1) + ", " + scenarioIntent(sc) + ". Risk goes " + pct(sc.startRisk) + " to " + pct(sc.endRisk) + ".")
              .join(" ");
            const brief = v.introText + "Here are three ways forward. " + enumerate
              + " Watch any of them, then tell me which you choose - one, two, or three.";
            typewriter(visionText, "Watch each option, then choose the safest - press Choose, or say 1, 2, or 3.");
            speak(brief);
          } else {
            typewriter(visionText, anySeen
              ? "Press Choose on a card, watch another, or say one, two, or three."
              : "Tap Watch on a card to see that option.");
            if (anySeen) startChoiceListening();
          }
          drawVision();
          return;
        }

        const sc = scenarios[v.preview];
        if (isOrb) {
          visionTitle.textContent = "Option " + (v.preview + 1) + ": " + sc.name;
          visionNext.textContent = "Play";
          visionSkip.textContent = "Back";
          const text = visionExplain(sc);
          typewriter(visionText, text);
          speak(text);
        } else { // vr
          visionTitle.textContent = "Option " + (v.preview + 1) + ": " + sc.name;
          vrChip.textContent = "Option " + (v.preview + 1) + " of 3 - " + sc.name;
          visionNext.textContent = "Back to options";
          visionSkip.style.display = "none";
          const text = visionStory(sc);
          typewriter(visionText, text);
          // When the narration ends, return to the list (now marked seen).
          const back = () => { if (v.active && v.stage === "vr") setStage("menu"); };
          const spoken = speak(text, () => { v.timer = setTimeout(back, 900); });
          if (!spoken) v.timer = setTimeout(back, Math.max(6500, text.length * 42));
        }
        drawVision();
      }

      // Voice choice: after the AI asks, the mic listens for "one/two/three"
      // (or scenario keywords); buttons always work as a fallback.
      function startChoiceListening() {
        if (!SR || !state.vision.active || state.vision.stage !== "menu" || !state.vision.seen.some(Boolean)) return;
        state.choiceListen = true;
        startRecognition();
      }

      function handleChoiceSpeech(transcript) {
        const t = " " + transcript.toLowerCase() + " ";
        let pick = -1;
        if (/third|three|pause|reassess|stop|wait|sit back|3/.test(t)) pick = 2;
        else if (/second|two|assist|ready|help|stand|push|2/.test(t)) pick = 1;
        else if (/first|one|continue|keep|1/.test(t)) pick = 0;
        if (pick >= 0) {
          chooseFuture(pick);
          return;
        }
        speak("I did not catch that. Say one, two, or three - or press Choose on a card.");
      }

      // The chosen future plays in the preview panel while the AI narrates the
      // cause-and-effect, then the video resumes on its own so the next risky
      // moment can summon the ball again.
      function chooseFuture(i) {
        const sc = state.oracle.scenarios && state.oracle.scenarios[i];
        if (!sc) return;
        closeVision();
        state.oracle.selected = sc;
        if (!sc.frames3d) sc.frames3d = build3dFuture(sc, state.oracle.baseIndex);
        state.oracle.tick = 0;
        backLiveBtn.style.display = "";
        drawReplay();
        updateMoshiRagContext(); // ground MoshiRAG's context in the chosen future
        pushMoshiContext("choice");
        const text = scenarioNarration(sc);
        typewriter(duplexCaption, text);
        const resume = () => {
          if (state.oracle.selected !== sc) return;
          state.oracle.selected = null;
          backLiveBtn.style.display = "none";
          if (video.src) video.play().catch(() => { void 0; });
          else { state.playing = true; playBtn.textContent = "Pause"; }
          render();
          addAi("Back to the present. I keep watching - the ball will open again at the next warning sign.", true);
        };
        const spoken = speak(text, () => setTimeout(resume, 900));
        if (!spoken) setTimeout(resume, 6500);
      }

      function startVision(introText) {
        const scenarios = buildScenarios(state.index);
        if (!scenarios.length) {
          addAi("The magic ball has nothing to show yet - load a video or a sample first.");
          return;
        }
        pauseAll();
        state.oracle.scenarios = scenarios;
        state.oracle.baseIndex = state.index;
        state.oracle.selected = null;
        state.oracle.tick = 0;
        backLiveBtn.style.display = "none";
        state.vision.baseBBox = scenarioBBox([state.frames[state.index]]);
        state.vision.seen = [false, false, false];
        state.vision.preview = 0;
        state.vision.introSpoken = false;
        state.vision.choosePrompted = false;
        // Just the warning here; setStage("menu") builds the spoken briefing
        // that names the three futures and offers the choice.
        state.vision.introText = introText ? introText + " " : "";
        state.vision.active = true;
        vision.style.display = "";
        setStage("menu");
        updateMoshiRagContext(); // surface the three projected futures for grounding
        pushMoshiContext("risk"); // tell the server about the high-risk moment
      }

      function closeVision() {
        const v = state.vision;
        v.active = false;
        v.timer && clearTimeout(v.timer);
        v.timer = null;
        stopTypewriter(visionText);
        vision.style.display = "none";
        vision.classList.remove("speaking");
        state.choiceListen = false;
        if (!state.listenMode) stopRecognition();
        if (synth) synth.cancel();
        state.speaking = false;
        syncDuplex();
      }

      function scenarioNarration(sc) {
        const from = pct(sc.startRisk);
        const to = pct(sc.endRisk);
        if (sc.id === "continue") {
          return "You kept lifting the same way. The patient slips and your back strains more - risk goes up, " + from + " to " + to + ". Over many days this is how back injuries build.";
        }
        if (sc.id === "assist") {
          return "You got the patient ready and let them stand on their own legs while you guided. Risk drops, " + from + " to " + to + " - the lift goes through their legs, not your back.";
        }
        return "You stopped and sat the patient back down to check first. Risk drops the most, " + from + " to " + to + " - the safest choice. Sometimes the safest move is to not lift yet.";
      }

      // Hysteresis: after a warning, the ball re-arms only once the risk has
      // dropped back below 0.5 - so the same risky moment cannot re-trigger
      // right after resuming, but the NEXT risky moment always can.
      function maybeWarn(frame, f) {
        if (!f.valid) return;
        if (f.risk < 0.5) state.warnArmed = true;
        if (!state.warnArmed || f.risk <= 0.6) return;
        if (state.vision.active || state.oracle.selected) return;
        const now = Date.now();
        if (now - state.lastWarnAt < 5000) return;
        state.lastWarnAt = now;
        state.warnArmed = false;
        const sign = signsFor(frame, f)[0] || "overall movement risk is high";
        const warning = "Careful - the risk is high at " + pct(f.risk) + ": " + sign + ". Done over and over, this is how nurses hurt their backs and patients get hurt.";
        addAi("Careful - risky lift: " + sign + ".", true);
        startVision(warning);
      }

      function renderMetrics() {
        const frame = state.frames[state.index];
        if (!frame) return;
        const f = features(frame);
        const risk = riskLevel(f.risk);
        riskPill.textContent = "Risk: " + risk.label + " " + Math.round(f.risk * 100);
        riskPill.style.background = risk.color;
        phaseLabel.textContent = "Phase: " + (frame.phase || "-") + " | Patient: " + (frame.patientFeedback || "unknown");
        const lifting = frame.phase === "sit-to-stand" || frame.phase === "lifting";
        const leadLabel = frame.nurse2 ? " (" + (f.lead === "nurse2" ? "nurse 2" : "nurse 1") + ")" : "";
        const rows = [
          ["Nurse trunk" + leadLabel, Math.round(f.trunkFlexion) + " deg", f.trunkFlexion / 80, f.trunkFlexion > 45],
          ["Nurse knee bend" + leadLabel, f.kneeBend === null ? "n/a" : Math.round(f.kneeBend) + " deg", (f.kneeBend || 0) / 80, lifting && f.kneeBend !== null && f.kneeBend < 25],
          ["Patient distance", Math.round(f.supportDistance) + "% trunk", f.supportDistance / 220, frame.phase !== "preparation" && f.supportDistance > 140],
          ["Patient tilt", Math.round(f.patientTilt) + " deg", f.patientTilt / 70, f.patientTilt > 25],
          ["Twist (proxy)", Math.round(f.twist) + " deg", f.twist / 80, f.twist > 45],
          ["Overall risk", Math.round(f.risk * 100), f.risk, f.risk > 0.60]
        ];
        let html = rows.map(([label, value, raw, bad]) =>
          '<div class="metric"><label>' + label + '</label><b>' + value + '</b><div class="bar"><i style="width:' + Math.round(clamp(raw, 0, 1) * 100) + '%;background:' + (bad ? '#ff5d73' : '#4d8dff') + '"></i></div></div>'
        ).join("");
        if (state.whatIf) {
          const summary = whatIfSummary(frame);
          const before = Math.round(summary.before.risk * 100);
          const after = Math.round(summary.after.risk * 100);
          html += '<div class="metric" style="grid-column: 1 / -1"><label>Safer pose: straighter back, bent knees, patient closer</label><b>risk ' + before + ' (' + riskLevel(summary.before.risk).label + ') -> ' + after + ' (' + riskLevel(summary.after.risk).label + ')</b><div class="bar"><i style="width:' + after + '%;background:#2dd4a7"></i></div></div>';
        }
        metrics.innerHTML = html;
        maybeWarn(frame, f);
      }

      function renderTimeline() {
        const n = state.frames.length;
        if (!n) { timeline.innerHTML = ""; return; }
        const ticks = Math.min(n, 80);
        timeline.style.gridTemplateColumns = "repeat(" + ticks + ", 1fr)";
        const cells = [];
        for (let k = 0; k < ticks; k += 1) {
          const i0 = Math.floor(k * n / ticks);
          const i1 = Math.max(Math.floor((k + 1) * n / ticks), i0 + 1);
          let worst = i0;
          let worstRisk = -1;
          for (let i = i0; i < i1; i += 1) {
            const r = features(state.frames[i]).risk;
            if (r > worstRisk) { worstRisk = r; worst = i; }
          }
          const level = riskLevel(worstRisk);
          const active = state.index >= i0 && state.index < i1;
          cells.push('<button class="tick ' + (active ? 'active' : '') + '" data-i="' + worst + '" style="background:' + level.color + '" title="' + (state.frames[i0].phase || '-') + ': ' + Math.round(worstRisk * 100) + '"></button>');
        }
        timeline.innerHTML = cells.join("");
      }

      function render() {
        if (!state.frames.length) return;
        state.index = clamp(state.index, 0, state.frames.length - 1);
        drawOverlay();
        drawReplay();
        renderMetrics();
        renderTimeline();
        updateMoshiRagContext();
      }

      // Empty the stage: no frames, no skeleton, panels back to their idle
      // state. Used while waiting for real keypoints of an uploaded video,
      // so a synthetic or stale skeleton is never drawn over the wrong video.
      function clearFrames() {
        state.frames = [];
        state.index = 0;
        state.lastWarnAt = 0;
        state.warnArmed = true;
        closeVision();
        state.oracle.scenarios = null;
        state.oracle.selected = null;
        backLiveBtn.style.display = "none";
        metrics.innerHTML = "";
        timeline.innerHTML = "";
        riskPill.textContent = "Risk: -";
        riskPill.style.background = "";
        phaseLabel.textContent = "Phase: - | Patient: -";
        drawOverlay();
        drawReplay();
      }

      function adoptFrames(frames, meta) {
        state.frames = frames;
        state.index = 0;
        state.lastWarnAt = 0;
        state.warnArmed = true;
        closeVision();
        state.oracle.scenarios = null;
        state.oracle.selected = null;
        backLiveBtn.style.display = "none";
        if (meta && meta.width && meta.height) state.aspect = meta.width / meta.height;
        else if (video.videoWidth && video.videoHeight) state.aspect = video.videoWidth / video.videoHeight;
        ensureTimes(state.frames, (meta && meta.duration) || video.duration || 0);
        calibrateTwist(state.frames);
        detectPhases(state.frames);
        render();
      }

      // isCurrent (optional) is re-checked after each await: if another video
      // was loaded while this JSON was in flight, the result is dropped so a
      // late response can never attach keypoints to the wrong video.
      async function loadKeypointJson(url, isCurrent) {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return false;
        const data = await response.json();
        if (isCurrent && !isCurrent()) return false;
        if (!Array.isArray(data.frames) || data.frames.length === 0) return false;
        state.source = "json";
        adoptFrames(data.frames, data);
        const hasNurse = data.frames.some((f) => f.nurse);
        const twoNurses = data.frames.some((f) => f.nurse2);
        const hasPatient = data.frames.some((f) => f.patient);
        let coverage = twoNurses ? ", two nurses + patient tracked" : (hasNurse && hasPatient ? ", nurse + patient tracked" : "");
        let caveat = "";
        if (!hasNurse) caveat = " Warning: no nurse could be tracked in this footage, so posture risk cannot be scored - the standing caregiver may be too small in frame, occluded, or out of view.";
        else if (!hasPatient) caveat = " Warning: no seated patient could be tracked in this footage, so support-distance and patient-tilt cannot be scored.";
        addAi("Extracted keypoints loaded from " + url + " (" + data.frames.length + " frames" + coverage + "). The demo timeline follows the frame timestamps, and transfer phases are detected from the patient's hip motion." + caveat);
        return true;
      }

      function advice(question) {
        const frame = state.frames[state.index];
        if (!frame) return "No frames loaded yet.";
        const f = features(frame);
        const risk = riskLevel(f.risk);
        const signs = signsFor(frame, f);
        const signText = signs.length ? signs.join("; ") : "movement signs are within the safer range";
        const lower = question.toLowerCase();
        if (lower.includes("moshirag") || lower.includes("moshi rag") || lower.includes("moshi")) {
          if (!state.moshirag.configured) {
            return "MoshiRAG is not configured in this app yet. Start the dev server with MOSHIRAG_URL set to your RunPod Gradio URL, then press 'Use MoshiRAG voice' in this panel.";
          }
          if (state.moshirag.active) {
            return "MoshiRAG live voice is running in the panel below - talk to it directly; my own voice is muted so we do not overlap. Press 'Back to built-in voice' to switch off, or 'Copy context' to ground it in the current risk numbers.";
          }
          const health = state.moshirag.healthy ? "The health check is passing." : "The URL is configured, but the latest health check did not pass - the server may be asleep.";
          return "MoshiRAG is configured at " + displayMoshiRagUrl() + ". " + health + " Press 'Use MoshiRAG voice' to run the live full-duplex model right in this panel; MIRAI keeps the skeleton risk and future previews, and I can copy the live context for you to ground the conversation.";
        }
        if (lower.includes("future") || lower.includes("magic") || lower.includes("scenario") || lower.includes("three")) {
          startVision();
          return "";
        }
        if (lower.includes("patient") && !lower.includes("distance")) {
          return "Ask the patient a simple readiness question: 'Do you feel dizzy, pain, or unstable before we stand?' The patient should provide comfort feedback, while the nurse remains the main user of the future predictor.";
        }
        if (lower.includes("what if") || lower.includes("what-if") || lower.includes("knee")) {
          state.whatIf = true;
          whatIfBtn.textContent = "Show safer pose: on";
          render();
          const summary = whatIfSummary(frame);
          const b = summary.before;
          const a = summary.after;
          return "What-if forecast, recomputed from the skeleton and drawn as the green ghost: with an upright trunk, deeper knee bend, and the patient held closer, risk goes from " + Math.round(b.risk * 100) + " (" + riskLevel(b.risk).label + ") to " + Math.round(a.risk * 100) + " (" + riskLevel(a.risk).label + "). Trunk flexion " + Math.round(b.trunkFlexion) + " deg -> " + Math.round(a.trunkFlexion) + " deg; patient distance " + Math.round(b.supportDistance) + "% -> " + Math.round(a.supportDistance) + "% of trunk length.";
        }
        if (lower.includes("change") || lower.includes("action") || lower.includes("do now")) {
          return "Recommended nurse action for the " + (frame.phase || "current") + " phase: pause briefly, bring the patient closer, bend the knees, avoid twisting during pivot, and ask for assistance if the patient reports instability. Current signs: " + signText + ". Ask me for the three futures if you want to see where each choice leads.";
        }
        const prognosis = f.risk > 0.6
          ? " Long-term: transfers done this way load the lumbar spine every shift - that is how chronic back injury builds for the nurse, and the patient risks bruising or a fall."
          : (f.risk > 0.4
            ? " Long-term: this pattern is borderline - repeated daily, it slowly accumulates load on the nurse's lower back."
            : " Long-term: kept like this, the movement pattern is sustainable for the nurse and comfortable for the patient.");
        return "Assessment for the nurse: phase is " + (frame.phase || "unknown") + ", risk is " + risk.label.toLowerCase() + " at " + Math.round(f.risk * 100) + ". Signs: " + signText + "." + prognosis + " Say 'show me the three futures' to look ahead.";
      }

      function ask(text) {
        if (!text.trim()) return;
        addUser(text);
        const reply = advice(text);
        if (reply) addAi(reply);
      }

      function loadFrames(risky) {
        state.source = risky ? "synthetic-risky" : "synthetic-safe";
        const frames = generateFrames(risky);
        if (video.src && video.duration) retimeFrames(frames, video.duration);
        adoptFrames(frames, null);
        addAi(risky
          ? "Rehearsal data loaded (risky transfer pattern)."
          : "Synthetic stand-in loaded. You can also load the anonymized keypoint demo or analyze your own local video.", true);
      }

      // ---- Video sources. Each load bumps videoSession; async keypoint
      // loads and extraction polls carry their session and stop applying
      // results the moment another video takes over.
      const uploadBtn = document.getElementById("uploadBtn");
      const videoFileInput = document.getElementById("videoFile");
      const extractStatus = document.getElementById("extractStatus");
      let videoSession = 0;
      let localVideoUrl = null;

      function setExtractStatus(text) {
        extractStatus.style.display = text ? "" : "none";
        extractStatus.textContent = text || "";
      }

      function newVideoSession() {
        videoSession += 1;
        setExtractStatus("");
        if (localVideoUrl) {
          URL.revokeObjectURL(localVideoUrl);
          localVideoUrl = null;
        }
        return videoSession;
      }

      document.getElementById("attachedBtn").addEventListener("click", () => {
        const session = newVideoSession();
        video.removeAttribute("src");
        video.load();
        emptyVideo.style.display = "";
        addAi("Loading anonymized transfer keypoints. The source footage is intentionally not included in the public project.");
        loadKeypointJson("/assets/sample-keypoints.json", () => session === videoSession).then((loaded) => {
          if (!loaded && session === videoSession) {
            state.source = "synthetic-safe";
            adoptFrames(generateFrames(false), null);
            addAi("No keypoint JSON was found; showing the synthetic skeleton instead.");
          }
        });
      });

      uploadBtn.addEventListener("click", () => videoFileInput.click());
      videoFileInput.addEventListener("change", () => {
        const file = videoFileInput.files && videoFileInput.files[0];
        videoFileInput.value = "";
        if (!file) return;
        const session = newVideoSession();
        localVideoUrl = URL.createObjectURL(file);
        video.src = localVideoUrl;
        video.muted = true;
        emptyVideo.style.display = "none";
        state.source = "upload";
        clearFrames();
        addAi('"' + file.name + '" is ready to play. I am sending it to the local RTMPose service now - the skeleton overlay and risk scores will appear once the real keypoints are extracted.');
        extractKeypointsFor(file, session);
      });

      async function extractKeypointsFor(file, session) {
        setExtractStatus("Uploading the video for keypoint extraction...");
        let job = null;
        try {
          const response = await fetch("/api/extract", {
            method: "POST",
            headers: { "content-type": file.type || "video/mp4" },
            body: file,
          });
          job = await response.json();
          if (!response.ok) throw new Error(job.error || ("HTTP " + response.status));
        } catch (error) {
          if (session !== videoSession) return;
          setExtractStatus("");
          addAi("The keypoint extraction service is not reachable (" + (error && error.message ? error.message : "no response") + "). It only runs with the local dev server (npm run dev) and the .venv-pose Python environment - see README_pose.md. Showing the synthetic skeleton instead.");
          return;
        }
        if (session !== videoSession) return;
        pollExtraction(job.id, session);
      }

      async function pollExtraction(id, session) {
        for (;;) {
          if (session !== videoSession) return;
          let job = null;
          try {
            const response = await fetch("/api/extract/" + id, { cache: "no-store" });
            job = await response.json();
            if (!response.ok) throw new Error(job.error || ("HTTP " + response.status));
          } catch (error) {
            if (session !== videoSession) return;
            setExtractStatus("");
            addAi("Lost contact with the extraction service (" + (error && error.message ? error.message : "no response") + "). Keeping the synthetic skeleton.", true);
            return;
          }
          if (session !== videoSession) return;
          if (job.status === "done") {
            setExtractStatus("");
            const loaded = await loadKeypointJson(job.keypoints, () => session === videoSession);
            if (!loaded && session === videoSession) {
              addAi("Extraction finished but the keypoint JSON could not be loaded from " + job.keypoints + ". Keeping the synthetic skeleton.", true);
            }
            return;
          }
          if (job.status === "error") {
            setExtractStatus("");
            addAi("Keypoint extraction failed: " + (job.message || "unknown error") + " Keeping the synthetic skeleton; the dev-server terminal has the full log.", true);
            return;
          }
          const percent = job.progress == null ? null : Math.round(job.progress * 100);
          setExtractStatus(job.status === "queued"
            ? "Keypoint extraction queued behind another video..."
            : "Extracting real keypoints locally (RTMPose)..." + (percent == null ? "" : " " + percent + "%") + (job.message ? " - " + job.message : ""));
          await new Promise((resolveWait) => setTimeout(resolveWait, 2000));
        }
      }

      video.addEventListener("loadedmetadata", () => {
        if (state.source !== "json") {
          state.aspect = video.videoWidth / video.videoHeight;
          retimeFrames(state.frames, video.duration);
        }
        render();
      });
      video.addEventListener("play", () => { playBtn.textContent = "Pause"; });
      video.addEventListener("pause", () => { playBtn.textContent = "Play"; });

      playBtn.addEventListener("click", () => {
        if (video.src) {
          if (video.paused) video.play().catch(() => addAi("Browser blocked video autoplay. Click anywhere on the page once, then press Play again."));
          else video.pause();
          return;
        }
        if (!state.frames.length) {
          addAi('Nothing to play yet - load the anonymized demo, or choose "Load my video" to analyze your own footage locally.', true);
          return;
        }
        state.playing = !state.playing;
        playBtn.textContent = state.playing ? "Pause" : "Play";
      });

      whatIfBtn.addEventListener("click", () => {
        state.whatIf = !state.whatIf;
        whatIfBtn.textContent = "Show safer pose: " + (state.whatIf ? "on" : "off");
        render();
      });

      previewButtons.forEach((button) => {
        button.addEventListener("click", () => setStage("orb", Number(button.dataset.preview)));
      });
      chooseButtons.forEach((button) => {
        button.addEventListener("click", () => {
          if (button.disabled) return;
          chooseFuture(Number(button.dataset.choose));
        });
      });
      backLiveBtn.addEventListener("click", () => {
        state.oracle.selected = null;
        backLiveBtn.style.display = "none";
        drawReplay();
      });
      // Stage-dependent nav: in the ball, advance to the motion; in the motion,
      // go back to the list. "Close" always returns to the list.
      visionNext.addEventListener("click", () => {
        if (state.vision.timer) { clearTimeout(state.vision.timer); state.vision.timer = null; }
        if (state.vision.stage === "orb") setStage("vr");
        else setStage("menu");
      });
      visionSkip.addEventListener("click", () => {
        if (state.vision.timer) { clearTimeout(state.vision.timer); state.vision.timer = null; }
        setStage("menu");
      });
      visionClose.addEventListener("click", () => closeVision());

      micBtn.addEventListener("click", () => {
        if (!SR) {
          addAi("This browser has no speech recognition (try Chrome). Use the quick chips below the ball instead - the AI still answers aloud.");
          return;
        }
        if (state.speaking && synth) synth.cancel();
        state.listenMode = !state.listenMode;
        micBtn.textContent = state.listenMode ? "Listening... tap to stop" : "Speak";
        micBtn.classList.toggle("primary", state.listenMode);
        if (state.listenMode) startRecognition();
        else stopRecognition();
      });
      voiceBtn.addEventListener("click", () => {
        state.voiceOn = !state.voiceOn;
        voiceBtn.textContent = "AI voice: " + (state.voiceOn ? "on" : "off");
        if (!state.voiceOn && synth) synth.cancel();
      });
      moshiragUseBtn.addEventListener("click", () => activateMoshiRag());
      moshiragStopBtn.addEventListener("click", () => deactivateMoshiRag());
      moshiragCopyBtn.addEventListener("click", () => copyMoshiContext());
      moshiragTabBtn.addEventListener("click", () => openMoshiRagTab());

      // Magic-ball animation clock: animates the vision spheres and, when a
      // future is chosen, steps the big replay through that future's frames.
      setInterval(() => {
        if (!state.vision.active && !state.oracle.selected) return;
        state.oracle.tick += 1;
        if (state.vision.active) drawVision();
        else if (state.oracle.selected) drawReplay();
      }, 150);

      // Render clock for the 3D replay: orbits the view and keeps drag/auto-
      // rotation fluid at display rate, independent of the 150ms motion clock
      // and the video, so the scene never looks frozen while paused.
      let lastSpin = performance.now();
      function spinReplay(now) {
        const dt = Math.min((now - lastSpin) / 1000, 0.05);
        lastSpin = now;
        const sel = state.oracle.selected;
        const liveFrame = sel ? null : state.frames[state.index];
        const active = view3d.dragging || (sel && sel.frames3d) || (liveFrame && liveFrame.pose3d && view3d.auto);
        if (active) {
          if (view3d.auto && !view3d.dragging) view3d.yaw += dt * 0.3;
          drawReplay();
        }
        requestAnimationFrame(spinReplay);
      }
      requestAnimationFrame(spinReplay);

      document.querySelectorAll(".chip").forEach((button) => {
        button.addEventListener("click", () => ask(button.dataset.q));
      });

      timeline.addEventListener("click", (event) => {
        const tick = event.target.closest("[data-i]");
        if (!tick) return;
        state.index = Number(tick.dataset.i);
        const frame = state.frames[state.index];
        if (frame && video.src && video.duration) {
          video.currentTime = clamp(frame.time || 0, 0, Math.max(video.duration - 0.05, 0));
        }
        render();
      });

      window.addEventListener("resize", () => {
        render();
        if (state.vision.active) drawVision();
      });

      // Frames carry real timestamps, so playback sync is a nearest-time lookup on
      // every animation frame instead of a proportional index estimate.
      function syncToVideo() {
        if (video.src && video.duration && state.frames.length) {
          const idx = frameIndexAtTime(video.currentTime);
          if (idx !== state.index) {
            state.index = idx;
            render();
          }
        }
        requestAnimationFrame(syncToVideo);
      }
      requestAnimationFrame(syncToVideo);

      setInterval(() => {
        if (!state.playing || video.src || !state.frames.length) return;
        state.index = (state.index + 1) % state.frames.length;
        render();
      }, 160);

      // The stage starts empty on purpose: no synthetic skeleton is drawn
      // until the user loads a video (or a rehearsal shortcut loads one).
      addAi("Hi, I'm MIRAI. Load a video and press Play. When a lift gets risky, I'll pause the video and show you three ways forward - watch each one, then pick the safest. You can also tap Speak to ask me anything.", true);
      loadMoshiRagConfig();

      // Rehearsal shortcuts: #vision (or ?stage=vision) opens the magic-ball
      // list on the risky sample's worst moment; #orb / #preview jumps into the
      // first future's ball explanation / motion preview; #choose jumps to the
      // unlocked choice (all futures marked previewed).
      const rehearsal = window.location.hash.replace("#", "") ||
        new URLSearchParams(window.location.search).get("stage") || "";
      if (["vision", "orb", "preview", "choose"].indexOf(rehearsal) >= 0) {
        loadFrames(true);
        let worst = 0;
        let worstRisk = -1;
        state.frames.forEach((f, i) => {
          const r = features(f).risk;
          if (r > worstRisk) { worstRisk = r; worst = i; }
        });
        state.index = worst;
        render();
        startVision();
        if (rehearsal === "choose") { state.vision.seen = [true, true, true]; setStage("menu"); }
        else if (rehearsal === "orb") setStage("orb", 0);
        else if (rehearsal === "preview") setStage("vr", 1);
      }
    </script>
  </body>
</html>`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function moshiragConfig(env) {
  const raw = String((env && env.MOSHIRAG_URL) || "").trim();
  if (!raw) return { configured: false, url: "", chatUrl: "" };
  try {
    const base = new URL(raw);
    if (base.protocol !== "http:" && base.protocol !== "https:") throw new Error("MOSHIRAG_URL must start with http:// or https://");
    base.hash = "";
    const url = base.toString().replace(/\/$/, "");
    const chat = new URL("/api/chat", url);
    chat.protocol = base.protocol === "https:" ? "wss:" : "ws:";
    return { configured: true, url, chatUrl: chat.toString() };
  } catch (error) {
    return {
      configured: false,
      url: "",
      chatUrl: "",
      error: error && error.message ? error.message : "Invalid MOSHIRAG_URL",
    };
  }
}

async function moshiragHealth(env) {
  const cfg = moshiragConfig(env);
  if (!cfg.configured) return json({ ok: false, configured: false, error: cfg.error || "MOSHIRAG_URL is not set" }, 503);
  try {
    const healthUrl = new URL("/api/health", cfg.url);
    const response = await fetch(healthUrl, { cache: "no-store" });
    // Read the body once as text, then try to parse it as JSON - reading the
    // stream twice (json() then text()) throws "Body has already been read".
    const bodyText = await response.text();
    let upstream = bodyText;
    try { upstream = JSON.parse(bodyText); } catch { void 0; }
    return json({
      ok: response.ok,
      configured: true,
      url: cfg.url,
      chatUrl: cfg.chatUrl,
      upstreamStatus: response.status,
      upstream,
    }, response.ok ? 200 : 502);
  } catch (error) {
    return json({
      ok: false,
      configured: true,
      url: cfg.url,
      chatUrl: cfg.chatUrl,
      error: error && error.message ? error.message : "MoshiRAG health check failed",
    }, 502);
  }
}

// Forward the live risk context to the MoshiRAG server (server-to-server, so
// no browser CORS). The server must expose an endpoint that stores it and
// injects it into the LLM system prompt - see README_pose.md / README. Path is
// MOSHIRAG_CONTEXT_PATH (default /api/context). A 404 means the server has not
// added that endpoint yet; the browser treats that as "not grounded".
async function moshiragPushContext(env, request) {
  const cfg = moshiragConfig(env);
  if (!cfg.configured) return json({ ok: false, configured: false, error: "MOSHIRAG_URL is not set" }, 503);
  const path = String((env && env.MOSHIRAG_CONTEXT_PATH) || "/api/context");
  let body = "";
  try { body = await request.text(); } catch { body = ""; }
  try {
    const target = new URL(path, cfg.url);
    const response = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body || "{}",
    });
    const text = await response.text();
    let upstream = text;
    try { upstream = JSON.parse(text); } catch { void 0; }
    return json({ ok: response.ok, upstreamStatus: response.status, endpoint: target.toString(), upstream }, response.ok ? 200 : 200);
  } catch (error) {
    return json({ ok: false, error: error && error.message ? error.message : "context push failed" }, 200);
  }
}

export default {
  async fetch(request, env, ctx) {
    void ctx;
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, name: "patient-transfer-demo" });
    }

    if (url.pathname === "/api/moshirag/config") {
      return json(moshiragConfig(env));
    }

    if (url.pathname === "/api/moshirag/health") {
      return moshiragHealth(env);
    }

    if (url.pathname === "/api/moshirag/context" && request.method === "POST") {
      return moshiragPushContext(env, request);
    }

    if (url.pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }

    return new Response(page, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  },
};
