/**
 * businessOverview.js — Trang chủ Dashboard (Premium Edition)
 * Layout: Quick Actions | KPI Cards | Revenue Chart | [Activities & Messages] | [Featured Services & Reviews]
 */
(function () {
    'use strict';

    // ── Data Helpers ─────────────────────────────────────────────
    function getCurrentBiz() {
        var keys = ['biz_auth_user', 'currentUser'];
        for (var i = 0; i < keys.length; i++) {
            var raw = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
            if (raw) { try { return JSON.parse(raw); } catch (e) { } }
        }
        return null;
    }

    // Cache for real services data
    let _cachedServices = null;
    let _servicesCacheTime = 0;
    const SERVICES_CACHE_MS = 60000; // 1 minute cache

    /**
     * Get services from API (real data)
     * @returns {Array} Array of service objects
     */
    function getServices() {
        // Return cached data if available and fresh
        if (_cachedServices && (Date.now() - _servicesCacheTime) < SERVICES_CACHE_MS) {
            return _cachedServices;
        }
        
        const stored = JSON.parse(localStorage.getItem('biz_services') || '[]');
        if (stored.length > 0) return stored;
        
        // Return empty array if no cached data - real data will be loaded via loadRealServices()
        return [];
    }

    /**
     * Load real services from API and cache them
     * Called on dashboard initialization
     */
    function loadRealServices() {
        return window.apiFetch('/api/business/places')
            .then(json => {
                if (json.success && json.data) {
                    // Transform Place model to service format for dashboard compatibility
                    _cachedServices = json.data.map(p => ({
                        id: p._id || p.id,
                        name: p.name || 'Dịch vụ không tên',
                        type: p.kind || 'other',
                        price: Number(p.priceFrom) || Number(p.price) || 0,
                        unit: p.kind === 'khach-san' ? 'đêm' : 'người',
                        location: p.address || p.region || '',
                        status: p.status === 'approved' ? 'active' : (p.status || 'pending'),
                        createdDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
                        image: p.image || (p.images && p.images[0]) || '',
                        rating: parseFloat(p.ratingAvg) || 0,
                        bookings: p.reviewCount || 0,
                        views: p.viewsCount || p.favoritesCount || 0,
                        likes: p.favoritesCount || 0,
                        reviewCount: p.reviewCount || 0,
                        priceFrom: Number(p.priceFrom) || 0,
                        priceTo: Number(p.priceTo) || 0,
                        kind: p.kind,
                        region: p.region,
                        businessCategory: p.businessCategory,
                        ownerId: p.ownerId
                    }));
                    _servicesCacheTime = Date.now();
                    
                    // Also save to localStorage for offline access
                    try {
                        localStorage.setItem('biz_services', JSON.stringify(_cachedServices));
                    } catch(e) {}
                    
                    // Update the catalog if it exists
                    updateCatalogWithRealData();
                    
                    return _cachedServices;
                }
                return [];
            })
            .catch(err => {
                console.warn('[Dashboard] Failed to load real services:', err);
                return [];
            });
    }

    /**
     * Update the catalog grid with real services data
     */
    function updateCatalogWithRealData() {
        const grid = document.getElementById('overview-catalog-grid');
        if (!grid) return;
        
        const svcs = getServices();
        if (svcs.length === 0) {
            grid.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:13px;">Chưa có dịch vụ nào.</div>';
            return;
        }
        
        // Apply current filter if any
        const activeTab = document.querySelector('.hp-catalog-tab.active');
        const currentCategory = activeTab ? activeTab.getAttribute('data-category') || 'all' : 'all';
        
        const filtered = currentCategory === 'all' ? svcs : svcs.filter(s => 
            s.businessCategory === currentCategory || s.kind === currentCategory
        );
        
        grid.innerHTML = filtered.slice(0, 4).map(s => `
            <div class="hp-svc" onclick="window.navigateToView('services')">
                <img src="${s.image || 'https://via.placeholder.com/80x70?text=No+Image'}" class="hp-svc-img" style="width:60px; height:60px;" onerror="this.src='https://via.placeholder.com/80x70?text=No+Image'">
                <div class="hp-svc-info">
                    <div class="hp-svc-name">${s.name}</div>
                    <div class="hp-svc-meta">⭐ ${s.rating > 0 ? s.rating.toFixed(1) : 'Chưa có'} • ${s.reviewCount || 0} đánh giá</div>
                    <div style="font-size:14px;font-weight:800;color:#10b981;margin-top:6px">${s.price > 0 ? formatMoney(s.price) : 'Liên hệ'}</div>
                </div>
            </div>
        `).join('') || '<div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:13px;">Chưa có dịch vụ thuộc nhóm này.</div>';
    }

    // Reviews data (will be loaded from API)
    const reviews = [];

    // ── Utils ────────────────────────────────────────────────────
    function formatMoney(n) { return new Intl.NumberFormat('vi-VN').format(n) + ' đ'; }
    function stars(r) { return '<span style="color:#f59e0b">' + '★'.repeat(r) + '</span><span style="color:#e2e8f0">' + '★'.repeat(5-r) + '</span>'; }

    // ── CSS ──────────────────────────────────────────────────────
    const css = `
    .hp-wrap { padding: 40px; background: transparent; font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; }
    
    /* Quick Actions */
    .hp-quick { display: flex; gap: 16px; margin-bottom: 40px; flex-wrap: wrap; }
    .hp-qbtn { 
      padding: 14px 24px; border-radius: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
      font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px; 
      transition: all .3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(20px);
    }
    .hp-qbtn:hover { border-color: #6366f1; background: rgba(255,255,255,0.06); transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
    .hp-qbtn.primary { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; box-shadow: 0 8px 25px rgba(99,102,241,0.3); }
    .hp-qbtn.primary:hover { opacity: 0.9; box-shadow: 0 12px 30px rgba(99,102,241,0.4); }

    /* KPI Cards */
    .hp-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; margin-bottom: 40px; }
    .hp-kpi {
      background: rgba(255,255,255,0.03); padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);
      display: flex; flex-direction: column; gap: 12px; backdrop-filter: blur(20px); transition: all .4s;
    }
    .hp-kpi:hover { transform: translateY(-5px); border-color: rgba(99,102,241,0.3); background: rgba(255,255,255,0.05); }
    .hp-kpi-icon {
      width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 22px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
    }
    .hp-kpi-val { font-size: 28px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -1px; }
    .hp-kpi-lbl { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
    .hp-kpi-trend { font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
    .hp-kpi-trend.up { color: #10b981; }
    .hp-kpi-trend.down { color: #ef4444; }

    /* Chart Section */
    .hp-chart-card { background: rgba(255,255,255,0.03); border-radius: 28px; padding: 32px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 40px; backdrop-filter: blur(20px); }
    .hp-chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .hp-chart-title { font-size: 18px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 12px; }
    .hp-chart-container { height: 320px; position: relative; }

    /* Layout */
    .hp-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 32px; margin-bottom: 40px; }
    .hp-card { background: rgba(255,255,255,0.03); border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; display: flex; flex-direction: column; backdrop-filter: blur(20px); }
    .hp-card-head { padding: 28px 28px 10px; display: flex; justify-content: space-between; align-items: center; }
    .hp-card-title { font-size: 17px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 12px; }
    .hp-card-link { font-size: 13px; font-weight: 700; color: #6366f1; cursor: pointer; transition: opacity .2s; }
    .hp-card-link:hover { opacity: 0.8; text-decoration: underline; }
    .hp-card-body { padding: 20px 28px 28px; }
    
    /* Lists */
    .hp-list-item { display: flex; align-items: center; gap: 16px; padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,0.05); transition: transform .2s; }
    .hp-list-item:hover { transform: translateX(5px); }
    .hp-list-item:last-child { border-bottom: none; }
    .hp-list-av { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; flex-shrink: 0; }
    .hp-list-text { font-size: 15px; font-weight: 600; color: #fff; line-height: 1.4; }
    .hp-list-sub  { font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 4px; }

    /* Service Grid (Horizontal) */
    .hp-svcs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .hp-svc { background: rgba(255,255,255,0.02); padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; gap: 16px; transition: all .3s; cursor: pointer; }
    .hp-svc:hover { border-color: #6366f1; background: rgba(255,255,255,0.05); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .hp-svc-img { width: 80px; height: 70px; border-radius: 14px; object-fit: cover; border: 1px solid rgba(255,255,255,0.05); }
    .hp-svc-info { flex: 1; min-width: 0; }
    .hp-svc-name { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hp-svc-meta { font-size: 12px; color: #94a3b8; font-weight: 600; margin-top: 6px; }

    /* AI Analytics */
    .hp-ai-card { 
      background: var(--ai-bg, linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))) !important;
      border: 1px solid var(--ai-border, rgba(168,85,247,0.3)) !important;
      color: var(--ai-text, #fff) !important;
    }
    .hp-ai-badge {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800;
      text-transform: uppercase; margin-bottom: 15px; display: inline-block;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }
    .hp-ai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
    .hp-ai-item { display: flex; align-items: center; gap: 12px; }
    .hp-ai-icon { font-size: 18px; width: 36px; height: 36px; border-radius: 10px; background: var(--ai-item-bg, rgba(255,255,255,0.05)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .hp-ai-label { font-size: 11px; color: var(--ai-muted, #94a3b8); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .hp-ai-value { font-size: 14px; font-weight: 700; color: var(--ai-text, #fff); margin-top: 2px; }
    .hp-ai-suggestion { 
      background: var(--ai-sug-bg, rgba(0,0,0,0.2)); padding: 16px; border-radius: 16px; border: 1px dashed rgba(168,85,247,0.3);
      font-size: 13px; color: var(--ai-sug-text, #e2e8f0); line-height: 1.5; margin-top: 10px;
    }

    /* Light Mode Overrides for AI Box */
    body.light-mode {
      --ai-bg: #ffffff !important;
      --ai-border: rgba(99,102,241,0.3) !important;
      --ai-text: #1e293b;
      --ai-item-bg: rgba(99,102,241,0.05);
      --ai-sug-bg: rgba(99,102,241,0.03);
      --ai-sug-text: #334155;
      --ai-muted: #64748b;
    }

    .hp-pro-badge {
      font-size: 9px; font-weight: 900; background: #f59e0b; color: #000; padding: 2px 6px; border-radius: 4px;
      margin-left: 8px; vertical-align: middle; text-transform: uppercase;
    }
    .hp-ai-reason {
      font-size: 11px; color: var(--ai-muted, #94a3b8); margin-top: 8px; font-style: italic; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px;
    }
    .hp-ai-anomaly {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f43f5e;
      padding: 12px; border-radius: 12px; font-size: 12px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;
    }
    .hp-market-forecast {
      margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(0,0,0,0.05);
    }
    .hp-forecast-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; 
      background: rgba(16,185,129,0.1); color: #10b981; font-size: 11px; font-weight: 700;
    }
    .hp-ai-chart-section {
      margin-top: 16px; padding: 12px; border-radius: 14px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    }
    .hp-ai-chart-label {
      font-size: 10px; font-weight: 800; color: #a855f7; text-transform: uppercase;
      letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;
    }

    /* DataTable & Funnel */
    .hp-table { width: 100%; border-collapse: collapse; text-align: left; }
    .hp-table th { padding: 16px 20px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .hp-table td { padding: 16px 20px; font-size: 14px; font-weight: 600; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.02); vertical-align: middle; }
    .hp-table tr { transition: background 0.2s; }
    .hp-table tr:hover { background: rgba(255,255,255,0.02); }
    .hp-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .hp-badge.pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .hp-badge.confirmed { background: rgba(99,102,241,0.15); color: #818cf8; }
    .hp-badge.completed { background: rgba(16,185,129,0.15); color: #10b981; }
    .hp-badge.cancelled { background: rgba(239,68,68,0.15); color: #f87171; }
    
    .hp-funnel { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .hp-funnel-step { text-align: center; }
    .hp-funnel-val { font-size: 24px; font-weight: 900; color: #fff; }
    .hp-funnel-lbl { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
    .hp-funnel-arrow { color: #334155; font-size: 20px; }
    .hp-funnel-rate { background: rgba(16,185,129,0.1); color: #10b981; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 800; }
    
    /* Deep Analytics */
    .hp-stat-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .hp-stat-label { font-size: 13px; color: #94a3b8; font-weight: 600; }
    .hp-stat-value { font-size: 13px; color: #fff; font-weight: 700; }
    .hp-progress-bg { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin-top: 4px; }
    .hp-progress-fill { height: 100%; border-radius: 3px; }
    
    .hp-geo-list { display: flex; flex-direction: column; gap: 12px; }
    .hp-geo-item { display: flex; align-items: center; gap: 12px; }
    .hp-geo-flag { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 12px; }
    .hp-geo-name { flex: 1; font-size: 13px; font-weight: 600; color: #cbd5e1; }
    .hp-geo-pct { font-size: 12px; font-weight: 700; color: #6366f1; }
    
    .hp-rank-badge { width: 24px; height: 24px; border-radius: 8px; background: rgba(255,255,255,0.05); color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; border: 1px solid rgba(255,255,255,0.05); }
    .hp-rank-badge.top-1 { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none; box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
    .hp-rank-badge.top-2 { background: linear-gradient(135deg, #94a3b8, #64748b); color: #fff; border: none; }
    .hp-rank-badge.top-3 { background: linear-gradient(135deg, #b45309, #78350f); color: #fff; border: none; }

    .hp-ranking-list { display: flex; flex-direction: column; gap: 18px; }
    .hp-ranking-item { display: flex; align-items: center; gap: 16px; transition: 0.3s; }
    .hp-ranking-item:hover { transform: translateX(4px); }
    .hp-ranking-info { flex: 1; min-width: 0; }
    .hp-ranking-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .hp-ranking-name { font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hp-ranking-val { font-size: 12px; font-weight: 800; color: #6366f1; }

    /* Unified Activity Hub */
    .hp-activity-hub { background: rgba(255,255,255,0.03); border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; backdrop-filter: blur(20px); margin-bottom: 40px; }
    .hp-hub-head { padding: 28px 28px 10px; }
    .hp-hub-title { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
    .hp-hub-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .hp-hub-tab { 
      padding: 10px 18px; border-radius: 50px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
      color: #94a3b8; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.3s;
    }
    .hp-hub-tab:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .hp-hub-tab.active { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
    .hp-hub-body { padding: 0 0 28px; }
    
    /* Catalog Filter */
    .hp-catalog-tabs { display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
    .hp-catalog-tab { background: none; border: none; color: #94a3b8; font-size: 14px; font-weight: 700; cursor: pointer; position: relative; padding: 8px 4px; transition: color 0.3s; }
    .hp-catalog-tab.active { color: #fff; }
    .hp-catalog-tab.active::after { content: ''; position: absolute; bottom: -8px; left: 0; right: 0; height: 2px; background: #6366f1; border-radius: 2px; box-shadow: 0 0 10px #6366f1; }

    /* Rank System Styles */
    .hp-rank-card { background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); padding: 32px; backdrop-filter: blur(20px); position: relative; overflow: hidden; }
    .hp-rank-bg-icon { position: absolute; right: -20px; bottom: -20px; font-size: 120px; opacity: 0.05; transform: rotate(-15deg); pointer-events: none; }
    .hp-rank-header { display: flex; align-items: center; gap: 24px; margin-bottom: 30px; }
    .hp-rank-logo-wrap { 
        width: 200px; height: 260px; border-radius: 0; display: flex; align-items: center; justify-content: center; 
        position: relative; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: visible; margin-right: 40px;
    }
    .hp-rank-logo-wrap svg { width: 100%; height: 100%; filter: drop-shadow(0 0 30px currentColor); }
    
    /* Advanced Animations */
    @keyframes rank-float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-12px) scale(1.02); } }
    @keyframes building-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
    
    .rank-animate-main { animation: rank-float 5s ease-in-out infinite; }
    .rank-glow-windows { animation: building-glow 2s ease-in-out infinite; }
    
    .rank-unranked svg { filter: drop-shadow(0 0 14px rgba(148,163,184,0.7)); }
    .rank-silver   svg { filter: drop-shadow(0 0 18px rgba(96,165,250,0.8)); }
    .rank-gold     svg { filter: drop-shadow(0 0 22px rgba(251,191,36,0.9)); }
    .rank-platinum svg { filter: drop-shadow(0 0 22px rgba(34,211,238,0.9)); }
    .rank-diamond  svg { filter: drop-shadow(0 0 26px rgba(168,85,247,0.95)); }
    .rank-master   svg { filter: drop-shadow(0 0 30px rgba(248,113,113,1)) drop-shadow(0 0 50px rgba(251,191,36,0.6)); }
    
    @keyframes rank-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

    .hp-rank-main { flex: 1; }
    .hp-rank-name { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
    .hp-rank-xp-text { font-size: 14px; font-weight: 700; color: #94a3b8; margin-top: 4px; }
    .hp-rank-progress-wrap { margin-top: 20px; }
    .hp-rank-bar-bg { height: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; position: relative; }
    .hp-rank-bar-fill { height: 100%; border-radius: 6px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
    .hp-rank-next { font-size: 12px; font-weight: 700; color: #6366f1; margin-top: 10px; display: block; }
    
    .hp-rank-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); }
    .hp-rank-stat-item { text-align: center; }
    .hp-rank-stat-val { font-size: 15px; font-weight: 800; color: #fff; }
    .hp-rank-stat-lbl { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
    `;
    function render() {
        const biz = getCurrentBiz();
        const svcs = getServices();

        return `
        <div class="hp-wrap">
            <!-- Header -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px">
                <div>
                    <h1 style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px">Tổng quan</h1>
                    <p style="font-size:15px;color:var(--text-muted);margin-top:6px">Chào mừng trở lại, <span style="color:#fff;font-weight:700">${biz ? biz.name : 'Đối tác'}</span>! Hệ thống của bạn đang hoạt động ổn định.</p>
                </div>
                <div style="display:flex; gap:16px; align-items:center;">
                    <select id="dashboard-time-filter" onchange="window.reloadDashboardData(this.value)" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); padding:10px 16px; border-radius:12px; font-weight:600; outline:none; cursor:pointer;">
                        <option value="7">7 ngày qua</option>
                        <option value="30">30 ngày qua</option>
                        <option value="365">1 năm qua</option>
                    </select>
                    <div class="date-chip">
                        📅 ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </div>

            <!-- Rank & Status Row (NEW) -->
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-bottom: 40px;">
                <!-- Current Rank Widget -->
                <div class="hp-rank-card" id="business-rank-widget">
                    <div style="text-align:center; padding:2rem; color:var(--text-muted)">Đang tải thông tin thứ hạng...</div>
                </div>

                <!-- Profile Completion / Status -->
                <div class="hp-card" style="background: rgba(16,185,129,0.02); border-color: rgba(16,185,129,0.1);">
                    <div class="hp-card-head">
                        <div class="hp-card-title">📝 Hoàn thiện hồ sơ</div>
                    </div>
                    <div class="hp-card-body">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                            <span style="font-size:14px; font-weight:700; color:#fff">Tiến độ hồ sơ</span>
                            <span style="font-size:14px; font-weight:800; color:#10b981">85%</span>
                        </div>
                        <div class="hp-progress-bg" style="height:10px">
                            <div class="hp-progress-fill" style="width:85%; background:#10b981"></div>
                        </div>
                        <p style="font-size:12px; color:#94a3b8; margin-top:15px; line-height:1.5">Hoàn thiện hồ sơ giúp bạn nhận ngay <strong style="color:#fff">+${biz && biz.tier === 'PREMIUM' ? 300 : 100} XP</strong> và tăng uy tín với khách hàng.</p>
                        <button class="hp-qbtn" style="width:100%; margin-top:20px; justify-content:center; background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.2)" onclick="window.navigateToView('profile')">Cập nhật hồ sơ</button>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="hp-quick">
                <button class="hp-qbtn primary" onclick="window.navigateToView('services')"><span>➕</span> Đăng tour mới</button>
                <button class="hp-qbtn" onclick="window.navigateToView('bookings')"><span>📑</span> Quản lý đơn hàng</button>
                <button class="hp-qbtn" onclick="location.reload()"><span>🔄</span> Làm mới</button>
                <button class="hp-qbtn" onclick="window.navigateToView('profile')"><span>🏢</span> Hồ sơ doanh nghiệp</button>
            </div>

            <!-- KPI Cards -->
            <div class="hp-kpis" id="dashboard-kpis">
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">�️</div>
                    <div>
                        <div class="hp-kpi-lbl">Lượt xem</div>
                        <div class="hp-kpi-val" id="stat-views" style="color:#6366f1">...</div>
                        <div class="hp-kpi-trend up" id="trend-views">↑ 12%</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">👥</div>
                    <div>
                        <div class="hp-kpi-lbl">Theo dõi</div>
                        <div class="hp-kpi-val" id="stat-followers" style="color:#a855f7">...</div>
                        <div class="hp-kpi-trend up" id="trend-followers">↑ 8%</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">�</div>
                    <div>
                        <div class="hp-kpi-lbl">Đặt chỗ</div>
                        <div class="hp-kpi-val" id="stat-bookings" style="color:#10b981">...</div>
                        <div class="hp-kpi-trend up" id="trend-bookings">↑ 15%</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">💬</div>
                    <div>
                        <div class="hp-kpi-lbl">Tương tác</div>
                        <div class="hp-kpi-val" id="stat-engagement" style="color:#f59e0b">...</div>
                        <div class="hp-kpi-trend up" id="trend-engagement">↑ 20%</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">�</div>
                    <div>
                        <div class="hp-kpi-lbl">Trending Score</div>
                        <div class="hp-kpi-val" id="stat-trending" style="color:#ef4444">...</div>
                        <div class="hp-kpi-trend up" id="trend-trending">↑ 5%</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">⭐</div>
                    <div>
                        <div class="hp-kpi-lbl">Đánh giá</div>
                        <div class="hp-kpi-val" id="stat-reviews" style="color:#3b82f6">...</div>
                        <div class="hp-kpi-trend" id="trend-reviews">4.8/5</div>
                    </div>
                </div>
            </div>

            <!-- Smart Alerts -->
            <div id="smart-alerts-container" style="display:none; margin-bottom: 40px; gap: 16px; flex-direction: column;"></div>

            <!-- Charts Section (Bento Grid) -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 40px;">
                <!-- Main Revenue Chart -->
                <div class="hp-chart-card" style="margin-bottom:0;">
                    <div class="hp-chart-head" style="margin-bottom: 20px;">
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <div class="hp-chart-title">📊 Xu hướng doanh thu <span id="chart-period-title" style="font-size:13px; color:#94a3b8; font-weight:600; margin-left:8px">(7 ngày qua)</span></div>
                            <div id="chart-dynamic-note" style="font-size:24px; font-weight:800; color:#fff; height:28px; line-height:28px; transition:color 0.2s;">
                                <!-- Sẽ được update bằng JS khi hover -->
                                <span style="font-size:14px; color:#94a3b8; font-weight:600;">Di chuột vào biểu đồ để xem chi tiết</span>
                            </div>
                        </div>
                    </div>
                    <div class="hp-chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
                
                <!-- Revenue Breakdown Doughnut -->
                <div class="hp-chart-card" style="margin-bottom:0; display:flex; flex-direction:column;">
                    <div class="hp-chart-head" style="margin-bottom: 20px;">
                        <div class="hp-chart-title">🥧 Cơ cấu doanh thu</div>
                    </div>
                    <div style="flex:1; position:relative; display:flex; align-items:center; justify-content:center; min-height: 200px;">
                        <canvas id="breakdownChart"></canvas>
                        <div id="breakdown-empty" style="display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:13px; color:#94a3b8; text-align:center;">Chưa có dữ liệu<br>doanh thu</div>
                    </div>
                    <div id="revenue-breakdown-table" style="margin-top: 20px;">
                        <!-- Thêm bảng chi tiết doanh thu -->
                    </div>
                </div>
            </div>

            <!-- AI Analytics Box (Relocated for high visibility) -->
            <div style="margin-bottom: 40px;">
                <div class="hp-card hp-ai-card">
                    <div class="hp-card-body" id="ai-analytics-container">
                        <div class="hp-ai-badge">✨ AI Insights</div>
                        <div class="hp-card-title" style="margin-bottom:20px">🧠 AI PHÂN TÍCH CHUYÊN SÂU</div>
                        
                        <div id="ai-content">
                            <div style="text-align:center;padding:2rem;color:var(--text-muted)">Đang phân tích dữ liệu thị trường...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Deep Analytics Row (New Segment) -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px;">
                <!-- Customer Segments -->
                <div class="hp-card">
                    <div class="hp-card-head">
                        <div class="hp-card-title">👥 Nhân khẩu học khách</div>
                    </div>
                    <div class="hp-card-body">
                        <div class="hp-stat-row">
                            <span class="hp-stat-label">Gen Z (18-24)</span>
                            <span class="hp-stat-value">42%</span>
                        </div>
                        <div class="hp-progress-bg"><div class="hp-progress-fill" style="width:42%; background:#6366f1"></div></div>
                        
                        <div class="hp-stat-row" style="margin-top:16px">
                            <span class="hp-stat-label">Millennials (25-40)</span>
                            <span class="hp-stat-value">35%</span>
                        </div>
                        <div class="hp-progress-bg"><div class="hp-progress-fill" style="width:35%; background:#a855f7"></div></div>
                        
                        <div class="hp-stat-row" style="margin-top:16px">
                            <span class="hp-stat-label">Khác</span>
                            <span class="hp-stat-value">23%</span>
                        </div>
                        <div class="hp-progress-bg"><div class="hp-progress-fill" style="width:23%; background:#94a3b8"></div></div>
                    </div>
                </div>

                <!-- Geo Distribution -->
                <div class="hp-card">
                    <div class="hp-card-head">
                        <div class="hp-card-title">📍 Thị trường trọng điểm</div>
                    </div>
                    <div class="hp-card-body">
                        <div class="hp-geo-list">
                            <div class="hp-geo-item">
                                <span class="hp-geo-flag">🇻🇳</span>
                                <span class="hp-geo-name">Việt Nam (Nội địa)</span>
                                <span class="hp-geo-pct">58%</span>
                            </div>
                            <div class="hp-geo-item">
                                <span class="hp-geo-flag">🇰🇷</span>
                                <span class="hp-geo-name">Hàn Quốc</span>
                                <span class="hp-geo-pct">15%</span>
                            </div>
                            <div class="hp-geo-item">
                                <span class="hp-geo-flag">🇺🇸</span>
                                <span class="hp-geo-name">Âu Mỹ</span>
                                <span class="hp-geo-pct">12%</span>
                            </div>
                            <div class="hp-geo-item">
                                <span class="hp-geo-flag">🇯🇵</span>
                                <span class="hp-geo-name">Nhật Bản</span>
                                <span class="hp-geo-pct">8%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Service Ranking Board (NEW) -->
                <div class="hp-card">
                    <div class="hp-card-head" style="padding-bottom: 15px;">
                        <div class="hp-card-title">🏆 Bảng xếp hạng dịch vụ</div>
                    </div>
                    <div class="hp-card-body" style="padding-top: 0;">
                        <div class="hp-hub-tabs" style="margin-bottom: 25px;">
                            <button class="hp-hub-tab active" data-rank-tab="bookings" onclick="window.switchRankingTab(this, 'bookings')">Đăng ký</button>
                            <button class="hp-hub-tab" data-rank-tab="views" onclick="window.switchRankingTab(this, 'views')">Sử dụng</button>
                            <button class="hp-hub-tab" data-rank-tab="likes" onclick="window.switchRankingTab(this, 'likes')">Yêu thích</button>
                        </div>
                        <div id="service-ranking-list" class="hp-ranking-list">
                            <!-- Populated by JS -->
                            <div style="text-align:center; padding:2rem; color:var(--text-muted)">Đang tính toán thứ hạng...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Optimization Roadmap -->
            <div class="hp-card" style="margin-bottom: 40px; background: linear-gradient(135deg, rgba(16,185,129,0.05), rgba(99,102,241,0.05)); border-color: rgba(16,185,129,0.2);">
                <div class="hp-card-head">
                    <div class="hp-card-title">🚀 Lộ trình Tối ưu hóa Doanh thu (AI Driven)</div>
                </div>
                <div class="hp-card-body">
                    <div style="display:flex; gap:24px; overflow-x:auto; padding-bottom:10px;">
                        <div style="min-width:240px; background:rgba(255,255,255,0.03); padding:20px; border-radius:20px; border:1px solid rgba(255,255,255,0.05);">
                            <div style="font-size:11px; color:#10b981; font-weight:800; margin-bottom:8px">BƯỚC 1: HIỆN TẠI</div>
                            <div style="font-size:14px; font-weight:700; color:#fff">Tối ưu hóa giá Tour Hạ Long</div>
                            <p style="font-size:12px; color:#94a3b8; margin-top:8px">Giảm giá 5% vào giữa tuần để tăng công suất phòng từ 60% lên 85%.</p>
                        </div>
                        <div style="min-width:240px; background:rgba(255,255,255,0.03); padding:20px; border-radius:20px; border:1px solid rgba(255,255,255,0.05);">
                            <div style="font-size:11px; color:#6366f1; font-weight:800; margin-bottom:8px">BƯỚC 2: TUẦN 2</div>
                            <div style="font-size:14px; font-weight:700; color:#fff">Chiến dịch MXH Hàn Quốc</div>
                            <p style="font-size:12px; color:#94a3b8; margin-top:8px">Đẩy mạnh quảng cáo nhắm tới tệp khách Hàn Quốc đang tăng trưởng mạnh (+15%).</p>
                        </div>
                        <div style="min-width:240px; background:rgba(255,255,255,0.03); padding:20px; border-radius:20px; border:1px solid rgba(255,255,255,0.05);">
                            <div style="font-size:11px; color:#f59e0b; font-weight:800; margin-bottom:8px">BƯỚC 3: THÁNG 6</div>
                            <div style="font-size:14px; font-weight:700; color:#fff">Mở rộng Combo Gia đình</div>
                            <p style="font-size:12px; color:#94a3b8; margin-top:8px">Tạo gói combo đặc biệt cho mùa hè, dự kiến tăng doanh thu 20%.</p>
                        </div>
                        <div style="min-width:240px; background:rgba(255,255,255,0.03); padding:20px; border-radius:20px; border:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; border:1px dashed #334155;">
                            <span style="color:#475569; font-size:13px; font-weight:700">+ Thêm mục tiêu</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Unified Activity Hub -->
            <div class="hp-activity-hub">
                <div class="hp-hub-head">
                    <div class="hp-hub-title">👤 Hoạt động người dùng</div>
                    <div class="hp-hub-tabs">
                        <button class="hp-hub-tab active" onclick="window.switchActivityTab(this, 'orders')">📦 Đơn hàng gần đây</button>
                        <button class="hp-hub-tab" onclick="window.switchActivityTab(this, 'checkin')">📍 Check-in Trực tiếp</button>
                        <button class="hp-hub-tab" onclick="window.switchActivityTab(this, 'interactions')">⚡ WiFi & Menu</button>
                        <button class="hp-hub-tab" onclick="window.switchActivityTab(this, 'feedback')">⭐ Đánh giá mới</button>
                        <button class="hp-hub-tab" onclick="window.switchActivityTab(this, 'support')">🆘 Hỗ trợ nhanh</button>
                    </div>
                </div>
                <div class="hp-hub-body" id="hub-content-area">
                    <div style="overflow-x: auto;">
                        <table class="hp-table">
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Dịch vụ</th>
                                    <th>Ngày SD</th>
                                    <th>Thanh toán</th>
                                    <th>Trạng thái</th>
                                    <th style="text-align:right;">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody id="activities-container">
                                <tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted)">Đang tải đơn hàng...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Widgets Row (Balanced Symmetry) -->
            <div class="hp-row" style="grid-template-columns: 1fr 1fr;">
                <!-- Left Column: Performance & Communication -->
                <div style="display:flex;flex-direction:column;gap:32px">
                    <!-- Conversion Funnel (Refined) -->
                    <div class="hp-card" style="background: rgba(99,102,241,0.02); border-color: rgba(99,102,241,0.1);">
                        <div class="hp-card-head" style="padding-bottom: 5px;">
                            <div class="hp-card-title">🎯 Phễu chuyển đổi & Hiệu năng</div>
                        </div>
                        <div class="hp-card-body">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                                <div style="text-align:center; flex:1">
                                    <div style="font-size:24px; font-weight:900; color:#fff" id="funnel-views">0</div>
                                    <div style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-top:4px">Lượt truy cập</div>
                                </div>
                                <div style="color:rgba(255,255,255,0.1); font-size:18px">▶</div>
                                <div style="text-align:center; flex:1">
                                    <div style="background:rgba(16,185,129,0.1); color:#10b981; padding:4px 10px; border-radius:20px; font-size:13px; font-weight:800; display:inline-block" id="funnel-rate">0%</div>
                                    <div style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-top:8px">Tỷ lệ chốt</div>
                                </div>
                                <div style="color:rgba(255,255,255,0.1); font-size:18px">▶</div>
                                <div style="text-align:center; flex:1">
                                    <div style="font-size:24px; font-weight:900; color:#fff" id="funnel-bookings">0</div>
                                    <div style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-top:4px">Đơn thành công</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tin nhắn (Moved to Left) -->
                    <div class="hp-card">
                        <div class="hp-card-head">
                            <div class="hp-card-title">💬 Khách hàng nhắn tin</div>
                            <span class="hp-card-link" onclick="window.navigateToView('messages')">Phòng chat →</span>
                        </div>
                        <div class="hp-card-body" id="dashboard-messages">
                            <div style="text-align:center;padding:2rem;color:var(--text-muted)">Đang tải tin nhắn...</div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Services & Feedback -->
                <div style="display:flex;flex-direction:column;gap:32px">
                    <!-- Dịch vụ nổi bật -->
                    <div class="hp-card" id="featured-services-card">
                        <div class="hp-card-head">
                            <div class="hp-card-title">🌟 Quản lý Dịch vụ</div>
                            <span class="hp-card-link" onclick="window.navigateToView('services')">Chi tiết →</span>
                        </div>
                        <div class="hp-card-body">
                            <div class="hp-catalog-tabs">
                                <button class="hp-catalog-tab active" onclick="window.filterOverviewCatalog(this, 'all')">Tất cả</button>
                                <button class="hp-catalog-tab" onclick="window.filterOverviewCatalog(this, 'nha-hang')">Ẩm thực</button>
                                <button class="hp-catalog-tab" onclick="window.filterOverviewCatalog(this, 'khach-san')">Lưu trú</button>
                                <button class="hp-catalog-tab" onclick="window.filterOverviewCatalog(this, 'trai-nghiem')">Tour</button>
                            </div>
                            <div class="hp-svcs" id="overview-catalog-grid" style="grid-template-columns: 1fr; gap: 16px;">
                                <div style="text-align:center; padding:2rem; color:var(--text-muted)">Đang tải dịch vụ...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Đánh giá (Kept on Right) -->
                    <div class="hp-card">
                        <div class="hp-card-head">
                            <div class="hp-card-title">⭐ Đánh giá mới nhất</div>
                            <span class="hp-card-link" onclick="window.navigateToView('reviews')">Tất cả →</span>
                        </div>
                        <div class="hp-card-body" id="hp-reviews-list">
                            <div style="text-align:center;padding:2rem;color:var(--text-muted)">Đang tải đánh giá...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    function initChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Gradient cho tuần này
        const gradientThis = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradientThis.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradientThis.addColorStop(1, 'rgba(99, 102, 241, 0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
                datasets: [
                    {
                        label: 'Kỳ này',
                        data: [7500000, 6000000, 14000000, 10500000, 22500000, 34000000, 26000000],
                        borderColor: '#6366f1',
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#6366f1',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        backgroundColor: gradientThis,
                        tension: 0.3
                    },
                    {
                        label: 'Kỳ trước',
                        data: [9000000, 7500000, 11000000, 9000000, 17500000, 25500000, 24000000],
                        borderColor: 'rgba(148, 163, 184, 0.4)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 8 }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5, 5] }, 
                        ticks: { 
                            color: '#94a3b8', 
                            font: { size: 11 },
                            callback: function(value) {
                                return value >= 1000000 ? (value / 1000000) + 'M' : value;
                            }
                        } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: '#94a3b8', font: { size: 11 } } 
                    }
                }
            }
        });
    }

    // ── Update Sidebar/Topbar Names ──────────────────────────────
    function updateIdentity() {
        const biz = getCurrentBiz();
        if (!biz) return;
        
        const topbarEl = document.getElementById('topbar-username');
        if (topbarEl) topbarEl.textContent = biz.name;
        
        // sidebar-name is handled by index.html for complex structure (ID + checkmark)
        
        const tierEl = document.getElementById('sidebar-tier');
        if (tierEl) tierEl.textContent = biz.tier || 'PARTNER';
        
        const avatarEl = document.getElementById('sidebar-avatar');
        if (avatarEl && biz.avatar) avatarEl.innerHTML = `<img src="${biz.avatar}" style="width:100%;height:100%;border-radius:inherit;object-fit:cover">`;
    }

    // ── Main Init ────────────────────────────────────────────────
    window.initOverview = function () {
        const container = document.getElementById('overview-container');
        if (!container) return;

        // CSS
        if (!document.getElementById('hp-style')) {
            const st = document.createElement('style');
            st.id = 'hp-style';
            st.textContent = css + `
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes rotate-halo { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes light-flow { 0% { stop-opacity: 0.1; } 50% { stop-opacity: 0.6; } 100% { stop-opacity: 0.1; } }
                @keyframes pulse-pedestal { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
                .rank-animate-main { animation: float 3s ease-in-out infinite; transform-origin: center; }
                .rank-animate-halo { animation: rotate-halo 8s linear infinite; transform-origin: center; }
                .rank-animate-pedestal { animation: pulse-pedestal 2s ease-in-out infinite; transform-origin: center; }
            `;
            document.head.appendChild(st);
        }

        container.innerHTML = render();
        updateIdentity();
        
        // Load Real Data from API
        // Load services first, then other data
        loadRealServices().then(() => {
            // Update catalog with loaded services
            updateCatalogWithRealData();
            // Update ranking board with real data
            initRankingBoard();
        });
        
        // Load other dashboard data
        loadDashboardStats();
        loadDashboardActivities();
        loadRealReviews();
        loadRealMessages();
        loadAIAnalytics();
        loadOperationalInsights();

        // Cần chờ DOM render xong để vẽ Chart và Bảng xếp hạng
        setTimeout(() => {
            initChart();
            updateBusinessRank();
        }, 50);
    };

    // ── Business Ranking Logic (NEW) ─────────────────────────────
    const RANK_CONFIG = [
        { id: 'unranked', name: 'Vô Danh', min: 0, color: '#94a3b8', svg: `
            <svg viewBox="0 0 160 200" overflow="visible">
                <defs>
                    <linearGradient id="g-un-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-color="#0f172a"/></linearGradient>
                    <linearGradient id="g-un-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#94a3b8" stop-opacity="0"/><stop offset="0.5" stop-color="#94a3b8" stop-opacity="0.25"><animate attributeName="stop-opacity" values="0.1;0.35;0.1" dur="3s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="#94a3b8" stop-opacity="0"/></linearGradient>
                </defs>
                <rect x="79" y="0" width="2" height="200" fill="url(#g-un-b)"/>
                <ellipse cx="80" cy="30" rx="38" ry="10" fill="none" stroke="#94a3b8" stroke-width="1.5" opacity="0.5"><animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite"/></ellipse>
                <g style="animation:rank-float 5s ease-in-out infinite">
                    <path d="M45 108 L20 88 L17 97 L40 118 Z" fill="#94a3b8" opacity="0.35"/>
                    <path d="M48 110 L25 98 L23 106 L43 120 Z" fill="#cbd5e1" opacity="0.2"/>
                    <path d="M115 108 L140 88 L143 97 L120 118 Z" fill="#94a3b8" opacity="0.35"/>
                    <path d="M112 110 L135 98 L137 106 L117 120 Z" fill="#cbd5e1" opacity="0.2"/>
                    <path d="M80 50 L35 73 L35 108 L48 126 L80 140 L112 126 L125 108 L125 73 Z" fill="url(#g-un-s)" stroke="#94a3b8" stroke-width="1.5"/>
                    <path d="M62 122 L62 85 L71 79 L80 76 L89 79 L98 85 L98 122 L80 130 Z" fill="#94a3b8" opacity="0.12"/>
                    <path d="M66 119 L66 88 L80 83 L94 88 L94 119 L80 126 Z" fill="none" stroke="#cbd5e1" stroke-width="0.8" opacity="0.4"/>
                    <rect x="70" y="92" width="6" height="8" fill="#cbd5e1" opacity="0.35"/>
                    <rect x="80" y="92" width="6" height="8" fill="#cbd5e1" opacity="0.35"/>
                </g>
                <ellipse cx="80" cy="178" rx="35" ry="9" fill="none" stroke="#94a3b8" stroke-width="2" opacity="0.35"><animate attributeName="rx" values="30;40;30" dur="3s" repeatCount="indefinite"/></ellipse>
                <ellipse cx="80" cy="178" rx="22" ry="5.5" fill="none" stroke="#cbd5e1" stroke-width="1" opacity="0.5"/>
                <ellipse cx="80" cy="178" rx="10" ry="3" fill="#94a3b8" opacity="0.2"/>
            </svg>` },
        { id: 'silver', name: 'Hạng Bạc', min: 5000, color: '#60a5fa', svg: `
            <svg viewBox="0 0 160 200" overflow="visible">
                <defs>
                    <linearGradient id="g-si-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e40af"/><stop offset="1" stop-color="#0c1445"/></linearGradient>
                    <linearGradient id="g-si-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa" stop-opacity="0"/><stop offset="0.5" stop-color="#60a5fa" stop-opacity="0.4"><animate attributeName="stop-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/></linearGradient>
                </defs>
                <rect x="79" y="0" width="2" height="200" fill="url(#g-si-b)"/>
                <ellipse cx="80" cy="27" rx="43" ry="11" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.75"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite"/></ellipse>
                <g style="animation:rank-float 5s ease-in-out infinite">
                    <path d="M38 112 L8 84 L4 95 L32 124 Z" fill="#60a5fa" opacity="0.55"/>
                    <path d="M40 115 L14 100 L12 109 L36 126 Z" fill="#93c5fd" opacity="0.35"/>
                    <path d="M38 100 L12 68 L8 74 L32 108 Z" fill="#60a5fa" opacity="0.4"/>
                    <path d="M122 112 L152 84 L156 95 L128 124 Z" fill="#60a5fa" opacity="0.55"/>
                    <path d="M120 115 L146 100 L148 109 L124 126 Z" fill="#93c5fd" opacity="0.35"/>
                    <path d="M122 100 L148 68 L152 74 L128 108 Z" fill="#60a5fa" opacity="0.4"/>
                    <path d="M80 48 L30 74 L30 110 L44 130 L80 146 L116 130 L130 110 L130 74 Z" fill="url(#g-si-s)" stroke="#60a5fa" stroke-width="2"/>
                    <path d="M60 128 L60 86 L70 79 L80 75 L90 79 L100 86 L100 128 L80 139 Z" fill="#60a5fa" opacity="0.16"/>
                    <path d="M64 125 L64 90 L80 84 L96 90 L96 125 L80 135 Z" fill="none" stroke="#93c5fd" stroke-width="0.9" opacity="0.55"/>
                    <rect x="67" y="94" width="7" height="9" fill="#93c5fd" opacity="0.55"/>
                    <rect x="77" y="94" width="7" height="9" fill="#93c5fd" opacity="0.55"/>
                    <rect x="87" y="94" width="7" height="9" fill="#93c5fd" opacity="0.55"/>
                    <rect x="67" y="107" width="7" height="9" fill="#93c5fd" opacity="0.4"/>
                    <rect x="77" y="107" width="7" height="9" fill="#93c5fd" opacity="0.4"/>
                    <rect x="87" y="107" width="7" height="9" fill="#93c5fd" opacity="0.4"/>
                </g>
                <ellipse cx="80" cy="177" rx="40" ry="10" fill="none" stroke="#60a5fa" stroke-width="2.5" opacity="0.45"><animate attributeName="rx" values="35;46;35" dur="2.5s" repeatCount="indefinite"/></ellipse>
                <ellipse cx="80" cy="177" rx="27" ry="6.5" fill="none" stroke="#93c5fd" stroke-width="1.2" opacity="0.55"/>
                <ellipse cx="80" cy="177" rx="13" ry="3.5" fill="#60a5fa" opacity="0.25"/>
            </svg>` },
        { id: 'gold', name: 'Hạng Vàng', min: 10000, color: '#fbbf24', svg: `
            <svg viewBox="0 0 160 200" overflow="visible">
                <defs>
                    <linearGradient id="g-go-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#92400e"/><stop offset="1" stop-color="#3d1502"/></linearGradient>
                    <linearGradient id="g-go-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24" stop-opacity="0"/><stop offset="0.5" stop-color="#fbbf24" stop-opacity="0.6"><animate attributeName="stop-opacity" values="0.3;0.85;0.3" dur="1.8s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></linearGradient>
                </defs>
                <rect x="79" y="0" width="2" height="200" fill="url(#g-go-b)"/>
                <ellipse cx="80" cy="24" rx="48" ry="13" fill="none" stroke="#fbbf24" stroke-width="2.5" opacity="0.9"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/></ellipse>
                <g style="animation:rank-float 5s ease-in-out infinite">
                    <path d="M32 118 L-2 86 L-5 98 L25 130 Z" fill="#fbbf24" opacity="0.72"/>
                    <path d="M35 121 L6 104 L4 114 L31 133 Z" fill="#fde68a" opacity="0.45"/>
                    <path d="M33 106 L4 70 L0 77 L27 114 Z" fill="#fbbf24" opacity="0.55"/>
                    <path d="M128 118 L162 86 L165 98 L135 130 Z" fill="#fbbf24" opacity="0.72"/>
                    <path d="M125 121 L154 104 L156 114 L129 133 Z" fill="#fde68a" opacity="0.45"/>
                    <path d="M127 106 L156 70 L160 77 L133 114 Z" fill="#fbbf24" opacity="0.55"/>
                    <path d="M80 46 L26 75 L26 112 L40 133 L80 150 L120 133 L134 112 L134 75 Z" fill="url(#g-go-s)" stroke="#fbbf24" stroke-width="2.5"/>
                    <path d="M58 132 L58 85 L68 78 L80 74 L92 78 L102 85 L102 132 L80 143 Z" fill="#fbbf24" opacity="0.19"/>
                    <path d="M62 129 L62 89 L80 83 L98 89 L98 129 L80 140 Z" fill="none" stroke="#fde68a" stroke-width="1" opacity="0.65"/>
                    <rect x="65" y="93" width="8" height="10" fill="#fde68a" opacity="0.75"/>
                    <rect x="76" y="93" width="8" height="10" fill="#fde68a" opacity="0.75"/>
                    <rect x="87" y="93" width="8" height="10" fill="#fde68a" opacity="0.75"/>
                    <rect x="65" y="107" width="8" height="10" fill="#fde68a" opacity="0.55"/>
                    <rect x="76" y="107" width="8" height="10" fill="#fde68a" opacity="0.55"/>
                    <rect x="87" y="107" width="8" height="10" fill="#fde68a" opacity="0.55"/>
                </g>
                <ellipse cx="80" cy="176" rx="44" ry="11" fill="none" stroke="#fbbf24" stroke-width="3" opacity="0.55"><animate attributeName="rx" values="38;50;38" dur="2s" repeatCount="indefinite"/></ellipse>
                <ellipse cx="80" cy="176" rx="29" ry="7" fill="none" stroke="#fde68a" stroke-width="1.5" opacity="0.65"/>
                <ellipse cx="80" cy="176" rx="14" ry="3.5" fill="#fbbf24" opacity="0.3"/>
            </svg>` },
        { id: 'platinum', name: 'Bạch Kim', min: 20000, color: '#22d3ee', svg: `
            <svg viewBox="0 0 160 200" overflow="visible">
                <defs>
                    <linearGradient id="g-pl-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e7490"/><stop offset="1" stop-color="#042f3e"/></linearGradient>
                    <linearGradient id="g-pl-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity="0"/><stop offset="0.5" stop-color="#22d3ee" stop-opacity="0.65"><animate attributeName="stop-opacity" values="0.35;0.85;0.35" dur="1.8s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient>
                </defs>
                <rect x="79" y="0" width="2" height="200" fill="url(#g-pl-b)"/>
                <ellipse cx="80" cy="22" rx="51" ry="13" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.95"><animate attributeName="opacity" values="0.55;1;0.55" dur="1.8s" repeatCount="indefinite"/></ellipse>
                <g style="animation:rank-float 5s ease-in-out infinite">
                    <path d="M28 120 L-7 84 L-10 97 L22 133 Z" fill="#22d3ee" opacity="0.75"/>
                    <path d="M31 124 L2 106 L0 116 L27 136 Z" fill="#67e8f9" opacity="0.45"/>
                    <path d="M29 108 L-1 70 L-5 77 L22 116 Z" fill="#22d3ee" opacity="0.6"/>
                    <path d="M132 120 L167 84 L170 97 L138 133 Z" fill="#22d3ee" opacity="0.75"/>
                    <path d="M129 124 L158 106 L160 116 L133 136 Z" fill="#67e8f9" opacity="0.45"/>
                    <path d="M131 108 L161 70 L165 77 L138 116 Z" fill="#22d3ee" opacity="0.6"/>
                    <path d="M80 44 L24 75 L24 114 L38 135 L80 152 L122 135 L136 114 L136 75 Z" fill="url(#g-pl-s)" stroke="#22d3ee" stroke-width="2.5"/>
                    <path d="M57 134 L57 84 L67 77 L80 72 L93 77 L103 84 L103 134 L80 145 Z" fill="#22d3ee" opacity="0.22"/>
                    <path d="M61 130 L61 88 L80 82 L99 88 L99 130 L80 142 Z" fill="none" stroke="#67e8f9" stroke-width="1" opacity="0.7"/>
                    <rect x="64" y="92" width="9" height="11" fill="#67e8f9" opacity="0.8"/>
                    <rect x="76" y="92" width="9" height="11" fill="#67e8f9" opacity="0.8"/>
                    <rect x="88" y="92" width="9" height="11" fill="#67e8f9" opacity="0.8"/>
                    <rect x="64" y="107" width="9" height="11" fill="#67e8f9" opacity="0.6"/>
                    <rect x="76" y="107" width="9" height="11" fill="#67e8f9" opacity="0.6"/>
                    <rect x="88" y="107" width="9" height="11" fill="#67e8f9" opacity="0.6"/>
                </g>
                <ellipse cx="80" cy="176" rx="47" ry="12" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.55"><animate attributeName="rx" values="42;53;42" dur="2s" repeatCount="indefinite"/></ellipse>
                <ellipse cx="80" cy="176" rx="31" ry="7.5" fill="none" stroke="#67e8f9" stroke-width="1.5" opacity="0.7"/>
                <ellipse cx="80" cy="176" rx="15" ry="4" fill="#22d3ee" opacity="0.35"/>
            </svg>` },
        { id: 'diamond', name: 'Kim Cương', min: 40000, color: '#a855f7', svg: `
            <svg viewBox="0 0 160 200" overflow="visible">
                <defs>
                    <linearGradient id="g-di-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c1d95"/><stop offset="1" stop-color="#150035"/></linearGradient>
                    <linearGradient id="g-di-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a855f7" stop-opacity="0"/><stop offset="0.5" stop-color="#a855f7" stop-opacity="0.75"><animate attributeName="stop-opacity" values="0.4;0.95;0.4" dur="1.5s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></linearGradient>
                </defs>
                <rect x="79" y="0" width="2" height="200" fill="url(#g-di-b)"/>
                <ellipse cx="80" cy="20" rx="54" ry="14" fill="none" stroke="#a855f7" stroke-width="3.5" opacity="1"><animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/></ellipse>
                <g style="animation:rank-float 5s ease-in-out infinite">
                    <path d="M26 124 L-12 82 L-15 95 L20 138 Z" fill="#a855f7" opacity="0.88"/>
                    <path d="M29 127 L-1 108 L-3 119 L25 140 Z" fill="#c084fc" opacity="0.55"/>
                    <path d="M26 110 L-5 66 L-9 74 L20 118 Z" fill="#a855f7" opacity="0.65"/>
                    <path d="M134 124 L172 82 L175 95 L140 138 Z" fill="#a855f7" opacity="0.88"/>
                    <path d="M131 127 L161 108 L163 119 L135 140 Z" fill="#c084fc" opacity="0.55"/>
                    <path d="M134 110 L165 66 L169 74 L140 118 Z" fill="#a855f7" opacity="0.65"/>
                    <path d="M80 42 L22 75 L22 117 L37 138 L80 156 L123 138 L138 117 L138 75 Z" fill="url(#g-di-s)" stroke="#a855f7" stroke-width="3"/>
                    <path d="M56 136 L56 83 L66 75 L80 70 L94 75 L104 83 L104 136 L80 148 Z" fill="#a855f7" opacity="0.24"/>
                    <path d="M60 132 L60 87 L80 81 L100 87 L100 132 L80 143 Z" fill="none" stroke="#c084fc" stroke-width="1.1" opacity="0.75"/>
                    <rect x="63" y="91" width="10" height="12" fill="#c084fc" opacity="0.85"/>
                    <rect x="75" y="91" width="10" height="12" fill="#c084fc" opacity="0.85"/>
                    <rect x="87" y="91" width="10" height="12" fill="#c084fc" opacity="0.85"/>
                    <rect x="63" y="107" width="10" height="12" fill="#c084fc" opacity="0.65"/>
                    <rect x="75" y="107" width="10" height="12" fill="#c084fc" opacity="0.65"/>
                    <rect x="87" y="107" width="10" height="12" fill="#c084fc" opacity="0.65"/>
                </g>
                <ellipse cx="80" cy="176" rx="50" ry="13" fill="none" stroke="#a855f7" stroke-width="3.5" opacity="0.65"><animate attributeName="rx" values="44;56;44" dur="1.8s" repeatCount="indefinite"/></ellipse>
                <ellipse cx="80" cy="176" rx="33" ry="8" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.75"/>
                <ellipse cx="80" cy="176" rx="16" ry="4" fill="#a855f7" opacity="0.4"/>
            </svg>` },
        { id: 'master', name: 'Bậc Thầy', min: 100000, color: '#f87171', svg: `
            <svg viewBox="0 0 160 200" overflow="visible">
                <defs>
                    <linearGradient id="g-ma-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f1d1d"/><stop offset="1" stop-color="#250505"/></linearGradient>
                    <linearGradient id="g-ma-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24" stop-opacity="0"/><stop offset="0.5" stop-color="#fbbf24" stop-opacity="0.85"><animate attributeName="stop-opacity" values="0.45;1;0.45" dur="1.2s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></linearGradient>
                </defs>
                <rect x="79" y="0" width="2" height="200" fill="url(#g-ma-b)"/>
                <ellipse cx="80" cy="18" rx="58" ry="16" fill="none" stroke="#fbbf24" stroke-width="4" opacity="1"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite"/></ellipse>
                <ellipse cx="80" cy="18" rx="50" ry="12" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.4"/>
                <g style="animation:rank-float 5s ease-in-out infinite">
                    <path d="M23 128 L-18 80 L-21 95 L16 142 Z" fill="#fbbf24" opacity="0.9"/>
                    <path d="M27 131 L-4 112 L-6 123 L22 143 Z" fill="#fde68a" opacity="0.6"/>
                    <path d="M23 114 L-8 65 L-12 73 L16 122 Z" fill="#fbbf24" opacity="0.72"/>
                    <path d="M137 128 L178 80 L181 95 L144 142 Z" fill="#fbbf24" opacity="0.9"/>
                    <path d="M133 131 L164 112 L166 123 L138 143 Z" fill="#fde68a" opacity="0.6"/>
                    <path d="M137 114 L168 65 L172 73 L144 122 Z" fill="#fbbf24" opacity="0.72"/>
                    <path d="M80 40 L20 76 L20 120 L36 142 L80 162 L124 142 L140 120 L140 76 Z" fill="url(#g-ma-s)" stroke="#f87171" stroke-width="3.5"/>
                    <path d="M54 140 L54 82 L64 74 L80 69 L96 74 L106 82 L106 140 L80 152 Z" fill="#ef4444" opacity="0.27"/>
                    <path d="M58 136 L58 86 L80 80 L102 86 L102 136 L80 148 Z" fill="none" stroke="#fca5a5" stroke-width="1.2" opacity="0.8"/>
                    <rect x="61" y="90" width="11" height="13" fill="#fca5a5" opacity="0.9"/>
                    <rect x="74" y="90" width="11" height="13" fill="#fca5a5" opacity="0.9"/>
                    <rect x="87" y="90" width="11" height="13" fill="#fca5a5" opacity="0.9"/>
                    <rect x="61" y="108" width="11" height="13" fill="#fca5a5" opacity="0.7"/>
                    <rect x="74" y="108" width="11" height="13" fill="#fca5a5" opacity="0.7"/>
                    <rect x="87" y="108" width="11" height="13" fill="#fca5a5" opacity="0.7"/>
                    <polygon points="80,8 83,18 77,18" fill="#fbbf24" opacity="0.95"/>
                </g>
                <ellipse cx="80" cy="176" rx="54" ry="14" fill="none" stroke="#fbbf24" stroke-width="4" opacity="0.72"><animate attributeName="rx" values="47;61;47" dur="1.5s" repeatCount="indefinite"/></ellipse>
                <ellipse cx="80" cy="176" rx="36" ry="9" fill="none" stroke="#f87171" stroke-width="2" opacity="0.82"/>
                <ellipse cx="80" cy="176" rx="18" ry="5" fill="#fbbf24" opacity="0.42"/>
            </svg>` }
    ];


    function calculateBusinessEXP(biz, stats) {
        if (!stats) return 0;
        const isPremium = biz && biz.tier === 'PREMIUM';
        
        let xp = 0;
        
        // 1. Bookings
        const bookingXP = isPremium ? 8 : 5;
        xp += (stats.totalBookings || 0) * bookingXP;
        
        // 2. Ratings (Weighted)
        // If we don't have detailed breakdown, we simulate it based on avgRating
        const totalReviews = stats.totalReviews || 0;
        const avg = stats.avgRating || 0;
        
        // Simulation logic if detailed breakdown isn't provided by API
        if (totalReviews > 0) {
            if (isPremium) {
                if (avg >= 4.5) xp += totalReviews * 8; // Mostly 5 stars
                else if (avg >= 4) xp += totalReviews * 6; // Mostly 4 stars
                else if (avg >= 3) xp += totalReviews * 4; // Mostly 3 stars
                else if (avg < 2) xp -= totalReviews * 2; // Mostly 1-2 stars
            } else {
                if (avg >= 4.5) xp += totalReviews * 5; 
                else if (avg >= 4) xp += totalReviews * 4;
                else if (avg < 2.5) xp -= totalReviews * 1;
            }
        }

        // 3. Views
        const views = stats.totalViews || 0;
        const viewThreshold = isPremium ? 50 : 100;
        xp += Math.floor(views / viewThreshold) * 1;

        // 4. Likes (Engagement)
        const likes = stats.totalEngagement || 0;
        xp += Math.floor(likes / 50) * 1;

        // 5. Revenue (Monthly)
        // Estimate from stats.charts.revenueBreakdown if available, or current total
        let revenue = 0;
        if (stats.charts && stats.charts.revenueBreakdown) {
            revenue = stats.charts.revenueBreakdown.reduce((sum, item) => sum + item.value, 0);
        }
        const revenueXP = isPremium ? 2 : 1;
        xp += Math.floor(revenue / 1000000) * revenueXP;

        // 6. Profile Completion (Mocked for now)
        xp += isPremium ? 300 : 100;

        return xp;
    }

    function updateBusinessRank() {
        const container = document.getElementById('business-rank-widget');
        if (!container) return;

        // We need the latest stats to calculate XP
        // If they aren't loaded yet, we wait for loadDashboardStats to finish
        // For the demo, we use a fallback if window._lastDashboardStats is missing
        const stats = window._lastDashboardStats || {
            totalBookings: 1240,
            totalReviews: 450,
            avgRating: 4.8,
            totalViews: 45600,
            totalEngagement: 890,
            charts: { revenueBreakdown: [{ value: 540000000 }] }
        };

        const biz = getCurrentBiz();
        const xp = calculateBusinessEXP(biz, stats);
        
        // Determine Current Rank
        let currentRank = RANK_CONFIG[0];
        let nextRank = RANK_CONFIG[1];
        
        for (let i = RANK_CONFIG.length - 1; i >= 0; i--) {
            if (xp >= RANK_CONFIG[i].min) {
                currentRank = RANK_CONFIG[i];
                nextRank = RANK_CONFIG[i + 1] || null;
                break;
            }
        }

        const progress = nextRank ? ((xp - currentRank.min) / (nextRank.min - currentRank.min)) * 100 : 100;
        const xpToNext = nextRank ? (nextRank.min - xp) : 0;

        // Get business logo
        const bizLogo = biz && biz.logo ? biz.logo : null;
        const bizName = biz && biz.name ? biz.name : 'Doanh Nghiep';
        const bizAvatar = bizLogo
            ? `<img src="${bizLogo}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:26px">🏢</div>`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px">🏢</div>`;

        const isPremium = biz && biz.tier === 'PREMIUM';

        const rankPath = RANK_CONFIG.map((r, i) => {
            const isActive = xp >= r.min;
            const isCurrent = r.id === currentRank.id;
            const dot = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:0 0 auto">` +
                `<div style="width:26px;height:26px;border-radius:50%;border:2px solid ${isActive ? r.color : 'rgba(255,255,255,0.15)'};` +
                `background:${isCurrent ? r.color : isActive ? r.color+'33' : 'transparent'};` +
                `display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${isActive ? '#fff' : 'rgba(255,255,255,0.3)'}">${i+1}</div>` +
                `<span style="font-size:8px;color:${isActive ? r.color : 'rgba(255,255,255,0.25)'};white-space:nowrap;font-weight:${isCurrent?'800':'400'}">${r.name}</span></div>`;
            if (i < RANK_CONFIG.length - 1) {
                const lineW = isActive && xp >= RANK_CONFIG[i+1].min ? '100%' : (isCurrent ? progress+'%' : '0%');
                return dot + `<div style="flex:1;height:2px;margin-top:12px;background:rgba(255,255,255,0.1);position:relative;min-width:10px"><div style="position:absolute;left:0;top:0;height:100%;background:${r.color};width:${lineW}"></div></div>`;
            }
            return dot;
        }).join('');

        container.innerHTML = `
            <div class="hp-rank-bg-icon">🏢</div>
            <div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:22px">
                <div class="hp-rank-logo-wrap rank-${currentRank.id}" style="flex-shrink:0">${currentRank.svg}</div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding:14px 18px;background:rgba(255,255,255,0.04);border-radius:16px;border:1px solid rgba(255,255,255,0.07)">
                        <div style="width:52px;height:52px;border-radius:14px;border:2px solid ${currentRank.color}55;flex-shrink:0;overflow:hidden;background:rgba(255,255,255,0.05)">${bizAvatar}</div>
                        <div style="flex:1;min-width:0">
                            <div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bizName}</div>
                            <div style="display:flex;align-items:center;gap:8px">
                                <span style="font-size:20px;font-weight:900;color:${currentRank.color};text-shadow:0 0 16px ${currentRank.color}88">${currentRank.name}</span>
                                ${isPremium ? '<span style="font-size:9px;padding:2px 8px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:20px;color:#fff;font-weight:700;flex-shrink:0">⚡ PREMIUM</span>' : ''}
                            </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0">
                            <div style="font-size:26px;font-weight:900;color:${currentRank.color};line-height:1">${xp.toLocaleString()}</div>
                            <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px">XP tích lũy</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
                        <div style="text-align:center;padding:10px 6px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
                            <div style="font-size:18px;font-weight:800;color:#fff">${stats.totalBookings || 0}</div>
                            <div style="font-size:9px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Bookings</div>
                        </div>
                        <div style="text-align:center;padding:10px 6px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
                            <div style="font-size:18px;font-weight:800;color:#fff">${stats.totalReviews || 0}</div>
                            <div style="font-size:9px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Đánh giá</div>
                        </div>
                        <div style="text-align:center;padding:10px 6px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
                            <div style="font-size:18px;font-weight:800;color:#fff">${((stats.totalViews||0)/1000).toFixed(1)}k</div>
                            <div style="font-size:9px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Lượt xem</div>
                        </div>
                        <div style="text-align:center;padding:10px 6px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
                            <div style="font-size:18px;font-weight:800;color:#fff">${stats.totalEngagement || 0}</div>
                            <div style="font-size:9px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Yêu thích</div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                            <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.65)">Tiến trình ${nextRank ? '→ ' + nextRank.name : '(Đỉnh cao)'}</span>
                            <span style="font-size:12px;font-weight:900;color:${currentRank.color}">${Math.floor(progress)}% · ${xp.toLocaleString()}/${nextRank ? nextRank.min.toLocaleString() : xp.toLocaleString()} XP</span>
                        </div>
                        <div style="height:10px;background:rgba(255,255,255,0.08);border-radius:10px;overflow:hidden">
                            <div style="height:100%;width:${Math.min(progress,100)}%;background:linear-gradient(90deg,${currentRank.color}88,${currentRank.color});border-radius:10px;box-shadow:0 0 10px ${currentRank.color}66;transition:width 1.5s cubic-bezier(.4,0,.2,1)"></div>
                        </div>
                        <div style="font-size:11px;color:${nextRank ? currentRank.color : '#10b981'};margin-top:5px">${nextRank ? 'Cần thêm <strong>' + xpToNext.toLocaleString() + ' XP</strong> để lên ' + nextRank.name : '✨ Bạn đã đạt cấp độ cao nhất!'}</div>
                    </div>
                </div>
            </div>
            <div style="display:flex;align-items:flex-start;padding:14px 18px;background:rgba(255,255,255,0.03);border-radius:14px;border:1px solid rgba(255,255,255,0.06)">
                ${rankPath}
            </div>
        `;
    }

    // ── Service Ranking Logic ────────────────────────────────────
    window.switchRankingTab = function(btn, criteria) {
        document.querySelectorAll('[data-rank-tab]').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        renderRankingList(criteria);
    };

    function initRankingBoard() {
        renderRankingList('bookings');
    }

    function renderRankingList(criteria) {
        const container = document.getElementById('service-ranking-list');
        if (!container) return;

        const svcs = getServices();
        
        // If no real services, show empty state
        if (!svcs || svcs.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:13px;">Chưa có dữ liệu dịch vụ.</div>';
            return;
        }
        
        // Map criteria to actual field names in Place model
        const fieldMap = {
            bookings: 'reviewCount', // Using reviewCount as proxy for engagement
            views: 'viewsCount',
            likes: 'favoritesCount'
        };
        const field = fieldMap[criteria] || criteria;
        
        // Sort services based on criteria
        const sorted = [...svcs].sort((a, b) => (b[field] || 0) - (a[field] || 0));
        const maxVal = Math.max(...sorted.map(s => s[field] || 0), 1);

        const labels = {
            bookings: 'lượt đặt',
            views: 'lượt xem',
            likes: 'lượt yêu thích'
        };

        const colors = {
            bookings: '#10b981',
            views: '#6366f1',
            likes: '#ec4899'
        };

        container.innerHTML = sorted.slice(0, 5).map((s, idx) => {
            const val = s[field] || 0;
            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            const rankClass = idx < 3 ? `top-${idx + 1}` : '';
            
            return `
                <div class="hp-ranking-item">
                    <div class="hp-rank-badge ${rankClass}">${idx + 1}</div>
                    <div class="hp-ranking-info">
                        <div class="hp-ranking-meta">
                            <div class="hp-ranking-name">${s.name}</div>
                            <div class="hp-ranking-val" style="color:${colors[criteria]}">${val.toLocaleString()} ${labels[criteria]}</div>
                        </div>
                        <div class="hp-progress-bg">
                            <div class="hp-progress-fill" style="width:${pct}%; background:${colors[criteria]}"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }


    function loadAIAnalytics() {
        const container = document.getElementById('ai-content');
        if (!container) return;

        window.apiFetch('/api/business/ai-analytics')
        .then(json => {
            if (json.success && json.data) {
                const d = json.data;
                const trendIcon = d.trend === 'tăng' ? '📈' : (d.trend === 'giảm' ? '📉' : '📊');
                const trendColor = d.trend === 'tăng' ? '#10b981' : (d.trend === 'giảm' ? '#ef4444' : '#6366f1');

                let anomalyHtml = '';
                if (d.anomaly) {
                    anomalyHtml = `
                        <div class="hp-ai-anomaly">
                            <span>⚠️</span>
                            <strong>Cảnh báo:</strong> ${d.anomaly.message}
                        </div>
                    `;
                }

                // Simulate week-by-week trend data for chart
                const prevWeek = d.monthBookings > 0 ? Math.round(d.monthBookings / (1 + d.trendPercent / 100)) : 5;
                const currWeek = d.monthBookings > 0 ? Math.round(d.monthBookings * (d.trendPercent / 100 + 1) / 4) : Math.round(prevWeek * (1 + d.trendPercent / 100));

                // Build forecast points (simulate 4-week outlook using seasonal factor)
                const baseBookings = currWeek || 5;
                const growthFactor = 1 + (d.marketOutlook.growth / 100);
                const forecastPoints = [
                    baseBookings,
                    Math.round(baseBookings * (1 + growthFactor * 0.25)),
                    Math.round(baseBookings * (1 + growthFactor * 0.55)),
                    Math.round(baseBookings * (1 + growthFactor * 0.8)),
                    Math.round(baseBookings * (1 + growthFactor * 1.0)),
                ];

                container.innerHTML = `
                    ${anomalyHtml}
                    <div class="hp-ai-grid">
                        <div class="hp-ai-item">
                            <div class="hp-ai-icon" style="color:${trendColor}">${trendIcon}</div>
                            <div>
                                <div class="hp-ai-label">Tăng trưởng tuần</div>
                                <div class="hp-ai-value">${d.trend === 'tăng' ? '+' : ''}${d.trendPercent}%</div>
                            </div>
                        </div>
                        <div class="hp-ai-item">
                            <div class="hp-ai-icon" style="color:#6366f1">🎯</div>
                            <div>
                                <div class="hp-ai-label">Tỷ lệ chuyển đổi <span class="hp-pro-badge">PRO</span></div>
                                <div class="hp-ai-value">${d.conversionRate}%</div>
                            </div>
                        </div>
                        <div class="hp-ai-item">
                            <div class="hp-ai-icon" style="color:#a855f7">🔮</div>
                            <div>
                                <div class="hp-ai-label">Dự đoán tuần sau <span class="hp-pro-badge">PRO</span></div>
                                <div class="hp-ai-value">${d.prediction.count} booking</div>
                            </div>
                        </div>
                        <div class="hp-ai-item">
                            <div class="hp-ai-icon" style="color:#10b981">🏷️</div>
                            <div>
                                <div class="hp-ai-label">Thị trường <span class="hp-pro-badge">PRO</span></div>
                                <div class="hp-ai-value" style="font-size:11px">${d.priceEvaluation}</div>
                            </div>
                        </div>
                        <div class="hp-ai-item">
                            <div class="hp-ai-icon" style="color:#f43f5e">❤️</div>
                            <div>
                                <div class="hp-ai-label">Chỉ số quay lại <span class="hp-pro-badge">PRO</span></div>
                                <div class="hp-ai-value">28.5% (Tăng 4%)</div>
                            </div>
                        </div>
                        <div class="hp-ai-item">
                            <div class="hp-ai-icon" style="color:#00e5ff">🛡️</div>
                            <div>
                                <div class="hp-ai-label">Uy tín thương hiệu</div>
                                <div class="hp-ai-value">94/100 (Elite)</div>
                            </div>
                        </div>
                    </div>

                    <!-- Chart 1: Trend Comparison -->
                    <div class="hp-ai-chart-section">
                        <div class="hp-ai-chart-label">
                            📊 SO SÁNH TĂNG TRƯỞNG
                            <span class="hp-pro-badge">PRO</span>
                        </div>
                        <div style="height:110px;position:relative;margin-top:8px">
                            <canvas id="ai-trend-chart"></canvas>
                        </div>
                    </div>

                    <div class="hp-ai-suggestion">
                        <div style="font-weight:800;color:#a855f7;margin-bottom:6px;font-size:11px;text-transform:uppercase">💡 Gợi ý chiến lược:</div>
                        ${d.suggestion}
                        <div class="hp-ai-reason">
                            <strong>Tại sao?</strong> ${d.reason}
                        </div>
                    </div>

                    <div class="hp-market-forecast">
                        <div style="font-size:12px;font-weight:800;color:var(--ai-text);margin-bottom:10px;display:flex;align-items:center;gap:8px">
                            🔭 TẦM NHÌN THỊ TRƯỜNG <span class="hp-pro-badge" style="background:#10b981">ULTRA</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                            <div>
                                <div style="font-size:11px;color:var(--ai-muted)">Dự báo 30 ngày tới</div>
                                <div style="font-size:14px;font-weight:700;color:var(--ai-text);margin-top:2px">${d.marketOutlook.status} (${d.marketOutlook.growth >= 0 ? '+' : ''}${d.marketOutlook.growth}%)</div>
                            </div>
                            <div class="hp-forecast-badge">
                                📈 ${d.marketOutlook.positioning}
                            </div>
                        </div>

                        <!-- Chart 2: Market Forecast -->
                        <div class="hp-ai-chart-section" style="background:rgba(16,185,129,0.05);border-color:rgba(16,185,129,0.2)">
                            <div class="hp-ai-chart-label" style="color:#10b981">
                                📅 DỰ BÁO BOOKING 4 TUẦN TỚI
                                <span class="hp-pro-badge" style="background:#10b981">ULTRA</span>
                            </div>
                            <div style="height:100px;position:relative;margin-top:8px">
                                <canvas id="ai-forecast-chart"></canvas>
                            </div>
                        </div>

                        <div style="font-size:12px;color:var(--ai-sug-text);background:rgba(255,255,255,0.03);padding:10px;border-radius:10px;margin-top:10px;line-height:1.4">
                            ${d.marketOutlook.advice}
                        </div>
                    </div>
                `;

                // Render charts after DOM is ready
                setTimeout(() => {
                    _renderAITrendChart(prevWeek, currWeek, d.prediction.count, trendColor);
                    _renderAIForecastChart(forecastPoints, d.marketOutlook.growth);
                }, 50);

            }
        });
    }

    function loadOperationalInsights() {
        // Here we could fetch more specific business health data
        console.log("Deep operational insights loaded.");
    }

    function _renderAITrendChart(prevWeek, currWeek, nextWeek, trendColor) {
        const ctx = document.getElementById('ai-trend-chart');
        if (!ctx || typeof Chart === 'undefined') return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Tuần trước', 'Tuần này', 'Dự đoán tuần sau'],
                datasets: [{
                    data: [prevWeek, currWeek, nextWeek],
                    backgroundColor: [
                        'rgba(148,163,184,0.4)',
                        trendColor === '#10b981' ? 'rgba(16,185,129,0.7)' : trendColor === '#ef4444' ? 'rgba(239,68,68,0.7)' : 'rgba(99,102,241,0.7)',
                        'rgba(168,85,247,0.5)'
                    ],
                    borderColor: [
                        'rgba(148,163,184,0.8)',
                        trendColor,
                        'rgba(168,85,247,0.9)'
                    ],
                    borderWidth: 1.5,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: (ctx) => ` ${ctx.raw} booking` }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 9 }, maxTicksLimit: 4 } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
                }
            }
        });
    }

    function _renderAIForecastChart(points, growthPct) {
        const ctx = document.getElementById('ai-forecast-chart');
        if (!ctx || typeof Chart === 'undefined') return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        const isPositive = growthPct >= 0;
        const lineColor = isPositive ? '#10b981' : '#ef4444';
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, isPositive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Hiện tại', 'Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
                datasets: [{
                    data: points,
                    borderColor: lineColor,
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: lineColor,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: (ctx) => ` ${ctx.raw} booking dự kiến` }
                    }
                },
                scales: {
                    y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 9 }, maxTicksLimit: 4 } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
                }
            }
        });
    }

    window.reloadDashboardData = function(days) {
        document.getElementById('chart-period-title').textContent = days == 365 ? '(1 năm qua)' : `(${days} ngày qua)`;
        loadDashboardStats(days);
    };

    function loadDashboardStats(days = 7) {
        window.apiFetch(`/api/business/stats?days=${days}`)
        .then(json => {
            if (json.success && json.data) {
                const d = json.data;

                // New KPIs
                const viewsEl = document.getElementById('stat-views');
                const followersEl = document.getElementById('stat-followers');
                const bookingsEl = document.getElementById('stat-bookings');
                const engagementEl = document.getElementById('stat-engagement');
                const trendingEl = document.getElementById('stat-trending');
                const reviewsEl = document.getElementById('stat-reviews');

                // Trends
                const trendViewsEl = document.getElementById('trend-views');
                const trendFollowersEl = document.getElementById('trend-followers');
                const trendBookingsEl = document.getElementById('trend-bookings');
                const trendEngagementEl = document.getElementById('trend-engagement');
                const trendTrendingEl = document.getElementById('trend-trending');
                const trendReviewsEl = document.getElementById('trend-reviews');

                // Populate new KPIs
                if (viewsEl) viewsEl.textContent = (d.totalViews || 0).toLocaleString();
                if (followersEl) followersEl.textContent = (d.totalFollowers || 0).toLocaleString();
                if (bookingsEl) bookingsEl.textContent = (d.totalBookings || 0).toLocaleString();
                if (engagementEl) engagementEl.textContent = (d.totalEngagement || 0).toLocaleString();
                if (trendingEl) trendingEl.textContent = Number(d.trendingScore || 0).toFixed(1);
                if (reviewsEl) reviewsEl.textContent = (d.totalReviews || 0).toLocaleString();

                // Populate trends
                if (trendViewsEl) {
                    const isUp = d.trends.views >= 0;
                    trendViewsEl.className = `hp-kpi-trend ${isUp ? 'up' : 'down'}`;
                    trendViewsEl.textContent = `${isUp ? '↑' : '↓'} ${Math.abs(d.trends.views || 0)}%`;
                }
                if (trendFollowersEl) {
                    const isUp = d.trends.followers >= 0;
                    trendFollowersEl.className = `hp-kpi-trend ${isUp ? 'up' : 'down'}`;
                    trendFollowersEl.textContent = `${isUp ? '↑' : '↓'} ${Math.abs(d.trends.followers || 0)}%`;
                }
                if (trendBookingsEl) {
                    const isUp = d.trends.bookings >= 0;
                    trendBookingsEl.className = `hp-kpi-trend ${isUp ? 'up' : 'down'}`;
                    trendBookingsEl.textContent = `${isUp ? '↑' : '↓'} ${Math.abs(d.trends.bookings || 0)}%`;
                }
                if (trendEngagementEl) {
                    const isUp = d.trends.engagement >= 0;
                    trendEngagementEl.className = `hp-kpi-trend ${isUp ? 'up' : 'down'}`;
                    trendEngagementEl.textContent = `${isUp ? '↑' : '↓'} ${Math.abs(d.trends.engagement || 0)}%`;
                }
                if (trendTrendingEl) {
                    const isUp = d.trends.trending >= 0;
                    trendTrendingEl.className = `hp-kpi-trend ${isUp ? 'up' : 'down'}`;
                    trendTrendingEl.textContent = `${isUp ? '↑' : '↓'} ${Math.abs(d.trends.trending || 0)}%`;
                }
                if (trendReviewsEl) {
                    trendReviewsEl.textContent = `${Number(d.avgRating || 0).toFixed(1)}/5`;
                }

                // Render Smart Alerts
                const alertsContainer = document.getElementById('smart-alerts-container');
                if (alertsContainer) {
                    let alertsHtml = '';
                    if (d.actionableAlerts.pendingBookings > 0) {
                        alertsHtml += `
                            <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); padding:12px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <span style="font-size:20px;">⏳</span>
                                    <div>
                                        <div style="font-weight:700; color:#f59e0b; font-size:14px;">${d.actionableAlerts.pendingBookings} đơn hàng đang chờ duyệt</div>
                                        <div style="font-size:12px; color:#cbd5e1; margin-top:2px;">Hãy xác nhận sớm để tránh bị hủy tự động.</div>
                                    </div>
                                </div>
                                <button onclick="window.navigateToView('bookings')" style="background:#f59e0b; color:#000; border:none; padding:6px 16px; border-radius:8px; font-weight:700; cursor:pointer; font-size:12px;">Xử lý ngay</button>
                            </div>
                        `;
                    }
                    if (d.actionableAlerts.lowReviews > 0) {
                        alertsHtml += `
                            <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:12px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <span style="font-size:20px;">⚠️</span>
                                    <div>
                                        <div style="font-weight:700; color:#ef4444; font-size:14px;">Có ${d.actionableAlerts.lowReviews} đánh giá tiêu cực (1-2 sao)</div>
                                        <div style="font-size:12px; color:#cbd5e1; margin-top:2px;">Hãy phản hồi khách hàng để cải thiện uy tín.</div>
                                    </div>
                                </div>
                                <button onclick="window.navigateToView('reviews')" style="background:#ef4444; color:#fff; border:none; padding:6px 16px; border-radius:8px; font-weight:700; cursor:pointer; font-size:12px;">Xem đánh giá</button>
                            </div>
                        `;
                    }
                    if (d.actionableAlerts.tomorrowGuests > 0) {
                        alertsHtml += `
                            <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:12px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <span style="font-size:20px;">📅</span>
                                    <div>
                                        <div style="font-weight:700; color:#10b981; font-size:14px;">Ngày mai có ${d.actionableAlerts.tomorrowGuests} khách hàng</div>
                                        <div style="font-size:12px; color:#cbd5e1; margin-top:2px;">Hãy chuẩn bị sẵn sàng nhân sự và dịch vụ đón tiếp nhé.</div>
                                    </div>
                                </div>
                                <button onclick="window.navigateToView('bookings')" style="background:#10b981; color:#fff; border:none; padding:6px 16px; border-radius:8px; font-weight:700; cursor:pointer; font-size:12px;">Xem danh sách</button>
                            </div>
                        `;
                    }
                    
                    if (alertsHtml) {
                        alertsContainer.innerHTML = alertsHtml;
                        alertsContainer.style.display = 'flex';
                    } else {
                        alertsContainer.style.display = 'none';
                    }
                }

                // Render Charts
                if (d.charts) {
                    _renderMainRevenueChart(d.charts.revenueSeries);
                    _renderBreakdownDoughnutChart(d.charts.revenueBreakdown);
                }

                // Update Funnel
                const funnelViews = document.getElementById('funnel-views');
                const funnelRate = document.getElementById('funnel-rate');
                const funnelBookings = document.getElementById('funnel-bookings');
                if (funnelViews) funnelViews.textContent = d.totalViews || 0;
                if (funnelRate) funnelRate.textContent = (d.conversionRate || 0) + '%';
                if (funnelBookings) funnelBookings.textContent = d.totalBookings || 0;

                // Update Rank Widget with real stats
                window._lastDashboardStats = d;
                updateBusinessRank();
            }
        });
    }

    function _renderMainRevenueChart(seriesData) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx || typeof Chart === 'undefined') return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        // Sử dụng dữ liệu giả định đẹp mắt để hiển thị (do người dùng yêu cầu không cần dữ liệu thật)
        const mockLabels = ['2/6', '3/6', '4/6', '5/6', '6/6', '7/6', '8/6'];
        const mockDataThis = [7500000, 6000000, 14000000, 10500000, 22500000, 34000000, 26000000];
        const mockDataPrev = [9000000, 7500000, 11000000, 9000000, 17500000, 25500000, 24000000];

        // Gradient cho tuần này
        const gradientThis = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradientThis.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradientThis.addColorStop(1, 'rgba(99, 102, 241, 0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: mockLabels,
                datasets: [
                    {
                        label: 'Kỳ này',
                        data: mockDataThis,
                        borderColor: '#6366f1',
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#6366f1',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        backgroundColor: gradientThis,
                        tension: 0.3
                    },
                    {
                        label: 'Kỳ trước',
                        data: mockDataPrev,
                        borderColor: 'rgba(148, 163, 184, 0.4)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 8 }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                onHover: (event, activeElements) => {
                    const noteEl = document.getElementById('chart-dynamic-note');
                    if (!noteEl) return;
                    
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const value = mockDataThis[index];
                        const label = mockLabels[index];
                        
                        // Compare with previous day to set color
                        let isUp = true;
                        if (index > 0) {
                            isUp = value >= mockDataThis[index - 1];
                        }
                        const color = isUp ? '#10b981' : '#ef4444';
                        const arrow = isUp ? '▲' : '▼';
                        
                        noteEl.style.color = color;
                        noteEl.innerHTML = `<span style="font-size:14px; font-weight:600; color:#94a3b8; margin-right:8px">${label}:</span> ${formatMoney(value)} <span style="font-size:16px">${arrow}</span>`;
                    } else {
                        noteEl.style.color = '#fff';
                        noteEl.innerHTML = `<span style="font-size:14px; color:#94a3b8; font-weight:600;">Di chuột vào biểu đồ để xem chi tiết</span>`;
                    }
                }
            }
        });
    }

    function _renderBreakdownDoughnutChart(breakdownData) {
        const ctx = document.getElementById('breakdownChart');
        const emptyEl = document.getElementById('breakdown-empty');
        const tableContainer = document.getElementById('revenue-breakdown-table');
        
        if (!ctx || typeof Chart === 'undefined') return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        if (!breakdownData || breakdownData.length === 0) {
            ctx.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
            if (tableContainer) tableContainer.innerHTML = '';
            return;
        }

        ctx.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';

        const labels = breakdownData.map(d => d.label);
        const data = breakdownData.map(d => d.value);
        const totalRev = data.reduce((a, b) => a + b, 0);
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: (ctx) => ` ${formatMoney(ctx.raw)}` }
                    }
                }
            }
        });

        // Render Table
        if (tableContainer) {
            let tableHtml = `
            <table class="hp-table" style="font-size:12px;">
                <tbody>
            `;
            breakdownData.forEach((d, idx) => {
                const color = colors[idx % colors.length];
                const pct = totalRev > 0 ? ((d.value / totalRev) * 100).toFixed(1) : 0;
                tableHtml += `
                    <tr>
                        <td style="padding:10px 16px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span> ${d.label}</td>
                        <td style="text-align:right; padding:10px 16px; color:#10b981; font-weight:700;">${formatMoney(d.value)}</td>
                        <td style="text-align:right; padding:10px 16px; color:#94a3b8; font-weight:700;">${pct}%</td>
                    </tr>
                `;
            });
            tableHtml += `</tbody></table>`;
            tableContainer.innerHTML = tableHtml;
        }
    }

    function timeSince(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return Math.floor(seconds) + " giây trước";
    }

    function loadDashboardActivities() {
        const container = document.getElementById('activities-container');
        if (!container) return;

        const category = window._currentActivityCategory || 'all';
        window.apiFetch(`/api/business/dashboard/activities?category=${category}&_t=${Date.now()}`)
        .then(json => {
            let list = json.success && json.data ? json.data : [];
            
            // Lọc bỏ những object thuộc định dạng cũ (nếu lỡ bị cache)
            let validBookings = list.filter(b => b && b.id);
            
            // Fallback for demo state
            if (validBookings.length === 0) {
                validBookings = [
                    { id: 'WV-9921', customerName: 'Hoàng Anh', placeName: 'Tour Hạ Long VIP 2N1Đ', useDate: new Date(Date.now() + 86400000), peopleCount: 2, totalPrice: 5000000, status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'vnpay', createdAt: new Date() },
                    { id: 'WV-8832', customerName: 'Minh Thư', placeName: 'Khách sạn Mường Thanh', useDate: new Date(Date.now() + 172800000), peopleCount: 1, totalPrice: 1800000, status: 'pending', paymentStatus: 'pending', paymentMethod: 'cod', createdAt: new Date(Date.now() - 3600000) }
                ];
            }

            container.innerHTML = validBookings.map(b => {
                let badgeClass = 'pending';
                let badgeText = 'Chờ duyệt';
                if (b.status === 'confirmed') { badgeClass = 'confirmed'; badgeText = 'Đã xác nhận'; }
                if (b.status === 'completed') { badgeClass = 'completed'; badgeText = 'Hoàn thành'; }
                if (b.status === 'cancelled') { badgeClass = 'cancelled'; badgeText = 'Đã hủy'; }
                
                let payBadgeClass = b.paymentStatus === 'paid' ? 'completed' : 'pending';
                let payBadgeText = b.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
                let payMethodText = (b.paymentMethod || 'contact').toUpperCase();

                const useDateStr = b.useDate ? new Date(b.useDate).toLocaleDateString('vi-VN') : 'N/A';
                
                return `
                <tr style="cursor:pointer;" onclick="window.navigateToView('bookings')">
                    <td style="color:#a855f7; font-family:monospace; font-weight:700;">#${(b.id || 'N/A').toUpperCase()}</td>
                    <td>
                        <div style="font-weight:700; color:#fff;">${b.customerName || 'Khách'}</div>
                        <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${b.createdAt ? timeSince(b.createdAt) : ''}</div>
                    </td>
                    <td>
                        <div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600;">${b.placeName || 'Dịch vụ'}</div>
                        <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">👥 ${b.peopleCount || 1} khách</div>
                    </td>
                    <td><div style="font-weight:700;">${useDateStr}</div></td>
                    <td>
                        <span class="hp-badge ${payBadgeClass}" style="font-size:9px;">${payBadgeText}</span>
                        <div style="font-size:10px; color:#94a3b8; margin-top:4px;">${payMethodText}</div>
                    </td>
                    <td><span class="hp-badge ${badgeClass}">${badgeText}</span></td>
                    <td style="text-align:right; font-weight:800; color:#10b981;">${formatMoney(b.totalPrice || 0)}</td>
                </tr>
            `;
            }).join('');
        });
    }

    function loadRealMessages() {
        const container = document.getElementById('dashboard-messages');
        if (!container) return;

        window.apiFetch('/api/business/messages')
        .then(json => {
            let list = json.success && json.data ? json.data : [];
            
            // Fallback for demo/empty state
            if (list.length === 0) {
                list = [
                    { customerName: 'Nguyễn Văn A', time: new Date(Date.now() - 3600000), lastMessage: 'Cho tôi hỏi tour Hạ Long còn chỗ ngày mai không?' },
                    { customerName: 'Lê Thị B', time: new Date(Date.now() - 7200000), lastMessage: 'Dịch vụ rất tuyệt vời, cảm ơn shop!' }
                ];
            }

            container.innerHTML = list.slice(0, 3).map(m => {
                const av = (m.customerName ? m.customerName.charAt(0) : 'K').toUpperCase();
                return `
                <div class="hp-list-item" onclick="window.navigateToView('messages')" style="cursor:pointer">
                    <div class="hp-list-av" style="background:#6366f1">${av}</div>
                    <div style="flex:1">
                        <div style="display:flex;justify-content:space-between">
                            <div class="hp-list-text">${m.customerName || 'Khách hàng'}</div>
                            <div style="font-size:10px;color:#94a3b8">${timeSince(m.time)}</div>
                        </div>
                        <div class="hp-list-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${m.lastMessage || ''}</div>
                    </div>
                </div>
                `;
            }).join('');
        });
    }

    function loadRealReviews() {
        const container = document.getElementById('hp-reviews-list');
        if (!container) return;

        window.apiFetch('/api/business/reviews')
        .then(json => {
            let list = json.success && json.data ? json.data : [];
            
            // Fallback for demo/empty state
            if (list.length === 0) {
                list = [
                    { userName: 'Trần Minh C', rating: 5, text: 'Trải nghiệm tuyệt vời, nhân viên hỗ trợ rất nhiệt tình!', placeName: 'Tour Hạ Long VIP', createdAt: new Date(Date.now() - 86400000) },
                    { userName: 'Phạm Hồng D', rating: 4, text: 'Phòng sạch sẽ, view đẹp, sẽ quay lại lần sau.', placeName: 'Khách sạn Mường Thanh', createdAt: new Date(Date.now() - 172800000) }
                ];
            }

            container.innerHTML = list.slice(0, 3).map(r => {
                const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'Gần đây';
                return `
                    <div class="hp-list-item" style="flex-direction:column;align-items:flex-start;gap:4px">
                        <div style="display:flex;justify-content:space-between;width:100%">
                            <div style="font-size:13px;font-weight:700;color:#fff">${r.userName || 'Khách hàng'}</div>
                            <div style="font-size:11px;color:#94a3b8">${timeStr}</div>
                        </div>
                        <div>${stars(r.rating)}</div>
                        <div style="font-size:13px;color:#cbd5e1;line-height:1.4;font-style:italic">"${r.text || r.comment || ''}"</div>
                        <div style="font-size:11px;font-weight:700;color:#a5b4fc;background:rgba(99,102,241,0.1);padding:2px 8px;border-radius:4px;margin-top:4px">${r.placeName || 'Dịch vụ'}</div>
                    </div>
                `;
            }).join('');
        })
        .catch(() => {
            container.innerHTML = '<div style="text-align:center;padding:1rem;color:#ef4444;font-size:12px">Lỗi tải đánh giá.</div>';
        });
    }

    window.switchActivityTab = function(btn, type) {
        document.querySelectorAll('.hp-hub-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        window._currentActivityType = type; // Store globally
        window._currentActivityCategory = 'all'; // Reset category when switching main tab

        const area = document.getElementById('hub-content-area');
        if (!area) return;

        // Render Category Filter Bar for live tabs and orders
        const isLiveTab = ['checkin', 'interactions', 'support'].includes(type);
        const isOrdersTab = type === 'orders';
        
        const filterBarHtml = (isLiveTab || isOrdersTab) ? `
            <div class="hp-activity-filters" style="display:flex; gap:10px; padding:15px 20px 0; overflow-x:auto;">
                <button class="hp-act-filter active" onclick="window.switchActivityCategory(this, 'all')">🌐 Tất cả</button>
                <button class="hp-act-filter" onclick="window.switchActivityCategory(this, 'dining')">🍴 Ẩm thực</button>
                <button class="hp-act-filter" onclick="window.switchActivityCategory(this, 'stay')">🏨 Khách sạn</button>
                <button class="hp-act-filter" onclick="window.switchActivityCategory(this, 'tour')">🗺️ Tour</button>
                <button class="hp-act-filter" onclick="window.switchActivityCategory(this, 'facility')">⚙️ Tiện ích</button>
            </div>
        ` : '';

        if (isOrdersTab) {
            area.innerHTML = `
                ${filterBarHtml}
                <div style="overflow-x: auto; padding: 10px 0;">
                    <table class="hp-table">
                        <thead>
                            <tr><th>Mã đơn</th><th>Khách hàng</th><th>Dịch vụ</th><th>Ngày SD</th><th>Thanh toán</th><th>Trạng thái</th><th style="text-align:right;">Số tiền</th></tr>
                        </thead>
                        <tbody id="activities-container">
                            <tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted)">Đang tải đơn hàng...</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
            loadDashboardActivities();
        } else if (isLiveTab) {
            area.innerHTML = `${filterBarHtml}<div id="live-activity-feed" style="padding: 10px 20px 20px;"></div>`;
            const activityTypes = {
                'checkin': 'check_in',
                'interactions': ['wifi_connect', 'view_menu', 'map_view'],
                'support': 'help_request'
            };
            loadLiveActivities(activityTypes[type]);
        } else if (type === 'feedback') {
            area.innerHTML = `<div id="hp-reviews-list-full" style="padding: 0 28px;"></div>`;
            loadRealReviews('hp-reviews-list-full');
        }
    };

    window.switchActivityCategory = function(btn, category) {
        document.querySelectorAll('.hp-act-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window._currentActivityCategory = category;
        
        if (window._currentActivityType === 'orders') {
            loadDashboardActivities();
        } else {
            const activityTypes = {
                'checkin': 'check_in',
                'interactions': ['wifi_connect', 'view_menu', 'map_view'],
                'support': 'help_request'
            };
            loadLiveActivities(activityTypes[window._currentActivityType]);
        }
    };

    function loadLiveActivities(types) {
        const feed = document.getElementById('live-activity-feed');
        if (!feed) return;
        feed.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted)">Đang tải luồng hoạt động...</div>';

        const category = window._currentActivityCategory || 'all';
        window.apiFetch(`/api/business/activities/live?category=${category}`)
        .then(json => {
            if (json.success && json.data) {
                let filtered = json.data;
                if (types) {
                    const typeArr = Array.isArray(types) ? types : [types];
                    filtered = json.data.filter(a => typeArr.includes(a.type));
                }

                if (filtered.length === 0) {
                    feed.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted)">Chưa có hoạt động nào trong mục này.</div>';
                    return;
                }

                feed.innerHTML = filtered.map(a => {
                    const icons = {
                        'check_in': '📍',
                        'view_menu': '🍽️',
                        'wifi_connect': '📶',
                        'map_view': '🗺️',
                        'order': '📦',
                        'help_request': '🆘',
                        'review': '⭐'
                    };
                    return `
                        <div class="hp-list-item">
                            <div class="hp-list-av" style="background:rgba(255,255,255,0.05); font-size: 20px;">${icons[a.type] || '⚡'}</div>
                            <div style="flex:1">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div class="hp-list-text">
                                        ${a.userName} 
                                        <span style="font-size:11px; font-weight:700; color:#6366f1; background:rgba(99,102,241,0.1); padding:2px 8px; border-radius:10px; margin-left:6px">${a.placeName || 'Dịch vụ'}</span>
                                    </div>
                                    <div style="font-size:10px; color:var(--text-muted)">${timeSince(a.createdAt)}</div>
                                </div>
                                <div class="hp-list-sub">${a.details && (a.details.label || a.details.message || a.details.comment) ? (a.details.label || a.details.message || a.details.comment) : (a.type === 'check_in' ? 'Check-in tại điểm' : 'Hệ thống WanderViet')}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        });
    }

    window.filterOverviewCatalog = function(btn, category) {
        document.querySelectorAll('.hp-catalog-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        const svcs = getServices();
        
        const filtered = category === 'all' ? svcs : svcs.filter(s => 
            s.businessCategory === category || s.kind === category
        );
        
        const grid = document.getElementById('overview-catalog-grid');
        if (!grid) return;

        if (!svcs || svcs.length === 0) {
            grid.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:13px;">Chưa có dịch vụ nào. Hãy tạo dịch vụ đầu tiên của bạn.</div>';
            return;
        }

        grid.innerHTML = filtered.slice(0, 4).map(s => `
            <div class="hp-svc" onclick="window.navigateToView('services')">
                <img src="${s.image || 'https://via.placeholder.com/80x70?text=No+Image'}" class="hp-svc-img" style="width:60px; height:60px;" onerror="this.src='https://via.placeholder.com/80x70?text=No+Image'">
                <div class="hp-svc-info">
                    <div class="hp-svc-name">${s.name}</div>
                    <div class="hp-svc-meta">⭐ ${s.rating > 0 ? s.rating.toFixed(1) : 'Chưa có'} • ${s.reviewCount || 0} đánh giá</div>
                    <div style="font-size:14px;font-weight:800;color:#10b981;margin-top:6px">${s.price > 0 ? formatMoney(s.price) : 'Liên hệ'}</div>
                </div>
            </div>
        `).join('') || '<div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:13px;">Chưa có dịch vụ thuộc nhóm này.</div>';
    };

})();
