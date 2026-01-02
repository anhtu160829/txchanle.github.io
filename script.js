/* ========= ENTROPY ========= */
function hexEntropy(hex) {
    const freq = {};
    for (let c of hex) freq[c] = (freq[c] || 0) + 1;
    let e = 0;
    for (let k in freq) {
        let p = freq[k] / hex.length;
        e -= p * Math.log2(p);
    }
    return e;
}

/* ========= DEEP SCORE ========= */
function deepScore(md5) {
    const ent = hexEntropy(md5);
    const freq = {};
    for (let c of md5) freq[c] = (freq[c] || 0) + 1;
    let rep = Object.values(freq).filter(v => v > 2).length;
    let sym = 0;
    for (let i = 0; i < 16; i++) if (md5[i] === md5[i+16]) sym++;
    let score = ent*10 + (50-ent*20) + (sym/16)*30 - (rep/Object.keys(freq).length)*15;
    return Math.max(0, Math.min(100, score));
}

/* ========= RNG ========= */
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/* ========= VỊ LÓT ========= */
function pickLot(md5, isLe) {
    const pool = isLe ? [1,3] : [0,2,4];
    let s = parseInt(md5.slice(8,16),16);
    let a = pool[Math.floor(seededRandom(s)*pool.length)];
    let b = pool[Math.floor(seededRandom(s+1)*pool.length)];
    if (a === b) b = pool[(pool.indexOf(a)+1)%pool.length];
    return [a,b].sort((x,y)=>x-y);
}

/* ========= LỜI KHUYÊN ========= */
function advice(conf) {
    if (conf > 75) return "🔥 Kèo mạnh – có thể theo";
    if (conf > 55) return "⚠️ Kèo trung bình – cân nhắc vốn";
    return "❄️ Kèo yếu – nên bỏ qua";
}

/* ========= MAIN ========= */
function analyze() {
    const md5 = document.getElementById("md5").value.trim().toLowerCase();
    const out = document.getElementById("result");

    if (!/^[0-9a-f]{32}$/.test(md5)) {
        out.innerHTML = "❌ MD5 không hợp lệ";
        return;
    }

    const entropy = hexEntropy(md5);
    const deep = deepScore(md5);
    const seed = parseInt(md5.slice(0,8),16);
    const total = 3 + seededRandom(seed)*15;
    const threshold = 10.5 + (entropy-4) + deep/100;
    const isLe = total >= threshold;

    const result = isLe ? "LẺ" : "CHẴN";
    const icon = isLe ? "🔥" : "❄️";
    const lot = pickLot(md5,isLe);
    const confidence = Math.min(95, Math.max(35, Math.round((entropy/4 + deep/100)*50)));

    out.innerHTML = `
        <h3>${icon} KẾT QUẢ</h3>
        <div class="highlight">${result}</div>
        <p><b>Vị lót:</b> ${lot[0]} - ${lot[1]}</p>
        <p>🎯 Tỉ lệ thắng: <b>${confidence}%</b></p>
        <p>💡 ${advice(confidence)}</p>
        <p class="small">Entropy: ${entropy.toFixed(3)} | Deep: ${deep.toFixed(1)}</p>
    `;

    saveHistory(md5, result, confidence);
    loadHistory();
}

/* ========= LỊCH SỬ ========= */
function saveHistory(md5, res, conf) {
    let h = JSON.parse(localStorage.getItem("md5_history") || "[]");
    if (h.length >= 20) h = [];
    h.unshift({ md5, res, conf });
    localStorage.setItem("md5_history", JSON.stringify(h));
}

function loadHistory() {
    let h = JSON.parse(localStorage.getItem("md5_history") || "[]");
    document.getElementById("historyList").innerHTML =
        h.map(i =>
            `<div class="history-item">
                ${i.md5.slice(0,8)}… → <b>${i.res}</b> (${i.conf}%)
            </div>`
        ).join("");
}

loadHistory();

/* ========= DÁN ========= */
async function pasteMD5() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById("md5").value = text.trim();
    } catch {
        alert("Không thể dán");
    }
}