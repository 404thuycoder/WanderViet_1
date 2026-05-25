/**
 * WanderViet AI Shared UI Logic
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
      const suppressToast = args[1] && args[1].headers && args[1].headers['X-Suppress-Toast'] === 'true';
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

      if (!response.ok && !url.includes('/api/auth/me') && !suppressToast) {
        console.error(`[Fetch Error] ${response.status} ${url}`);
        // Optionally show a toast for specific critical errors
        if (response.status >= 500) {
          window.WanderUI.showToast('Lỗi máy chủ, vui lòng thử lại sau', 'error');
        }
      }

      return response;
    } catch (err) {
      const suppressToast = args[1] && args[1].headers && args[1].headers['X-Suppress-Toast'] === 'true';
      if (err.name === 'AbortError') {
        console.warn(`[Fetch Aborted] ${url}`);
        if (!suppressToast) {
          // Only show toast if it wasn't a background timeout
          // window.WanderUI.showToast('Yêu cầu hết hạn hoặc bị hủy', 'info'); 
        }
        throw err;
      }
      
      console.error(`[Fetch Network Error] ${url}`, err);
      if (!suppressToast) {
        window.WanderUI.showToast('Lỗi kết nối mạng', 'error');
      }
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
          <p style="color:var(--text-muted,#94a3b8);margin:0 0 2rem 0;line-height:1.6;font-size:0.95rem;">Tài khoản của bạn đã bị quản trị viên khóa do phát hiện dấu hiệu vi phạm chính sách của WanderViet AI. Vui lòng đăng xuất.</p>
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
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token') || localStorage.getItem('wander_business_token');
    
    if (typeof io === 'undefined') {
      const script = document.createElement('script');
      script.src = '/socket.io/socket.io.js';
      script.onload = () => initSocket();
      document.head.appendChild(script);
      return;
    }
    
    if (socket) return;

    socket = io({ 
        auth: { token: token || '' },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
    });
    
    window.WanderUI.socket = socket;

    socket.on('notification', (notif) => {
      WanderUI.showToast(notif.message || 'Bạn có thông báo mới!', 'info');
      updateNotificationBadge();
      if (document.getElementById('wander-notif-drawer')?.classList.contains('is-open')) {
        renderNotifications();
      }
    });

    socket.on('data_sync', (data) => {
      const event = new CustomEvent('wander_data_sync', { detail: data });
      window.dispatchEvent(event);
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
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('questActivityUpdated'));
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

  window.WanderUI.trackQuestActivity = trackQuestActivity;
  window.WanderUI.getQuestActivity = getQuestActivity;

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

      // Track quest activity: Đăng nhập hàng ngày
      if (window.WanderUI && window.WanderUI.trackQuestActivity) {
        window.WanderUI.trackQuestActivity('dailyLogin', 1);
      }

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

  window.WanderUI.handleHeaderBack = function() {
    // 1. If notification drawer is open, close it
    const notifDrawer = document.getElementById('wander-notif-drawer');
    if (notifDrawer && notifDrawer.classList.contains('is-open')) {
      if (typeof window.WanderUI.toggleNotificationDrawer === 'function') {
        window.WanderUI.toggleNotificationDrawer();
        return;
      }
    }

    // 2. If any modals are open, close them
    const openModals = Array.from(document.querySelectorAll('.modal')).filter(m => !m.hidden && m.style.display !== 'none');
    if (openModals.length > 0) {
      if (typeof window.closeModals === 'function') {
        window.closeModals();
        return;
      }
    }

    // 3. If user dropdown is open, close it
    const userDropdown = document.querySelector('[data-user-dropdown]');
    if (userDropdown && !userDropdown.hidden && userDropdown.style.display !== 'none') {
      if (typeof window.WanderUI.toggleUserMenu === 'function') {
        window.WanderUI.toggleUserMenu(false);
        return;
      }
    }

    // 4. If we are on planner.html and Form Step 2 is active, switch to Step 1
    const formStep2 = document.getElementById('formStep2');
    if (formStep2 && (formStep2.style.display === 'block' || formStep2.style.display === 'flex' || !formStep2.hasAttribute('hidden') && window.getComputedStyle(formStep2).display !== 'none')) {
      if (typeof window.switchFormStep === 'function') {
        window.switchFormStep(1);
        return;
      }
    }

    // 5. Navigate to home page (clean, no hash to avoid triggering auth modal)
    window.location.href = 'index.html';
  };

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
            <img src="/assets/wanderviet-logo-cropped-rounded.png" alt="WanderViet AI" style="height: 38px; width: 38px; object-fit: cover;">
            <span class="logo-text">WanderViet AI</span>
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
                   <strong>WanderViet AI</strong>
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
    const rightButtonHtml = !isExplorer
      ? `<button type="button" class="floating-toc-back-btn" onclick="WanderUI.handleHeaderBack(); event.stopPropagation();" title="Quay lại trang chủ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; display:block;">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            <span class="back-btn-sparkle">✦</span>
         </button>`
      : '';

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
      <div class="modal" id="modal-auth" data-modal="auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" hidden>
        <div class="modal__inner">
          <div class="modal__header">
            <h2 id="auth-title" class="modal__title">Tài khoản WanderViet AI</h2>
            <button type="button" class="modal__close" data-modal-close aria-label="Đóng">×</button>
          </div>
          <div class="modal__body">
            <p class="modal__lede">Hệ thống bảo mật WanderViet AI. Đăng nhập để đồng bộ lịch trình và ưu đãi của bạn.</p>
            <div class="auth-tabs" role="tablist" style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem">
              <button type="button" class="auth-tab is-active" role="tab" data-auth-tab="login" aria-selected="true" style="padding:0.4rem; font-size:0.9rem">Đăng nhập</button>
              <button type="button" class="auth-tab" role="tab" data-auth-tab="register" aria-selected="false" style="padding:0.4rem; font-size:0.9rem">Đăng ký mới</button>
            </div>

            <!-- LOGIN PANEL -->
            <form class="auth-panel" data-auth-panel="login">
              <label class="field"><span class="field-label">Email</span><input type="email" name="email" required autocomplete="email" /></label>
              <label class="field"><span class="field-label">Mật khẩu</span><input type="password" name="password" required autocomplete="current-password" /></label>
              <button type="submit" class="btn btn--primary btn--block">Đăng nhập</button>
              <div style="text-align: right; margin-top: 10px;">
                <button type="button" class="btn btn--text" data-auth-forgot-trigger style="font-size: 0.85rem; color: var(--accent); cursor: pointer; background: none; border: none; padding: 0;">Quên mật khẩu?</button>
              </div>
              <p class="auth-msg" data-auth-msg-login role="status"></p>
            </form>

            <!-- REGISTER PANEL -->
            <form class="auth-panel" data-auth-panel="register" hidden>
              <label class="field"><span class="field-label">Họ tên</span><input type="text" name="name" required autocomplete="name" /></label>
              <label class="field"><span class="field-label">Email</span><input type="email" name="email" required autocomplete="email" /></label>
              <label class="field"><span class="field-label">Mật khẩu</span><input type="password" name="password" required autocomplete="new-password" minlength="4" /></label>
              <input type="hidden" name="isBusiness" value="false" />
              <button type="submit" class="btn btn--primary btn--block">Gửi yêu cầu &amp; Nhận OTP</button>
              <p class="auth-msg" data-auth-msg-register role="status"></p>
            </form>

            <!-- REGISTER OTP PANEL -->
            <form class="auth-panel" data-auth-panel="register-otp" hidden>
              <p style="font-size: 0.88rem; color: #94a3b8; margin: 0 0 1.25rem 0; line-height: 1.5; text-align: center;">
                Mã OTP xác thực đã được gửi tới email của bạn. Vui lòng nhập để hoàn tất tạo tài khoản.
              </p>
              <label class="field">
                <span class="field-label">Mã OTP (6 chữ số)</span>
                <input type="text" name="otp" required maxlength="6" placeholder="______" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.3em; font-weight: bold;" />
              </label>
              <button type="submit" class="btn btn--primary btn--block">Hoàn tất đăng ký</button>
              <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <button type="button" class="btn btn--text" data-auth-register-otp-back style="font-size: 0.85rem; color: #64748b; background: none; border: none; padding: 0; cursor: pointer;">← Quay lại</button>
                <button type="button" class="btn btn--text" data-auth-register-otp-resend style="font-size: 0.85rem; color: var(--accent); font-weight: 600; background: none; border: none; padding: 0; cursor: pointer;">Gửi lại OTP</button>
              </div>
              <p class="auth-msg" data-auth-msg-register-otp role="status"></p>
            </form>

            <!-- FORGOT PASSWORD PANEL -->
            <form class="auth-panel" data-auth-panel="forgot" hidden>
              <p style="font-size: 0.88rem; color: #94a3b8; margin: 0 0 1.25rem 0; line-height: 1.5; text-align: center;">
                Nhập email đăng ký của bạn. Chúng tôi sẽ gửi mã OTP xác thực để đặt lại mật khẩu.
              </p>
              <label class="field"><span class="field-label">Email đăng ký</span><input type="email" name="email" required autocomplete="email" /></label>
              <button type="submit" class="btn btn--primary btn--block">Gửi mã OTP</button>
              <div style="text-align: center; margin-top: 15px;">
                <button type="button" class="btn btn--text" data-auth-forgot-back style="font-size: 0.85rem; color: #64748b; background: none; border: none; padding: 0; cursor: pointer;">← Quay lại đăng nhập</button>
              </div>
              <p class="auth-msg" data-auth-msg-forgot role="status"></p>
            </form>

            <!-- RESET PASSWORD OTP PANEL -->
            <form class="auth-panel" data-auth-panel="forgot-otp" hidden>
              <p style="font-size: 0.88rem; color: #94a3b8; margin: 0 0 1.25rem 0; line-height: 1.5; text-align: center;">
                Nhập mã OTP 6 chữ số vừa nhận và thiết lập mật khẩu mới.
              </p>
              <label class="field">
                <span class="field-label">Mã OTP (6 chữ số)</span>
                <input type="text" name="otp" required maxlength="6" placeholder="______" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.3em; font-weight: bold;" />
              </label>
              <label class="field"><span class="field-label">Mật khẩu mới</span><input type="password" name="password" required minlength="4" /></label>
              <button type="submit" class="btn btn--primary btn--block">Xác nhận &amp; Cập nhật mật khẩu</button>
              <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <button type="button" class="btn btn--text" data-auth-forgot-otp-back style="font-size: 0.85rem; color: #64748b; background: none; border: none; padding: 0; cursor: pointer;">← Quay lại</button>
                <button type="button" class="btn btn--text" data-auth-forgot-otp-resend style="font-size: 0.85rem; color: var(--accent); font-weight: 600; background: none; border: none; padding: 0; cursor: pointer;">Gửi lại OTP</button>
              </div>
              <p class="auth-msg" data-auth-msg-forgot-otp role="status"></p>
            </form>
          </div>
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
              <strong>Trợ lý WanderViet AI</strong>
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
              <div class="chat-log" id="global-chat-log" role="log" aria-live="polite"></div>
              
              <!-- Planning Mode Indicator Bar -->
              <div class="chat-planning-bar" id="chat-planning-bar" style="display:none;">
                <div class="chat-planning-bar__inner">
                  <span class="chat-planning-bar__icon">🗺️</span>
                  <span class="chat-planning-bar__text">Chế độ lập lịch trình</span>
                  <span class="chat-planning-bar__step" id="chat-planning-step"></span>
                  <button class="chat-planning-bar__close" id="chat-planning-close" title="Tắt chế độ lập lịch">✕</button>
                </div>
              </div>
              
              <!-- Function Chips (ChatGPT style) -->
              <div class="chat-function-chips" id="chat-function-chips">
                <button class="chat-func-chip" onclick="injectPlanningFormToChat()">
                  🗺️ Lập lịch
                </button>
                <button class="chat-func-chip" onclick="sendQuickQuery('Tìm địa điểm du lịch nổi tiếng ở Việt Nam')">
                  📍 Địa điểm
                </button>
                <button class="chat-func-chip" onclick="sendQuickQuery('Gợi ý khách sạn, homestay đẹp và giá tốt')">
                  🏨 Khách sạn
                </button>
                <button class="chat-func-chip" onclick="sendQuickQuery('Các món ăn đặc sản nổi tiếng ở Việt Nam')">
                  🍜 Đặc sản
                </button>
                <button class="chat-func-chip" onclick="sendQuickQuery('Mẹo du lịch Việt Nam tiết kiệm')">
                  💡 Mẹo hay
                </button>
                <button class="chat-func-chip" onclick="sendQuickQuery('Các lễ hội văn hóa đặc sắc ở Việt Nam')">
                  🎉 Lễ hội
                </button>
              </div>
              
              <!-- Full Planning Form Panel -->
              <div class="planning-form-panel" id="planning-form-panel" style="display:none;">
                <div class="planning-form-panel__header">
                  <span>🗺️ Lập lịch trình du lịch</span>
                  <button class="planning-form-panel__close" onclick="closePlanningForm()">✕</button>
                </div>
                <div class="planning-form-panel__body">
                  
                  <!-- Điểm đến -->
                  <div class="planning-form-group">
                    <div class="planning-form-label">📍 Bạn muốn đi đâu?</div>
                    <input type="text" id="plan-destination" class="planning-form-input" placeholder="VD: Đà Nẵng, Phú Quốc, Sapa, Hội An...">
                  </div>
                  
                  <!-- Thời gian & Ngân sách - 2 cột -->
                  <div class="planning-form-row">
                    <div class="planning-form-group">
                      <div class="planning-form-label">📅 Bạn có bao lâu?</div>
                      <div class="planning-form-options planning-form-options--compact">
                        <label><input type="radio" name="plan-duration" value="Nửa ngày"> Nửa ngày</label>
                        <label><input type="radio" name="plan-duration" value="1 ngày"> 1 ngày</label>
                        <label><input type="radio" name="plan-duration" value="2-3 ngày"> 2-3 ngày</label>
                        <label><input type="radio" name="plan-duration" value="4-5 ngày"> 4-5 ngày</label>
                        <label><input type="radio" name="plan-duration" value="1 tuần+"> 1 tuần+</label>
                      </div>
                    </div>
                    <div class="planning-form-group">
                      <div class="planning-form-label">💰 Ngân sách/người</div>
                      <div class="planning-form-options planning-form-options--compact">
                        <label><input type="radio" name="plan-budget" value="Dưới 1 triệu"> &lt;1M</label>
                        <label><input type="radio" name="plan-budget" value="1-3 triệu"> 1-3M</label>
                        <label><input type="radio" name="plan-budget" value="3-5 triệu"> 3-5M</label>
                        <label><input type="radio" name="plan-budget" value="5-10 triệu"> 5-10M</label>
                        <label><input type="radio" name="plan-budget" value="Trên 10 triệu"> 10M+</label>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Đi cùng ai -->
                  <div class="planning-form-group">
                    <div class="planning-form-label">👥 Đi cùng ai?</div>
                    <div class="planning-form-options planning-form-options--compact">
                      <label><input type="radio" name="plan-style" value="Một mình"> 🚶 Một mình</label>
                      <label><input type="radio" name="plan-style" value="Vợ/chồng/bạn trai/bạn gái"> 💑 Vợ/chồng</label>
                      <label><input type="radio" name="plan-style" value="Gia đình có con nhỏ"> 👨‍👩‍👧 Gia đình (con nhỏ)</label>
                      <label><input type="radio" name="plan-style" value="Gia đình người lớn"> 👨‍👩‍👧‍👦 Gia đình</label>
                      <label><input type="radio" name="plan-style" value="Nhóm bạn"> 👯 Nhóm bạn</label>
                      <label><input type="radio" name="plan-style" value="Đi cùng bố mẹ"> 👴👵 Bố mẹ</label>
                    </div>
                  </div>
                  
                  <!-- Bạn thích gì - checkbox -->
                  <div class="planning-form-group">
                    <div class="planning-form-label">🎯 Bạn thích gì? <span style="font-weight:400;color:#64748b">(chọn nhiều)</span></div>
                    <div class="planning-form-options">
                      <label><input type="checkbox" name="plan-interest" value="Tắm biển, bơi lội"> 🏖️ Tắm biển</label>
                      <label><input type="checkbox" name="plan-interest" value="Leo núi, trekking"> ⛰️ Leo núi</label>
                      <label><input type="checkbox" name="plan-interest" value="Khám phá ẩm thực"> 🍜 Ăn ngon</label>
                      <label><input type="checkbox" name="plan-interest" value="Chụp ảnh, check-in đẹp"> 📸 Check-in</label>
                      <label><input type="checkbox" name="plan-interest" value="Mua sắm"> 🛍️ Mua sắm</label>
                      <label><input type="checkbox" name="plan-interest" value="Tham quan, khám phá"> 🏛️ Tham quan</label>
                      <label><input type="checkbox" name="plan-interest" value="Bar, club, giải trí"> 🍺 Bar/Club</label>
                      <label><input type="checkbox" name="plan-interest" value="Nghỉ dưỡng, spa"> 🧖 Spa</label>
                      <label><input type="checkbox" name="plan-interest" value="Biểu diễn, show"> 🎭 Show</label>
                    </div>
                  </div>
                  
                  <!-- Yêu cầu thêm -->
                  <div class="planning-form-group">
                    <div class="planning-form-label">💬 Yêu cầu đặc biệt <span style="font-weight:400;color:#64748b">(tùy chọn)</span></div>
                    <input type="text" id="plan-note" class="planning-form-input" placeholder="VD: Gần biển, chỗ đỗ xe, chụp ảnh cưới...">
                  </div>
                  
                </div>
                <div class="planning-form-panel__footer">
                  <button class="btn btn--ghost" onclick="closePlanningForm()">Hủy</button>
                  <button class="btn btn--primary" onclick="submitPlanningForm()">✨ Tạo lịch trình</button>
                </div>
              </div>
              
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
                <!-- Premium Live Widgets -->
                <div class="chat-widgets-container">
                  <div class="chat-widget-card widget-clock">
                    <div class="widget-clock__main">
                      <div class="widget-clock__time" id="widget-realtime-clock">--:--:--</div>
                      <div class="widget-clock__date" id="widget-realtime-date">--/--/----</div>
                    </div>
                    <div class="widget-clock__divider"></div>
                    <div class="widget-clock__duration">
                      <span class="widget-clock__duration-label">⏳ Thời gian online:</span>
                      <span class="widget-clock__duration-value" id="widget-site-duration">00:00</span>
                    </div>
                  </div>
                  
                  <div class="chat-widget-card widget-weather">
                    <div class="widget-weather__info">
                      <span class="widget-weather__city">📍 Hà Nội</span>
                      <span class="widget-weather__desc">Thời tiết du lịch rất đẹp ☀️</span>
                    </div>
                    <div class="widget-weather__temp">28°C</div>
                  </div>

                  <!-- Dynamic WanderQuiz Interactive Widget -->
                  <div class="chat-widget-card widget-quiz">
                    <div class="widget-quiz__header">
                      <span class="widget-quiz__title">🏆 WanderQuiz</span>
                      <span class="widget-quiz__points" id="quiz-points">+100 XP</span>
                    </div>
                    <div class="widget-quiz__question" id="quiz-question">Phố cổ Hội An nằm ở tỉnh nào?</div>
                    <div class="widget-quiz__options" id="quiz-options">
                      <button type="button" class="quiz-opt-btn" onclick="WanderUI.submitQuizAnswer(this, false)">Đà Nẵng</button>
                      <button type="button" class="quiz-opt-btn" onclick="WanderUI.submitQuizAnswer(this, true)">Quảng Nam</button>
                      <button type="button" class="quiz-opt-btn" onclick="WanderUI.submitQuizAnswer(this, false)">Quảng Ngãi</button>
                    </div>
                    <div class="widget-quiz__result" id="quiz-result" hidden></div>
                  </div>
                </div>
                
                <h4 style="margin-top: 1.5rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px; display: inline-block;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Mẹo trò chuyện</h4>
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
                <h3>Tài khoản &amp; Bảo mật</h3>

                <!-- Step 1: Request OTP -->
                <div data-pwd-step="1">
                  <p style="font-size:0.88rem; color:#94a3b8; margin:0 0 1.25rem; line-height:1.6;">
                    Để bảo vệ tài khoản, chúng tôi sẽ gửi mã xác thực OTP đến email đăng ký của bạn trước khi đổi mật khẩu.
                  </p>
                  <button type="button" class="btn btn--primary" data-pwd-request-otp>📧 Gửi mã OTP để đổi mật khẩu</button>
                  <p data-pwd-msg-step1 role="status" style="margin-top:0.75rem; font-size:0.9rem;"></p>
                </div>

                <!-- Step 2: Enter OTP + New Password (hidden by default) -->
                <form data-pwd-otp-form hidden>
                  <p style="font-size:0.88rem; color:#94a3b8; margin:0 0 1.25rem; line-height:1.5; text-align:center;">
                    Mã OTP đã gửi đến email của bạn. Vui lòng nhập mã và mật khẩu mới.
                  </p>
                  <label class="field">
                    <span class="field-label">Mã OTP (6 chữ số)</span>
                    <input type="text" name="otp" required maxlength="6" autocomplete="one-time-code"
                           placeholder="______" style="text-align:center; font-size:1.5rem; letter-spacing:0.3em; font-weight:bold;" />
                  </label>
                  <label class="field">
                    <span class="field-label">Mật khẩu mới</span>
                    <input type="password" name="newPassword" required minlength="6" autocomplete="new-password" />
                  </label>
                  <label class="field">
                    <span class="field-label">Xác nhận mật khẩu mới</span>
                    <input type="password" name="confirmPassword" required minlength="6" autocomplete="new-password" />
                  </label>
                  <div style="display:flex; justify-content:space-between; gap:0.75rem; margin-top:0.75rem;">
                    <button type="button" class="btn btn--outline" data-pwd-back-step1 style="flex:1;">← Quay lại</button>
                    <button type="submit" class="btn btn--primary" style="flex:2;">✅ Xác nhận đổi mật khẩu</button>
                  </div>
                  <div style="text-align:center; margin-top:0.75rem;">
                    <button type="button" class="btn btn--text" data-pwd-resend-otp
                            style="font-size:0.85rem; color:var(--accent); background:none; border:none; cursor:pointer; padding:0;">Gửi lại mã OTP</button>
                  </div>
                  <p data-pwd-msg-otp role="status" style="margin-top:0.5rem; font-size:0.9rem;"></p>
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
          <style>
        .floating-toc-container.is-shrunk .toc-text-label { display: none !important; }
        .floating-toc-container.is-shrunk .floating-toc-btn { padding: 0 8px !important; min-width: 36px !important; border-radius: 18px !important; justify-content: center; position: relative !important; }
        .floating-toc-container.is-shrunk .toc-shrink-toggle {
          display: inline-flex !important;
          position: absolute !important;
          right: -8px !important;
          top: 50% !important;
          transform: translateY(-50%) rotate(180deg) !important;
          background: #fff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
          width: 18px !important;
          height: 18px !important;
          margin: 0 !important;
          z-index: 10 !important;
        }
        .floating-toc-container.is-shrunk .toc-shrink-toggle:hover {
          transform: translateY(-50%) rotate(180deg) scale(1.15) !important;
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        [data-theme="dark"] .floating-toc-container.is-shrunk .toc-shrink-toggle {
          background: #1e293b !important;
          border-color: #475569 !important;
          color: #f1f5f9 !important;
        }
        [data-theme="dark"] .floating-toc-container.is-shrunk .toc-shrink-toggle:hover {
          background: #334155 !important;
        }
        .toc-shrink-toggle {
          display: inline-flex; align-items: center; justify-content: center;
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(0,0,0,0.06); margin-left: 2px;
          transition: all 0.25s ease; flex-shrink: 0; cursor: pointer;
        }
        .toc-shrink-toggle:hover { background: rgba(0,0,0,0.12); transform: scale(1.15); }
        .toc-shrink-toggle svg { transition: transform 0.3s ease; }
        [data-theme="dark"] .toc-shrink-toggle { background: rgba(255,255,255,0.1); }
        [data-theme="dark"] .toc-shrink-toggle:hover { background: rgba(255,255,255,0.2); }
      </style>
      <div class="floating-toc-container" id="floating-toc" style="display:flex; align-items:center; gap:6px;">
             <button type="button" class="floating-toc-btn" onclick="this.parentElement.classList.toggle('is-open')" title="Mục lục Trang chủ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span class="toc-text-label">Danh mục</span>
                <span class="toc-shrink-toggle" onclick="event.stopPropagation(); this.closest('.floating-toc-container').classList.toggle('is-shrunk');" title="Thu nhỏ / Phóng to">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </span>
             </button>
             ${rightButtonHtml}
             <ul class="floating-toc-menu">
                <li style="display:flex; justify-content:space-between; align-items:center; padding: 4px 12px 8px; border-bottom:1px solid var(--border, #e2e8f0); margin-bottom:8px;">
                   <strong style="color:var(--text); font-size:0.9rem;">Mục lục</strong>
                   <button type="button" onclick="this.closest('.floating-toc-container').classList.remove('is-open')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.4rem; padding:0; line-height:1; display:flex; align-items:center; justify-content:center; height:24px; width:24px;">&times;</button>
                </li>
                <li><a href="index.html#personal-picks" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">✨ Gợi ý cho bạn</a></li>
                <li><a href="index.html#destinations" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">📍 Điểm đến</a></li>
                <li><a href="index.html#top-partners" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🤝 Đối tác</a></li>
                <li><a href="index.html#offers" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🎁 Ưu đãi</a></li>
                <li><a href="index.html#business-services" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🏨 Dịch vụ</a></li>
                <li><a href="business-directory.html?cat=Thuê xe" onclick="this.closest('.floating-toc-container').classList.remove('is-open')">🚗 Thuê xe du lịch</a></li>
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

      /* Proposal Card - Advanced Premium */
      .chat-proposal-card-premium {
        margin: 12px 0; padding: 0; border-radius: 18px;
        background: rgba(16, 185, 129, 0.06);
        border: 1px solid rgba(16, 185, 129, 0.15);
        animation: wander-toast-in 0.4s cubic-bezier(0.18,0.89,0.32,1.28);
        flex-shrink: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
        position: relative;
      }
      .chat-proposal-card-premium::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #10b981, #34d399, #10b981);
        opacity: 0.7;
      }
      .chat-proposal-card-premium:hover {
        border-color: rgba(16, 185, 129, 0.4);
        background: rgba(16, 185, 129, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 12px 35px rgba(16, 185, 129, 0.15);
      }

      /* Inline Itinerary Card - Advanced */
      .chat-itinerary-card {
        margin: 12px 0; border-radius: 18px;
        background: rgba(10, 18, 28, 0.8);
        border: 1px solid rgba(16, 185, 129, 0.15);
        animation: wander-toast-in 0.4s ease-out;
        max-height: 520px; overflow-y: auto;
        flex-shrink: 0;
        overflow: hidden;
      }
      .chat-itinerary-card::-webkit-scrollbar { width: 4px; }
      .chat-itinerary-card::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 4px; }
      .chat-itinerary-card::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.5); }
      .chat-itin-hero {
        padding: 16px 18px 14px;
        background: linear-gradient(180deg, rgba(16,185,129,0.08) 0%, transparent 100%);
        border-bottom: 1px solid rgba(16,185,129,0.1);
        position: relative;
      }
      .chat-itin-hero::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, #10b981, #34d399, #10b981);
        opacity: 0.6;
      }
      .chat-itin-dest-pill {
        display: inline-block; padding: 4px 12px;
        background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1));
        color: #10b981;
        border-radius: 20px; font-size: 0.65rem; font-weight: 800;
        letter-spacing: 0.5px; margin-bottom: 10px;
        border: 1px solid rgba(16,185,129,0.25);
      }
      .chat-itin-hero-title { font-size: 1.15rem; font-weight: 900; color: #fff; margin: 0 0 6px; line-height: 1.2; }
      .chat-itin-hero-sub { font-size: 0.8rem; color: #94a3b8; margin: 0 0 14px; line-height: 1.5; }
      .chat-itin-stats {
        display: flex; flex-wrap: wrap; gap: 12px; padding-top: 14px;
        border-top: 1px solid rgba(255,255,255,0.05);
      }
      .chat-itin-stat { flex: 1; min-width: 80px; display: flex; flex-direction: column; gap: 3px; }
      .chat-itin-stat-label { font-size: 0.58rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
      .chat-itin-stat-val { font-size: 0.9rem; font-weight: 800; color: #10b981; }
      .chat-itin-timeline { padding: 14px 16px 8px; display: flex; flex-direction: column; gap: 12px; }
      .chat-itin-day-block { display: flex; gap: 12px; animation: slideInUp 0.5s ease-out both; }
      .chat-itin-day-sidebar { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 2px; }
      .chat-itin-day-num {
        width: 32px; height: 32px; border-radius: 10px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff; font-weight: 900; font-size: 0.85rem;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(16,185,129,0.35);
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

    // --- UPDATE LIVE WIDGETS (CLOCK & SITE DURATION) ---
    const siteStartTime = Date.now();
    function updateLiveWidgets() {
      const timeEl = document.getElementById('widget-realtime-clock');
      const dateEl = document.getElementById('widget-realtime-date');
      const durEl = document.getElementById('widget-site-duration');
      
      if (!timeEl && !dateEl && !durEl) return;
      
      const now = new Date();
      
      // Update Time
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('vi-VN', { hour12: false });
      }
      
      // Update Date
      if (dateEl) {
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        dateEl.textContent = `${dd}/${mm}/${yyyy}`;
      }
      
      // Update Active Duration
      if (durEl) {
        const diffMs = Date.now() - siteStartTime;
        const totalSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        const formattedMins = String(mins).padStart(2, '0');
        const formattedSecs = String(secs).padStart(2, '0');
        durEl.textContent = `${formattedMins}:${formattedSecs}`;
      }
    }
    
    // Start interval
    setInterval(updateLiveWidgets, 1000);
    updateLiveWidgets(); // Run immediately

    // --- WANDERRADIO HANDLERS ---
    let isRadioPlaying = false;
    let radioAudio = null;
    
    function initRadioHandlers() {
      const playBtn = document.getElementById('radio-play-btn');
      const statusEl = document.getElementById('radio-status');
      const waveEl = document.getElementById('radio-wave');
      
      if (!playBtn) return;
      
      playBtn.addEventListener('click', () => {
        if (!radioAudio) {
          // Play a beautiful public-domain Lo-Fi stream
          radioAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
          radioAudio.loop = true;
          radioAudio.volume = 0.35;
        }
        
        if (!isRadioPlaying) {
          radioAudio.play().then(() => {
            isRadioPlaying = true;
            playBtn.textContent = '⏸';
            statusEl.textContent = 'Đang phát';
            statusEl.classList.add('is-playing');
            if (waveEl) waveEl.classList.add('is-active');
            showToast('Đang phát WanderRadio: Lo-Fi Hồ Tây ☕', 'info');
          }).catch(err => {
            // Autoplay safety fallback (simulated active state)
            isRadioPlaying = true;
            playBtn.textContent = '⏸';
            statusEl.textContent = 'Đang phát (Mute)';
            statusEl.classList.add('is-playing');
            if (waveEl) waveEl.classList.add('is-active');
            showToast('Đang mô phỏng phát nhạc Ambient du lịch!', 'info');
          });
        } else {
          if (radioAudio) radioAudio.pause();
          isRadioPlaying = false;
          playBtn.textContent = '▶';
          statusEl.textContent = 'Đang dừng';
          statusEl.classList.remove('is-playing');
          if (waveEl) waveEl.classList.remove('is-active');
          showToast('Đã tạm dừng phát nhạc.', 'info');
        }
      });
    }
    
    setTimeout(initRadioHandlers, 200); // Wait for templates to mount

    // --- WANDERQUIZ HANDLERS ---
    const quizQuestions = [
      { q: "Phố cổ Hội An nằm ở tỉnh nào?", options: ["Đà Nẵng", "Quảng Nam", "Quảng Ngãi"], correct: 1 },
      { q: "Hồ Gươm gắn liền với vị vua nào trả gươm?", options: ["Lê Lợi", "Lý Thái Tổ", "Trần Hưng Đạo"], correct: 0 },
      { q: "Món lẩu đặc sản nổi tiếng nhất ở Sa Pa là gì?", options: ["Lẩu Cá Hồi", "Lẩu Mắm", "Lẩu Thái"], correct: 0 },
      { q: "Vịnh Hạ Long được UNESCO công nhận là di sản thế giới mấy lần?", options: ["1 lần", "2 lần", "3 lần"], correct: 1 }
    ];
    let currentQuizIndex = 0;
    
    function submitQuizAnswer(btn, isCorrect) {
      const resultEl = document.getElementById('quiz-result');
      const optionsEl = document.getElementById('quiz-options');
      
      if (!resultEl || !optionsEl) return;
      
      const buttons = optionsEl.querySelectorAll('.quiz-opt-btn');
      buttons.forEach(b => b.disabled = true);
      
      if (isCorrect) {
        btn.classList.add('quiz-opt-btn--correct');
        resultEl.textContent = "🎉 Chính xác! Bạn nhận được +100 XP ⚡";
        resultEl.style.color = "#4ade80";
        showToast('Chúc mừng! Bạn trả lời đúng và nhận +100 XP!', 'success');
      } else {
        btn.classList.add('quiz-opt-btn--incorrect');
        buttons.forEach((b, idx) => {
          if (idx === quizQuestions[currentQuizIndex].correct) {
            b.classList.add('quiz-opt-btn--correct');
          }
        });
        resultEl.textContent = "❌ Sai rồi! Hãy thử câu tiếp theo nhé.";
        resultEl.style.color = "#f87171";
      }
      
      resultEl.removeAttribute('hidden');
      
      setTimeout(() => {
        currentQuizIndex = (currentQuizIndex + 1) % quizQuestions.length;
        const nextQ = quizQuestions[currentQuizIndex];
        
        const questionEl = document.getElementById('quiz-question');
        if (questionEl) questionEl.textContent = nextQ.q;
        
        optionsEl.innerHTML = '';
        nextQ.options.forEach((opt, idx) => {
          const optBtn = document.createElement('button');
          optBtn.type = 'button';
          optBtn.className = 'quiz-opt-btn';
          optBtn.textContent = opt;
          optBtn.onclick = () => submitQuizAnswer(optBtn, idx === nextQ.correct);
          optionsEl.appendChild(optBtn);
        });
        
        resultEl.setAttribute('hidden', 'true');
        resultEl.textContent = '';
      }, 3500);
    }
    window.WanderUI.submitQuizAnswer = submitQuizAnswer;

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
          // Nếu có action, thực hiện action trực tiếp
          if (opt.action === 'injectPlanningForm') {
            injectPlanningFormToChat();
            return;
          }
          // Ngược lại, gửi query như bình thường
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

    // === PLANNING WIZARD: Guided questions for complete trip planning ===
    const PLANNING_STEPS = [
      { 
        id: 'destination', 
        question: '📍 Bạn muốn đi đâu vậy?', 
        hint: 'VD: Đà Lạt, Hội An, Sapa...', 
        placeholder: 'Nhập địa điểm',
        suggestions: [
          { text: '🌸 Đà Lạt', query: 'Đà Lạt' },
          { text: '🏮 Hội An', query: 'Hội An' },
          { text: '🏔️ Sapa', query: 'Sapa' },
          { text: '🏖️ Nha Trang', query: 'Nha Trang' },
          { text: '🌊 Phú Quốc', query: 'Phú Quốc' },
          { text: '🏙️ TP.HCM', query: 'TP HCM' },
          { text: '⛰️ Hà Giang', query: 'Hà Giang' },
          { text: '🏯 Huế', query: 'Huế' },
        ]
      },
      { 
        id: 'days', 
        question: '📅 Bạn có bao nhiêu thời gian cho chuyến đi?', 
        hint: 'VD: 3 ngày, 5 ngày 4 đêm...', 
        placeholder: 'Nhập số ngày',
        suggestions: [
          { text: '📅 1 ngày', query: '1 ngày' },
          { text: '📅 2 ngày 1 đêm', query: '2 ngày 1 đêm' },
          { text: '📅 3 ngày 2 đêm', query: '3 ngày 2 đêm' },
          { text: '📅 4 ngày 3 đêm', query: '4 ngày 3 đêm' },
          { text: '📅 5 ngày 4 đêm', query: '5 ngày 4 đêm' },
          { text: '📅 7 ngày', query: '7 ngày hoặc hơn' },
        ]
      },
      { 
        id: 'travelers', 
        question: '👥 Mình đi cùng với ai vậy?', 
        hint: 'VD: 2 người, gia đình 4 người...', 
        placeholder: 'Số người',
        suggestions: [
          { text: '🚶 Một mình', query: 'đi một mình' },
          { text: '👫 Cặp đôi/2 người', query: '2 người' },
          { text: '👨‍👩‍👧 Gia đình có trẻ em', query: 'gia đình có trẻ em' },
          { text: '👨‍👩‍👧‍👦 Gia đình nhiều người', query: 'gia đình đông người' },
          { text: '👯 Bạn bè nhóm', query: 'đi với bạn bè nhóm' },
          { text: '👴👵 Người lớn tuổi', query: 'người lớn tuổi đi cùng' },
        ]
      },
      { 
        id: 'budget', 
        question: '💰 Ngân sách dự kiến là bao nhiêu vậy?', 
        hint: 'VD: 3-5 triệu, 10 triệu...', 
        placeholder: 'Ngân sách',
        suggestions: [
          { text: '💰 Tiết kiệm (<3 triệu)', query: 'dưới 3 triệu / người' },
          { text: '💰 Trung bình (3-5 triệu)', query: '3 đến 5 triệu / người' },
          { text: '💰 Tốt (5-10 triệu)', query: '5 đến 10 triệu / người' },
          { text: '💰 Cao cấp (>10 triệu)', query: 'trên 10 triệu / người' },
        ]
      },
      { 
        id: 'style', 
        question: '🎯 Bạn thích phong cách du lịch nào nhất?', 
        hint: 'VD: Nghỉ dưỡng, khám phá...', 
        placeholder: 'Phong cách',
        suggestions: [
          { text: '🏖️ Nghỉ dưỡng', query: 'nghỉ dưỡng, thư giãn' },
          { text: '🗺️ Khám phá', query: 'khám phá, phiêu lưu' },
          { text: '🍽️ Ẩm thực', query: 'ẩm thực, ăn uống' },
          { text: '📸 Check-in/Sống ảo', query: 'check-in, chụp ảnh đẹp' },
          { text: '⛩️ Văn hóa/Lịch sử', query: 'văn hóa, lịch sử, đền chùa' },
          { text: '🏃 Mạo hiểm', query: 'mạo hiểm, thể thao' },
        ]
      },
      {
        id: 'transport',
        question: '🚗 Bạn muốn di chuyển bằng phương tiện gì?',
        hint: 'VD: Máy bay, xe khách, xe máy...',
        placeholder: 'Phương tiện',
        suggestions: [
          { text: '✈️ Máy bay', query: 'máy bay' },
          { text: '🚌 Xe khách', query: 'xe khách, xe giường nằm' },
          { text: '🚗 Xe máy', query: 'xe máy tự lái' },
          { text: '🚙 Ô tô', query: 'ô tô riêng hoặc thuê' },
        ]
      }
    ];

    // Planning wizard state
    let planningWizard = {
      active: false,
      currentStep: 0,
      answers: {},
      collected: false
    };

    // Toggle planning mode from chip
    function togglePlanningMode() {
      if (planningWizard.active) {
        exitPlanningMode();
      } else {
        enterPlanningMode();
      }
    }

    function enterPlanningMode() {
      const chip = document.getElementById('chip-planning');
      if (chip) chip.classList.add('chat-func-chip--active');
      
      const bar = document.getElementById('chat-planning-bar');
      if (bar) bar.style.display = 'block';
      
      startPlanningWizard();
    }

    function exitPlanningMode() {
      planningWizard.active = false;
      
      const chip = document.getElementById('chip-planning');
      if (chip) chip.classList.remove('chat-func-chip--active');
      
      const bar = document.getElementById('chat-planning-bar');
      if (bar) bar.style.display = 'none';
    }

    function sendQuickQuery(query) {
      const input = document.getElementById('global-chat-input');
      const form = document.getElementById('global-chat-form');
      if (input && form) {
        input.value = query;
        form.dispatchEvent(new Event('submit'));
      }
    }

    setTimeout(() => {
      const closeBtn = document.getElementById('chat-planning-close');
      if (closeBtn) closeBtn.onclick = exitPlanningMode;
    }, 100);

    function updatePlanningStepDisplay(step, total) {
      const stepEl = document.getElementById('chat-planning-step');
      if (stepEl) stepEl.textContent = `${step}/${total}`;
    }

    // Show planning mode indicator (like AI function call)
    function showPlanningModeIndicator() {
      const indicator = document.createElement('div');
      indicator.id = 'planning-mode-indicator';
      indicator.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.08));
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 20px;
        margin-bottom: 12px;
        font-size: 0.72rem;
        color: #10b981;
        font-weight: 600;
        animation: slideDown 0.3s ease;
      `;
      indicator.innerHTML = `
        <span style="font-size:1rem;">🗺️</span>
        <span>Đang ở chế độ lập lịch trình</span>
        <span style="margin-left:auto; display:flex; align-items:center; gap:4px;">
          <span class="pulse-dot" style="width:6px; height:6px; background:#10b981; border-radius:50%;"></span>
          Active
        </span>
      `;
      log.appendChild(indicator);
      
      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .pulse-dot { animation: pulse-dot 1.5s ease infinite; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    // Update indicator progress
    function updatePlanningIndicator(step) {
      const indicator = document.getElementById('planning-mode-indicator');
      if (indicator) {
        indicator.innerHTML = `
          <span style="font-size:1rem;">🗺️</span>
          <span>Đang ở chế độ lập lịch trình</span>
          <span style="margin-left:auto; font-size:0.65rem; color:#64748b;">
            ${step}/${PLANNING_STEPS.length}
          </span>
          <span style="display:flex; align-items:center; gap:4px;">
            <span class="pulse-dot" style="width:6px; height:6px; background:#10b981; border-radius:50%;"></span>
          </span>
        `;
      }
    }

    // Remove planning indicator
    function hidePlanningIndicator() {
      const indicator = document.getElementById('planning-mode-indicator');
      if (indicator) indicator.remove();
    }

    // Start planning wizard
    function startPlanningWizard() {
      planningWizard = {
        active: true,
        currentStep: 0,
        answers: {},
        collected: false
      };
      
      // Remove any existing suggestions/chips
      const existingChips = log.querySelectorAll('.chat-suggestion-container');
      existingChips.forEach(el => el.remove());
      
      // Update step display
      updatePlanningStepDisplay(1, PLANNING_STEPS.length);
      
      // Bot intro message
      appendMsg('Chào bạn! Mình sẽ giúp bạn lập lịch trình du lịch nhé! 🎯\n\nTrả lời một vài câu hỏi để mình hiểu rõ hơn về chuyến đi của bạn:', 'bot');
      
      // Ask first question after a short delay
      setTimeout(() => {
        askPlanningQuestion(0);
      }, 800);
    }

    // Ask a specific planning question
    function askPlanningQuestion(stepIndex) {
      if (stepIndex >= PLANNING_STEPS.length) {
        // All questions answered - generate plan
        generatePlanFromWizard();
        return;
      }

      const step = PLANNING_STEPS[stepIndex];
      
      // Update step display
      updatePlanningStepDisplay(stepIndex + 1, PLANNING_STEPS.length);
      
      // Bot asks question in chat style
      appendMsg(step.question, 'bot');
      
      // Show hint
      const hintDiv = document.createElement('div');
      hintDiv.style.cssText = 'font-size:0.72rem; color:#94a3b8; margin-top:4px; margin-bottom:12px; padding-left:12px;';
      hintDiv.textContent = `💡 Gợi ý: ${step.hint}`;
      log.appendChild(hintDiv);
      
      // Render suggestions as chips
      if (step.suggestions) {
        const container = document.createElement('div');
        container.className = 'chat-suggestion-container';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '8px';
        container.style.marginTop = '8px';
        
        step.suggestions.forEach(sug => {
          const chip = document.createElement('div');
          chip.className = 'chat-suggestion-chip';
          chip.textContent = sug.text;
          chip.onclick = () => {
            // Add user message
            appendMsg(sug.text, 'user');
            // Store answer
            planningWizard.answers[step.id] = sug.query;
            // Remove current chips
            container.remove();
            // Next step
            planningWizard.currentStep++;
            
            // Brief pause then ask next
            setTimeout(() => {
              askPlanningQuestion(planningWizard.currentStep);
            }, 400);
          };
          container.appendChild(chip);
        });
        log.appendChild(container);
      }
      
      scrollToBottom();
    }

    // Progress text
    function progressText(stepIndex) {
      return `${stepIndex + 1}/${PLANNING_STEPS.length}`;
    }

    // Generate plan from wizard answers
    function generatePlanFromWizard() {
      const a = planningWizard.answers;
      
      // Exit planning mode
      exitPlanningMode();
      
      // Show "thinking" message
      appendMsg('✅ Mình đã thu thập đủ thông tin rồi! Để mình lập lịch trình chi tiết cho bạn nhé...', 'bot');
      
      // Build the prompt
      let prompt = `Hãy lập lịch trình du lịch chi tiết và hoàn chỉnh cho tôi với các thông tin sau:\n\n`;
      prompt += `📍 Địa điểm: ${a.destination || 'chưa xác định'}\n`;
      prompt += `📅 Thời gian: ${a.days || 'chưa xác định'}\n`;
      prompt += `👥 Người đi: ${a.travelers || 'chưa xác định'}\n`;
      prompt += `💰 Ngân sách: ${a.budget || 'chưa xác định'}\n`;
      prompt += `🎯 Phong cách: ${a.style || 'khám phá'}\n`;
      if (a.transport) prompt += `🚗 Di chuyển: ${a.transport}\n`;
      prompt += `\nYêu cầu:\n`;
      prompt += `- Lịch trình chi tiết từng ngày, từng buổi (sáng, trưa, chiều, tối)\n`;
      prompt += `- Gợi ý địa điểm cụ thể với thời gian\n`;
      prompt += `- Địa điểm ăn uống phù hợp với ngân sách\n`;
      prompt += `- Mẹo và lưu ý hữu ích\n`;
      prompt += `- Chi phí ước tính\n`;
      
      // End wizard mode
      planningWizard.active = false;
      
      // Send to AI
      const input = document.getElementById('global-chat-input');
      const form = document.getElementById('global-chat-form');
      if (input && form) {
        input.value = prompt;
        form.dispatchEvent(new Event('submit'));
      }
    }

    const PLANNING_SUGGESTIONS = [
      { text: '🗺️ Lập lịch trình', action: 'injectPlanningForm' },
      { text: '🏨 Tìm chỗ ở', query: 'Tìm khách sạn hoặc homestay đẹp' },
      { text: '🍽️ Món ngon', query: 'Gợi ý các món ăn đặc sản địa phương' },
      { text: '📸 Điểm check-in', query: 'Những địa điểm chụp ảnh đẹp nhất' },
      { text: '✈️ Lên kế hoạch', query: 'Hướng dẫn tôi lập kế hoạch du lịch' }
    ];

    // Quick-start combos for 1-click planning
    const QUICK_PLANNERS = [
      { text: '🌸 Đà Lạt 3 ngày', query: 'Lập lịch trình du lịch Đà Lạt 3 ngày 2 đêm' },
      { text: '🏖️ Nha Trang 4 ngày', query: 'Lập lịch trình du lịch Nha Trang 4 ngày 3 đêm' },
      { text: '🏮 Hội An 2 ngày', query: 'Lập lịch trình du lịch Hội An 2 ngày 1 đêm' },
      { text: '🏔️ Sapa 3 ngày', query: 'Lập lịch trình du lịch Sapa 3 ngày 2 đêm' },
      { text: '🌊 Phú Quốc 4 ngày', query: 'Lập lịch trình du lịch Phú Quốc 4 ngày 3 đêm' },
      { text: '🏙️ TP.HCM 2 ngày', query: 'Lập lịch trình du lịch TP.HCM 2 ngày 1 đêm' },
    ];

    // Render welcome message with Quick Planners
    function renderWelcomeWithPlanner() {
      // Welcome message - clean and professional
      const welcomeDiv = document.createElement('div');
      welcomeDiv.style.cssText = 'padding: 24px 20px 16px; text-align: center;';
      welcomeDiv.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--text, #1e293b); margin-bottom: 6px;">WanderViet</div>
        <div style="font-size: 0.8rem; color: var(--text-muted, #64748b); margin-bottom: 16px;">Trợ lý du lịch thông minh</div>
        <button onclick="injectPlanningFormToChat()" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; background: var(--primary, #6366f1); border: none; border-radius: 20px; color: #fff; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
          🗺️ Lập lịch trình
        </button>
      `;
      log.appendChild(welcomeDiv);

      // Quick planners section
      const qpSection = document.createElement('div');
      qpSection.style.cssText = 'margin: 0 16px 16px;';
      qpSection.innerHTML = `<div style="font-size: 0.65rem; color: var(--text-muted, #64748b); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Gợi ý nhanh</div>`;

      const qpGrid = document.createElement('div');
      qpGrid.className = 'chat-quick-planners';
      QUICK_PLANNERS.forEach(qp => {
        const card = document.createElement('div');
        card.className = 'chat-quick-card';
        card.textContent = qp.text;
        card.onclick = () => {
          const input = document.getElementById('global-chat-input');
          const form = document.getElementById('global-chat-form');
          if (input && form) {
            input.value = qp.query;
            form.dispatchEvent(new Event('submit'));
          }
        };
        qpGrid.appendChild(card);
      });
      qpSection.appendChild(qpGrid);
      log.appendChild(qpSection);

      // Suggestions
      renderSuggestions(PLANNING_SUGGESTIONS);
      scrollToBottom();
    }

    function formatChatMarkdown(text) {
      if (!text) return '';
      let html = text;

      // 1. Xử lý "Nổi bật" block (Ưu tiên xử lý trước để tránh bị dính regex khác)
      html = html.replace(/✨ Nổi bật:([\s\S]*?)(?:\n\n|<br><br>|$)/g, (match, content) => {
          return `<div class="chat-highlight-box"><span class="chat-highlight-tag">✨ Nổi bật:</span> ${content.trim()}</div>`;
      });

      // 2. Markdown links: [text](url) → <a href="url" target="_blank">text</a>
      html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, label, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; text-decoration:underline; word-break:break-all;">${label}</a>`;
      });

      // 3. Bold: **text**
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
      
      // Nút mở form lập lịch trong chat
      if (role === 'bot' && !isHtml) {
        const planBtn = document.createElement('button');
        planBtn.className = 'btn-bubble-plan';
        planBtn.innerHTML = '🗺️ Lập lịch ngay';
        planBtn.style.cssText = `
          margin-top: 12px;
          margin-right: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        `;
        planBtn.onclick = () => openPlanningForm();
        planBtn.onmouseenter = () => {
          planBtn.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(139, 92, 246, 0.25))';
          planBtn.style.transform = 'translateY(-1px)';
        };
        planBtn.onmouseleave = () => {
          planBtn.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))';
          planBtn.style.transform = 'translateY(0)';
        };
        msg.appendChild(planBtn);
      }
      
      // Phát hiện form lập lịch nhúng trong chat
      if (text.includes('[PLANNING_FORM]')) {

        const formHtml = createInlinePlanningForm();
        msg.querySelector('.chat-bubble__content').innerHTML = text.replace('[PLANNING_FORM]', '') + formHtml;
        msg.querySelector('.chat-bubble__content').style.paddingBottom = '8px';
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
          renderWelcomeWithPlanner();
        }
      } catch (e) {
        if (!currentSessionId) renderWelcomeWithPlanner();
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
        renderWelcomeWithPlanner();
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
      
      // Check if starting planning wizard (manual trigger)
      if (msg === '__START_WIZARD__') {
        input.value = '';
        startPlanningWizard();
        return;
      }
      
      // Auto-detect planning intent from user message
      // CHỈ trigger khi message chủ yếu về lập lịch (keyword chiếm >50% độ dài)
      const planningKeywords = [
        'lập lịch', 'lên lịch', 'tạo lịch trình',
        'lịch trình', 'trip planner', 'plan trip'
      ];
      const lowerMsg = msg.toLowerCase().trim();
      
      // Kiểm tra xem có keyword nào match không và keyword chiếm tỷ lệ lớn trong message
      let matchedKeyword = null;
      for (const kw of planningKeywords) {
        if (lowerMsg.includes(kw)) {
          matchedKeyword = kw;
          break;
        }
      }
      
      // Chỉ trigger nếu:
      // 1. Có keyword match
      // 2. Message ngắn (< 30 ký tự) HOẶC message chỉ chứa keyword + vài ký tự thêm
      const isPlanningIntent = matchedKeyword && (
        lowerMsg.length < 30 || 
        (lowerMsg.replace(matchedKeyword, '').length < 10)
      );
      

      
      // Skip keyword detection nếu submit từ form lập lịch
      if (isPlanningIntent && !window._fromPlanningForm) {
        window._fromPlanningForm = false;
        appendMsg(msg, 'user');
        input.value = '';
        injectPlanningFormToChat();
        return;
      }
      
      // Reset flag sau khi xử lý
      window._fromPlanningForm = false;
      
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

            // Track quest activity: Trò chuyện với Trợ lý AI
            if (window.WanderUI && window.WanderUI.trackQuestActivity) {
              window.WanderUI.trackQuestActivity('dailyChat');
            }

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
                // ĐÃ BỎ: Không render discovery carousel trong chat nữa vì gây confuse
                // User ấn vào → gửi message lặp → vòng lặp. Chỉ hiện khi cần thiết.
                // renderDiscoveryCarousel(resData.discoveryPlaces);
            }

            if (resData.suggestedTours && resData.suggestedTours.length > 0) {
                console.log("Rendering Tour Carousel with", resData.suggestedTours.length, "tours");
                renderTourCarousel(resData.suggestedTours);
            }

            // Render suggestedLink: nút mở link trực tiếp khi tour không có trong DB
            if (resData.suggestedLink) {
                const linkWrap = document.createElement('div');
                linkWrap.style.cssText = 'margin: 12px 0; text-align: center;';
                const btn = document.createElement('a');
                btn.href = resData.suggestedLink.url;
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.style.cssText = `
                    display: inline-block;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #f43f5e, #e11d48);
                    color: #fff;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    text-decoration: none;
                    box-shadow: 0 4px 15px rgba(244,63,94,0.3);
                    transition: transform 0.2s, box-shadow 0.2s;
                `;
                btn.textContent = resData.suggestedLink.label || '🔗 Xem thêm';
                btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 6px 20px rgba(244,63,94,0.4)'; };
                btn.onmouseout = () => { btn.style.transform = 'none'; btn.style.boxShadow = '0 4px 15px rgba(244,63,94,0.3)'; };
                linkWrap.appendChild(btn);
                log.appendChild(linkWrap);
                scrollToBottom();
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
        btn.onclick = () => {
            btn.textContent = '🚀 Đang chuyển hướng...';
            btn.disabled = true;

            // Thoát fullscreen nếu có
            if (panel.classList.contains('chat-panel--fullscreen')) {
                panel.classList.remove('chat-panel--fullscreen');
                fabWrap.classList.remove('is-fullscreen');
                const expandBtn = document.getElementById('global-chat-expand-btn');
                if (expandBtn) { expandBtn.textContent = '⛶'; expandBtn.title = 'Phóng to toàn màn hình'; }
            }

            // Đóng panel chat
            if (typeof togglePanel === 'function') {
                togglePanel();
            }

            // Chuyển hướng trực tiếp sang AI Assistant
            window.location.href = `/planner.html?view=true&itinId=${proposal._id}`;
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
                <div class="chat-discovery-img" style="width: 100%; height: 90px; min-height: 90px; flex-shrink: 0; background-image:url('${p.image || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'}'); background-size: cover; background-position: center;"></div>
                <div class="chat-discovery-info" style="padding: 10px; flex: 1; display: flex; flex-direction: column;">
                    <div class="chat-discovery-name" style="font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${p.name}</div>
                    <div class="chat-discovery-loc" style="font-size: 0.7rem; color: #94a3b8; margin-top: auto;">📍 ${p.region || 'Việt Nam'}</div>
                </div>
            `;
            card.onclick = () => {
                if (p.externalUrl) {
                    window.open(p.externalUrl, '_blank');
                    return;
                }
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
                <div class="chat-tour-img" style="width: 100%; height: 130px; min-height: 130px; flex-shrink: 0; background-image:url('${t.images?.[0] || t.image || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'}'); background-size: cover; background-position: center; position: relative;">
                    <div class="chat-tour-badge" style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #f43f5e, #e11d48); color: #fff; font-size: 0.7rem; font-weight: 800; padding: 4px 8px; border-radius: 8px; box-shadow: 0 4px 10px rgba(244,63,94,0.3);">${t.isTour ? 'TOUR' : (t.kind === 'khach-san' || t.businessCategory === 'stay' ? 'KHÁCH SẠN' : (t.kind === 'nha-hang' || t.businessCategory === 'dining' ? 'NHÀ HÀNG' : 'DỊCH VỤ'))}</div>
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
                if (t.externalUrl) {
                    window.open(t.externalUrl, '_blank');
                    return;
                }
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
        container.className = 'chat-proposals-container';
        container.style.cssText = 'margin: 8px 0; max-width: 100%; box-sizing: border-box;';

        // Tiêu đề với icon
        const title = document.createElement('div');
        title.style.cssText = 'font-size:0.62rem; color:#10b981; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:10px; display:flex; align-items:center; gap:6px;';
        title.innerHTML = `<span style="width:14px;height:14px;background:#10b981;border-radius:50%;display:inline-block;"></span> Gợi ý lịch trình`;
        container.appendChild(title);

        // Grid wrapper
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; width: 100%; box-sizing: border-box;';

        proposals.forEach((p, idx) => {
            const card = document.createElement('div');
            card.style.cssText = `
                display: flex;
                flex-direction: column;
                background: rgba(10, 18, 28, 0.8);
                border: 1px solid rgba(16,185,129,0.15);
                border-radius: 16px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                animation: fadeInUp 0.4s ease ${idx * 0.1}s both;
                overflow: hidden;
                position: relative;
            `;

            // Gradient accent top
            const accentTop = document.createElement('div');
            accentTop.style.cssText = 'position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg, #10b981, #34d399, #10b981); z-index:1;';
            card.appendChild(accentTop);

            // Hình ảnh minh họa
            const imgSrc = p.image || getDestinationImage(p.destination || p.title || '');
            const imgWrap = document.createElement('div');
            imgWrap.style.cssText = 'width:100%; height:90px; position:relative; overflow:hidden;';
            imgWrap.innerHTML = `
                <img src="${imgSrc}" alt="${p.title || p.destination || ''}"
                     style="width:100%; height:100%; object-fit:cover; transition: transform 0.4s;"
                     onerror="this.src='https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'; this.parentElement.style.height='70px'">
                <div style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 40%, rgba(10,18,28,0.85) 100%);"></div>
                <div style="position:absolute; bottom:6px; left:8px; right:8px; display:flex; gap:4px; flex-wrap:wrap;">
                    <span style="font-size:0.58rem; background:rgba(16,185,129,0.85); color:#fff; padding:2px 8px; border-radius:10px; font-weight:700;">📅 ${p.days}N</span>
                    <span style="font-size:0.58rem; background:rgba(0,0,0,0.6); color:#fff; padding:2px 8px; border-radius:10px; font-weight:700;">📍 ${p.destination || 'VN'}</span>
                </div>
            `;
            card.appendChild(imgWrap);

            // Nội dung
            const content = document.createElement('div');
            content.style.cssText = 'padding:10px 12px 8px; display:flex; flex-direction:column; gap:6px;';

            // Title
            const titleEl = document.createElement('div');
            titleEl.style.cssText = 'font-size:0.78rem; font-weight:700; color:#fff; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;';
            titleEl.textContent = p.title || `Phương án ${idx + 1}`;
            content.appendChild(titleEl);

            // Tags row
            const tags = document.createElement('div');
            tags.style.cssText = 'display:flex; gap:4px; flex-wrap:wrap;';
            if (p.budget) {
                tags.innerHTML = `<span style="font-size:0.6rem; color:#f59e0b; font-weight:700;">💰 ${p.budget}</span>`;
            }
            if (p.style) {
                tags.innerHTML += `<span style="font-size:0.6rem; color:#94a3b8; font-weight:500;">🎒 ${p.style}</span>`;
            }
            content.appendChild(tags);

            card.appendChild(content);

            // Hover effects
            card.onmouseover = () => {
                card.style.background = 'rgba(16,185,129,0.1)';
                card.style.borderColor = 'rgba(16,185,129,0.4)';
                card.style.transform = 'translateY(-3px) scale(1.02)';
                card.style.boxShadow = '0 12px 30px rgba(16,185,129,0.2), 0 0 0 1px rgba(16,185,129,0.1)';
                const img = card.querySelector('img');
                if (img) img.style.transform = 'scale(1.08)';
            };
            card.onmouseout = () => {
                card.style.background = 'rgba(10, 18, 28, 0.8)';
                card.style.borderColor = 'rgba(16,185,129,0.15)';
                card.style.transform = 'none';
                card.style.boxShadow = 'none';
                const img = card.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
            };

            card.onclick = () => {
                if (panel.classList.contains('chat-panel--fullscreen')) {
                    panel.classList.remove('chat-panel--fullscreen');
                    fabWrap.classList.remove('is-fullscreen');
                }
                if (typeof togglePanel === 'function') togglePanel();
                window.location.href = `/planner.html?view=true&itinId=${p._id}`;
            };

            grid.appendChild(card);
        });

        container.appendChild(grid);
        log.appendChild(container);
        scrollToBottom();
    }

    // Helper: get destination image - accurate matching for each destination
    function getDestinationImage(destination) {
        const dest = (destination || '').toLowerCase().trim();
        
        // Image map - each destination has unique accurate image
        const imgMap = {
            // === TÂY BẮC ===
            'sapa': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop', // terraced rice fields
            'sa pa': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop',
            'lào cai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop',
            'hà giang': 'https://images.unsplash.com/photo-1563190095-2296374d5d20?w=400&h=300&fit=crop', // ha giang winding road
            'yên bái': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop', // yen bai terraced fields
            'mai châu': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop', // mai chau
            'mộc châu': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'điện biên': 'https://images.unsplash.com/photo-1562783700-74fc9d4e1b83?w=400&h=300&fit=crop',
            'lai châu': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'sơn la': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'tuyên quang': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'hoà bình': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            
            // === ĐÔNG BẮC ===
            'quảng ninh': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop', // ha long bay
            'hạ long': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop',
            'hải phòng': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop',
            'bắc ninh': 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop',
            'bắc kạn': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'cao bằng': 'https://images.unsplash.com/photo-1563190095-2296374d5d20?w=400&h=300&fit=crop',
            'lạng sơn': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            
            // === ĐỒNG BẰNG BẮC BỘ ===
            'hà nội': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07d?w=400&h=300&fit=crop', // hanoi old quarter
            'hải dương': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'hưng yên': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'thái bình': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'nam định': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'ninh bình': 'https://images.unsplash.com/photo-1505881402582-c5bc11054f91?w=400&h=300&fit=crop', // tam coc boat
            'thanh hóa': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            'nghệ an': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            'hà tĩnh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            
            // === BẮC TRUNG BỘ ===
            'quảng bình': 'https://images.unsplash.com/photo-1505881402582-c5bc11054f91?w=400&h=300&fit=crop', // phong nha cave
            'quảng trị': 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop',
            'thừa thiên huế': 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop', // hue imperial
            'huế': 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop',
            'đà nẵng': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop', // danang dragon bridge
            'quảng nam': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop',
            
            // === NAM TRUNG BỘ ===
            'quảng ngãi': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'bình định': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'phú yên': 'https://images.unsplash.com/photo-1573465542326-53c4f6b86dcd?w=400&h=300&fit=crop',
            'khánh hòa': 'https://images.unsplash.com/photo-1573465542326-53c4f6b86dcd?w=400&h=300&fit=crop', // nha trang beach
            'nha trang': 'https://images.unsplash.com/photo-1573465542326-53c4f6b86dcd?w=400&h=300&fit=crop',
            'bình thuận': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
            'phú quốc': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', // phu quoc beach
            'bà rịa': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'vũng tàu': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            
            // === TÂY NGUYÊN ===
            'đắk lắk': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop', // highlands coffee
            'đắk nông': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop',
            'lâm đồng': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop', // da lat
            'đà lạt': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop',
            'gia lai': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop',
            'kon tum': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop',
            
            // === ĐÔNG NAM BỘ ===
            'hồ chí minh': 'https://images.unsplash.com/photo-1550807002-6c2e4d8f0f3e?w=400&h=300&fit=crop', // saigon
            'tp hcm': 'https://images.unsplash.com/photo-1550807002-6c2e4d8f0f3e?w=400&h=300&fit=crop',
            'bình dương': 'https://images.unsplash.com/photo-1550807002-6c2e4d8f0f3e?w=400&h=300&fit=crop',
            'đồng nai': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            'tây ninh': 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop',
            
            // === ĐỒNG BẰNG SÔNG CỬU LONG ===
            'cần thơ': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop', // floating market
            'đồng tháp': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop', // lotus fields
            'an giang': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop', // tra su forest
            'kiên giang': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
            'hậu giang': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop',
            'tiền giang': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop',
            'bến tre': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop', // coconut
            'trà vinh': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop',
            'vĩnh long': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop',
            'sóc trăng': 'https://images.unsplash.com/photo-1558362477-2d6482e7d7c5?w=400&h=300&fit=crop',
            'bạc liêu': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
            'cà mau': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop', // cajeput forest
            'hội an': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop', // hoi an lanterns
            'bình phước': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop',
        };

        // Try exact and partial match
        for (const key of Object.keys(imgMap)) {
            if (dest === key || dest.includes(key) || key.includes(dest)) {
                return imgMap[key];
            }
        }
        
        // Fallback
        return 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop';
    }

    function renderItineraryCard(itin) {
        const card = document.createElement('div');
        card.style.cssText = 'background:rgba(10,18,28,0.85); border:1px solid rgba(16,185,129,0.15); border-radius:16px; margin:8px 0; animation:fadeInUp 0.4s ease; overflow:hidden; position:relative;';

        // Gradient accent top
        const accentTop = document.createElement('div');
        accentTop.style.cssText = 'position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg, #10b981, #34d399, #10b981); z-index:2;';
        card.appendChild(accentTop);

        // Hero image
        const heroImg = document.createElement('div');
        const heroSrc = itin.heroImage || getDestinationImage(itin.destination || '');
        heroImg.style.cssText = 'width:100%; height:120px; position:relative; overflow:hidden;';
        heroImg.innerHTML = `
            <img src="${heroSrc}" alt="${itin.destination || ''}"
                 style="width:100%; height:100%; object-fit:cover;"
                 onerror="this.src='https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'; this.parentElement.style.height='80px'">
            <div style="position:absolute; inset:0; background:linear-gradient(180deg, transparent 30%, rgba(10,18,28,0.9) 100%);"></div>
            <div style="position:absolute; top:12px; left:12px; right:12px; display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="background:linear-gradient(135deg,#10b981,#059669); color:#fff; font-size:0.62rem; font-weight:800; padding:3px 10px; border-radius:10px; display:inline-block; margin-bottom:4px;">📍 ${itin.destination || 'Việt Nam'}</div>
                    <div style="font-size:0.7rem; color:#fff; font-weight:700; text-shadow:0 1px 4px rgba(0,0,0,0.5);">${itin.days || 3} ngày · ${itin.estimatedCost || ''}</div>
                </div>
            </div>
        `;
        card.appendChild(heroImg);

        // Summary
        if (itin.tripSummary) {
            const summary = document.createElement('div');
            summary.style.cssText = 'padding:8px 14px 0; font-size:0.72rem; color:#94a3b8; line-height:1.5;';
            summary.textContent = itin.tripSummary;
            card.appendChild(summary);
        }

        // Days
        const daysWrap = document.createElement('div');
        daysWrap.style.cssText = 'display:flex; flex-direction:column; gap:4px; padding:10px 14px;';
        (itin.itinerary || []).forEach((day) => {
            const topAct = (day.activities || [])[0];
            const dayEl = document.createElement('div');
            dayEl.style.cssText = 'display:flex; align-items:center; gap:10px; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:10px; border-left:3px solid #10b981; transition:all 0.2s;';
            dayEl.innerHTML = `
                <div style="width:28px; height:28px; min-width:28px; background:linear-gradient(135deg,#10b981,#059669); border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:0.65rem;">${day.day}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-size:0.72rem; color:#fff; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${topAct ? (topAct.task || topAct.name || '') : (day.title || day.subtitle || `Ngày ${day.day}`)}</div>
                    ${topAct && topAct.location ? `<div style="font-size:0.62rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📍 ${topAct.location}</div>` : ''}
                </div>
                ${topAct && topAct.time ? `<div style="font-size:0.6rem; color:#10b981; font-weight:700; white-space:nowrap;">⏱ ${topAct.time}</div>` : ''}
            `;
            dayEl.onmouseover = () => { dayEl.style.background = 'rgba(16,185,129,0.1)'; dayEl.style.borderColor = '#34d399'; };
            dayEl.onmouseout = () => { dayEl.style.background = 'rgba(255,255,255,0.03)'; dayEl.style.borderColor = '#10b981'; };
            daysWrap.appendChild(dayEl);
        });
        card.appendChild(daysWrap);

        // Actions
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex; gap:5px;';
        actions.innerHTML = `
            <button class="btn-save-itin" style="flex:1; padding:7px; border-radius:8px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); color:#10b981; font-size:0.65rem; font-weight:700; cursor:pointer;">💾 Lưu</button>
            <button class="btn-export-itin" style="flex:1; padding:7px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#94a3b8; font-size:0.65rem; font-weight:700; cursor:pointer;">📋 Copy</button>
            <button class="btn-view-detail" style="flex:2; padding:7px; border-radius:8px; background:linear-gradient(135deg,#10b981,#059669); border:none; color:#fff; font-size:0.65rem; font-weight:800; cursor:pointer;">⚡ Chi tiết →</button>
        `;
        card.appendChild(actions);

        // Sync
        if (window.location.pathname.includes('planner.html') && window.WanderPlanner) {
            const placeholder = document.getElementById('resultPlaceholder');
            const resultContainer = document.getElementById('timelineResult');
            const refineBox = document.getElementById('refineBox');
            if (placeholder) placeholder.style.display = 'none';
            if (resultContainer) resultContainer.style.display = 'block';
            if (refineBox) refineBox.style.display = 'block';
            if (typeof window.WanderPlanner.renderItinerary === 'function') {
                window.WanderPlanner.renderItinerary(itin, itin.destination || 'Điểm đến', itin.days || 3, '');
            }
        }

        actions.querySelector('.btn-save-itin').onclick = async (e) => {
            e.stopPropagation();
            const token = localStorage.getItem('wander_token');
            if (!token) { if (window.WanderUI) WanderUI.showToast('Đăng nhập để lưu!', 'warning'); return; }
            const btn = actions.querySelector('.btn-save-itin');
            btn.textContent = '⏳...'; btn.disabled = true;
            try {
                const res = await fetch('/api/planner/save', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify({ planJson: itin, destination: itin.destination, days: itin.days }) });
                const d = await res.json();
                btn.textContent = d.success ? '✅' : '💾';
                btn.disabled = false;
            } catch(e) { btn.textContent = '💾'; btn.disabled = false; }
        };

        actions.querySelector('.btn-export-itin').onclick = (e) => {
            e.stopPropagation();
            let text = `📍 ${itin.destination} - ${itin.days}N\n💰 ${itin.estimatedCost || ''}\n\n`;
            (itin.itinerary || []).forEach(day => {
                text += `📅 Ngày ${day.day}${day.title ? ` (${day.title})` : ''}\n`;
                (day.activities || []).forEach(a => { text += `  • ${a.time || ''} ${a.task || a.name || ''}${a.location ? ` - ${a.location}` : ''}\n`; });
            });
            navigator.clipboard?.writeText(text).then(() => { if (window.WanderUI) WanderUI.showToast('Đã sao chép!', 'success'); });
        };

        actions.querySelector('.btn-view-detail').onclick = (e) => {
            e.stopPropagation();
            if (panel.classList.contains('chat-panel--fullscreen')) {
                panel.classList.remove('chat-panel--fullscreen');
                fabWrap.classList.remove('is-fullscreen');
            }
            if (typeof togglePanel === 'function') togglePanel();
            window.location.href = `/planner.html?view=true&itinId=${itin._id || 'new'}`;
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
      togglePlanningMode: togglePlanningMode,
      sendQuickQuery: sendQuickQuery,
      sendMessage: async (text) => {
        if (!text) return;
        
        // Trigger the form submission logic synthetically
        const form = document.getElementById('global-chat-form');
        const input = document.getElementById('global-chat-input');
        if (input) input.value = text;
        if (form) form.dispatchEvent(new Event('submit'));
      }
    };
    // Expose for inline onclick handlers
    window.togglePlanningMode = togglePlanningMode;
    window.sendQuickQuery = sendQuickQuery;
    window.toggleQuickQueryPanel = toggleQuickQueryPanel;
    window.clearQuickQuery = clearQuickQuery;
    window.submitQuickQuery = submitQuickQuery;
    window.openPlanningForm = openPlanningForm;
    window.closePlanningForm = closePlanningForm;
    window.submitPlanningForm = submitPlanningForm;
    window.injectPlanningFormToChat = injectPlanningFormToChat;
    
    // Quick Query Panel Functions
    function toggleQuickQueryPanel() {
      const panel = document.getElementById('quick-query-panel');
      if (!panel) return;
      
      if (panel.style.display === 'none') {
        panel.style.display = 'block';
        scrollToBottom();
      } else {
        panel.style.display = 'none';
      }
    }
    
    function clearQuickQuery() {
      const panel = document.getElementById('quick-query-panel');
      if (!panel) return;
      panel.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.checked = false;
      });
    }
    
    function submitQuickQuery() {
      const selections = [];
      
      // Single select (radio)
      const radioGroups = ['qq-budget', 'qq-duration', 'qq-style'];
      radioGroups.forEach(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        if (checked) selections.push(checked.value);
      });
      
      // Multi select (checkbox)
      const checkboxGroups = ['qq-place', 'qq-activity', 'qq-food'];
      checkboxGroups.forEach(name => {
        const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
        if (checked.length > 0) {
          const values = Array.from(checked).map(c => c.value);
          selections.push(values.join(', '));
        }
      });
      
      if (selections.length === 0) {
        if (window.WanderUI) WanderUI.showToast('Vui lòng chọn ít nhất một tiêu chí', 'warning');
        return;
      }
      
      const query = 'Tôi muốn du lịch ' + selections.join('; ');
      const input = document.getElementById('global-chat-input');
      const form = document.getElementById('global-chat-form');
      
      if (input && form) {
        input.value = query;
        form.dispatchEvent(new Event('submit'));
      }
      
      // Close panel
      const panel = document.getElementById('quick-query-panel');
      if (panel) panel.style.display = 'none';
    }
    
    // Inject planning form directly into chat
    function injectPlanningFormToChat() {

      const introText = 'Bạn muốn lập lịch trình du lịch? Điền thông tin bên dưới để mình giúp bạn nhé!';
      appendMsg(introText + ' [PLANNING_FORM]', 'bot');
    }
    
    // Planning Form Functions
    function openPlanningForm() {
      // Inject form into chat instead of showing panel
      injectPlanningFormToChat();
    }
    
    function closePlanningForm() {
      const panel = document.getElementById('planning-form-panel');
      if (panel) panel.style.display = 'none';
      
      // Reset form
      const destInput = document.getElementById('plan-destination');
      const noteInput = document.getElementById('plan-note');
      if (destInput) destInput.value = '';
      if (noteInput) noteInput.value = '';
      
      const panel2 = document.getElementById('planning-form-panel');
      if (panel2) {
        panel2.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
          input.checked = false;
        });
      }
    }
    
    // Tạo form lập lịch inline trong chat - Professional Design (Theme-aware)
    function createInlinePlanningForm() {
      return `
        <div class="inline-plan-form" id="inline-plan-form">
          <div class="plan-form-header">
            <div class="plan-form-icon">🗺️</div>
            <div class="plan-form-title">
              <span>Lập lịch trình nhanh</span>
              <small>Điền thông tin để mình lên kế hoạch cho bạn</small>
            </div>
          </div>
          
          <div class="plan-form-body">
            <!-- Điểm đến -->
            <div class="plan-field">
              <label class="plan-label">
                <span class="plan-label-icon">📍</span>
                <span>Điểm đến</span>
              </label>
              <div class="plan-input-wrapper">
                <input type="text" id="inline-plan-dest" class="plan-text-input" placeholder="VD: Đà Nẵng, Sài Gòn, Phú Quốc...">
              </div>
            </div>
            
            <!-- Thời gian -->
            <div class="plan-field">
              <label class="plan-label">
                <span class="plan-label-icon">📅</span>
                <span>Thời gian</span>
              </label>
              <div class="plan-chips">
                <label class="plan-chip"><input type="radio" name="inline-duration" value="Nửa ngày"><span>Nửa ngày</span></label>
                <label class="plan-chip"><input type="radio" name="inline-duration" value="1 ngày"><span>1 ngày</span></label>
                <label class="plan-chip"><input type="radio" name="inline-duration" value="2-3 ngày"><span>2-3 ngày</span></label>
                <label class="plan-chip"><input type="radio" name="inline-duration" value="4-5 ngày"><span>4-5 ngày</span></label>
                <label class="plan-chip"><input type="radio" name="inline-duration" value="6-7 ngày"><span>6-7 ngày</span></label>
              </div>
            </div>
            
            <!-- Ngân sách -->
            <div class="plan-field">
              <label class="plan-label">
                <span class="plan-label-icon">💰</span>
                <span>Ngân sách</span>
              </label>
              <div class="plan-chips">
                <label class="plan-chip"><input type="radio" name="inline-budget" value="Dưới 1 triệu"><span>Dưới 1M</span></label>
                <label class="plan-chip"><input type="radio" name="inline-budget" value="1-3 triệu"><span>1-3M</span></label>
                <label class="plan-chip"><input type="radio" name="inline-budget" value="3-5 triệu"><span>3-5M</span></label>
                <label class="plan-chip"><input type="radio" name="inline-budget" value="5-10 triệu"><span>5-10M</span></label>
                <label class="plan-chip"><input type="radio" name="inline-budget" value="Trên 10 triệu"><span>10M+</span></label>
              </div>
            </div>
            
            <!-- Đi cùng - Icon Grid -->
            <div class="plan-field">
              <label class="plan-label">
                <span class="plan-label-icon">👥</span>
                <span>Đi cùng</span>
              </label>
              <div class="plan-companion-grid">
                <label class="plan-companion-card">
                  <input type="radio" name="inline-style" value="Một mình">
                  <div class="companion-icon">🚶</div>
                  <div class="companion-text">Một mình</div>
                </label>
                <label class="plan-companion-card">
                  <input type="radio" name="inline-style" value="Cặp đôi">
                  <div class="companion-icon">💑</div>
                  <div class="companion-text">Cặp đôi</div>
                </label>
                <label class="plan-companion-card">
                  <input type="radio" name="inline-style" value="Gia đình">
                  <div class="companion-icon">👨‍👩‍👧</div>
                  <div class="companion-text">Gia đình</div>
                </label>
                <label class="plan-companion-card">
                  <input type="radio" name="inline-style" value="Nhóm bạn">
                  <div class="companion-icon">👯</div>
                  <div class="companion-text">Nhóm bạn</div>
                </label>
              </div>
            </div>
            
            <!-- Sở thích -->
            <div class="plan-field">
              <label class="plan-label">
                <span class="plan-label-icon">🎯</span>
                <span>Sở thích</span>
                <span class="plan-label-hint">(chọn nhiều)</span>
              </label>
              <div class="plan-chips plan-chips-multiple">
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Biển"><span>🏖️ Biển</span></label>
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Núi"><span>⛰️ Núi</span></label>
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Ẩm thực"><span>🍜 Ăn uống</span></label>
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Check-in"><span>📸 Check-in</span></label>
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Mua sắm"><span>🛍️ Mua sắm</span></label>
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Nghỉ dưỡng"><span>🧖 Spa/Nghỉ dưỡng</span></label>
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Phiêu lưu"><span>🚣 Khám phá</span></label>
                <label class="plan-chip plan-chip-check"><input type="checkbox" name="inline-interest" value="Văn hóa"><span>🏛️ Văn hóa</span></label>
              </div>
            </div>
          </div>
          
          <div class="plan-form-footer">
            <button onclick="submitInlinePlanForm(this)" class="plan-submit-btn">
              <span>✨</span> Tạo lịch trình
            </button>
          </div>
        </div>
        <style>
          .inline-plan-form {
            margin-top: 16px;
            background: var(--bg-elevated, #ffffff);
            border: 1px solid rgba(2, 132, 199, 0.15);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02) !important;
          }
          
          .plan-form-header {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 20px;
            background: linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%) !important;
            border-bottom: 1px solid rgba(2, 132, 199, 0.12) !important;
          }
          
          .plan-form-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #0284c7, #10b981) !important;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
          }
          
          .plan-form-title {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .plan-form-title span {
            font-weight: 700;
            font-size: 1.1rem;
            color: #0f172a !important; /* Extremely high contrast */
            letter-spacing: -0.01em;
          }
          
          .plan-form-title small {
            font-size: 0.78rem;
            color: #475569 !important; /* highly readable slate text */
            font-weight: 500;
          }
          
          .plan-form-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          
          .plan-field {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .plan-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            color: #334155 !important; /* High contrast field titles */
          }
          
          .plan-label-icon {
            font-size: 0.95rem;
          }
          
          .plan-label-hint {
            font-weight: 500;
            color: #64748b !important;
            font-size: 0.75rem;
            margin-left: 4px;
          }
          
          .plan-input-wrapper {
            position: relative;
          }
          
          .plan-text-input {
            width: 100%;
            padding: 12px 16px;
            background: #ffffff !important;
            border: 1px solid rgba(2, 132, 199, 0.25) !important;
            border-radius: 12px;
            color: #0f172a !important;
            font-size: 0.88rem;
            font-weight: 500;
            transition: all 0.25s ease;
            box-sizing: border-box;
          }
          
          .plan-text-input:focus {
            outline: none;
            border-color: #10b981 !important;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
          }
          
          .plan-text-input::placeholder {
            color: #94a3b8 !important;
          }
          
          .plan-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .plan-chip {
            display: inline-flex;
            padding: 8px 14px;
            background: #ffffff !important;
            border: 1px solid rgba(2, 132, 199, 0.2) !important;
            border-radius: 20px;
            font-size: 0.8rem;
            color: #334155 !important;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
          }
          
          .plan-chip:hover {
            border-color: #10b981 !important;
            color: #047857 !important;
            background: #f0fdf4 !important;
            transform: translateY(-1px);
          }
          
          .plan-chip input {
            display: none;
          }
          
          .plan-chip:has(input:checked) {
            background: linear-gradient(135deg, #0284c7, #10b981) !important;
            border-color: transparent !important;
            color: #ffffff !important;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25) !important;
          }
          
          .plan-chip:has(input:checked) span {
            color: inherit;
          }
          
          /* Companion Grid - Icon Cards */
          .plan-companion-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          
          .plan-companion-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 14px 8px;
            background: #ffffff !important;
            border: 1.5px solid rgba(2, 132, 199, 0.2) !important;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            gap: 8px;
          }
          
          .plan-companion-card:hover {
            border-color: #10b981 !important;
            background: #f0fdf4 !important;
            transform: translateY(-2px);
          }
          
          .plan-companion-card input {
            display: none;
          }
          
          .plan-companion-card:has(input:checked) {
            background: linear-gradient(135deg, #0284c7, #10b981) !important;
            border-color: transparent !important;
            box-shadow: 0 6px 14px rgba(16, 185, 129, 0.25) !important;
          }
          
          .plan-companion-card:has(input:checked) .companion-icon,
          .plan-companion-card:has(input:checked) .companion-text {
            color: #ffffff !important;
          }
          
          .companion-icon {
            font-size: 1.6rem;
            line-height: 1;
          }
          
          .companion-text {
            font-size: 0.72rem;
            font-weight: 700;
            color: #475569 !important;
            text-align: center;
          }
          
          .plan-form-footer {
            padding: 16px 20px;
            background: #fafafa !important;
            border-top: 1px solid rgba(2, 132, 199, 0.12) !important;
          }
          
          .plan-submit-btn {
            width: 100%;
            padding: 14px 24px;
            background: linear-gradient(135deg, #0284c7, #10b981) !important;
            border: none;
            border-radius: 12px;
            color: #ffffff;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }
          
          .plan-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
            filter: brightness(1.05);
          }
          
          .plan-submit-btn:active {
            transform: translateY(0);
          }
          
          /* Dark mode specific overrides for better contrast */
          [data-theme="dark"] .plan-chip {
            background: #1e293b !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            color: #e2e8f0 !important;
          }
          
          [data-theme="dark"] .plan-chip:hover {
            background: rgba(16, 185, 129, 0.12) !important;
            border-color: rgba(16, 185, 129, 0.4) !important;
            color: #34d399 !important;
          }
          
          [data-theme="dark"] .plan-companion-card {
            background: #1e293b !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          
          [data-theme="dark"] .plan-companion-card:hover {
            background: rgba(16, 185, 129, 0.12) !important;
            border-color: rgba(16, 185, 129, 0.4) !important;
          }
          
          [data-theme="dark"] .plan-companion-card:has(input:checked) {
            background: linear-gradient(135deg, #0284c7, #10b981) !important;
            border-color: transparent !important;
          }
          
          [data-theme="dark"] .plan-form-header {
            background: rgba(2, 132, 199, 0.15) !important;
            border-bottom-color: rgba(255, 255, 255, 0.08) !important;
          }
          
          [data-theme="dark"] .plan-form-header .plan-form-title span {
            color: #ffffff !important;
          }
          
          [data-theme="dark"] .plan-form-header .plan-form-title small {
            color: #94a3b8 !important;
          }
          
          [data-theme="dark"] .plan-form-body .plan-label {
            color: #cbd5e1 !important;
          }
          
          [data-theme="dark"] .plan-text-input {
            background: #0f172a !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
          }
          
          [data-theme="dark"] .plan-form-footer {
            background: #0f172a !important;
            border-top-color: rgba(255, 255, 255, 0.08) !important;
          }
          
          /* Responsive */
          @media (max-width: 480px) {
            .plan-form-header {
              padding: 14px 16px;
            }
            .plan-form-body {
              padding: 16px;
            }
            .plan-chip {
              padding: 6px 12px;
              font-size: 0.75rem;
            }
          }
        </style>
      `;
    }
    
    // Submit form lập lịch inline trong chat
    window.submitInlinePlanForm = function(btn) {

      
      // Đánh dấu là submit từ form để tránh keyword detection trigger lại
      window._fromPlanningForm = true;
      
      const form = btn.closest('.inline-plan-form');

      
      if (!form) return;
      
      const dest = form.querySelector('#inline-plan-dest')?.value.trim();
      const duration = form.querySelector('input[name="inline-duration"]:checked')?.value;
      const budget = form.querySelector('input[name="inline-budget"]:checked')?.value;
      const style = form.querySelector('input[name="inline-style"]:checked')?.value;
      const interests = Array.from(form.querySelectorAll('input[name="inline-interest"]:checked')).map(c => c.value);
      

      
      if (!dest) {
        form.querySelector('#inline-plan-dest').focus();
        return;
      }
      
      let prompt = `Lập lịch trình du lịch:\n• Điểm đến: ${dest}`;
      if (duration) prompt += `\n• Thời gian: ${duration}`;
      if (budget) prompt += `\n• Ngân sách: ${budget}/người`;
      if (style) prompt += `\n• Đi cùng: ${style}`;
      if (interests.length > 0) prompt += `\n• Sở thích: ${interests.join(', ')}`;
      
      // Tìm và xóa message row chứa form
      const msgRow = form.closest('.chat-message-row');

      
      if (msgRow) {
        msgRow.remove();

      } else {
        // Không tìm thấy row, xóa form trực tiếp
        form.remove();

      }
      
      // Kiểm tra form còn tồn tại không
      const formStillExists = !!document.querySelector('.inline-plan-form');

      

      
      const input = document.getElementById('global-chat-input');
      const chatForm = document.getElementById('global-chat-form');
      if (input && chatForm) {
        input.value = prompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    };
    
    function submitPlanningForm() {
      // Gather all inputs
      const destination = document.getElementById('plan-destination')?.value.trim();
      const budget = document.querySelector('input[name="plan-budget"]:checked')?.value;
      const duration = document.querySelector('input[name="plan-duration"]:checked')?.value;
      const interests = Array.from(document.querySelectorAll('input[name="plan-interest"]:checked')).map(c => c.value);
      const style = document.querySelector('input[name="plan-style"]:checked')?.value;
      const note = document.getElementById('plan-note')?.value.trim();
      
      // Validation
      if (!destination) {
        if (window.WanderUI) WanderUI.showToast('Vui lòng nhập điểm đến', 'warning');
        document.getElementById('plan-destination')?.focus();
        return;
      }
      
      // Build prompt - clean and natural
      let prompt = `Lập lịch trình du lịch cho tôi:\n`;
      prompt += `• Điểm đến: ${destination}\n`;
      if (duration) prompt += `• Thời gian: ${duration}\n`;
      if (budget) prompt += `• Ngân sách: ${budget}/người\n`;
      if (style) prompt += `• Đi cùng: ${style}\n`;
      if (interests.length > 0) prompt += `• Sở thích: ${interests.join(', ')}\n`;
      if (note) prompt += `• Yêu cầu: ${note}`;
      
      // Close form
      closePlanningForm();
      
      // Send to chat
      const input = document.getElementById('global-chat-input');
      const form = document.getElementById('global-chat-form');
      
      if (input && form) {
        input.value = prompt;
        form.dispatchEvent(new Event('submit'));
      }
    }
    
    function scrollToBottom() {
      const log = document.getElementById('global-chat-log');
      if (log) log.scrollTop = log.scrollHeight;
    }
    
    // Compatibility alias for chat-brain.js
    window.displayAIMessage = (data) => {
      if (typeof data === 'string') {
        appendMsg(data, 'bot');
      } else if (data && data.answer) {
        appendMsg(data.answer, 'bot');
        if (data.proposal) renderProposalCard(data.proposal);
        if (data.itineraryCard) renderItineraryCard(data.itineraryCard);
        if (data.proposals) renderProposalOptions(data.proposals);
        if (data.discoveryPlaces) {
            // ĐÃ BỎ: Không render discovery carousel — gây confuse và lặp
        }
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
    // OTP-based Password Change Flow
    const step1El = document.querySelector('[data-pwd-step="1"]');
    const otpForm = document.querySelector('[data-pwd-otp-form]');
    const requestOtpBtn = document.querySelector('[data-pwd-request-otp]');
    const backStep1Btn = document.querySelector('[data-pwd-back-step1]');
    const resendOtpBtn = document.querySelector('[data-pwd-resend-otp]');
    const msgStep1 = document.querySelector('[data-pwd-msg-step1]');
    const msgOtp = document.querySelector('[data-pwd-msg-otp]');

    function showPwdMsg(el, text, isOk) {
      if (!el) return;
      el.textContent = text || '';
      el.style.color = isOk ? 'var(--success, #22c55e)' : 'var(--danger, #f87171)';
    }

    function getUserEmail() {
      try {
        const sess = JSON.parse(localStorage.getItem('wander_session') || '{}');
        if (sess && sess.email) return sess.email;
        const user = JSON.parse(localStorage.getItem('wander_user') || '{}');
        if (user && user.email) return user.email;
        return '';
      } catch (e) { return ''; }
    }

    async function sendPwdOtp(targetMsgEl) {
      const msgEl = targetMsgEl || msgStep1;
      const email = getUserEmail();
      if (!email) {
        showPwdMsg(msgEl, 'Không tìm thấy email tài khoản. Vui lòng đăng nhập lại.', false);
        return false;
      }
      showPwdMsg(msgEl, 'Đang gửi mã OTP...', true);
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, purpose: 'forgot_password', portal: 'user' })
        });

        if (res.status === 429) {
          showPwdMsg(msgEl, 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.', false);
          return false;
        }

        const json = await res.json();
        if (json.success) {
          const hint = json.otp ? ` (Mã test: ${json.otp})` : '';
          showPwdMsg(msgEl, `Mã OTP đã gửi đến ${email}.${hint}`, true);
          return true;
        } else {
          showPwdMsg(msgEl, json.message || 'Không thể gửi mã OTP.', false);
          return false;
        }
      } catch (err) {
        showPwdMsg(msgEl, 'Lỗi kết nối máy chủ.', false);
        return false;
      }
    }

    if (requestOtpBtn) {
      requestOtpBtn.onclick = async () => {
        setButtonLoading(requestOtpBtn, true);
        const ok = await sendPwdOtp(msgStep1);
        setButtonLoading(requestOtpBtn, false);
        if (ok && step1El && otpForm) {
          step1El.hidden = true;
          otpForm.hidden = false;
          otpForm.reset();
          if (msgOtp) msgOtp.textContent = '';
          const otpInput = otpForm.querySelector('input[name="otp"]');
          if (otpInput) otpInput.focus();
        }
      };
    }

    if (backStep1Btn) {
      backStep1Btn.onclick = () => {
        if (step1El) step1El.hidden = false;
        if (otpForm) otpForm.hidden = true;
        showPwdMsg(msgStep1, '', true);
      };
    }

    if (resendOtpBtn) {
      resendOtpBtn.onclick = async () => {
        setButtonLoading(resendOtpBtn, true);
        await sendPwdOtp(msgOtp);
        setButtonLoading(resendOtpBtn, false);
      };
    }

    if (otpForm) {
      otpForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = otpForm.querySelector('button[type="submit"]');
        const fd = new FormData(otpForm);
        const otp = String(fd.get('otp') || '').trim();
        const newPassword = String(fd.get('newPassword') || '');
        const confirmPassword = String(fd.get('confirmPassword') || '');

        if (otp.length !== 6) {
          showPwdMsg(msgOtp, 'Mã OTP phải chứa đúng 6 chữ số.', false);
          return;
        }
        if (newPassword.length < 6) {
          showPwdMsg(msgOtp, 'Mật khẩu mới phải có ít nhất 6 ký tự.', false);
          return;
        }
        if (newPassword !== confirmPassword) {
          showPwdMsg(msgOtp, 'Mật khẩu xác nhận không khớp.', false);
          return;
        }

        const email = getUserEmail();
        if (!email) {
          showPwdMsg(msgOtp, 'Không tìm thấy email tài khoản.', false);
          return;
        }

        setButtonLoading(submitBtn, true);
        showPwdMsg(msgOtp, '', true);
        try {
          const res = await fetch('/api/auth/reset-password-with-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, password: newPassword, portal: 'user' })
          });
          const json = await res.json();
          if (json.success) {
            showToast('Đổi mật khẩu thành công!', 'success');
            otpForm.reset();
            otpForm.hidden = true;
            if (step1El) step1El.hidden = false;
            showPwdMsg(msgStep1, '', true);
          } else {
            showPwdMsg(msgOtp, json.message || 'Mã OTP không đúng hoặc đã hết hạn.', false);
          }
        } catch (err) {
          showPwdMsg(msgOtp, 'Lỗi kết nối máy chủ.', false);
        } finally {
          setButtonLoading(submitBtn, false);
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

      /* ✨ Cute Gradient Back Button inside Floating TOC */
      .floating-toc-back-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        cursor: pointer;
        box-shadow: 0 3px 12px rgba(102, 126, 234, 0.35), 0 1px 3px rgba(0,0,0,0.08);
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
        padding: 0;
        flex-shrink: 0;
      }
      .floating-toc-back-btn .back-btn-sparkle {
        position: absolute;
        top: -1px;
        right: -1px;
        font-size: 8px;
        color: #fbbf24;
        filter: drop-shadow(0 0 2px rgba(251,191,36,0.6));
        animation: sparkle-pulse 2s ease-in-out infinite;
        pointer-events: none;
        z-index: 1;
      }
      @keyframes sparkle-pulse {
        0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
        50% { opacity: 0.5; transform: scale(0.7) rotate(20deg); }
      }
      .floating-toc-back-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .floating-toc-back-btn:hover {
        transform: translateX(-3px) scale(1.12);
        box-shadow: 0 6px 20px rgba(118, 75, 162, 0.45), 0 0 0 3px rgba(102, 126, 234, 0.15);
      }
      .floating-toc-back-btn:hover::before {
        opacity: 1;
      }
      .floating-toc-back-btn svg {
        transition: transform 0.3s ease;
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.15));
      }
      .floating-toc-back-btn:hover svg {
        transform: translateX(-2px);
      }
      .floating-toc-back-btn:active {
        transform: translateX(-2px) scale(0.92);
        transition-duration: 0.1s;
      }
      [data-theme="dark"] .floating-toc-back-btn {
        background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);
        box-shadow: 0 3px 12px rgba(124, 58, 237, 0.4), 0 1px 3px rgba(0,0,0,0.2);
      }
      [data-theme="dark"] .floating-toc-back-btn:hover {
        box-shadow: 0 6px 20px rgba(219, 39, 119, 0.5), 0 0 0 3px rgba(124, 58, 237, 0.2);
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

  function viewImage(url) {
    let overlay = document.getElementById('wv-image-viewer');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'wv-image-viewer';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;cursor:zoom-out;padding:20px;transition:opacity 0.3s ease;';
      overlay.innerHTML = `
        <img id="wv-image-viewer-img" src="" style="max-width:100%; max-height:100%; border-radius:12px; box-shadow:0 30px 60px rgba(0,0,0,0.6); object-fit:contain; transform:scale(0.9); transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
        <button style="position:absolute; top:24px; right:24px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:48px; height:48px; border-radius:50%; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.15); transition:all 0.2s;">✕</button>
      `;
      overlay.onclick = () => {
        overlay.style.opacity = '0';
        document.getElementById('wv-image-viewer-img').style.transform = 'scale(0.9)';
        setTimeout(() => overlay.style.display = 'none', 300);
      };
      document.body.appendChild(overlay);
    }
    const img = document.getElementById('wv-image-viewer-img');
    img.src = url;
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    img.style.transform = 'scale(0.9)';
    
    // Force reflow
    overlay.offsetHeight;
    
    overlay.style.opacity = '1';
    img.style.transform = 'scale(1)';
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

  return { setTheme, toggleTheme, showToast, setButtonLoading, toggleNotificationDrawer, updateNotificationBadge, markAsRead, markAllAsRead, syncAuthUI, forceLogout, toggleUserMenu, openAuthModal, confirm, openPlaceDetail, openBookingDetail, openItineraryDetail, openNotificationDetailModal, getRankBadgeHTML, getRankIcon, getStoreKey, initSettingsHandlers, trackQuestActivity, getQuestActivity, startTopLoader, finishTopLoader, openModal, closeModal, copyToClipboard, viewImage };
})());

