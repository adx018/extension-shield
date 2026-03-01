// Splash cleanup
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const splash = document.getElementById("splash");
        if (splash) splash.remove();
        document.body.style.overflow = "";
    }, 2800);
});

const RISK_TABLE = {
    "<all_urls>":         { score: 30, level: "risky" },
    "webRequest":         { score: 40, level: "risky" },
    "webRequestBlocking": { score: 40, level: "risky" },
    "debugger":           { score: 50, level: "risky" },
    "cookies":            { score: 25, level: "warn"  },
    "scripting":          { score: 20, level: "warn"  },
    "history":            { score: 20, level: "warn"  },
    "tabs":               { score: 15, level: "warn"  },
};

let scanResults = [];
let currentFilter = "all"; // all | high | medium | low
document.getElementById("scanBtn").addEventListener("click", scanExtensions);
document.getElementById("exportBtn").addEventListener("click", exportPDF);
document.getElementById("totalCount").parentElement.addEventListener("click", () => {
    currentFilter = "all";
    applyFilter();
});

document.getElementById("highCount").parentElement.addEventListener("click", () => {
    currentFilter = "high";
    applyFilter();
});

document.getElementById("mediumCount").parentElement.addEventListener("click", () => {
    currentFilter = "medium";
    applyFilter();
});

document.getElementById("lowCount").parentElement.addEventListener("click", () => {
    currentFilter = "low";
    applyFilter();
});

function getRiskLevel(score) {
    if (score > 70) return "high";
    if (score > 30) return "medium";
    return "low";
}

function scanExtensions() {
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("results").innerHTML = "";
    document.getElementById("exportBtn").disabled = true;
    scanResults = [];

    chrome.management.getAll(function(extensions) {
        let total = 0, highCount = 0, mediumCount = 0, lowCount = 0;
        const resultsDiv = document.getElementById("results");
        const cards = [];

        extensions.forEach(ext => {
            if (ext.type !== "extension" || !ext.enabled) return;
            total++;
            const perms = ext.permissions || [];
            let score = 0;
            perms.forEach(p => { if (RISK_TABLE[p]) score += RISK_TABLE[p].score; });
            const risk = getRiskLevel(score);
            if (risk === "high") highCount++;
            else if (risk === "medium") mediumCount++;
            else lowCount++;
            scanResults.push({ name: ext.name, perms, score, risk });

            let permHTML = "";
            if (perms.length === 0) {
                permHTML = '<span class="no-perms">No special permissions</span>';
            } else {
                permHTML = '<div class="perm-grid">';
                perms.forEach(p => {
                    const info = RISK_TABLE[p];
                    const cls = info ? (info.level === "risky" ? "perm-tag risky" : "perm-tag warn") : "perm-tag";
                    permHTML += `<span class="${cls}">${p}</span>`;
                });
                permHTML += '</div>';
            }
            const barWidth = Math.min(score, 100);
            const riskLabel = risk === "high" ? "HIGH" : risk === "medium" ? "MEDIUM" : "LOW";
            const card = document.createElement("div");
            card.className = `extension-card card-${risk}`;
            card.style.animationDelay = `${cards.length * 60}ms`;
            card.dataset.extId = ext.id;
            card.innerHTML = `
                <div class="card-header">
                    <span class="ext-name" title="${ext.name}">${ext.name}</span>
                    <div class="card-actions">
                        <span class="risk-badge badge-${risk}">${riskLabel} - ${score}</span>
                        <button class="disable-btn" data-id="${ext.id}" data-enabled="true" title="Disable extension">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                            </svg>
                            Disable
                        </button>
                    </div>
                </div>
                <div class="perm-section">
                    <div class="perm-label">Permissions</div>
                    ${permHTML}
                </div>
                <div class="score-row">
                    <div class="score-bar">
                        <div class="score-fill fill-${risk}" style="width:0%" data-w="${barWidth}%"></div>
                    </div>
                    <span class="score-text">Score: ${score}/100</span>
                </div>
            `;
            resultsDiv.appendChild(card);
            cards.push(card);
        });

        requestAnimationFrame(() => {
            document.querySelectorAll(".score-fill").forEach(el => { el.style.width = el.dataset.w; });
        });
        animateNum("totalCount",  total);
        animateNum("highCount",   highCount);
        animateNum("mediumCount", mediumCount);
        animateNum("lowCount",    lowCount);
        document.getElementById("loading").classList.add("hidden");
        if (total > 0) document.getElementById("exportBtn").disabled = false;

        // Disable/Enable button handler (event delegation)
        resultsDiv.addEventListener("click", function(e) {
            const btn = e.target.closest(".disable-btn");
            if (!btn) return;
            const extId = btn.dataset.id;
            const isEnabled = btn.dataset.enabled === "true";
            const newState = !isEnabled;
            chrome.management.setEnabled(extId, newState, function() {
                btn.dataset.enabled = String(newState);
                if (newState) {
                    btn.innerHTML = `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                        Disable`;
                    btn.classList.remove("btn-enable");
                    // Find card and un-grey it
                    const card = btn.closest(".extension-card");
                    if (card) card.classList.remove("card-disabled");
                } else {
                    btn.innerHTML = `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Enable`;
                    btn.classList.add("btn-enable");
                    const card = btn.closest(".extension-card");
                    if (card) card.classList.add("card-disabled");
                }
            });
        }, { once: false });
    });
}

