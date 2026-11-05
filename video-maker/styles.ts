export const CSS = `
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(900px 500px at 15% -10%,#15173f 0%,transparent 60%),#070812;color:#e8e9f3;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.vm{max-width:680px;margin:0 auto;padding:22px 16px 70px}
header{margin-bottom:18px}
.brand{color:#22d3ee;font-weight:800;letter-spacing:.02em;text-decoration:none;font-size:15px}
h1{font-size:28px;line-height:1.15;margin:10px 0 6px}
h2{font-size:15px;margin:0 0 12px;color:#c9cbe6;font-weight:700}
.sub{color:#9aa0b8;margin:0;line-height:1.5}
.card{background:#0e1020;border:1px solid #23264a;border-radius:16px;padding:16px;margin-bottom:12px}
.label{margin:14px 0 8px;font-size:13px;color:#9aa0b8;font-weight:600}
.field{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#9aa0b8;margin-top:10px}
input[type=text],input:not([type]){font:inherit;background:#070812;color:#e8e9f3;border:1px solid #343867;border-radius:10px;padding:11px;font-size:16px}
input[type=range]{width:100%;accent-color:#6366f1}
button{font:inherit;background:#171a38;color:#e8e9f3;border:1px solid #343867;border-radius:10px;padding:9px 13px;cursor:pointer}
button:disabled{opacity:.45;cursor:default}
.seg,.chips,.row{display:flex;gap:8px;flex-wrap:wrap}
.seg .on,.chips .on{background:#4f46e5;border-color:#6366f1}
.go{display:block;width:100%;text-align:center;text-decoration:none;color:#fff;background:linear-gradient(135deg,#22d3ee,#6366f1);border:0;border-radius:14px;padding:15px 16px;font-size:16px;font-weight:800;margin:14px 0}
.go:disabled{background:#1f2240;color:#8b90b0}
.drop{display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center;padding:36px 16px;border:2px dashed #343867;border-radius:14px;cursor:pointer;background:#0b0c1c}
.drop:hover{border-color:#6366f1}.drop span{color:#9aa0b8;font-size:14px}
.photo{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.pic{position:relative;width:150px;height:150px;border-radius:14px;overflow:hidden;background:#000}
.pic img{width:100%;height:100%;object-fit:cover;display:block}
.pic.scan img{filter:brightness(.8)}
.pic .line{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#22d3ee,transparent);box-shadow:0 0 18px #22d3ee;animation:sweep 1.6s ease-in-out infinite alternate}
@keyframes sweep{from{top:4%}to{top:94%}}
.msg{margin:0 0 6px;color:#c9cbe6;display:flex;gap:8px;align-items:center}
.note{font-size:12.5px;color:#8b90b0;margin:8px 0 0;line-height:1.45}
.ok{color:#34d399;margin:0 0 8px;font-weight:600}
.link{color:#8ab4ff;cursor:pointer;font-size:14px;text-decoration:underline}
.err{background:#2a1214;border:1px solid #6b2328;color:#ffb4b4;border-radius:12px;padding:12px;margin:0 0 12px}
.warn{background:#2a2412;border:1px solid #6b5a23;color:#ffe08a;border-radius:12px;padding:12px;margin:0 0 12px}
.tracks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.tracks li{display:flex;gap:8px;border:1px solid #2a2d4a;border-radius:12px;background:#0b0c1c;overflow:hidden}
.tracks li.on{border-color:#6366f1;background:#14163a}
.pick{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;background:transparent;border:0;cursor:pointer;padding:11px 12px;color:inherit}
.pick span{font-size:12.5px;color:#8b90b0;font-weight:400}
.play{width:46px;border:0;border-left:1px solid #2a2d4a;border-radius:0;background:transparent}
.adv{width:100%;display:flex;justify-content:space-between;background:transparent;border:0;padding:0;font-weight:700;color:#c9cbe6}
.advbody{margin-top:6px}
.check{display:flex;gap:10px;align-items:center;margin-top:16px;font-size:14px;color:#c9cbe6}
.progress{display:flex;flex-direction:column;gap:12px}
.big{height:12px;border-radius:99px;background:#1a1d3a;overflow:hidden}
.big i{display:block;height:100%;background:linear-gradient(90deg,#22d3ee,#818cf8);transition:width .4s}
.steps{list-style:none;margin:4px 0;padding:0;display:flex;flex-direction:column;gap:10px}
.steps li{display:flex;gap:12px;align-items:center;color:#6c7094}
.steps li.now{color:#fff;font-weight:700}.steps li.done{color:#34d399}
.dot{width:26px;height:26px;border-radius:50%;border:1px solid #343867;display:grid;place-items:center;font-size:13px}
.steps .now .dot{border-color:#22d3ee}.steps .done .dot{background:#12351f;border-color:#34d399}
.pct{margin-left:auto;font-variant-numeric:tabular-nums}
.time{margin:0;color:#8b90b0;font-size:13px}
.tip{margin:0;padding:12px;border-radius:12px;background:#11142d;color:#aeb3d6;font-size:13.5px;line-height:1.45;min-height:56px}
.spin{display:inline-block;width:14px;height:14px;border:2px solid #343867;border-top-color:#22d3ee;border-radius:50%;animation:rot .8s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
.result{display:flex;flex-direction:column;align-items:center;gap:6px}
.result video{width:min(100%,300px);border-radius:14px;background:#000}
.meta{color:#9aa0b8;font-size:13px;margin:6px 0}
.result .go{max-width:340px}
@media (prefers-reduced-motion:reduce){.pic .line,.spin{animation:none}}
`;
