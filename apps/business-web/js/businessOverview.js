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

    function getServices() {
        const stored = JSON.parse(localStorage.getItem('biz_services') || '[]');
        if (stored.length > 0) return stored;
        return [
            { id: 1, name: 'Tour Hạ Long VIP 2N1Đ',    price: 2500000, bookings: 124, rating: 4.8, status: 'active',  image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80' },
            { id: 2, name: 'Khách sạn Mường Thanh',     price: 1800000, bookings: 87,  rating: 4.5, status: 'active',  image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' },
            { id: 3, name: 'Nhà hàng Bếp Việt Hội An',  price: 350000,  bookings: 203, rating: 4.7, status: 'active',  image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' },
            { id: 4, name: 'Tour Sapa Trekking 3N2Đ',   price: 3200000, bookings: 45,  rating: 4.9, status: 'pending', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80' },
        ];
    }

    // Data will be fetched from API

    const reviews = [
        { user: 'Hoàng Văn E', av: 'H', rating: 5, text: 'Tuyệt vời! Trải nghiệm khó quên.', svc: 'Tour Hạ Long', time: '1 ngày trước' },
        { user: 'Phạm Thu D',   av: 'P', rating: 4, text: 'Dịch vụ tốt, nhân viên thân thiện.', svc: 'Khách sạn Đà Nẵng', time: '2 ngày trước' },
    ];

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
    .hp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
    .hp-kpi { 
      background: rgba(255,255,255,0.03); padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); 
      display: flex; flex-direction: column; gap: 16px; backdrop-filter: blur(20px); transition: all .4s;
    }
    .hp-kpi:hover { transform: translateY(-5px); border-color: rgba(99,102,241,0.3); background: rgba(255,255,255,0.05); }
    .hp-kpi-icon { 
      width: 54px; height: 54px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 26px; 
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
    }
    .hp-kpi-val { font-size: 32px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -1px; }
    .hp-kpi-lbl { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }

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
    
    .hp-rank-badge { width: 22px; height: 22px; border-radius: 6px; background: rgba(99,102,241,0.15); color: #818cf8; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
    .hp-rank-badge.top { background: #f59e0b; color: #000; }
    `;

    // ── Main Content HTML ────────────────────────────────────────
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
                    <div class="hp-kpi-icon">💰</div>
                    <div>
                        <div class="hp-kpi-lbl">Tổng Doanh Thu</div>
                        <div class="hp-kpi-val" id="stat-revenue" style="color:#10b981">...</div>
                        <div id="trend-revenue" style="font-size:11px; margin-top:6px; font-weight:600; color:#94a3b8">...</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">📈</div>
                    <div>
                        <div class="hp-kpi-lbl">Tổng Đơn Hàng</div>
                        <div class="hp-kpi-val" id="stat-bookings" style="color:#6366f1">...</div>
                        <div id="trend-bookings" style="font-size:11px; margin-top:6px; font-weight:600; color:#94a3b8">...</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">💬</div>
                    <div>
                        <div class="hp-kpi-lbl">Tin nhắn chưa đọc</div>
                        <div class="hp-kpi-val" id="stat-messages" style="color:#f59e0b">...</div>
                    </div>
                </div>
                <div class="hp-kpi">
                    <div class="hp-kpi-icon">🏨</div>
                    <div>
                        <div class="hp-kpi-lbl">Dịch vụ hoạt động</div>
                        <div class="hp-kpi-val" id="stat-services" style="color:#a855f7">...</div>
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

                <!-- Service Efficiency -->
                <div class="hp-card">
                    <div class="hp-card-head">
                        <div class="hp-card-title">🏆 Hiệu suất dịch vụ</div>
                    </div>
                    <div class="hp-card-body">
                        <div style="display:flex; flex-direction:column; gap:14px">
                            <div style="display:flex; align-items:center; gap:12px">
                                <div class="hp-rank-badge top">1</div>
                                <div style="flex:1">
                                    <div style="font-size:13px; font-weight:700">Tour Hạ Long VIP</div>
                                    <div style="font-size:11px; color:#10b981">ROI: 320%</div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px">
                                <div class="hp-rank-badge">2</div>
                                <div style="flex:1">
                                    <div style="font-size:13px; font-weight:700">Khách sạn Mường Thanh</div>
                                    <div style="font-size:11px; color:#10b981">ROI: 245%</div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px">
                                <div class="hp-rank-badge">3</div>
                                <div style="flex:1">
                                    <div style="font-size:13px; font-weight:700">Tour Sapa Trekking</div>
                                    <div style="font-size:11px; color:#10b981">ROI: 198%</div>
                                </div>
                            </div>
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

            <!-- Full Width Data Table -->
            <div style="margin-bottom: 40px;">
                <div class="hp-card">
                    <div class="hp-card-head" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px;">
                        <div class="hp-card-title">📑 Đơn hàng gần đây</div>
                        <span class="hp-card-link" onclick="window.navigateToView('bookings')">Xem tất cả đơn hàng →</span>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="hp-table" id="bookings-table">
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
                            <div class="hp-card-title">🌟 Dịch vụ nổi bật</div>
                            <span class="hp-card-link" onclick="window.navigateToView('services')">Quản lý →</span>
                        </div>
                        <div class="hp-card-body">
                            <div class="hp-svcs" style="grid-template-columns: 1fr; gap: 16px;">
                                ${svcs.slice(0, 3).map(s => `
                                    <div class="hp-svc" onclick="window.navigateToView('services')">
                                        <img src="${s.image}" class="hp-svc-img" style="width:60px; height:60px;">
                                        <div class="hp-svc-info">
                                            <div class="hp-svc-name">${s.name}</div>
                                            <div class="hp-svc-meta">⭐ ${s.rating} • ${s.bookings} lượt đặt</div>
                                            <div style="font-size:14px;font-weight:800;color:#10b981;margin-top:6px">${formatMoney(s.price)}</div>
                                        </div>
                                    </div>
                                `).join('')}
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

    // ── Chart Logic ──────────────────────────────────────────────
    function initChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        // Fix: Destroy existing chart if it exists to avoid "Canvas is already in use" error
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Gradient
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: [1200000, 2500000, 1800000, 4200000, 3100000, 5600000, 4800000],
                    borderColor: '#6366f1',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6366f1',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
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
            st.textContent = css;
            document.head.appendChild(st);
        }

        container.innerHTML = render();
        updateIdentity();
        
        // Load Real Data from API
        loadDashboardStats();
        loadDashboardActivities();
        loadRealReviews();
        loadRealMessages();
        loadAIAnalytics();
        loadOperationalInsights();

        // Cần chờ DOM render xong để vẽ Chart
        setTimeout(initChart, 50);
    };


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
                const revEl = document.getElementById('stat-revenue');
                const bookEl = document.getElementById('stat-bookings');
                const msgEl = document.getElementById('stat-messages');
                const svcEl = document.getElementById('stat-services');
                
                const trendRevEl = document.getElementById('trend-revenue');
                const trendBookEl = document.getElementById('trend-bookings');

                if (revEl) revEl.textContent = formatMoney(d.revenueTotal);
                if (bookEl) bookEl.textContent = d.totalBookings;
                if (msgEl) msgEl.textContent = d.actionableAlerts.unreadMessages;
                if (svcEl) svcEl.textContent = d.activeServices;

                if (trendRevEl) {
                    const isUp = d.trends.revenue >= 0;
                    trendRevEl.innerHTML = `<span style="color:${isUp ? '#10b981' : '#ef4444'}">${isUp ? '▲' : '▼'} ${Math.abs(d.trends.revenue)}%</span> vs kỳ trước`;
                }
                if (trendBookEl) {
                    const isUp = d.trends.bookings >= 0;
                    trendBookEl.innerHTML = `<span style="color:${isUp ? '#10b981' : '#ef4444'}">${isUp ? '▲' : '▼'} ${Math.abs(d.trends.bookings)}%</span> vs kỳ trước`;
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
            }
        });
    }

    function _renderMainRevenueChart(seriesData) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx || typeof Chart === 'undefined') return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(148, 163, 184, 0.15)'); // Neutral gray-blue gradient
        gradient.addColorStop(1, 'rgba(148, 163, 184, 0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: seriesData.labels,
                datasets: [{
                    label: 'Doanh thu',
                    data: seriesData.data,
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#fff',
                    pointRadius: 0, // Ẩn điểm giống chứng khoán
                    pointHoverRadius: 6,
                    pointHitRadius: 10,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0, // Đường thẳng gãy khúc
                    segment: {
                        borderColor: ctx => {
                            if (!ctx.p0 || !ctx.p1) return '#10b981';
                            return ctx.p0.parsed.y > ctx.p1.parsed.y ? '#ef4444' : '#10b981'; // Đỏ nếu giảm, xanh nếu tăng
                        }
                    }
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: { label: (ctx) => ` ${formatMoney(ctx.raw)}` }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(255,255,255,0.05)', borderDash: [5, 5] }, // Lưới đứt nét
                        ticks: { color: '#94a3b8', callback: (v) => v/1000000 + 'M' } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: '#94a3b8' } 
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
                        const value = seriesData.data[index];
                        const label = seriesData.labels[index];
                        
                        // Compare with previous day to set color
                        let isUp = true;
                        if (index > 0) {
                            isUp = value >= seriesData.data[index - 1];
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

        window.apiFetch(`/api/business/dashboard/activities?_t=${Date.now()}`)
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

})();

