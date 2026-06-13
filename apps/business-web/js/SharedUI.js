"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/**
 * WanderViet AI Shared UI Logic
 * Handles Theme, Settings Drawer, and Toast system across all portals.
 */
window.WanderUI = Object.assign(window.WanderUI || {}, function () {
  'use strict';

  var STORAGE_THEME = 'wander_theme';
  
  // Global HTML escaping helper
  window.esc = function(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // --- Theme Management ---
  function setTheme(theme) {
    var syncWithBackend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
    if (syncWithBackend) {
      var token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token') || localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_business_token') || sessionStorage.getItem('biz_auth_token') || sessionStorage.getItem('wander_business_token');
      if (token) {
        fetch('/api/auth/theme', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({
            theme: theme
          })
        }).catch(function (err) {
          return console.debug('Sync theme failed:', err);
        });
      }
    }
  }
  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark', true);
  }
  function initTheme() {
    var saved = localStorage.getItem(STORAGE_THEME);
    if (saved) {
      setTheme(saved);
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  // --- Toast System ---
  function showToast(message) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';
    var container = document.getElementById('wander-toast-container') || createToastContainer();
    var toast = document.createElement('div');
    toast.className = "wander-toast wander-toast--".concat(type);
    toast.innerHTML = "\n      <div class=\"wander-toast__content\">".concat(message, "</div>\n      <button class=\"wander-toast__close\">&times;</button>\n    ");
    container.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('wander-toast--fade-out');
      setTimeout(function () {
        return toast.remove();
      }, 400);
    }, 4000);
    toast.querySelector('.wander-toast__close').onclick = function () {
      return toast.remove();
    };
  }
  function createToastContainer() {
    var container = document.createElement('div');
    container.id = 'wander-toast-container';
    container.style.cssText = "position:fixed;bottom:2rem;right:2rem;display:flex;flex-direction:column;gap:0.75rem;z-index:9999;pointer-events:none;";
    document.body.appendChild(container);
    return container;
  }

  // --- Loading States ---
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

  // --- Notifications ---
  function fetchNotifications() {
    return _fetchNotifications.apply(this, arguments);
  }
  function _fetchNotifications() {
    _fetchNotifications = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var token, res, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token') || localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_business_token') || sessionStorage.getItem('biz_auth_token') || sessionStorage.getItem('wander_business_token');
            if (token) {
              _context.n = 1;
              break;
            }
            return _context.a(2, {
              success: false
            });
          case 1:
            _context.p = 1;
            _context.n = 2;
            return fetch('/api/notifications', {
              headers: {
                'x-auth-token': token
              }
            });
          case 2:
            res = _context.v;
            _context.n = 3;
            return res.json();
          case 3:
            return _context.a(2, _context.v);
          case 4:
            _context.p = 4;
            _t = _context.v;
            console.warn('Fetch notifications failed:', _t);
            return _context.a(2, {
              success: false
            });
        }
      }, _callee, null, [[1, 4]]);
    }));
    return _fetchNotifications.apply(this, arguments);
  }
  function updateNotificationBadge() {
    return _updateNotificationBadge.apply(this, arguments);
  }
  function _updateNotificationBadge() {
    _updateNotificationBadge = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var token, res, json, badge, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token') || localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_business_token') || sessionStorage.getItem('biz_auth_token') || sessionStorage.getItem('wander_business_token');
            if (token) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            _context2.p = 1;
            _context2.n = 2;
            return fetch('/api/notifications/unread-count', {
              headers: {
                'x-auth-token': token
              }
            });
          case 2:
            res = _context2.v;
            _context2.n = 3;
            return res.json();
          case 3:
            json = _context2.v;
            badge = document.querySelector('[data-notif-badge]');
            if (badge) {
              if (json.count > 0) {
                badge.textContent = json.count > 20 ? '20+' : json.count;
                badge.style.display = 'flex';
              } else {
                badge.style.display = 'none';
              }
            }
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t2 = _context2.v;
          case 5:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 4]]);
    }));
    return _updateNotificationBadge.apply(this, arguments);
  }
  function toggleNotificationDrawer() {
    var drawer = document.getElementById('wander-notif-drawer') || createNotificationDrawer();
    var isOpen = drawer.classList.contains('is-open');
    if (!isOpen) {
      renderNotifications();
      drawer.style.display = 'flex';
      requestAnimationFrame(function () {
        return drawer.classList.add('is-open');
      });
    } else {
      drawer.classList.remove('is-open');
      setTimeout(function () {
        return drawer.style.display = 'none';
      }, 300);
    }
  }
  function createNotificationDrawer() {
    var drawer = document.createElement('div');
    drawer.id = 'wander-notif-drawer';
    drawer.className = 'wander-notif-drawer';
    drawer.innerHTML = "\n      <div class=\"wander-notif-drawer__header\">\n        <h3>Th\xF4ng b\xE1o</h3>\n        <button class=\"wander-notif-drawer__close\" onclick=\"WanderUI.toggleNotificationDrawer()\">&times;</button>\n      </div>\n      <div class=\"wander-notif-drawer__body\" id=\"wander-notif-body\">\n        <div class=\"wander-notif-loading\">\u0110ang t\u1EA3i...</div>\n      </div>\n    ";
    document.body.appendChild(drawer);
    return drawer;
  }
  function renderNotifications() {
    return _renderNotifications.apply(this, arguments);
  }
  function _renderNotifications() {
    _renderNotifications = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var body, json;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            body = document.getElementById('wander-notif-body');
            if (body) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            _context3.n = 2;
            return fetchNotifications();
          case 2:
            json = _context3.v;
            if (!(!json.success || !json.data.length)) {
              _context3.n = 3;
              break;
            }
            body.innerHTML = '<div class="wander-notif-empty">Không có thông báo mới</div>';
            return _context3.a(2);
          case 3:
            body.innerHTML = json.data.map(function (notif) {
              return "\n      <div class=\"wander-notif-item wander-notif-item--".concat(notif.type, " ").concat(notif.isRead ? '' : 'is-unread', "\" onclick=\"WanderUI.markAsRead('").concat(notif._id, "', '").concat(notif.link, "')\">\n        <div class=\"wander-notif-item__icon\"></div>\n        <div class=\"wander-notif-item__content\">\n          <div class=\"wander-notif-item__title\">").concat(notif.title, "</div>\n          <div class=\"wander-notif-item__message\">").concat(notif.message, "</div>\n          <div class=\"wander-notif-item__time\">").concat(new Date(notif.createdAt).toLocaleDateString('vi-VN'), "</div>\n        </div>\n      </div>\n    ");
            }).join('');
          case 4:
            return _context3.a(2);
        }
      }, _callee3);
    }));
    return _renderNotifications.apply(this, arguments);
  }
  function markAsRead(_x, _x2) {
    return _markAsRead.apply(this, arguments);
  } // Polling for notifications
  function _markAsRead() {
    _markAsRead = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(id, link) {
      var token;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token') || localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_business_token') || sessionStorage.getItem('biz_auth_token') || sessionStorage.getItem('wander_business_token');
            _context4.n = 1;
            return fetch("/api/notifications/read/".concat(id), {
              method: 'PUT',
              headers: {
                'x-auth-token': token
              }
            });
          case 1:
            updateNotificationBadge();
            if (link) window.location.href = link;else renderNotifications();
          case 2:
            return _context4.a(2);
        }
      }, _callee4);
    }));
    return _markAsRead.apply(this, arguments);
  }
  setInterval(updateNotificationBadge, 60000);
  window.addEventListener('load', updateNotificationBadge);
  initTheme();
  function trackQuestActivity(key, value) {
    try {
      var data = JSON.parse(localStorage.getItem('wv_quest_activity') || '{}');
      data[key] = Math.max(data[key] || 0, value || 1);
      localStorage.setItem('wv_quest_activity', JSON.stringify(data));
    } catch(e) {}
  }

  function showConfirm(opts) {
    opts = opts || {};
    return new Promise(function(resolve) {
      var icon = opts.icon || '\u2753';
      var iconType = opts.iconType || 'default';
      var title = opts.title || 'X\u00e1c nh\u1eadn';
      var message = opts.message || 'B\u1ea1n c\u00f3 ch\u1eafc ch\u1eafn mu\u1ed1n th\u1ef1c hi\u1ec7n thao t\u00e1c n\u00e0y?';
      var okText = opts.okText || 'X\u00e1c nh\u1eadn';
      var cancelText = opts.cancelText || 'H\u1ee7y';
      var okClass = opts.okType ? ' ' + opts.okType : '';

      var overlay = document.getElementById('wander-confirm-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'wander-confirm-overlay';
        document.body.appendChild(overlay);
      }

      overlay.innerHTML = '<div id="wander-confirm-box">' +
        '<div class="wander-confirm__icon ' + (iconType !== 'default' ? iconType : '') + '">' + icon + '</div>' +
        '<div class="wander-confirm__title">' + title + '</div>' +
        '<div class="wander-confirm__message">' + message + '</div>' +
        (opts.hasInput ? '<textarea id="wander-confirm-textarea" placeholder="' + (opts.inputPlaceholder || 'Nh\u1eadp l\u00fd do...') + '"></textarea>' : '') +
        '<div class="wander-confirm__actions">' +
          '<button class="wander-confirm__btn wander-confirm__btn--cancel" id="wander-confirm-cancel">' + cancelText + '</button>' +
          '<button class="wander-confirm__btn wander-confirm__btn--ok' + okClass + '" id="wander-confirm-ok">' + okText + '</button>' +
        '</div></div>';

      requestAnimationFrame(function() { overlay.classList.add('is-visible'); });

      function close(confirmed) {
        var inputValue = opts.hasInput ? (document.getElementById('wander-confirm-textarea') || {}).value || '' : null;
        overlay.classList.remove('is-visible');
        setTimeout(function() { overlay.innerHTML = ''; }, 300);
        resolve({ confirmed: confirmed, inputValue: inputValue });
      }

      document.getElementById('wander-confirm-ok').onclick = function() { close(true); };
      document.getElementById('wander-confirm-cancel').onclick = function() { close(false); };
      overlay.onclick = function(e) { if (e.target === overlay) close(false); };
    });
  }

  return {
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    showToast: showToast,
    setButtonLoading: setButtonLoading,
    toggleNotificationDrawer: toggleNotificationDrawer,
    updateNotificationBadge: updateNotificationBadge,
    markAsRead: markAsRead,
    trackQuestActivity: trackQuestActivity,
    showConfirm: showConfirm
  };
}());
(function injectSharedStyles() {
  if (document.getElementById('wander-shared-styles')) return;
  var style = document.createElement('style');
  style.id = 'wander-shared-styles';
  style.textContent = "\n    .wander-toast {\n      pointer-events: auto; min-width: 320px; padding: 1.25rem 1.5rem; border-radius: 16px;\n      background: rgba(var(--bg-rgb, 255, 255, 255), 0.8); backdrop-filter: blur(20px); \n      color: var(--text); box-shadow: 0 12px 40px rgba(0,0,0,0.15);\n      border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;\n      animation: wander-toast-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); font-family: var(--font-sans); font-size: 0.95rem;\n      gap: 1rem;\n    }\n    .wander-toast--success { border-bottom: 3px solid var(--success); }\n    .wander-toast--error { border-bottom: 3px solid var(--danger); }\n    .wander-toast--info { border-bottom: 3px solid var(--primary); }\n    \n    /* Notification Drawer Styles */\n    .wander-notif-drawer {\n      position: fixed; top: 0; right: 0; width: 400px; height: 100vh; \n      background: var(--bg-elevated); box-shadow: -10px 0 30px rgba(0,0,0,0.1);\n      z-index: 999999; display: none; flex-direction: column;\n      transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n      border-left: 1px solid var(--border);\n    }\n    .wander-notif-drawer.is-open { transform: translateX(0); }\n    .wander-notif-drawer__header { \n      padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;\n      border-bottom: 1px solid var(--border);\n    }\n    .wander-notif-drawer__body { flex: 1; overflow-y: auto; padding: 0.5rem; }\n    .wander-notif-item {\n      padding: 1rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;\n      display: flex; gap: 1rem; border: 1px solid transparent; margin-bottom: 0.5rem;\n    }\n    .wander-notif-item:hover { background: var(--bg-soft); border-color: var(--border); }\n    .wander-notif-item.is-unread { background: rgba(var(--primary-rgb, 59, 130, 246), 0.05); }\n    .wander-notif-item__title { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem; }\n    .wander-notif-item__message { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }\n    .wander-notif-item__time { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }\n    \n    .wander-notif-badge {\n      position: absolute; top: -5px; right: -5px; background: var(--danger);\n      color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px;\n      border-radius: 50%; display: none; align-items: center; justify-content: center;\n      border: 2px solid var(--bg);\n    }\n    .wander-toast__close { background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 1.2rem; color: inherit; }\n    .wander-toast--fade-out { opacity: 0; transform: translateY(10px); transition: all 0.4s ease; }\n    @keyframes wander-toast-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }\n    \n    /* Loading Spinner */\n    .btn-loading { position: relative; color: transparent !important; pointer-events: none; }\n    .btn-loading::after {\n      content: \"\"; position: absolute; width: 1.2rem; height: 1.2rem; top: calc(50% - 0.6rem); left: calc(50% - 0.6rem);\n      border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: wander-spin 0.6s linear infinite;\n    }\n    @keyframes wander-spin { to { transform: rotate(360deg); } }\n  ";
  document.head.appendChild(style);
})();

