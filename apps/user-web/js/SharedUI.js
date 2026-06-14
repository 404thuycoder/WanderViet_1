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

  // Global image helper fallback
  window.getSafeImage = function(src, fallback) {
    if (!src || src === 'undefined' || src === 'null' || (typeof src === 'string' && src.indexOf('uploads/undefined') !== -1)) {
      return fallback;
    }
    return src;
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
    let url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

    // Intercept Nominatim OpenStreetMap API calls to redirect through our server proxy
    if (url.includes('nominatim.openstreetmap.org')) {
      try {
        const urlObj = new URL(url);
        const searchParams = urlObj.search;
        if (urlObj.pathname.includes('/reverse')) {
          url = `/api/public/geocode/reverse${searchParams}`;
        } else {
          url = `/api/public/geocode/search${searchParams}`;
        }

        if (typeof args[0] === 'string') {
          args[0] = url;
        } else if (args[0] && args[0].url) {
          args[0] = new Request(url, args[0]);
        }
      } catch (e) {
        console.warn('[SharedUI.js] Failed to proxy Nominatim URL:', url, e);
      }
    }

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
        transports: ['polling', 'websocket'],
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
          badge.textContent = '';
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
            <span style="font-weight:700; color:var(--text); font-size:0.95rem;">${esc(displayName)}</span>
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

    // 4. Ưu tiên 1: Nếu đang ở màn hình Kết Quả (show-result đang active) -> Quay lại form / danh sách trước đó
    const plannerContainer = document.querySelector('.planner-container');
    if (plannerContainer && plannerContainer.classList.contains('show-result')) {
      const isViewModeLocal = new URLSearchParams(window.location.search).get('view') === 'true';
      if (isViewModeLocal) {
        window.location.href = 'my-trips.html';
      } else {
        plannerContainer.classList.remove('show-result');
        const plannerFormCard = document.getElementById('plannerFormCard');
        if (plannerFormCard) plannerFormCard.style.display = ''; // Xóa inline style để CSS quản lý
        
        // Ẩn vùng kết quả, hiện placeholder
        const timelineResult = document.getElementById('timelineResult');
        if (timelineResult) timelineResult.style.display = 'none';
        const resultPlaceholder = document.getElementById('resultPlaceholder');
        if (resultPlaceholder) resultPlaceholder.style.display = '';
        
        // Reset container comparison mode
        const timelineContent = document.getElementById('timelineContent');
        if (timelineContent) timelineContent.classList.remove('comparison-mode-active');
      }
      return;
    }

    // 5. Ưu tiên 2: Nếu đang ở tab So Sánh (nhưng không ở kết quả) -> Quay lại tab Lập Lịch
    const stepCompareEl = document.getElementById('stepCompare');
    if (stepCompareEl && stepCompareEl.style.display !== 'none' && stepCompareEl.style.display !== '') {
      const btnModeForm = document.getElementById('btnModeForm');
      if (btnModeForm) {
        btnModeForm.click();
      } else {
        stepCompareEl.style.display = 'none';
        const formStep1 = document.getElementById('formStep1');
        if (formStep1) {
          formStep1.style.display = 'block';
          formStep1.style.display = ''; // Fallback
        }
        const formStepNav = document.getElementById('formStepNav');
        if (formStepNav) formStepNav.style.display = 'flex';
        if (typeof window.switchFormStep === 'function') window.switchFormStep(1);
      }
      return;
    }

    // 6. Ưu tiên 3: Nếu đang ở tab Lập Lịch Bước 2 -> Quay lại Bước 1
    const formStep2 = document.getElementById('formStep2');
    if (formStep2 && (formStep2.style.display === 'block' || formStep2.style.display === 'flex' || (!formStep2.hasAttribute('hidden') && window.getComputedStyle(formStep2).display !== 'none'))) {
      if (typeof window.switchFormStep === 'function') {
        window.switchFormStep(1);
        return;
      }
    }


    // 7. Navigate back in history, or fallback to home page
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
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
             <li><a href="business-directory.html" class="nav-link" data-link="business">🏨 Dịch vụ</a></li>
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
        <div class="modal__inner modal__inner--wide activity-stats-modal" style="max-width: 1050px; width: 95%;">
          <div class="modal__header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 1.25rem 2rem; display: flex; align-items: center; justify-content: space-between;">
            <h2 class="modal__title" style="display: flex; align-items: center; gap: 0.75rem; margin: 0;">
               <span style="font-size: 1.5rem;">📊</span> Báo cáo Hoạt động Doanh nghiệp
            </h2>
            <div style="display: flex; align-items: center; gap: 1rem;">
               <div class="dashboard-tabs-nav">
                  <button type="button" class="dashboard-tab-btn is-active" data-tab-target="overview">📊 Tổng quan</button>
                  <button type="button" class="dashboard-tab-btn" data-tab-target="charts">📈 Phân tích tài chính</button>
                  <button type="button" class="dashboard-tab-btn" data-tab-target="bookings">🧾 Bảng kê Giao dịch</button>
                  <button type="button" class="dashboard-tab-btn" data-tab-target="badges">🏆 Thành tích & ESG</button>
                  <button type="button" class="dashboard-tab-btn" data-tab-target="logs">📜 Audit Trail</button>
               </div>
               <button type="button" class="modal__close" data-modal-close aria-label="Đóng" style="margin: 0;">×</button>
            </div>
          </div>
          <div class="modal__body" style="padding: 2rem; overflow-y: auto; max-height: 80vh;">
            
            <!-- TAB 1: OVERVIEW -->
            <div class="dashboard-tab-panel is-active" data-tab-panel="overview">
               <!-- Cấp bậc thành viên -->
               <div class="corporate-level-card">
                  <div class="level-card-info">
                     <div>
                        <span class="member-tier-badge" id="member-tier-name">Thành viên Khám phá</span>
                        <div class="level-text-large">Cấp độ <span id="member-level-num">--</span></div>
                     </div>
                     <div style="text-align: right;">
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Tích lũy:</span>
                        <div style="font-weight: 700; font-size: 1.15rem; color: var(--accent);" id="member-exp-total">-- XP</div>
                     </div>
                  </div>
                  <div class="level-progress-wrapper">
                     <div class="level-progress-bar">
                        <div class="level-progress-fill" id="member-level-progress" style="width: 0%"></div>
                     </div>
                     <div class="level-progress-labels">
                        <span>Lvl <span id="lbl-curr-lvl">--</span></span>
                        <span id="lbl-xp-remaining">Cần -- XP để lên cấp tiếp theo</span>
                        <span>Lvl <span id="lbl-next-lvl">--</span></span>
                     </div>
                  </div>
               </div>

               <!-- 4 KPI cards -->
               <div class="stats-summary-cards">
                  <div class="stats-card" data-color="indigo">
                     <span class="stats-card__icon">💰</span>
                     <span class="stats-card__label">Tổng chi tiêu du lịch</span>
                     <span class="stats-card__value" data-stat-total-spent>--</span>
                     <div class="stats-card__trend"><span style="color:#10b981">●</span> Tổng giao dịch thực tế</div>
                  </div>
                  <div class="stats-card" data-color="rose">
                     <span class="stats-card__icon">🎫</span>
                     <span class="stats-card__label">Voucher ROI (Tiết kiệm)</span>
                     <span class="stats-card__value" data-stat-savings>--</span>
                     <div class="stats-card__trend"><span style="color:#f43f5e">❤️</span> Ưu đãi đã quy đổi</div>
                  </div>
                  <div class="stats-card" data-color="cyan">
                     <span class="stats-card__icon">🌱</span>
                     <span class="stats-card__label">Giảm phát thải Carbon</span>
                     <span class="stats-card__value" data-stat-carbon>--</span>
                     <div class="stats-card__trend"><span style="font-size:10px">▲</span> Quy đổi chỉ số ESG</div>
                  </div>
                  <div class="stats-card" data-color="amber">
                     <span class="stats-card__icon">📈</span>
                     <span class="stats-card__label">Tỷ lệ hoàn thành (SLA)</span>
                     <span class="stats-card__value" id="data-stat-completion-rate">--</span>
                     <div class="stats-card__trend" style="color:var(--accent); font-weight:600;">Hành trình mục tiêu</div>
                  </div>
               </div>

               <!-- Additional Smart Stats -->
               <div class="extra-stats-section" style="margin-top: 0px;">
                  <h4 style="margin-top: 0px;">💡 Chỉ số Vận hành & Cộng đồng</h4>
                  <div class="extra-stats-grid">
                     <div class="extra-stat-item">
                        <span class="icon">✈️</span>
                        <div class="info">
                           <strong>Chuyến đi đã lên lịch</strong>
                           <span data-stat-trips>--</span>
                        </div>
                     </div>
                     <div class="extra-stat-item">
                        <span class="icon">📝</span>
                        <div class="info">
                           <strong>Đánh giá đã đăng</strong>
                           <span data-stat-reviews>--</span>
                        </div>
                     </div>
                     <div class="extra-stat-item">
                        <span class="icon">🤖</span>
                        <div class="info">
                           <strong>Phiên AI trợ giúp</strong>
                           <span data-stat-chat>--</span>
                        </div>
                     </div>
                     <div class="extra-stat-item">
                        <span class="icon">👥</span>
                        <div class="info">
                           <strong>Bạn bè & Tương tác</strong>
                           <span data-stat-friends-posts>--</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- TAB 2: CHARTS -->
            <div class="dashboard-tab-panel" data-tab-panel="charts" hidden>
               <!-- Dynamic Controls Bar -->
               <div class="dashboard-controls-bar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem; padding:0.75rem 1rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px;">
                 <div class="dashboard-range-selector" style="display:flex; gap:4px; background:rgba(255,255,255,0.04); border-radius:8px; padding:3px; align-items:center;">
                    <button type="button" class="range-btn is-active" data-range="7">7 ngày</button>
                    <div class="range-month-picker-wrap" style="position:relative; display:inline-flex; align-items:center;">
                      <button type="button" class="range-btn" data-range="month" id="btn-range-month" style="padding-right: 24px; position:relative;">Tháng <span id="selected-month-lbl">...</span>
                        <span style="position:absolute; right:8px; top:50%; transform:translateY(-50%); font-size:0.65rem; color:inherit; pointer-events:none;">▼</span>
                      </button>
                      <select id="dashboard-month-select" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; font-size:16px;">
                        <option value="1">Tháng 1</option>
                        <option value="2">Tháng 2</option>
                        <option value="3">Tháng 3</option>
                        <option value="4">Tháng 4</option>
                        <option value="5">Tháng 5</option>
                        <option value="6">Tháng 6</option>
                        <option value="7">Tháng 7</option>
                        <option value="8">Tháng 8</option>
                        <option value="9">Tháng 9</option>
                        <option value="10">Tháng 10</option>
                        <option value="11">Tháng 11</option>
                        <option value="12">Tháng 12</option>
                      </select>
                    </div>
                    <button type="button" class="range-btn" data-range="all">Tất cả</button>
                  </div>
                  <div class="dashboard-metric-selector" style="display:flex; gap:4px; background:rgba(255,255,255,0.04); border-radius:8px; padding:3px;">
                    <button type="button" class="metric-btn is-active" data-metric="spending">💰 Chi tiêu</button>
                    <button type="button" class="metric-btn" data-metric="activity">📊 Hoạt động</button>
                  </div>
                </div>
               <!-- Financial & Operational Charts Grid -->
               <div class="activity-charts-grid">
                  <div class="chart-container">
                     <h4 class="chart-title">📊 Xu hướng chi tiêu & Hoạt động</h4>
                     <div style="flex:1; position:relative;"><canvas id="userActivityChart"></canvas></div>
                  </div>
                  <div class="chart-container">
                     <h4 class="chart-title">🍩 Phân bổ cơ cấu ngân sách (VNĐ)</h4>
                     <div style="flex:1; position:relative;"><canvas id="userCategoryChart"></canvas></div>
                  </div>
                  <div class="chart-container">
                     <h4 class="chart-title">📍 Địa bàn hành trình (Phân bổ vùng)</h4>
                     <div style="flex:1; position:relative;"><canvas id="userRegionChart"></canvas></div>
                  </div>
                  <div class="chart-container">
                     <h4 class="chart-title">🕸️ Ma trận năng lực di chuyển</h4>
                     <div style="flex:1; position:relative;"><canvas id="userRadarChart"></canvas></div>
                  </div>
               </div>
            </div>

            <!-- TAB 3: TRANSACTION REGISTRY -->
            <div class="dashboard-tab-panel" data-tab-panel="bookings" hidden>
               <div class="registry-header" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
                  <h4 style="margin: 0; font-family: 'Plus Jakarta Sans', sans-serif;">🧾 Bảng kê Dịch vụ & Giao dịch Khách hàng</h4>
                  <div class="registry-filters" style="display: flex; gap: 0.5rem; align-items: center;">
                     <input type="text" id="registry-search" placeholder="Tìm kiếm dịch vụ..." class="registry-input" style="padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.85rem;">
                     <select id="registry-filter-status" class="registry-input" style="padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.85rem;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="cancelled">Đã hủy</option>
                     </select>
                  </div>
               </div>
               <div class="table-responsive" style="overflow-x: auto;">
                  <table class="dashboard-table">
                     <thead>
                        <tr>
                           <th>Mã Giao dịch</th>
                           <th>Tên Dịch vụ / Địa điểm</th>
                           <th>Phân loại</th>
                           <th>Ngày sử dụng</th>
                           <th style="text-align: right;">Giá trị (VNĐ)</th>
                           <th>Thanh toán</th>
                           <th>Phục vụ</th>
                        </tr>
                     </thead>
                     <tbody id="registry-table-body">
                        <tr>
                           <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Đang tải dữ liệu giao dịch...</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            <!-- TAB 4: BADGES & ESG -->
            <div class="dashboard-tab-panel" data-tab-panel="badges" hidden>
               <div class="esg-scorecard" style="display: flex; gap: 1.25rem; background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15); border-radius: 16px; padding: 1.25rem;">
                  <div class="esg-logo" style="font-size: 2.2rem; display: flex; align-items: center;">🌳</div>
                  <div class="esg-content">
                     <h4 style="margin: 0 0 0.25rem 0; font-family: 'Plus Jakarta Sans', sans-serif; color: #10b981;">Chứng nhận Du lịch Bền vững WanderViet ESG</h4>
                     <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">Hệ thống ghi nhận những đóng góp sinh thái của bạn thông qua việc lập kế hoạch tối ưu di chuyển bằng phương tiện công cộng và hỗ trợ du lịch xanh. Bạn đã giúp giảm phát thải tương đương <strong style="color: #10b981;" id="esg-carbon-kg-val">-- kg</strong> khí CO₂ vào bầu khí quyển.</p>
                  </div>
               </div>
               <h4 style="margin-top: 2rem; font-family: 'Plus Jakarta Sans', sans-serif;">🏆 Huy chương & Đóng góp Cộng đồng</h4>
               <div class="badges-grid" id="badges-grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem;">
                  <!-- Badges will be dynamically loaded here -->
               </div>
            </div>

            <!-- TAB 5: AUDIT LOGS -->
            <div class="dashboard-tab-panel" data-tab-panel="logs" hidden>
               <h4 style="margin: 0 0 0.5rem 0; font-family: 'Plus Jakarta Sans', sans-serif;">📜 Nhật ký kiểm toán thao tác hệ thống (Audit Trail)</h4>
               <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Danh sách ghi nhận lịch sử tương tác phần mềm của phiên đăng nhập này nhằm bảo mật thông tin tài khoản.</p>
               <div class="audit-timeline" id="audit-timeline-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <!-- Audit logs will be loaded dynamically -->
               </div>
            </div>

        </div>
      </div>

      <!-- Chart Expand Overlay -->
      <div id="chart-expand-overlay" class="chart-expand-overlay" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.88); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); z-index:99999; align-items:center; justify-content:center; padding:2rem; transition:opacity 0.3s ease; opacity:0;">
        <div class="expand-modal-inner" style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:24px; max-width:850px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,0.5); padding:2.25rem; position:relative; display:flex; flex-direction:column; gap:1.5rem; transform:scale(0.95); transition:transform 0.3s ease;">
          <button type="button" id="close-chart-expand" style="position:absolute; top:1.25rem; right:1.25rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--text); font-size:1.4rem; width:2.5rem; height:2.5rem; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">✕</button>
          
          <h3 id="expand-chart-title" style="margin:0; font-size:1.4rem; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">📊 Biểu đồ chi tiết</h3>
          
          <div style="height:360px; position:relative; width:100%; background:rgba(255,255,255,0.01); border-radius:16px; padding:1rem; border:1px solid rgba(255,255,255,0.03);">
            <canvas id="expandedChartCanvas"></canvas>
          </div>
          
          <div id="expand-chart-details-wrap" style="margin-top:0.5rem;">
            <h4 style="margin:0 0 1rem 0; font-family:'Plus Jakarta Sans',sans-serif; font-size:1.05rem; font-weight:700; color:var(--text);">📋 Bảng thống kê số liệu</h4>
            <div class="table-responsive" style="max-height:250px; overflow-y:auto;">
              <table class="dashboard-table" id="expanded-chart-table">
                <!-- Dynamic Content -->
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Day Click Details Modal Overlay -->
      <div id="day-detail-overlay" class="chart-expand-overlay" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.85); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); z-index:100000; align-items:center; justify-content:center; padding:2rem; transition:opacity 0.3s ease; opacity:0;">
        <div class="expand-modal-inner" style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:24px; max-width:650px; width:100%; max-height:80vh; overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,0.5); padding:2rem; position:relative; display:flex; flex-direction:column; gap:1.25rem; transform:scale(0.95); transition:transform 0.3s ease;">
          <button type="button" id="close-day-detail" style="position:absolute; top:1.25rem; right:1.25rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--text); font-size:1.4rem; width:2.5rem; height:2.5rem; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">✕</button>
          
          <h3 style="margin:0; font-size:1.3rem; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px;">📅 Chi tiết hoạt động ngày <span id="day-detail-title-date">...</span></h3>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:0.5rem;">
            <div style="background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); border-radius:14px; padding:1rem; text-align:center;">
              <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:0.25rem;">Tổng chi tiêu</span>
              <strong style="font-size:1.4rem; color:var(--text);" id="day-detail-spent">0đ</strong>
            </div>
            <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.15); border-radius:14px; padding:1rem; text-align:center;">
              <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:0.25rem;">Số hoạt động</span>
              <strong style="font-size:1.4rem; color:var(--text);" id="day-detail-activity">0 lần</strong>
            </div>
          </div>
          
          <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:1rem;">
            <div>
              <h4 style="margin:0 0 0.5rem 0; font-family:'Plus Jakarta Sans',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text);">🏨 Các dịch vụ đã đặt</h4>
              <div id="day-detail-bookings" style="display:flex; flex-direction:column; gap:0.5rem;">
                <!-- Bookings -->
              </div>
            </div>
            <div>
              <h4 style="margin:0 0 0.5rem 0; font-family:'Plus Jakarta Sans',sans-serif; font-size:0.95rem; font-weight:700; color:var(--text);">📜 Nhật ký hoạt động</h4>
              <div id="day-detail-logs" style="display:flex; flex-direction:column; gap:0.5rem;">
                <!-- Logs -->
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
          <div class="chat-fab-shimmer"></div>
          <!-- Closed State Content (Pill shape) -->
          <div class="chat-fab-content-closed">
            <div class="chat-fab-avatar">
              <svg class="robot-icon" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="robotBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#818cf8" />
                    <stop offset="100%" stop-color="#4f46e5" />
                  </linearGradient>
                </defs>
                <!-- Background rounded box -->
                <rect x="0" y="0" width="40" height="40" rx="14" fill="url(#robotBgGrad)" />
                <!-- White face plate -->
                <rect x="7" y="11" width="26" height="20" rx="7" fill="#ffffff" />
                <!-- Eyes -->
                <circle cx="14" cy="20" r="2.5" fill="#4f46e5" />
                <circle cx="26" cy="20" r="2.5" fill="#4f46e5" />
                <!-- Smile -->
                <path d="M17 24.5c1 1.5 5 1.5 6 0" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" fill="none" />
                <!-- Antenna -->
                <circle cx="20" cy="6.5" r="1.5" fill="#ffffff" />
                <line x1="20" y1="8" x2="20" y2="11" stroke="#ffffff" stroke-width="1.5" />
                <!-- Sparkle star on top-right (Enlarged & Animated) -->
                <path class="twinkle-star" d="M32 4c.4 2 1.6 3.2 3.6 3.6-2 .4-3.2 1.6-3.6 3.6-.4-2-1.6-3.2-3.6-3.6 2-.4 3.2-1.6 3.6-3.6z" fill="#ffffff" />
              </svg>
            </div>
            <div class="chat-fab-text">
              <div class="chat-fab-title">Trợ lý AI WanderViet</div>
              <div class="chat-fab-subtitle">Hỏi gì cũng biết ✨</div>
            </div>
          </div>
          <!-- Opened State Content (Circle shape) -->
          <div class="chat-fab-content-opened">
            <svg class="chat-fab-icon-opened" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6366f1" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
              </defs>
              <!-- Chat bubble -->
              <path d="M19 11.5a7 7 0 0 1-.8 3.2 7.1 7.1 0 0 1-6.4 4c-1.1 0-2.2-.3-3.2-.8L4 19l1.6-4.8A7.1 7.1 0 0 1 4.8 11c0-3.9 3.2-7 7.1-7h.4a7 7 0 0 1 6.7 7.5z" stroke="url(#aiGrad)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              <!-- AI text -->
              <text x="11.5" y="11.5" font-family="'Outfit', 'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="6.5" fill="url(#aiGrad)" text-anchor="middle" dominant-baseline="central">AI</text>
              <!-- Sparkle star (Enlarged & Animated) -->
              <path class="twinkle-star-pink" d="M19.5 1c.3 1.5 1.2 2.4 2.7 2.7-1.5.3-2.4 1.2-2.7 2.7-.3-1.5-1.2-2.4-2.7-2.7 1.5-.3 2.4-1.2 2.7-2.7z" fill="#6366f1" />
            </svg>
          </div>
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
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <button type="button" class="btn-select-mode" id="global-chat-history-select-btn">Chọn</button>
                    <button type="button" class="btn-close-sidebar" id="global-chat-history-close">×</button>
                  </div>
                </div>
                <div class="chat-sessions-sidebar__body" id="global-chat-sessions-list">
                  <div class="chat-sessions-loading">Đang tải lịch sử...</div>
                </div>
                <div class="chat-sessions-sidebar__footer" id="global-chat-history-select-footer" style="display: none;">
                  <button type="button" class="btn-select-all" id="global-chat-history-select-all">Chọn tất cả</button>
                  <button type="button" class="btn-delete-selected" id="global-chat-history-delete-selected" disabled>Xóa (0)</button>
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
              
              <!-- Floating Options Menu for Plus Button -->
              <div class="chat-form-plus-menu" id="chat-form-plus-menu" style="display: none;">
                <button type="button" class="chat-plus-menu-item" id="chat-menu-add-image">
                  <svg class="menu-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Thêm ảnh</span>
                </button>
              </div>

              <form class="chat-form" id="global-chat-form">
                <input type="file" id="chat-image-file-input" accept="image/png, image/jpeg, image/webp" multiple style="display: none;">
                <button type="button" class="chat-form-plus-btn" title="Thêm tùy chọn" aria-label="Thêm tùy chọn">
                  <span>+</span>
                </button>
                <div class="chat-input-wrapper" style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                  <div class="chat-image-preview-container" id="chat-image-preview-container"></div>
                  <label class="visually-hidden" for="global-chat-input">Nhập câu hỏi</label>
                  <textarea id="global-chat-input" placeholder="Hỏi về du lịch Việt Nam…" autocomplete="off" rows="1"></textarea>
                </div>
                <div class="companion-fab-wrapper">
                  <div class="companion-fab" id="companion-toggle" title="Chế độ Hướng dẫn viên Chuyên gia">
                    <svg class="mic-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                      <line x1="12" x2="12" y1="17" y2="22"></line>
                    </svg>
                  </div>
                </div>
                <button type="submit" class="btn btn--primary btn--small" disabled>Gửi</button>
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
                      <span class="widget-weather__city" id="chatbot-weather-city">📍 Hà Nội</span>
                      <span class="widget-weather__desc" id="chatbot-weather-desc">Thời tiết du lịch rất đẹp ☀️</span>
                    </div>
                    <div class="widget-weather__temp" id="chatbot-weather-temp">28°C</div>
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

      // Insert rounded hero add button overlay (top-right) for quick add
      try {
        const heroEl = wrap.querySelector('.place-detail__hero');
        if (heroEl && !heroEl.querySelector('.place-hero-add-btn')) {
          const addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'place-hero-add-btn';
          addBtn.title = 'Thêm vào lịch';
          addBtn.innerText = '+';
          addBtn.onclick = function (ev) {
            ev.stopPropagation();
            if (typeof window.addStopById === 'function') {
              try { window.addStopById(placeId); }
              catch (e) { if (window.showToast) showToast('Lỗi khi thêm điểm', 'error'); }
            } else {
              if (window.showToast) showToast('Chức năng chưa khả dụng', 'info');
            }
          };
          heroEl.appendChild(addBtn);
        }
      } catch (err) {
        console.warn('Could not insert hero add button', err);
      }

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
      svg.innerHTML = `<defs><filter id="remove-black" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 10 10 10 0 -0.5" /></filter></defs>`;
      document.body.appendChild(svg);
    }
    if (document.getElementById('wander-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'wander-shared-styles';
    style.textContent = `
      .rank-sprite {
        width: 80px; height: 80px; background-size: contain; background-repeat: no-repeat; background-position: center;
        flex-shrink: 0; display: inline-block; position: relative;
        filter: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9InJlbW92ZS1ibGFjayI+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjEgMCAwIDAgMCAgMCAxIDAgMCAwICAwIDAgMSAwIDAgIDEwIDEwIDEwIDAgLTAuNSIvPjwvZmlsdGVyPjwvc3ZnPg==#remove-black") drop-shadow(0 0 2px rgba(0,0,0,0.8));
      }
      .rank-text { font-weight: 700; font-size: 0.9rem; letter-spacing: 0.5px; color: var(--text); margin-left: 4px; }
      .rank-bronze-1, .rank-bronze-2, .rank-bronze-3 { background-image: url('assets/img/rank_bronze.png'); }
      .rank-silver-1, .rank-silver-2, .rank-silver-3 { background-image: url('assets/img/rank_silver.png'); }
      .rank-gold-1, .rank-gold-2, .rank-gold-3 { background-image: url('assets/img/rank_gold.png'); }
      .rank-platinum-1, .rank-platinum-2, .rank-platinum-3 { 
        background-image: url('assets/img/rank_platinum.png'); 
        filter: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9InJlbW92ZS1ibGFjayI+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjEgMCAwIDAgMCAgMCAxIDAgMCAwICAwIDAgMSAwIDAgIDEwIDEwIDEwIDAgLTAuNSIvPjwvZmlsdGVyPjwvc3ZnPg==#remove-black") hue-rotate(-20deg) brightness(1.3) saturate(1.2) drop-shadow(0 0 5px rgba(0, 240, 255, 0.4));
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
    if (panel) {
      panel.removeAttribute('hidden');
    }
    const closeBtn = document.getElementById('global-chat-close');
    const form = document.getElementById('global-chat-form');
    const input = document.getElementById('global-chat-input');
    const log = document.getElementById('global-chat-log');

    // Image Uploading State & Preview logic
    let uploadedImages = [];
    window._uploadedImages = uploadedImages; // expose to submit handler
    const fileInput = document.getElementById('chat-image-file-input');
    const previewContainer = document.getElementById('chat-image-preview-container');
    const plusBtn = form ? form.querySelector('.chat-form-plus-btn') : null;
    const plusMenu = document.getElementById('chat-form-plus-menu');
    const addImageBtn = document.getElementById('chat-menu-add-image');

    if (plusBtn && plusMenu) {
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = plusMenu.style.display === 'flex';
        plusMenu.style.display = isVisible ? 'none' : 'flex';
      });
      
      // Close menu when clicking anywhere else
      document.addEventListener('click', (e) => {
        if (!plusMenu.contains(e.target) && e.target !== plusBtn) {
          plusMenu.style.display = 'none';
        }
      });
    }

    if (addImageBtn && fileInput && plusMenu) {
      addImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        plusMenu.style.display = 'none';
        fileInput.click();
      });
    }

    if (fileInput && previewContainer) {
      fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        for (const file of files) {
          if (!file.type.startsWith('image/')) continue;
          
          if (uploadedImages.length >= 5) {
            alert('Chỉ có thể gửi tối đa 5 hình ảnh cùng lúc.');
            break;
          }

          try {
            const base64 = await convertFileToBase64(file);
            uploadedImages.push(base64);
            renderPreviews();
          } catch (err) {
            console.error("Lỗi đọc hình ảnh:", err);
          }
        }
        
        fileInput.value = '';
        updateSubmitBtnState();
      });
    }

    function convertFileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }

    function renderPreviews() {
      if (!previewContainer) return;
      
      if (uploadedImages.length === 0) {
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
        return;
      }

      previewContainer.style.display = 'flex';
      previewContainer.innerHTML = '';

      uploadedImages.forEach((imgBase64, index) => {
        const item = document.createElement('div');
        item.className = 'chat-image-preview-item';
        item.style.backgroundImage = `url(${imgBase64})`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'chat-image-preview-remove';
        removeBtn.innerHTML = '✕';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          uploadedImages.splice(index, 1);
          renderPreviews();
          updateSubmitBtnState();
        };

        item.appendChild(removeBtn);
        previewContainer.appendChild(item);
      });
    }

    window._clearChatImages = function() {
      uploadedImages.length = 0;
      renderPreviews();
      updateSubmitBtnState();
    };

    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    function updateSubmitBtnState() {
      if (!input || !submitBtn) return;
      const val = input.value.trim();
      const hasImages = uploadedImages && uploadedImages.length > 0;
      if (val || hasImages) {
        submitBtn.removeAttribute('disabled');
      } else {
        submitBtn.setAttribute('disabled', 'true');
      }
    }

    function autoResizeTextarea() {
      if (!input) return;
      input.style.setProperty('height', 'auto', 'important');
      const panel = document.getElementById('global-chat-panel');
      const isFullscreen = panel && panel.classList.contains('chat-panel--fullscreen');
      const maxHeight = isFullscreen ? 104 : 84;
      const minHeight = isFullscreen ? 28 : 24;
      const scrollHeight = input.scrollHeight;
      
      const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      input.style.setProperty('height', targetHeight + 'px', 'important');
      
      if (scrollHeight > maxHeight) {
        input.style.setProperty('overflow-y', 'auto', 'important');
      } else {
        input.style.setProperty('overflow-y', 'hidden', 'important');
      }

      if (form) {
        if (scrollHeight > minHeight + 4) {
          form.classList.add('chat-form--multiline');
        } else {
          form.classList.remove('chat-form--multiline');
        }
      }
    }

    if (input) {
      input.addEventListener('input', () => {
        updateSubmitBtnState();
        autoResizeTextarea();
      });
      input.addEventListener('change', () => {
        updateSubmitBtnState();
        autoResizeTextarea();
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const hasImages = uploadedImages && uploadedImages.length > 0;
          if (input.value.trim() || hasImages) {
            form.dispatchEvent(new Event('submit'));
          }
        }
      });
      
      try {
        const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
        if (desc && desc.set) {
          Object.defineProperty(input, 'value', {
            get: function() {
              return desc.get.call(this);
            },
            set: function(val) {
              desc.set.call(this, val);
              updateSubmitBtnState();
              autoResizeTextarea();
            }
          });
        }
      } catch (e) {
        console.warn('[ChatInput] Failed to hook value setter:', e);
      }
      updateSubmitBtnState();
      autoResizeTextarea();
    }

    function updateChatbotWeather() {
      const cityEl = document.getElementById('chatbot-weather-city');
      const descEl = document.getElementById('chatbot-weather-desc');
      const tempEl = document.getElementById('chatbot-weather-temp');
      if (!cityEl && !descEl && !tempEl) return;

      // Hàm đánh giá thời tiết cho du lịch
      function getTravelRecommendation(tempC, code, weatherDesc) {
        const t = Number(tempC);
        const c = Number(code);
        const d = (weatherDesc || '').toLowerCase();

        let isThunder = false;
        let isSnow = false;
        let isRain = false;
        let isFog = false;
        let isCloudy = false;
        let isSunny = false;

        // Ưu tiên khớp theo mã thời tiết chính xác (hỗ trợ cả Open-Meteo và WWO/wttr.in)
        if (!isNaN(c)) {
          if ([95, 96, 99, 200, 386, 389, 392, 395].includes(c)) {
            isThunder = true;
          } else if ([71, 73, 75, 77, 85, 86, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377].includes(c)) {
            isSnow = true;
          } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 317, 320, 353, 356, 359, 362, 365].includes(c)) {
            isRain = true;
          } else if ([45, 48, 143, 248, 260].includes(c)) {
            isFog = true;
          } else if ([1, 2, 3, 116, 119, 122].includes(c)) {
            isCloudy = true;
          } else if ([0, 113].includes(c)) {
            isSunny = true;
          }
        }

        // Tự động phân tích chuỗi nếu mã thời tiết chưa khớp được loại cụ thể nào
        if (!isThunder && !isSnow && !isRain && !isFog && !isCloudy && !isSunny) {
          isRain = d.includes('rain') || d.includes('mưa') || d.includes('shower') || d.includes('drizzle');
          isThunder = d.includes('thunder') || d.includes('sấm') || d.includes('storm') || d.includes('giông') || d.includes('dông');
          isSnow = d.includes('snow') || d.includes('tuyết');
          isFog = d.includes('fog') || d.includes('mist') || d.includes('sương');
          isCloudy = d.includes('cloud') || d.includes('overcast') || d.includes('mây');
          isSunny = d.includes('sun') || d.includes('clear') || d.includes('nắng');
        }

        if (isThunder) return 'Có giông sét, nên hạn chế ra ngoài ⛈️';
        if (isSnow) return 'Tuyết rơi, cảnh đẹp nhưng cần giữ ấm ❄️';
        if (isRain && t < 20) return 'Mưa và se lạnh, nên ở trong nhà 🌧️';
        if (isRain && t >= 20) return 'Có mưa, nhớ mang ô nếu ra ngoài 🌦️';
        if (isFog) return 'Sương mù, tầm nhìn hạn chế 🌫️';
        if (t >= 40) return 'Nắng nóng gay gắt, hạn chế hoạt động ngoài trời 🥵';
        if (t >= 35) return 'Trời khá nóng, nhớ uống nhiều nước ☀️';
        if (t >= 25 && isSunny) return 'Thời tiết du lịch rất đẹp ☀️';
        if (t >= 25 && isCloudy) return 'Mát mẻ dễ chịu, lý tưởng để dạo phố 🌤️';
        if (t >= 20) return 'Thời tiết dễ chịu, rất hợp tham quan 😊';
        if (t >= 15) return 'Se lạnh, mang thêm áo khoác nhé 🧥';
        if (t >= 10) return 'Trời lạnh, thích hợp ngắm cảnh núi rừng 🏔️';
        return 'Trời rất lạnh, giữ ấm khi ra ngoài 🥶';
      }

      // Hàm reverse geocode lấy tên tỉnh/thành phố tiếng Việt
      async function reverseGeocode(lat, lon) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi&zoom=10`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            // Ưu tiên: city > town > county > state > province
            let name = addr.city || addr.town || addr.county || addr.state || addr.province || '';
            // Loại bỏ prefix thừa
            name = name.replace(/^(Thành phố |Tỉnh |TP\.?\s*)/i, '').trim();
            if (name) return name;
          }
        } catch (e) {
          console.warn('Reverse geocode failed', e);
        }
        return '';
      }

      const fetchWeatherData = async (lat, lon, customName = '') => {
        try {
          let temp = null;
          let code = null;
          let desc = '';
          let areaName = customName;

          // Lấy tên địa danh bằng GPS song song
          let geoPromise = Promise.resolve('');
          if (!areaName && lat != null && lon != null) {
            geoPromise = reverseGeocode(lat, lon);
          }

          // Lấy dữ liệu thời tiết bằng GPS
          if (lat != null && lon != null) {
            try {
              // Ưu tiên dùng Open-Meteo vì độ chính xác thời gian thực cực cao và cập nhật liên tục
              const openMeteoUrl = `/api/public/weather/open-meteo?lat=${lat}&lng=${lon}`;
              const [weatherRes, geoName] = await Promise.all([
                fetch(openMeteoUrl).then(r => r.json()),
                geoPromise
              ]);

              if (weatherRes && weatherRes.current) {
                temp = Math.round(weatherRes.current.temperature_2m);
                code = weatherRes.current.weathercode;
                // Map weather code to Vietnamese description for fallback recommendation
                const weatherDescMap = {
                  0: 'Trời quang đãng',
                  1: 'Hầu như không mây',
                  2: 'Mây rải rác',
                  3: 'Nhiều mây',
                  45: 'Sương mù',
                  48: 'Sương muối/Sương mù băng',
                  51: 'Mưa phùn nhẹ',
                  53: 'Mưa phùn vừa',
                  55: 'Mưa phùn nhiều',
                  56: 'Mưa phùn buốt nhẹ',
                  57: 'Mưa phùn buốt nhiều',
                  61: 'Mưa nhẹ',
                  63: 'Mưa vừa',
                  65: 'Mưa to',
                  66: 'Mưa buốt nhẹ',
                  67: 'Mưa buốt to',
                  71: 'Tuyết rơi nhẹ',
                  73: 'Tuyết rơi vừa',
                  75: 'Tuyết rơi nhiều',
                  77: 'Tuyết hạt',
                  80: 'Mưa rào nhẹ',
                  81: 'Mưa rào vừa',
                  82: 'Mưa rào to',
                  85: 'Mưa tuyết rào nhẹ',
                  86: 'Mưa tuyết rào to',
                  95: 'Dông bão',
                  96: 'Dông bão có mưa đá nhẹ',
                  99: 'Dông bão có mưa đá to'
                };
                desc = weatherDescMap[code] || '';
                if (!areaName) areaName = geoName;
              }
            } catch (err) {
              console.warn('Open-Meteo failed, falling back to wttr.in', err);
            }
          }

          // Fallback hoặc khi không có GPS (dùng IP qua wttr.in)
          if (temp === null) {
            const weatherQuery = (lat != null && lon != null) ? `${lat},${lon}` : '';
            const weatherUrl = weatherQuery
              ? `/api/public/weather/wttr?q=${encodeURIComponent(weatherQuery)}`
              : `/api/public/weather/wttr?q=Viet Nam`;

            const [weatherRes, geoName] = await Promise.all([
              fetch(weatherUrl).then(r => r.json()),
              geoPromise
            ]);

            if (weatherRes && weatherRes.current_condition && weatherRes.current_condition[0]) {
              const current = weatherRes.current_condition[0];
              temp = Math.round(Number(current.temp_C));
              code = Number(current.weatherCode);
              desc = current.weatherDesc && current.weatherDesc[0] ? current.weatherDesc[0].value : '';

              if (lat != null && lon != null) {
                if (!areaName) areaName = geoName;
              }
              if (!areaName && weatherRes.nearest_area && weatherRes.nearest_area[0]) {
                const area = weatherRes.nearest_area[0];
                if (area.region && area.region[0] && area.region[0].value) {
                  areaName = area.region[0].value;
                } else if (area.areaName && area.areaName[0]) {
                  areaName = area.areaName[0].value;
                }
              }
            }
          }

          if (areaName) {
            areaName = areaName.replace(/^(Thành phố |Tỉnh |TP\.?\s*)/i, '').trim();
          }
          if (!areaName) areaName = 'Vị trí hiện tại';

          if (temp !== null) {
            if (tempEl) tempEl.textContent = `${temp}°C`;
            if (cityEl) {
              cityEl.textContent = `📍 ${areaName}`;
              cityEl.title = 'Bấm để đổi tỉnh/thành phố khác';
              cityEl.style.cursor = 'pointer';
              cityEl.style.transition = 'opacity 0.2s';
              cityEl.style.textDecoration = 'none';
              cityEl.style.borderBottom = 'none';
              cityEl.onmouseenter = () => { cityEl.style.opacity = '0.7'; };
              cityEl.onmouseleave = () => { cityEl.style.opacity = '1'; };
              cityEl.onclick = function(evt) {
                evt.stopPropagation();
                // Remove existing modal
                let old = document.getElementById('weather-loc-modal');
                if (old) old.remove();

                const dk = document.documentElement.getAttribute('data-theme') === 'dark';
                const bg = dk ? '#1e293b' : '#ffffff';
                const tc = dk ? '#f8fafc' : '#0f172a';
                const sc = dk ? '#94a3b8' : '#64748b';
                const ib = dk ? 'rgba(0,0,0,0.25)' : '#f1f5f9';
                const ibr = dk ? 'rgba(255,255,255,0.12)' : '#cbd5e1';
                const itc = dk ? '#ffffff' : '#0f172a';
                const cb = dk ? 'rgba(255,255,255,0.06)' : '#f1f5f9';
                const cbr = dk ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
                const ctc = dk ? '#e2e8f0' : '#475569';

                const overlay = document.createElement('div');
                overlay.id = 'weather-loc-modal';
                Object.assign(overlay.style, {
                  position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                  background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
                  zIndex: '9999999', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: '0', transition: 'opacity 0.25s ease'
                });

                const card = document.createElement('div');
                Object.assign(card.style, {
                  background: bg, border: `1px solid ${dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transform: 'scale(0.92)',
                  transition: 'transform 0.25s ease', color: tc, fontFamily: 'inherit'
                });

                // Title
                const h3 = document.createElement('h3');
                Object.assign(h3.style, { marginTop: '0', marginBottom: '12px', fontSize: '1.1rem', fontWeight: '700', color: tc });
                h3.textContent = '📍 Thay đổi vị trí thời tiết';
                card.appendChild(h3);

                // Subtitle
                const p = document.createElement('p');
                Object.assign(p.style, { fontSize: '0.8rem', color: sc, marginBottom: '16px', lineHeight: '1.4' });
                p.textContent = 'Nhập tên Tỉnh/Thành phố hoặc bấm nút định vị tự động.';
                card.appendChild(p);

                // Input
                const inputWrap = document.createElement('div');
                inputWrap.style.marginBottom = '16px';
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.placeholder = 'VD: Hà Nội, Đà Nẵng, Hồ Chí Minh...';
                inp.value = areaName; // Safe DOM assignment, no HTML injection
                Object.assign(inp.style, {
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: `1px solid ${ibr}`, background: ib, color: itc,
                  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                });
                inputWrap.appendChild(inp);
                card.appendChild(inputWrap);

                // Buttons container
                const btnsCol = document.createElement('div');
                Object.assign(btnsCol.style, { display: 'flex', flexDirection: 'column', gap: '10px' });

                // Locate button
                const locBtn = document.createElement('button');
                locBtn.type = 'button';
                locBtn.textContent = '📡 Tự động định vị vị trí hiện tại';
                Object.assign(locBtn.style, {
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '10px', background: 'linear-gradient(135deg,#0284c7,#0369a1)',
                  color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600',
                  fontSize: '0.85rem', cursor: 'pointer'
                });
                btnsCol.appendChild(locBtn);

                // Row: Cancel + Save
                const row = document.createElement('div');
                Object.assign(row.style, { display: 'flex', gap: '10px', marginTop: '6px' });

                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.textContent = 'Hủy';
                Object.assign(cancelBtn.style, {
                  flex: '1', padding: '10px', background: cb, color: ctc,
                  border: `1px solid ${cbr}`, borderRadius: '10px', fontWeight: '600',
                  fontSize: '0.85rem', cursor: 'pointer'
                });
                row.appendChild(cancelBtn);

                const saveBtn = document.createElement('button');
                saveBtn.type = 'button';
                saveBtn.textContent = 'Xác nhận';
                Object.assign(saveBtn.style, {
                  flex: '2', padding: '10px', background: '#10b981', color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: '600',
                  fontSize: '0.85rem', cursor: 'pointer'
                });
                row.appendChild(saveBtn);
                btnsCol.appendChild(row);
                card.appendChild(btnsCol);
                overlay.appendChild(card);
                document.body.appendChild(overlay);

                // Animate in
                requestAnimationFrame(() => {
                  overlay.style.opacity = '1';
                  card.style.transform = 'scale(1)';
                  inp.focus();
                  inp.select();
                });

                function closeModal() {
                  overlay.style.opacity = '0';
                  card.style.transform = 'scale(0.92)';
                  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 260);
                }

                // Close on backdrop click
                overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

                cancelBtn.onclick = closeModal;

                saveBtn.onclick = async () => {
                  const val = inp.value.trim();
                  if (!val) return;
                  closeModal();
                  cityEl.textContent = '📍 Đang định vị...';
                  try {
                    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ', Vietnam')}&format=json&limit=1`;
                    const r = await fetch(url);
                    const d = await r.json();
                    if (d && d[0]) {
                      const nLat = parseFloat(d[0].lat), nLon = parseFloat(d[0].lon);
                      let dn = d[0].display_name.split(',')[0].replace(/^(Thành phố |Tỉnh |TP\.?\s*)/i, '').trim();
                      localStorage.setItem('preferred_weather_city', JSON.stringify({ name: dn, lat: nLat, lon: nLon }));
                      fetchWeatherData(nLat, nLon, dn);
                    } else {
                      if (typeof showToast === 'function') showToast('Không tìm thấy địa điểm này.', 'warning');
                      cityEl.textContent = `📍 ${areaName}`;
                    }
                  } catch (err) {
                    console.error('Geocoding failed', err);
                    if (typeof showToast === 'function') showToast('Lỗi kết nối khi định vị.', 'error');
                    cityEl.textContent = `📍 ${areaName}`;
                  }
                };

                locBtn.onclick = () => {
                  closeModal();
                  cityEl.textContent = '📍 Đang định vị...';
                  localStorage.removeItem('preferred_weather_city');
                  // Directly use geolocation API instead of runWeatherUpdate reference
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude),
                      async () => {
                        const coords = await getIPCoordinates();
                        if (coords) fetchWeatherData(coords.lat, coords.lon);
                        else fetchWeatherData(null, null);
                      },
                      { timeout: 8000 }
                    );
                  } else {
                    getIPCoordinates().then(coords => {
                      if (coords) fetchWeatherData(coords.lat, coords.lon);
                      else fetchWeatherData(null, null);
                    });
                  }
                };

                inp.onkeydown = (e) => { if (e.key === 'Enter') saveBtn.click(); };
              };
            }
            if (descEl) descEl.textContent = getTravelRecommendation(temp, code, desc);
          }
        } catch (e) {
          console.warn('Chatbot weather fetch failed', e);
        }
      };

      // Hàm lấy tọa độ dựa trên IP (fallback khi trình duyệt chặn GPS)
      // NOTE: Disabled external IP geo-location calls to avoid CORS/429/403 errors
      // Geo-location is optional; weather will fall back to null if unavailable
      async function getIPCoordinates() {
        return null;
      }

      const runWeatherUpdate = async () => {
        // 1. Kiểm tra vị trí đã lưu trong localStorage trước
        const cachedCity = localStorage.getItem('preferred_weather_city');
        if (cachedCity) {
          try {
            const { name, lat, lon } = JSON.parse(cachedCity);
            if (lat != null && lon != null) {
              fetchWeatherData(lat, lon, name);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse cached city', e);
          }
        }

        // 2. Định vị tự động
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              fetchWeatherData(position.coords.latitude, position.coords.longitude);
            },
            async () => {
              const coords = await getIPCoordinates();
              if (coords) {
                fetchWeatherData(coords.lat, coords.lon);
              } else {
                fetchWeatherData(null, null);
              }
            },
            { timeout: 5000 }
          );
        } else {
          const coords = await getIPCoordinates();
          if (coords) {
            fetchWeatherData(coords.lat, coords.lon);
          } else {
            fetchWeatherData(null, null);
          }
        }
      };

      runWeatherUpdate();
    }

    // Khởi chạy cập nhật thời tiết ngay khi chatbot được khởi tạo
    updateChatbotWeather();

    function togglePanel() {
      const isOpen = panel.classList.contains('chat-panel--open');
      if (isOpen) {
        panel.classList.remove('chat-panel--open');
        fab.setAttribute('aria-expanded', 'false');
      } else {
        panel.classList.add('chat-panel--open');
        fab.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
          if (input) {
            input.focus();
            autoResizeTextarea();
          }
        }, 100);
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

    // --- CHAT HISTORY & NEW CHAT LISTENERS ---
    const newChatBtn = document.getElementById('global-chat-new-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentSessionId = null;
        localStorage.removeItem('wander_current_session');
        localStorage.removeItem('wander_shared_chat');
        if (log) {
          log.innerHTML = '';
        }
        
        // Đóng panel lịch sử nếu đang mở
        const sessionsView = document.getElementById('global-chat-sessions-view');
        if (sessionsView) {
          sessionsView.setAttribute('hidden', 'true');
        }
        
        loadSharedChat();
      });
    }

    function resetSelectMode() {
      isSelectMode = false;
      selectedSessionIds.clear();
      const sessionsView = document.getElementById('global-chat-sessions-view');
      if (sessionsView) {
        sessionsView.classList.remove('chat-sessions-sidebar--select-mode');
      }
      const selectBtn = document.getElementById('global-chat-history-select-btn');
      if (selectBtn) {
        selectBtn.textContent = 'Chọn';
        selectBtn.classList.remove('is-active');
      }
      const selectFooter = document.getElementById('global-chat-history-select-footer');
      if (selectFooter) {
        selectFooter.style.display = 'none';
      }
      document.querySelectorAll('.chat-session-item').forEach(el => {
        el.classList.remove('chat-session-item--selected');
        el.classList.remove('chat-session-item--select-mode');
      });
      updateSelectFooter();
    }

    function updateSelectFooter() {
      const footerBtn = document.getElementById('global-chat-history-delete-selected');
      if (footerBtn) {
        footerBtn.textContent = `Xóa (${selectedSessionIds.size})`;
        footerBtn.disabled = selectedSessionIds.size === 0;
      }
    }

    const historyBtn = document.getElementById('global-chat-history-btn');
    const sessionsView = document.getElementById('global-chat-sessions-view');
    if (historyBtn && sessionsView) {
      historyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = sessionsView.hasAttribute('hidden');
        if (isHidden) {
          sessionsView.removeAttribute('hidden');
          loadChatSessions();
        } else {
          sessionsView.setAttribute('hidden', 'true');
          resetSelectMode();
        }
      });
    }

    const historyCloseBtn = document.getElementById('global-chat-history-close');
    if (historyCloseBtn && sessionsView) {
      historyCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sessionsView.setAttribute('hidden', 'true');
        resetSelectMode();
      });
    }

    // Select mode button toggler
    const selectBtn = document.getElementById('global-chat-history-select-btn');
    const selectFooter = document.getElementById('global-chat-history-select-footer');
    if (selectBtn) {
      selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isSelectMode = !isSelectMode;
        selectedSessionIds.clear();
        
        const sessionsView = document.getElementById('global-chat-sessions-view');
        if (sessionsView) {
          sessionsView.classList.toggle('chat-sessions-sidebar--select-mode', isSelectMode);
        }
        
        selectBtn.textContent = isSelectMode ? 'Hủy' : 'Chọn';
        selectBtn.classList.toggle('is-active', isSelectMode);
        
        if (selectFooter) {
          selectFooter.style.display = isSelectMode ? 'flex' : 'none';
        }
        
        document.querySelectorAll('.chat-session-item').forEach(el => {
          el.classList.remove('chat-session-item--selected');
          el.classList.toggle('chat-session-item--select-mode', isSelectMode);
        });
        
        const selectAllBtn = document.getElementById('global-chat-history-select-all');
        if (selectAllBtn) {
          selectAllBtn.textContent = 'Chọn tất cả';
        }
        
        updateSelectFooter();
      });
    }

    // Select all button
    const selectAllBtn = document.getElementById('global-chat-history-select-all');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const items = document.querySelectorAll('.chat-session-item');
        const allSelected = Array.from(items).every(item => item.classList.contains('chat-session-item--selected'));
        
        items.forEach(item => {
          const sessionId = item.dataset.sessionId;
          if (sessionId) {
            if (allSelected) {
              selectedSessionIds.delete(sessionId);
              item.classList.remove('chat-session-item--selected');
            } else {
              selectedSessionIds.add(sessionId);
              item.classList.add('chat-session-item--selected');
            }
          }
        });
        
        selectAllBtn.textContent = allSelected ? 'Chọn tất cả' : 'Bỏ chọn';
        updateSelectFooter();
      });
    }

    // Delete selected sessions
    const deleteSelectedBtn = document.getElementById('global-chat-history-delete-selected');
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const count = selectedSessionIds.size;
        if (count === 0) return;
        
        // Show confirm ONLY when count > 1
        if (count > 1) {
          const ok = await window.WanderUI.confirm('Xác nhận xóa', `Bạn có chắc chắn muốn xóa ${count} hội thoại đã chọn?`);
          if (!ok) return;
        }
        
        if (window.WanderUI && window.WanderUI.showLoading) {
          window.WanderUI.showLoading(`Đang xóa ${count} hội thoại...`);
        }
        
        try {
          const token = localStorage.getItem('wander_token');
          const deviceId = getDeviceId();
          
          const deletePromises = Array.from(selectedSessionIds).map(sessionId => 
            fetch(`/api/chat/session/${sessionId}?deviceId=${deviceId}`, {
              method: 'DELETE',
              headers: { 'x-auth-token': token || '' }
            })
          );
          
          await Promise.all(deletePromises);
          
          if (selectedSessionIds.has(currentSessionId)) {
            currentSessionId = null;
            localStorage.removeItem('wander_current_session');
            localStorage.removeItem('wander_shared_chat');
            if (log) log.innerHTML = '';
            loadSharedChat();
          }
          
          if (window.WanderUI && window.WanderUI.hideLoading) {
            window.WanderUI.hideLoading();
          }
          if (window.WanderUI && window.WanderUI.showToast) {
            window.WanderUI.showToast(`Đã xóa thành công ${count} hội thoại`, 'success');
          }
          
          resetSelectMode();
          loadChatSessions();
        } catch (err) {
          if (window.WanderUI && window.WanderUI.hideLoading) {
            window.WanderUI.hideLoading();
          }
          console.error('Lỗi khi xóa nhiều hội thoại:', err);
          if (window.WanderUI && window.WanderUI.showToast) {
            window.WanderUI.showToast('Có lỗi xảy ra khi xóa các hội thoại', 'error');
          }
        }
      });
    }

    // --- FULLSCREEN TOGGLE ---
    const expandBtn = document.getElementById('global-chat-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Đảm bảo panel đang mở trước khi phóng to
        if (!panel.classList.contains('chat-panel--open')) {
          panel.classList.add('chat-panel--open');
          fab.setAttribute('aria-expanded', 'true');
        }
        const isFullscreen = panel.classList.toggle('chat-panel--fullscreen');
        fabWrap.classList.toggle('is-fullscreen', isFullscreen);
        expandBtn.textContent = isFullscreen ? '⊡' : '⛶';
        expandBtn.setAttribute('aria-pressed', String(isFullscreen));
        expandBtn.title = isFullscreen ? 'Thu nhỏ' : 'Phóng to toàn màn hình';
        
        // Recalculate sizes and layout alignment on toggle
        autoResizeTextarea();
        
        // Run repeated checks during the 300ms transition to ensure layout aligns correctly as width adjusts
        const checks = [50, 100, 150, 200, 250, 300, 400, 500, 600];
        checks.forEach(delay => {
          setTimeout(autoResizeTextarea, delay);
        });

        setTimeout(() => {
          log.scrollTop = log.scrollHeight;
        }, 150);
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
    let isSelectMode = false;
    let selectedSessionIds = new Set();

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

    // Helper: Cuộn xuống cuối - chỉ scroll nếu người dùng đang ở gần cuối
    // Tránh giật giật khi user đang kéo lên đọc nội dung cũ hơn
    let _userScrolledUp = false;
    if (log) {
        log.addEventListener('scroll', () => {
            const threshold = 120; // px from bottom to consider "near bottom"
            _userScrolledUp = log.scrollTop < (log.scrollHeight - log.clientHeight - threshold);
        }, { passive: true });
    }

    function scrollToBottom(force = false) {
        if (!log) return;
        // Nếu user đang kéo lên đọc nội dung cũ → không force scroll (trừ khi force=true)
        if (_userScrolledUp && !force) return;
        requestAnimationFrame(() => {
            log.scrollTop = log.scrollHeight;
        });
    }

    // Format markdown-like text to HTML for chat bubbles
    function formatChatMarkdown(text) {
      if (!text) return '';
      let html = escapeHtml(text);
      // Bold: **text**
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic: *text*
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Inline code: `code`
      html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;font-size:0.85em;">$1</code>');
      // Headings: ### heading
      html = html.replace(/^### (.+)$/gm, '<h4 style="margin:10px 0 4px;font-size:0.95em;color:#a78bfa;">$1</h4>');
      html = html.replace(/^## (.+)$/gm, '<h3 style="margin:12px 0 6px;font-size:1em;color:#c4b5fd;">$1</h3>');
      html = html.replace(/^# (.+)$/gm, '<h2 style="margin:14px 0 8px;font-size:1.1em;color:#ddd6fe;">$1</h2>');
      // Unordered list items: - item or * item
      html = html.replace(/^[-*] (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>');
      html = html.replace(/(<li[^>]*>.*<\/li>)/s, '<ul style="margin:6px 0;padding-left:18px;">$1</ul>');
      // Numbered list
      html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>');
      // Horizontal rule
      html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.15);margin:10px 0;">');
      // Links: [text](url)
      html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:underline;">$1</a>');
      // Newlines → <br>
      html = html.replace(/\n/g, '<br>');
      // Clean up excessive <br>
      html = html.replace(/(<br\s*\/?>\s*){3,}/g, '<br><br>');
      return html;
    }

    // Append a message bubble to chat log
    // role: 'user' | 'bot'
    // images: array of base64/url strings
    function appendMsg(info, role, skipSave, skipScroll, itineraryData, images) {
      if (!log) return;
      
      const welcomeScreen = document.getElementById('chat-welcome-screen');
      const hasMessages = log.querySelector('.chat-message-row');
      if (welcomeScreen || !hasMessages) {
        if (welcomeScreen) {
          welcomeScreen.remove();
        }
        
        const startBanner = document.createElement('div');
        startBanner.className = 'chat-conversation-start';
        const now = new Date();
        const timeStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
        startBanner.innerHTML = `
          <div class="chat-start-badge">
            <span class="chat-start-status-dot"></span>
            <span>WanderViet AI · Đang trực tuyến</span>
          </div>
          <div class="chat-start-date">${timeStr}</div>
        `;
        log.appendChild(startBanner);
      }

      const msgTime = new Date();

      // Extract [ITIN_CARD:...] and [ITIN_PROPOSALS:...] tags from bot message
      let displayInfo = info || '';
      let proposalsData = null;

      if (role === 'bot') {
        // Extract proposals tag
        const proposalsMatch = displayInfo.match(/\[ITIN_PROPOSALS:([\s\S]*?)\]/);
        if (proposalsMatch) {
          try { proposalsData = JSON.parse(proposalsMatch[1]); } catch(e) {}
          displayInfo = displayInfo.replace(/\[ITIN_PROPOSALS:[\s\S]*?\]/, '').trim();
        }
        // Extract itinerary card tag
        const itinMatch = displayInfo.match(/\[ITIN_CARD:([\s\S]*?)\]/);
        if (itinMatch) {
          try { itineraryData = JSON.parse(itinMatch[1]); } catch(e) {}
          displayInfo = displayInfo.replace(/\[ITIN_CARD:[\s\S]*?\]/, '').trim();
        }
      }

      let isHtml = false;

      if (role === 'bot') {
        // Đã chuyển logic xử lý "Nổi bật" vào formatChatMarkdown
        displayInfo = formatChatMarkdown(displayInfo);
        isHtml = true;
      }

      // Save to shared chat (localStorage)
      if (!skipSave) {
        try {
          const shared = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');
          shared.push({ role, text: info || '', time: msgTime.toISOString() });
          // Keep only last 50 messages
          if (shared.length > 50) shared.splice(0, shared.length - 50);
          localStorage.setItem('wander_shared_chat', JSON.stringify(shared));
        } catch(e) {}
      }

      const timeStr = msgTime.getHours().toString().padStart(2, '0') + ':' + msgTime.getMinutes().toString().padStart(2, '0');

      const msgContainer = document.createElement('div');
      msgContainer.className = 'chat-message-row ' + (role === 'user' ? 'chat-message-row--user' : 'chat-message-row--bot');

      const msg = document.createElement('div');
      msg.className = 'chat-bubble chat-bubble--' + (role === 'user' ? 'user' : 'bot') + ' animate-bubble';

      let contentHtml = isHtml ? displayInfo : escapeHtml(displayInfo);
      if (images && images.length > 0) {
        let imgsHtml = '<div class="chat-bubble-images" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">';
        images.forEach(img => {
          imgsHtml += `<img src="${img}" style="max-width:120px; max-height:120px; border-radius:8px; border: 1px solid rgba(255,255,255,0.2); object-fit:cover;" />`;
        });
        imgsHtml += '</div>';
        contentHtml += imgsHtml;
      }

      // Bot actions (Copy/Speak) - dùng data-attribute để tránh SyntaxError với ký tự đặc biệt
      const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      if (!window._chatMsgCache) window._chatMsgCache = {};
      window._chatMsgCache[msgId] = info || '';

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
      const hasItin = /ngày\s*\d+|lịch trình|itinerary/i.test(info || '');
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
          const input = document.getElementById('global-chat-input');
          const form = document.getElementById('global-chat-form');
          if (input && form) {
            input.value = `Hãy cấu trúc hóa lịch trình ở trên thành dạng JSON card chuyên nghiệp`;
            form.dispatchEvent(new Event('submit'));
          }
        };
        msg.appendChild(convertBtn);
      }

      msgContainer.appendChild(msg);
      log.appendChild(msgContainer);
      if (!skipScroll) scrollToBottom();

      // Render embedded itinerary/proposals nếu có
      if (proposalsData && proposalsData.length > 0) {
        renderItineraryProposals(proposalsData);
      }
      if (itineraryData) {
        renderItineraryCard(itineraryData);
      }
    }

    function showWelcomeScreen() {
      if (!log) return;
      log.innerHTML = `
        <div class="chat-welcome-screen" id="chat-welcome-screen">
          <h2 class="chat-welcome-title">
            <span class="chat-welcome-title-text">Chào mừng quay trở lại!</span>
            <svg class="chat-welcome-map-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 6 3 20 9 17 15 21 21 17 21 3 15 6 9 2 3 6"></polygon>
              <line x1="9" y1="2" x2="9" y2="17"></line>
              <line x1="15" y1="6" x2="15" y2="21"></line>
            </svg>
          </h2>
          <p class="chat-welcome-subtitle">Hôm nay tụi mình sẽ cùng vi vu ở đâu thế nhỉ? 🚀</p>
        </div>
      `;
    }

    // Load chat history from localStorage (shared between tabs/pages)
    function loadSharedChat() {
      try {
        const shared = JSON.parse(localStorage.getItem('wander_shared_chat') || '[]');
        if (!shared || shared.length === 0) {
          showWelcomeScreen();
          return;
        }
        // Re-render last 20 messages from cache
        const recent = shared.slice(-20);
        recent.forEach(item => {
          appendMsg(item.text, item.role, true, true);
        });
        scrollToBottom(true);
      } catch(e) {
        console.warn('[WanderChat] loadSharedChat error:', e);
        showWelcomeScreen();
      }
    }

    function getDeviceId() {
      let dId = localStorage.getItem('wander_device_id');
      if (!dId) {
        dId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
        localStorage.setItem('wander_device_id', dId);
      }
      return dId;
    }

    // Load chat history from server
    async function loadChatHistory(sessionId) {
      if (!sessionId) return;
      try {
        const token = localStorage.getItem('wander_token');
        const res = await fetch(`/api/chat/history/${sessionId}`, {
          headers: { 'x-auth-token': token || '' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.messages && data.messages.length > 0) {
          // Clear current and re-render from server
          if (log) log.innerHTML = '';
          data.messages.forEach(item => {
            const role = (item.role === 'model' || item.role === 'assistant' || item.role === 'bot') ? 'bot' : 'user';
            appendMsg(item.content || item.text, role, true, true);
          });
          scrollToBottom(true);
        }
      } catch(e) {
        // Silent fail - use local cache
      }
    }

    // Load all chat sessions from server for history list
    async function loadChatSessions() {
      const listContainer = document.getElementById('global-chat-sessions-list');
      if (!listContainer) return;

      listContainer.innerHTML = '<div class="chat-sessions-loading">Đang tải lịch sử...</div>';

      try {
        const token = localStorage.getItem('wander_token');
        const deviceId = getDeviceId();
        const res = await fetch(`/api/chat/sessions?deviceId=${deviceId}`, {
          headers: { 'x-auth-token': token || '' }
        });
        if (!res.ok) {
          listContainer.innerHTML = '<div class="chat-sessions-error">Không thể tải lịch sử trò chuyện.</div>';
          return;
        }

        const data = await res.json();
        if (!data || !data.sessions || data.sessions.length === 0) {
          listContainer.innerHTML = '<div class="chat-sessions-empty">Chưa có lịch sử trò chuyện nào.</div>';
          return;
        }

        listContainer.innerHTML = '';
        data.sessions.forEach(session => {
          const item = document.createElement('div');
          item.className = 'chat-session-item';
          item.dataset.sessionId = session.sessionId;
          
          if (session.sessionId === currentSessionId) {
            item.classList.add('chat-session-item--active');
          }
          
          // Preserve selected class if loading sessions while in select mode
          if (isSelectMode) {
            item.classList.add('chat-session-item--select-mode');
            if (selectedSessionIds.has(session.sessionId)) {
              item.classList.add('chat-session-item--selected');
            }
          }

          let dateStr = '';
          if (session.updatedAt) {
            const date = new Date(session.updatedAt);
            dateStr = date.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }) + ' ' + 
                      date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          }

          item.innerHTML = `
            <div class="chat-session-item__info">
              <span class="chat-session-item__checkbox"></span>
              <span class="chat-session-item__icon">
                <svg class="chat-session-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <div class="chat-session-item__details">
                <div class="chat-session-item__title" title="${escapeHtml(session.title)}">${escapeHtml(session.title)}</div>
                <div class="chat-session-item__time">${dateStr}</div>
              </div>
            </div>
            <button type="button" class="chat-session-item__delete" title="Xóa hội thoại">×</button>
          `;

          // Handle click to load session or select it
          item.addEventListener('click', (e) => {
            if (e.target.closest('.chat-session-item__delete')) return;

            if (isSelectMode) {
              const id = session.sessionId;
              if (selectedSessionIds.has(id)) {
                selectedSessionIds.delete(id);
                item.classList.remove('chat-session-item--selected');
              } else {
                selectedSessionIds.add(id);
                item.classList.add('chat-session-item--selected');
              }
              
              // Update Select all button text dynamically
              const items = document.querySelectorAll('.chat-session-item');
              const allSelected = Array.from(items).every(el => el.classList.contains('chat-session-item--selected'));
              const selectAllBtn = document.getElementById('global-chat-history-select-all');
              if (selectAllBtn) {
                selectAllBtn.textContent = allSelected ? 'Bỏ chọn' : 'Chọn tất cả';
              }
              
              updateSelectFooter();
              return;
            }

            const sessionsView = document.getElementById('global-chat-sessions-view');
            if (sessionsView) {
              sessionsView.setAttribute('hidden', 'true');
            }

            currentSessionId = session.sessionId;
            localStorage.setItem('wander_current_session', currentSessionId);
            
            if (log) log.innerHTML = '';
            
            const loadingRow = document.createElement('div');
            loadingRow.className = 'chat-message-row chat-message-row--bot';
            loadingRow.innerHTML = `
              <div class="chat-bubble chat-bubble--bot" style="padding: 0.75rem 1.25rem;">
                <div class="typing-dots"><span></span><span></span><span></span></div>
              </div>
            `;
            log.appendChild(loadingRow);
            
            loadChatHistory(currentSessionId);
          });

          // Handle delete session
          const deleteBtn = item.querySelector('.chat-session-item__delete');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              // Delete 1 item immediately without showing confirmation
              try {
                const token = localStorage.getItem('wander_token');
                const deleteRes = await fetch(`/api/chat/session/${session.sessionId}?deviceId=${deviceId}`, {
                  method: 'DELETE',
                  headers: { 'x-auth-token': token || '' }
                });
                const deleteData = await deleteRes.json();
                if (deleteData.success) {
                  if (session.sessionId === currentSessionId) {
                    currentSessionId = null;
                    localStorage.removeItem('wander_current_session');
                    localStorage.removeItem('wander_shared_chat');
                    if (log) log.innerHTML = '';
                    loadSharedChat();
                  }
                  loadChatSessions();
                } else {
                  alert(deleteData.message || 'Không thể xóa hội thoại.');
                }
              } catch (err) {
                console.error('Lỗi khi xóa hội thoại:', err);
                alert('Có lỗi xảy ra khi xóa hội thoại.');
              }
            });
          }

          listContainer.appendChild(item);
        });
      } catch (err) {
        console.error('Lỗi khi tải phiên chat:', err);
        listContainer.innerHTML = '<div class="chat-sessions-error">Có lỗi xảy ra khi tải lịch sử.</div>';
      }
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
      { text: '🌊 Phú Quốc 5 ngày', query: 'Lập lịch trình du lịch Phú Quốc 5 ngày 4 đêm' },
      { text: '🏮 Hội An 3 ngày', query: 'Lập lịch trình du lịch Hội An 3 ngày 2 đêm' },
      { text: '🏔️ Sapa 4 ngày', query: 'Lập lịch trình du lịch Sapa 4 ngày 3 đêm' },
    ];

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = input.value.trim();
      const hasImages = window._uploadedImages && window._uploadedImages.length > 0;
      if (!msg && !hasImages) return;
      
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
        const wasVoice = _lastInputWasVoice; // true nếu input từ mic, false nếu gõ text
        _lastInputWasVoice = false; // Reset sau mỗi lần gửi
        
        const imagesToSend = window._uploadedImages ? [...window._uploadedImages] : [];
        if (window._clearChatImages) {
          window._clearChatImages();
        }

        appendMsg(msg, 'user', false, false, null, imagesToSend);
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
               sessionId: currentSessionId,
               images: imagesToSend,
               deviceId: getDeviceId()
             });
          } else {
             const token = localStorage.getItem('wander_token');
             const res = await fetch('/api/chat', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
               body: JSON.stringify({ message: msg, lang: selectedLang, sessionId: currentSessionId, images: imagesToSend, deviceId: getDeviceId() })
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
        
        // 1. Prioritize centralized verified registry
        if (window.WANDER_PLACES_IMAGES) {
            for (const key of Object.keys(window.WANDER_PLACES_IMAGES)) {
                if (dest === key || dest.includes(key) || key.includes(dest)) {
                    const imgs = window.WANDER_PLACES_IMAGES[key];
                    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
                }
            }
        }

        // 2. Fallback to WANDER_PLACES configuration
        if (window.WANDER_PLACES) {
            const found = window.WANDER_PLACES.find(p => {
                const name = (p.name || '').toLowerCase().trim();
                const id = (p.id || '').toLowerCase().trim();
                return dest === name || dest === id || dest.includes(name) || name.includes(dest);
            });
            if (found && found.image) return found.image;
        }

        // Image map - each destination has unique accurate image
        const imgMap = {
            // === TÂY BẮC ===
            'sapa': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80', // sapa verified
            'sa pa': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80',
            'lào cai': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80',
            'hà giang': 'https://images.unsplash.com/photo-1563190095-2296374d5d20?w=400&h=300&fit=crop', // ha giang winding road
            'yên bái': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop', // yen bai terraced fields
            'mai châu': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop', // mai chau
            'mộc châu': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'điện biên': 'https://images.unsplash.com/photo-1562783700-74fc9d4e1b83?w=400&h=300&fit=crop',
            'lai châu': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'sơn la': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'tuyên quang': 'https://vcdn1-dulich.vnecdn.net/2023/12/28/nahang4-1703754248-1703754258-3629-1703758253.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=s2XbmocQKHKJ10fyFgRQrQ',
            'hoà bình': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            
            // === ĐÔNG BẮC ===
            'quảng ninh': 'https://cdn-media.sforum.vn/storage/app/media/anh-vinh-ha-long-28.jpg',
            'hạ long': 'https://cdn-media.sforum.vn/storage/app/media/anh-vinh-ha-long-28.jpg',
            'hải phòng': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop',
            'bắc ninh': 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop',
            'bắc kạn': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            'cao bằng': 'https://images.unsplash.com/photo-1563190095-2296374d5d20?w=400&h=300&fit=crop',
            'lạng sơn': 'https://images.unsplash.com/photo-1553179459-4518c8ca4f24?w=400&h=300&fit=crop',
            
            // === ĐỒNG BẰNG BẮC BỘ ===
            'hà nội': 'https://bizweb.dktcdn.net/100/242/347/files/album-anh-ve-ha-noi-01-0cbc70a3-b767-46e7-9904-d09ad5092662.jpg?v=1720771375029', // hanoi verified
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
            'đà nẵng': 'https://cdn-media.sforum.vn/storage/app/media/ctvseo_MH/%E1%BA%A3nh%20%C4%91%E1%BA%B9p%20%C4%91%C3%A0%20n%E1%BA%B5ng/anh-dep-da-nang-thumb.jpg', // danang verified
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
            'hồ chí minh': 'https://bcp.cdnchinhphu.vn/334894974524682240/2025/10/31/tphcm-hinh-ah-17619225878251619451780.jpg', // HCMC verified
            'tp hcm': 'https://bcp.cdnchinhphu.vn/334894974524682240/2025/10/31/tphcm-hinh-ah-17619225878251619451780.jpg',
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
  var expandedChartInstance = null;

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
    const currentMonthVal = new Date().getMonth() + 1;
    const ctxIds = ['userActivityChart', 'userRadarChart', 'userRegionChart', 'userCategoryChart'];
    const contexts = ctxIds.map(id => document.getElementById(id));
    if (contexts.some(ctx => !ctx)) return;

    Object.values(chartInstances).forEach(i => i && i.destroy());

    const token = localStorage.getItem('wander_token');
    if (!token) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor  = isDark ? '#cbd5e1' : '#475569';
    const mutedColor = isDark ? '#64748b'  : '#94a3b8';
    const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';

    // Setup tab listeners if not already done
    const modalEl = document.getElementById('modal-activity-stats');
    if (modalEl) {
      if (!modalEl.dataset.selectedRange) modalEl.dataset.selectedRange = '7';
      if (!modalEl.dataset.selectedMetric) modalEl.dataset.selectedMetric = 'spending';
    }
    if (modalEl && !modalEl.dataset.tabsInitialized) {
      modalEl.dataset.tabsInitialized = 'true';
      const tabBtns = modalEl.querySelectorAll('.dashboard-tab-btn');
      const tabPanels = modalEl.querySelectorAll('.dashboard-tab-panel');
      
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tabTarget;
          
          tabBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          
          tabPanels.forEach(panel => {
            if (panel.dataset.tabPanel === target) {
              panel.hidden = false;
              panel.classList.add('is-active');
            } else {
              panel.hidden = true;
              panel.classList.remove('is-active');
            }
          });
          
          if (target === 'charts') {
            Object.values(chartInstances).forEach(i => i && i.resize());
          }
        });
      });

      // Range Selector
      modalEl.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modalEl.dataset.selectedRange = btn.dataset.range;
          if (window._renderStatsDashboard) window._renderStatsDashboard();
        });
      });

      // Month Selection Logic
      const monthSelect = document.getElementById('dashboard-month-select');
      const monthLbl = document.getElementById('selected-month-lbl');
      // currentMonthVal is defined at function top
      
      if (monthSelect) {
        monthSelect.value = currentMonthVal;
        if (monthLbl) monthLbl.textContent = currentMonthVal;
        
        if (!modalEl.dataset.monthSelectInitialized) {
          modalEl.dataset.monthSelectInitialized = 'true';
          
          monthSelect.addEventListener('input', () => {
            modalEl.dataset.selectedRange = 'month';
          });
          
          monthSelect.addEventListener('change', (e) => {
            const mVal = e.target.value;
            if (monthLbl) monthLbl.textContent = mVal;
            modalEl.dataset.selectedRange = 'month';
            fetchStatsForMonth(mVal);
          });
          
          monthSelect.addEventListener('click', () => {
            if (modalEl.dataset.selectedRange !== 'month') {
              modalEl.dataset.selectedRange = 'month';
              if (window._renderStatsDashboard) window._renderStatsDashboard();
            }
          });
        }
      }

      function fetchStatsForMonth(mVal) {
        document.querySelectorAll('[data-stat-total-spent], [data-stat-savings], [data-stat-carbon]').forEach(el => {
          el.textContent = '—';
        });
        fetch(`/api/auth/user/stats?month=${mVal}`, { headers: { 'x-auth-token': token } })
          .then(r => r.json())
          .then(data => {
            if (!data.success) return;
            if (data.timeframes) {
              window._dashTimeframes = data.timeframes;
            }
            if (data.bookings) window._dashBookings = data.bookings;
            if (data.activities) window._dashActivities = data.activities;
            if (window._renderStatsDashboard) window._renderStatsDashboard();
          })
          .catch(err => console.error('Lỗi tải thống kê tháng:', err));
      }

      // Metric Selector
      modalEl.querySelectorAll('.metric-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modalEl.dataset.selectedMetric = btn.dataset.metric;
          if (window._renderStatsDashboard) window._renderStatsDashboard();
        });
      });

      // Search & Filter registry table
      const searchInput = document.getElementById('registry-search');
      const statusSelect = document.getElementById('registry-filter-status');
      if (searchInput && statusSelect) {
        const filterRegistry = () => {
          const query = searchInput.value.toLowerCase().trim();
          const status = statusSelect.value;
          const rows = document.querySelectorAll('#registry-table-body tr');
          rows.forEach(row => {
            if (row.cells.length < 5) return;
            const name = row.cells[1].textContent.toLowerCase();
            const id = row.cells[0].textContent.toLowerCase();
            const cat = row.cells[2].textContent.toLowerCase();
            const statusVal = row.dataset.bookingStatus;

            const matchesQuery = name.includes(query) || id.includes(query) || cat.includes(query);
            const matchesStatus = !status || statusVal === status;

            if (matchesQuery && matchesStatus) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          });
        };
        searchInput.addEventListener('input', filterRegistry);
        statusSelect.addEventListener('change', filterRegistry);
      }
    }

    // Set loading indicator
    document.querySelectorAll('[data-stat-total-spent], [data-stat-savings], [data-stat-carbon]').forEach(el => {
      el.textContent = '—';
    });

    fetch(`/api/auth/user/stats?month=${currentMonthVal}`, { headers: { 'x-auth-token': token } })
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;

        window._dashBookings = data.bookings || [];
        window._dashActivities = data.activities || [];

        const s = data.summary;
        const c = data.charts;

        // ── Render Level Progress Card ──
        const setHtml = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
        const setVal = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };

        setHtml('member-tier-name', s.rank || 'Thành viên Khám phá');
        setHtml('member-level-num', s.level || '1');
        setHtml('lbl-curr-lvl', s.level || '1');
        setHtml('lbl-next-lvl', (s.level || 1) + 1);
        setHtml('member-exp-total', (s.exp || 0).toLocaleString('vi-VN') + ' XP');
        setHtml('lbl-xp-remaining', `Cần ${1000 - (s.exp % 1000)} XP để lên cấp tiếp theo`);
        
        const progressFill = document.getElementById('member-level-progress');
        if (progressFill) progressFill.style.width = (s.levelProgress || 0) + '%';

        // ── Render Executive KPIs ──
        setVal('[data-stat-total-spent]', s.totalSpent || '0 VNĐ');
        setVal('[data-stat-savings]', s.savings || '0 VNĐ');
        setVal('[data-stat-carbon]', s.carbon || '0 kg CO₂');
        setVal('#data-stat-completion-rate', s.completionRate != null ? s.completionRate : '0%');

        // ── Render Additional Smart Stats ──
        setVal('[data-stat-trips]', s.trips);
        setVal('[data-stat-reviews]', s.reviewsCount);
        setVal('[data-stat-chat]', s.messages);
        setVal('[data-stat-friends-posts]', `${s.friends || 0} bạn · ${s.posts || 0} bài`);

        // ── Render Bookings Table ──
        const tbody = document.getElementById('registry-table-body');
        if (tbody) {
          if (!data.bookings || data.bookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">Không có giao dịch dịch vụ nào được ghi nhận.</td></tr>`;
          } else {
            tbody.innerHTML = data.bookings.map(bk => {
              const dateStr = bk.useDate ? new Date(bk.useDate).toLocaleDateString('vi-VN') : '—';
              const priceStr = (bk.totalPrice || 0).toLocaleString('vi-VN');
              
              let payBadge = '';
              if (bk.paymentStatus === 'paid') payBadge = '<span class="badge-status badge-success">Đã thanh toán</span>';
              else if (bk.paymentStatus === 'pending') payBadge = '<span class="badge-status badge-warning">Chờ xử lý</span>';
              else payBadge = '<span class="badge-status badge-danger">Chưa trả</span>';
              
              let statusBadge = '';
              if (bk.status === 'completed') statusBadge = '<span class="badge-status badge-success">Đã hoàn thành</span>';
              else if (bk.status === 'confirmed') statusBadge = '<span class="badge-status badge-primary">Xác nhận</span>';
              else if (bk.status === 'cancelled') statusBadge = '<span class="badge-status badge-danger">Đã hủy</span>';
              else statusBadge = '<span class="badge-status badge-warning">Chờ duyệt</span>';
              
              const cats = { stay: '🏨 Nơi ở', dining: '🥘 Ẩm thực', tour: '🎟️ Tour', rental: '🚗 Thuê xe', other: '✨ Dịch vụ' };
              const catLabel = cats[bk.businessCategory] || cats.other;
              
              return `
                <tr data-booking-status="${bk.status}">
                  <td style="font-family: monospace; font-weight: 700; color: var(--accent);">${bk.bookingId || '—'}</td>
                  <td style="font-weight: 600; color: var(--text);">${bk.placeName || 'Dịch vụ đối tác'}</td>
                  <td style="font-size: 0.85rem; color: var(--text-muted);">${catLabel}</td>
                  <td>${dateStr}</td>
                  <td style="text-align: right; font-weight: 700; color: var(--text);">${priceStr}đ</td>
                  <td>${payBadge}</td>
                  <td>${statusBadge}</td>
                </tr>
              `;
            }).join('');
          }
        }

        // ── Render Achievements & Badges ──
        const esgValEl = document.getElementById('esg-carbon-kg-val');
        if (esgValEl) esgValEl.textContent = s.carbonKg || '0';

        const badgesContainer = document.getElementById('badges-grid-container');
        if (badgesContainer && data.badges) {
          badgesContainer.innerHTML = Object.keys(data.badges).map(key => {
            const b = data.badges[key];
            const glowClass = b.unlocked ? 'badge-card--unlocked' : 'badge-card--locked';
            const filterStyle = b.unlocked ? '' : 'filter: grayscale(1); opacity: 0.5;';
            const iconMap = { explorer: '🗺️', creator: '✍️', aiFriend: '💬', critic: '⭐', vip: '🏨', eco: '🌳' };
            const icon = iconMap[key] || '🏆';
            
            return `
              <div class="badge-card ${glowClass}">
                <div class="badge-icon-wrap" style="${filterStyle}">
                  <span class="badge-icon-emoji">${icon}</span>
                </div>
                <div class="badge-card-info">
                  <div class="badge-card-title">${b.label}</div>
                  <div class="badge-card-desc">${b.desc}</div>
                  <div class="badge-progress-bar" style="margin-top: 0.6rem; height: 4px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden;">
                    <div style="width: ${b.progress}%; height: 100%; background: var(--accent); border-radius: 99px;"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }

        // ── Render Audit Logs timeline ──
        const logsContainer = document.getElementById('audit-timeline-container');
        if (logsContainer) {
          if (!data.activities || data.activities.length === 0) {
            logsContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Không có nhật ký hoạt động nào được ghi nhận.</div>`;
          } else {
            logsContainer.innerHTML = data.activities.map(act => {
              const dateObj = new Date(act.timestamp);
              const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + dateObj.toLocaleDateString('vi-VN');
              
              const iconMap = {
                view_place: '👁️',
                search: '🔍',
                save_trip: '🗺️',
                booking: '🏨',
                review: '📝',
                social_post: '👥',
                share: '🔗',
                itinerary_gen: '🤖',
                filter_biz: '⚡'
              };
              const icon = iconMap[act.type] || '⚙️';
              
              return `
                <div class="audit-log-item">
                  <span class="audit-log-icon">${icon}</span>
                  <div class="audit-log-content">
                    <div class="audit-log-desc">${act.description}</div>
                    <div class="audit-log-meta">
                      <span>🕒 ${timeStr}</span>
                      ${act.ip ? `<span>• IP: ${act.ip}</span>` : ''}
                      ${act.userAgent ? `<span>• Thiết bị: ${act.userAgent.split(') ')[0].replace('Mozilla/5.0 (', '')}</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('');
          }
        }

        // ── Dynamic Chart Rendering with Filters ──
        window._dashTimeframes = data.timeframes || {
          '7': { summary: s, charts: c },
          '30': { summary: s, charts: c },
          'all': { summary: s, charts: c }
        };

        window._renderStatsDashboard = function() {
          const range = modalEl.dataset.selectedRange || '7';
          const metric = modalEl.dataset.selectedMetric || 'spending';

          // Sync range buttons visual state
          modalEl.querySelectorAll('.range-btn').forEach(btn => {
            if (btn.dataset.range === range) btn.classList.add('is-active');
            else btn.classList.remove('is-active');
          });

          // Sync metric buttons visual state
          modalEl.querySelectorAll('.metric-btn').forEach(btn => {
            if (btn.dataset.metric === metric) btn.classList.add('is-active');
            else btn.classList.remove('is-active');
          });

          const tfData = window._dashTimeframes[range] || window._dashTimeframes['all'] || { summary: s, charts: c };
          const currentSummary = tfData.summary || s;
          const currentCharts = tfData.charts || c;

          // Clear previous instances
          Object.values(chartInstances).forEach(i => i && i.destroy());

          const openChartExpandOverlay = (chartType) => {
            const overlay = document.getElementById('chart-expand-overlay');
            const canvas = document.getElementById('expandedChartCanvas');
            const table = document.getElementById('expanded-chart-table');
            const title = document.getElementById('expand-chart-title');
            if (!overlay || !canvas || !table) return;
            
            if (window.expandedChartInstance) {
              window.expandedChartInstance.destroy();
            }
            
            let config = null;
            let tableHtml = '';
            
            if (chartType === 'line' && chartInstances.line) {
              title.innerHTML = '📊 Xu hướng chi tiêu & Hoạt động';
              const origConfig = chartInstances.line.config;
              config = {
                 type: origConfig.type,
                 data: {
                    labels: origConfig.data.labels,
                    datasets: origConfig.data.datasets.map(ds => ({ ...ds }))
                 },
                 options: {
                    ...origConfig.options,
                    maintainAspectRatio: false,
                    onClick: null,
                    plugins: {
                       ...origConfig.options.plugins,
                       legend: { display: true, position: 'top', labels: { color: textColor } }
                    }
                 }
              };
              
              tableHtml = '<thead><tr><th>Thời gian</th><th style="text-align:right;">Giá trị</th></tr></thead><tbody>' + 
                chartInstances.line.data.labels.map((lbl, i) => {
                   const val = chartInstances.line.data.datasets[0].data[i];
                   const valStr = metric === 'spending' ? new Intl.NumberFormat('vi-VN').format(val) + 'đ' : val + ' lần';
                   return '<tr><td>' + lbl + '</td><td style="text-align:right; font-weight:bold;">' + valStr + '</td></tr>';
                }).join('') + '</tbody>';
            } else if (chartType === 'cat' && chartInstances.cat) {
              title.innerHTML = '🍩 Phân bổ cơ cấu ngân sách';
              const origConfig = chartInstances.cat.config;
              config = {
                 type: origConfig.type,
                 data: {
                    labels: origConfig.data.labels,
                    datasets: origConfig.data.datasets.map(ds => ({ ...ds }))
                 },
                 options: {
                    ...origConfig.options,
                    maintainAspectRatio: false,
                    onClick: null
                 }
              };
              
              tableHtml = '<thead><tr><th>Danh mục</th><th style="text-align:right;">Chi tiêu (VNĐ)</th></tr></thead><tbody>' + 
                chartInstances.cat.data.labels.map((lbl, i) => {
                   const val = chartInstances.cat.data.datasets[0].data[i];
                   return '<tr><td>' + lbl + '</td><td style="text-align:right; font-weight:bold;">' + new Intl.NumberFormat('vi-VN').format(val) + 'đ</td></tr>';
                }).join('') + '</tbody>';
            } else if (chartType === 'radar' && chartInstances.radar) {
              title.innerHTML = '🕸️ Ma trận năng lực di chuyển';
              const origConfig = chartInstances.radar.config;
              config = {
                 type: origConfig.type,
                 data: {
                    labels: origConfig.data.labels,
                    datasets: origConfig.data.datasets.map(ds => ({ ...ds }))
                 },
                 options: {
                    ...origConfig.options,
                    maintainAspectRatio: false,
                    onClick: null
                 }
              };
              tableHtml = '<thead><tr><th>Kỹ năng</th><th style="text-align:right;">Điểm số</th></tr></thead><tbody>' + 
                chartInstances.radar.data.labels.map((lbl, i) => {
                   const val = chartInstances.radar.data.datasets[0].data[i];
                   return '<tr><td>' + lbl + '</td><td style="text-align:right; font-weight:bold;">' + val + '</td></tr>';
                }).join('') + '</tbody>';
            } else if (chartType === 'region' && chartInstances.region) {
              title.innerHTML = '📍 Địa bàn hành trình';
              const origConfig = chartInstances.region.config;
              config = {
                 type: origConfig.type,
                 data: {
                    labels: origConfig.data.labels,
                    datasets: origConfig.data.datasets.map(ds => ({ ...ds }))
                 },
                 options: {
                    ...origConfig.options,
                    maintainAspectRatio: false,
                    onClick: null
                 }
              };
              tableHtml = '<thead><tr><th>Vùng miền</th><th style="text-align:right;">Số chuyến đi</th></tr></thead><tbody>' + 
                chartInstances.region.data.labels.map((lbl, i) => {
                   const val = chartInstances.region.data.datasets[0].data[i];
                   return '<tr><td>' + lbl + '</td><td style="text-align:right; font-weight:bold;">' + val + '</td></tr>';
                }).join('') + '</tbody>';
            }
            
            table.innerHTML = tableHtml;
            
            overlay.style.display = 'flex';
            void overlay.offsetWidth;
            overlay.classList.add('is-open');
            overlay.style.opacity = '1';
            
            if (config) {
               window.expandedChartInstance = new Chart(canvas, config);
            }
          };

          // ── Chart 1: Hoạt động & Chi tiêu (Line) ──
          const actCtx = contexts[0].getContext('2d');
          const actGrad = actCtx.createLinearGradient(0, 0, 0, 280);
          if (metric === 'spending') {
            actGrad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
            actGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
          } else {
            actGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
            actGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          }

          chartInstances.line = new Chart(contexts[0], {
            type: 'line',
            data: {
              labels: currentCharts.labels || (range === '7' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : []),
              datasets: [{
                label: metric === 'spending' ? 'Chi tiêu' : 'Hoạt động',
                data: metric === 'spending'
                  ? (currentCharts.spendingTrend && currentCharts.spendingTrend.length ? currentCharts.spendingTrend : [0,0,0,0,0,0,0])
                  : (currentCharts.activity && currentCharts.activity.length ? currentCharts.activity : [0,0,0,0,0,0,0]),
                borderColor: metric === 'spending' ? '#6366f1' : '#10b981',
                borderWidth: 3,
                fill: true,
                backgroundColor: actGrad,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: metric === 'spending' ? '#6366f1' : '#10b981',
                pointBorderWidth: 2.5,
                pointHoverRadius: 7
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              onClick: function(e, activeElements) {
                if (activeElements.length > 0) {
                  const dataIndex = activeElements[0].index;
                  const datasetIndex = activeElements[0].datasetIndex;
                  const label = chartInstances.line.data.labels[dataIndex];
                  const value = chartInstances.line.data.datasets[datasetIndex].data[dataIndex];
                  
                  const overlay = document.getElementById('day-detail-overlay');
                  if (!overlay) return;
                  document.getElementById('day-detail-title-date').textContent = label;
                  
                  let totalSpent = 0;
                  let activityCount = 0;
                  
                  if (metric === 'spending') {
                    totalSpent = value;
                    document.getElementById('day-detail-spent').textContent = new Intl.NumberFormat('vi-VN').format(value) + 'đ';
                    document.getElementById('day-detail-activity').textContent = '--';
                  } else {
                    activityCount = value;
                    document.getElementById('day-detail-activity').textContent = value + ' lần';
                    document.getElementById('day-detail-spent').textContent = '--';
                  }
                  
                  const dateMatches = (d) => {
                     const dateObj = new Date(d);
                     if (range === '7') return true;
                     if (range === 'month') return dateObj.getDate().toString() === label.toString();
                     return true;
                  };
                  
                  const dayBks = (window._dashBookings || []).filter(b => b.useDate && dateMatches(b.useDate));
                  let bookingsHtml = '';
                  if (dayBks.length === 0) {
                     bookingsHtml = '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1rem;">Không có giao dịch dịch vụ nào.</div>';
                  } else {
                     bookingsHtml = dayBks.map(b => '<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:0.75rem; border-radius:10px; display:flex; justify-content:space-between; align-items:center;"><div><div style="font-weight:600; font-size:0.9rem; color:var(--text);">' + (b.placeName || 'Dịch vụ') + '</div><div style="font-size:0.8rem; color:var(--text-muted);">' + (b.bookingId || '') + '</div></div><div style="font-weight:700; color:var(--accent);">' + new Intl.NumberFormat('vi-VN').format(b.totalPrice || 0) + 'đ</div></div>').join('');
                  }
                  document.getElementById('day-detail-bookings').innerHTML = bookingsHtml;
                  
                  const dayLogs = (window._dashActivities || []).filter(a => a.timestamp && dateMatches(a.timestamp));
                  let logsHtml = '';
                  if (dayLogs.length === 0) {
                     logsHtml = '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1rem;">Không có hoạt động nào được ghi nhận.</div>';
                  } else {
                     logsHtml = dayLogs.slice(0, 10).map(a => '<div style="display:flex; gap:0.5rem; align-items:flex-start; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);"><span>' + (a.type==='booking'?'🏨':'🔍') + '</span><div style="font-size:0.85rem; color:var(--text-muted);">' + a.description + '</div></div>').join('');
                  }
                  document.getElementById('day-detail-logs').innerHTML = logsHtml;
                  
                  overlay.style.display = 'flex';
                  void overlay.offsetWidth;
                  overlay.classList.add('is-open');
                  overlay.style.opacity = '1';
                } else {
                  openChartExpandOverlay('line');
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
                  titleColor: textColor,
                  bodyColor: textColor,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.15)',
                  borderWidth: 1,
                  padding: 10,
                  cornerRadius: 10,
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) label += ': ';
                      if (context.parsed.y !== null) {
                        if (metric === 'spending') {
                          label += new Intl.NumberFormat('vi-VN').format(context.parsed.y) + 'đ';
                        } else {
                          label += context.parsed.y + ' lần';
                        }
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: textColor, font: { weight: '600', size: 11 } } },
                y: {
                  grid: { color: gridColor },
                  ticks: {
                    color: mutedColor,
                    font: { size: 10 },
                    beginAtZero: true,
                    callback: function(value) {
                      if (metric === 'spending') {
                        if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'Mđ';
                        if (value >= 1000) return (value / 1000).toFixed(0) + 'Kđ';
                        return value + 'đ';
                      } else {
                        return value;
                      }
                    }
                  }
                }
              }
            }
          });

          // ── Chart 2: Kỹ năng (Radar) ──
          chartInstances.radar = new Chart(contexts[1], {
            type: 'radar',
            data: {
              labels: ['Khám phá', 'Kỹ năng', 'AI', 'Cộng đồng', 'Bền bỉ', 'Sở thích'],
              datasets: [{
                label: 'Điểm số',
                data: currentCharts.radar && currentCharts.radar.length ? currentCharts.radar : [50,50,50,50,50,50],
                backgroundColor: 'rgba(99,102,241,0.15)',
                borderColor: '#6366f1',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              onClick: function() { openChartExpandOverlay('radar'); },
              layout: { padding: 20 },
              plugins: { legend: { display: false } },
              scales: {
                r: {
                  grid: { color: gridColor },
                  angleLines: { color: gridColor },
                  pointLabels: { color: textColor, font: { size: 11, weight: '600', family: 'Inter, sans-serif' } },
                  ticks: { display: false },
                  suggestedMin: 0, suggestedMax: 100
                }
              }
            }
          });

          // ── Chart 3: Vùng miền (Bar) ──
          const regions = Object.keys(currentCharts.regions || {});
          const regionValues = Object.values(currentCharts.regions || {});
          const barCtx = contexts[2].getContext('2d');
          const barGrad = barCtx.createLinearGradient(0, 0, 0, 200);
          barGrad.addColorStop(0, '#06b6d4'); // Cyan
          barGrad.addColorStop(1, '#6366f1'); // Indigo

          chartInstances.region = new Chart(contexts[2], {
            type: 'bar',
            data: {
              labels: regions.length ? regions : ['Chưa có'],
              datasets: [{
                label: 'Số chuyến đi',
                data: regionValues.length ? regionValues : [0],
                backgroundColor: barGrad,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 32
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              onClick: function() { openChartExpandOverlay('region'); },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
                  titleColor: textColor,
                  bodyColor: textColor,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.15)',
                  borderWidth: 1,
                  padding: 10,
                  cornerRadius: 10
                }
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: textColor, font: { weight: '600', size: 11 } } },
                y: {
                  grid: { color: gridColor },
                  ticks: { color: mutedColor, font: { size: 10 }, precision: 0 },
                  beginAtZero: true
                }
              }
            }
          });

          // ── Chart 4: Phân bổ Ngân sách (Doughnut) ──
          const categoryData = currentCharts.categoryBreakdown ? [
            currentCharts.categoryBreakdown.stay || 0,
            currentCharts.categoryBreakdown.dining || 0,
            currentCharts.categoryBreakdown.tour || 0,
            currentCharts.categoryBreakdown.rental || 0,
            currentCharts.categoryBreakdown.other || 0
          ] : [0,0,0,0,0];
          
          const catLabels = ['Nơi ở', 'Ẩm thực', 'Tour', 'Thuê xe', 'Khác'];
          const donutColors = ['#6366f1','#06b6d4','#f43f5e','#10b981','#f59e0b'];

          chartInstances.cat = new Chart(contexts[3], {
            type: 'doughnut',
            data: {
              labels: catLabels,
              datasets: [{
                data: categoryData,
                backgroundColor: donutColors,
                borderWidth: 0,
                hoverOffset: 12
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              onClick: function() { openChartExpandOverlay('cat'); },
              layout: { padding: 8 },
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: textColor, boxWidth: 11, padding: 14,
                    font: { size: 11, weight: '600' }
                  }
                },
                tooltip: {
                  backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
                  titleColor: textColor,
                  bodyColor: textColor,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.15)',
                  borderWidth: 1,
                  padding: 10,
                  cornerRadius: 10,
                  callbacks: {
                    label: function(context) {
                      let label = context.label || '';
                      if (label) label += ': ';
                      if (context.parsed !== null) {
                        label += new Intl.NumberFormat('vi-VN').format(context.parsed) + 'đ';
                      }
                      return label;
                    }
                  }
                }
              },
              cutout: '68%'
            },
            plugins: [{
              id: 'centerText',
              afterDraw: function(chart) {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                if (!meta.data || !meta.data[0]) return;
                const xCenter = meta.data[0].x;
                const yCenter = meta.data[0].y;
                
                ctx.save();
                
                // Subtitle
                ctx.textBaseline = "middle";
                ctx.textAlign = "center";
                ctx.font = "600 10px Inter, sans-serif";
                ctx.fillStyle = mutedColor;
                ctx.fillText("TỔNG CHI TIÊU", xCenter, yCenter - 10);
                
                // Value
                ctx.font = "bold 13px Inter, sans-serif";
                ctx.fillStyle = textColor;
                ctx.fillText(currentSummary.totalSpent || "0đ", xCenter, yCenter + 8);
                
                ctx.restore();
              }
            }]
          });
        };

        window._renderStatsDashboard();

        // Bind Overlay Close Events
        const closeExpandBtn = document.getElementById('close-chart-expand');
        if (closeExpandBtn) {
          closeExpandBtn.addEventListener('click', () => {
            const overlay = document.getElementById('chart-expand-overlay');
            if(overlay) {
              overlay.classList.remove('is-open');
              setTimeout(() => { 
                 overlay.style.display = 'none'; 
                 if (window.expandedChartInstance) {
                   window.expandedChartInstance.destroy();
                   window.expandedChartInstance = null;
                 }
              }, 300);
            }
          });
        }
        
        const closeDayBtn = document.getElementById('close-day-detail');
        if (closeDayBtn) {
          closeDayBtn.addEventListener('click', () => {
            const overlay = document.getElementById('day-detail-overlay');
            if(overlay) {
              overlay.classList.remove('is-open');
              setTimeout(() => { overlay.style.display = 'none'; }, 300);
            }
          });
        }

      }).catch(err => {
        console.error('Lỗi tải thống kê:', err);
        document.querySelectorAll('[data-stat-total-spent], [data-stat-savings], [data-stat-carbon]').forEach(el => {
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
    // If only one argument is provided, treat it as the message
    if (message === undefined) {
      message = title;
      title = "Xác nhận";
    }
    return new Promise((resolve) => {
      const modalHtml = `
        <div id="temp-confirm-modal" class="modal" style="z-index: 2147483647; position: fixed; inset: 0; background: rgba(10, 18, 28, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex !important; align-items: center; justify-content: center; pointer-events: auto; padding: 16px;">
          <div class="modal__inner" style="max-width: 400px; width: 100%; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); pointer-events: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
            <div class="modal__header" style="padding: 0; border: none; display: flex; align-items: center; justify-content: space-between;">
              <h3 class="modal__title" style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text); font-family: 'Outfit', sans-serif;">${title}</h3>
            </div>
            <div class="modal__body" style="padding: 0;">
              <p style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; margin: 0;">${message}</p>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button class="btn btn--outline flex-1" id="confirm-cancel" style="cursor: pointer; padding: 10px 16px; border-radius: 12px; font-weight: 600; transition: all 0.2s;">Hủy</button>
              <button class="btn btn--danger flex-1" id="confirm-ok" style="cursor: pointer; padding: 10px 16px; border-radius: 12px; font-weight: 600; background: #ef4444; color: white; border: none; transition: all 0.2s;">Đồng ý</button>
            </div>
          </div>
        </div>
      `;
      const div = document.createElement('div');
      div.id = 'temp-confirm-wrapper';
      div.innerHTML = modalHtml;
      document.body.appendChild(div);

      document.getElementById('confirm-cancel').onclick = () => {
        div.remove();
        resolve(false);
      };
      document.getElementById('confirm-ok').onclick = () => {
        div.remove();
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

      /* ═══════════════════════════════════════════
         STATS MODAL — ENTERPRISE DASHBOARD v4.0
         Theme-adaptive · Glassmorphism · Premium
         ═══════════════════════════════════════════ */

      /* ── Modal wrapper ── */
      .activity-stats-modal {
        background: linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg) 100%) !important;
        border: 1px solid var(--border) !important;
        box-shadow: 0 40px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) !important;
        border-radius: 28px !important;
      }

      /* ── Modal Header ── */
      .activity-stats-modal .modal__header {
        background: transparent !important;
        border-bottom: 1px solid var(--border) !important;
        padding: 1.25rem 2rem !important;
      }
      .activity-stats-modal .modal__title {
        font-size: 1.35rem !important;
        font-weight: 850 !important;
        letter-spacing: -0.02em !important;
        color: var(--text) !important;
        font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif !important;
      }

      /* ── Charts Grid ── */
      .activity-charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
        gap: 1.25rem;
        margin-bottom: 2rem;
      }

      /* ── Tab Switcher Nav ── */
      .dashboard-tabs-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 0.25rem;
      }
      [data-theme="light"] .dashboard-tabs-nav,
      html:not([data-theme="dark"]) .dashboard-tabs-nav {
        background: rgba(15, 23, 42, 0.03);
        border-color: rgba(15, 23, 42, 0.05);
      }
      .dashboard-tab-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 0.5rem 0.95rem;
        font-size: 0.82rem;
        font-weight: 700;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .dashboard-tab-btn:hover {
        color: var(--text);
        background: rgba(255, 255, 255, 0.02);
      }
      [data-theme="light"] .dashboard-tab-btn:hover,
      html:not([data-theme="dark"]) .dashboard-tab-btn:hover {
        background: rgba(15, 23, 42, 0.02);
      }
      .dashboard-tab-btn.is-active {
        background: var(--accent) !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      }

      /* ── Tab Panel Switcher Animations ── */
      .dashboard-tab-panel {
        display: none;
        animation: dashboardPanelFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .dashboard-tab-panel.is-active {
        display: block;
      }
      @keyframes dashboardPanelFade {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* ── Corporate level card ── */
      .corporate-level-card {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%);
        border: 1px solid rgba(99, 102, 241, 0.15);
        border-radius: 22px;
        padding: 1.5rem 1.75rem;
        margin-bottom: 1.75rem;
        position: relative;
        overflow: hidden;
      }
      .corporate-level-card::after {
        content: '';
        position: absolute; inset: 0;
        background: radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 60%);
        pointer-events: none;
      }
      .level-card-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      .member-tier-badge {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        color: #0f172a;
        font-weight: 800;
        font-size: 0.68rem;
        text-transform: uppercase;
        padding: 0.25rem 0.65rem;
        border-radius: 99px;
        letter-spacing: 0.06em;
        display: inline-block;
        margin-bottom: 0.4rem;
        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.2);
      }
      .level-text-large {
        font-size: 1.6rem;
        font-weight: 900;
        color: var(--text);
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .level-progress-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .level-progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 99px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.04);
      }
      [data-theme="light"] .level-progress-bar,
      html:not([data-theme="dark"]) .level-progress-bar {
        background: rgba(15, 23, 42, 0.06);
        border-color: rgba(15, 23, 42, 0.04);
      }
      .level-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #06b6d4);
        border-radius: 99px;
        transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .level-progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: 600;
      }

      /* ── Summary Cards Grid ── */
      .stats-summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
        gap: 1.1rem;
        margin-bottom: 2rem;
      }

      /* ── Individual Stat Card ── */
      .stats-card {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem 1.6rem;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
        cursor: default;
      }
      .stats-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 3px;
        background: var(--stats-accent, linear-gradient(90deg, #6366f1, #06b6d4));
        border-radius: 20px 20px 0 0;
        opacity: 0.85;
      }
      .stats-card::after {
        content: '';
        position: absolute; inset: 0;
        background: radial-gradient(circle at 110% -10%, var(--stats-glow, rgba(99,102,241,0.12)) 0%, transparent 55%);
        pointer-events: none;
        opacity: 0.6;
        transition: opacity 0.35s;
      }
      .stats-card:hover {
        transform: translateY(-6px) scale(1.015);
        border-color: var(--primary-light, #818cf8);
        box-shadow: 0 20px 45px rgba(0,0,0,0.22), 0 0 0 1px rgba(99,102,241,0.15);
      }
      .stats-card:hover::after { opacity: 1; }

      .stats-card[data-color="cyan"]::before   { background: linear-gradient(90deg, #06b6d4, #38bdf8); }
      .stats-card[data-color="cyan"]::after    { background: radial-gradient(circle at 110% -10%, rgba(6,182,212,0.14) 0%, transparent 55%); }
      .stats-card[data-color="rose"]::before   { background: linear-gradient(90deg, #f43f5e, #fb7185); }
      .stats-card[data-color="rose"]::after    { background: radial-gradient(circle at 110% -10%, rgba(244,63,94,0.13) 0%, transparent 55%); }
      .stats-card[data-color="violet"]::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
      .stats-card[data-color="violet"]::after  { background: radial-gradient(circle at 110% -10%, rgba(139,92,246,0.13) 0%, transparent 55%); }
      .stats-card[data-color="amber"]::before  { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
      .stats-card[data-color="amber"]::after   { background: radial-gradient(circle at 110% -10%, rgba(245,158,11,0.13) 0%, transparent 55%); }

      .stats-card__icon {
        font-size: 1.55rem;
        margin-bottom: 0.75rem;
        display: block;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18));
      }
      .stats-card__label {
        display: block;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 0.4rem;
      }
      .stats-card__value {
        display: block;
        font-size: 2.2rem;
        font-weight: 900;
        font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif;
        line-height: 1.1;
        margin-bottom: 0.6rem;
        background: var(--stats-val-grad, linear-gradient(135deg, #6366f1 0%, #06b6d4 100%));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
      }
      .stats-card[data-color="cyan"]   .stats-card__value { background: linear-gradient(135deg, #06b6d4 0%, #38bdf8 100%); -webkit-background-clip: text; background-clip: text; }
      .stats-card[data-color="rose"]   .stats-card__value { background: linear-gradient(135deg, #f43f5e 0%, #fb923c 100%); -webkit-background-clip: text; background-clip: text; }
      .stats-card[data-color="violet"] .stats-card__value { background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); -webkit-background-clip: text; background-clip: text; }
      .stats-card[data-color="amber"]  .stats-card__value { background: linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%); -webkit-background-clip: text; background-clip: text; }

      .stats-card__trend {
        font-size: 0.8rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 99px;
        padding: 0.25rem 0.65rem;
        width: fit-content;
        font-weight: 500;
      }

      /* ── Charts Grid ── */
      .activity-charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
        gap: 1.25rem;
        margin-bottom: 2rem;
      }
      .chart-container {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 22px;
        padding: 1.5rem;
        height: 340px;
        display: flex;
        flex-direction: column;
        transition: box-shadow 0.3s, border-color 0.3s;
      }
      .chart-container:hover {
        border-color: rgba(99,102,241,0.3);
        box-shadow: 0 12px 30px rgba(0,0,0,0.15);
      }
      .chart-title {
        font-size: 0.95rem;
        font-weight: 800;
        margin-bottom: 1.25rem;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }

      /* ── Transaction Registry Table ── */
      .table-responsive {
        border-radius: 16px;
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
      }
      .dashboard-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 0.88rem;
      }
      .dashboard-table th {
        background: rgba(255, 255, 255, 0.02);
        color: var(--text-muted);
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.72rem;
        letter-spacing: 0.05em;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border);
      }
      [data-theme="light"] .dashboard-table th,
      html:not([data-theme="dark"]) .dashboard-table th {
        background: rgba(15, 23, 42, 0.01);
      }
      .dashboard-table td {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border);
        color: var(--text);
      }
      .dashboard-table tbody tr:last-child td {
        border-bottom: none;
      }
      .dashboard-table tbody tr {
        transition: background 0.2s ease;
      }
      .dashboard-table tbody tr:hover {
        background: rgba(255, 255, 255, 0.015);
      }
      [data-theme="light"] .dashboard-table tbody tr:hover,
      html:not([data-theme="dark"]) .dashboard-table tbody tr:hover {
        background: rgba(15, 23, 42, 0.008);
      }
      .badge-status {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        font-size: 0.72rem;
        font-weight: 700;
        border-radius: 6px;
      }
      .badge-status.badge-success {
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
      .badge-status.badge-warning {
        background: rgba(245, 158, 11, 0.12);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }
      .badge-status.badge-danger {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }
      .badge-status.badge-primary {
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }

      /* ── Achievements & ESG Badges ── */
      .badge-card {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.1rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      .badge-card--unlocked {
        border-color: rgba(99, 102, 241, 0.22);
        box-shadow: 0 4px 18px rgba(99, 102, 241, 0.05);
      }
      .badge-card--unlocked:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(99, 102, 241, 0.14);
        border-color: rgba(99, 102, 241, 0.4);
      }
      .badge-card--locked {
        opacity: 0.75;
      }
      .badge-icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      [data-theme="light"] .badge-icon-wrap,
      html:not([data-theme="dark"]) .badge-icon-wrap {
        background: rgba(15, 23, 42, 0.03);
        border-color: rgba(15, 23, 42, 0.05);
      }
      .badge-card--unlocked .badge-icon-wrap {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15));
        border-color: rgba(99, 102, 241, 0.25);
      }
      .badge-icon-emoji {
        font-size: 1.7rem;
      }
      .badge-card-info {
        flex: 1;
      }
      .badge-card-title {
        font-weight: 700;
        font-size: 0.92rem;
        color: var(--text);
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .badge-card-desc {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin-top: 0.15rem;
        line-height: 1.4;
      }

      /* ── Audit Timeline Logs ── */
      .audit-log-item {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.85rem 1rem;
        display: flex;
        gap: 0.85rem;
        align-items: center;
        transition: transform 0.2s;
      }
      .audit-log-item:hover {
        transform: translateX(3px);
      }
      .audit-log-icon {
        font-size: 1.3rem;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      [data-theme="light"] .audit-log-icon,
      html:not([data-theme="dark"]) .audit-log-icon {
        background: rgba(15, 23, 42, 0.03);
        border-color: rgba(15, 23, 42, 0.05);
      }
      .audit-log-content {
        flex: 1;
      }
      .audit-log-desc {
        font-size: 0.86rem;
        font-weight: 600;
        color: var(--text);
        line-height: 1.4;
      }
      .audit-log-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        font-size: 0.72rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
        font-weight: 500;
      }

      /* ── Extra Stats Section ── */
      .extra-stats-section {
        background: var(--bg-elevated) !important;
        border: 1px solid var(--border) !important;
        border-radius: 22px !important;
        padding: 1.75rem 2rem !important;
        margin-top: 2rem;
      }
      .extra-stats-section h4 {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-size: 1.05rem !important;
        font-weight: 800 !important;
        color: var(--text) !important;
        letter-spacing: -0.01em !important;
      }
      .extra-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1.25rem;
      }
      .extra-stat-item {
        background: var(--bg) !important;
        border: 1px solid var(--border) !important;
        border-radius: 16px !important;
        padding: 1.1rem 1.25rem !important;
        display: flex !important;
        align-items: center !important;
        gap: 1rem !important;
        transition: all 0.25s ease !important;
      }
      .extra-stat-item:hover {
        transform: translateY(-3px) !important;
        border-color: var(--primary-light, #818cf8) !important;
        box-shadow: 0 8px 20px rgba(0,0,0,0.12) !important;
      }
      .extra-stat-item .icon {
        font-size: 1.6rem !important;
        background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.12)) !important;
        border: 1px solid rgba(99,102,241,0.15) !important;
        width: 52px !important;
        height: 52px !important;
        border-radius: 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
      }
      .extra-stat-item .info { flex: 1; }
      .extra-stat-item .info strong {
        display: block !important;
        font-size: 0.78rem !important;
        font-weight: 600 !important;
        color: var(--text-muted) !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        margin-bottom: 4px !important;
      }
      .extra-stat-item .info span {
        font-size: 1.15rem !important;
        font-weight: 800 !important;
        font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif !important;
        background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%) !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
      }

      /* ── Light theme overrides ── */
      [data-theme="light"] .activity-stats-modal,
      html:not([data-theme="dark"]) .activity-stats-modal {
        background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%) !important;
        box-shadow: 0 32px 64px rgba(99,102,241,0.12), 0 8px 24px rgba(0,0,0,0.06) !important;
        border-color: rgba(99,102,241,0.12) !important;
      }
      [data-theme="light"] .stats-card,
      html:not([data-theme="dark"]) .stats-card {
        background: #ffffff !important;
        border-color: rgba(99,102,241,0.1) !important;
        box-shadow: 0 4px 16px rgba(99,102,241,0.07) !important;
      }
      [data-theme="light"] .stats-card:hover,
      html:not([data-theme="dark"]) .stats-card:hover {
        box-shadow: 0 16px 40px rgba(99,102,241,0.15) !important;
      }
      [data-theme="light"] .stats-card__trend,
      html:not([data-theme="dark"]) .stats-card__trend {
        background: rgba(99,102,241,0.05) !important;
        border-color: rgba(99,102,241,0.1) !important;
      }
      [data-theme="light"] .chart-container,
      html:not([data-theme="dark"]) .chart-container {
        background: #ffffff !important;
        border-color: rgba(99,102,241,0.1) !important;
        box-shadow: 0 2px 12px rgba(99,102,241,0.06) !important;
      }
      [data-theme="light"] .extra-stats-section,
      html:not([data-theme="dark"]) .extra-stats-section {
        background: #f8f9ff !important;
        border-color: rgba(99,102,241,0.1) !important;
      }
      [data-theme="light"] .extra-stat-item,
      html:not([data-theme="dark"]) .extra-stat-item {
        background: #ffffff !important;
        border-color: rgba(99,102,241,0.1) !important;
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
      [data-theme="dark"] .floating-toc-back-btn:hover {
        box-shadow: 0 6px 20px rgba(219, 39, 119, 0.5), 0 0 0 3px rgba(124, 58, 237, 0.2);
      }

      /* ── Dashboard Segmented Controls ── */
      .dashboard-range-selector button, .dashboard-metric-selector button {
        outline: none;
      }
      [data-theme="light"] .dashboard-controls-bar {
        background: rgba(15, 23, 42, 0.02) !important;
        border-color: rgba(15, 23, 42, 0.06) !important;
      }
      [data-theme="light"] .dashboard-range-selector,
      [data-theme="light"] .dashboard-metric-selector {
        background: rgba(15, 23, 42, 0.05) !important;
        border-color: rgba(15, 23, 42, 0.03) !important;
      }
      [data-theme="light"] .range-btn:not(.is-active),
      [data-theme="light"] .metric-btn:not(.is-active) {
        color: #475569 !important;
      }
      [data-theme="light"] .range-btn:not(.is-active):hover,
      [data-theme="light"] .metric-btn:not(.is-active):hover {
        color: var(--accent) !important;
        background: rgba(15, 23, 42, 0.03) !important;
      }
      .range-btn:not(.is-active):hover,
      .metric-btn:not(.is-active):hover {
        color: var(--text) !important;
        background: rgba(255, 255, 255, 0.05) !important;
      }
      .range-btn, .metric-btn {
        background: transparent;
        color: var(--text-muted);
        border: none;
        padding: 0.35rem 0.85rem;
        font-size: 0.8rem;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .range-btn.is-active, .metric-btn.is-active {
        background: var(--accent) !important;
        color: white !important;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      }

      /* Responsive controls bar and header styles */
      .dashboard-controls-bar {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 0.75rem !important;
      }
      @media (max-width: 576px) {
        .dashboard-controls-bar {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .dashboard-controls-bar > div {
          justify-content: center !important;
        }
      }
      @media (max-width: 991px) {
        .activity-stats-modal .modal__header {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 1rem !important;
        }
        .activity-stats-modal .modal__header > div {
          width: 100% !important;
          justify-content: space-between !important;
          flex-wrap: wrap !important;
        }
      }

      /* Chart Expand Overlay */
      .chart-expand-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        z-index: 99999;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        transition: opacity 0.3s ease;
        opacity: 0;
      }
      .chart-expand-overlay.is-open {
        display: flex !important;
        opacity: 1 !important;
      }
      .chart-expand-overlay.is-open .expand-modal-inner {
        transform: scale(1) !important;
      }
      
      .expand-modal-inner {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        transform: scale(0.95);
        transition: transform 0.3s ease;
      }
      
      [data-theme="light"] .chart-expand-overlay {
        background: rgba(241, 245, 249, 0.88);
      }
      
      /* Month Dropdown Styling */
      .range-month-picker-wrap select:focus {
        outline: none;
      }
      
      #close-chart-expand:hover, #close-day-detail:hover {
        background: rgba(255,255,255,0.12) !important;
        transform: rotate(90deg);
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

  return { setTheme, toggleTheme, showToast, setButtonLoading, toggleNotificationDrawer, updateNotificationBadge, markAsRead, markAllAsRead, syncAuthUI, forceLogout, toggleUserMenu, openAuthModal, confirm, openPlaceDetail, openBookingDetail, openItineraryDetail, openNotificationDetailModal, getRankBadgeHTML, getRankIcon, getStoreKey, initSettingsHandlers, trackQuestActivity, getQuestActivity, startTopLoader, finishTopLoader, openModal, closeModal, copyToClipboard, viewImage, recordActivity };
})());

