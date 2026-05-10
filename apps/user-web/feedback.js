"use strict";

// Fix image viewing error
window.WanderUI = window.WanderUI || {};
window.WanderUI.viewImage = function(src) {
    let viewer = document.getElementById('wv-image-viewer');
    if (!viewer) {
        viewer = document.createElement('div');
        viewer.id = 'wv-image-viewer';
        viewer.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);cursor:zoom-out;opacity:0;transition:opacity 0.3s;';
        viewer.innerHTML = '<img id="wv-viewer-img" style="max-width:90%;max-height:90%;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.5);transform:scale(0.9);transition:transform 0.3s;">';
        viewer.onclick = () => {
            viewer.style.opacity = '0';
            viewer.querySelector('img').style.transform = 'scale(0.9)';
            setTimeout(() => viewer.style.display = 'none', 300);
        };
        document.body.appendChild(viewer);
    }
    const img = viewer.querySelector('img');
    img.src = src;
    viewer.style.display = 'flex';
    requestAnimationFrame(() => {
        viewer.style.opacity = '1';
        img.style.transform = 'scale(1)';
    });
};

const FeedbackHub = {
    allThreads: [],
    activeThreadId: null,
    user: null,
    currentTab: 'system', // 'system' or 'business'

    init: async function() {
        const token = localStorage.getItem('wander_token');
        if (!token) {
            this.showLoginRequired();
            return;
        }

        try {
            // Decode token to get user info (optional, for UI)
            // UTF-8 compatible JWT decoding
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            this.user = payload.user || payload;
            
            this.renderUserMiniCard();
            await this.loadThreads();
            this.setupEventListeners();
        } catch (err) {
            console.error('Init Error:', err);
            this.showError('Không thể khởi tạo hệ thống.');
        }
    },

    loadThreads: async function() {
        const listContainer = document.getElementById('thread-list');
        try {
            const res = await fetch('/api/feedback/my-feedbacks', {
                headers: { 'x-auth-token': localStorage.getItem('wander_token') }
            });
            const json = await res.json();
            
            if (json.success) {
                this.allThreads = json.data || [];
                this.renderThreadList(this.getFilteredThreads());
            } else {
                throw new Error(json.message);
            }
        } catch (err) {
            listContainer.innerHTML = `<p style="padding:20px;text-align:center;color:#ff4d4d;">Lỗi: ${err.message}</p>`;
        }
    },

    renderUserMiniCard: function() {
        if (!this.user) return;
        const name = this.user.displayName || this.user.name || 'Thành viên';
        const nameEl = document.getElementById('ctx-user-name');
        const initialEl = document.getElementById('ctx-user-initial');
        if (nameEl) nameEl.textContent = name;
        if (initialEl) initialEl.textContent = name.charAt(0).toUpperCase();
        
        // Optional: Get rank from SharedUI if available
        const rankEl = document.getElementById('ctx-user-rank');
        if (rankEl && this.user.rank) {
            rankEl.textContent = this.user.rank;
        }
    },

    getFilteredThreads: function() {
        const q = (document.getElementById('search-input')?.value || '').toLowerCase();
        return this.allThreads.filter(t => {
            const isMatch = (t.message || '').toLowerCase().includes(q) || 
                          (t.replies && t.replies.some(r => (r.content || '').toLowerCase().includes(q)));
            
            if (this.currentTab === 'business') {
                // Doanh nghiệp: chỉ những thread có businessId
                return isMatch && !!t.businessId;
            } else {
                // Hệ thống: những thread KHÔNG có businessId
                return isMatch && !t.businessId;
            }
        });
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.tab === tab);
        });
        this.renderThreadList(this.getFilteredThreads());
        
        // Clear main view if active thread is not in current tab
        const currentThreads = this.getFilteredThreads();
        if (!currentThreads.find(t => t._id === this.activeThreadId)) {
            this.showEmptyState();
        }
    },

    showEmptyState: function() {
        const mainContainer = document.getElementById('feedback-main');
        mainContainer.innerHTML = `
            <div class="empty-view">
                <i>${this.currentTab === 'system' ? '⚙️' : '🏢'}</i>
                <h2>${this.currentTab === 'system' ? 'Phản hồi Hệ thống' : 'Phản hồi Doanh nghiệp'}</h2>
                <p>${this.currentTab === 'system' ? 'Xem các phản hồi về bảo trì, hỗ trợ chung từ WanderViệt.' : 'Trao đổi, tư vấn trực tiếp với các đối tác doanh nghiệp.'}</p>
                <button class="btn btn--primary" style="margin-top:20px;" onclick="window.location.href='index.html#contact'">Gửi phản hồi mới</button>
            </div>
        `;
    },

    renderThreadList: function(threads) {
        const listContainer = document.getElementById('thread-list');
        if (!threads || threads.length === 0) {
            listContainer.innerHTML = `<p style="padding:40px;text-align:center;color:var(--text-muted);font-size:0.9rem;">
                Không có cuộc hội thoại nào trong mục ${this.currentTab === 'system' ? 'Hệ thống' : 'Doanh nghiệp'}.
            </p>`;
            return;
        }

        listContainer.innerHTML = threads.map(t => {
            const lastMsg = t.replies && t.replies.length > 0 ? t.replies[t.replies.length - 1] : { content: t.message, createdAt: t.createdAt };
            const date = new Date(lastMsg.createdAt).toLocaleDateString('vi-VN');
            const isActive = t._id === this.activeThreadId;
            
            // Limit preview length
            let preview = lastMsg.content;
            if (preview.length > 60) preview = preview.substring(0, 57) + '...';
            
            // Resolve display name for business threads
            let displayName;
            if (t.businessId) {
                if (t.businessName) {
                    displayName = '🏢 ' + t.businessName;
                } else {
                    // Extract from message pattern "[Từ dịch vụ: NAME]"
                    const nameMatch = (t.message || '').match(/\[Từ dịch vụ:\s*(.*?)\]/);
                    displayName = nameMatch ? '🏢 ' + nameMatch[1].trim() : '🏢 Doanh nghiệp';
                }
            } else {
                displayName = '⚙️ Hỗ trợ hệ thống';
            }

            return `
                <div class="thread-item ${isActive ? 'is-active' : ''}" onclick="FeedbackHub.selectThread('${t._id}')">
                    <div class="thread-top">
                        <span class="thread-name">
                            <span class="status-dot ${t.status}"></span>
                            ${displayName}
                        </span>
                        <span class="thread-time">${date}</span>
                    </div>
                    <div class="thread-preview">${preview}</div>
                </div>
            `;
        }).join('');
    },

    selectThread: function(id) {
        this.activeThreadId = id;
        const thread = this.allThreads.find(t => t._id === id);
        if (!thread) return;

        this.renderThreadList(this.getFilteredThreads()); // Refresh active state with correct filter
        this.renderConversation(thread);
    },

    renderConversation: function(thread) {
        const mainContainer = document.getElementById('feedback-main');
        const isWaiting = thread.status === 'open';
        
        // Resolve display name for header
        let headerName;
        if (thread.businessId) {
            if (thread.businessName) {
                headerName = '🏢 ' + thread.businessName;
            } else {
                const nameMatch = (thread.message || '').match(/\[Từ dịch vụ:\s*(.*?)\]/);
                headerName = nameMatch ? '🏢 ' + nameMatch[1].trim() : '🏢 Doanh nghiệp';
            }
        } else {
            headerName = '⚙️ Hỗ trợ hệ thống';
        }
        
        mainContainer.innerHTML = `
            <div class="main-header">
                <div class="thread-info">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <h3>${headerName}</h3>
                        ${isWaiting ? '<span class="waiting-badge">⏳ Chờ phản hồi</span>' : '<span class="waiting-badge" style="background:rgba(16,185,129,0.1); color:#10b981;">✅ Đã xử lý</span>'}
                    </div>
                    <p>Khởi tạo: ${new Date(thread.createdAt).toLocaleString('vi-VN')} · Loại: ${thread.businessId ? 'Doanh nghiệp' : 'Hệ thống'} · #${thread._id.substring(thread._id.length - 6)}</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn--ghost btn--small" onclick="FeedbackHub.loadThreads()">Làm mới</button>
                </div>
            </div>
            <div class="chat-container" id="chat-container">
                <!-- Initial Message -->
                <div class="message-row is-me">
                    <div class="message-meta">Bạn • ${new Date(thread.createdAt).toLocaleString('vi-VN')}</div>
                    <div class="message-bubble">
                        ${thread.message}
                        ${thread.image ? `<img src="${thread.image}" class="message-image" onclick="window.WanderUI.viewImage('${thread.image}')">` : ''}
                    </div>
                </div>

                <!-- Replies -->
                ${(thread.replies || []).map(r => {
                    const isMe = r.senderRole === 'user';
                    const senderLabel = isMe ? 'Bạn' : (r.senderRole === 'admin' ? 'Quản trị viên' : 'Đối tác');
                    return `
                        <div class="message-row ${isMe ? 'is-me' : 'is-other'}">
                            <div class="message-meta">${senderLabel} • ${new Date(r.createdAt).toLocaleString('vi-VN')}</div>
                            <div class="message-bubble">
                                ${r.content}
                                ${r.image ? `<img src="${r.image}" class="message-image" onclick="window.WanderUI.viewImage('${r.image}')">` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Add Feedback Button (Reveals Reply Area) -->
            <div class="reply-trigger-container" id="reply-trigger">
                <button class="btn-add-feedback" onclick="FeedbackHub.showReplyArea()">
                    <span>➕</span> Thêm phản hồi
                </button>
            </div>

            <div class="reply-area" id="reply-area">
                <form id="reply-form" onsubmit="FeedbackHub.handleReply(event)">
                    <div class="reply-box">
                        <textarea id="reply-input" placeholder="Viết phản hồi hoặc yêu cầu của bạn..." rows="1" oninput="this.style.height = '';this.style.height = this.scrollHeight + 'px'"></textarea>
                        <div class="reply-actions">
                            <label class="btn-circle" title="Đính kèm ảnh">
                                <i>📷</i>
                                <input type="file" id="reply-image" hidden accept="image/*" onchange="FeedbackHub.handleImageSelect(this)">
                            </label>
                            <button type="submit" class="btn-circle btn-send" id="send-btn">
                                🚀
                            </button>
                        </div>
                    </div>
                    <div id="image-preview-strip" style="margin-top:10px; display:none;">
                        <div style="position:relative; width:60px; height:60px;">
                            <img id="image-preview" src="" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
                            <button type="button" onclick="FeedbackHub.clearImage()" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        this.scrollToBottom();
    },

    showReplyArea: function() {
        const area = document.getElementById('reply-area');
        const trigger = document.getElementById('reply-trigger');
        if (area && trigger) {
            area.style.display = 'block';
            trigger.style.display = 'none';
            document.getElementById('reply-input').focus();
            this.scrollToBottom();
        }
    },

    handleImageSelect: function(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageBase64 = e.target.result;
            document.getElementById('image-preview').src = this.currentImageBase64;
            document.getElementById('image-preview-strip').style.display = 'block';
        };
        reader.readAsDataURL(file);
    },

    clearImage: function() {
        this.currentImageBase64 = null;
        document.getElementById('reply-image').value = '';
        document.getElementById('image-preview-strip').style.display = 'none';
    },

    handleReply: async function(e) {
        e.preventDefault();
        const input = document.getElementById('reply-input');
        const content = input.value.trim();
        const sendBtn = document.getElementById('send-btn');
        
        if (!content && !this.currentImageBase64) return;
        if (!this.activeThreadId) return;

        sendBtn.disabled = true;
        try {
            const res = await fetch(`/api/feedback/${this.activeThreadId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('wander_token')
                },
                body: JSON.stringify({
                    content: content,
                    image: this.currentImageBase64
                })
            });
            const json = await res.json();
            
            if (json.success) {
                input.value = '';
                this.clearImage();
                await this.loadThreads(); // Reload all
                this.selectThread(this.activeThreadId); // Re-render current
            } else {
                alert('Lỗi: ' + json.message);
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ.');
        } finally {
            sendBtn.disabled = false;
        }
    },

    scrollToBottom: function() {
        const container = document.getElementById('chat-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    setupEventListeners: function() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderThreadList(this.getFilteredThreads());
            });
        }
    },

    showLoginRequired: function() {
        document.getElementById('feedback-main').innerHTML = `
            <div class="empty-view">
                <i>🔒</i>
                <h2>Yêu cầu đăng nhập</h2>
                <p>Bạn cần đăng nhập để xem và quản lý các phản hồi của mình.</p>
                <button class="btn btn--primary" style="margin-top:20px;" onclick="window.WanderUI.openAuthModal()">Đăng nhập ngay</button>
            </div>
        `;
    },

    showError: function(msg) {
        document.getElementById('feedback-main').innerHTML = `
            <div class="empty-view">
                <i>⚠️</i>
                <h2>Đã có lỗi xảy ra</h2>
                <p>${msg}</p>
                <button class="btn btn--ghost" style="margin-top:20px;" onclick="location.reload()">Thử lại</button>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => FeedbackHub.init());
