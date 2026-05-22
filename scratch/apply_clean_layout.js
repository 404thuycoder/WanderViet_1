const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'apps', 'user-web', 'planner.html');
let html = fs.readFileSync(filePath, 'utf-8');

// Chuẩn hóa tất cả dòng mới thành LF (\n) để xử lý thay thế chính xác 100%
html = html.replace(/\r\n/g, '\n');

// 1. Định nghĩa khối CSS Premium cực đẹp cho spot-review-tab (hỗ trợ Adaptive Theme, không làm cấn Light Theme)
const premiumCSS = `
    /* --- Premium Adaptive Spot Review Tab & Layout Overlay --- */
    #v2DestReviewPanel {
      width: 100% !important;
      max-width: 100% !important;
      margin-top: 2rem !important;
      box-sizing: border-box !important;
    }
    .v2-dest-grid {
      grid-template-columns: 1.15fr 0.85fr !important;
      gap: 1.5rem !important;
    }
    #reviewPanelSpots {
      max-height: 320px !important;
    }
    .spot-review-tab {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 100 !important;
      border-radius: 1.25rem !important;
      padding: 1.5rem !important;
      display: none !important; /* Ẩn mặc định để tránh chèn ép layout */
      flex-direction: column !important;
      gap: 1.2rem !important;
      overflow-y: auto !important;
      backdrop-filter: blur(20px) !important;
      
      /* Light theme (Default) */
      background: rgba(255, 255, 255, 0.98) !important;
      color: #0f172a !important;
      border: 1px solid #cbd5e1 !important;
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.1) !important;
    }
    .spot-review-tab.active {
      display: flex !important;
      animation: fadeInUpPremium 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }
    
    @keyframes fadeInUpPremium {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .spot-review-tab .spot-review-title {
      font-size: 1.25rem !important;
      font-weight: 800 !important;
      color: #0f172a !important;
      margin-bottom: 0.4rem !important;
    }
    .spot-review-tab .spot-review-close {
      background: #f1f5f9 !important;
      border: 1px solid #cbd5e1 !important;
      color: #334155 !important;
      padding: 0.5rem 1rem !important;
      border-radius: 0.75rem !important;
      cursor: pointer !important;
      font-size: 0.85rem !important;
      font-weight: 600 !important;
      transition: all 0.2s !important;
    }
    .spot-review-tab .spot-review-close:hover {
      background: #e2e8f0 !important;
      color: #0f172a !important;
      transform: translateY(-1px) !important;
    }
    .spot-review-tab .spot-review-pill {
      padding: 0.35rem 0.75rem !important;
      border-radius: 999px !important;
      font-size: 0.8rem !important;
      font-weight: 600 !important;
      background: #f1f5f9 !important;
      border: 1px solid #cbd5e1 !important;
      color: #1e293b !important;
    }
    .spot-review-tab .spot-review-rating {
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      color: #334155 !important;
      border-radius: 0.75rem !important;
      padding: 0.5rem 0.8rem !important;
      font-size: 0.88rem !important;
      min-width: 120px !important;
    }
    .spot-review-tab .spot-review-summary {
      color: #475569 !important;
      line-height: 1.7 !important;
      font-size: 0.92rem !important;
    }
    .spot-review-tab .spot-review-text {
      color: #475569 !important;
      font-size: 0.88rem !important;
      line-height: 1.55 !important;
    }
    .spot-review-tab .spot-review-avatar {
      width: 36px !important;
      height: 36px !important;
      border-radius: 50% !important;
      background: #eff6ff !important;
      color: #1e40af !important;
      font-weight: 700 !important;
      display: grid !important;
      place-items: center !important;
    }
    .spot-review-tab .spot-review-meta-header {
      color: #1e293b !important;
      font-weight: 700 !important;
    }
    .spot-review-tab .spot-review-review-stars {
      color: #f59e0b !important;
    }

    /* ── Dark Theme (Adaptive Spot Review Tab) ── */
    [data-theme="dark"] .spot-review-tab,
    html[data-theme="dark"] .spot-review-tab {
      background: rgba(15, 23, 42, 0.98) !important;
      color: #f8fafc !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.3) !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-title,
    html[data-theme="dark"] .spot-review-tab .spot-review-title {
      color: #fff !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-close,
    html[data-theme="dark"] .spot-review-tab .spot-review-close {
      background: rgba(255, 255, 255, 0.06) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-close:hover,
    html[data-theme="dark"] .spot-review-tab .spot-review-close:hover {
      background: rgba(255, 255, 255, 0.12) !important;
      color: #fff !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-pill,
    html[data-theme="dark"] .spot-review-tab .spot-review-pill {
      background: rgba(255, 255, 255, 0.04) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      color: #dbeafe !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-rating,
    html[data-theme="dark"] .spot-review-tab .spot-review-rating {
      background: rgba(255, 255, 255, 0.04) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      color: #f8fafc !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-summary,
    html[data-theme="dark"] .spot-review-tab .spot-review-summary {
      color: #cbd5e1 !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-text,
    html[data-theme="dark"] .spot-review-tab .spot-review-text {
      color: #94a3b8 !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-avatar,
    html[data-theme="dark"] .spot-review-tab .spot-review-avatar {
      background: rgba(96, 165, 250, 0.15) !important;
      color: #60a5fa !important;
    }
    [data-theme="dark"] .spot-review-tab .spot-review-meta-header,
    html[data-theme="dark"] .spot-review-tab .spot-review-meta-header {
      color: #fff !important;
    }
`;

