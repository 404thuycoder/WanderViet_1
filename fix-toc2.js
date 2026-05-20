const fs = require('fs');
let js = fs.readFileSync('apps/user-web/js/SharedUI.js', 'utf8');

const regex = /<div class="floating-toc-container" id="floating-toc">([\s\S]*?)<ul class="floating-toc-menu">/;
const match = js.match(regex);
if (match) {
  const replacement = `<style>
        .floating-toc-container.is-shrunk .toc-text-label { display: none !important; }
        .floating-toc-container.is-shrunk .floating-toc-btn { padding: 0 !important; width: 36px !important; border-radius: 50% !important; justify-content: center; }
        .floating-toc-container.is-shrunk .floating-toc-shrink-btn { transform: rotate(180deg); }
      </style>
      <div class="floating-toc-container" id="floating-toc" style="display:flex; align-items:center; gap:6px;">
             <button type="button" class="floating-toc-btn" onclick="this.parentElement.classList.toggle('is-open')" title="Mục lục Trang chủ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span class="toc-text-label">Danh mục</span>
             </button>
             <button type="button" class="floating-toc-shrink-btn" onclick="this.parentElement.classList.toggle('is-shrunk'); event.stopPropagation();" title="Thu nhỏ / Phóng to" style="background:var(--bg-elevated, #fff); border:1px solid var(--border, #e2e8f0); border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-muted, #64748b); box-shadow:0 2px 4px rgba(0,0,0,0.05); transition:transform 0.3s; font-size:16px; padding-bottom:2px; font-weight:bold;">
                &lsaquo;
             </button>
             <ul class="floating-toc-menu">
                <li style="display:flex; justify-content:space-between; align-items:center; padding: 4px 12px 8px; border-bottom:1px solid var(--border, #e2e8f0); margin-bottom:8px;">
                   <strong style="color:var(--text); font-size:0.9rem;">Mục lục</strong>
                   <button type="button" onclick="this.closest('.floating-toc-container').classList.remove('is-open')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.4rem; padding:0; line-height:1; display:flex; align-items:center; justify-content:center; height:24px; width:24px;">&times;</button>
                </li>`;
                
  js = js.replace(match[0], replacement);
  fs.writeFileSync('apps/user-web/js/SharedUI.js', js, 'utf8');
  console.log('Regex update successful!');
} else {
  console.log('Regex not found');
}