function animateNum(id, target) {
    const el = document.getElementById(id);
    const start = performance.now();
    (function tick(now) {
        const t = Math.min((now - start) / 500, 1);
        el.innerText = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
    })(start);
}

// ═══════════════════════════════════════════════
//  PDF EXPORT
// ═══════════════════════════════════════════════
function exportPDF() {
    if (scanResults.length === 0) return;

    const p = new MiniPDF();
    const W = 595, H = 842;
    const ML = 48, MR = 48;

    const total = scanResults.length;
    const highN = scanResults.filter(r => r.risk === "high").length;
    const medN  = scanResults.filter(r => r.risk === "medium").length;
    const lowN  = scanResults.filter(r => r.risk === "low").length;
    const now   = new Date();
    // ASCII-safe date — no special chars
    const dateStr = now.toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" });
    const timeStr = now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });

    const sorted = [...scanResults].sort((a, b) => b.score - a.score);

    // ── HEADER BAND
    p.filledRect(0, H - 110, W, H, 22, 30, 46);
    p.filledRect(0, H - 112, W, H - 110, 59, 130, 246);

    p.text("EXTENSION SECURITY REPORT", ML, H - 42, 18, true, 255, 255, 255);
    p.text("Browser Extension Risk Analysis  |  Ex-Shield v1.0", ML, H - 60, 9, false, 148, 163, 184);
    p.text(dateStr + "  " + timeStr, W - MR, H - 42, 9, false, 148, 163, 184, "right");
    p.text("Confidential", W - MR, H - 56, 8, false, 100, 116, 139, "right");

    // ── EXECUTIVE SUMMARY
    let y = H - 135;
    p.text("Executive Summary", ML, y, 13, true, 30, 41, 59);
    y -= 6;
    p.filledRect(ML, y, ML + 32, y + 2, 59, 130, 246);
    y -= 14;

    const s1 = "A total of " + total + " active browser extension" + (total !== 1 ? "s were" : " was") + " scanned. Of these,";
    const s2 = highN + " " + (highN === 1 ? "was" : "were") + " classified as HIGH risk, " + medN + " as MEDIUM risk, and " + lowN + " as LOW risk.";
    const s3 = highN > 0
        ? "Immediate review is recommended for all high-risk extensions identified in this report."
        : medN > 0
        ? "No critical threats detected. Review of medium-risk extensions is advisable."
        : "No significant threats detected. All extensions appear to be low risk.";

    p.text(s1, ML, y, 9, false, 51, 65, 85); y -= 13;
    p.text(s2, ML, y, 9, false, 51, 65, 85); y -= 13;
    p.text(s3, ML, y, 9, false, 51, 65, 85); y -= 20;

    // ── STAT BOXES
    const bW = (W - ML - MR - 12) / 4;
    const bH = 52;
    const stats = [
        { label: "Total Scanned", value: total, sub: "extensions", cr: 59,  cg: 130, cb: 246 },
        { label: "High Risk",     value: highN,  sub: "critical",  cr: 239, cg: 68,  cb: 68  },
        { label: "Medium Risk",   value: medN,   sub: "moderate",  cr: 245, cg: 158, cb: 11  },
        { label: "Low Risk",      value: lowN,   sub: "safe",      cr: 34,  cg: 197, cb: 94  },
    ];
    stats.forEach((s, i) => {
        const bx = ML + i * (bW + 4);
        const by = y - bH;
        p.filledRect(bx, by, bx + bW, by + bH, 241, 245, 249);
        p.filledRect(bx, by + bH - 3, bx + bW, by + bH, s.cr, s.cg, s.cb);
        p.text(String(s.value), bx + bW / 2, by + 28, 22, true, s.cr, s.cg, s.cb, "center");
        p.text(s.label.toUpperCase(), bx + bW / 2, by + 14, 6.5, true, 100, 116, 139, "center");
        p.text(s.sub, bx + bW / 2, by + 6, 7, false, 148, 163, 184, "center");
    });
    y -= bH + 24;

    p.filledRect(ML, y + 2, W - MR, y + 3, 226, 232, 240);
    y -= 16;

    // ── PIE CHART
    p.text("Risk Distribution", ML, y, 11, true, 30, 41, 59);
    y -= 6;
    p.filledRect(ML, y, ML + 28, y + 2, 59, 130, 246);
    y -= 10;

    const pieR  = 52;
    const pieCX = ML + pieR + 10;
    const pieCY = y - pieR - 8;

    if (total > 0) {
        const slices = [
            { n: highN, r: 239, g: 68,  b: 68,  label: "High Risk"   },
            { n: medN,  r: 245, g: 158, b: 11,  label: "Medium Risk" },
            { n: lowN,  r: 34,  g: 197, b: 94,  label: "Low Risk"    },
        ].filter(s => s.n > 0);

        let startAngle = -Math.PI / 2; // start at top
        slices.forEach(slice => {
            const sweep = (slice.n / total) * 2 * Math.PI;
            p.pieSlice(pieCX, pieCY, pieR, startAngle, startAngle + sweep, slice.r, slice.g, slice.b);
            startAngle += sweep;
        });

        // White centre circle for donut effect
        p.filledCircle(pieCX, pieCY, pieR * 0.48, 255, 255, 255);

        // Centre label
        p.text(String(total), pieCX, pieCY + 5, 14, true, 30, 41, 59, "center");
        p.text("total", pieCX, pieCY - 5, 7, false, 100, 116, 139, "center");

        // Legend — right of pie
        const legX = ML + pieR * 2 + 34;
        let legY = pieCY + pieR - 10;
        slices.forEach(slice => {
            const pct = Math.round((slice.n / total) * 100);
            p.filledRect(legX, legY - 7, legX + 10, legY + 3, slice.r, slice.g, slice.b);
            p.text(slice.label + " (" + slice.n + ")  " + pct + "%", legX + 14, legY, 9, false, 51, 65, 85);
            legY -= 20;
        });
    }

    y -= pieR * 2 + 24;

    p.filledRect(ML, y + 2, W - MR, y + 3, 226, 232, 240);
    y -= 16;

    // ── EXTENSION TABLE
    p.text("Extension Details", ML, y, 11, true, 30, 41, 59);
    y -= 6;
    p.filledRect(ML, y, ML + 28, y + 2, 59, 130, 246);
    y -= 16;

    // Fixed column positions
    const C_NAME  = ML;        // width ~200
    const C_RISK  = ML + 208;  // width ~55
    const C_SCORE = ML + 271;  // width ~60
    const C_PERMS = ML + 339;  // to W-MR ~168
    const ROW_H   = 22;        // fixed row height — no dynamic sizing

    // Table header
    p.filledRect(ML, y - ROW_H, W - MR, y, 30, 41, 59);
    p.text("EXTENSION NAME", C_NAME  + 6, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
    p.text("RISK",           C_RISK  + 4, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
    p.text("SCORE",          C_SCORE + 4, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
    p.text("PERMISSIONS",    C_PERMS + 4, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
    // Column dividers in header
    [C_RISK, C_SCORE, C_PERMS].forEach(cx => {
        p.filledRect(cx - 0.5, y - ROW_H, cx + 0.5, y, 59, 80, 110);
    });
    y -= ROW_H;

    sorted.forEach((ext, idx) => {
        if (y - ROW_H < 60) {
            drawPageFooter(p, W, ML, MR, p._pageNum);
            p.addPage();
            p._pageNum++;
            y = 842 - 48;
            // Repeat header
            p.filledRect(ML, y - ROW_H, W - MR, y, 30, 41, 59);
            p.text("EXTENSION NAME", C_NAME  + 6, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
            p.text("RISK",           C_RISK  + 4, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
            p.text("SCORE",          C_SCORE + 4, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
            p.text("PERMISSIONS",    C_PERMS + 4, y - ROW_H / 2 - 3, 7.5, true, 255, 255, 255);
            [C_RISK, C_SCORE, C_PERMS].forEach(cx => {
                p.filledRect(cx - 0.5, y - ROW_H, cx + 0.5, y, 59, 80, 110);
            });
            y -= ROW_H;
        }

        const rowBg = idx % 2 === 0 ? [255,255,255] : [248,250,252];
        p.filledRect(ML, y - ROW_H, W - MR, y, ...rowBg);

        const rc = ext.risk === "high" ? [239,68,68] : ext.risk === "medium" ? [245,158,11] : [34,197,94];

        // Left accent strip
        p.filledRect(ML, y - ROW_H, ML + 3, y, ...rc);

        // Column dividers
        [C_RISK, C_SCORE, C_PERMS].forEach(cx => {
            p.filledRect(cx - 0.5, y - ROW_H, cx + 0.5, y, 226, 232, 240);
        });

        // Text baseline = row bottom + 7
        const ty = y - ROW_H + 7;

        // Name (truncated to fit ~200px column)
        const maxChars = 30;
        const safeName = ext.name.length > maxChars ? ext.name.substring(0, maxChars) + "..." : ext.name;
        p.text(safeName, C_NAME + 6, ty, 8, false, 30, 41, 59);

        // Risk label — coloured, bold
        p.text(ext.risk.toUpperCase(), C_RISK + 4, ty, 7.5, true, ...rc);

        // Score — number + tiny bar underneath
        p.text(String(ext.score), C_SCORE + 4, ty, 8, true, 30, 41, 59);
        const barW2 = 44, barH2 = 3;
        const barX2 = C_SCORE + 4, barY2 = ty - 5;
        p.filledRect(barX2, barY2, barX2 + barW2, barY2 + barH2, 226, 232, 240);
        const fill2 = Math.min(ext.score, 100) / 100 * barW2;
        if (fill2 > 0) p.filledRect(barX2, barY2, barX2 + fill2, barY2 + barH2, ...rc);

        // Permissions — comma list, truncated to one line
        const riskyP = ext.perms.filter(pp => RISK_TABLE[pp]);
        const permStr = riskyP.length > 0 ? riskyP.join(", ") : "None";
        const maxPermChars = 28;
        const safePerms = permStr.length > maxPermChars ? permStr.substring(0, maxPermChars) + "..." : permStr;
        p.text(safePerms, C_PERMS + 4, ty, 7.5, false, 71, 85, 105);

        // Row bottom rule
        p.filledRect(ML, y - ROW_H, W - MR, y - ROW_H + 0.5, 226, 232, 240);

        y -= ROW_H;
    });

    // Table bottom border
    p.filledRect(ML, y, W - MR, y + 1.5, 30, 41, 59);
    y -= 20;

    // ── METHODOLOGY NOTE
    if (y < 100) {
        drawPageFooter(p, W, ML, MR, p._pageNum);
        p.addPage();
        p._pageNum++;
        y = 842 - 48;
    }
    p.filledRect(ML, y - 58, W - MR, y, 248, 250, 252);
    p.filledRect(ML, y - 58, ML + 3, y, 59, 130, 246);
    p.text("Scoring Methodology", ML + 10, y - 9,  9, true,  30,  41,  59);
    p.text("Risk scores are calculated by summing weights assigned to sensitive permissions:", ML + 10, y - 22, 8, false, 71, 85, 105);
    p.text("debugger (+50)  webRequest (+40)  webRequestBlocking (+40)  <all_urls> (+30)",    ML + 10, y - 33, 7.5, false, 100, 116, 139);
    p.text("cookies (+25)  scripting (+20)  history (+20)  tabs (+15)",                       ML + 10, y - 43, 7.5, false, 100, 116, 139);
    p.text("HIGH > 70  |  MEDIUM > 30  |  LOW <= 30",                                        ML + 10, y - 53, 7.5, true,  100, 116, 139);

    drawPageFooter(p, W, ML, MR, p._pageNum);

    const blob = p.toBlob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "ex-shield-report-" + Date.now() + ".pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function drawPageFooter(p, W, ML, MR, pageNum) {
    p.filledRect(0, 0, W, 36, 22, 30, 46);
    p.filledRect(0, 36, W, 37.5, 59, 130, 246);
    p.text("Ex-Shield  |  Extension Security Report  |  Confidential", ML, 22, 7.5, false, 148, 163, 184);
    p.text("Page " + pageNum, W - MR, 22, 7.5, false, 148, 163, 184, "right");
}

// ═══════════════════════════════════════════════
//  MiniPDF — raw PDF writer, no dependencies
// ═══════════════════════════════════════════════
class MiniPDF {
    constructor() {
        this._pages  = [[]];
        this._pageNum = 1;
    }
    get _cur() { return this._pages[this._pages.length - 1]; }
    addPage()  { this._pages.push([]); }

    filledRect(x1, y1, x2, y2, r, g, b) {
        const fr=(r/255).toFixed(3), fg=(g/255).toFixed(3), fb=(b/255).toFixed(3);
        this._cur.push(`${fr} ${fg} ${fb} rg ${x1.toFixed(1)} ${y1.toFixed(1)} ${(x2-x1).toFixed(1)} ${(y2-y1).toFixed(1)} re f`);
    }

    strokeRect(x1, y1, x2, y2, r, g, b) {
        const fr=(r/255).toFixed(3), fg=(g/255).toFixed(3), fb=(b/255).toFixed(3);
        this._cur.push(`${fr} ${fg} ${fb} RG 0.5 w ${x1.toFixed(1)} ${y1.toFixed(1)} ${(x2-x1).toFixed(1)} ${(y2-y1).toFixed(1)} re S`);
    }

    // Pie slice using Bezier curves (PDF doesn't have arc primitives)
    pieSlice(cx, cy, r, startA, endA, red, grn, blu) {
        const fr=(red/255).toFixed(3), fg=(grn/255).toFixed(3), fb=(blu/255).toFixed(3);
        // Break arc into segments of max 90 degrees for accuracy
        const maxSeg = Math.PI / 2;
        const segments = Math.ceil(Math.abs(endA - startA) / maxSeg);
        const step = (endA - startA) / segments;

        let ops = [`${fr} ${fg} ${fb} rg`];
        ops.push(`${cx.toFixed(2)} ${cy.toFixed(2)} m`); // move to centre

        for (let i = 0; i < segments; i++) {
            const a0 = startA + i * step;
            const a1 = a0 + step;
            // Convert arc segment to cubic bezier
            const alpha = Math.tan((a1 - a0) / 2);
            const k = (4 / 3) * alpha;
            const x0 = cx + r * Math.cos(a0);
            const y0 = cy + r * Math.sin(a0);
            const x3 = cx + r * Math.cos(a1);
            const y3 = cy + r * Math.sin(a1);
            const x1b = x0 - k * r * Math.sin(a0);
            const y1b = y0 + k * r * Math.cos(a0);
            const x2b = x3 + k * r * Math.sin(a1);
            const y2b = y3 - k * r * Math.cos(a1);
            if (i === 0) ops.push(`${x0.toFixed(2)} ${y0.toFixed(2)} l`);
            ops.push(`${x1b.toFixed(2)} ${y1b.toFixed(2)} ${x2b.toFixed(2)} ${y2b.toFixed(2)} ${x3.toFixed(2)} ${y3.toFixed(2)} c`);
        }
        ops.push("h f");
        this._cur.push(ops.join("\n"));
    }

    // Filled circle via 4 bezier arcs
    filledCircle(cx, cy, r, red, grn, blu) {
        this.pieSlice(cx, cy, r, 0, Math.PI * 2, red, grn, blu);
    }

    text(str, x, y, size, bold, r, g, b, align = "left") {
        const safe = String(str)
            .replace(/\\/g, "\\\\")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)")
            .replace(/[^\x20-\x7E]/g, "?");
        const font = bold ? "Helvetica-Bold" : "Helvetica";
        const fr=(r/255).toFixed(3), fg=(g/255).toFixed(3), fb=(b/255).toFixed(3);
        let tx = x;
        if (align === "center" || align === "right") {
            const approxW = size * 0.52 * safe.length;
            tx = align === "center" ? x - approxW / 2 : x - approxW;
        }
        this._cur.push(`BT /${font} ${size} Tf ${fr} ${fg} ${fb} rg ${tx.toFixed(2)} ${y.toFixed(2)} Td (${safe}) Tj ET`);
    }

    toBlob() {
        const enc = s => {
            const b = new Uint8Array(s.length);
            for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
            return b;
        };
        const parts = [];
        let offset = 0;
        const offsets = {};
        const push = s => { const b = enc(s); parts.push(b); offset += b.length; };
        const pushB = b => { parts.push(b); offset += b.length; };

        push("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

        offsets[1] = offset;
        push("1 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");
        offsets[2] = offset;
        push("2 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n");

        const contentNums = [];
        this._pages.forEach((ops, i) => {
            const n = 3 + i;
            contentNums.push(n);
            offsets[n] = offset;
            const stream = ops.join("\n") + "\n";
            const sb = enc(stream);
            push(`${n} 0 obj\n<< /Length ${sb.length} >>\nstream\n`);
            pushB(sb);
            push("\nendstream\nendobj\n");
        });

        const pageNums = [];
        const pagesDictNum = 3 + this._pages.length * 2;
        this._pages.forEach((_, i) => {
            const n = 3 + this._pages.length + i;
            pageNums.push(n);
            offsets[n] = offset;
            push(`${n} 0 obj\n<< /Type /Page /Parent ${pagesDictNum} 0 R /MediaBox [0 0 595 842] /Contents ${contentNums[i]} 0 R /Resources << /Font << /Helvetica 1 0 R /Helvetica-Bold 2 0 R >> >> >>\nendobj\n`);
        });

        offsets[pagesDictNum] = offset;
        push(`${pagesDictNum} 0 obj\n<< /Type /Pages /Kids [${pageNums.map(n => n + " 0 R").join(" ")}] /Count ${this._pages.length} >>\nendobj\n`);

        const catalogNum = pagesDictNum + 1;
        offsets[catalogNum] = offset;
        push(`${catalogNum} 0 obj\n<< /Type /Catalog /Pages ${pagesDictNum} 0 R >>\nendobj\n`);

        const xrefPos = offset;
        const totalObjs = catalogNum + 1;
        let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
        for (let i = 1; i < totalObjs; i++) {
            xref += String(offsets[i] || 0).padStart(10, "0") + " 00000 n \n";
        }
        push(xref);
        push(`trailer\n<< /Size ${totalObjs} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

        return new Blob(parts, { type: "application/pdf" });
    }
}
function applyFilter() {
    const cards = document.querySelectorAll(".extension-card");

    cards.forEach(card => {
        const riskClass = card.className.match(/card-(high|medium|low)/);
        if (!riskClass) return;

        const risk = riskClass[1];

        if (currentFilter === "all" || currentFilter === risk) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}