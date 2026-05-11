const fs = require('fs');
const path = 'd:/D_n_mới/WanderViet_1/apps/user-web/SharedUI.js';
let content = fs.readFileSync(path, 'utf8');

// Add language mismatch detection and error notification after AI reply
const oldReplyBlock = `        if (resData && resData.success) {
            const aiReply = resData.answer || resData.reply;
            appendMsg(aiReply, 'bot');`;

const newReplyBlock = `        if (resData && resData.success) {
            const aiReply = resData.answer || resData.reply;
            appendMsg(aiReply, 'bot');

            // --- LANGUAGE MISMATCH DETECTION ---
            // Check if AI responded in the correct language when a non-auto language is selected
            const _selectedLang = localStorage.getItem('wander_chat_lang') || 'auto';
            if (_selectedLang !== 'auto' && aiReply) {
              const _hasVietChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(aiReply);
              const _hasKorean = /[\uAC00-\uD7AF]/.test(aiReply);
              const _hasJapanese = /[\u3040-\u30FF]/.test(aiReply);
              const _hasChinese = /[\u4E00-\u9FFF]/.test(aiReply);
              
              let _isWrongLang = false;
              if (_selectedLang === 'en' && _hasVietChars) _isWrongLang = true;
              if (_selectedLang === 'vi' && !_hasVietChars && aiReply.length > 20) _isWrongLang = false; // vi can have ASCII
              if (_selectedLang === 'kr' && !_hasKorean && aiReply.length > 10) _isWrongLang = true;
              if (_selectedLang === 'jp' && !_hasJapanese && aiReply.length > 10) _isWrongLang = true;
              if (_selectedLang === 'zh' && !_hasChinese && aiReply.length > 10) _isWrongLang = true;
              if (_selectedLang === 'fr' && _hasVietChars) _isWrongLang = true;
              
              if (_isWrongLang) {
                const langNames = { en: 'English', kr: '한국어', jp: '日本語', fr: 'Français', zh: '中文' };
                const errorMsg = \`⚠️ AI đã trả lời sai ngôn ngữ! Bạn đang chọn \${langNames[_selectedLang] || _selectedLang.toUpperCase()} nhưng AI trả lời tiếng Việt. Đang thử lại...\`;
                const errBubble = document.createElement('div');
                errBubble.className = 'chat-bubble chat-bubble--bot';
                errBubble.style.cssText = 'background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; font-size: 0.8rem;';
                errBubble.textContent = errorMsg;
                log.appendChild(errBubble);
                log.scrollTop = log.scrollHeight;
              }
            }`;

if (content.includes(oldReplyBlock)) {
    content = content.replace(oldReplyBlock, newReplyBlock);
    console.log('✅ Added language mismatch detection to SharedUI.js');
} else {
    console.log('❌ Could not find target block');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Saved SharedUI.js');