// 2. Thay thế khối CSS của .spot-review-tab cũ (dòng 356) để tránh xung đột
const oldCSSStart = '    .spot-review-tab {\n      background: rgba(15, 23, 42, 0.96);\n      border: 1px solid rgba(144, 202, 249, 0.15);\n      border-radius: 1.25rem;\n      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);\n      padding: 1.2rem;\n      color: #f8fafc;\n      font-size: 0.98rem;\n    }';

if (html.includes(oldCSSStart)) {
  html = html.replace(oldCSSStart, '    /* spot-review-tab style moved to premium adaptive styles */');
  console.log('✅ Removed old spot-review-tab CSS styles to avoid conflicts');
}

// 3. Chèn khối CSS Premium mới vào cuối thẻ <style id="hotfix-cache-buster">
const styleEndTag = '  </style>\n</head>';
if (html.includes(styleEndTag)) {
  html = html.replace(styleEndTag, premiumCSS + '\n  </style>\n</head>');
  console.log('✅ Inserted Premium Adaptive CSS block!');
} else {
  console.log('❌ Could not find style end tag!');
}

// 4. Đảm bảo spotReviewTab cũ ở đầu trang bị loại bỏ và chèn đúng làm Premium Overlay bên trong v2DestReviewPanel
// Loại bỏ bất kỳ spotReviewTab nào nằm ở ngoài
html = html.replace(/<div id="spotReviewTab" class="spot-review-tab" style="display:none; margin-top:1rem;"><\/div>/g, '');
html = html.replace(/<div id="spotReviewTab" class="spot-review-tab" style="display:none;"><\/div>/g, '');

// Chèn spotReviewTab mới chuẩn xác vào cuối cột 2
const column2End = `                    <div id="reviewPanelSpots" style="flex:1; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:0.4rem; padding-right:2px; margin-top:0.25rem;">
                      <!-- Injected via JS -->
                    </div>
                  </div>`;

const column2EndNew = `                    <div id="reviewPanelSpots" style="flex:1; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:0.4rem; padding-right:2px; margin-top:0.25rem;">
                      <!-- Injected via JS -->
                    </div>
                  </div>
                  <!-- PREMIUM OVERLAY DETAIL PANEL -->
                  <div id="spotReviewTab" class="spot-review-tab" style="display:none;"></div>`;

if (html.includes(column2End)) {
  html = html.replace(column2End, column2EndNew);
  console.log('✅ Inserted spotReviewTab overlay container inside v2DestReviewPanel successfully!');
} else {
  console.log('❌ Could not find column 2 end to insert spotReviewTab!');
}

// Lưu lại file bằng UTF-8
fs.writeFileSync(filePath, html, 'utf-8');
console.log('\n🎉 Apply Clean Layout & Multi-Theme Support Completed Perfectly!');