/* ── WanderConfirm Modal Styles for Business Web ── */
(function injectConfirmStyles() {
  if (document.getElementById('wander-confirm-styles')) return;
  var s = document.createElement('style');
  s.id = 'wander-confirm-styles';
  s.textContent = [
    '#wander-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;z-index:2147483647;opacity:0;transition:opacity .25s ease;pointer-events:none;}',
    '#wander-confirm-overlay.is-visible{opacity:1;pointer-events:all;}',
    '#wander-confirm-box{background:linear-gradient(145deg,#111827,#1a2035);border:1px solid rgba(99,102,241,.25);border-radius:24px;padding:2rem 2.25rem;width:100%;max-width:440px;box-shadow:0 40px 80px rgba(0,0,0,.6),0 0 60px rgba(99,102,241,.08);transform:scale(.92) translateY(20px);transition:transform .3s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden;}',
    '#wander-confirm-overlay.is-visible #wander-confirm-box{transform:scale(1) translateY(0);}',
    '#wander-confirm-box::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,.6),transparent);}',
    '.wander-confirm__icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 1.25rem;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);box-shadow:0 8px 24px rgba(99,102,241,.15);}',
    '.wander-confirm__icon.danger{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.25);box-shadow:0 8px 24px rgba(239,68,68,.15);}',
    '.wander-confirm__icon.success{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.25);box-shadow:0 8px 24px rgba(16,185,129,.15);}',
    '.wander-confirm__icon.warning{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.25);}',
    '.wander-confirm__title{text-align:center;font-size:1.15rem;font-weight:800;color:#f1f5f9;margin-bottom:.6rem;letter-spacing:-.01em;}',
    '.wander-confirm__message{text-align:center;font-size:.9rem;color:#94a3b8;line-height:1.6;margin-bottom:1.75rem;}',
    '.wander-confirm__actions{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}',
    '.wander-confirm__btn{padding:.75rem 1.25rem;border-radius:12px;font-size:.9rem;font-weight:700;cursor:pointer;border:none;transition:all .2s;font-family:inherit;}',
    '.wander-confirm__btn--cancel{background:rgba(255,255,255,.06);color:#94a3b8;border:1px solid rgba(255,255,255,.1);}',
    '.wander-confirm__btn--cancel:hover{background:rgba(255,255,255,.1);color:#f1f5f9;transform:translateY(-1px);}',
    '.wander-confirm__btn--ok{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 6px 20px rgba(99,102,241,.35);}',
    '.wander-confirm__btn--ok:hover{background:linear-gradient(135deg,#4f46e5,#4338ca);box-shadow:0 10px 28px rgba(99,102,241,.5);transform:translateY(-2px);}',
    '.wander-confirm__btn--ok.danger{background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 6px 20px rgba(239,68,68,.35);}',
    '.wander-confirm__btn--ok.danger:hover{background:linear-gradient(135deg,#dc2626,#b91c1c);box-shadow:0 10px 28px rgba(239,68,68,.5);}',
    '.wander-confirm__btn--ok.success{background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 6px 20px rgba(16,185,129,.35);}',
    '#wander-confirm-textarea{width:100%;min-height:80px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#f1f5f9;font-size:.88rem;padding:.75rem 1rem;resize:vertical;outline:none;font-family:inherit;margin-bottom:1.25rem;transition:border-color .2s;box-sizing:border-box;}',
    '#wander-confirm-textarea:focus{border-color:rgba(99,102,241,.5);}',
    '#wander-confirm-textarea::placeholder{color:#475569;}'
  ].join('');
  document.head.appendChild(s);
})();
