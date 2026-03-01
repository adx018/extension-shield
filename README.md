# 🛡️ Ex-Shield
### Chrome Extension Risk Detection System

Ex-Shield is a modern Chrome Extension Security Scanner built using Manifest V3.  
It scans installed browser extensions, analyzes their permissions, assigns a risk score, classifies them by severity, and generates a professional PDF security report — all locally within the browser.

---

## 🚀 Overview

Ex-Shield evaluates active browser extensions using the Chrome `management` API.  
Each extension is assigned a risk score based on sensitive permissions and classified into:

- 🔴 High Risk
- 🟠 Medium Risk
- 🟢 Low Risk

The system provides a clean dashboard with animated statistics and allows direct extension control.

---

## 🎯 Features

- 🔍 Scan all enabled extensions
- 📊 Real-time risk scoring (0–100)
- 🧮 Weighted permission-based evaluation
- 🎨 Futuristic dark UI dashboard
- 📄 Professional multi-page PDF security report
- 🔧 Enable / Disable extensions directly
- 📈 Risk filtering (All / High / Medium / Low)
- 📊 Risk distribution pie chart in PDF
- 🧩 No external libraries required

---

## 🧠 Risk Scoring Model

Sensitive permissions are assigned weighted values:

| Permission | Score |
|------------|--------|
| debugger | +50 |
| webRequest | +40 |
| webRequestBlocking | +40 |
| <all_urls> | +30 |
| cookies | +25 |
| scripting | +20 |
| history | +20 |
| tabs | +15 |

### Risk Levels

- **High Risk** → Score > 70  
- **Medium Risk** → Score > 30  
- **Low Risk** → Score ≤ 30  

---

## 🏗️ Project Structure

Ex-Shield/
│
├── manifest.json        (Extension configuration - Manifest V3)
├── background.js        (Service worker)
├── popup.html           (Main UI)
├── popup.js             (Risk logic + PDF engine)
├── styles.css           (Styling & animations)
└── icons/               (Extension icons)

---

## 📦 Installation Guide

1️⃣ Clone the Repository

git clone https://github.com/yourusername/Ex-Shield.git

2️⃣ Open Chrome Extensions Page

chrome://extensions/

3️⃣ Enable Developer Mode (top-right toggle)

4️⃣ Click "Load Unpacked"

Select the Ex-Shield project folder.

Done ✅

---

## 📄 PDF Report Includes

- Executive summary
- Total extension count
- High / Medium / Low breakdown
- Risk distribution pie chart
- Sorted extension table by risk score
- Scoring methodology
- Timestamp and confidential footer
- Multi-page formatting with pagination

The PDF engine is built from scratch using a custom MiniPDF writer — no external dependencies used.

---

## 🎨 UI Design

- Dark cybersecurity theme
- Animated splash screen
- Live dashboard indicators
- Neon accent highlights
- Smooth card transitions
- Risk-based color coding

Designed to resemble modern security monitoring systems.

---

## 🔐 Security & Privacy

- No external servers
- No cloud communication
- All processing runs locally
- No user tracking
- Only enabled extensions are scanned

---

## 🛠️ Technologies Used

- JavaScript (Vanilla ES6)
- Chrome Extension API (Manifest V3)
- HTML5
- CSS3
- Custom-built PDF generation engine
- SVG animations

---

## 🔮 Future Enhancements

- AI-based anomaly detection
- Malware signature comparison
- Real-time security alerts
- Risk trend tracking
- Cloud-based threat intelligence integration
- Extension trust scoring database

---

## 👨‍💻 Author

Adhvaith Sibu  
Computer Science Student  
Information Security & Systems Enthusiast  

---

## 📜 License

MIT License
