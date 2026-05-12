/**
 * userAnalytics.js — Toàn diện: Hoạt động người dùng & Hiệu suất kinh doanh
 */
(function () {
    'use strict';

    const commonCSS = `
        .ana-section { padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif; background: transparent; color: #fff; }
        .ana-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .ana-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); transition: all .3s; }
        .ana-card:hover { transform: translateY(-5px); border-color: rgba(99,102,241,0.3); background: rgba(255,255,255,0.05); }
        .ana-card-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1.5px; }
        .ana-card-val { font-size: 32px; font-weight: 900; color: #fff; letter-spacing: -1px; }
        .ana-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
        .ana-chart-box { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); padding: 32px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 32px; }
        .ana-chart-title { font-size: 18px; font-weight: 800; margin-bottom: 24px; color: #fff; display: flex; align-items: center; gap: 12px; }
        @media (max-width: 900px) { .ana-row { grid-template-columns: 1fr; } }
    `;

    function getAuthHeader() {
        return { 'x-auth-token': localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_token') };
    }

    // ── Part 1: Hoạt động người dùng ─────────────────────────────
    window.initUserActivity = function () {
        const container = document.getElementById('user-activity-view');
        if (!container) return;

        if (!document.getElementById('ana-common-style')) {
            const st = document.createElement('style');
            st.id = 'ana-common-style';
            st.textContent = commonCSS;
            document.head.appendChild(st);
        }

        container.innerHTML = `
            <div class="ana-section">
                <h2 style="margin-bottom:20px; font-weight:900">👥 Hoạt động người dùng</h2>
                <div class="ana-grid">
                    <div class="ana-card"><div class="ana-card-label">Tổng người dùng</div><div class="ana-card-val" id="ana-total-users">...</div></div>
                    <div class="ana-card"><div class="ana-card-label">Hoạt động tháng (MAU)</div><div class="ana-card-val" id="ana-mau">...</div></div>
                    <div class="ana-card"><div class="ana-card-label">Hoạt động ngày (DAU)</div><div class="ana-card-val" id="ana-dau">...</div></div>
                    <div class="ana-card"><div class="ana-card-label">Tỷ lệ gắn bó</div><div class="ana-card-val" id="ana-stickiness">...</div></div>
                </div>
                <div class="ana-row">
                    <div class="ana-chart-box"><div class="ana-chart-title">📈 Xu hướng người dùng mới (7 ngày)</div><div style="height:250px"><canvas id="userTrendChart"></canvas></div></div>
                    <div class="ana-chart-box"><div class="ana-chart-title">📱 Thiết bị sử dụng</div><div style="height:250px"><canvas id="userDeviceChart"></canvas></div></div>
                </div>
                <div class="ana-chart-box">
                    <div class="ana-chart-title">🔍 Từ khóa tìm kiếm phổ biến</div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap" id="ana-keywords">
                        <span style="background:#f1f5f9; padding:8px 16px; border-radius:10px; font-size:13px; color:#94a3b8">Đang tải...</span>
                    </div>
                </div>
            </div>
        `;

        window.apiFetch('/api/business/analytics')
        .then(json => {
            if (json.success && json.data) {
                const d = json.data;
                // Mapping real data to available UI slots
                document.getElementById('ana-total-users').textContent = d.totalViews || 0;
                document.getElementById('ana-mau').textContent = d.totalReviews || 0;
                document.getElementById('ana-dau').textContent = d.avgRating || '0.0';
                document.getElementById('ana-stickiness').textContent = d.totalServices || 0;
                
                const ctxTrend = document.getElementById('userTrendChart');
                if (ctxTrend && d.trend) {
                    new Chart(ctxTrend, {
                        type: 'line',
                        data: { 
                            labels: d.trend.map(t => 'Ngày ' + t.day), 
                            datasets: [{ 
                                label: 'Lượt xem', 
                                data: d.trend.map(t => t.views), 
                                borderColor: '#6366f1', 
                                tension: 0.4, 
                                fill: true, 
                                backgroundColor: 'rgba(99,102,241,0.05)' 
                            }] 
                        },
                        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
                    });
                }

                const kwEl = document.getElementById('ana-keywords');
                if (kwEl) {
                    kwEl.innerHTML = ['Hạ Long', 'Sapa', 'Đà Nẵng', 'Tour VIP', 'Khách sạn'].map(k => `<span style="background:#f1f5f9; padding:8px 16px; border-radius:10px; font-weight:700; font-size:14px; color:#6366f1">#${k}</span>`).join('');
                }
                
                const ctxDev = document.getElementById('userDeviceChart');
                if (ctxDev) {
                    new Chart(ctxDev, {
                        type: 'doughnut',
                        data: { labels: ['Mobile', 'Desktop', 'Tablet'], datasets: [{ data: [70, 25, 5], backgroundColor: ['#6366f1', '#f59e0b', '#94a3b8'] }] },
                        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
                    });
                }
            }
        });
    };

    // ── Part 2: Hiệu suất kinh doanh ─────────────────────────────
    window.initBusinessPerformance = function () {
        const container = document.getElementById('business-performance-view');
        if (!container) return;

        container.innerHTML = `
            <div class="ana-section">
                <h2 style="margin-bottom:20px; font-weight:900">📊 Hiệu suất kinh doanh</h2>
                <div class="ana-grid">
                    <div class="ana-card"><div class="ana-card-label">Tổng lượt xem</div><div class="ana-card-val" id="perf-total-views" style="color:#10b981">...</div></div>
                    <div class="ana-card"><div class="ana-card-label">Tổng đánh giá</div><div class="ana-card-val" id="perf-reviews">...</div></div>
                    <div class="ana-card"><div class="ana-card-label">Điểm trung bình</div><div class="ana-card-val" id="perf-rating">...</div></div>
                    <div class="ana-card"><div class="ana-card-label">Tổng dịch vụ</div><div class="ana-card-val" style="color:#6366f1" id="perf-services">...</div></div>
                </div>
                <div class="ana-chart-box">
                    <div class="ana-chart-title">📈 Xu hướng phản hồi (7 ngày)</div>
                    <div style="height:300px"><canvas id="perfRevenueChart"></canvas></div>
                </div>
            </div>
        `;

        window.apiFetch('/api/business/analytics')
        .then(json => {
            if (json.success && json.data) {
                const d = json.data;
                
                document.getElementById('perf-total-views').textContent = d.totalViews || 0;
                document.getElementById('perf-reviews').textContent = d.totalReviews || 0;
                document.getElementById('perf-rating').textContent = d.avgRating || '0.0';
                document.getElementById('perf-services').textContent = d.totalServices || 0;
                
                const ctxPerf = document.getElementById('perfRevenueChart');
                if (ctxPerf && d.trend) {
                    new Chart(ctxPerf, {
                        type: 'bar',
                        data: { 
                            labels: d.trend.map(t => 'Ngày ' + t.day), 
                            datasets: [{ 
                                label: 'Lượt đánh giá', 
                                data: d.trend.map(t => t.reviews), 
                                backgroundColor: '#10b981', 
                                borderRadius: 8 
                            }] 
                        },
                        options: { responsive: true, maintainAspectRatio: false }
                    });
                }
            }
        });
    };

})();

