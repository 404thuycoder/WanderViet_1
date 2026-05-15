/**
 * WanderViệt Shared UI Logic
 * Theme, Toast, Notifications, Rank Badges, Common Modals
 */
window.WanderUI = window.WanderUI || {};

window.WanderUI = Object.assign(window.WanderUI, (function () {
  'use strict';

  const STORAGE_THEME = 'wander_theme';
  
  // Global HTML escaping helper
  window.esc = function(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // ─── Global Loading System ───────────────────────────────────────────────
  let loaderCount = 0;
  function showLoading(message = 'Đang xử lý...') {
    loaderCount++;
    let loader = document.getElementById('wv-global-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'wv-global-loader';
      loader.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(6,9,18,0.7);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity 0.3s;';
      loader.innerHTML = `
        <div class="wv-loader-spinner" style="width:48px;height:48px;border:4px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:wv-spin 1s linear infinite;"></div>
        <div id="wv-loader-text" style="margin-top:1.5rem;color:#fff;font-weight:600;font-size:0.95rem;letter-spacing:0.5px;">${message}</div>
        <style>@keyframes wv-spin { to { transform: rotate(360deg); } }</style>
      `;
      document.body.appendChild(loader);
    } else {
      document.getElementById('wv-loader-text').innerText = message;
      loader.style.display = 'flex';
      loader.style.opacity = '1';
    }
  }

  function hideLoading() {
    loaderCount = Math.max(0, loaderCount - 1);
    if (loaderCount === 0) {
      const loader = document.getElementById('wv-global-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { if (loaderCount === 0) loader.style.display = 'none'; }, 300);
      }
    }
  }
  window.WanderUI.showLoading = showLoading;
  window.WanderUI.hideLoading = hideLoading;

  // ─── Global Fetch Interceptor for Suspension ─────────────────────────────
  const originalFetch = window.fetch;
  function openModal(name) {
    const m = document.querySelector('[data-modal="' + name + '"]');
    if (!m) return;
    m.hidden = false;
    const backdrop = document.querySelector('[data-modal-backdrop]');
    if (backdrop) backdrop.hidden = false;
    if (m.classList.contains('slide-drawer')) {
      requestAnimationFrame(() => m.classList.add('is-open'));
    }
  }
  window.openModal = openModal;

  function closeModal(m) {
    if (typeof m === 'string') m = document.querySelector('[data-modal="' + m + '"]');
    if (!m) return;
    if (m.classList.contains('slide-drawer')) {
      m.classList.remove('is-open');
      setTimeout(() => { m.hidden = true; }, 300);
    } else {
      m.hidden = true;
    }
    const backdrop = document.querySelector('[data-modal-backdrop]');
    if (backdrop) backdrop.hidden = true;
    document.documentElement.style.overflow = "";
  }
  window.closeModal = closeModal;
  window.closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => closeModal(m));
  };

  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

    // Big-Tech Pattern: Check prefetch cache first (Skip for dynamic user state)
    const cacheKey = 'wv_prefetch_' + url;
    const isDynamic = url.includes('/api/auth/user/rank') || url.includes('/api/auth/me');
    const cached = isDynamic ? null : sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 15000) { // 15s fresh
          console.log(`🎯 Fast-Path: Using prefetched data for ${url}`);
          // Don't remove immediately to allow multiple consumption if needed (e.g. stats)
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-prefetched': 'true' }
          });
        }
      } catch (e) { }
    }

    try {
      const response = await originalFetch.apply(this, args);

      if (response.status === 403 || response.status === 401) {
        try {
          const clone = response.clone();
          const data = await clone.json();

          if (response.status === 403 && data && data.message && data.message.includes('bị khóa')) {
            showSuspendedModal();
          }

          if (response.status === 401 && !url.includes('/login') && !url.includes('/register')) {
            localStorage.removeItem('wander_token');
            localStorage.removeItem('wander_admin_token');
          }
        } catch (e) { /* ignore parse error */ }
      }

      if (!response.ok && !url.includes('/api/auth/me')) {
        console.error(`[Fetch Error] ${response.status} ${url}`);
        // Optionally show a toast for specific critical errors
        if (response.status >= 500) {
          window.WanderUI.showToast('Lỗi máy chủ, vui lòng thử lại sau', 'error');
        }
      }

      return response;
    } catch (err) {
      console.error(`[Fetch Network Error] ${url}`, err);
      window.WanderUI.showToast('Lỗi kết nối mạng', 'error');
      throw err;
    }
  };

  function showSuspendedModal() {
    let modal = document.getElementById('wander-suspended-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wander-suspended-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);';
      modal.innerHTML = `
        <div style="background:var(--bg-elevated,#1e293b);border-radius:24px;width:min(400px,90vw);padding:2.5rem 2rem;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.5);border:1px solid rgba(244,63,94,0.4);">
          <div style="font-size:3.5rem;margin-bottom:1rem;filter:drop-shadow(0 0 12px rgba(244,63,94,0.5));">🔒</div>
          <h2 style="color:#f43f5e;margin:0 0 1rem 0;font-size:1.6rem;font-weight:700;">Tài khoản bị khóa</h2>
          <p style="color:var(--text-muted,#94a3b8);margin:0 0 2rem 0;line-height:1.6;font-size:0.95rem;">Tài khoản của bạn đã bị quản trị viên khóa do phát hiện dấu hiệu vi phạm chính sách của WanderViệt. Vui lòng đăng xuất.</p>
          <button onclick="WanderUI.forceLogout()" style="background:#f43f5e;color:white;border:none;padding:0.9rem 2rem;border-radius:12px;font-weight:600;font-size:1.05rem;cursor:pointer;width:100%;transition:all 0.2s;box-shadow:0 8px 24px rgba(244,63,94,0.3);">Đăng Xuất Ngay</button>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  }

  function forceLogout() {
    localStorage.removeItem('wander_token');
    localStorage.removeItem('wander_session');
    localStorage.removeItem('wander_user'); // Fix stale user data
    sessionStorage.clear();
    window.location.href = '/?login=true';
  }

  // ─── Activity Tracking ──────────────────────────────────────────────────
  async function recordActivity(type, description, metadata = {}) {
    const token = localStorage.getItem('wander_token');
    if (!token) return; // Chỉ lưu hoạt động cho người dùng đã đăng nhập

    try {
      await fetch('/api/activities/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ type, description, metadata })
      });
    } catch (e) {
      console.warn('Silent activity record failure:', e);
    }
  }

  // ─── Business Activity Tracking ──────────────────────────────────────────
  async function logBusinessActivity(placeId, type, details = {}) {
    if (!placeId) return;
    try {
      const user = JSON.parse(localStorage.getItem('wander_user') || '{}');
      const token = localStorage.getItem('wander_token');
      
      const res = await fetch('/api/business/activities/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          type,
          details,
          userId: user._id || null,
          userName: user.displayName || user.name || 'Khách vãng lai'
        })
      });
      return await res.json();
    } catch (e) {
      console.warn('[Activity Log] Error:', e);
    }
  }
  window.WanderUI.logBusinessActivity = logBusinessActivity;

  // ─── Theme ───────────────────────────────────────────────────────────────
  function setTheme(theme, syncWithBackend = false) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
    if (syncWithBackend) {
      const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
      if (token) {
        fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
          body: JSON.stringify({ preferences: { theme } })
        }).catch(err => console.debug('Sync theme failed:', err));
      }
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark', true);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved) setTheme(saved);
    else setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  // ─── Toast ───────────────────────────────────────────────────────────────
  function getToastContainer() {
    let c = document.getElementById('wander-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'wander-toast-container';
      c.style.cssText = 'position:fixed;bottom:2rem;right:2rem;display:flex;flex-direction:column;gap:0.75rem;z-index:99999;pointer-events:none;';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type = 'info') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `wander-toast wander-toast--${type}`;
    toast.innerHTML = `<div class="wander-toast__content">${message}</div><button class="wander-toast__close">&times;</button>`;
    container.appendChild(toast);
    toast.querySelector('.wander-toast__close').onclick = () => toast.remove();
    setTimeout(() => {
      toast.classList.add('wander-toast--fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // ─── Button Loading ───────────────────────────────────────────────────────
  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.classList.add('btn-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    }
  }

  // ─── Notifications & Real-time ───────────────────────────────────────────
  let lastNotifCount = -1;
  let socket = null;

  function initSocket() {
    const token = localStorage.getItem('wander_token');
    if (!token || typeof io === 'undefined' || socket) return;

    socket = io({ 
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
    });
    socket.on('notification', (notif) => {
      WanderUI.showToast(notif.message || 'Bạn có thông báo mới!', 'info');
      updateNotificationBadge();
      if (document.getElementById('wander-notif-drawer')?.classList.contains('is-open')) {
        renderNotifications();
      }
    });
  }

  async function updateNotificationBadge() {
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/unread-count', { headers: { 'x-auth-token': token } });
      if (res.status === 401) {
        return;
      }
      const json = await res.json();

      // Show toast if count increased
      if (lastNotifCount !== -1 && json.count > lastNotifCount) {
        WanderUI.showToast('Bạn có thông báo mới!', 'info');
        // Optional: Play a subtle sound
      }
      lastNotifCount = json.count;

      const badge = document.querySelector('[data-notif-badge]');
      if (badge) {
        if (json.count > 0) {
          badge.textContent = json.count > 20 ? '20+' : json.count;
          badge.style.display = 'flex';
          badge.classList.add('pulse-notif');
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) { }
  }

  // Start polling & Real-time
  setInterval(updateNotificationBadge, 30000); // Check every 30s
  setTimeout(() => {
    updateNotificationBadge();
    initSocket();
  }, 2000);

  function toggleNotificationDrawer() {
    const drawer = document.getElementById('wander-notif-drawer') || createNotificationDrawer();
    const isOpen = drawer.classList.contains('is-open');
    if (!isOpen) {
      renderNotifications();
      drawer.style.display = 'flex';
      requestAnimationFrame(() => drawer.classList.add('is-open'));
    } else {
      drawer.classList.remove('is-open');
      setTimeout(() => { drawer.style.display = 'none'; }, 300);
    }
  }

  function createNotificationDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'wander-notif-drawer';
    drawer.className = 'wander-notif-drawer slide-drawer';
    drawer.innerHTML = `
      <div class="wander-notif-drawer__header">
        <h3>Thông báo</h3>
        <button class="wander-notif-drawer__close" onclick="WanderUI.toggleNotificationDrawer()">×</button>
      </div>
      <div class="wander-notif-drawer__body" id="wander-notif-body">
         <div class="notif-loading">Đang tải thông báo...</div>
      </div>
      <div class="wander-notif-drawer__footer">
        <button onclick="WanderUI.markAllAsRead()" class="btn btn--ghost btn--small">Đánh dấu tất cả đã đọc</button>
      </div>
    `;
    document.body.appendChild(drawer);
    injectNotifStyles();
    return drawer;
  }

  function injectNotifStyles() {
    if (document.getElementById('notif-styles')) return;
    const style = document.createElement('style');
    style.id = 'notif-styles';
    style.textContent = `
      .wander-notif-drawer {
        position: fixed; top: 0; right: 0; bottom: 0; width: 380px; 
        background: var(--bg-elevated); border-left: 1px solid var(--border);
        z-index: 999999; display: none; flex-direction: column;
        box-shadow: -10px 0 30px rgba(0,0,0,0.3); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(100%);
      }
      .wander-notif-drawer.is-open { transform: translateX(0); }
      .wander-notif-drawer__header { 
        padding: 1.5rem; border-bottom: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center;
      }
      .wander-notif-drawer__body { flex: 1; overflow-y: auto; }
      .wander-notif-drawer__footer { padding: 1rem; border-top: 1px solid var(--border); text-align: center; }
      .wander-notif-item {
        padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03);
        cursor: pointer; transition: background 0.2s; position: relative;
      }
      .wander-notif-item:hover { background: rgba(255,255,255,0.03); }
      .wander-notif-item.is-unread { background: rgba(0, 240, 255, 0.03); }
      .wander-notif-item.is-unread::before {
        content: ''; position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
        width: 6px; height: 6px; background: var(--accent); border-radius: 50%;
      }
      .wander-notif-item.is-system { cursor: default; }
      .wander-notif-item.is-system:hover { background: transparent; }
      .wander-notif-item__title { font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; color: var(--text); }
      .wander-notif-item__message { font-size: 0.88rem; color: var(--text-muted); line-height: 1.4; }
      .wander-notif-item__time { font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; opacity: 0.6; }
      .pulse-notif { animation: pulse-ring 2s infinite; }
      @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(0, 240, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0); } }
    `;
    document.head.appendChild(style);
  }

  async function markAllAsRead() {
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    await fetch('/api/notifications/read-all', { method: 'POST', headers: { 'x-auth-token': token } });
    renderNotifications();
    updateNotificationBadge();
  }

  let _notifCache = [];

  async function renderNotifications() {
    const body = document.getElementById('wander-notif-body');
    if (!body) return;
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    const res = await fetch('/api/notifications', { headers: { 'x-auth-token': token } });
    const json = await res.json();
    if (!json.success || !json.data.length) {
      body.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">Không có thông báo mới</div>';
      _notifCache = [];
      return;
    }
    _notifCache = json.data;
    body.innerHTML = json.data.map((n, idx) => {
      return `
        <div class="wander-notif-item ${n.isRead ? '' : 'is-unread'} is-system">
          <div class="wander-notif-item__title">${n.title}</div>
          <div class="wander-notif-item__message">${n.message}</div>
          <div class="wander-notif-item__time">${new Date(n.createdAt).toLocaleString('vi-VN')}</div>
        </div>
      `;
    }).join('');
  }

  window.WanderUI.handleNotifClick = async function(idx) {
    // Interactivity disabled as per user request
    return;
  };

  async function markAsRead(id) {
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    await fetch(`/api/notifications/read/${id}`, { method: 'PUT', headers: { 'x-auth-token': token } });
    updateNotificationBadge();
  }

  // ─── Rank ──────────────────────────────────────────────────────────
  function getRankIcon(rank) {
    if (rank.includes('Đồng')) return '🥉';
    if (rank.includes('Bạc')) return '🥈';
    if (rank.includes('Vàng')) return '🥇';
    if (rank.includes('Bạch Kim')) return '💎';
    if (rank.includes('Kim Cương')) return '💠';
    if (rank.includes('Huyền Thoại')) return '👑';
    return '🏅';
  }

  function getRankBadgeHTML(rank, tier) {
    if (!rank) return '';
    const tierKey = (tier === 'I' || tier === '1') ? '1' : (tier === 'II' || tier === '2') ? '2' : (tier === 'III' || tier === '3') ? '3' : '1';
    let rankClass = 'rank-bronze-1';
    if (rank.includes('Bạch Kim')) rankClass = `rank-platinum-${tierKey}`;
    else if (rank.includes('Bạc')) rankClass = `rank-silver-${tierKey}`;
    else if (rank.includes('Đồng')) rankClass = `rank-bronze-${tierKey}`;
    else if (rank.includes('Vàng')) rankClass = `rank-gold-${tierKey}`;
    else if (rank.includes('Kim Cương')) rankClass = `rank-diamond-${tierKey}`;
    else if (rank.includes('Huyền Thoại')) rankClass = 'rank-legendary';
    return `<div class="rank-badge-container" style="display:inline-flex; align-items:center;">
      <div class="rank-sprite ${rankClass}"></div>
    </div>`;
  }

  function getStoreKey(base) {
    return 'wv_' + base;
  }

  function trackQuestActivity(key, value) {
    try {
      var storeKey = getStoreKey('quest_activity');
      var data = JSON.parse(localStorage.getItem(storeKey) || '{}');
      var d = new Date();
      var today = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (data.date !== today) {
        data = { date: today };
      }
      data[key] = Math.max(data[key] || 0, value || 1);
      localStorage.setItem(storeKey, JSON.stringify(data));
    } catch (e) { }
  }

  function getQuestActivity(key) {
    try {
      var storeKey = getStoreKey('quest_activity');
      var data = JSON.parse(localStorage.getItem(storeKey) || '{}');
      var d = new Date();
      var today = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (data.date !== today) return 0;
      return data[key] || 0;
    } catch (e) { return 0; }
  }

  // ─── Auth Sync ──────────────────────────────────────────────────
  function toggleUserMenu(open) {
    const userToggle = document.querySelector('[data-user-toggle]');
    const dd = document.querySelector('[data-user-dropdown]');
    if (!userToggle || !dd) return;
    if (open) {
      dd.hidden = false;
      dd.style.display = 'block';
      userToggle.setAttribute("aria-expanded", "true");
    } else {
      dd.hidden = true;
      dd.style.display = 'none';
      userToggle.setAttribute("aria-expanded", "false");
    }
  }


  let syncInProgress = false;
  let lastSyncTime = 0;
  let lastSyncedData = null; // Big-Tech: Cache to prevent redundant re-renders
  const SYNC_THROTTLE = 1000; // Increase throttle for better stability

  async function syncAuthUI(force = false) {
    if (syncInProgress && !force) return;
    const now = Date.now();
    if (!force && now - lastSyncTime < SYNC_THROTTLE) return;

    syncInProgress = true;
    lastSyncTime = now;

    try {
      const token = localStorage.getItem('wander_token');
      const headerArea = document.getElementById('header-user-area');
      const authBtns = document.querySelectorAll("[data-auth-open]");
      const profileTrays = document.querySelectorAll("[data-auth-show]");
      
      if (!headerArea && authBtns.length === 0 && profileTrays.length === 0) return;

      if (!token) {
        authBtns.forEach(el => el.style.display = "flex");
        profileTrays.forEach(el => { el.style.display = "none"; el.hidden = true; });
        if (document.getElementById('header-user-rank')) document.getElementById('header-user-rank').style.display = "none";
        lastSyncedData = null;
        return;
      }

      const payload = decodeJWT(token);
      if (!payload) {
        authBtns.forEach(el => el.style.display = "flex");
        profileTrays.forEach(el => { el.style.display = "none"; el.hidden = true; });
        if (document.getElementById('header-user-rank')) document.getElementById('header-user-rank').style.display = "none";
        return;
      }
      const u = payload.user || payload.account || payload;

      // Fetch fresh rank/profile data
      const r = await fetch('/api/auth/user/rank?t=' + Date.now(), { headers: { 'x-auth-token': token } });
      if (r.status === 401) {
        WanderUI.forceLogout();
        return;
      }
      const data = await r.json();
      const freshUser = data.success ? data : u;

      // Sync Language Preference if logged in
      if (freshUser.preferences && freshUser.preferences.language) {
        const savedLang = freshUser.preferences.language;
        const currentCookie = document.cookie.match(/googtrans=\/vi\/([a-zA-Z-]+)/);
        const activeLang = currentCookie ? currentCookie[1] : 'vi';
        
        if (savedLang !== activeLang) {
          console.log(`[LangSync] Applying saved preference: ${savedLang}`);
          if (typeof window.changeLang === 'function') {
            window.changeLang(savedLang, true); // true = skip server save
          }
        }
      }

      // Big-Tech: Deep compare to prevent blinking if data hasn't changed
      const dataString = JSON.stringify({ ...freshUser, token: token.substring(0, 20) });
      if (dataString === lastSyncedData) return;
      lastSyncedData = dataString;

      // Update UI visibility
      authBtns.forEach(el => el.style.display = "none");
      profileTrays.forEach(el => { el.style.display = "flex"; el.removeAttribute('hidden'); });

      const displayName = freshUser.displayName || freshUser.name || "Thành viên";
      const userNameEl = document.querySelector("[data-user-name]");
      if (userNameEl) {
        userNameEl.innerHTML = `
          <div style="display:flex; flex-direction:column; line-height:1.2;">
            <span style="font-weight:700; color:#fff; font-size:0.95rem;">${esc(displayName)}</span>
            <span style="font-size:0.7rem; color:var(--text-muted); opacity:0.8;">${freshUser.customId || ""}</span>
            <span style="font-size:0.7rem; color:var(--text-muted);">${esc(freshUser.email || u.email || "")}</span>
          </div>
        `;
      }

      const userInitial = document.querySelector("[data-user-initial]");
      const userAvatarImg = document.querySelector("[data-user-avatar]");
      if (freshUser.avatar) {
        if (userAvatarImg) {
          userAvatarImg.src = freshUser.avatar;
          userAvatarImg.style.display = 'block';
          userAvatarImg.removeAttribute('hidden');
        }
        if (userInitial) userInitial.style.display = 'none';
      } else {
        if (userInitial) {
          userInitial.textContent = displayName.charAt(0).toUpperCase();
          userInitial.style.display = 'flex';
        }
        if (userAvatarImg) userAvatarImg.setAttribute('hidden', '');
      }

      const headerRankEl = document.getElementById('header-user-rank');
      if (headerRankEl) {
        headerRankEl.innerHTML = getRankBadgeHTML(freshUser.rank, freshUser.rankTier);
        headerRankEl.style.display = 'flex';
      }

      const ddBody = document.querySelector('.user-dropdown__body');
      if (ddBody) {
        ddBody.innerHTML = `
          <a href="profile.html" class="user-dropdown-item" data-open-profile>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Trang cá nhân
          </a>
          <a href="my-trips.html" class="user-dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            Chuyến đi của tôi
          </a>
          <button type="button" class="user-dropdown-item" data-open-activity>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            Thống kê hoạt động
          </button>
          <div style="border-top:1px solid rgba(255,255,255,0.05); margin:0.5rem 0;"></div>
          <button type="button" class="user-dropdown-item" data-open-settings>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Cài đặt hệ thống
          </button>
          <a href="feedback.html" class="user-dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Phản hồi
          </a>
          <div style="border-top:1px solid rgba(255,255,255,0.05); margin:0.5rem 0;"></div>
          <button type="button" class="btn btn--danger btn--small w-full justify-center" data-logout-btn>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Đăng xuất
          </button>
        `;
      }
    } catch (e) {
      console.warn("Auth sync UI minor issue:", e);
    } finally {
      syncInProgress = false;
    }
  }

  // Big-Tech: One-time global listener for auth-related actions
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-profile]')) {
      window.location.href = 'profile.html';
    }
    if (e.target.closest('[data-logout-btn]')) {
      WanderUI.forceLogout();
    }
    if (e.target.closest('[data-open-activity]')) {
      WanderUI.openModal('activity-stats');
    }
  });

  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isExplorer = page === 'index.html' || page === '';
  const isSocial = page.includes('social');
  const isServices = page.includes('leaderboard') || page.includes('voucher') || page.includes('services');
  const isQuests = page.includes('quests');
  const isHistory = page.includes('history');

  function injectHeader() {
    const container = document.getElementById('header-container') || document.querySelector('[data-header]') || document.querySelector('.site-header') || document.querySelector('header');
    if (!container) {
      console.error("❌ WanderUI: Header container NOT found!");
      return;
    }

    container.innerHTML = `
      <div class="header-inner">
        <div class="header-left">
          <a href="index.html" class="logo">
            <img src="/assets/wanderviet-logo-cropped-rounded.png" alt="WanderViệt" style="height: 38px; width: 38px; object-fit: cover;">
            <span class="logo-text">WanderViệt</span>
          </a>
        </div>

        <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
          <span class="nav-toggle-bar"></span>
          <span class="visually-hidden">Mở menu</span>
        </button>
        
        <div class="nav-overlay" data-nav-overlay></div>
        <nav id="site-nav" class="site-nav" data-nav>
          <div class="site-nav__mobile-head">
             <div class="site-nav__mobile-logo">
                <img src="/assets/wanderviet-logo-cropped-rounded.png" alt="Logo" class="logo-mark-img" style="width: 32px; height: 32px; margin-right: 10px; object-fit: cover;">
                <div class="site-nav__mobile-title">
                   <strong>WanderViệt</strong>
                   <span>Khám phá • Trải nghiệm</span>
                </div>
             </div>
          </div>
          <ul class="nav-list">
             <li><a href="index.html" class="nav-link" data-link="home">🏠 Trang chủ</a></li>
             <li><a href="index.html#destinations" class="nav-link" data-link="destinations">🗺️ Điểm đến</a></li>
             <li><a href="my-trips.html" class="nav-link" data-link="my-trips">📅 Chuyến đi</a></li>
             <li><a href="planner.html" class="nav-link" data-link="ai-planner">🤖 AI Trợ lý</a></li>
             <li><a href="social-hub.html" class="nav-link" data-link="social">👥 Cộng đồng</a></li>
             <li><a href="quests.html" class="nav-link" data-link="quests">🎯 Nhiệm vụ</a></li>
             <li><a href="history.html" class="nav-link" data-link="history">⌛ Lịch sử</a></li>
             <li><a href="leaderboard.html" class="nav-link" data-link="leaderboard">🏆 BXH</a></li>
             <li><a href="business-directory.html" class="nav-link" data-link="business">🏨 Doanh nghiệp</a></li>
          </ul>
          
          <div class="site-nav__mobile-footer">
             <p>Mẹo nhỏ: Bạn có thể sử dụng AI Trợ lý để lên kế hoạch nhanh nhất.</p>
          </div>
        </nav>

        <div class="header-right">
          <!-- Language Selector -->
          <div class="lang-dropdown-wrapper" style="position: relative; margin-right: 4px;">
            <button type="button" class="btn-icon" onclick="this.nextElementSibling.classList.toggle('show')" title="Ngôn ngữ">
              <span class="current-flag"><img src="https://flagcdn.com/w20/vn.png" width="20" alt="VN" style="border-radius: 2px;"></span>
            </button>
            <ul class="lang-menu">
              <li><button class="lang-item" onclick="changeLang('vi')"><img src="https://flagcdn.com/w20/vn.png" width="20" alt="VN" style="border-radius: 2px;"> Tiếng Việt</button></li>
              <li><button class="lang-item" onclick="changeLang('en')"><img src="https://flagcdn.com/w20/gb.png" width="20" alt="GB" style="border-radius: 2px;"> English</button></li>
              <li><button class="lang-item" onclick="changeLang('ko')"><img src="https://flagcdn.com/w20/kr.png" width="20" alt="KR" style="border-radius: 2px;"> 한국어</button></li>
              <li><button class="lang-item" onclick="changeLang('ja')"><img src="https://flagcdn.com/w20/jp.png" width="20" alt="JP" style="border-radius: 2px;"> 日本語</button></li>
              <li><button class="lang-item" onclick="changeLang('zh-CN')"><img src="https://flagcdn.com/w20/cn.png" width="20" alt="CN" style="border-radius: 2px;"> 中文</button></li>
              <li><button class="lang-item" onclick="changeLang('th')"><img src="https://flagcdn.com/w20/th.png" width="20" alt="TH" style="border-radius: 2px;"> ภาษาไทย</button></li>
              <li><button class="lang-item" onclick="changeLang('fr')"><img src="https://flagcdn.com/w20/fr.png" width="20" alt="FR" style="border-radius: 2px;"> Français</button></li>
              <li><button class="lang-item" onclick="changeLang('ru')"><img src="https://flagcdn.com/w20/ru.png" width="20" alt="RU" style="border-radius: 2px;"> Русский</button></li>
              <li><button class="lang-item" onclick="changeLang('es')"><img src="https://flagcdn.com/w20/es.png" width="20" alt="ES" style="border-radius: 2px;"> Español</button></li>
              <li><button class="lang-item" onclick="changeLang('de')"><img src="https://flagcdn.com/w20/de.png" width="20" alt="DE" style="border-radius: 2px;"> Deutsch</button></li>
              <li><button class="lang-item" onclick="changeLang('it')"><img src="https://flagcdn.com/w20/it.png" width="20" alt="IT" style="border-radius: 2px;"> Italiano</button></li>
              <li><button class="lang-item" onclick="changeLang('pt')"><img src="https://flagcdn.com/w20/pt.png" width="20" alt="PT" style="border-radius: 2px;"> Português</button></li>
              <li><button class="lang-item" onclick="changeLang('ar')"><img src="https://flagcdn.com/w20/sa.png" width="20" alt="SA" style="border-radius: 2px;"> العربية</button></li>
              <li><button class="lang-item" onclick="changeLang('hi')"><img src="https://flagcdn.com/w20/in.png" width="20" alt="IN" style="border-radius: 2px;"> हिन्दी</button></li>
              <li><button class="lang-item" onclick="changeLang('id')"><img src="https://flagcdn.com/w20/id.png" width="20" alt="ID" style="border-radius: 2px;"> Indonesia</button></li>
              <li><button class="lang-item" onclick="changeLang('ms')"><img src="https://flagcdn.com/w20/my.png" width="20" alt="MY" style="border-radius: 2px;"> Melayu</button></li>
              <li><button class="lang-item" onclick="changeLang('nl')"><img src="https://flagcdn.com/w20/nl.png" width="20" alt="NL" style="border-radius: 2px;"> Nederlands</button></li>
              <li><button class="lang-item" onclick="changeLang('tl')"><img src="https://flagcdn.com/w20/ph.png" width="20" alt="PH" style="border-radius: 2px;"> Filipino</button></li>
            </ul>
          </div>
          
          <button type="button" class="btn-icon notif-btn-user" onclick="WanderUI.toggleNotificationDrawer()" aria-label="Thông báo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span class="notif-badge" data-notif-badge style="display:none;"></span>
          </button>
          
          <button type="button" class="btn-icon" data-open-settings title="Cài đặt">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          
          <div class="user-action-area" id="header-user-area">
             <div class="user-tray" data-auth-show hidden>
                <div class="user-rank-badge" id="header-user-rank"></div>
                <div class="user-bubble" data-user-toggle>
                   <span class="user-initial" data-user-initial>?</span>
                   <img src="" alt="" class="user-avatar" data-user-avatar hidden />
                </div>
                <div class="user-dropdown" data-user-dropdown hidden>
                   <div class="user-dropdown__head">
                      <div class="user-dropdown__name" data-user-name>Tài khoản</div>
                   </div>
                   <div class="user-dropdown__body">
                      <!-- Injected via syncAuthUI -->
                   </div>
                </div>
             </div>
             <button class="btn btn--primary login-btn" data-auth-open onclick="location.href='index.html#auth'" style="display: none;">Đăng nhập</button>
          </div>
        </div>
      </div>
      <div id="google_translate_element" style="position:absolute; width:0; height:0; overflow:hidden;"></div>
    `;

    // Immediately sync auth UI after injection to avoid empty profile on reload
    // Force sync auth UI immediately after injection to avoid empty profile due to race conditions
    syncAuthUI(true);

    // Language Selector & Google Translate Setup
    window.changeLang = function(lang, skipServerSave = false) {
      // 1. Update cookie safely without duplicate domains
      const domain = window.location.hostname;
      if (lang === 'vi') {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
        localStorage.setItem('preferred_lang', 'vi');
      } else {
        document.cookie = `googtrans=/vi/${lang}; path=/`;
        document.cookie = `googtrans=/vi/${lang}; path=/; domain=${domain}`;
        localStorage.setItem('preferred_lang', lang);
      }

      // 1.5. Save to server if logged in
      const token = localStorage.getItem('wander_token');
      if (token && !skipServerSave) {
        console.log(`[LangSync] Sending ${lang} to server...`);
        fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
          body: JSON.stringify({ preferences: { language: lang } })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            console.log('[LangSync] Server sync complete');
            // Show a subtle toast if possible
            if (window.WanderUI && WanderUI.showToast) {
              WanderUI.showToast('Language synchronized', 'success');
            }
          } else {
            console.error('[LangSync] Server error:', data.message);
          }
        })
        .catch(err => console.error('[LangSync] Server save failed:', err));
      }

      // 2. Try to trigger Google Translate dropdown directly (instant translation)
      const selectField = document.querySelector(".goog-te-combo");
      if (selectField) {
        selectField.value = lang;
        selectField.dispatchEvent(new Event("change"));
        
        // Update flag icon
        const flags = { 
          'vi': 'vn', 'en': 'gb', 'ko': 'kr', 'ja': 'jp', 'zh-CN': 'cn',
          'th': 'th', 'fr': 'fr', 'ru': 'ru', 'es': 'es',
          'de': 'de', 'it': 'it', 'pt': 'pt', 'ar': 'sa', 'hi': 'in',
          'id': 'id', 'ms': 'my', 'nl': 'nl', 'tl': 'ph'
        };
        const countryCode = flags[lang] || 'vn';
        document.querySelectorAll('.current-flag').forEach(el => {
          el.innerHTML = `<img src="https://flagcdn.com/w20/${countryCode}.png" width="20" alt="${countryCode.toUpperCase()}" style="border-radius: 2px;">`;
        });
      } else {
        // Fallback to reload if widget not ready
        location.reload();
      }
    };

    // Fallback to clear translation curtain after 1.5s just in case
    setTimeout(() => {
      document.documentElement.classList.remove('translating-curtain');
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
      const curtain = document.getElementById('translate-curtain');
      if (curtain) curtain.style.opacity = '0';
      setTimeout(() => { if (curtain) curtain.remove(); }, 500);
    }, 1500);

    setTimeout(() => {
      let currentLang = 'vi';
      const match = document.cookie.match(/googtrans=\/vi\/([a-zA-Z-]+)/);
      if (match && match[1]) currentLang = match[1];
      const flags = { 
        'vi': 'vn', 'en': 'gb', 'ko': 'kr', 'ja': 'jp', 'zh-CN': 'cn',
        'th': 'th', 'fr': 'fr', 'ru': 'ru', 'es': 'es',
        'de': 'de', 'it': 'it', 'pt': 'pt', 'ar': 'sa', 'hi': 'in',
        'id': 'id', 'ms': 'my', 'nl': 'nl', 'tl': 'ph'
      };
      const countryCode = flags[currentLang] || 'vn';
      document.querySelectorAll('.current-flag').forEach(el => {
        el.innerHTML = `<img src="https://flagcdn.com/w20/${countryCode}.png" width="20" alt="${countryCode.toUpperCase()}" style="border-radius: 2px;">`;
      });
    }, 100);

    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
          pageLanguage: 'vi',
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          includedLanguages: 'vi,en,ko,ja,zh-CN,th,fr,ru,es,de,it,pt,ar,hi,id,ms,nl,tl'
        }, 'google_translate_element');
      };
      
      // Force selected language from localStorage if cookie is missing
      const savedLang = localStorage.getItem('preferred_lang');
      if (savedLang && savedLang !== 'vi' && !document.cookie.includes('googtrans')) {
        const domain = window.location.hostname;
        document.cookie = `googtrans=/vi/${savedLang}; path=/; domain=${domain}`;
      }
      
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    }
    
    // Close language menu on clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lang-dropdown-wrapper')) {
        document.querySelectorAll('.lang-menu').forEach(m => m.classList.remove('show'));
      }
    });
  }

  function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const updateActive = () => {
      const fullPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
      const hash = window.location.hash.toLowerCase();

      navLinks.forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        let isCurrent = false;

        if (href.includes('#')) {
          const [hPage, hHash] = href.split('#');
          // If on index.html and link is index.html#hash or just #hash
          if ((fullPath === 'index.html' || fullPath === '') && (hPage === 'index.html' || hPage === '')) {
            isCurrent = hash === ('#' + hHash);
          }
        } else {
          isCurrent = (href === fullPath) || (fullPath === '' && href === 'index.html');
          // Special case: if we have a hash on index.html, the 'Home' link (index.html) shouldn't be active
          if (isCurrent && fullPath === 'index.html' && hash && href === 'index.html') {
            isCurrent = false;
          }
        }

        if (isCurrent) link.classList.add('active');
        else link.classList.remove('active');
      });
    };

    updateActive();
    window.addEventListener('hashchange', updateActive);

    // Mobile toggle
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    const overlay = document.querySelector('[data-nav-overlay]');
    const header = document.querySelector('.site-header');

    if (toggle && nav) {
      const closeMenu = () => {
        nav.classList.remove('is-open');
        if (header) header.classList.remove('is-nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      };

      toggle.onclick = (e) => {
        e.preventDefault();
        const isOpen = nav.classList.toggle('is-open');
        if (header) header.classList.toggle('is-nav-open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
      };

      // Close on overlay click
      if (overlay) {
        overlay.onclick = () => closeMenu();
      }

      // Close on link click
      navLinks.forEach(l => l.addEventListener('click', closeMenu));
    }
  }

  function injectCommonComponents() {
    // 1. Navigation items are now handled by injectHeader()

    if (!document.querySelector('link[href*="companion.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/companion.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[href*="voice-guide.css"]')) {
      const link2 = document.createElement('link');
      link2.rel = 'stylesheet';
      link2.href = '/css/voice-guide.css';
      document.head.appendChild(link2);
    }

    if (!document.querySelector('script[src*="chat-brain.js"]')) {
      const script1 = document.createElement('script');
      script1.src = '/js/chat-brain.js';
      document.body.appendChild(script1);
    }

    if (document.getElementById('global-chat-fab-wrap')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal-backdrop" data-modal-backdrop hidden></div>
      <div class="modal" id="modal-activity-stats" data-modal="activity-stats" role="dialog" aria-modal="true" hidden>
        <div class="modal__inner modal__inner--wide activity-stats-modal" style="max-width: 960px;">
          <div class="modal__header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 1.5rem 2rem;">
            <h2 class="modal__title" style="display: flex; align-items: center; gap: 0.75rem;">
               <span style="font-size: 1.5rem;">📊</span> Thống kê hoạt động cá nhân
            </h2>
            <button type="button" class="modal__close" data-modal-close aria-label="Đóng">×</button>
          </div>
          <div class="modal__body" style="padding: 2rem;">
            <div class="stats-summary-cards">
               <div class="stats-card">
                  <span class="stats-card__label">Chuyến đi</span>
                  <span class="stats-card__value" data-stat-trips>...</span>
                  <div class="stats-card__trend"><span style="color:#10b981">●</span> Hành trình đã tạo</div>
               </div>
               <div class="stats-card">
                  <span class="stats-card__label">Cộng đồng</span>
                  <span class="stats-card__value" data-stat-posts>...</span>
                  <div class="stats-card__trend"><span style="color:#f43f5e">❤️</span> <span id="data-stat-likes-total">...</span> lượt thích</div>
               </div>
               <div class="stats-card">
                  <span class="stats-card__label">Trò chuyện</span>
                  <span class="stats-card__value" data-stat-chat>...</span>
                  <div class="stats-card__trend up"><span style="font-size:10px">▲</span> AI Assistant</div>
               </div>
               <div class="stats-card">
                  <span class="stats-card__label">Điểm (EXP)</span>
                  <span class="stats-card__value" data-stat-exp>...</span>
                  <div class="stats-card__trend" data-stat-rank style="color:var(--accent); font-weight:600;">Hạng: ...</div>
               </div>
            </div>

            <div class="activity-charts-grid">
               <div class="chart-container">
                  <h4 class="chart-title">📈 Tần suất hoạt động (7 ngày)</h4>
                  <div style="flex:1; position:relative;"><canvas id="userActivityChart"></canvas></div>
               </div>
               <div class="chart-container">
                  <h4 class="chart-title">🕸️ Ma trận kỹ năng</h4>
                  <div style="flex:1; position:relative;"><canvas id="userRadarChart"></canvas></div>
               </div>
               <div class="chart-container">
                  <h4 class="chart-title">📍 Phân bổ vùng miền</h4>
                  <div style="flex:1; position:relative;"><canvas id="userRegionChart"></canvas></div>
               </div>
               <div class="chart-container">
                  <h4 class="chart-title">🍩 Xu hướng sở thích</h4>
                  <div style="flex:1; position:relative;"><canvas id="userCategoryChart"></canvas></div>
               </div>
            </div>

            <div class="extra-stats-section">
               <h4 style="margin-bottom: 1.5rem; font-family: var(--font-display); font-size: 1.25rem;">💡 Chỉ số thông minh</h4>
               <div class="extra-stats-grid">
                  <div class="extra-stat-item">
                     <span class="icon">🌱</span>
                     <div class="info">
                        <strong>Dấu chân Carbon</strong>
                        <span data-stat-carbon>Giảm 15%</span>
                     </div>
                  </div>
                  <div class="extra-stat-item">
                     <span class="icon">💰</span>
                     <div class="info">
                        <strong>Tiết kiệm chi tiêu</strong>
                        <span data-stat-savings>~1.2 Tr VNĐ</span>
                     </div>
                  </div>
                  <div class="extra-stat-item">
                     <span class="icon">⏱️</span>
                     <div class="info">
                        <strong>Thời gian hoạt động</strong>
                        <span data-stat-time>Tính toán...</span>
                     </div>
                  </div>
                  <div class="extra-stat-item">
                     <span class="icon">🎯</span>
                     <div class="info">
                        <strong>Nhiệm vụ hoàn thành</strong>
                        <span data-stat-quests>Tính toán...</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      <div class="modal" id="modal-notif-detail" data-modal="notif-detail" role="dialog" aria-modal="true" hidden>
        <div class="modal__inner" style="max-width: 500px;">
          <div class="modal__header">
            <h3 class="modal__title" id="notif-detail-title">Chi tiết thông báo</h3>
            <button type="button" class="modal__close" data-modal-close aria-label="Đóng">×</button>
          </div>
          <div class="modal__body" style="padding: 1.5rem;">
            <div id="notif-detail-body" style="font-size: 1.1rem; line-height: 1.6; color: var(--text);"></div>
            <div id="notif-detail-time" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem; opacity: 0.7;"></div>
            <div id="notif-detail-action" style="margin-top: 2rem;"></div>
          </div>
        </div>
      </div>
      </div>
      <div class="modal" id="modal-auth" data-modal="auth" hidden>
        <div class="modal__inner">
          <div class="modal__header"><h3>Tài khoản</h3><button class="modal__close" data-modal-close>×</button></div>
          <div class="modal__body"><p>Đăng nhập để tiếp tục hành trình của bạn.</p></div>
        </div>
      </div>
      <!-- Global Chatbot FAB -->
      <div class="chat-fab-wrap" id="global-chat-fab-wrap" style="display:none; z-index:9999;">
        <button type="button" class="chat-fab" id="global-chat-fab" aria-expanded="false">
          <span aria-hidden="true">💬</span>
          <span class="visually-hidden">Mở trợ lý du lịch</span>
        </button>
        <div id="global-chat-panel" class="chat-panel" hidden>
          <div class="chat-panel__head">
            <div class="chat-panel__head-left">
              <strong>Trợ lý WanderViệt</strong>
            </div>
            <div class="chat-panel__head-actions">
              <div class="chat-lang-switcher" title="Chọn ngôn ngữ" id="global-lang-switcher">
                <button type="button" class="btn-icon-sm chat-lang-btn" style="width: auto; padding: 0 8px; gap: 4px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span class="current-lang-code" id="global-lang-code" style="font-size: 0.75rem; font-weight: 800;">AUTO</span>
                </button>
                <div class="chat-lang-dropdown" id="global-lang-dropdown">
                  <button type="button" data-lang="auto">Auto (Tự nhận)</button>
                  <button type="button" data-lang="vi">Tiếng Việt (VI)</button>
                  <button type="button" data-lang="en">English (EN)</button>
                  <button type="button" data-lang="jp">日本語 (JP)</button>
                  <button type="button" data-lang="kr">한국어 (KR)</button>
                  <button type="button" data-lang="fr">Français (FR)</button>
                </div>
              </div>
              <button type="button" class="btn-icon-sm" title="Chat mới" id="global-chat-new-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button type="button" class="btn-icon-sm" title="Lịch sử chat" id="global-chat-history-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </button>
              <button type="button" class="btn-icon-sm chat-panel__expand-btn" id="global-chat-expand-btn" title="Phóng to / Thu nhỏ" aria-label="Phóng to chatbot" aria-pressed="false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
              <button type="button" class="chat-panel__close" id="global-chat-close" aria-label="Đóng chat">×</button>
            </div>
          </div>
          
          <div class="chat-panel__main-container">
            <div class="chat-sessions-sidebar" id="global-chat-sessions-view" hidden>
              <div class="chat-sessions-sidebar__inner">
                <div class="chat-sessions-sidebar__header">
                  <span>Lịch sử trò chuyện</span>
                  <button type="button" class="btn-close-sidebar" id="global-chat-history-close">×</button>
                </div>
                <div class="chat-sessions-sidebar__body" id="global-chat-sessions-list">
                  <div class="chat-sessions-loading">Đang tải lịch sử...</div>
                </div>
              </div>
            </div>

            <div class="chat-panel__center">
              <p class="chat-panel__disclaimer">Trợ lý ghép gợi ý từ dữ liệu trang + sở thích bạn lưu; không phải AI tổng quát. Visa/y tế vẫn cần nguồn chính thức.</p>
              <div class="chat-log" id="global-chat-log" role="log" aria-live="polite"></div>
              <form class="chat-form" id="global-chat-form">
                <label class="visually-hidden" for="global-chat-input">Nhập câu hỏi</label>
                <input id="global-chat-input" type="text" placeholder="Hỏi về du lịch Việt Nam…" autocomplete="off" />
                <div class="companion-fab-wrapper">
                  <div class="companion-fab" id="companion-toggle" title="Chế độ Hướng dẫn viên Chuyên gia">
                    <span class="mic-icon">🎙️</span>
                    <div class="pulse-rings"></div>
                  </div>
                </div>
                <button type="submit" class="btn btn--primary btn--small">Gửi</button>
              </form>
            </div>

            <div class="chat-panel__right-sidebar" id="global-chat-info-panel">
              <div class="chat-panel__right-inner">
                <h4>💡 Mẹo trò chuyện</h4>
                <div class="chat-tips-list">
                  <div class="chat-tip-item" onclick="document.getElementById('global-chat-input').value='Lên lịch trình 3 ngày tại Đà Nẵng'; document.getElementById('global-chat-form').dispatchEvent(new Event('submit'));">📅 Lên lịch trình 3 ngày tại Đà Nẵng</div>
                  <div class="chat-tip-item" onclick="document.getElementById('global-chat-input').value='Khách sạn gần Hồ Hoàn Kiếm'; document.getElementById('global-chat-form').dispatchEvent(new Event('submit'));">🏨 Khách sạn gần Hồ Hoàn Kiếm</div>
                  <div class="chat-tip-item" onclick="document.getElementById('global-chat-input').value='Món ngon Sài Gòn nhất định phải thử'; document.getElementById('global-chat-form').dispatchEvent(new Event('submit'));">🥘 Món ngon Sài Gòn</div>
                  <div class="chat-tip-item" onclick="document.getElementById('global-chat-input').value='Địa điểm sống ảo tại Hội An'; document.getElementById('global-chat-form').dispatchEvent(new Event('submit'));">📸 Check-in Hội An</div>
                </div>
                <hr style="opacity: 0.1; margin: 1.5rem 0;">
                <h4>🏆 Top địa danh</h4>
                <div class="chat-mini-list">
                  <div class="chat-mini-item">📍 Vịnh Hạ Long</div>
                  <div class="chat-mini-item">📍 Sa Pa</div>
                  <div class="chat-mini-item">📍 Phú Quốc</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="voice-overlay" class="voice-guide-ui">
        <div id="live-caption" class="voice-indicator">
          <div class="voice-wave">
            <div class="voice-bar"></div><div class="voice-bar"></div>
            <div class="voice-bar"></div><div class="voice-bar"></div>
            <div class="voice-bar"></div>
          </div>
          <span class="voice-text">Đang nghe...</span>
        </div>
      </div>
      <div class="modal" id="modal-settings" data-modal="settings" hidden>
        <div class="modal__inner modal__inner--wide">
          <div class="modal__header">
            <h2 id="settings-title" class="modal__title">⚙️ Cài đặt hệ thống</h2>
            <button type="button" class="modal__close" data-modal-close aria-label="Đóng">×</button>
          </div>
          <div class="modal__body settings-layout">
            <div class="settings-sidebar">
              <button class="settings-nav-btn is-active" data-settings-tab="security">🔒 Bảo mật</button>
              <button class="settings-nav-btn" data-settings-tab="appearance">🌓 Giao diện</button>
              <button class="settings-nav-btn" data-settings-tab="notifications">🔔 Thông báo</button>
              <button class="settings-nav-btn" data-settings-tab="privacy">🔐 Quyền & Riêng tư</button>
            </div>
            <div class="settings-main">
              <!-- Security Panel -->
              <div class="settings-panel is-active" data-settings-panel="security">
                <h3>Tài khoản & Bảo mật</h3>
                <form data-password-form-v2>
                  <label class="field"><span class="field-label">Mật khẩu cũ</span><input type="password" name="oldPassword" required /></label>
                  <label class="field"><span class="field-label">Mật khẩu mới</span><input type="password" name="newPassword" required minlength="6" /></label>
                  <button type="submit" class="btn btn--primary">Đổi mật khẩu</button>
                  <p data-password-status-v2 role="status" style="margin-top:0.5rem; font-size:0.9rem"></p>
                </form>
              </div>
              <!-- Appearance Panel -->
              <div class="settings-panel" data-settings-panel="appearance" hidden>
                <h3>Tùy chỉnh Giao diện</h3>
                <div class="appearance-grid">
                  <div class="theme-option" data-theme-set="light">
                    <div class="theme-preview theme-preview--light"></div>
                    <span>Sáng</span>
                  </div>
                  <div class="theme-option is-active" data-theme-set="dark">
                    <div class="theme-preview theme-preview--dark"></div>
                    <span>Tối</span>
                  </div>
                </div>
                <div style="margin-top:1.5rem">
                  <label style="display:flex; align-items:center; gap:0.75rem; cursor:pointer">
                    <input type="checkbox" id="auto-theme" style="width:20px; height:20px" />
                    <span>Tự động theo hệ điều hành</span>
                  </label>
                </div>
              </div>
              <!-- Notifications Panel -->
              <div class="settings-panel" data-settings-panel="notifications" hidden>
                <h3>Thông báo</h3>
                <div class="noti-list">
                  <label class="noti-item">
                    <div class="noti-info">
                      <strong>Email thông báo</strong>
                      <span>Nhận cập nhật về lịch trình và ưu đãi qua email.</span>
                    </div>
                    <input type="checkbox" checked />
                  </label>
                </div>
              </div>
              <!-- Privacy Panel -->
              <div class="settings-panel" data-settings-panel="privacy" hidden>
                <h3>Quyền & Riêng tư</h3>
                <div class="noti-list">
                  <label class="noti-item">
                    <div class="noti-info"><strong>Quyền Vị trí</strong><span>Tìm điểm đến gần bạn nhất.</span></div>
                    <input type="checkbox" id="perm-location" checked />
                  </label>
                  <label class="noti-item">
                    <div class="noti-info"><strong>Dữ liệu duyệt web</strong><span>Ghi nhớ phiên đăng nhập.</span></div>
                    <input type="checkbox" id="perm-storage" checked />
                  </label>
                </div>
                <div style="margin-top:2rem; padding-top:1.5rem; border-top:1px solid rgba(255,255,255,0.1);">
                  <button class="btn btn--outline btn--small" style="color:#f87171; border-color:rgba(248,113,113,0.3)">Xóa dữ liệu cục bộ</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal" id="modal-place" data-modal="place" role="dialog" aria-modal="true" hidden>
        <div class="modal__inner modal__inner--large" style="max-width:900px; padding:0;">
          <div class="modal__header" style="position:absolute; top:10px; right:10px; z-index:10; border:none; background:transparent;">
            <button class="modal__close" data-modal-close style="background:rgba(0,0,0,0.5); color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">×</button>
          </div>
          <div class="modal__body" style="padding:0; max-height:85vh; overflow-y:auto; border-radius:1rem;"><div data-place-detail></div></div>
        </div>
      </div>
      <div class="modal" id="modal-itinerary-detail" data-modal="itinerary-detail" hidden>
        <div class="modal__inner modal__inner--large">
          <div class="modal__header">
            <h3>Chi tiết lịch trình</h3>
            <button class="modal__close" data-modal-close>×</button>
          </div>
          <div class="modal__body" id="itinerary-detail-content">
            <!-- Content will be injected here -->
          </div>
        </div>
      </div>
      <div class="modal" id="modal-booking-detail" data-modal="booking-detail" hidden>
        <div class="modal__inner modal__inner--large" style="max-width:1000px;">
          <div class="modal__header">
            <h3>Chi tiết dịch vụ đã đặt</h3>
            <button class="modal__close" data-modal-close>×</button>
          </div>
          <div class="modal__body" id="booking-detail-content" style="padding:2rem; max-height:85vh; overflow-y:auto;">
            <!-- Content will be injected here -->
          </div>
        </div>
      </div>
      
      <!-- Floating Category Button - Fixed below logo -->
      <div class="floating-toc-wrapper">
        <div class="floating-toc-inner">
          <div class="floating-toc-container" id="floating-toc">
             <button type="button" class="floating-toc-btn" onclick="this.parentElement.classList.toggle('is-open')" title="Mục lục Trang chủ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>Danh mục</span>
             </button>
             <ul class="floating-toc-menu">
                <li><a href="index.html#personal-picks" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">✨ Gợi ý cho bạn</a></li>
                <li><a href="index.html#destinations" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">📍 Điểm đến</a></li>
                <li><a href="index.html#top-partners" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🤝 Đối tác</a></li>
                <li><a href="index.html#offers" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🎁 Ưu đãi</a></li>
                <li><a href="index.html#business-services" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🏨 Dịch vụ</a></li>
                <li><a href="index.html#smart-search" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🔍 Tìm kiếm thông minh</a></li>
                <li><a href="index.html#planner" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">📅 Lập kế hoạch</a></li>
                <li><a href="index.html#itineraries" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🗺️ Lộ trình</a></li>
                <li><a href="index.html#experiences" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🌟 Vì sao chọn chúng tôi</a></li>
                <li><a href="index.html#reviews" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">💬 Đánh giá</a></li>
                <li><a href="index.html#contact" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">📞 Liên hệ</a></li>
                <li style="height: 1px; background: var(--border); margin: 8px 0; opacity: 0.5;"></li>
                <li><a href="quests.html">🎯 Nhiệm vụ</a></li>
                <li><a href="history.html">⏳ Lịch sử</a></li>
                <li><a href="leaderboard.html">🏆 BXH</a></li>
             </ul>
          </div>
        </div>
      </div>
    `;
    while (div.firstChild) document.body.appendChild(div.firstChild);

    // Load Voice Helper AFTER UI is in DOM to prevent "element not found" errors
    if (!document.querySelector('script[src*="voice-helper.js"]')) {
      const script2 = document.createElement('script');
      script2.src = '/js/voice-helper.js';
      script2.onload = () => {
        if (window.WanderUI && window.WanderUI.setupVoiceIntegration) {
          window.WanderUI.setupVoiceIntegration();
        }
      };
      document.body.appendChild(script2);
    }

    // Add global listener for close buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-modal-close]') || e.target.matches('[data-modal-backdrop]')) {
        const modal = e.target.closest('[data-modal]') || document.querySelector('[data-modal]:not([hidden])');
        if (modal) closeModal(modal);
      }
    });
  }

  async function openPlaceDetail(id, localData) {
    const wrap = document.querySelector('[data-place-detail]');
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="modal-loading-placeholder animate-in" style="padding:2.5rem;">
        <div class="skeleton" style="width:40%; height:32px; border-radius:8px; margin-bottom:1.5rem;"></div>
        <div class="skeleton" style="width:100%; height:300px; border-radius:24px; margin-bottom:1.5rem;"></div>
        <div class="skeleton" style="width:90%; height:16px; border-radius:4px; margin-bottom:0.75rem;"></div>
        <div class="skeleton" style="width:70%; height:16px; border-radius:4px;"></div>
      </div>
    `;
    openModal('place');

    try {
      let p = localData;
      if (!p) {
        const res = await fetch(`/api/places/${id}?t=${Date.now()}`);
        const json = await res.json();
        if (!json.success) throw new Error('Data not found');
        p = json.data;
      }

      const heroImage = (p.images && p.images.length > 0) ? p.images[0] : (p.image || "");
      let galleryHtml = "";
      if (p.images && p.images.length > 1) {
        galleryHtml = '<div class="place-detail__gallery">' + p.images.map((img, i) =>
          `<div class="gallery-thumb${i === 0 ? ' is-active' : ''}" data-full="${img}"><img src="${img}" alt="Thumb"></div>`
        ).join("") + '</div>';
      }

      const actsHtml = (p.activities || []).map(a => {
        let color = "#38bdf8";
        if (a.dayPart.toLowerCase().includes("sáng")) color = "#fbbf24";
        if (a.dayPart.toLowerCase().includes("chiều")) color = "#f43f5e";
        if (a.dayPart.toLowerCase().includes("tối")) color = "#818cf8";
        return `
          <div class="act-row-v2">
            <div class="act-dot" style="background:${color}"></div>
            <div class="act-content">
              <strong style="color:${color}">${a.dayPart}: ${a.title}</strong>
              <p>${a.tip}</p>
            </div>
          </div>`;
      }).join("");

      const sectionsHtml = ['amusementPlaces', 'accommodations', 'diningPlaces', 'checkInSpots'].map(key => {
        if (!p[key] || !p[key].length) return '';
        const title = { amusementPlaces: '🎡 Hoạt động vui chơi', accommodations: '🛌 Nơi nghỉ ngơi', diningPlaces: '🥘 Ẩm thực đặc sắc', checkInSpots: '📸 Điểm check-in' }[key];
        const cards = p[key].map((item, idx) => `
          <div class="detail-item-card" data-category="${key}" data-idx="${idx}">
            <div class="detail-item-img"><img src="${item.image}" alt="${item.name}"></div>
            <div class="detail-item-info">
              <h4 class="detail-item-title">${item.name}</h4>
              <div class="detail-item-subtitle">⭐ ${item.rating || '4.8'} · ${item.ticketPrice || item.priceRange || 'Tham khảo'}</div>
            </div>
          </div>
        `).join('');
        return `<div class="place-detail__section"><h4 class="detail-section-title">${title}</h4><div class="detail-card-grid">${cards}</div></div>`;
      }).join('');

      const isLocalService = ['khach-san', 'nha-hang', 'tien-ich', 'giai-tri'].includes(p.kind);
      const transportHtml = (isLocalService && !p.transportTips) 
        ? `<p style="margin-bottom:8px;"><strong>📍 Địa chỉ:</strong> ${p.address || 'Liên hệ để biết vị trí chính xác'}</p>`
        : `<p style="margin-bottom:8px;"><strong>🚢 Di chuyển:</strong> ${p.transportTips || 'Bay đến sân bay gần nhất và di chuyển bằng taxi/bus.'}</p>`;

      // --- Build Elite sections ---
      const placeId = p.id || p._id || '';

      // Overview
      const overviewHtml = p.overview ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">📖 Tổng quan</h4><p style="line-height:1.7; color:var(--text-muted); font-size:0.95rem;">${p.overview}</p></div>` : '';

      // Tags
      const tagsHtml = (p.tags && p.tags.length) ? `<div style="margin-top:1rem; display:flex; flex-wrap:wrap; gap:8px;">${p.tags.map(t => `<span style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:100px; padding:4px 14px; font-size:0.8rem; color:var(--accent); font-weight:600;">#${t}</span>`).join('')}</div>` : '';

      // Quick Info grid
      const qiItems = [];
      if (p.openTime && p.closeTime) qiItems.push({icon:'🕐', label:'Giờ mở cửa', value:`${p.openTime} - ${p.closeTime}`});
      if (p.visitDuration || p.tourDuration) qiItems.push({icon:'⏱️', label:'Thời lượng', value: p.visitDuration || p.tourDuration});
      if (p.crowdLevel) qiItems.push({icon:'👥', label:'Đông đúc', value:{low:'Thấp',medium:'Trung bình',high:'Cao'}[p.crowdLevel]||p.crowdLevel});
      if (p.costLevel) qiItems.push({icon:'💰', label:'Chi phí', value:{budget:'Tiết kiệm',standard:'Trung bình',luxury:'Sang trọng'}[p.costLevel]||p.costLevel});
      if (p.suitability && p.suitability.length) qiItems.push({icon:'🎯', label:'Phù hợp', value: p.suitability.join(', ')});
      if (p.bestTimeToVisit) qiItems.push({icon:'☀️', label:'Thời điểm đẹp', value: p.bestTimeToVisit});
      if (p.bestSeason) qiItems.push({icon:'🌸', label:'Mùa đẹp nhất', value: p.bestSeason});
      if (p.internetQuality) qiItems.push({icon:'🌐', label:'Internet', value:{poor:'Kém',fair:'TB',good:'Tốt',excellent:'Rất tốt'}[p.internetQuality]||p.internetQuality});
      if (p.parking && p.parking !== 'none') qiItems.push({icon:'🅿️', label:'Đậu xe', value:{street:'Vỉa hè',lot:'Bãi đỗ',valet:'Valet'}[p.parking]||p.parking});
      if (p.accessibility && p.accessibility.wheelchairAccessible) qiItems.push({icon:'♿', label:'Hỗ trợ', value:'Có hỗ trợ xe lăn'});
      const quickInfoHtml = qiItems.length ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">ℹ️ Thông tin nhanh</h4><div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px;">${qiItems.map(q => `<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:12px; text-align:center;"><div style="font-size:1.4rem; margin-bottom:4px;">${q.icon}</div><div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">${q.label}</div><div style="font-size:0.85rem; font-weight:600; color:var(--text); margin-top:2px;">${q.value}</div></div>`).join('')}</div></div>` : '';

      // Amenities
      const amenIconMap = {'Lối đi xe lăn':'♿','Thang máy':'🛗','Bãi đậu xe':'🅿️','Thân thiện thú cưng':'🐾','Phòng không hút thuốc':'🚭','Hồ bơi':'🏊','Dịch vụ Spa':'💆','Phòng Gym':'🏋️','Buffet sáng':'🍳','Lễ tân 24/7':'🛎️','Két an toàn':'🔒','Wifi miễn phí':'🌐','Thanh toán thẻ':'💳','Camera an ninh':'🛡️','Nhà hàng & Bar':'🍷','Đưa đón sân bay':'🚐'};
      const amenitiesHtml = (p.amenities && p.amenities.length) ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">🏨 Tiện nghi</h4><div style="display:flex; flex-wrap:wrap; gap:8px;">${p.amenities.map(a => `<span style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px 14px; font-size:0.85rem; display:inline-flex; align-items:center; gap:6px;"><span>${amenIconMap[a]||'✨'}</span>${a}</span>`).join('')}</div></div>` : '';

      // Tour Itinerary
      const tourItHtml = (p.tourItinerary && p.tourItinerary.length) ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">🗓️ Lịch trình Tour${p.tourDuration ? ' ('+p.tourDuration+')' : ''}</h4>${p.tourItinerary.map(t => `<div style="display:flex; gap:12px; margin-bottom:12px;"><div style="width:8px; height:8px; border-radius:50%; background:var(--accent); margin-top:7px; flex-shrink:0;"></div><div><strong style="color:var(--accent);">Ngày ${t.day||'?'}: ${t.title||''}</strong><p style="margin:4px 0 0; color:var(--text-muted); font-size:0.9rem;">${t.detail||''}</p></div></div>`).join('')}</div>` : '';

      // Experiences
      const expHtml = (p.experiences && p.experiences.length) ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">🌟 Trải nghiệm đặc biệt</h4><div style="display:flex; flex-direction:column; gap:12px;">${p.experiences.map(e => `<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px;"><div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;"><span style="font-size:1.5rem;">${e.icon||'✨'}</span><strong style="font-size:1rem;">${e.title||''}</strong>${e.difficulty?`<span style="background:${e.difficulty==='hard'?'rgba(239,68,68,0.2)':e.difficulty==='medium'?'rgba(245,158,11,0.2)':'rgba(16,185,129,0.2)'}; color:${e.difficulty==='hard'?'#ef4444':e.difficulty==='medium'?'#f59e0b':'#10b981'}; padding:2px 10px; border-radius:100px; font-size:0.7rem; font-weight:700;">${e.difficulty}</span>`:''}</div>${e.description?`<p style="color:var(--text-muted); font-size:0.9rem; margin:0 0 8px;">${e.description}</p>`:''}<div style="display:flex; gap:16px; font-size:0.8rem; color:var(--text-muted);">${e.duration?`<span>⏱️ ${e.duration}</span>`:''}${e.priceEstimate?`<span>💰 ${Number(e.priceEstimate).toLocaleString('vi-VN')}đ</span>`:''}</div></div>`).join('')}</div></div>` : '';

      // Suggested Itineraries
      const sugItHtml = (p.suggestedItineraries && p.suggestedItineraries.length) ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">📋 Kế hoạch gợi ý</h4>${p.suggestedItineraries.map(plan => `<div style="background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.15); border-radius:16px; padding:16px; margin-bottom:12px;"><div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;"><span style="background:var(--accent); color:#fff; padding:4px 12px; border-radius:8px; font-size:0.75rem; font-weight:700;">${{couple:'💕 Cặp đôi',family:'👨‍👩‍👧 Gia đình',budget:'💰 Tiết kiệm',luxury:'✨ Sang trọng',solo:'🧘 Solo',group:'👥 Nhóm'}[plan.type]||plan.type}</span><span style="color:var(--text-muted); font-size:0.85rem;">${plan.duration||''}</span>${plan.name?`<span style="color:var(--text); font-weight:600; font-size:0.85rem;">${plan.name}</span>`:''}</div>${(plan.timeline||[]).map(s => `<div style="display:flex; gap:10px; margin-bottom:8px;"><span style="color:var(--accent); font-weight:700; font-size:0.8rem; min-width:50px;">${s.time||''}</span><div style="flex:1;"><strong style="font-size:0.85rem;">${s.activity||''}</strong>${s.location?`<div style="font-size:0.8rem; color:var(--text-muted);">📍 ${s.location}</div>`:''}${s.tips?`<div style="font-size:0.8rem; color:var(--text-muted); opacity:0.7;">💡 ${s.tips}</div>`:''}${s.description?`<div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${s.description}</div>`:''}</div></div>`).join('')}</div>`).join('')}</div>` : '';

      // FAQs
      const faqHtml = (p.faqs && p.faqs.length) ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">❓ Câu hỏi thường gặp</h4>${p.faqs.map((f,i) => `<div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:14px; margin-bottom:8px; overflow:hidden;"><button type="button" onclick="var a=this.nextElementSibling;a.style.display=a.style.display==='none'?'block':'none';this.querySelector('.fq-i').style.transform=a.style.display==='none'?'':'rotate(180deg)'" style="width:100%; padding:14px 16px; background:none; border:none; color:var(--text); font-weight:700; font-size:0.9rem; cursor:pointer; display:flex; align-items:center; gap:8px; text-align:left;"><span style="flex:1;">${f.question}</span><span class="fq-i" style="transition:transform 0.3s; font-size:0.7rem;">▼</span></button><div style="display:none; padding:0 16px 14px; color:var(--text-muted); font-size:0.9rem; line-height:1.6; border-top:1px solid rgba(255,255,255,0.05);">${f.answer||''}</div></div>`).join('')}</div>` : '';

      // Safety Tips + whatToBring + whatNotToDo
      const safetyHtml = (p.safetyTips && p.safetyTips.length) || (p.whatToBring && p.whatToBring.length) || (p.whatNotToDo && p.whatNotToDo.length) ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">⚠️ An toàn & Lời khuyên</h4>${(p.safetyTips||[]).map(t => `<div style="background:${t.severity==='high'?'rgba(239,68,68,0.1)':t.severity==='medium'?'rgba(245,158,11,0.1)':'rgba(16,185,129,0.1)'}; border:1px solid ${t.severity==='high'?'rgba(239,68,68,0.2)':t.severity==='medium'?'rgba(245,158,11,0.2)':'rgba(16,185,129,0.2)'}; border-radius:12px; padding:12px 16px; margin-bottom:8px;"><strong>${t.title||''}</strong><p style="margin:4px 0 0; color:var(--text-muted); font-size:0.85rem;">${t.description||''}</p></div>`).join('')}${(p.whatToBring&&p.whatToBring.length)?`<div style="margin-top:12px;"><strong style="font-size:0.9rem;">🎒 Nên mang theo:</strong><div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">${p.whatToBring.map(i => `<span style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:100px; padding:4px 12px; font-size:0.8rem;">${i}</span>`).join('')}</div></div>`:''}${(p.whatNotToDo&&p.whatNotToDo.length)?`<div style="margin-top:12px;"><strong style="font-size:0.9rem;">🚫 Không nên:</strong><div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">${p.whatNotToDo.map(i => `<span style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:100px; padding:4px 12px; font-size:0.8rem;">${i}</span>`).join('')}</div></div>`:''}</div>` : '';

      // Contact info
      const contactItems = [];
      if (p.contactPhone) contactItems.push(`📞 ${p.contactPhone}`);
      if (p.contactEmail) contactItems.push(`✉️ ${p.contactEmail}`);
      if (p.website) contactItems.push(`🔗 <a href="${p.website}" target="_blank" style="color:var(--accent); text-decoration:none;">${p.website}</a>`);
      const contactHtml = contactItems.length ? `<div style="margin-top:1rem; padding:1rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; display:flex; flex-wrap:wrap; gap:16px; font-size:0.9rem;">${contactItems.join(' <span style="opacity:0.3;">|</span> ')}</div>` : '';

      // Video
      const videoHtml = p.videoUrl ? `<div style="margin-top:1.5rem;"><h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text);">🎬 Video</h4><div style="border-radius:16px; overflow:hidden; aspect-ratio:16/9;">${p.videoUrl.includes('youtube.com') || p.videoUrl.includes('youtu.be') ? `<iframe src="${p.videoUrl.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/')}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>` : `<a href="${p.videoUrl}" target="_blank" style="display:flex; align-items:center; justify-content:center; height:100%; background:rgba(255,255,255,0.03); color:var(--accent); font-weight:700;">▶ Xem video</a>`}</div></div>` : '';

      wrap.innerHTML = `
        <div class="place-view-content animate-in">
          <div class="place-detail__hero"><img src="${heroImage}" id="hero-target"></div>
          ${galleryHtml}
          <div class="place-detail__info-wrap">
            <h3 class="place-detail__title-v2">${p.name}</h3>
            <p class="place-detail__meta-v2">🛡️ ${p.region} ${p.priceFrom ? `· Giá từ <strong style="color:var(--accent)">${new Intl.NumberFormat('vi-VN').format(p.priceFrom)}đ</strong>` : ''}${p.priceTo ? ` — <s style="opacity:0.5">${new Intl.NumberFormat('vi-VN').format(p.priceTo)}đ</s>` : ''}</p>
            <p class="place-detail__desc" style="line-height:1.7; color:var(--text-muted); font-size:1rem;">${p.description || p.text || 'Thông tin chi tiết về dịch vụ này đang được cập nhật.'}</p>
            ${tagsHtml}
            ${overviewHtml}

            ${p.highlights && p.highlights.length ? `
            <div style="margin-top:1.5rem;">
              <h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text); display:flex; align-items:center; gap:8px;">✨ Điểm nổi bật</h4>
              <ul style="padding-left:1.5rem; color:var(--text-muted); line-height:1.7;">
                ${p.highlights.map(h => `<li style="margin-bottom:0.5rem;">${h}</li>`).join('')}
              </ul>
            </div>` : ''}

            ${quickInfoHtml}
            ${amenitiesHtml}
            ${contactHtml}

            ${p.policy ? `
            <div style="margin-top:1.5rem;">
              <h4 style="margin-bottom:0.75rem; font-size:1.1rem; color:var(--text); display:flex; align-items:center; gap:8px;">📄 Chính sách dịch vụ</h4>
              <div style="padding:1.25rem; background:rgba(244,63,94,0.05); border:1px solid rgba(244,63,94,0.15); border-radius:16px; color:var(--text-muted); line-height:1.6; font-size:0.95rem;">
                ${p.policy.replace(/\n/g, '<br>')}
              </div>
            </div>` : ''}

            <div class="place-detail__guide" style="margin-top:1.5rem; padding:1.25rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:20px;">
               ${transportHtml}
               ${p.sourceUrl ? `<p><strong>🔗 Tham khảo:</strong> <a href="${p.sourceUrl}" target="_blank" style="color:var(--accent); text-decoration:none;">${p.sourceName || 'Website chính thức'}</a></p>` : ''}
            </div>

            ${tourItHtml}
            ${expHtml}
            ${videoHtml}
            ${sugItHtml}
            ${faqHtml}
            ${safetyHtml}
          </div>
          ${actsHtml ? `
          <div class="place-detail__activities-v2">
            <h4 class="detail-section-title">📅 Lịch trình gợi ý</h4>
            ${actsHtml}
          </div>` : ''}
          ${sectionsHtml}
          <div id="place-map" class="place-detail__map-v2"></div>
          <div class="place-detail__actions-v2" style="padding: 1.5rem 2.5rem 2.5rem; display:flex; gap:12px; flex-wrap:wrap;">
            <button type="button" class="btn btn--primary" style="flex:1; min-width:140px;" onclick="window.addStopById?addStopById('${placeId}'):null">Thêm vào lịch</button>
            <button type="button" class="btn btn--ghost btn-wish-sync" style="flex:1; min-width:140px;" onclick="window.toggleWish?toggleWish('${placeId}'):null">
              ♥ ${p.favoritesCount || 0}
            </button>
            <a href="place-detail.html?id=${placeId}" class="btn btn--ghost" style="flex:1; min-width:140px; text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:6px;">🔍 Xem đầy đủ</a>
          </div>
        </div>
        <div class="am-view-content" style="display:none;"></div>
      `;

      // Interactivity
      wrap.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.onclick = () => {
          wrap.querySelector('#hero-target').src = thumb.dataset.full;
          wrap.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('is-active'));
          thumb.classList.add('is-active');
        };
      });

      // Map — support both gpsCoordinates and legacy lat/lng
      const mapLat = (p.gpsCoordinates && p.gpsCoordinates.lat) || p.lat;
      const mapLng = (p.gpsCoordinates && p.gpsCoordinates.lng) || p.lng;
      if (window.L && mapLat && mapLng) {
        setTimeout(() => {
          const m = L.map("place-map", { scrollWheelZoom: false }).setView([mapLat, mapLng], 14);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(m);
          L.marker([mapLat, mapLng]).addTo(m);
        }, 400);
      }
    } catch (e) {
      wrap.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted);">Lỗi: ${e.message}</div>`;
    }
  }

  function openItineraryDetail(id, localPlan) {
    const contentEl = document.getElementById('itinerary-detail-content');
    if (!contentEl) return;
    openModal('itinerary-detail');

    if (localPlan) {
      // Render directly from passed data (no DB fetch needed)
      renderItineraryInModal(contentEl, localPlan);
      return;
    }

    contentEl.innerHTML = '<div style="padding:40px; text-align:center;">\u0110ang t\u1ea3i l\u1ecbch tr\u00ecnh...</div>';
    const token = localStorage.getItem('wander_token');
    fetch(`/api/planner/itinerary/${id}`, { headers: { 'x-auth-token': token || '' } })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message);
        renderItineraryInModal(contentEl, json.data);
      })
      .catch(e => {
        contentEl.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted);">\u0110\u1ecbch tr\u00ecnh n\u00e0y kh\u00f4ng t\u00ecm th\u1ea5y ho\u1eb7c \u0111\u00e3 b\u1ecb x\u00f3a.</div>`;
      });
  }

  function renderItineraryInModal(contentEl, itin) {
    const plan = itin.planJson || itin;
    const destination = itin.destination || plan.destination || 'Lịch trình';
    const days = itin.days || plan.days || '';
    const tripDate = itin.tripDate || plan.tripDate || null;
    const daysList = (plan && Array.isArray(plan.itinerary)) ? plan.itinerary : [];

    // Helper: format date VN
    function fmtDate(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
      return `${dow.replace('T', 'Thứ ').replace('CN', 'Chủ nhật')}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    // Header summary card
    const accomHtml = plan.accommodationSuggestion
      ? `<div class="meta-card"><div class="meta-icon-wrapper" style="background:rgba(2,132,199,0.1);color:#0284c7;font-size:1.2rem;">${plan.accommodationSuggestion.icon}</div><div class="meta-content"><p>${plan.accommodationSuggestion.typeLabel}</p><h4>${plan.accommodationSuggestion.nameAndCost}</h4></div></div>`
      : `<div class="meta-card"><div class="meta-icon-wrapper" style="background:rgba(2,132,199,0.1);color:#0284c7;">🏨</div><div class="meta-content"><p>Đề xuất Lưu trú</p><h4>${plan.suggestedHotel || 'Tự chọn'}</h4></div></div>`;

    let html = `
      <div class="timeline-header" style="margin-top:0.5rem;">
        <h2 style="font-size:1.8rem;color:var(--text);margin-bottom:0.5rem;line-height:1.3;">
          Lịch trình: ${destination} (${days} Ngày)
        </h2>
        ${plan.tripSummary ? `<p class="timeline-summary">${plan.tripSummary}</p>` : ''}
        <div class="timeline-meta">
          <div class="meta-card">
            <div class="meta-icon-wrapper" style="background:rgba(16,185,129,0.1);color:#10b981;">💰</div>
            <div class="meta-content">
              <p>Dự kiến Chi phí</p>
              <h4>${plan.estimatedCost || 'Đang ước tính'}</h4>
            </div>
          </div>
          ${accomHtml}
        </div>
      </div>
    `;

    if (daysList.length === 0) {
      html += '<p style="color:var(--text-muted);padding:20px 0;">Chưa có chi tiết lịch trình.</p>';
    } else {
      daysList.forEach((dayData, idx) => {
        let dateLabel = '';
        if (tripDate) {
          const baseDate = new Date(tripDate);
          if (!isNaN(baseDate.getTime())) {
            baseDate.setDate(baseDate.getDate() + idx);
            dateLabel = ' — ' + fmtDate(baseDate.toISOString().split('T')[0]);
          }
        }
        const dayNum = (dayData.day || (idx + 1)).toString().replace(/\s*\(.*\)/, '');
        html += `
          <div class="timeline-day">
            <div class="day-badge">Ngày ${dayNum}${dateLabel}</div>
            <div class="day-activities">
        `;
        (dayData.activities || []).forEach(act => {
          html += `
            <div class="activity-card">
              <div class="activity-time">${act.time || ''}</div>
              <h3 class="activity-title" style="margin-top:0.25rem;">${act.task || act.name || ''}</h3>
              <p style="color:var(--text-muted);margin-bottom:0.5rem;font-size:0.95rem;">${act.location || act.desc || ''}</p>
              <div class="activity-details" style="border-top:1px dashed var(--border);padding-top:0.5rem;">
                <span style="font-size:0.85rem;color:var(--text-muted);">Chi phí dự kiến</span>
                <span class="activity-cost">${act.cost || '0đ'}</span>
              </div>
            </div>
          `;
        });
        html += `</div></div>`;
      });
    }

    contentEl.innerHTML = html;
  }

  async function openBookingDetail(id, localBooking) {
    const contentEl = document.getElementById('booking-detail-content');
    if (!contentEl) return;
    openModal('booking-detail');
    contentEl.innerHTML = '<div style="padding:40px; text-align:center;"><div class="btn-loading" style="width:30px; height:30px; margin:0 auto 10px;"></div>Đang tải chi tiết dịch vụ...</div>';

    try {
      let b = localBooking;
      if (!b) {
        const token = localStorage.getItem('wander_token');
        const res = await fetch(`/api/bookings/${id}`, { headers: { 'x-auth-token': token } });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        b = json.data;
      }
      
      // Fetch place details to get more info (image, description, location)
      let p = {};
      try {
        const pRes = await fetch(`/api/places/${b.placeId}`);
        const pJson = await pRes.json();
        if (pJson.success) p = pJson.data;
      } catch(e) {}

      const heroImage = (p.images && p.images[0]) || p.image || '';
      const statusMap = {
        'pending': { label: 'Chờ xử lý', color: '#3b82f6', icon: '⏳' },
        'confirmed': { label: 'Đã xác nhận', color: '#10b981', icon: '✅' },
        'completed': { label: 'Hoàn thành', color: '#10b981', icon: '✨' },
        'cancelled': { label: 'Đã hủy', color: '#f43f5e', icon: '❌' }
      };
      const s = statusMap[b.status] || { label: b.status, color: 'var(--text-muted)', icon: 'ℹ️' };

      contentEl.innerHTML = `
        <div class="booking-detail-view animate-in">
          <div style="display:flex; gap:2.5rem; flex-wrap:wrap;">
            <div style="flex:1; min-width:320px;">
              ${heroImage ? `<img src="${heroImage}" style="width:100%; border-radius:24px; aspect-ratio:16/9; object-fit:cover; margin-bottom:1.5rem; box-shadow:var(--shadow-lg);">` : ''}
              <h2 style="font-size:2rem; margin-bottom:0.75rem; font-family:var(--font-display); font-weight:800; color:var(--text);">${p.name || b.placeName}</h2>
              <div style="display:flex; gap:12px; margin-bottom:1.5rem;">
                 <span style="background:rgba(56,189,248,0.1); color:var(--accent); padding:4px 12px; border-radius:8px; font-size:0.85rem; font-weight:700;">${p.region || 'Việt Nam'}</span>
                 <span style="background:rgba(16,185,129,0.1); color:#10b981; padding:4px 12px; border-radius:8px; font-size:0.85rem; font-weight:700;">${b.bookingType === 'tour' ? 'Tour du lịch' : 'Dịch vụ đối tác'}</span>
              </div>
              
              <div style="margin-bottom:2rem;">
                <h4 style="font-size:1.1rem; margin-bottom:0.75rem; color:var(--text);">Thông tin dịch vụ</h4>
                <p style="color:var(--text-muted); line-height:1.7; font-size:1rem;">${p.description || p.text || 'Thông tin chi tiết về dịch vụ này đang được cập nhật. Bạn có thể liên hệ trực tiếp với đối tác để được hỗ trợ thêm.'}</p>
                
                ${p.highlights && p.highlights.length ? `
                  <div style="margin-top:1.5rem; padding:1.25rem; background:rgba(255,255,255,0.02); border-radius:16px;">
                    <h5 style="margin-bottom:0.5rem; color:var(--accent);">✨ Điểm nổi bật</h5>
                    <ul style="padding-left:1.5rem; color:var(--text-muted); margin:0;">
                      ${p.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                ${p.policy ? `
                  <div style="margin-top:1rem; padding:1.25rem; background:rgba(244,63,94,0.05); border-radius:16px;">
                    <h5 style="margin-bottom:0.5rem; color:#f43f5e;">📄 Chính sách dịch vụ</h5>
                    <p style="color:var(--text-muted); margin:0; font-size:0.9rem;">${p.policy.replace(/\n/g, '<br>')}</p>
                  </div>
                ` : ''}
              </div>

              <div style="padding:1.5rem; background:var(--bg-elevated); border:1px solid var(--border); border-radius:20px;">
                <h4 style="margin-bottom:1rem; font-size:1rem; display:flex; align-items:center; gap:8px;">📍 Địa điểm & Liên hệ</h4>
                <div style="display:grid; gap:12px;">
                  <div style="display:flex; gap:10px;">
                    <span style="opacity:0.6;">📍</span>
                    <span style="font-size:0.95rem;"><strong>Địa chỉ:</strong> ${p.address || p.region || 'Liên hệ để biết chi tiết'}</span>
                  </div>
                  ${p.phone || p.contactPhone ? `
                  <div style="display:flex; gap:10px;">
                    <span style="opacity:0.6;">📞</span>
                    <span style="font-size:0.95rem;"><strong>Hotline:</strong> ${p.phone || p.contactPhone}</span>
                  </div>` : ''}
                  ${p.contactEmail ? `
                  <div style="display:flex; gap:10px;">
                    <span style="opacity:0.6;">✉️</span>
                    <span style="font-size:0.95rem;"><strong>Email:</strong> ${p.contactEmail}</span>
                  </div>` : ''}
                </div>
              </div>
            </div>
            
            <div style="width:380px; flex-shrink:0;">
              <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:28px; padding:2rem; box-shadow:var(--shadow-xl); position:sticky; top:0;">
                <div style="text-align:center; margin-bottom:2rem;">
                  <div style="width:64px; height:64px; background:${s.color}15; color:${s.color}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 1rem;">${s.icon}</div>
                  <h3 style="font-size:1.25rem; margin-bottom:0.25rem;">Trạng thái đơn hàng</h3>
                  <span style="color:${s.color}; font-weight:800; font-size:0.9rem; text-transform:uppercase; letter-spacing:1px;">${s.label}</span>
                </div>
                
                <div style="display:grid; gap:1.25rem; padding:1.5rem; background:rgba(255,255,255,0.02); border-radius:20px; border:1px solid rgba(255,255,255,0.05);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:var(--text-muted); font-size:0.9rem;">Mã giao dịch</span>
                    <strong style="color:var(--accent); font-family:monospace; font-size:1.1rem;">#${(b.bookingId || b._id).toString().slice(-8).toUpperCase()}</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:var(--text-muted); font-size:0.9rem;">Ngày sử dụng</span>
                    <strong style="font-size:0.95rem;">${new Date(b.useDate).toLocaleDateString('vi-VN')}</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:var(--text-muted); font-size:0.9rem;">Thời gian đặt</span>
                    <span style="font-size:0.9rem; opacity:0.8;">${new Date(b.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                  </div>
                  
                  <div style="margin-top:0.75rem; padding-top:1.25rem; border-top:2px dashed var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:1rem; font-weight:700;">Tổng thanh toán</span>
                    <span style="font-size:1.4rem; font-weight:900; color:var(--primary);">${new Intl.NumberFormat('vi-VN').format(b.totalPrice)}đ</span>
                  </div>
                </div>
                
                ${b.notes ? `
                  <div style="margin-top:1.5rem; padding:1.25rem; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); border-radius:16px; font-size:0.95rem; line-height:1.5;">
                    <strong style="color:#10b981; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                      <span style="font-size:1.1rem;">💬</span> Phản hồi từ doanh nghiệp:
                    </strong>
                    <div style="color:var(--text); font-style:italic;">"${b.notes}"</div>
                  </div>
                ` : ''}
                
                <div style="margin-top:2rem; display:grid; gap:12px;">
                  <button class="btn btn--primary" style="width:100%; justify-content:center; padding:1rem;" onclick="closeModal('booking-detail')">Đã rõ</button>
                  <p style="text-align:center; font-size:0.75rem; color:var(--text-muted); opacity:0.6;">Mọi thắc mắc vui lòng liên hệ hỗ trợ hệ thống.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

    } catch (e) {
      contentEl.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted);"><div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>Lỗi: ${e.message}</div>`;
    }
  }


  function showLeaderboard() { window.location.href = 'leaderboard.html'; }

  // ─── CSS Injection ──────────────────────────────────────────────────────────
  (function injectSharedStyles() {
    if (!document.getElementById('rank-filter-svg')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'rank-filter-svg';
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
      svg.innerHTML = `<defs><filter id="remove-black" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 2.5 2.5 2.5 0 -1.5" /></filter></defs>`;
      document.body.appendChild(svg);
    }
    if (document.getElementById('wander-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'wander-shared-styles';
    style.textContent = `
      .rank-sprite {
        width: 80px; height: 80px; background-size: contain; background-repeat: no-repeat; background-position: center;
        flex-shrink: 0; display: inline-block; position: relative;
        filter: url(#remove-black) drop-shadow(0 0 2px rgba(0,0,0,0.8));
      }
      .rank-text { font-weight: 700; font-size: 0.9rem; letter-spacing: 0.5px; color: var(--text); margin-left: 4px; }
      .rank-bronze-1, .rank-bronze-2, .rank-bronze-3 { background-image: url('assets/img/rank_bronze.png'); }
      .rank-silver-1, .rank-silver-2, .rank-silver-3 { background-image: url('assets/img/rank_silver.png'); }
      .rank-gold-1, .rank-gold-2, .rank-gold-3 { background-image: url('assets/img/rank_gold.png'); }
      .rank-platinum-1, .rank-platinum-2, .rank-platinum-3 { 
        background-image: url('assets/img/rank_platinum.png'); 
        filter: url(#remove-black) hue-rotate(-20deg) brightness(1.3) saturate(1.2) drop-shadow(0 0 5px rgba(0, 240, 255, 0.4));
      }
      .rank-diamond-1, .rank-diamond-2, .rank-diamond-3 { background-image: url('assets/img/rank_diamond.png'); }
      .rank-legendary {
        background-image: url('assets/img/rank_legendary_premium.png?v=6000');
        width: 80px; height: 80px; 
        transform: scale(1.3); transform-origin: center;
        filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.5));
      }
      .wander-toast {
        pointer-events: auto; min-width: 300px; padding: 1rem 1.25rem; border-radius: 14px;
        background: rgba(30,41,59,0.95); backdrop-filter: blur(20px); color: #f1f5f9;
        box-shadow: 0 12px 40px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
        display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        animation: wander-toast-in 0.4s cubic-bezier(0.18,0.89,0.32,1.28);
      }
      @keyframes wander-toast-in { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
      .wander-notif-drawer {
        position: fixed; top: 0; right: 0; width: 380px; height: 100vh;
        background: var(--bg-elevated, #1e293b); box-shadow: -10px 0 40px rgba(0,0,0,0.3);
        z-index: 10000; display: none; flex-direction: column;
        transform: translateX(100%); transition: transform 0.3s ease;
      }
      .wander-notif-drawer.is-open { transform: translateX(0); }
      .wander-notif-item { padding: 1rem; border-bottom: 1px solid var(--border); cursor: pointer; }
      .wander-notif-item.is-unread { background: rgba(59,130,246,0.1); }
      .btn-loading { position: relative; color: transparent !important; }
      .btn-loading::after {
        content: ""; position: absolute; width: 1.1rem; height: 1.1rem;
        top: 50%; left: 50%; margin: -0.55rem;
        border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      #header-user-rank { display: inline-flex; align-items: center; white-space: nowrap; gap: 4px; }
      #header-user-rank .rank-text { 
        max-width: 140px; overflow: hidden; text-overflow: ellipsis; 
        font-weight: 700; font-family: var(--font-display, inherit);
      }
      /* Custom Modal Sizes */
      .modal__inner--large { max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; }
      .place-detail-hero {
        height: 200px; background-size: cover; background-position: center;
        display: flex; align-items: flex-end; padding: 24px; color: #fff;
        position: relative; border-radius: 20px 20px 0 0;
      }
      .place-detail-hero::after {
        content: ""; position: absolute; inset: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
      }
      .place-detail-hero-content { position: relative; z-index: 1; }
      .place-detail-hero-content h1 { font-family: 'Outfit'; font-size: 2rem; margin: 0; }

      /* ===== Planner Timeline Styles (shared) ===== */
      @keyframes itinFadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .timeline-header {
        background: var(--bg-elevated, #1e293b);
        padding: 1.75rem 2rem; border-radius: 1.25rem;
        margin-bottom: 2rem; border-left: 5px solid #10b981;
        border-top: 1px solid var(--border);
      }
      .timeline-summary { font-size: 1.05rem; color: var(--text-muted); line-height: 1.65; margin-bottom: 1rem; }
      .timeline-meta { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; }
      .meta-card {
        flex: 1; min-width: 220px; background: var(--bg-card);
        padding: 1.25rem; border-radius: 1rem; border: 1px solid var(--border);
        display: flex; align-items: center; gap: 1.25rem;
        transition: transform 0.3s, box-shadow 0.3s;
      }
      .meta-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(31,38,135,0.1); }
      .meta-icon-wrapper {
        font-size: 2rem; width: 55px; height: 55px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 14px; flex-shrink: 0;
      }
      .meta-content p {
        font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.35rem;
        font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      }
      .meta-content h4 { font-size: 1.15rem; color: var(--text); margin: 0; line-height: 1.35; }
      .timeline-day { margin-bottom: 2.5rem; position: relative; animation: itinFadeInUp 0.6s ease-out forwards; }
      .day-badge {
        display: inline-flex; align-items: center;
        background: var(--bg-elevated, #1e293b); color: var(--text);
        padding: 0.6rem 2rem 0.6rem 1.5rem;
        border-radius: 2rem 0.5rem 2rem 0;
        font-weight: 700; font-size: 1.05rem; margin-bottom: 1.75rem;
        box-shadow: 0 8px 20px rgba(15,23,42,0.3);
        letter-spacing: 0.5px; text-transform: uppercase;
        border-left: 4px solid #10b981;
      }
      .day-activities {
        border-left: 2px dashed var(--border);
        margin-left: 1.5rem; padding-left: 2rem;
        display: flex; flex-direction: column; gap: 1.25rem;
      }
      .activity-card {
        position: relative; background: var(--bg-card);
        padding: 1.5rem; border-radius: 1rem;
        border: 1px solid var(--border);
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      }
      .activity-card:hover {
        transform: translateX(6px) translateY(-2px);
        box-shadow: 0 12px 24px -6px rgba(16,185,129,0.2);
        border-left: 4px solid #10b981;
      }
      .activity-card::before {
        content: ''; position: absolute; left: -2.4rem; top: 1.6rem;
        width: 14px; height: 14px; border-radius: 50%;
        background: var(--bg-elevated, #1e293b);
        border: 3px solid var(--border);
        transition: all 0.3s ease;
      }
      .activity-card:hover::before {
        border-color: #10b981; background: #ecfdf5;
        box-shadow: 0 0 12px rgba(16,185,129,0.6);
      }
      .activity-time {
        display: inline-flex; align-items: center;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff; font-weight: 700; font-size: 0.85rem;
        padding: 0.3rem 0.8rem; border-radius: 6px;
        margin-bottom: 0.75rem; letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(16,185,129,0.3);
      }
      .activity-title {
        font-size: 1.05rem; font-weight: 700;
        color: var(--text); margin: 0.25rem 0 0.3rem; line-height: 1.35;
      }
      .activity-details {
        display: flex; justify-content: space-between; align-items: center;
        font-size: 0.85rem; color: var(--text-muted);
        border-top: 1px dashed var(--border);
        padding-top: 0.625rem; margin-top: 0.5rem;
      }
      .activity-cost { font-weight: 700; color: #059669; font-size: 0.9rem; }

      /* Proposal Card Styles - Generation 3.0 Super Premium */
      .chat-proposal-card-premium {
        margin: 12px 0; padding: 18px; border-radius: 22px;
        background: linear-gradient(165deg, #1e293b, #0f172a);
        border: 1px solid rgba(16, 185, 129, 0.25);
        box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        animation: wander-toast-in 0.4s cubic-bezier(0.18,0.89,0.32,1.28);
        flex-shrink: 0;
        transition: transform 0.3s, border-color 0.3s;
      }
      .chat-proposal-card-premium:hover {
        transform: translateY(-4px);
        border-color: var(--accent);
      }
      .proposal-header {
        font-size: 0.65rem; font-weight: 900; text-transform: uppercase;
        color: var(--accent); letter-spacing: 1.2px; margin-bottom: 10px;
        display: flex; align-items: center; gap: 6px;
      }
      .btn-proposal-action {
        width: 100%; padding: 11px; border-radius: 12px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff; font-weight: 800; border: none; cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 0.85rem; letter-spacing: 0.3px;
        box-shadow: 0 4px 15px rgba(16,185,129,0.25);
      }
      .btn-proposal-action:hover {
        filter: brightness(1.1);
        transform: scale(1.02);
        box-shadow: 0 6px 20px rgba(16,185,129,0.4);
      }
      .btn-proposal-action:active { transform: scale(0.97); }

      /* Inline Itinerary Card in Chatbot - Premium Design */
      .chat-itinerary-card {
        margin: 10px 0; border-radius: 18px; overflow: hidden;
        border: 1px solid rgba(59,130,246,0.2);
        background: #0b1629;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        animation: wander-toast-in 0.4s ease-out;
        max-height: 600px; overflow-y: auto;
        flex-shrink: 0;
      }
      .chat-itinerary-card::-webkit-scrollbar { width: 5px; }
      .chat-itinerary-card::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.25); border-radius: 4px; }
      .chat-itin-hero {
        padding: 20px 20px 16px;
        background: radial-gradient(ellipse at top right, rgba(59,130,246,0.15), transparent),
                    linear-gradient(160deg, #0d1b35, #0b1629);
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }
      .chat-itin-dest-pill {
        display: inline-block; padding: 4px 12px;
        background: rgba(59,130,246,0.18); color: #60a5fa;
        border-radius: 30px; font-size: 0.68rem; font-weight: 900;
        letter-spacing: 1.5px; margin-bottom: 10px;
      }
      .chat-itin-hero-title { font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0 0 6px; line-height: 1.2; }
      .chat-itin-hero-sub { font-size: 0.82rem; color: #94a3b8; margin: 0 0 14px; line-height: 1.5; }
      .chat-itin-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 12px; padding-top: 14px;
        border-top: 1px solid rgba(255,255,255,0.07);
      }
      .chat-itin-stat { flex: 1; min-width: 80px; display: flex; flex-direction: column; gap: 3px; }
      .chat-itin-stat-label { font-size: 0.6rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
      .chat-itin-stat-val { font-size: 0.92rem; font-weight: 800; color: #38bdf8; }
      .chat-itin-timeline { padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 14px; }
      .chat-itin-day-block { display: flex; gap: 12px; animation: slideInUp 0.5s ease-out both; }
      .chat-itin-day-sidebar { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 2px; }
      .chat-itin-day-num {
        width: 34px; height: 34px; border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #fff; font-weight: 900; font-size: 0.9rem;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(59,130,246,0.4);
      }
      .chat-itin-day-content { flex: 1; min-width: 0; }
      .chat-itin-day-title { font-size: 0.88rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
      .chat-itin-day-sub { font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; }
      .chat-itin-acts { display: flex; flex-direction: column; gap: 6px; }
      .chat-itin-act-card {
        display: flex; gap: 10px; padding: 10px 12px;
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
        border-radius: 10px; transition: background 0.2s;
      }
      .chat-itin-act-card:hover { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.2); }
      .chat-itin-act-time { font-size: 0.7rem; font-weight: 800; color: #38bdf8; min-width: 48px; line-height: 1.4; padding-top: 1px; white-space: nowrap; }
      .chat-itin-act-info { flex: 1; }
      .chat-itin-act-name { font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 3px; }
      .chat-itin-act-loc { font-size: 0.75rem; color: #94a3b8; margin-bottom: 2px; }
      .chat-itin-act-tip { font-size: 0.72rem; color: #fbbf24; margin-top: 3px; }
      .chat-itin-act-cost { display: inline-block; margin-top: 5px; padding: 2px 8px; background: rgba(16,185,129,0.12); color: #10b981; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
      .chat-itin-actions {
        display: flex; gap: 8px; padding: 10px 16px 14px;
        border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.15);
      }
      .btn-save-itin, .btn-export-itin {
        flex: 1; padding: 10px 12px; border-radius: 10px;
        font-size: 0.83rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s;
      }
      .btn-save-itin { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
      .btn-save-itin:hover { filter: brightness(1.1); transform: translateY(-1px); }
      .btn-export-itin { background: rgba(255,255,255,0.07); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
      .btn-export-itin:hover { background: rgba(255,255,255,0.12); color: #fff; }

      /* Quick Planner Mini-Form Skip Button */
      .cqp-btn-skip {
        width: 100%; padding: 9px 12px; border-radius: 10px;
        background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15);
        color: #64748b; font-size: 0.82rem; font-weight: 600;
        cursor: pointer; margin-top: 6px; transition: all 0.2s;
      }
      .cqp-btn-skip:hover { color: #94a3b8; border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.07); }

      /* Quick Planner Mini-Form in Chatbot */
      .chat-quick-planner-form {
        margin: 10px 0; border-radius: 18px; overflow: hidden;
        border: 1px solid rgba(59,130,246,0.3);
        background: linear-gradient(160deg, #0f172a, #1e293b);
        box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        animation: wander-toast-in 0.35s cubic-bezier(0.18,0.89,0.32,1.28);
        transition: opacity 0.3s, transform 0.3s;
        flex-shrink: 0;
      }
      .cqp-header {
        display: flex; align-items: center; gap: 14px;
        padding: 16px 18px 12px; background: rgba(59,130,246,0.08);
        border-bottom: 1px solid rgba(59,130,246,0.15);
      }
      .cqp-icon { font-size: 1.8rem; width: 44px; height: 44px; background: rgba(59,130,246,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .cqp-title { font-size: 0.95rem; font-weight: 800; color: #fff; margin-bottom: 2px; }
      .cqp-sub { font-size: 0.75rem; color: #94a3b8; }
      .cqp-body { padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; }
      .cqp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .cqp-field { display: flex; flex-direction: column; gap: 5px; }
      .cqp-field label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; }
      .cqp-optional { font-weight: 400; text-transform: none; opacity: 0.7; }
      .cqp-field input, .cqp-field select, .cqp-field textarea {
        width: 100%; padding: 9px 12px;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px; color: #fff; font-size: 0.88rem; font-family: inherit;
        transition: border-color 0.2s, background 0.2s;
        box-sizing: border-box;
      }
      .cqp-field input::placeholder, .cqp-field textarea::placeholder { color: #475569; }
      .cqp-field input:focus, .cqp-field select:focus, .cqp-field textarea:focus {
        outline: none; border-color: #3b82f6;
        background: rgba(59,130,246,0.08);
        box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
      }
      .cqp-field select option { background: #1e293b; }
      .cqp-field textarea { resize: none; }
      .cqp-actions {
        padding: 12px 18px 16px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .cqp-btn-submit {
        width: 100%; padding: 12px; border: none; border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #fff; font-size: 0.9rem; font-weight: 800;
        cursor: pointer; letter-spacing: 0.3px;
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        box-shadow: 0 4px 16px rgba(59,130,246,0.35);
      }
      .cqp-btn-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(59,130,246,0.5);
        filter: brightness(1.1);
      }
      .cqp-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
      .chat-suggestion-container {
        display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;
        padding: 0 4px;
      }
      .chat-suggestion-chip {
        padding: 10px 18px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(0, 240, 255, 0.2);
        color: #e2e8f0;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
      }
      .chat-suggestion-chip:hover {
        background: rgba(0, 240, 255, 0.1);
        color: var(--accent);
        border-color: var(--accent);
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 240, 255, 0.15);
      }
      .chat-suggestion-chip:active { transform: scale(0.95); }

      .chat-highlight {
        display: block;
        background: rgba(56, 189, 248, 0.12);
        border-left: 3px solid #38bdf8;
        padding: 8px 12px;
        margin: 8px 0;
        border-radius: 8px;
        font-weight: 800;
        color: #38bdf8;
        line-height: 1.4;
      }

      .chat-discovery-card {
        min-width: 180px; max-width: 180px; border-radius: 16px;
        background: #1e293b; border: 1px solid rgba(255,255,255,0.05);
        overflow: hidden; flex-shrink: 0; transition: transform 0.2s;
        cursor: pointer;
      }
      .chat-discovery-card:hover { transform: translateY(-3px); border-color: var(--accent); }
      .chat-discovery-img { height: 100px; background-size: cover; background-position: center; }
      .chat-discovery-info { padding: 10px; }
      .chat-discovery-name { font-size: 0.85rem; font-weight: 800; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chat-discovery-loc { font-size: 0.7rem; color: #94a3b8; }

      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      /* Markdown & Content Layout Improvements */
      .chat-bubble__content { line-height: 1.6; word-break: break-word; }
      .chat-bubble__content strong { color: #38bdf8; font-weight: 800; }
      .chat-highlight-box {
        background: rgba(56, 189, 248, 0.08);
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-left: 4px solid #38bdf8;
        padding: 12px 16px;
        margin: 14px 0;
        border-radius: 12px;
        font-size: 0.85rem;
        line-height: 1.55;
        color: #f1f5f9;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .chat-highlight-tag { color: #38bdf8; font-weight: 900; margin-right: 6px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }
      .chat-list-item {
        display: block;
        margin: 6px 0;
        padding-left: 18px;
        position: relative;
        color: #cbd5e1;
        font-size: 0.88rem;
      }
      .chat-list-item::before {
        content: "•";
        position: absolute;
        left: 4px;
        color: #38bdf8;
        font-weight: 900;
        font-size: 1.1rem;
        line-height: 1;
        top: 2px;
      }
      .chat-tour-card {
        min-width: 220px; max-width: 220px; border-radius: 20px;
        background: #1e293b; border: 1px solid rgba(255,255,255,0.05);
        overflow: hidden; flex-shrink: 0; transition: all 0.3s ease; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      }
      .chat-tour-card:hover { transform: translateY(-4px); border-color: rgba(56,189,248,0.4); box-shadow: 0 15px 30px rgba(56,189,248,0.2); }
      .chat-tour-img { width: 100%; height: 130px; background-size: cover; background-position: center; position: relative; }
      .chat-tour-badge { position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #f43f5e, #e11d48); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 8px; box-shadow: 0 4px 10px rgba(244,63,94,0.3); }
      .chat-tour-info { padding: 12px; }
      .chat-tour-name { font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .chat-tour-price { color: #10b981; font-weight: 800; font-size: 0.95rem; margin-bottom: 8px; }
      .chat-tour-meta { display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; }
    `;
    document.head.appendChild(style);
  })();

  // --- Chatbot Integration (Global, for non-homepage pages) ---
  function initGlobalChatbot() {
    const fabWrap = document.getElementById('global-chat-fab-wrap');
    if (!fabWrap) return;
    fabWrap.style.display = 'block';

    const fab = document.getElementById('global-chat-fab');
    const panel = document.getElementById('global-chat-panel');
    const closeBtn = document.getElementById('global-chat-close');
    const form = document.getElementById('global-chat-form');
    const input = document.getElementById('global-chat-input');
    const log = document.getElementById('global-chat-log');

    function togglePanel() {
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      fab.setAttribute('aria-expanded', !isOpen);

      if (!isOpen) {
        // Entrance animation enhancement
        panel.style.transformOrigin = 'bottom right';
        panel.animate([
          { opacity: 0, transform: 'scale(0.8) translateY(20px) rotate(5deg)' },
          { opacity: 1, transform: 'scale(1) translateY(0) rotate(0)' }
        ], {
          duration: 400,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        });
      }

      // --- Stop AI voice when panel is closed ---
      if (isOpen && window.voiceGuide) {
          window.voiceGuide.cancelAll();
      }
    }

    fab.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', (e) => {
        // Nếu đang fullscreen, thoát fullscreen trước khi đóng
        if (panel.classList.contains('chat-panel--fullscreen')) {
          panel.classList.remove('chat-panel--fullscreen');
          fabWrap.classList.remove('is-fullscreen');
          const expandBtn = document.getElementById('global-chat-expand-btn');
          if (expandBtn) { expandBtn.textContent = '⛶'; expandBtn.setAttribute('aria-pressed', 'false'); expandBtn.title = 'Phóng to toàn màn hình'; }
        }
        togglePanel();
        if (window.voiceGuide) window.voiceGuide.cancelAll();
    });

    // --- FULLSCREEN TOGGLE ---
    const expandBtn = document.getElementById('global-chat-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Đảm bảo panel đang mở trước khi phóng to
        if (panel.hidden) {
          panel.hidden = false;
          fab.setAttribute('aria-expanded', 'true');
        }
        const isFullscreen = panel.classList.toggle('chat-panel--fullscreen');
        fabWrap.classList.toggle('is-fullscreen', isFullscreen);
        expandBtn.textContent = isFullscreen ? '⊡' : '⛶';
        expandBtn.setAttribute('aria-pressed', String(isFullscreen));
        expandBtn.title = isFullscreen ? 'Thu nhỏ' : 'Phóng to toàn màn hình';
        
        // Tự động cuộn xuống cuối khi đổi mode để không bị lệch view
        setTimeout(() => {
          log.scrollTop = log.scrollHeight;
        }, 300);
      });
    }

    // Also support external toggle buttons (like in header or hero)
    document.querySelectorAll('[data-chat-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel();
      });
    });

    // Cho phép giữ lại phiên chat để trải nghiệm liền mạch hơn
    // localStorage.removeItem('wander_current_session');
    // localStorage.removeItem('wander_shared_chat');
    let currentSessionId = null;

    // Flag: chỉ đọc to (TTS) khi user dùng giọng nói, không đọc khi gõ text
    let _lastInputWasVoice = false;

    // --- VOICE INTEGRATION ---
    function setupVoiceIntegration() {
        if (window.voiceGuide) {
            window.voiceGuide.onResultCallback = (text) => {
                const inputEl = document.getElementById('global-chat-input');
                const formEl = document.getElementById('global-chat-form');
                if (inputEl && formEl) {
                    _lastInputWasVoice = true; // Đánh dấu: input từ giọng nói → AI sẽ nói lại
                    inputEl.value = text;
                    formEl.dispatchEvent(new Event('submit'));
                }
            };

            const micBtn = document.getElementById('companion-toggle');
            if (micBtn) {
                // Single Click: Toggle or Interrupt
                micBtn.onclick = (e) => {
                    e.preventDefault();
                    if (window.voiceGuide.synth && window.voiceGuide.synth.speaking) {
                        // AI is speaking: Stop it and start listening
                        window.voiceGuide.forceInterrupt();
                    } else if (window.voiceGuide.isListening) {
                        window.voiceGuide.stop();
                    } else {
                        window.voiceGuide.start();
                    }
                };
                // Double Click: Stop Everything
                micBtn.ondblclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.voiceGuide) {
                        window.voiceGuide.cancelAll();
                    }
                };
            }
        }
    }
    // Expose for onload callback
    window.WanderUI.setupVoiceIntegration = setupVoiceIntegration;
    // Try immediate if already loaded
    setupVoiceIntegration();

    function escapeHtml(unsafe) {
      return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Helper: Cuộn xuống cuối một cách an toàn
    function scrollToBottom() {
        if (!log) return;
        setTimeout(() => { log.scrollTop = log.scrollHeight; }, 50);
        setTimeout(() => { log.scrollTop = log.scrollHeight; }, 300);
        setTimeout(() => { log.scrollTop = log.scrollHeight; }, 800);
    }

    function renderSuggestions(options = []) {
      const container = document.createElement('div');
      container.className = 'chat-suggestion-container';
      options.forEach(opt => {
        const chip = document.createElement('div');
        chip.className = 'chat-suggestion-chip';
        chip.textContent = opt.text;
        chip.onclick = () => {
          const input = document.getElementById('global-chat-input');
          const form = document.getElementById('global-chat-form');
          if (input && form) {
            input.value = opt.query || opt.text;
            form.dispatchEvent(new Event('submit'));
          }
        };
        container.appendChild(chip);
      });
      log.appendChild(container);
        scrollToBottom();
    }

    const DEFAULT_SUGGESTIONS = [
      { text: '🗺️ Lập lịch trình', query: 'Lập lịch trình du lịch cho mình' },
      { text: '🏨 Tìm chỗ ở', query: 'Tìm khách sạn hoặc homestay đẹp' },
      { text: '🍽️ Món ngon', query: 'Gợi ý các món ăn đặc sản địa phương' },
      { text: '📸 Điểm check-in', query: 'Những địa điểm chụp ảnh đẹp nhất' }
    ];

    function formatChatMarkdown(text) {
      if (!text) return '';
      let html = text;

      // 1. Xử lý "Nổi bật" block (Ưu tiên xử lý trước để tránh bị dính regex khác)
      html = html.replace(/✨ Nổi bật:([\s\S]*?)(?:\n\n|<br><br>|$)/g, (match, content) => {
          return `<div class="chat-highlight-box"><span class="chat-highlight-tag">✨ Nổi bật:</span> ${content.trim()}</div>`;
      });

      // 2. Bold: **text**
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // 3. Lists: + or - at start of line
      const lines = html.split(/\n|<br>/);
      let processedLines = lines.map(line => {
        let trimmed = line.trim();
        // Hỗ trợ cả + và - và * làm bullet point
        if (trimmed.startsWith('+ ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return `<div class="chat-list-item">${trimmed.substring(2)}</div>`;
        }
        return line;
      });
      html = processedLines.join('\n');

      // 4. Paragraph spacing
      html = html.replace(/\n\n/g, '<div style="margin-bottom:12px;"></div>');
      html = html.replace(/\n/g, '<br>');

      return html;
    }

    let lastMsgTimestamp = null;

    function appendMsg(text, role, isHtml, skipCache = false, forcedTime = null) {
      if (!text) return;

      const msgTime = forcedTime ? new Date(forcedTime) : new Date();
      
      // HIỂN THỊ DẢI PHÂN CÁCH THỜI GIAN (TIME DIVIDER)
      // Nếu là tin nhắn đầu tiên hoặc cách tin trước đó > 15 phút
      if (!lastMsgTimestamp || (msgTime - lastMsgTimestamp > 15 * 60 * 1000)) {
        const divider = document.createElement('div');
        divider.className = 'chat-time-divider';
        const isToday = msgTime.toDateString() === new Date().toDateString();
        const isYesterday = new Date(new Date().setDate(new Date().getDate()-1)).toDateString() === msgTime.toDateString();
        
        let label = '';
        if (isToday) label = 'Hôm nay';
        else if (isYesterday) label = 'Hôm qua';
        else label = msgTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        
        const timePart = msgTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        divider.innerHTML = `<span>${label}, ${timePart}</span>`;
        log.appendChild(divider);
      }
      lastMsgTimestamp = msgTime;

      let displayInfo = text;
      let proposalsData = null;
      let itineraryData = null;

      // Phát hiện dữ liệu ẩn (JSON proposals)
      if (text.includes('[ITIN_PROPOSALS:')) {
          const start = text.indexOf('[ITIN_PROPOSALS:');
          const end = text.lastIndexOf(']');
          if (start !== -1 && end !== -1) {
              const jsonStr = text.substring(start + 16, end);
              try { proposalsData = JSON.parse(jsonStr); } catch(e) {}
              displayInfo = text.substring(0, start).trim();
          }
      }
      // Phát hiện dữ liệu ẩn (JSON itinerary card)
      if (text.includes('[ITIN_CARD:')) {
          const start = text.indexOf('[ITIN_CARD:');
          const end = text.lastIndexOf(']');
          if (start !== -1 && end !== -1) {
              const jsonStr = text.substring(start + 11, end);
              try { itineraryData = JSON.parse(jsonStr); } catch(e) {}
              displayInfo = text.substring(0, start).trim();
          }
      }

      // Đã chuyển logic xử lý "Nổi bật" vào formatChatMarkdown
      displayInfo = formatChatMarkdown(displayInfo);
      isHtml = true;

      const timeStr = msgTime.getHours().toString().padStart(2, '0') + ':' + msgTime.getMinutes().toString().padStart(2, '0');

      const msgContainer = document.createElement('div');
      msgContainer.className = 'chat-message-row ' + (role === 'user' ? 'chat-message-row--user' : 'chat-message-row--bot');

      const msg = document.createElement('div');
      msg.className = 'chat-bubble chat-bubble--' + (role === 'user' ? 'user' : 'bot') + ' animate-bubble';
      
      let contentHtml = displayInfo;
      
      // Bot actions (Copy/Speak) - dùng data-attribute để tránh SyntaxError với ký tự đặc biệt
      const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      if (!window._chatMsgCache) window._chatMsgCache = {};
      window._chatMsgCache[msgId] = displayInfo;

      const botActionsHtml = role === 'bot' ? `
        <div class="chat-bubble__actions">
          <button class="btn-bubble-action btn-copy-msg" data-msg-id="${msgId}" title="Sao chép">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button class="btn-bubble-action btn-speak-msg" data-msg-id="${msgId}" title="Nghe đọc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
        </div>
      ` : '';

      msg.innerHTML = `
        <div class="chat-bubble__content">${contentHtml}</div>
        <div class="chat-bubble__footer">
          <div class="chat-bubble__time">${timeStr}</div>
          ${botActionsHtml}
        </div>
      `;

      // Gắn event handler an toàn sau khi DOM được tạo
      if (role === 'bot') {
        const copyBtn = msg.querySelector('.btn-copy-msg');
        if (copyBtn) {
          copyBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-msg-id');
            const text = (window._chatMsgCache || {})[id] || '';
            if (window.WanderUI && window.WanderUI.copyToClipboard) {
              window.WanderUI.copyToClipboard(text, this);
            }
          });
        }
        const speakBtn = msg.querySelector('.btn-speak-msg');
        if (speakBtn) {
          speakBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-msg-id');
            const text = ((window._chatMsgCache || {})[id] || '')
              .replace(/\[ITIN_PROPOSALS:.*?\]/g, '')
              .replace(/\[ITIN_CARD:.*?\]/g, '')
              .trim();
            if (window.voiceGuide) window.voiceGuide.speak(text);
          });
        }
      }
      
      // WOW: Phát hiện lịch trình trong text để mời user xem card
      const hasItin = /ngày\s*\d+|lịch trình|itinerary/i.test(displayInfo);
      if (role === 'bot' && !isHtml && hasItin) {
        const convertBtn = document.createElement('button');
        convertBtn.className = 'btn-bubble-convert';
        convertBtn.innerHTML = '✨ Xem thẻ hành trình chuyên nghiệp';
        convertBtn.style.cssText = `
          margin-top: 12px;
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        `;
        convertBtn.onclick = () => {
          convertBtn.innerHTML = '⏳ Đang khởi tạo...';
          convertBtn.disabled = true;
          // Tự động gửi câu lệnh yêu cầu AI cấu trúc hóa lịch trình này
          const destMatch = displayInfo.match(/(?:tại|đến|ở|đi)\s+([A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+(?:\s[A-ZÀ-Ỹa-zà-ỹ][a-zà-ỹ]+)*)/i);
          const dest = destMatch ? destMatch[1] : (displayInfo.includes('Tuyên Quang') ? 'Tuyên Quang' : 'điểm đến');
          const input = document.getElementById('global-chat-input');
          const form = document.getElementById('global-chat-form');
          if (input && form) {
            input.value = `Lập lịch trình chi tiết (thẻ hành trình) cho chuyến đi ${dest} dựa trên gợi ý trên của bạn.`;
            form.dispatchEvent(new Event('submit'));
          }
        };
        msg.appendChild(convertBtn);
      }
      
      msgContainer.appendChild(msg);
      log.appendChild(msgContainer);
      
      scrollToBottom();

      // Nếu có dữ liệu proposals, render các thẻ tương ứng
      if (proposalsData && Array.isArray(proposalsData)) {
          renderProposalOptions(proposalsData);
      }
      // Nếu có dữ liệu itinerary, render thẻ chi tiết
      if (itineraryData) {
          renderItineraryCard(itineraryData);
      }

      // Cache to localStorage for instant load on next page
      if (!skipCache) {
        try {
          if (!text.includes("Đang tải") && !text.includes("đang suy nghĩ")) {
            let arr = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');
            arr.push({ role, text, timestamp: msgTime.getTime() });
            if (arr.length > 50) arr = arr.slice(arr.length - 50);
            localStorage.setItem('wander_shared_chat', JSON.stringify(arr));
          }
        } catch (e) { console.warn("Cache error", e); }
      }
    }

    function loadSharedChat() {
      log.innerHTML = '';
      try {
        const arr = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');
        if (arr.length > 0) {
          arr.forEach(m => {
            appendMsg(m.text, m.role, false, true, m.timestamp); // skipCache = true, pass stored timestamp
          });
        } else if (!currentSessionId) {
          appendMsg('Xin chào! Tôi là Trợ lý WanderViệt 🌟 Hỏi tôi bất cứ điều gì về du lịch Việt Nam nhé!', 'bot');
          renderSuggestions(DEFAULT_SUGGESTIONS);
        }
      } catch (e) {
        if (!currentSessionId) appendMsg('Xin chào! Tôi là Trợ lý WanderViệt 🌟 Hỏi tôi bất cứ điều gì về du lịch Việt Nam nhé!', 'bot');
      }
    }

    function loadChatHistory(sid) {
      const token = localStorage.getItem('wander_token');
      // No longer clear log.innerHTML here to avoid flash if we already have cache
      currentSessionId = sid;
      localStorage.setItem('wander_current_session', sid);

      const historyView = document.getElementById('global-chat-sessions-view');
      if (historyView) {
        historyView.classList.remove('is-active');
        setTimeout(() => historyView.hidden = true, 300);
      }

      fetch("/api/chat/history/" + sid, {
        headers: { 'x-auth-token': token || '' }
      })
        .then(r => r.json())
        .then(json => {
          if (json.success && json.messages && json.messages.length > 0) {
            log.innerHTML = ''; // Only clear if we actually have server data to replace
            json.messages.forEach(m => {
              appendMsg(m.text, m.role === 'user' ? 'user' : 'bot', false, true, m.timestamp); // skipCache = true, pass server timestamp
            });
            // Update cache with server truth
            localStorage.setItem('wander_shared_chat', JSON.stringify(json.messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'bot',
              text: m.text,
              timestamp: new Date(m.timestamp || m.createdAt).getTime()
            }))));
          }
        })
        .catch(() => {
          log.innerHTML = '';
          appendMsg('Lỗi kết nối khi tải lịch sử.', 'bot');
        });
    }

    function loadChatSessions() {
      const token = localStorage.getItem('wander_token');
      const historyList = document.getElementById('global-chat-sessions-list');
      if (!historyList) return;

      if (!token) {
        historyList.innerHTML = '<div class="chat-sessions-loading">Vui lòng đăng nhập để xem lịch sử.</div>';
        return;
      }
      historyList.innerHTML = '<div class="chat-sessions-loading">Đang tải...</div>';
      const deviceId = localStorage.getItem('wander_device_id');
      fetch(`/api/chat/sessions?t=${Date.now()}&deviceId=${deviceId || ''}`, {
        headers: { 'x-auth-token': token }
      })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.sessions && json.sessions.length > 0) {
          historyList.innerHTML = '';
          json.sessions.forEach(s => {
            const item = document.createElement('div');
            item.className = 'chat-session-item';
            const dateStr = new Date(s.updatedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            item.innerHTML = '<div class="chat-session-item__info">' +
                               '<div class="chat-session-item__title">' + escapeHtml(s.title || 'Hội thoại du lịch') + '</div>' +
                               '<div class="chat-session-item__date">' + dateStr + '</div>' +
                             '</div>' +
                             '<button type="button" class="btn-delete-session" title="Xóa">🗑️</button>';
            
            item.onclick = () => loadChatHistory(s.sessionId);
            
            const delBtn = item.querySelector('.btn-delete-session');
            delBtn.onclick = (e) => {
              e.stopPropagation();
              if (confirm('Xóa vĩnh viễn đoạn hội thoại này?')) {
                const deviceId = localStorage.getItem('wander_device_id');
                fetch(`/api/chat/session/${s.sessionId}?deviceId=${deviceId || ''}`, {
                  method: 'DELETE',
                  headers: { 'x-auth-token': token }
                })
                .then(r => r.json())
                .then(res => {
                  if (res.success) {
                    item.remove();
                    if (currentSessionId === s.sessionId) {
                      currentSessionId = null;
                      localStorage.removeItem('wander_current_session');
                      log.innerHTML = '';
                      appendMsg('Hội thoại đã bị xóa.', 'bot');
                    }
                  }
                });
              }
            };
            historyList.appendChild(item);
          });
        } else {
          historyList.innerHTML = '<div class="chat-sessions-loading">Chưa có hội thoại nào.</div>';
        }
      })
      .catch(() => {
        historyList.innerHTML = '<div class="chat-sessions-loading">Lỗi tải lịch sử.</div>';
      });
    }

    // New Chat Button
    const newBtn = document.getElementById('global-chat-new-btn');
    if (newBtn) {
      newBtn.onclick = () => {
        currentSessionId = null;
        localStorage.removeItem('wander_current_session');
        localStorage.removeItem('wander_shared_chat');
        log.innerHTML = '';
        lastMsgTimestamp = null; // Reset divider logic
        appendMsg('Chào bạn! Tôi đã sẵn sàng cho cuộc trò chuyện mới. Mình có thể giúp gì cho chuyến đi của bạn?', 'bot');
        renderSuggestions(DEFAULT_SUGGESTIONS);
      };
    }

    // History Button
    const historyBtn = document.getElementById('global-chat-history-btn');
    const historyView = document.getElementById('global-chat-sessions-view');
    const historyClose = document.getElementById('global-chat-history-close');

    if (historyBtn && historyView) {
      historyBtn.onclick = () => {
        historyView.hidden = false;
        setTimeout(() => historyView.classList.add('is-active'), 10);
        loadChatSessions();
      };
    }
    if (historyClose && historyView) {
      historyClose.onclick = () => {
        historyView.classList.remove('is-active');
        setTimeout(() => historyView.hidden = true, 300);
      };
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;
      const wasVoice = _lastInputWasVoice; // true nếu input từ mic, false nếu gõ text
      _lastInputWasVoice = false; // Reset sau mỗi lần gửi
      appendMsg(msg, 'user');
      input.value = '';

      const typingRow = document.createElement('div');
      typingRow.className = 'chat-message-row chat-message-row--bot';
      typingRow.id = 'chat-typing-indicator';
      typingRow.innerHTML = `
        <div class="chat-bubble chat-bubble--bot animate-bubble" style="padding: 0.75rem 1.25rem;">
          <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
      `;
      log.appendChild(typingRow);
        scrollToBottom();

      try {
        let resData;
        const selectedLang = localStorage.getItem('wander_chat_lang') || 'auto';
        if (typeof window.wanderChatReply === 'function') {
           resData = await window.wanderChatReply(msg, { 
             lang: selectedLang,
             sessionId: currentSessionId
           });
        } else {
           const token = localStorage.getItem('wander_token');
           const res = await fetch('/api/chat', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
             body: JSON.stringify({ message: msg, lang: selectedLang, sessionId: currentSessionId })
           });
           resData = await res.json();
        }

        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator) log.removeChild(indicator);

        if (resData && resData.success) {
            const aiReply = resData.answer || resData.reply;
            
            // appendMsg xử lý hiển thị tin nhắn văn bản + embed [ITIN_CARD/PROPOSALS] cho lịch sử
            appendMsg(aiReply, 'bot');

            // AI TALK BACK — chỉ đọc to khi user dùng giọng nói
            if (wasVoice && window.voiceGuide && aiReply) {
                const cleanText = aiReply
                  .replace(/\[ITIN_PROPOSALS:.*?\]/gs, '')
                  .replace(/\[ITIN_CARD:.*?\]/gs, '')
                  .replace(/https?:\/\/\S+/g, '').trim();
                window.voiceGuide.speak(cleanText);
            }
            if (resData.sessionId) {
              currentSessionId = resData.sessionId;
              localStorage.setItem('wander_current_session', currentSessionId);
            }

            // Render Itinerary Card trực tiếp từ API (chỉ khi appendMsg KHÔNG tự render từ tag)
            // appendMsg đã xử lý [ITIN_CARD:] nên chỉ gọi renderItineraryCard khi không có tag trong answer
            const hasEmbedTag = aiReply && (aiReply.includes('[ITIN_CARD:') || aiReply.includes('[ITIN_PROPOSALS:'));
            if (!hasEmbedTag) {
                if (resData.action === 'show_quick_form') {
                    renderQuickPlannerForm(resData.prefill || {});
                } else if (resData.itineraryCard) {
                    renderItineraryCard(resData.itineraryCard);
                } else if (resData.proposals && Array.isArray(resData.proposals) && resData.proposals.length > 0) {
                    renderProposalOptions(resData.proposals);
                } else if (resData.proposal) {
                    renderProposalCard(resData.proposal);
                }
            }

            if (resData.discoveryPlaces && resData.discoveryPlaces.length > 0) {
                renderDiscoveryCarousel(resData.discoveryPlaces);
            }

            if (resData.suggestedTours && resData.suggestedTours.length > 0) {
                console.log("Rendering Tour Carousel with", resData.suggestedTours.length, "tours");
                renderTourCarousel(resData.suggestedTours);
            }
        } else {
            console.warn("Chatbot: API returned failure or invalid data", resData);
            const errMsg = (resData && typeof resData === 'string') ? resData : (resData?.answer || 'Trợ lý đang bận, thử lại sau nhé.');
            appendMsg(errMsg, 'bot');
        }
      } catch (err) {
        console.error("Chatbot Submit Error:", err);
        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator && log.contains(indicator)) log.removeChild(indicator);
        appendMsg('Lỗi kết nối AI. Vui lòng kiểm tra internet hoặc tải lại trang.', 'bot');
      }
    });

    function renderQuickPlannerForm(prefill) {
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-quick-planner-form';
        wrapper.innerHTML = `
            <div class="cqp-header">
                <span class="cqp-icon">📝</span>
                <div>
                    <div class="cqp-title">Lập kế hoạch chi tiết</div>
                    <div class="cqp-sub">Cung cấp các thông tin cơ bản để bắt đầu</div>
                </div>
            </div>
            <div class="cqp-body">
                <div class="cqp-field">
                    <label>📍 Điểm đến mong muốn</label>
                    <input id="cqpDest" type="text" placeholder="VD: Đà Lạt, Phú Quốc..." value="${prefill.destination || ''}" />
                </div>
                <div class="cqp-row">
                    <div class="cqp-field">
                        <label>📅 Số ngày</label>
                        <input id="cqpDays" type="number" min="1" max="30" placeholder="3" value="${prefill.days || 3}" />
                    </div>
                    <div class="cqp-field">
                        <label>📅 Ngày đi</label>
                        <input id="cqpDate" type="date" />
                    </div>
                </div>
                <div class="cqp-field">
                    <label>💰 Ngân sách dự kiến</label>
                    <select id="cqpBudget">
                        <option value="2">1M - 3M VNĐ (Tiết kiệm)</option>
                        <option value="5" selected>3M - 7M VNĐ (Tiêu chuẩn)</option>
                        <option value="10">7M - 15M VNĐ (Thoải mái)</option>
                        <option value="20">15M+ VNĐ (Cao cấp)</option>
                    </select>
                </div>
                <div class="cqp-field">
                    <label>👥 Thành viên</label>
                    <select id="cqpCompanion">
                        <option value="Solo">Solo (Một mình)</option>
                        <option value="Cặp đôi">Đi cặp đôi</option>
                        <option value="Gia đình">Gia đình</option>
                        <option value="Nhóm bạn" selected>Nhóm bạn</option>
                    </select>
                </div>
                <div class="cqp-field">
                    <label>💡 Yêu cầu thêm <span class="cqp-optional">(tùy chọn)</span></label>
                    <textarea id="cqpExtra" placeholder="VD: Tôi muốn leo núi và ăn tối lãng mạn..." rows="2"></textarea>
                </div>
            </div>
            <div class="cqp-actions">
                <button class="cqp-btn-submit" type="button">Tiếp tục — AI lên lịch ngay →</button>
                <button class="cqp-btn-skip" type="button">⚡ Bỏ qua — AI tự tạo</button>
            </div>
        `;

        wrapper.querySelector('.cqp-btn-submit').onclick = async () => {
            const dest = wrapper.querySelector('#cqpDest').value.trim();
            const days = parseInt(wrapper.querySelector('#cqpDays').value) || 3;
            const budget = parseInt(wrapper.querySelector('#cqpBudget').value) || 5;
            const companion = wrapper.querySelector('#cqpCompanion').value;
            const extra = wrapper.querySelector('#cqpExtra').value.trim();

            if (!dest) {
                wrapper.querySelector('#cqpDest').style.borderColor = '#f43f5e';
                wrapper.querySelector('#cqpDest').focus();
                return;
            }

            const submitBtn = wrapper.querySelector('.cqp-btn-submit');
            submitBtn.textContent = '⏳ AI đang lên lịch trình...';
            submitBtn.disabled = true;

            const syntheticMsg = `Lập lịch trình ${days} ngày đi ${dest}, ngân sách ${budget} triệu VNĐ, ${companion}. ${extra}`;

            try {
                const token = localStorage.getItem('wander_token');
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                    body: JSON.stringify({
                        message: syntheticMsg,
                        lang: localStorage.getItem('wander_chat_lang') || 'auto',
                        sessionId: currentSessionId
                    })
                });
                const d = await res.json();

                // Ẩn form và hiện kết quả
                wrapper.style.opacity = '0.5';
                wrapper.style.pointerEvents = 'none';

                appendMsg(d.answer || '', 'bot');
                if (d.sessionId) {
                    currentSessionId = d.sessionId;
                    localStorage.setItem('wander_current_session', currentSessionId);
                }
                if (d.itineraryCard) {
                    renderItineraryCard(d.itineraryCard);
                    wrapper.remove(); // Xóa form sau khi có lịch trình
                } else if (d.proposals) {
                    renderProposalOptions(d.proposals);
                    wrapper.remove();
                } else {
                    submitBtn.textContent = 'Tiếp tục — AI lên lịch ngay →';
                    submitBtn.disabled = false;
                    wrapper.style.opacity = '1';
                    wrapper.style.pointerEvents = 'auto';
                }
            } catch(e) {
                submitBtn.textContent = 'Tiếp tục — AI lên lịch ngay →';
                submitBtn.disabled = false;
            }
        };

        // Nút Bỏ qua
        wrapper.querySelector('.cqp-btn-skip').onclick = async () => {
            const dest = wrapper.querySelector('#cqpDest').value.trim() || (prefill.destination || 'Việt Nam');
            const skipBtn = wrapper.querySelector('.cqp-btn-skip');
            skipBtn.textContent = '⏳ AI đang tự tạo...';
            skipBtn.disabled = true;
            wrapper.querySelector('.cqp-btn-submit').disabled = true;
            const token = localStorage.getItem('wander_token');
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                    body: JSON.stringify({ message: `Lập lịch trình tùy ý 3 ngày đi ${dest}, ngân sách 5 triệu VNĐ`, lang: localStorage.getItem('wander_chat_lang') || 'auto', sessionId: currentSessionId })
                });
                const d = await res.json();
                appendMsg(d.answer || '', 'bot');
                if (d.sessionId) { currentSessionId = d.sessionId; localStorage.setItem('wander_current_session', currentSessionId); }
                if (d.itineraryCard) { renderItineraryCard(d.itineraryCard); wrapper.remove(); }
                else { skipBtn.textContent = '⚡ Bỏ qua — AI tự tạo'; skipBtn.disabled = false; wrapper.querySelector('.cqp-btn-submit').disabled = false; }
            } catch(e) { skipBtn.textContent = '⚡ Bỏ qua — AI tự tạo'; skipBtn.disabled = false; }
        };

        log.appendChild(wrapper);
          scrollToBottom();

        // Focus vào dest nếu chưa có
        if (!prefill.destination) {
            setTimeout(() => wrapper.querySelector('#cqpDest')?.focus(), 200);
        }
    }

    function renderProposalCard(proposal) {
        const card = document.createElement('div');
        card.className = 'chat-proposal-card-premium';
        card.innerHTML = `
            <div class="proposal-header">✨ Đề xuất hành trình</div>
            <div class="proposal-body">
                <h4 style="margin:0 0 4px; color:#fff;">${proposal.title || 'Hành trình ' + (proposal.destination || '')}</h4>
                <p style="margin:0; font-size:0.85rem; opacity:0.8;">${proposal.days} ngày | ${proposal.style || 'Cơ bản'}</p>
                <div class="proposal-budget" style="margin-top:8px; color:var(--accent); font-weight:700;">💰 ${proposal.budget}</div>
                <p style="margin:6px 0 0; font-size:0.75rem; color:#94a3b8; font-style:italic;">"${proposal.description || ''}"</p>
            </div>
            <button type="button" class="btn-proposal-action" style="margin-top:12px; width:100%; padding:10px; border-radius:10px; background:var(--accent); color:#000; font-weight:800; border:none; cursor:pointer; transition:all 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">Xem chi tiết & Chỉnh sửa 🚀</button>
        `;
        const btn = card.querySelector('button');
        btn.onclick = async () => {
            const isPlannerPage = window.location.pathname.includes('planner.html') && window.WanderPlanner;
            
            if (isPlannerPage) {
                // Chuyển sang UI chính nếu đang ở trang Planner
                btn.textContent = '🚀 Chuyển sang AI Trợ lý...';
                btn.disabled = true;

                // THÊM: Thoát fullscreen nếu đang mở rộng để thấy UI chính bên dưới
                if (panel.classList.contains('chat-panel--fullscreen')) {
                    panel.classList.remove('chat-panel--fullscreen');
                    fabWrap.classList.remove('is-fullscreen');
                    const expandBtn = document.getElementById('global-chat-expand-btn');
                    if (expandBtn) { expandBtn.textContent = '⛶'; expandBtn.title = 'Phóng to toàn màn hình'; }
                }

                if (typeof window.WanderPlanner.loadDraft === 'function') {
                    window.WanderPlanner.loadDraft(proposal);
                    if (typeof togglePanel === 'function') togglePanel();
                    return;
                }
            }

            // Fallback: Hiện inline trong chat
            btn.textContent = '⏳ Đang lập lịch...';
            btn.disabled = true;

            try {
                const token = localStorage.getItem('wander_token');
                const selectedLang = localStorage.getItem('wander_chat_lang') || 'vi';
                const prompt = `Lập lịch trình chi tiết ${proposal.days} ngày tại ${proposal.destination}. Phong cách: ${proposal.style}. Ngân sách: ${proposal.budget}. ${proposal.description}`;

                // Hiện typing indicator
                const typingDiv = document.createElement('div');
                typingDiv.className = 'chat-message-row chat-message-row--bot';
                typingDiv.id = 'proposal-single-typing';
                typingDiv.innerHTML = '<div class="chat-bubble chat-bubble--bot" style="padding:0.75rem 1.25rem;"><span style="opacity:0.6;font-size:0.85rem">🤔 Đang lên kế hoạch chi tiết...</span></div>';
                log.appendChild(typingDiv);
                scrollToBottom();

                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                    body: JSON.stringify({ message: prompt, lang: selectedLang, sessionId: currentSessionId })
                });
                const data = await res.json();

                // Xóa typing indicator
                const ti = document.getElementById('proposal-single-typing');
                if (ti) ti.remove();

                if (data.success) {
                    const hasTag = data.answer && data.answer.includes('[ITIN_CARD:');
                    appendMsg(data.answer || `✅ Đã lập lịch trình ${proposal.days} ngày tại ${proposal.destination}!`, 'bot');
                    if (!hasTag && data.itineraryCard) {
                        renderItineraryCard(data.itineraryCard);
                    }
                    if (data.sessionId) {
                        currentSessionId = data.sessionId;
                        localStorage.setItem('wander_current_session', currentSessionId);
                    }
                } else {
                    btn.textContent = 'Xem chi tiết & Chỉnh sửa 🚀';
                    btn.disabled = false;
                    appendMsg('Không thể tạo lịch trình. Vui lòng thử lại.', 'bot');
                }
            } catch(e) {
                btn.textContent = 'Xem chi tiết & Chỉnh sửa 🚀';
                btn.disabled = false;
                appendMsg('Lỗi kết nối. Vui lòng thử lại.', 'bot');
            }
        };
        log.appendChild(card);
          scrollToBottom();
    }

    function renderDiscoveryCarousel(places = []) {
        const container = document.createElement('div');
        container.style.cssText = `display:flex; gap:12px; margin:12px 0; overflow-x:auto; padding-bottom:10px; scroll-snap-type:x mandatory; flex-shrink: 0; min-height: 190px;`;
        container.classList.add('no-scrollbar');

        places.forEach(p => {
            const card = document.createElement('div');
            card.className = 'chat-discovery-card';
            card.style.cssText = `height: 180px; min-height: 180px; min-width: 150px; max-width: 150px; border-radius: 12px; background: #1e293b; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; flex-shrink: 0; display: flex; flex-direction: column; scroll-snap-align: start; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 5px;`;
            card.innerHTML = `
                <div class="chat-discovery-img" style="width: 100%; height: 90px; min-height: 90px; flex-shrink: 0; background-image:url('${p.image || 'assets/img/hero_nature.jpg'}'); background-size: cover; background-position: center;"></div>
                <div class="chat-discovery-info" style="padding: 10px; flex: 1; display: flex; flex-direction: column;">
                    <div class="chat-discovery-name" style="font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${p.name}</div>
                    <div class="chat-discovery-loc" style="font-size: 0.7rem; color: #94a3b8; margin-top: auto;">📍 ${p.region || 'Việt Nam'}</div>
                </div>
            `;
            card.onclick = () => {
                if (window.WanderUI && window.WanderUI.showPlaceDetail) {
                    window.WanderUI.showPlaceDetail(p.id || p.name);
                } else {
                    appendMsg(`Cho mình biết thêm về ${p.name} nhé!`, 'user');
                    document.getElementById('global-chat-input').value = `Thông tin về ${p.name}`;
                    document.getElementById('global-chat-form').dispatchEvent(new Event('submit'));
                }
            };
            container.appendChild(card);
        });
        log.appendChild(container);
          scrollToBottom();
    }

    function renderTourCarousel(tours = []) {
        const container = document.createElement('div');
        container.style.cssText = `display:flex; gap:12px; margin:15px 0; overflow-x:auto; scroll-snap-type: x mandatory; padding-bottom:10px; scrollbar-width:none; -ms-overflow-style:none; flex-shrink: 0; min-height: 260px;`;
        
        tours.forEach(t => {
            const card = document.createElement('div');
            card.className = 'chat-tour-card';
            card.style.cssText = `height: 250px; min-height: 250px; scroll-snap-align: start; flex-shrink: 0; cursor: pointer; min-width: 220px; max-width: 220px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.2);`;
            
            card.innerHTML = `
                <div class="chat-tour-img" style="width: 100%; height: 130px; min-height: 130px; flex-shrink: 0; background-image:url('${t.images?.[0] || t.image || 'assets/img/hero_nature.jpg'}'); background-size: cover; background-position: center; position: relative;">
                    <div class="chat-tour-badge" style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #f43f5e, #e11d48); color: #fff; font-size: 0.7rem; font-weight: 800; padding: 4px 8px; border-radius: 8px; box-shadow: 0 4px 10px rgba(244,63,94,0.3);">TOUR</div>
                </div>
                <div class="chat-tour-info" style="padding: 12px; flex: 1; display: flex; flex-direction: column;">
                    <div class="chat-tour-name" style="font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${t.name}</div>
                    <div class="chat-tour-price" style="color: #10b981; font-weight: 800; font-size: 0.95rem; margin-bottom: auto;">${new Intl.NumberFormat('vi-VN').format(t.priceFrom || 0)}đ</div>
                    <div class="chat-tour-meta" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-top: 8px;">
                        <span>⭐ ${t.ratingAvg || '5.0'}</span>
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; text-align: right;">📍 ${t.region || 'Việt Nam'}</span>
                    </div>
                </div>
            `;
            card.onclick = () => {
                if (window.WanderUI && window.WanderUI.showPlaceDetail) {
                    window.WanderUI.showPlaceDetail(t._id || t.id);
                } else {
                    window.location.href = `/place-detail.html?id=${t._id || t.id}`;
                }
            };
            container.appendChild(card);
        });
        
        const style = document.createElement('style');
        style.textContent = `.chat-tour-card::-webkit-scrollbar { display: none; }`;
        document.head.appendChild(style);
        
        log.appendChild(container);
        scrollToBottom();
    }

    function renderProposalOptions(proposals) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex; 
            flex-direction: column; 
            gap: 10px; 
            margin: 8px 0;
            width: 100%;
        `;
        
        proposals.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'chat-proposal-card-premium';
            card.style.cssText = `
                width: 100%;
                display: flex;
                flex-direction: column;
                background: linear-gradient(160deg, #1e293b, #0f172a);
                border: 1px solid rgba(16, 185, 129, 0.35);
                border-radius: 14px;
                padding: 14px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                transition: transform 0.2s, border-color 0.2s;
                animation: fadeInUp 0.3s ease ${idx * 0.1}s both;
            `;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <div style="font-size:0.6rem; color:var(--accent); font-weight:900; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">✨ Phương án ${idx + 1}</div>
                        <h4 style="margin:0; color:#fff; font-size: 0.95rem; font-weight:800; line-height:1.2;">${p.title}</h4>
                    </div>
                    <span style="font-size:0.9rem; color:var(--accent); font-weight:900; white-space:nowrap; margin-left:8px;">💰 ${p.budget}</span>
                </div>
                <div style="display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
                    <span style="font-size:0.65rem; background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:10px; color:#cbd5e1;">📅 ${p.days} Ngày</span>
                    <span style="font-size:0.65rem; background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:10px; color:#cbd5e1;">📍 ${p.destination || 'Việt Nam'}</span>
                    <span style="font-size:0.65rem; background:rgba(255,255,255,0.08); padding:3px 10px; border-radius:10px; color:#cbd5e1;">🎒 ${p.style}</span>
                </div>
                <p style="margin:0 0 10px; font-size: 0.78rem; color:#94a3b8; line-height: 1.5;">"${p.description}"</p>
                <button type="button" class="btn-proposal-action" style="width:100%; padding:10px; border-radius:10px; background:linear-gradient(135deg, #00f0ff, #0ea5e9); color:#000; font-weight:800; border:none; cursor:pointer; transition:all 0.2s; font-size:0.8rem; letter-spacing:0.3px;">⚡ Chọn và lên lịch chi tiết →</button>
            `;
            const btn = card.querySelector('button');
            btn.onclick = async () => {
                const isPlannerPage = window.location.pathname.includes('planner.html') && window.WanderPlanner;
                
                if (isPlannerPage) {
                    // Chuyển sang UI chính nếu đang ở trang Planner
                    btn.textContent = '🚀 Chuyển sang AI Trợ lý...';
                    btn.disabled = true;

                    // THÊM: Thoát fullscreen nếu đang mở rộng để thấy UI chính bên dưới
                    if (panel.classList.contains('chat-panel--fullscreen')) {
                        panel.classList.remove('chat-panel--fullscreen');
                        fabWrap.classList.remove('is-fullscreen');
                        const expandBtn = document.getElementById('global-chat-expand-btn');
                        if (expandBtn) { expandBtn.textContent = '⛶'; expandBtn.title = 'Phóng to toàn màn hình'; }
                    }

                    if (typeof window.WanderPlanner.loadDraft === 'function') {
                        window.WanderPlanner.loadDraft(p);
                        if (typeof togglePanel === 'function') togglePanel();
                        return;
                    }
                }

                // Fallback cho các trang khác: Hiện inline trong chat
                btn.textContent = '⏳ Đang lập lịch...';
                btn.disabled = true;

                try {
                    const token = localStorage.getItem('wander_token');
                    const selectedLang = localStorage.getItem('wander_chat_lang') || 'vi';
                    const prompt = `Lập lịch trình chi tiết ${p.days} ngày tại ${p.destination}. Phong cách: ${p.style}. Ngân sách: ${p.budget}. ${p.description}`;

                    // Hiện typing indicator
                    const typingDiv = document.createElement('div');
                    typingDiv.className = 'chat-message-row chat-message-row--bot';
                    typingDiv.id = 'proposal-typing-indicator';
                    typingDiv.innerHTML = '<div class="chat-bubble chat-bubble--bot" style="padding:0.75rem 1.25rem;"><span style="opacity:0.6;font-size:0.85rem">🤔 Đang lên kế hoạch chi tiết...</span></div>';
                    log.appendChild(typingDiv);
                      scrollToBottom();

                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                        body: JSON.stringify({ message: prompt, lang: selectedLang, sessionId: currentSessionId })
                    });
                    const data = await res.json();

                    // Xóa typing indicator
                    const ti = document.getElementById('proposal-typing-indicator');
                    if (ti) ti.remove();

                    if (data.success) {
                        // appendMsg sẽ tự parse [ITIN_CARD:] và gọi renderItineraryCard nếu có tag
                        const hasTag = data.answer && data.answer.includes('[ITIN_CARD:');
                        appendMsg(data.answer || `✅ Đã lập lịch trình ${p.days} ngày tại ${p.destination}!`, 'bot');
                        // Chỉ gọi renderItineraryCard thủ công nếu answer KHÔNG có tag nhúng
                        if (!hasTag && data.itineraryCard) {
                            renderItineraryCard(data.itineraryCard);
                        }
                        if (data.sessionId) {
                            currentSessionId = data.sessionId;
                            localStorage.setItem('wander_current_session', currentSessionId);
                        }
                    } else {
                        btn.textContent = 'Chọn hành trình này →';
                        btn.disabled = false;
                        appendMsg('Không thể tạo lịch trình. Vui lòng thử lại.', 'bot');
                    }
                } catch(e) {
                    btn.textContent = 'Chọn hành trình này →';
                    btn.disabled = false;
                    appendMsg('Lỗi kết nối. Vui lòng thử lại.', 'bot');
                }
            };
            container.appendChild(card);
        });

        log.appendChild(container);
          scrollToBottom();
    }

    function renderItineraryCard(itin) {
        const card = document.createElement('div');
        card.className = 'chat-itinerary-card';

        // Stats grid
        const statsHtml = `
            <div class="chat-itin-stats">
                <div class="chat-itin-stat"><div class="chat-itin-stat-label">THỜI GIAN</div><div class="chat-itin-stat-val">${itin.days || ''} Ngày</div></div>
                <div class="chat-itin-stat"><div class="chat-itin-stat-label">DỰ KIẼN CHI PHÍ</div><div class="chat-itin-stat-val">${itin.estimatedCost || 'Đang ước tính'}</div></div>
                ${itin.transport ? `<div class="chat-itin-stat"><div class="chat-itin-stat-label">PHƯƠNG TIỆN</div><div class="chat-itin-stat-val">${itin.transport}</div></div>` : ''}
            </div>
        `;

        // Days timeline
        const daysHtml = (itin.itinerary || []).map((day, idx) => {
            const actsHtml = (day.activities || []).map(act => {
                // Format time range (08:00 → 08:00 - 10:00 if start/end exist)
                const timeLabel = act.timeEnd ? `${act.time} - ${act.timeEnd}` : (act.time || '');
                return `
                <div class="chat-itin-act-card">
                    <div class="chat-itin-act-time">${timeLabel}</div>
                    <div class="chat-itin-act-info">
                        <div class="chat-itin-act-name">${act.task || act.name || ''}</div>
                        ${act.location ? `<div class="chat-itin-act-loc">📍 ${act.location}</div>` : ''}
                        ${act.tip ? `<div class="chat-itin-act-tip">💡 ${act.tip}</div>` : ''}
                        ${act.cost ? `<span class="chat-itin-act-cost">🟢 ${act.cost}</span>` : ''}
                    </div>
                </div>`;
            }).join('');

            return `
            <div class="chat-itin-day-block" style="animation-delay:${idx * 0.1}s">
                <div class="chat-itin-day-sidebar">
                    <div class="chat-itin-day-num">${day.day}</div>
                </div>
                <div class="chat-itin-day-content">
                    <div class="chat-itin-day-title">Ngày ${day.day}${day.title ? ` (${day.title})` : ''}</div>
                    ${day.subtitle ? `<div class="chat-itin-day-sub">${day.subtitle}</div>` : ''}
                    <div class="chat-itin-acts">${actsHtml}</div>
                </div>
            </div>`;
        }).join('');

        card.innerHTML = `
            <div class="chat-itin-hero">
                <div class="chat-itin-dest-pill">📍 ${(itin.destination || '').toUpperCase()}</div>
                <h3 class="chat-itin-hero-title">Hành trình khám phá ${itin.days || ''} ngày</h3>
                ${itin.tripSummary ? `<p class="chat-itin-hero-sub">${itin.tripSummary}</p>` : ''}
                ${statsHtml}
            </div>
            <div class="chat-itin-timeline">${daysHtml}</div>
            <div class="chat-itin-actions">
                <button class="btn-save-itin" type="button">💾 Lưu lịch trình này</button>
                <button class="btn-export-itin" type="button">📋 Sao chép</button>
            </div>
        `;

        // ĐỒNG BỘ VỚI TRANG PLANNER (Nếu đang mở planner.html)
        if (window.location.pathname.includes('planner.html') && window.WanderPlanner) {
            const placeholder = document.getElementById('resultPlaceholder');
            const resultContainer = document.getElementById('timelineResult');
            const refineBox = document.getElementById('refineBox');
            
            if (placeholder) placeholder.style.display = 'none';
            if (resultContainer) resultContainer.style.display = 'block';
            if (refineBox) refineBox.style.display = 'block';

            // Cập nhật dữ liệu vào WanderPlanner để đồng bộ tab history/refine
            if (typeof window.WanderPlanner.renderItinerary === 'function') {
                window.WanderPlanner.renderItinerary(itin, itin.destination || 'Điểm đến', itin.days || 3, '');
            }
        }

        // Nút Lưu
        card.querySelector('.btn-save-itin').onclick = async () => {
            const token = localStorage.getItem('wander_token');
            if (!token) { if (window.WanderUI) WanderUI.showToast('Đăng nhập để lưu lịch trình nhé!', 'warning'); return; }
            const btn = card.querySelector('.btn-save-itin');
            btn.textContent = '⏳ Đang lưu...';
            btn.disabled = true;
            try {
                const res = await fetch('/api/planner/save', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify({ planJson: itin, destination: itin.destination, days: itin.days }) });
                const d = await res.json();
                if (d.success) { btn.textContent = '✅ Đã lưu!'; if (window.WanderUI) WanderUI.showToast('Lịch trình đã lưu vào My Trips!', 'success'); }
                else { btn.textContent = '💾 Lưu lịch trình'; btn.disabled = false; }
            } catch(e) { btn.textContent = '💾 Lưu lịch trình'; btn.disabled = false; }
        };

        // Nút Sao chép
        card.querySelector('.btn-export-itin').onclick = () => {
            let text = `📍 Lịch trình ${itin.destination} - ${itin.days} ngày\n💰 ${itin.estimatedCost}\n\n`;
            (itin.itinerary || []).forEach(day => {
                text += `=== Ngày ${day.day}: ${day.title || ''} ===\n`;
                (day.activities || []).forEach(act => { text += `  ${act.time || ''} - ${act.task || act.name || ''} (${act.location || ''})\n`; });
                text += '\n';
            });
            navigator.clipboard?.writeText(text).then(() => { if (window.WanderUI) WanderUI.showToast('Đã sao chép lịch trình!', 'success'); });
        };

        log.appendChild(card);
          scrollToBottom();
    }

    // Welcome message or resume session
    setTimeout(() => {
      loadSharedChat(); // Load instantly from cache
      if (currentSessionId) {
        loadChatHistory(currentSessionId); // Sync with server in background
      }
    }, 100);

    // Cross-tab Synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === 'wander_shared_chat') {
        loadSharedChat();
      }
      if (e.key === 'wander_current_session') {
        currentSessionId = e.newValue;
      }
    });

    // Language Switcher Logic
    const langBtn = document.querySelector('#global-lang-switcher .chat-lang-btn');
    const langDropdown = document.getElementById('global-lang-dropdown');
    const langCode = document.getElementById('global-lang-code');
    const savedLang = localStorage.getItem('wander_chat_lang') || 'auto';

    if (langCode) langCode.textContent = savedLang.toUpperCase();

    if (langBtn && langDropdown) {
      langBtn.onclick = (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('is-active');
      };

      langDropdown.querySelectorAll('button').forEach(btn => {
        btn.onclick = function () {
          const lang = this.getAttribute('data-lang');
          localStorage.setItem('wander_chat_lang', lang);
          if (langCode) langCode.textContent = lang.toUpperCase();

          const placeholders = {
            'auto': 'Hỏi về du lịch Việt Nam…',
            'vi': 'Hỏi về du lịch Việt Nam…',
            'en': 'Ask about Vietnam tourism…',
            'jp': 'ベトナム観光について聞く…',
            'kr': '베트남 관광에 대해 hỏi…',
            'fr': 'Posez des questions sur le tourisme au Vietnam…'
          };
          input.placeholder = placeholders[lang] || placeholders['vi'];
          langDropdown.classList.remove('is-active');

          const confirmMsg = {
            'auto': 'Đã chuyển sang tự nhận diện ngôn ngữ.',
            'vi': 'Đã chuyển sang Tiếng Việt.',
            'en': 'Switched to English.',
            'jp': '日本語に切り替えました。',
            'kr': '한국어로 전환되었습니다.',
            'fr': 'Passé en français.'
          };
          appendMsg(confirmMsg[lang] || confirmMsg['vi'], 'bot');
        };
      });

      document.addEventListener('click', () => {
        langDropdown.classList.remove('is-active');
      });
    }

    // Expose internal functions for voice-helper.js and chat-brain.js
    window.WanderChat = {
      appendMsg: appendMsg,
      togglePanel: togglePanel,
      renderProposalCard: renderProposalCard,
      renderProposalOptions: renderProposalOptions,
      renderItineraryCard: renderItineraryCard,
      renderDiscoveryCarousel: renderDiscoveryCarousel,
      renderTourCarousel: renderTourCarousel,
      sendMessage: async (text) => {
        if (!text) return;
        
        // Trigger the form submission logic synthetically
        const form = document.getElementById('global-chat-form');
        const input = document.getElementById('global-chat-input');
        if (input) input.value = text;
        if (form) form.dispatchEvent(new Event('submit'));
      }
    };
    // Compatibility alias for chat-brain.js
    window.displayAIMessage = (data) => {
      if (typeof data === 'string') {
        appendMsg(data, 'bot');
      } else if (data && data.answer) {
        appendMsg(data.answer, 'bot');
        if (data.proposal) renderProposalCard(data.proposal);
        if (data.itineraryCard) renderItineraryCard(data.itineraryCard);
        if (data.proposals) renderProposalOptions(data.proposals);
        if (data.discoveryPlaces) renderDiscoveryCarousel(data.discoveryPlaces);
        if (data.suggestedTours) renderTourCarousel(data.suggestedTours);
      }
    };
  }


  /* --- GLOBAL ACTIVITY STATS LOGIC --- */
  var chartInstances = {};

  function initStats() {
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => runInitStats();
      document.head.appendChild(script);
    } else {
      runInitStats();
    }
  }

  function runInitStats() {
    const ctxIds = ['userActivityChart', 'userRadarChart', 'userRegionChart', 'userCategoryChart'];
    const contexts = ctxIds.map(id => document.getElementById(id));
    if (contexts.some(ctx => !ctx)) return;

    Object.values(chartInstances).forEach(i => i && i.destroy());

    const token = localStorage.getItem('wander_token');
    if (!token) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Hiển thị loading state
    document.querySelectorAll('[data-stat-trips], [data-stat-favs], [data-stat-chat], [data-stat-exp]').forEach(el => {
      el.textContent = '...';
    });

     fetch('/api/auth/user/stats', {
      headers: { 'x-auth-token': token }
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;

        let s = data.summary;
        let c = data.charts;

        // Cập nhật summary
        const updateVal = (sel, val) => { const el = document.querySelector(sel); if(el) el.textContent = val; };
        updateVal('[data-stat-trips]', s.trips);
        updateVal('[data-stat-favs]', s.favorites);
        updateVal('[data-stat-chat]', s.messages);
        updateVal('[data-stat-posts]', s.posts);
        updateVal('#data-stat-likes-total', s.likes);
        updateVal('[data-stat-friends]', s.friends);
        updateVal('[data-stat-exp]', (s.exp || 0).toLocaleString());
        updateVal('[data-stat-rank]', 'Hạng: ' + s.rank);

        // 1. Hoạt động (Line Chart)
        const activityCtx = contexts[0].getContext('2d');
        const actGradient = activityCtx.createLinearGradient(0, 0, 0, 300);
        actGradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        actGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

        chartInstances.line = new Chart(contexts[0], {
          type: 'line',
          data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [{
              label: 'Hoạt động',
              data: c.activity && c.activity.length ? c.activity : [0,0,0,0,0,0,0],
              borderColor: '#38bdf8',
              borderWidth: 4,
              fill: true,
              backgroundColor: actGradient,
              tension: 0.4,
              pointRadius: 6,
              pointBackgroundColor: '#fff',
              pointBorderColor: '#38bdf8',
              pointBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor, font: { weight: '600' } } },
              y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
            }
          }
        });

        // 2. Kỹ năng (Radar Chart)
        chartInstances.radar = new Chart(contexts[1], {
          type: 'radar',
          data: {
            labels: ['Khám phá', 'Kỹ năng', 'AI', 'Cộng đồng', 'Bền bỉ', 'Sở thích'],
            datasets: [{
              data: c.radar && c.radar.length ? c.radar : [50, 50, 50, 50, 50, 50],
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              borderColor: '#f43f5e',
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#f43f5e'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 15 },
            plugins: { legend: { display: false } },
            scales: {
              r: {
                grid: { color: gridColor },
                angleLines: { color: gridColor },
                pointLabels: { color: textColor, font: { size: 12, weight: '700' } },
                ticks: { display: false },
                suggestedMin: 0, suggestedMax: 100
              }
            }
          }
        });

        // 3. Vùng miền (Bar Chart)
        const regions = Object.keys(c.regions || {});
        const regionValues = Object.values(c.regions || {});
        chartInstances.region = new Chart(contexts[2], {
          type: 'bar',
          data: {
            labels: regions.length ? regions : ['Chưa có'],
            datasets: [{
              data: regionValues.length ? regionValues : [0],
              backgroundColor: ['#38bdf8', '#8b5cf6', '#f43f5e', '#10b981', '#fbbf24', '#f97316'],
              borderRadius: 12
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor, font: { weight: '600' } } },
              y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
            }
          }
        });

        // 4. Sở thích (Doughnut Chart)
        const interests = c.interests && c.interests.length ? c.interests.slice(0, 5) : ['Trống'];
        chartInstances.cat = new Chart(contexts[3], {
          type: 'doughnut',
          data: {
            labels: interests,
            datasets: [{
              data: interests.length ? interests.map((_, i) => 20 - i * 3) : [1],
              backgroundColor: ['#38bdf8', '#8b5cf6', '#fbbf24', '#f43f5e', '#10b981'],
              borderWidth: 0,
              hoverOffset: 20
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 10 },
            plugins: { 
               legend: { 
                  position: 'right', 
                  labels: { 
                    color: textColor, 
                    boxWidth: 12, 
                    padding: 12, 
                    font: { size: 11, weight: '600' } 
                  } 
               } 
            },
            cutout: '70%'
          }
        });

      }).catch(err => {
        console.error('Lỗi tải thống kê:', err);
        document.querySelectorAll('[data-stat-trips], [data-stat-favs], [data-stat-chat], [data-stat-exp]').forEach(el => {
          el.textContent = 'Err';
        });
      });
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('wander_session') || '{}');
    } catch (e) {
      return {};
    }
  }

  document.addEventListener('click', e => {
    // 1. Stats Modal
    const btnStats = e.target.closest('[data-open-activity]');
    if (btnStats) {
      const sess = getSession();
      if (!sess || !sess.email) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập để xem thống kê.", "info");
        openModal('auth');
        return;
      }
      openModal('activity-stats');
      if (window.initUserActivityCharts) setTimeout(window.initUserActivityCharts, 100);
      else if (typeof initStats === 'function') setTimeout(initStats, 100);
      toggleUserMenu(false);
      return;
    }

    // 2. Profile / Settings Modal
    const btnProfile = e.target.closest('[data-open-profile]');
    if (btnProfile) {
      toggleUserMenu(false);
      if (window.location.pathname.includes('profile.html')) {
        if (window.UserProfile && typeof window.UserProfile.toggleEditMode === 'function') {
          window.UserProfile.toggleEditMode(true);
          return;
        }
      }
      window.location.href = 'profile.html?edit=true';
      return;
    }

    const btnSettings = e.target.closest('[data-open-settings]');
    if (btnSettings) {
      toggleUserMenu(false);
      const sess = getSession();
      const isAuth = sess && sess.email;

      // Modal is assumed to be in index.html or injected
      const settingsModal = document.getElementById('modal-settings');
      if (settingsModal) {
        const appearanceTab = document.querySelector('[data-settings-tab="appearance"]');
        const securityTab = document.querySelector('[data-settings-tab="security"]');

        if (!isAuth && appearanceTab) appearanceTab.click();
        else if (securityTab) securityTab.click();

        // Populate profile data if auth
        if (isAuth) {
          const f = document.querySelector("[data-profile-form-v2]");
          if (f) {
            // Try to get profile from local or window (fallback to main.js globals)
            const p = (window.WanderUI_getProfile ? window.WanderUI_getProfile() : (window.getProfile ? window.getProfile() : {}));
            if (f.elements.displayName) f.elements.displayName.value = p.displayName || p.name || "";
            if (f.elements.notes) f.elements.notes.value = p.notes || "";
            if (f.elements.phone) f.elements.phone.value = p.phone || "";
            const avatarPreview = document.querySelector('[data-avatar-preview-img]');
            const avatarInitial = document.querySelector('[data-avatar-preview-initial]');
            if (avatarPreview && p.avatar) {
              avatarPreview.src = p.avatar;
              avatarPreview.hidden = false;
              if (avatarInitial) avatarInitial.style.display = 'none';
            } else if (avatarInitial) {
              avatarInitial.style.display = 'flex';
              if (avatarPreview) avatarPreview.hidden = true;
            }
          }
        }

        openModal('settings');
      } else {
        // Fallback for pages without standard settings modal yet
        if (typeof showToast === 'function') showToast("Tính năng cài đặt đang được đồng bộ...", "info");
      }
      return;
    }

    // 3. Settings Tab Switching (Global)
    const settingsTab = e.target.closest('[data-settings-tab]');
    if (settingsTab) {
      const target = settingsTab.getAttribute('data-settings-tab');
      document.querySelectorAll('[data-settings-tab]').forEach(t => t.classList.remove('is-active'));
      document.querySelectorAll('[data-settings-panel]').forEach(p => {
        p.hidden = true;
        p.classList.remove('is-active');
      });
      settingsTab.classList.add('is-active');
      const activePanel = document.querySelector(`[data-settings-panel="${target}"]`);
      if (activePanel) {
        activePanel.hidden = false;
        activePanel.classList.add('is-active');
      }
      return;
    }

    // 4. Theme Selection
    const themeOpt = e.target.closest('[data-theme-set]');
    if (themeOpt) {
      const theme = themeOpt.getAttribute('data-theme-set');
      setTheme(theme, true);
      document.querySelectorAll('[data-theme-set]').forEach(opt => opt.classList.remove('is-active'));
      themeOpt.classList.add('is-active');
      const autoThemeCheck = document.getElementById('auto-theme');
      if (autoThemeCheck) autoThemeCheck.checked = false;
      return;
    }

    // 5. Logout
    if (e.target.closest('[data-logout-btn], [data-logout]')) {
      forceLogout();
      return;
    }

    // 6. User Dropdown Toggle
    const btnToggle = e.target.closest('[data-user-toggle]');
    if (btnToggle) {
      e.stopPropagation();
      const dd = document.querySelector('[data-user-dropdown]');
      const isOpen = dd && !dd.hidden && dd.style.display !== 'none';
      toggleUserMenu(!isOpen);
      return;
    }

    // 7. Close Dropdown on outside click
    const bubble = document.querySelector('[data-user-toggle]');
    if (bubble && !bubble.contains(e.target)) {
      toggleUserMenu(false);
    }
  });

  // --- Settings Form Handlers ---
  function initSettingsHandlers() {
    // Password Form
    const pwdForm = document.querySelector('[data-password-form-v2]');
    if (pwdForm) {
      pwdForm.onsubmit = async (e) => {
        e.preventDefault();
        const status = document.querySelector('[data-password-status-v2]');
        const btn = pwdForm.querySelector('button[type="submit"]');
        const fd = new FormData(pwdForm);
        const data = Object.fromEntries(fd.entries());

        setButtonLoading(btn, true);
        if (status) status.textContent = "";

        try {
          const token = localStorage.getItem('wander_token');
          const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify(data)
          });
          const json = await res.json();
          if (json.success) {
            showToast("Đổi mật khẩu thành công!", "success");
            pwdForm.reset();
          } else {
            if (status) {
              status.style.color = "var(--danger)";
              status.textContent = json.message || "Lỗi đổi mật khẩu";
            }
          }
        } catch (err) {
          showToast("Lỗi kết nối máy chủ", "error");
        } finally {
          setButtonLoading(btn, false);
        }
      };
    }

    // Auto Theme Checkbox
    const autoTheme = document.getElementById('auto-theme');
    if (autoTheme) {
      autoTheme.onchange = function () {
        if (this.checked) {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(isDark ? 'dark' : 'light', true);
          document.querySelectorAll('[data-theme-set]').forEach(opt => {
            opt.classList.toggle('is-active', opt.dataset.themeSet === (isDark ? 'dark' : 'light'));
          });
        }
      };
    }

    // Profile Form V2 (if exists in settings)
    const profileForm = document.querySelector('[data-profile-form-v2]');
    if (profileForm) {
      profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = profileForm.querySelector('button[type="submit"]');
        const fd = new FormData(profileForm);
        const data = Object.fromEntries(fd.entries());

        setButtonLoading(btn, true);
        try {
          const token = localStorage.getItem('wander_token');
          const res = await fetch('/api/auth/user/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify(data)
          });
          const json = await res.json();
          if (json.success) {
            showToast("Cập nhật thông tin thành công!", "success");
            syncAuthUI(); // Refresh header
          } else {
            showToast(json.message || "Lỗi cập nhật", "error");
          }
        } catch (err) {
          showToast("Lỗi kết nối máy chủ", "error");
        } finally {
          setButtonLoading(btn, false);
        }
      };
    }
  }

  // --- Modal Utilities ---
  function openAuthModal(tab = 'login') {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    const backdrop = document.querySelector('[data-modal-backdrop]');
    if (backdrop) backdrop.hidden = false;

    // Switch to tab
    const tabs = document.querySelectorAll('[data-auth-tab]');
    tabs.forEach(t => {
      const active = t.dataset.authTab === tab;
      t.classList.toggle('is-active', active);
    });
    const panels = document.querySelectorAll('[data-auth-panel]');
    panels.forEach(p => p.hidden = p.dataset.authPanel !== tab);
  }

  function confirm(title, message) {
    return new Promise((resolve) => {
      const modalHtml = `
        <div id="temp-confirm-modal" class="modal" style="z-index: 11000;">
          <div class="modal__inner" style="max-width: 400px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            <div class="modal__header">
              <h3 class="modal__title">${title}</h3>
            </div>
            <div class="modal__body">
              <p style="color: var(--text-muted); line-height: 1.6;">${message}</p>
            </div>
            <div style="padding: 0 1.75rem 1.75rem; display: flex; gap: 10px;">
              <button class="btn btn--outline flex-1" id="confirm-cancel">Hủy</button>
              <button class="btn btn--danger flex-1" id="confirm-ok">Đồng ý</button>
            </div>
          </div>
        </div>
      `;
      const div = document.createElement('div');
      div.innerHTML = modalHtml;
      document.body.appendChild(div);

      const modal = document.getElementById('temp-confirm-modal');
      const backdrop = document.querySelector('[data-modal-backdrop]');
      if (backdrop) backdrop.hidden = false;
      modal.hidden = false;

      document.getElementById('confirm-cancel').onclick = () => {
        modal.remove();
        if (backdrop) backdrop.hidden = true;
        resolve(false);
      };
      document.getElementById('confirm-ok').onclick = () => {
        modal.remove();
        if (backdrop) backdrop.hidden = true;
        resolve(true);
      };
    });
  }

  // Big-Tech: Robust JWT decoding for UTF-8 support
  function decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.warn("JWT Decode failed:", e);
      return null;
    }
  }

  // --- Init ---
  const initAll = () => {
    if (window.WanderUI_Initialized) return;
    window.WanderUI_Initialized = true;
    
    injectHeader();
    injectCommonComponents();
    initNavigation();
    updateNotificationBadge();

    // Hash-based modal opening (e.g. #auth)
    const handleHashModal = () => {
      const hash = window.location.hash;
      if (hash === '#auth') openAuthModal('login');
      if (hash === '#register') openAuthModal('register');
    };
    window.addEventListener('hashchange', handleHashModal);
    handleHashModal();

    // Final consolidated sync
    setTimeout(() => syncAuthUI(), 300);
    
    initTheme();
    initGlobalChatbot();
    initSettingsHandlers();
    injectPerformanceHints();
    setupHoverPrefetch();
    injectGlobalStyles();
    setupLazyLoading();

    window.addEventListener('storage', (e) => {
      if (e.key === 'wander_token' || e.key === 'wander_session') {
        lastSyncTime = 0; // Bypass throttle
        syncAuthUI();
      }
    });
  };

  function injectPerformanceHints() {
    const hints = [
      { rel: 'preconnect', href: window.location.origin },
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://images.unsplash.com' }
    ];
    hints.forEach(h => {
      if (document.querySelector(`link[href="${h.href}"][rel="${h.rel}"]`)) return;
      const link = document.createElement('link');
      Object.assign(link, h);
      document.head.appendChild(link);
    });
  }

  function setupHoverPrefetch() {
    // Prefetch API data when user hovers over a navigation link
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a');
      if (!link || !link.href || !link.href.startsWith(window.location.origin)) return;

      const page = link.href.split('/').pop().split('#')[0].split('?')[0];
      if (!page) return;

      const token = localStorage.getItem('wander_token');
      if (!token) return;

      if (page === 'leaderboard.html') {
        prefetchAPI('/api/auth/leaderboard');
      } else if (page === 'social-hub.html') {
        prefetchAPI('/api/social/stories');
        prefetchAPI('/api/social/feed');
      } else if (page === 'quests.html') {
        prefetchAPI('/api/auth/user/rank');
        prefetchAPI('/api/auth/user/activity');
      } else if (page === 'profile.html') {
        const url = new URL(link.href);
        const id = url.searchParams.get('id');
        if (id) {
          prefetchAPI(`/api/social/users/${id}`);
          prefetchAPI(`/api/social/posts/user/${id}`);
        } else {
          prefetchAPI('/api/auth/user/me');
        }
      }
    }, { passive: true });
  }

  const _prefetchCache = new Set();
  function prefetchAPI(url) {
    if (_prefetchCache.has(url)) return;
    _prefetchCache.add(url);

    // Check if already in sessionStorage and fresh
    const cacheKey = 'wv_prefetch_' + url;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30000) return; // Still fresh
      } catch (e) { }
    }

    console.log(`🚀 Big-Tech Prefetch: ${url}`);
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    fetch(url, { headers: { 'x-auth-token': token } })
      .then(res => res.json())
      .then(data => {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      })
      .catch(() => _prefetchCache.delete(url));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  function injectGlobalStyles() {
    if (document.getElementById('wv-global-performance-styles')) return;
    const style = document.createElement('style');
    style.id = 'wv-global-performance-styles';
    style.innerHTML = `
      #wv-top-loader {
        position: fixed; top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(90deg, #fbbf24, #f43f5e, #fbbf24);
        background-size: 200% 100%;
        z-index: 9999999;
        transform-origin: left;
        transform: scaleX(0);
        transition: transform 0.4s cubic-bezier(0.1, 0.7, 1, 0.1), opacity 0.3s;
        pointer-events: none;
      }
      #wv-top-loader.loading { transform: scaleX(0.7); animation: loaderShimmer 2s infinite linear; }
      #wv-top-loader.finished { transform: scaleX(1); opacity: 0; transition: transform 0.2s, opacity 0.4s 0.2s; }
      @keyframes loaderShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .loading-shimmer {
        background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
        background-size: 200% 100%;
        animation: loadingShimmer 1.5s infinite;
      }
      @keyframes loadingShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      [data-theme="light"] .loading-shimmer {
        background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 75%);
        background-size: 200% 100%;
      }

      /* Stats Modal Premium Styles */
      .stats-summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.25rem;
        margin-bottom: 3rem;
      }
      .stats-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 1.75rem;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        position: relative;
        overflow: hidden;
      }
      .stats-card:hover {
        transform: translateY(-8px);
        border-color: var(--primary);
        box-shadow: 0 15px 35px rgba(0,0,0,0.4), 0 0 15px rgba(56, 189, 248, 0.2);
      }
      .stats-card::after {
        content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%);
        pointer-events: none; opacity: 0; transition: opacity 0.3s;
      }
      .stats-card:hover::after { opacity: 1; }
      .stats-card__label {
        display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;
      }
      .stats-card__value {
        display: block; font-size: 2.2rem; font-weight: 900; color: #fff;
        font-family: 'Outfit', sans-serif; line-height: 1.2; margin-bottom: 0.75rem;
      }
      .stats-card__trend {
        font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;
      }
      .activity-charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
      }
      .chart-container {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 1.5rem;
        height: 420px;
        display: flex;
        flex-direction: column;
      }
      .chart-title {
        font-size: 1.1rem; font-weight: 800; margin-bottom: 1.5rem; color: var(--text);
        display: flex; align-items: center; gap: 8px;
      }
    `;
    document.head.appendChild(style);

    const loader = document.createElement('div');
    loader.id = 'wv-top-loader';
    document.body.appendChild(loader);
  }

  function startTopLoader() {
    const loader = document.getElementById('wv-top-loader');
    if (loader) {
      loader.classList.remove('finished');
      loader.classList.add('loading');
    }
  }

  function finishTopLoader() {
    const loader = document.getElementById('wv-top-loader');
    if (loader) {
      loader.classList.remove('loading');
      loader.classList.add('finished');
    }
  }

  // Hijack all internal links for the top loader
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href || link.target === '_blank') return;
    if (link.href.startsWith(window.location.origin) && !link.href.includes('#')) {
      startTopLoader();
    }
  });

  function setupLazyLoading() {
    // Big-Tech Pattern: IntersectionObserver for images
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, { rootMargin: '200px' });

    let lazyTimeout;
    const refreshLazy = () => {
      clearTimeout(lazyTimeout);
      lazyTimeout = setTimeout(() => {
        document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
      }, 150);
    };

    refreshLazy();
    // MutationObserver to watch for newly added images - debounced to avoid lag
    const mut = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
      if (hasNewNodes) refreshLazy();
    });
    mut.observe(document.body, { childList: true, subtree: true });
  }

  injectGlobalStyles(); // Pre-inject

  function openNotificationDetailModal(n) {
    const titleEl = document.getElementById('notif-detail-title');
    const bodyEl = document.getElementById('notif-detail-body');
    const timeEl = document.getElementById('notif-detail-time');
    const actionEl = document.getElementById('notif-detail-action');
    
    if (!titleEl || !bodyEl) return;
    
    titleEl.textContent = n.title || 'Chi tiết thông báo';
    bodyEl.innerHTML = n.message.replace(/\n/g, '<br>');
    timeEl.textContent = `Gửi lúc: ${new Date(n.createdAt).toLocaleString('vi-VN')}`;
    
    if (n.link) {
      actionEl.innerHTML = `<button class="btn btn--primary" style="width:100%;" onclick="window.location.href='${n.link}'">Xem chi tiết hành động</button>`;
    } else {
      actionEl.innerHTML = `<button class="btn btn--ghost" style="width:100%;" onclick="WanderUI.closeModal('notif-detail')">Đã hiểu</button>`;
    }
    
    openModal('notif-detail');
  }

  function copyToClipboard(text, btn) {
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(textArea);
    } else {
      navigator.clipboard.writeText(text).then(() => {
        if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => { btn.innerHTML = original; }, 2000);
        }
      });
    }
  }

  return { setTheme, toggleTheme, showToast, setButtonLoading, toggleNotificationDrawer, updateNotificationBadge, markAsRead, markAllAsRead, syncAuthUI, forceLogout, toggleUserMenu, openAuthModal, confirm, openPlaceDetail, openBookingDetail, openItineraryDetail, openNotificationDetailModal, getRankBadgeHTML, getRankIcon, getStoreKey, initSettingsHandlers, trackQuestActivity, getQuestActivity, startTopLoader, finishTopLoader, openModal, closeModal, copyToClipboard };
})());


