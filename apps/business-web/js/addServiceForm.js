/**
 * addServiceForm.js - Elite Zenith Edition
 * Form thêm dịch vụ mới dạng Modal chuyên sâu cho đối tác Elite
 */

(function injectModalStyles() {
  if (document.getElementById('add-svc-styles')) return;
  const style = document.createElement('style');
  style.id = 'add-svc-styles';
  style.textContent = `
    .svc-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(4, 9, 20, 0.7);
      backdrop-filter: blur(15px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      pointer-events: auto !important;
    }
    .svc-modal-overlay.is-open { opacity: 1; visibility: visible; pointer-events: auto !important; }

    .svc-modal {
      background: #111827;
      width: 95%;
      max-width: 700px;
      max-height: 90vh;
      border-radius: 32px;
      box-shadow: 0 40px 100px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      animation: modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      color: #fff;
      pointer-events: auto !important;
    }
    @keyframes modalSlideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
 
    .svc-modal-header {
      padding: 24px 32px;
      background: linear-gradient(to right, #6366f1, #a855f7);
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .svc-modal-title { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .svc-modal-close { background: rgba(255,255,255,0.2); border: none; width: 36px; height: 36px; border-radius: 12px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .svc-modal-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }
 
    .svc-modal-body { 
      padding: 0; 
      overflow-y: auto; 
      flex: 1; 
      background: #111827; 
      pointer-events: auto !important; 
      scrollbar-width: thin;
      scrollbar-color: #374151 transparent;
    }
    .svc-modal-body::-webkit-scrollbar { width: 6px; }
    .svc-modal-body::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }

    .svc-form { 
      padding: 32px; 
      display: flex; 
      flex-direction: column; 
      gap: 32px; 
      pointer-events: auto !important; 
      box-sizing: border-box;
    }
    
    .svc-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .svc-section-title { 
      font-size: 13px; 
      font-weight: 800; 
      color: #a5b4fc; 
      text-transform: uppercase; 
      letter-spacing: 2px; 
      margin-bottom: 8px; 
      border-bottom: 1px solid rgba(255,255,255,0.05); 
      padding-bottom: 8px; 
    }
    
    .svc-form-group { display: flex; flex-direction: column; gap: 8px; width: 100%; box-sizing: border-box; }
    .svc-form-label { font-size: 13px; font-weight: 700; color: #94a3b8; }
    .svc-form-input { 
      border: 1px solid rgba(255,255,255,0.1); 
      border-radius: 14px; 
      padding: 12px 16px; 
      font-size: 14px; 
      transition: all 0.2s; 
      background: rgba(255,255,255,0.03); 
      color: #fff; 
      font-family: inherit; 
      width: 100%;
      box-sizing: border-box;
    }
    .svc-form-input:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
    .svc-form-input::placeholder { color: #4b5563; }
    .svc-form-input option {
      background-color: #111827;
      color: #fff;
    }
    
    .svc-form-row { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      width: 100%;
      box-sizing: border-box;
    }
 
    /* List Builder UI */
    .builder-list { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
    .builder-item { display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); animation: fadeIn 0.3s ease; }
    .builder-item input { flex: 1; border: none; background: transparent; font-size: 13px; outline: none; color: #fff; }
    .builder-btn-remove { color: #f87171; cursor: pointer; padding: 4px; border-radius: 6px; }
    .builder-btn-remove:hover { background: rgba(239,68,68,0.1); }
    .btn-add-item { width: fit-content; padding: 8px 16px; border-radius: 10px; border: 1px dashed rgba(99,102,241,0.3); color: #a5b4fc; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 8px; }
    .btn-add-item:hover { background: rgba(99,102,241,0.05); border-color: #6366f1; }
  
    .svc-modal-footer { 
      padding: 24px 32px; 
      border-top: 1px solid rgba(255,255,255,0.05); 
      display: flex; 
      justify-content: flex-end; 
      gap: 16px; 
      background: #111827; 
      position: sticky;
      bottom: 0;
      z-index: 100;
    }
    .btn-svc { padding: 14px 28px; border-radius: 16px; font-size: 15px; font-weight: 800; cursor: pointer; transition: 0.3s; border: none; font-family: inherit; }
    .btn-svc-cancel { background: rgba(255,255,255,0.05); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); }
    .btn-svc-cancel:hover { background: rgba(255,255,255,0.08); }
    .btn-svc-submit { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; box-shadow: 0 10px 20px rgba(99,102,241,0.2); }
    .btn-svc-submit:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99,102,241,0.3); }
 
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    .spinner-small { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: svc-spin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
    @keyframes svc-spin { to { transform: rotate(360deg); } }

    .preview-container { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; }
    .preview-item { 
      position: relative; width: 140px; height: 160px; border-radius: 16px; 
      overflow: hidden; border: 1px solid rgba(255,255,255,0.1); 
      background: #1e293b; transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .preview-item:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); border-color: rgba(99,102,241,0.4); }
    .preview-item img { width: 100%; height: 100%; object-fit: cover; }
    .preview-item .remove-btn { 
      position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; 
      background: rgba(0,0,0,0.6); color: #fff; border-radius: 50%; 
      display: flex; align-items: center; justify-content: center; 
      font-size: 14px; cursor: pointer; border: none; z-index: 10;
      backdrop-filter: blur(4px);
    }
    .preview-item .remove-btn:hover { background: #ef4444; }
    
    .gallery-tag-select {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: none; border-top: 1px solid rgba(255,255,255,0.1);
      color: #fff; font-size: 12px; font-weight: 600;
      padding: 8px; cursor: pointer; outline: none;
      width: 100%; appearance: none; text-align: center;
    }
    .gallery-tag-select:hover { background: rgba(15, 23, 42, 0.95); }

    /* Amenities Grid UI */
    .amenities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
    .amenity-card { display: block; cursor: pointer; height: 100%; position: relative; }
    .amenity-card-content {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px; transition: all 0.3s; height: 100%;
    }
    .amenity-card:hover .amenity-card-content { background: rgba(255,255,255,0.06); }
    .amenity-card.selected .amenity-card-content {
      background: rgba(99,102,241,0.1); border-color: #6366f1;
      box-shadow: 0 4px 15px rgba(99,102,241,0.15);
    }
    .amenity-icon {
      font-size: 18px; display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; background: rgba(255,255,255,0.05); border-radius: 10px;
      transition: all 0.3s;
    }
    .amenity-card.selected .amenity-card-content .amenity-icon {
      background: #6366f1; color: #fff; transform: scale(1.1);
    }
    .amenity-name { font-size: 13px; font-weight: 600; color: #cbd5e1; transition: all 0.3s; }
    .amenity-card.selected .amenity-card-content .amenity-name { color: #fff; }

    .premium-upload-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px 20px;
      background: rgba(99, 102, 241, 0.05);
      border: 2px dashed rgba(99, 102, 241, 0.2);
      border-radius: 24px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      margin-top: 8px;
      position: relative !important;
      overflow: hidden;
      pointer-events: auto !important;
    }
    .premium-upload-box:hover {
      background: rgba(99, 102, 241, 0.1);
      border-color: #6366f1;
      box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);
    }
    .upload-icon { font-size: 40px; margin-bottom: 5px; }
    .upload-text { font-size: 14px; font-weight: 700; color: #a5b4fc; }
    .upload-sub { font-size: 11px; color: #64748b; }
    .file-status { margin-top: 10px; font-size: 12px; font-weight: 800; color: #10b981; }

    .native-file-input {
      display: block;
      width: 100%;
      padding: 8px;
      margin-top: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 8px;
      color: #a5b4fc;
      font-size: 12px;
    }
    .upload-trigger-btn {
      display: inline-block;
      padding: 10px 20px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 8px;
      pointer-events: auto;
    }
    .upload-trigger-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
    }

  `;
  document.head.appendChild(style);
})();

function initAddServiceForm(rootId = 'modal-root', triggerSelector = '.btn-add') {
  const root = document.getElementById(rootId);
  if (!root) return;

  root.innerHTML = `
    <div class="svc-modal-overlay" id="add-svc-overlay">
      <div class="svc-modal">
        <div class="svc-modal-header">
          <h3 class="svc-modal-title">Dịch vụ Elite & Trải nghiệm</h3>
          <button class="svc-modal-close" id="add-svc-close">✕</button>
        </div>
        <div class="svc-modal-body">
          <form id="add-svc-form" class="svc-form">
            <!-- SECTION 1: THÔNG TIN CƠ BẢN -->
            <div class="svc-section">
              <div class="svc-section-title">✨ Thông tin cơ bản</div>
              <div class="svc-form-group">
                <label class="svc-form-label">Tên dịch vụ / Trải nghiệm *</label>
                <input type="text" id="svc-name" class="svc-form-input" placeholder="VD: Khách sạn Mường Thanh Tuyên Quang" required>
              </div>

              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Phân loại dịch vụ *</label>
                  <select id="svc-kind" class="svc-form-input">
                    <option value="khach-san">🏨 Lưu trú Elite</option>
                    <option value="trai-nghiem">🛶 Trải nghiệm & Điểm đến</option>
                    <option value="nha-hang">🍴 Ẩm thực thượng hạng</option>
                    <option value="giai-tri">🎭 Giải trí & Sự kiện</option>
                    <option value="tien-ich">🛠️ Tiện ích cao cấp</option>
                  </select>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Danh mục quản lý *</label>
                  <select id="svc-businessCategory" class="svc-form-input">
                    <option value="stay">🏨 Lưu trú (Stay)</option>
                    <option value="dining">🍴 Ẩm thực (Dining)</option>
                    <option value="tour">🛶 Tour & Trải nghiệm</option>
                    <option value="facility">🛠️ Tiện ích & Cơ sở vật chất</option>
                    <option value="other">🎯 Khác</option>
                  </select>
                </div>
              </div>

              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Giá khởi điểm (VND) *</label>
                  <input type="number" id="svc-price" class="svc-form-input" placeholder="1000000" required>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Giá gốc (VND)</label>
                  <input type="number" id="svc-price-to" class="svc-form-input" placeholder="1500000">
                </div>
              </div>

              <div class="svc-form-group">
                <label class="svc-form-label">Ảnh đại diện chính (URL)</label>
                <input type="text" id="svc-image" class="svc-form-input" placeholder="https://...">
              </div>

              <div class="svc-form-group">
                <label class="svc-form-label">Tải lên ảnh/video bìa chính</label>
                <div id="svc-image-picker" class="premium-upload-box">
                  <div class="upload-icon">📁</div>
                  <div class="upload-text">Thả file hoặc Click để chọn</div>
                  <div id="svc-image-status" class="upload-sub">Hỗ trợ định dạng Media chất lượng cao</div>
                </div>
                <div id="svc-primary-preview" class="preview-container"></div>
              </div>
            </div>

            <!-- SECTION 2: ĐỊA ĐIỂM & LIÊN HỆ -->
            <div class="svc-section">
              <div class="svc-section-title">📍 Địa điểm & Liên hệ</div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Khu vực (Tỉnh/Thành phố) *</label>
                  <input type="text" id="svc-region" class="svc-form-input" placeholder="VD: Tuyên Quang" required>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Thành phố/Quận huyện</label>
                  <input type="text" id="svc-city" class="svc-form-input" placeholder="VD: TP Tuyên Quang">
                </div>
              </div>
              
              <div class="svc-form-group">
                <label class="svc-form-label">Địa chỉ chi tiết</label>
                <input type="text" id="svc-address" class="svc-form-input" placeholder="Số nhà, Tên đường...">
              </div>

              <div class="svc-form-group">
                <label class="svc-form-label">Định vị chính xác</label>
                <div id="svc-map" style="height: 250px; width: 100%; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);"></div>
                <input type="hidden" id="svc-lat" value="21.0285">
                <input type="hidden" id="svc-lng" value="105.8542">
              </div>

              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Số điện thoại</label>
                  <input type="text" id="svc-phone" class="svc-form-input" placeholder="090...">
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Email liên hệ</label>
                  <input type="email" id="svc-email" class="svc-form-input" placeholder="info@example.com">
                </div>
              </div>

              <div class="svc-form-group">
                <label class="svc-form-label">Website doanh nghiệp</label>
                <input type="text" id="svc-website" class="svc-form-input" placeholder="https://...">
              </div>

              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Giờ mở cửa</label>
                  <input type="text" id="svc-open-time" class="svc-form-input" placeholder="08:00">
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Giờ đóng cửa</label>
                  <input type="text" id="svc-close-time" class="svc-form-input" placeholder="22:00">
                </div>
              </div>
            </div>

            <!-- SECTION 3: THÔNG TIN TOUR (Mở rộng) -->
            <div class="svc-section" id="tour-extras" style="background: rgba(99,102,241,0.03); padding: 24px; border-radius: 24px; border: 1.5px dashed rgba(99,102,241,0.2);">
              <div id="tour-fields" style="display:flex; gap:20px; flex-direction:column;">
                <div class="svc-form-row">
                   <div class="svc-form-group">
                     <label class="svc-form-label">Thời lượng</label>
                     <input type="text" id="svc-duration" class="svc-form-input" placeholder="VD: 3 Ngày 2 Đêm">
                   </div>
                   <div class="svc-form-group">
                     <label class="svc-form-label">Độ khó</label>
                     <select id="svc-diff" class="svc-form-input">
                       <option value="easy">🟢 Dễ dàng (Easy)</option>
                       <option value="medium" selected>🟡 Vừa sức (Medium)</option>
                       <option value="hard">🔴 Thử thách (Hard)</option>
                     </select>
                   </div>
                </div>
                <div class="svc-form-row">
                  <div class="svc-form-group">
                    <label class="svc-form-label">✅ Bao gồm (Includes)</label>
                    <div id="include-list" class="builder-list"></div>
                    <button type="button" class="btn-add-item" id="btn-add-include">＋ Thêm mục</button>
                  </div>
                  <div class="svc-form-group">
                    <label class="svc-form-label">❌ Không bao gồm (Excludes)</label>
                    <div id="exclude-list" class="builder-list"></div>
                    <button type="button" class="btn-add-item" id="btn-add-exclude">＋ Thêm mục</button>
                  </div>
                </div>
                <div class="svc-form-group" style="margin-top:15px;">
                  <label class="svc-form-label">🗺️ Lịch trình chi tiết (Itinerary)</label>
                  <div id="itinerary-list" class="builder-list"></div>
                  <button type="button" class="btn-add-item" id="btn-add-day">＋ Thêm ngày hành trình</button>
                </div>
              </div>
            </div>

            <!-- SECTION 4: NỘI DUNG ELITE -->
            <div class="svc-section">
              <div class="svc-section-title">💎 Nội dung Elite Zenith</div>
              <div class="svc-form-group">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <label class="svc-form-label">Mô tả tổng quan</label>
                  <button type="button" id="ai-generate-desc" style="background:linear-gradient(135deg, #6366f1, #a855f7); border:none; border-radius:8px; padding:6px 12px; color:#fff; font-size:11px; font-weight:700; cursor:pointer;">✨ AI Viết mô tả</button>
                </div>
                <textarea id="svc-desc" class="svc-form-input" style="height:120px; resize:none;" placeholder="Viết những lời chào mời hấp dẫn nhất..."></textarea>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Tổng quan chi tiết (Overview)</label>
                <textarea id="svc-overview" class="svc-form-input" style="height:80px; resize:none;" placeholder="Mô tả chi tiết hơn về dịch vụ, trải nghiệm đặc biệt..."></textarea>
              </div>
              <div class="svc-form-group">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <label class="svc-form-label">Dấu ấn đặc biệt (Highlights)</label>
                  <button type="button" id="ai-generate-highlights" style="background:linear-gradient(135deg, #6366f1, #a855f7); border:none; border-radius:8px; padding:6px 12px; color:#fff; font-size:11px; font-weight:700; cursor:pointer;">✨ AI Tạo highlights</button>
                </div>
                <div id="highlight-list" class="builder-list"></div>
                <button type="button" class="btn-add-item" id="btn-add-hl">＋ Thêm điểm nổi bật</button>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Bộ sưu tập hình ảnh (Gallery)</label>
                <textarea id="svc-imgs" class="svc-form-input" style="height:60px; resize:none; margin-bottom:12px;" placeholder="Dán link ảnh tại đây (cách nhau bởi dấu phẩy)..."></textarea>
                <div id="svc-gallery-picker" class="premium-upload-box">
                  <div class="upload-icon">📸</div>
                  <div class="upload-text">Chọn nhiều ảnh Gallery cùng lúc</div>
                  <div id="svc-gallery-status" class="upload-sub">Hệ thống tự động tối ưu hóa dung lượng</div>
                </div>
                <div id="svc-gallery-preview" class="preview-container"></div>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Video giới thiệu (Youtube/TikTok URL)</label>
                <input type="text" id="svc-video" class="svc-form-input" placeholder="https://youtube.com/...">
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Trang thiết bị & Hỗ trợ (Amenities)</label>
                <div class="amenities-grid">
                  <div class="amenity-card" data-value="Lối đi xe lăn" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">♿</span><span class="amenity-name">Lối đi xe lăn</span></div></div>
                  <div class="amenity-card" data-value="Thang máy" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🛗</span><span class="amenity-name">Thang máy</span></div></div>
                  <div class="amenity-card" data-value="Bãi đậu xe" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🅿️</span><span class="amenity-name">Bãi đậu xe</span></div></div>
                  <div class="amenity-card" data-value="Thân thiện thú cưng" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🐾</span><span class="amenity-name">Thân thiện thú cưng</span></div></div>
                  <div class="amenity-card" data-value="Phòng không hút thuốc" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🚭</span><span class="amenity-name">Phòng không hút thuốc</span></div></div>
                  <div class="amenity-card" data-value="Hồ bơi" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🏊</span><span class="amenity-name">Hồ bơi</span></div></div>
                  <div class="amenity-card" data-value="Dịch vụ Spa" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">💆</span><span class="amenity-name">Dịch vụ Spa</span></div></div>
                  <div class="amenity-card" data-value="Phòng Gym" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🏋️</span><span class="amenity-name">Phòng Gym</span></div></div>
                  <div class="amenity-card" data-value="Buffet sáng" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🍳</span><span class="amenity-name">Buffet sáng</span></div></div>
                  <div class="amenity-card" data-value="Lễ tân 24/7" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🛎️</span><span class="amenity-name">Lễ tân 24/7</span></div></div>
                  <div class="amenity-card" data-value="Két an toàn" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🔒</span><span class="amenity-name">Két an toàn</span></div></div>
                  <div class="amenity-card" data-value="Wifi miễn phí" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🌐</span><span class="amenity-name">Wifi miễn phí</span></div></div>
                  <div class="amenity-card" data-value="Thanh toán thẻ" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">💳</span><span class="amenity-name">Thanh toán thẻ</span></div></div>
                  <div class="amenity-card" data-value="Camera an ninh" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🛡️</span><span class="amenity-name">Camera an ninh</span></div></div>
                  <div class="amenity-card" data-value="Nhà hàng & Bar" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🍷</span><span class="amenity-name">Nhà hàng & Bar</span></div></div>
                  <div class="amenity-card" data-value="Đưa đón sân bay" onclick="this.classList.toggle('selected')"><div class="amenity-card-content"><span class="amenity-icon">🚐</span><span class="amenity-name">Đưa đón sân bay</span></div></div>
                </div>
              </div>
            </div>

            <!-- SECTION 5: THÔNG TIN CHI TIẾT -->
            <div class="svc-section">
              <div class="svc-section-title">📊 Thông tin chi tiết & Gợi ý</div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Thời gian tham quan</label>
                  <input type="text" id="svc-visit-duration" class="svc-form-input" placeholder="VD: 2-3 giờ">
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Độ đông đúc</label>
                  <select id="svc-crowd-level" class="svc-form-input">
                    <option value="low">🟢 Thấp (Yên tĩnh)</option>
                    <option value="medium" selected>🟡 Vừa (Nhộn nhịp)</option>
                    <option value="high">🔴 Cao (Rất đông)</option>
                  </select>
                </div>
              </div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Mức chi phí</label>
                  <select id="svc-cost-level" class="svc-form-input">
                    <option value="budget">💰 Tiết kiệm</option>
                    <option value="standard" selected>💵 Trung bình</option>
                    <option value="luxury">💎 Cao cấp</option>
                  </select>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Đối tượng phù hợp</label>
                  <input type="text" id="svc-suitability" class="svc-form-input" placeholder="Gia đình, Cặp đôi, Nhóm bạn...">
                </div>
              </div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Thời điểm đẹp nhất</label>
                  <input type="text" id="svc-best-time" class="svc-form-input" placeholder="VD: 8:00 - 10:00 sáng">
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Mùa du lịch lý tưởng</label>
                  <input type="text" id="svc-best-season" class="svc-form-input" placeholder="VD: Mùa thu (Tháng 9-11)">
                </div>
              </div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Kết nối Internet</label>
                  <select id="svc-internet" class="svc-form-input">
                    <option value="poor">Kém</option>
                    <option value="fair" selected>Trung bình</option>
                    <option value="good">Tốt</option>
                    <option value="excellent">Rất tốt</option>
                  </select>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Dịch vụ đỗ xe</label>
                  <select id="svc-parking" class="svc-form-input">
                    <option value="none">Không có</option>
                    <option value="street">Vỉa hè</option>
                    <option value="lot" selected>Bãi đỗ xe riêng</option>
                    <option value="valet">Valet Parking</option>
                  </select>
                </div>
              </div>
              <div class="svc-form-group" style="margin-top:10px;">
                <label class="svc-form-label">Hỗ trợ tiếp cận (Accessibility)</label>
                <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:8px; background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:#cbd5e1;"><input type="checkbox" id="svc-acc-wheelchair" style="width:16px; height:16px;"> ♿ Xe lăn</label>
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:#cbd5e1;"><input type="checkbox" id="svc-acc-elevator" style="width:16px; height:16px;"> 🛗 Thang máy</label>
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:#cbd5e1;"><input type="checkbox" id="svc-acc-restroom" style="width:16px; height:16px;"> 🚻 WC tiếp cận</label>
                </div>
              </div>
            </div>

            <!-- SECTION 6: TRẢI NGHIỆM & KẾ HOẠCH -->
            <div class="svc-section">
              <div class="svc-section-title">🗺️ Trải nghiệm & Lên kế hoạch</div>
              <div class="svc-form-group">
                <label class="svc-form-label">Trải nghiệm đặc trưng (Experiences)</label>
                <div id="experience-list" class="builder-list"></div>
                <button type="button" class="btn-add-item" id="btn-add-exp">＋ Thêm trải nghiệm mới</button>
              </div>
              <div class="svc-form-group" style="margin-top:20px;">
                <label class="svc-form-label">Kế hoạch hành trình gợi ý (Suggested Itineraries)</label>
                <p style="font-size:12px; color:#94a3b8; margin-bottom:12px;">Thiết kế các gói lịch trình khác nhau cho từng nhóm khách hàng.</p>
                <div id="itinerary-plans-container" style="display:flex;flex-direction:column;gap:16px;"></div>
                <button type="button" id="btn-add-plan" class="btn-add-item" style="width:100%; padding:15px; border-style:solid;">＋ Thiết kế kế hoạch mới (Couple/Family/Luxury...)</button>
              </div>
            </div>

            <!-- SECTION 7: CÂU HỎI THƯỜNG GẶP -->
            <div class="svc-section">
              <div class="svc-section-title">❓ Câu hỏi thường gặp (FAQ)</div>
              <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
                <button type="button" id="ai-generate-faq" style="background:linear-gradient(135deg, #6366f1, #a855f7); border:none; border-radius:8px; padding:6px 12px; color:#fff; font-size:11px; font-weight:700; cursor:pointer;">✨ AI Gợi ý câu hỏi</button>
              </div>
              <div id="faq-list" class="builder-list"></div>
              <button type="button" class="btn-add-item" id="btn-add-faq">＋ Thêm câu hỏi</button>
            </div>

            <!-- SECTION 8: AN TOÀN & CHÍNH SÁCH -->
            <div class="svc-section">
              <div class="svc-section-title">🛡️ An toàn & Chính sách</div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">⚠️ Cảnh báo an toàn</label>
                  <div id="safety-list" class="builder-list"></div>
                  <button type="button" class="btn-add-item" id="btn-add-safety">＋ Thêm cảnh báo</button>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">🎒 Nên mang theo</label>
                  <div id="bring-list" class="builder-list"></div>
                  <button type="button" class="btn-add-item" id="btn-add-bring">＋ Thêm vật dụng</button>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">🚫 Lưu ý tránh (Avoid)</label>
                  <div id="avoid-list" class="builder-list"></div>
                  <button type="button" class="btn-add-item" id="btn-add-avoid">＋ Thêm lưu ý</button>
                </div>
              </div>
              <div class="svc-form-group" style="margin-top:15px;">
                <label class="svc-form-label">📜 Chính sách & Quy định chung</label>
                <textarea id="svc-policy" class="svc-form-input" style="height:100px; resize:none;" placeholder="Quy định về đặt/hủy phòng, nội quy cơ sở..."></textarea>
              </div>
            </div>

            <!-- SECTION 9: SEO -->
            <div class="svc-section">
              <div class="svc-section-title">Tối ưu SEO</div>
              <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
                <button type="button" id="ai-optimize-seo" style="background:linear-gradient(135deg, #6366f1, #a855f7); border:none; border-radius:8px; padding:6px 12px; color:#fff; font-size:11px; font-weight:700; cursor:pointer;">✨ AI Tối ưu SEO</button>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Meta Title</label>
                <input type="text" id="svc-meta-title" class="svc-form-input" placeholder="Tiêu đề SEO (60 ký tự)">
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Meta Description</label>
                <textarea id="svc-meta-desc" class="svc-form-input" style="height:80px; resize:none;" placeholder="Mô tả SEO (160 ký tự)"></textarea>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Keywords</label>
                <input type="text" id="svc-keywords" class="svc-form-input" placeholder="Từ khóa, cách nhau dấu phẩy">
              </div>
            </div>
          </form>
        </div>
        <div class="svc-modal-footer">
          <button class="btn-svc btn-svc-cancel" id="add-svc-cancel-btn">Hủy bỏ</button>
          <button class="btn-svc btn-svc-submit" id="add-svc-submit-btn">Đăng dịch vụ Elite</button>
        </div>
      </div>
    </div>
  `;


  // Persistent file storage keyed by service ID (or 'new' for new drafts)
  window.svcFileStore = {
    primary: {}, // { serviceId: [File, File, ...] }
    gallery: {}  // { serviceId: [File, File, ...] }
  };

  const getActiveId = () => btnSubmit.dataset.editId || 'new';
  const getFiles = (type) => {
    const id = getActiveId();
    if (!window.svcFileStore[type][id]) window.svcFileStore[type][id] = [];
    return window.svcFileStore[type][id];
  };

  const imagePicker = document.getElementById('svc-image-picker');
  if (imagePicker) {
    imagePicker.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      input.onchange = (e) => {
        const newFiles = Array.from(e.target.files);
        window.appendSvcPreviewFiles(newFiles, 'svc-primary-preview');
      };
      input.click();
    });
  }

  const galleryPicker = document.getElementById('svc-gallery-picker');
  if (galleryPicker) {
    galleryPicker.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => {
        const newFiles = Array.from(e.target.files);
        window.appendSvcPreviewFiles(newFiles, 'svc-gallery-preview');
      };
      input.click();
    });
  }

  window.appendSvcPreviewFiles = (files, previewId) => {
    const container = document.getElementById(previewId);
    if (!container) return;
    
    const type = previewId === 'svc-primary-preview' ? 'primary' : 'gallery';
    const arr = getFiles(type);

    files.forEach(file => {
      arr.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.dataset.isFile = "true";
        const isVideo = file.type.startsWith('video/');
        const mediaHtml = isVideo 
          ? `<video src="${e.target.result}"></video>` 
          : `<img src="${e.target.result}">`;

        file._wanderCategory = isVideo ? 'video' : 'other';

        div.innerHTML = `
          ${mediaHtml}
          ${previewId === 'svc-gallery-preview' ? `
            <select class="gallery-tag-select">
              <option value="other" selected>🏷️ Phân loại</option>
              <option value="view">🌅 Cảnh quan & Không gian</option>
              <option value="dining">🍴 Ẩm thực & Thực đơn</option>
              <option value="service">✨ Dịch vụ & Tiện ích</option>
              <option value="activity">🛶 Hoạt động & Trải nghiệm</option>
              <option value="customer">📸 Nội dung từ khách hàng</option>
              <option value="video" ${isVideo ? 'selected' : ''}>🎥 Video</option>
            </select>
          ` : ''}
          <button type="button" class="remove-btn">&times;</button>
        `;

        const sel = div.querySelector('.gallery-tag-select');
        if (sel) sel.onchange = () => { file._wanderCategory = sel.value; };

        div.querySelector('.remove-btn').onclick = () => {
          div.remove();
          const currentArr = getFiles(type);
          const idx = currentArr.indexOf(file);
          if (idx > -1) currentArr.splice(idx, 1);
          window.updateSvcPreviewStatus(previewId);
        };

        container.appendChild(div);
        window.updateSvcPreviewStatus(previewId);
      };
      reader.readAsDataURL(file);
    });
  };

  window.updateSvcPreviewStatus = (previewId) => {
    const statusId = previewId === 'svc-primary-preview' ? 'svc-image-status' : 'svc-gallery-status';
    const statusEl = document.getElementById(statusId);
    const type = previewId === 'svc-primary-preview' ? 'primary' : 'gallery';
    const arr = getFiles(type);
    if (statusEl) {
      statusEl.textContent = arr.length > 0 ? `✅ ${arr.length} tập tin đã chọn` : (previewId === 'svc-primary-preview' ? 'Hỗ trợ ảnh và video (tối đa 10MB/file)' : 'Chọn nhiều ảnh cùng lúc');
      statusEl.style.color = arr.length > 0 ? '#10b981' : '#64748b';
    }
  };

  // INIT MAP WHEN MODAL OPENS
  initMap();  // --- MAP INITIALIZATION ---
  let mapInstance = null;
  let marker = null;
  window.initEliteMap = initMap;
  function initMap() {
    if (!window.L) {
      // Dynamically load Leaflet if not loaded
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = setupLeafletMap;
      document.head.appendChild(script);
    } else {
      setupLeafletMap();
    };
  }

  function setupLeafletMap() {
    if (window.L) {
      // Fix leaflet marker icon path issue
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }

    const latEl = document.getElementById('svc-lat');
    const lngEl = document.getElementById('svc-lng');
    const hasCoordinates = latEl && latEl.value && parseFloat(latEl.value) !== 0 && !isNaN(parseFloat(latEl.value));
    
    let lat = hasCoordinates ? parseFloat(latEl.value) : 21.0285;
    let lng = hasCoordinates ? parseFloat(lngEl.value) : 105.8542;

    if (mapInstance) {
      mapInstance.invalidateSize();
      mapInstance.setView([lat, lng], 13);
      if (marker) {
        marker.setLatLng([lat, lng]);
      }
      setTimeout(() => { mapInstance.invalidateSize(); }, 300);
    } else {
      const mapEl = document.getElementById('svc-map');
      if (mapEl) {
        mapInstance = L.map('svc-map').setView([lat, lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);
        
        marker = L.marker([lat, lng], {draggable: true}).addTo(mapInstance);
        
        marker.on('dragend', function(e) {
          const pos = marker.getLatLng();
          document.getElementById('svc-lat').value = pos.lat.toFixed(6);
          document.getElementById('svc-lng').value = pos.lng.toFixed(6);
        });

        mapInstance.on('click', function(e) {
          marker.setLatLng(e.latlng);
          document.getElementById('svc-lat').value = e.latlng.lat.toFixed(6);
          document.getElementById('svc-lng').value = e.latlng.lng.toFixed(6);
        });

        // Handle address search via Nominatim
        const addressInput = document.getElementById('svc-address');
        let typingTimer;
        addressInput.addEventListener('input', () => {
          clearTimeout(typingTimer);
          typingTimer = setTimeout(() => {
            const query = addressInput.value.trim();
            if (query.length > 5) {
              fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                  if (data && data.length > 0) {
                    const newLat = parseFloat(data[0].lat);
                    const newLon = parseFloat(data[0].lon);
                    mapInstance.setView([newLat, newLon], 14);
                    marker.setLatLng([newLat, newLon]);
                    document.getElementById('svc-lat').value = newLat.toFixed(6);
                    document.getElementById('svc-lng').value = newLon.toFixed(6);
                  }
                }).catch(err => console.error('Geocoding error', err));
            }
          }, 1000);
        });
        
        setTimeout(() => { mapInstance.invalidateSize(); }, 300);
      }
    }

    // Geocode address if coordinates are missing
    if (!hasCoordinates) {
      const addressVal = document.getElementById('svc-address') ? document.getElementById('svc-address').value.trim() : '';
      const regionVal = document.getElementById('svc-region') ? document.getElementById('svc-region').value.trim() : '';
      const cityVal = document.getElementById('svc-city') ? document.getElementById('svc-city').value.trim() : '';
      
      let searchQuery = addressVal;
      if (regionVal && !searchQuery.includes(regionVal)) {
        searchQuery += (searchQuery ? ', ' : '') + regionVal;
      }
      if (cityVal && !searchQuery.includes(cityVal)) {
        searchQuery += (searchQuery ? ', ' : '') + cityVal;
      }
      
      if (searchQuery) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const newLat = parseFloat(data[0].lat);
              const newLon = parseFloat(data[0].lon);
              if (mapInstance) {
                mapInstance.setView([newLat, newLon], 14);
                if (marker) {
                  marker.setLatLng([newLat, newLon]);
                }
              }
              if (document.getElementById('svc-lat')) document.getElementById('svc-lat').value = newLat.toFixed(6);
              if (document.getElementById('svc-lng')) document.getElementById('svc-lng').value = newLon.toFixed(6);
            }
          })
          .catch(err => console.error('Geocoding error on init', err));
      }
    }
  }

  // --- LOGIC: BUILDER HÀNH TRÌNH ---
  const itineraryList = document.getElementById('itinerary-list');
  const btnAddDay = document.getElementById('btn-add-day');
  if (btnAddDay) btnAddDay.addEventListener('click', async () => {
    const dayNum = itineraryList.children.length + 1;
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.innerHTML = `
      <b style="font-size:12px; color:#6366f1; width:50px;">Ngày ${dayNum}</b>
      <input type="text" placeholder="Tiêu đề ngày (VD: Trekking Fansipan)" class="it-title">
      <input type="text" placeholder="Chi tiết ngắn" class="it-desc">
      <span class="builder-btn-remove">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    itineraryList.appendChild(div);
  });

  // --- LOGIC: BUILDER HIGHLIGHTS ---
  const hlList = document.getElementById('highlight-list');
  const btnAddHl = document.getElementById('btn-add-hl');
  if (btnAddHl) btnAddHl.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.innerHTML = `
      <input type="text" placeholder="VD: Khách sạn 5 sao cao cấp nhất Sapa" class="hl-input">
      <span class="builder-btn-remove">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    hlList.appendChild(div);
  });

  // --- LOGIC: BUILDER EXPERIENCES ---
  const expList = document.getElementById('experience-list');
  const btnAddExp = document.getElementById('btn-add-exp');
  if (btnAddExp) btnAddExp.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'stretch';
    div.innerHTML = `
      <input type="text" placeholder="Tên trải nghiệm" class="exp-title" style="margin-bottom:8px;">
      <textarea placeholder="Mô tả trải nghiệm" class="exp-desc" style="margin-bottom:8px; height:60px; resize:none; padding:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;"></textarea>
      <div style="display:flex; gap:8px;">
        <input type="text" placeholder="Icon (emoji)" class="exp-icon" style="width:60px;">
        <input type="text" placeholder="Độ khó" class="exp-diff" style="width:80px;">
        <input type="text" placeholder="Thời lượng" class="exp-duration" style="flex:1;">
        <input type="number" placeholder="Chi phí (VND)" class="exp-price" style="flex:1;">
      </div>
      <span class="builder-btn-remove" style="align-self:flex-end; margin-top:8px;">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    expList.appendChild(div);
  });

  // --- LOGIC: BUILDER SUGGESTED ITINERARIES (MULTI-PLAN) ---
  const plansContainer = document.getElementById('itinerary-plans-container');
  const btnAddPlan = document.getElementById('btn-add-plan');

  function createStepRow() {
    const row = document.createElement('div');
    row.className = 'sug-step-item';
    row.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;margin-bottom:8px;';
    row.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
        <input type="text" class="sug-time" placeholder="08:00" style="width:70px;flex:none;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
        <input type="text" class="sug-activity" placeholder="✏️ Tên hoạt động (VD: Ăn sáng bún chả...)" style="flex:1;min-width:180px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
        <button type="button" onclick="this.closest('.sug-step-item').remove()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:12px;">✕ Xóa</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <input type="text" class="sug-location" placeholder="📍 Địa điểm cụ thể..." style="flex:1;min-width:150px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
        <input type="text" class="sug-tips" placeholder="💡 Mẹo nhỏ (tùy chọn)..." style="flex:1;min-width:150px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:13px;">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <input type="text" class="sug-img" placeholder="🖼️ URL hình ảnh (tùy chọn)" style="flex:1;min-width:200px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:12px;">
        <textarea class="sug-desc" placeholder="📝 Mô tả thêm về hoạt động này..." rows="2" style="flex:2;min-width:200px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 10px;border-radius:8px;font-size:12px;resize:vertical;"></textarea>
      </div>
    `;
    return row;
  }

  function createPlanBlock() {
    const planId = 'plan-' + Date.now();
    const block = document.createElement('div');
    block.className = 'sug-plan-block';
    block.dataset.planId = planId;
    block.style.cssText = 'background:rgba(99,102,241,0.07);border:1.5px solid rgba(99,102,241,0.25);border-radius:14px;padding:16px;';
    block.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <select class="plan-type" style="background:rgba(0,0,0,0.3);border:1px solid rgba(99,102,241,0.4);color:#c4b5fd;padding:7px 12px;border-radius:8px;font-size:13px;font-weight:700;">
            <option value="couple">💕 Cặp đôi</option>
            <option value="family">👨‍👩‍👧 Gia đình</option>
            <option value="budget">💰 Tiết kiệm</option>
            <option value="luxury">✨ Sang trọng</option>
            <option value="solo">🧘 Solo</option>
            <option value="group">👥 Nhóm bạn</option>
          </select>
          <select class="plan-duration" style="background:rgba(0,0,0,0.3);border:1px solid rgba(99,102,241,0.4);color:#c4b5fd;padding:7px 12px;border-radius:8px;font-size:13px;font-weight:700;">
            <option value="1">1 ngày</option>
            <option value="2">2 ngày</option>
            <option value="3">3 ngày</option>
          </select>
          <input type="text" class="plan-name" placeholder="Tên kế hoạch (VD: Lịch trình ăn uống Hà Nội)" style="flex:1;min-width:200px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:7px 12px;border-radius:8px;font-size:13px;">
        </div>
        <button type="button" onclick="this.closest('.sug-plan-block').remove()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:8px;padding:7px 12px;cursor:pointer;font-size:12px;white-space:nowrap;">🗑 Xóa kế hoạch</button>
      </div>
      <div class="plan-steps-list" style="display:flex;flex-direction:column;"></div>
      <button type="button" class="btn-add-step" style="margin-top:10px;width:100%;padding:9px;background:rgba(99,102,241,0.1);border:1.5px dashed rgba(99,102,241,0.4);border-radius:10px;color:#a5b4fc;font-size:12px;font-weight:700;cursor:pointer;transition:0.2s;">＋ Thêm hoạt động vào lịch trình này</button>
    `;
    block.querySelector('.btn-add-step').addEventListener('click', () => {
      const stepsList = block.querySelector('.plan-steps-list');
      stepsList.appendChild(createStepRow());
    });
    // Add a default first step
    block.querySelector('.plan-steps-list').appendChild(createStepRow());
    return block;
  }

  if (btnAddPlan) btnAddPlan.addEventListener('click', async () => {
    plansContainer.appendChild(createPlanBlock());
  });

  // --- LOGIC: BUILDER FAQ ---
  const faqList = document.getElementById('faq-list');
  const btnAddFaq = document.getElementById('btn-add-faq');
  if (btnAddFaq) btnAddFaq.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'stretch';
    div.innerHTML = `
      <input type="text" placeholder="Câu hỏi" class="faq-question" style="margin-bottom:8px;">
      <input type="text" placeholder="Câu trả lời" class="faq-answer">
      <span class="builder-btn-remove" style="align-self:flex-end; margin-top:8px;">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    faqList.appendChild(div);
  });

  
  // --- LOGIC: IMAGE PREVIEW ---
  window.handleSvcImagePreview = function(input, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (input.files) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.className = 'preview-item';
          div.innerHTML = `
            <img src="${e.target.result}">
            <button type="button" class="remove-btn">✕</button>
          `;
          div.querySelector('.remove-btn').onclick = () => div.remove();
          container.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // --- LOGIC: BUILDER SAFETY ---
  const safetyList = document.getElementById('safety-list');
  const btnAddSafety = document.getElementById('btn-add-safety');
  if (btnAddSafety) btnAddSafety.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'stretch';
    div.innerHTML = `
      <div style="display:flex; gap:10px; margin-bottom:8px;">
        <input type="text" placeholder="Tiêu đề cảnh báo (VD: Độ dốc cao)" class="safety-title" style="flex:1;">
        <select class="safety-severity" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:8px; padding:0 8px;">
          <option value="low">🟢 Nhẹ</option>
          <option value="medium" selected>🟡 Trung bình</option>
          <option value="high">🔴 Nghiêm trọng</option>
        </select>
      </div>
      <textarea placeholder="Mô tả chi tiết cảnh báo..." class="safety-desc" style="height:60px; resize:none; padding:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:12px;"></textarea>
      <span class="builder-btn-remove" style="align-self:flex-end; margin-top:8px;">✕ Xóa cảnh báo</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    safetyList.appendChild(div);
  });

  // --- LOGIC: BUILDER BRING ---
  const bringList = document.getElementById('bring-list');
  const btnAddBring = document.getElementById('btn-add-bring');
  if (btnAddBring) btnAddBring.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.innerHTML = `
      <input type="text" placeholder="Vật dụng nên mang" class="bring-input">
      <span class="builder-btn-remove">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    bringList.appendChild(div);
  });

  // --- LOGIC: BUILDER AVOID ---
  const avoidList = document.getElementById('avoid-list');
  const btnAddAvoid = document.getElementById('btn-add-avoid');
  if (btnAddAvoid) btnAddAvoid.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.innerHTML = `
      <input type="text" placeholder="Điều không nên làm" class="avoid-input">
      <span class="builder-btn-remove">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    avoidList.appendChild(div);
  });

  // --- LOGIC: BUILDER INCLUDES ---
  const includeList = document.getElementById('include-list');
  const btnAddInclude = document.getElementById('btn-add-include');
  if (btnAddInclude) btnAddInclude.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.innerHTML = `
      <input type="text" placeholder="Những gì bao gồm" class="include-input">
      <span class="builder-btn-remove">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    includeList.appendChild(div);
  });

  // --- LOGIC: BUILDER EXCLUDES ---
  const excludeList = document.getElementById('exclude-list');
  const btnAddExclude = document.getElementById('btn-add-exclude');
  if (btnAddExclude) btnAddExclude.addEventListener('click', async () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.innerHTML = `
      <input type="text" placeholder="Những gì không bao gồm" class="exclude-input">
      <span class="builder-btn-remove">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    excludeList.appendChild(div);
  });

  // --- AI AUTO-COMPLETION LOGIC ---
  const btnAIDesc = document.getElementById('ai-generate-desc');
  const btnAIHighlights = document.getElementById('ai-generate-highlights');
  const btnAIFAQ = document.getElementById('ai-generate-faq');
  const btnAISEO = document.getElementById('ai-optimize-seo');

  if (btnAIDesc) btnAIDesc.addEventListener('click', async () => {
    const name = document.getElementById('svc-name').value;
    const kind = document.getElementById('svc-kind').value;
    const region = document.getElementById('svc-region').value;

    if (!name) return alert('Vui lòng nhập tên dịch vụ trước khi dùng AI');

    btnAIDesc.disabled = true;
    btnAIDesc.textContent = 'Đang tạo...';

    try {
      const token = typeof window.getAuthToken === 'function' ? window.getAuthToken() : (localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_token'));
      const res = await fetch('/api/business/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ name, kind, region })
      });
      const data = await res.json();
      if (data.success && data.data) {
        document.getElementById('svc-desc').value = data.data;
      } else {
        alert('Không thể tạo mô tả: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      btnAIDesc.disabled = false;
      btnAIDesc.textContent = '✨ AI Viết mô tả';
    }
  });

  if (btnAIHighlights) btnAIHighlights.addEventListener('click', async () => {
    const name = document.getElementById('svc-name').value;
    const description = document.getElementById('svc-desc').value;

    if (!name) return alert('Vui lòng nhập tên dịch vụ trước khi dùng AI');

    btnAIHighlights.disabled = true;
    btnAIHighlights.textContent = 'Đang tạo...';

    try {
      const token = typeof window.getAuthToken === 'function' ? window.getAuthToken() : (localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_token'));
      const res = await fetch('/api/business/ai/generate-highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const lines = typeof data.data === 'string'
          ? data.data.split('\n').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(data.data) ? data.data : []);
        hlList.innerHTML = '';
        lines.forEach(hl => {
          const div = document.createElement('div');
          div.className = 'builder-item';
          div.innerHTML = `<input type="text" value="${hl.replace(/"/g,'&quot;')}" class="hl-input"><span class="builder-btn-remove">✕</span>`;
          div.querySelector('.builder-btn-remove').onclick = () => div.remove();
          hlList.appendChild(div);
        });
      } else {
        alert('Không thể tạo highlights: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      btnAIHighlights.disabled = false;
      btnAIHighlights.textContent = '✨ AI Tạo highlights';
    }
  });

  if (btnAIFAQ) btnAIFAQ.addEventListener('click', async () => {
    const name = document.getElementById('svc-name').value;
    const description = document.getElementById('svc-desc').value;

    if (!name) return alert('Vui lòng nhập tên dịch vụ trước khi dùng AI');

    btnAIFAQ.disabled = true;
    btnAIFAQ.textContent = 'Đang tạo...';

    try {
      const token = typeof window.getAuthToken === 'function' ? window.getAuthToken() : (localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_token'));
      const res = await fetch('/api/business/ai/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const faqs = Array.isArray(data.data) ? data.data : [];
        faqList.innerHTML = '';
        faqs.forEach(faq => {
          const div = document.createElement('div');
          div.className = 'builder-item';
          div.style.flexDirection = 'column';
          div.style.alignItems = 'stretch';
          div.innerHTML = `
            <input type="text" value="${(faq.question||'').replace(/"/g,'&quot;')}" class="faq-question" style="margin-bottom:8px;">
            <input type="text" value="${(faq.answer||'').replace(/"/g,'&quot;')}" class="faq-answer">
            <span class="builder-btn-remove" style="align-self:flex-end; margin-top:8px;">✕</span>
          `;
          div.querySelector('.builder-btn-remove').onclick = () => div.remove();
          faqList.appendChild(div);
        });
      } else {
        alert('Không thể tạo FAQ: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      btnAIFAQ.disabled = false;
      btnAIFAQ.textContent = '✨ AI Tạo FAQ';
    }
  });

  if (btnAISEO) btnAISEO.addEventListener('click', async () => {
    const name = document.getElementById('svc-name').value;
    const description = document.getElementById('svc-desc').value;

    if (!name) return alert('Vui lòng nhập tên dịch vụ trước khi dùng AI');

    btnAISEO.disabled = true;
    btnAISEO.textContent = 'Đang tối ưu...';

    try {
      const token = typeof window.getAuthToken === 'function' ? window.getAuthToken() : (localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_token'));
      const res = await fetch('/api/business/ai/optimize-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const seo = data.data;
        document.getElementById('svc-meta-title').value = seo.title || '';
        document.getElementById('svc-meta-desc').value = seo.description || '';
        document.getElementById('svc-keywords').value = seo.keywords || '';
      } else {
        alert('Không thể tối ưu SEO: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      btnAISEO.disabled = false;
      btnAISEO.textContent = '✨ AI Tối ưu SEO';
    }
  });

  // --- OVERLAY LOGIC ---
  const overlay = document.getElementById('add-svc-overlay');
  const btnClose = document.getElementById('add-svc-close');
  const btnCancel = document.getElementById('add-svc-cancel-btn');
  const btnSubmit = document.getElementById('add-svc-submit-btn');
  const form = document.getElementById('add-svc-form');

  const triggers = document.querySelectorAll(triggerSelector);
  triggers.forEach(btn => btn.onclick = () => {
    const isEditId = btnSubmit.dataset.editId || 'new';
    overlay.classList.add('is-open');
    
    // Nếu form đang trống thì mới nạp draft
    const nameEl = document.getElementById('svc-name');
    if (nameEl && !nameEl.value) {
      const saved = localStorage.getItem('wander_svc_draft_' + isEditId);
      if (saved) {
        window.restoreSvcDraft(saved);
      }
    }
  });

  window.clearSvcForm = (specificId = null) => {
    const id = specificId || getActiveId();
    form.reset();
    itineraryList.innerHTML = '';
    hlList.innerHTML = '';
    expList.innerHTML = '';
    faqList.innerHTML = '';
    safetyList.innerHTML = '';
    bringList.innerHTML = '';
    avoidList.innerHTML = '';
    if (includeList) includeList.innerHTML = '';
    if (excludeList) excludeList.innerHTML = '';
    const policyEl = document.getElementById('svc-policy');
    if (policyEl) policyEl.value = '';
    if (plansContainer) plansContainer.innerHTML = '';
    
    // Xóa file store cho ID này
    delete window.svcFileStore.primary[id];
    delete window.svcFileStore.gallery[id];
    
    document.getElementById('svc-primary-preview').innerHTML = '';
    document.getElementById('svc-gallery-preview').innerHTML = '';
    if (btnSubmit) {
      delete btnSubmit.dataset.editId;
      btnSubmit.textContent = 'Đăng dịch vụ Elite';
      document.querySelector('.svc-modal-title').textContent = 'Dịch vụ Elite & Trải nghiệm';
    }
  };

  const close = (force = false) => {
    saveDraft(); // Luôn lưu khi đóng
    overlay.classList.remove('is-open');
    document.body.classList.add('is-logging-in');
  };
  btnClose.onclick = () => close(false);
  btnCancel.onclick = () => close(false);
  overlay.onclick = (e) => e.target === overlay && close(false);

  // --- DRAFT / BỘ NHỚ TẠM ---
  window.saveDraft = () => {
    if (!overlay.classList.contains('is-open')) return;
    const isEditId = btnSubmit.dataset.editId || 'new';
    const draft = {
      fields: {},
      amenities: [],
      highlights: [],
      itinerary: [],
      experiences: [],
      faqs: [],
      safety: [],
      bring: [],
      avoid: [],
      includes: [],
      excludes: [],
      plans: [],
      galleryUrls: []
    };

    // Simple fields
    form.querySelectorAll('input:not([type="file"]), textarea, select').forEach(el => {
      if (el.id) draft.fields[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });

    // Amenities
    document.querySelectorAll('.amenity-card.selected').forEach(c => {
      draft.amenities.push(c.dataset.value);
    });

    // Highlights
    document.querySelectorAll('#highlight-list .hl-input').forEach(i => { if(i.value) draft.highlights.push(i.value) });

    // Itinerary
    document.querySelectorAll('#itinerary-list .builder-item').forEach(div => {
      const title = div.querySelector('.it-title').value;
      if (title) draft.itinerary.push({ title, detail: div.querySelector('.it-desc').value });
    });

    // Experiences
    document.querySelectorAll('#experience-list .builder-item').forEach(div => {
      const title = div.querySelector('.exp-title') ? div.querySelector('.exp-title').value : '';
      if (title) {
        draft.experiences.push({
          title,
          description: div.querySelector('.exp-desc') ? div.querySelector('.exp-desc').value : '',
          icon: div.querySelector('.exp-icon').value,
          difficulty: div.querySelector('.exp-diff').value,
          duration: div.querySelector('.exp-duration').value,
          priceEstimate: div.querySelector('.exp-price') ? div.querySelector('.exp-price').value : ''
        });
      }
    });

    // FAQs
    document.querySelectorAll('#faq-list .builder-item').forEach(div => {
      const question = div.querySelector('.faq-question').value;
      if (question) draft.faqs.push({ question, answer: div.querySelector('.faq-answer').value });
    });

    // Safety, Bring, Avoid, Includes, Excludes
    document.querySelectorAll('#safety-list .safety-title').forEach(i => { if(i.value) draft.safety.push(i.value) });
    document.querySelectorAll('#bring-list .bring-input').forEach(i => { if(i.value) draft.bring.push(i.value) });
    document.querySelectorAll('#avoid-list .avoid-input').forEach(i => { if(i.value) draft.avoid.push(i.value) });
    document.querySelectorAll('#include-list .include-input').forEach(i => { if(i.value) draft.includes.push(i.value) });
    document.querySelectorAll('#exclude-list .exclude-input').forEach(i => { if(i.value) draft.excludes.push(i.value) });

    // Plans
    document.querySelectorAll('#itinerary-plans-container .sug-plan-block').forEach(block => {
      const plan = {
        type: block.querySelector('.plan-type').value,
        duration: block.querySelector('.plan-duration').value,
        name: block.querySelector('.plan-name').value,
        timeline: []
      };
      block.querySelectorAll('.sug-step-item').forEach(step => {
        plan.timeline.push({
          time: step.querySelector('.sug-time').value,
          activity: step.querySelector('.sug-activity').value,
          location: step.querySelector('.sug-location').value,
          tips: step.querySelector('.sug-tips').value,
          image: step.querySelector('.sug-img').value,
          description: step.querySelector('.sug-desc').value
        });
      });
      draft.plans.push(plan);
    });

    // Gallery URLs (URL-based images only for draft to avoid storage limits)
    document.querySelectorAll('#svc-gallery-preview .preview-item').forEach(div => {
      const img = div.querySelector('img');
      const select = div.querySelector('.gallery-tag-select');
      // Chỉ lưu URL thật từ server, không lưu Blob URL (blob:) vì sẽ bị chết khi refresh
      if (img && img.src && !div.dataset.isFile && !img.src.startsWith('blob:')) {
        draft.galleryUrls.push({ url: img.src, category: select ? select.value : 'other' });
      }
    });

    localStorage.setItem('wander_svc_draft_' + isEditId, JSON.stringify(draft));
  };

  form.addEventListener('input', () => {
    clearTimeout(form._draftTimer);
    form._draftTimer = setTimeout(saveDraft, 1000);
  });
  form.addEventListener('change', saveDraft);

  window.restoreSvcDraft = (draftStr) => {
    try {
      const draft = JSON.parse(draftStr);
      if (!draft) return;

      // Simple fields
      if (draft.fields) {
        Object.keys(draft.fields).forEach(id => {
          const el = document.getElementById(id);
          // Không đè lên những trường quan trọng nếu chúng đã có giá trị mới hơn (tùy chọn)
          if (el) {
            if (el.type === 'checkbox') el.checked = draft.fields[id];
            else el.value = draft.fields[id];
          }
        });
      }

      // Amenities
      if (draft.amenities) {
        document.querySelectorAll('.amenity-card').forEach(c => {
          if (draft.amenities.includes(c.dataset.value)) c.classList.add('selected');
          else c.classList.remove('selected');
        });
      }

      // Highlights
      if (draft.highlights && hlList) {
        hlList.innerHTML = '';
        draft.highlights.forEach(val => {
          const btn = document.getElementById('btn-add-hl');
          if (btn) btn.click();
          const last = hlList.querySelector('.builder-item:last-child .hl-input');
          if (last) last.value = val;
        });
      }

      // Itinerary
      if (draft.itinerary && itineraryList) {
        itineraryList.innerHTML = '';
        draft.itinerary.forEach(it => {
          const btn = document.getElementById('btn-add-day');
          if (btn) btn.click();
          const lastItem = itineraryList.querySelector('.builder-item:last-child');
          if (lastItem) {
            lastItem.querySelector('.it-title').value = it.title;
            lastItem.querySelector('.it-desc').value = it.detail;
          }
        });
      }

      // Experiences
      if (draft.experiences && expList) {
        expList.innerHTML = '';
        draft.experiences.forEach(it => {
          const btn = document.getElementById('btn-add-exp');
          if (btn) btn.click();
          const lastItem = expList.querySelector('.builder-item:last-child');
          if (lastItem) {
            lastItem.querySelector('.exp-title').value = it.title;
            lastItem.querySelector('.exp-desc').value = it.description;
            lastItem.querySelector('.exp-icon').value = it.icon;
            lastItem.querySelector('.exp-diff').value = it.difficulty;
            lastItem.querySelector('.exp-duration').value = it.duration;
            lastItem.querySelector('.exp-price').value = it.priceEstimate;
          }
        });
      }

      // FAQs
      if (draft.faqs && faqList) {
        faqList.innerHTML = '';
        draft.faqs.forEach(it => {
          const btn = document.getElementById('btn-add-faq');
          if (btn) btn.click();
          const lastItem = faqList.querySelector('.builder-item:last-child');
          if (lastItem) {
            lastItem.querySelector('.faq-question').value = it.question;
            lastItem.querySelector('.faq-answer').value = it.answer;
          }
        });
      }

      // Safety, Bring, Avoid, Includes, Excludes
      const restoreSimpleList = (arr, listId, btnId, inputClass) => {
        if (!arr) return;
        const list = document.getElementById(listId);
        const btn = document.getElementById(btnId);
        if (list && btn) {
          list.innerHTML = '';
          arr.forEach(val => {
            btn.click();
            const last = list.querySelector('.' + inputClass + ':last-child');
            if (last) last.value = val;
          });
        }
      };
      restoreSimpleList(draft.safety, 'safety-list', 'btn-add-safety', 'safety-title');
      restoreSimpleList(draft.bring, 'bring-list', 'btn-add-bring', 'bring-input');
      restoreSimpleList(draft.avoid, 'avoid-list', 'btn-add-avoid', 'avoid-input');
      restoreSimpleList(draft.includes, 'include-list', 'btn-add-include', 'include-input');
      restoreSimpleList(draft.excludes, 'exclude-list', 'btn-add-exclude', 'exclude-input');

      // Plans
      if (draft.plans && plansContainer) {
        plansContainer.innerHTML = '';
        draft.plans.forEach(p => {
          const btn = document.getElementById('btn-add-plan');
          if (btn) btn.click();
          const lastBlock = plansContainer.querySelector('.sug-plan-block:last-child');
          if (lastBlock) {
            lastBlock.querySelector('.plan-type').value = p.type;
            lastBlock.querySelector('.plan-duration').value = p.duration.replace(' ngày', '');
            lastBlock.querySelector('.plan-name').value = p.name;
            const stepsList = lastBlock.querySelector('.plan-steps-list');
            stepsList.innerHTML = ''; // Clear default first step
            p.timeline.forEach(stepData => {
              const row = createStepRow();
              row.querySelector('.sug-time').value = stepData.time;
              row.querySelector('.sug-activity').value = stepData.activity;
              row.querySelector('.sug-location').value = stepData.location;
              row.querySelector('.sug-tips').value = stepData.tips;
              row.querySelector('.sug-img').value = stepData.image;
              row.querySelector('.sug-desc').value = stepData.description;
              stepsList.appendChild(row);
            });
          }
        });
      }

      // Gallery URLs (Server-side)
      if (draft.galleryUrls && galleryUrlPreview) {
        const existingUrls = Array.from(galleryUrlPreview.querySelectorAll('img')).map(img => img.src);
        draft.galleryUrls.forEach(it => {
          if (!existingUrls.includes(it.url)) {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.dataset.url = it.url;
            div.innerHTML = `
              <img src="${it.url}"><button type="button" class="remove-btn">&times;</button>
              <select class="gallery-tag-select">
                <option value="other" ${it.category==='other'?'selected':''}>Phân loại</option>
                <option value="view" ${it.category==='view'?'selected':''}>🌅 Cảnh quan</option>
                <option value="dining" ${it.category==='dining'?'selected':''}>🍴 Ẩm thực</option>
                <option value="service" ${it.category==='service'?'selected':''}>✨ Dịch vụ</option>
                <option value="activity" ${it.category==='activity'?'selected':''}>🛶 Hoạt động</option>
                <option value="customer" ${it.category==='customer'?'selected':''}>📸 Khách hàng</option>
                <option value="video" ${it.category==='video'?'selected':''}>🎥 Video</option>
              </select>
            `;
            div.querySelector('.remove-btn').onclick = () => div.remove();
            galleryUrlPreview.appendChild(div);
          }
        });
      }

      // Restore Binary Files Previews from Cache
      const restoreBinaryPreviews = (previewId) => {
        const type = previewId === 'svc-primary-preview' ? 'primary' : 'gallery';
        const files = getFiles(type);
        const container = document.getElementById(previewId);
        if (container && files.length > 0) {
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Tránh duplicate nếu đã có (kiểm tra theo tên file hoặc nội dung)
                    const isVideo = file.type.startsWith('video/');
                    const mediaHtml = isVideo ? `<video src="${e.target.result}"></video>` : `<img src="${e.target.result}">`;
                    
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.dataset.isFile = "true";
                    div.innerHTML = `
                        ${mediaHtml}
                        ${previewId === 'svc-gallery-preview' ? `
                        <select class="gallery-tag-select">
                            <option value="other" ${file._wanderCategory==='other'?'selected':''}>Phân loại</option>
                            <option value="view" ${file._wanderCategory==='view'?'selected':''}>🌅 Cảnh quan</option>
                            <option value="dining" ${file._wanderCategory==='dining'?'selected':''}>🍴 Ẩm thực</option>
                            <option value="service" ${file._wanderCategory==='service'?'selected':''}>✨ Dịch vụ</option>
                            <option value="activity" ${file._wanderCategory==='activity'?'selected':''}>🛶 Hoạt động</option>
                            <option value="customer" ${file._wanderCategory==='customer'?'selected':''}>📸 Khách hàng</option>
                            <option value="video" ${file._wanderCategory==='video'?'selected':''}>🎥 Video</option>
                        </select>` : ''}
                        <button type="button" class="remove-btn">&times;</button>
                    `;
                    div.querySelector('.remove-btn').onclick = () => {
                        div.remove();
                        const arr = getFiles(type);
                        const idx = arr.indexOf(file);
                        if (idx > -1) arr.splice(idx, 1);
                        window.updateSvcPreviewStatus(previewId);
                    };
                    container.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        }
      };
      restoreBinaryPreviews('svc-primary-preview');
      restoreBinaryPreviews('svc-gallery-preview');

      if (window.WanderUI) window.WanderUI.showToast('Đã khôi phục dữ liệu đang làm dở', 'info');
      // Trigger status update
      window.updateSvcPreviewStatus('svc-primary-preview');
      window.updateSvcPreviewStatus('svc-gallery-preview');
    } catch(e) { console.error('Restore Draft Error:', e); }
  };

  // --- SUBMIT LOGIC ---
  // --- LOGIC: REACTIVE URL PREVIEWS ---
  const mainImgInput = document.getElementById('svc-image');
  const mainImgPreview = document.getElementById('svc-primary-preview');
  if (mainImgInput && mainImgPreview) {
    const updateMainPreview = () => {
      const url = mainImgInput.value.trim();
      mainImgPreview.innerHTML = '';
      if (url) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${url}"><button type="button" class="remove-btn">&times;</button>`;
        div.querySelector('.remove-btn').onclick = () => {
          div.remove();
          mainImgInput.value = '';
        };
        mainImgPreview.appendChild(div);
      }
    };
    mainImgInput.addEventListener('input', updateMainPreview);
    mainImgInput.addEventListener('change', updateMainPreview);
  }

  const galleryUrlInput = document.getElementById('svc-imgs');
  const galleryUrlPreview = document.getElementById('svc-gallery-preview');
  if (galleryUrlInput && galleryUrlPreview) {
    galleryUrlInput.addEventListener('input', () => {
      const urls = galleryUrlInput.value.split(',').map(s => s.trim()).filter(s => s);
      
      // Lấy danh sách các URL đang hiển thị (chỉ lấy từ URL, không lấy từ File)
      const existingUrls = Array.from(galleryUrlPreview.querySelectorAll('.preview-item[data-from-url="true"]'))
        .map(el => el.dataset.url);

      // 1. Xóa những URL không còn trong textarea
      galleryUrlPreview.querySelectorAll('.preview-item[data-from-url="true"]').forEach(el => {
        if (!urls.includes(el.dataset.url)) el.remove();
      });

      // 2. Thêm những URL mới chưa có
      urls.forEach(url => {
        if (!existingUrls.includes(url)) {
          const div = document.createElement('div');
          div.className = 'preview-item';
          div.dataset.fromUrl = "true";
          div.dataset.url = url; // Lưu URL vào dataset để kiểm tra
          div.innerHTML = `<img src="${url}"><button type="button" class="remove-btn">&times;</button>
            <select class="gallery-tag-select">
              <option value="other" selected>Phân loại</option>
              <option value="view">🌅 Cảnh quan</option>
              <option value="dining">🍴 Ẩm thực</option>
              <option value="service">✨ Dịch vụ</option>
              <option value="activity">🛶 Hoạt động</option>
              <option value="customer">📸 Khách hàng</option>
              <option value="video">🎥 Video</option>
            </select>
          `;
          div.querySelector('.remove-btn').onclick = () => {
            div.remove();
            const currentUrls = galleryUrlInput.value.split(',').map(s => s.trim()).filter(s => s && s !== url);
            galleryUrlInput.value = currentUrls.join(', ');
          };
          galleryUrlPreview.appendChild(div);
        }
      });
    });
  }

  btnSubmit.onclick = async () => {
    const name = document.getElementById('svc-name').value;
    const kind = document.getElementById('svc-kind').value;
    const region = document.getElementById('svc-region').value;
    const address = document.getElementById('svc-address').value;

    if (!name || !kind || !region || !address) {
      alert('Vui lòng điền các trường bắt buộc (*)');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-small"></span> Đang xử lý...';

    const price = document.getElementById('svc-price').value || 0;
    const priceTo = document.getElementById('svc-price-to') ? document.getElementById('svc-price-to').value : null;

    // Collect amenities
    const amenities = [];
    document.querySelectorAll('.amenity-card.selected').forEach(c => {
      amenities.push(c.dataset.value);
    });

    // Collect tags
    const tags = document.getElementById('svc-tags') ? 
      document.getElementById('svc-tags').value.split(',').map(s => s.trim()).filter(s => s) : [];

    // FormData cho file upload
    const payload = new FormData();
    const primaryFiles = getFiles('primary');
    const galleryFiles = getFiles('gallery');
    console.log('[Submit] Files:', { primaryFiles, galleryFiles });
    payload.append('name', name);
    payload.append('kind', kind);
    payload.append('region', region);
    if(document.getElementById('svc-city')) payload.append('city', document.getElementById('svc-city').value);
    payload.append('address', address);
    payload.append('description', document.getElementById('svc-desc').value);
    if(document.getElementById('svc-overview')) payload.append('overview', document.getElementById('svc-overview').value);
    payload.append('priceFrom', price);
    if(priceTo) payload.append('priceTo', priceTo);
    payload.append('isTour', kind === 'tour' || kind === 'trai-nghiem');

    if(document.getElementById('svc-phone')) payload.append('contactPhone', document.getElementById('svc-phone').value);
    if(document.getElementById('svc-email')) payload.append('contactEmail', document.getElementById('svc-email').value);
    if(document.getElementById('svc-website')) payload.append('website', document.getElementById('svc-website').value);
    if(document.getElementById('svc-open-time')) payload.append('openTime', document.getElementById('svc-open-time').value);
    if(document.getElementById('svc-close-time')) payload.append('closeTime', document.getElementById('svc-close-time').value);
    if(document.getElementById('svc-lat')) payload.append('lat', document.getElementById('svc-lat').value);
    if(document.getElementById('svc-lng')) payload.append('lng', document.getElementById('svc-lng').value);

    // Quick Info
    payload.append('visitDuration', document.getElementById('svc-visit-duration').value);
    payload.append('crowdLevel', document.getElementById('svc-crowd-level').value);
    payload.append('costLevel', document.getElementById('svc-cost-level').value);
    payload.append('businessCategory', document.getElementById('svc-businessCategory').value);
    
    // Arrays
    payload.append('amenities', JSON.stringify(amenities));
    payload.append('tags', JSON.stringify(tags));
    
    // Primary Image URL
    const imgUrlInput = document.getElementById('svc-image');
    if (imgUrlInput) {
      payload.append('image', imgUrlInput.value.trim());
    }
    // File Upload (Primary)
    if (primaryFiles.length > 0) {
      primaryFiles.forEach(file => {
        payload.append('primaryFile', file);
      });
    }

    const suit = document.getElementById('svc-suitability').value;
    if (suit) payload.append('suitability', JSON.stringify(suit.split(',').map(s=>s.trim())));

    payload.append('bestTimeToVisit', document.getElementById('svc-best-time').value);
    payload.append('bestSeason', document.getElementById('svc-best-season').value);
    payload.append('internetQuality', document.getElementById('svc-internet').value);
    payload.append('parking', document.getElementById('svc-parking').value);

    payload.append('accessibility', JSON.stringify({
      wheelchairAccessible: document.getElementById('svc-acc-wheelchair').checked,
      elevator: document.getElementById('svc-acc-elevator').checked,
      accessibleRestrooms: document.getElementById('svc-acc-restroom').checked,
      notes: ''
    }));

    // Gallery Images URL
    // Gallery Images & Metadata collection
    const galleryItems = [];
    document.querySelectorAll('#svc-gallery-preview .preview-item').forEach(div => {
      const media = div.querySelector('img, video');
      const select = div.querySelector('.gallery-tag-select');
      if (media && media.src && !div.dataset.isFile) {
        let url = media.src;
        // Clean URL to be relative if it's from our server
        if (url.includes('/uploads/')) {
          url = '/uploads/' + url.split('/uploads/')[1];
        } else {
          try {
            const urlObj = new URL(url);
            if (urlObj.origin === window.location.origin) {
              url = urlObj.pathname;
            }
          } catch(e) {}
        }
        
        galleryItems.push({
          url: url,
          category: select ? select.value : 'other'
        });
      }
    });
    payload.append('gallery', JSON.stringify(galleryItems));

    // Fallback for legacy support (optional but keeps compatibility)
    payload.append('images', JSON.stringify(galleryItems.map(it => it.url)));
    payload.append('videoUrl', document.getElementById('svc-video').value);

    // Gallery files with Tags
    if (galleryFiles.length > 0) {
      const galleryMetadata = [];
      
      galleryFiles.forEach((file) => {
        payload.append('galleryFile', file);
        const tag = file._wanderCategory || 'other';
        galleryMetadata.push({ type: tag });
      });
      payload.append('galleryMetadata', JSON.stringify(galleryMetadata));
    }

    // SEO
    const seo = {
      metaTitle: document.getElementById('svc-meta-title').value,
      metaDescription: document.getElementById('svc-meta-desc').value,
      keywords: document.getElementById('svc-keywords').value.split(',').map(s=>s.trim())
    };
    payload.append('seo', JSON.stringify(seo));

    // Highlights
    const hl = [];
    document.querySelectorAll('#highlight-list .hl-input').forEach(i => { if(i.value) hl.push(i.value) });
    payload.append('highlights', JSON.stringify(hl));

    // Experiences
    const exp = [];
    document.querySelectorAll('#experience-list .builder-item').forEach(div => {
      const title = div.querySelector('.exp-title').value;
      if (title) {
        exp.push({
          title,
          description: div.querySelector('.exp-desc') ? div.querySelector('.exp-desc').value : '',
          icon: div.querySelector('.exp-icon').value,
          difficulty: div.querySelector('.exp-diff').value,
          duration: div.querySelector('.exp-duration').value,
          priceEstimate: div.querySelector('.exp-price') ? div.querySelector('.exp-price').value : ''
        });
      }
    });
    payload.append('experiences', JSON.stringify(exp));

    // Suggested Itineraries (Multi-Plan)
    const sugPlans = [];
    document.querySelectorAll('#itinerary-plans-container .sug-plan-block').forEach(block => {
      const type = block.querySelector('.plan-type').value;
      const durationVal = block.querySelector('.plan-duration').value;
      const name = block.querySelector('.plan-name').value || '';
      const timeline = [];
      block.querySelectorAll('.sug-step-item').forEach(step => {
        const activity = step.querySelector('.sug-activity').value.trim();
        if (activity) {
          timeline.push({
            time: step.querySelector('.sug-time').value.trim(),
            activity,
            location: step.querySelector('.sug-location').value.trim(),
            tips: step.querySelector('.sug-tips').value.trim(),
            description: step.querySelector('.sug-desc').value.trim(),
            image: step.querySelector('.sug-img').value.trim()
          });
        }
      });
      if (timeline.length > 0) {
        sugPlans.push({ type, duration: durationVal + ' ngày', name, timeline });
      }
    });
    if (sugPlans.length > 0) {
      payload.append('suggestedItineraries', JSON.stringify(sugPlans));
    }

    // FAQs
    const faqs = [];
    document.querySelectorAll('#faq-list .builder-item').forEach(div => {
      const question = div.querySelector('.faq-question').value;
      if (question) {
        faqs.push({
          question,
          answer: div.querySelector('.faq-answer').value
        });
      }
    });
    payload.append('faqs', JSON.stringify(faqs));

    // Safety & Tips
    const safetyTips = [];
    document.querySelectorAll('#safety-list .builder-item').forEach(div => {
      const title = div.querySelector('.safety-title') ? div.querySelector('.safety-title').value : '';
      if (title) {
        safetyTips.push({
          category: 'general',
          title: title,
          description: div.querySelector('.safety-desc') ? div.querySelector('.safety-desc').value : '',
          severity: div.querySelector('.safety-severity') ? div.querySelector('.safety-severity').value : 'medium'
        });
      }
    });
    payload.append('safetyTips', JSON.stringify(safetyTips));

    const whatToBring = [];
    document.querySelectorAll('#bring-list .bring-input').forEach(i => { if(i.value) whatToBring.push(i.value) });
    payload.append('whatToBring', JSON.stringify(whatToBring));

    const whatNotToDo = [];
    document.querySelectorAll('#avoid-list .avoid-input').forEach(i => { if(i.value) whatNotToDo.push(i.value) });
    payload.append('whatNotToDo', JSON.stringify(whatNotToDo));

    const tourExcludes = [];
    document.querySelectorAll('#exclude-list .exclude-input').forEach(i => { if(i.value) tourExcludes.push(i.value) });
    payload.append('tourExcludes', JSON.stringify(tourExcludes));

    const tourIncludes = [];
    document.querySelectorAll('#include-list .include-input').forEach(i => { if(i.value) tourIncludes.push(i.value) });
    payload.append('tourIncludes', JSON.stringify(tourIncludes));

    payload.append('policy', document.getElementById('svc-policy').value);

    // Tour specific (Automatic based on kind)
    if (kind === 'tour' || kind === 'trai-nghiem') {
      payload.append('tourDuration', document.getElementById('svc-duration').value);
      payload.append('tourDifficulty', document.getElementById('svc-diff').value);
      
      const itinerary = [];
      document.querySelectorAll('#itinerary-list .builder-item').forEach((div, idx) => {
        const title = div.querySelector('.it-title').value;
        if (title) {
          itinerary.push({
            day: idx + 1,
            title,
            detail: div.querySelector('.it-desc').value
          });
        }
      });
      payload.append('tourItinerary', JSON.stringify(itinerary));
    }

    try {
      const token = typeof window.getAuthToken === 'function' ? window.getAuthToken() : (localStorage.getItem('biz_auth_token') || localStorage.getItem('wander_business_token'));
                    
      const editId = btnSubmit.dataset.editId;
      const url = editId ? `/api/business/places/${editId}` : '/api/business/places';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'x-auth-token': token },
        body: payload
      });
      const resData = await res.json();
      if (resData.success) {
        if (window.WanderUI && window.WanderUI.showToast) {
          window.WanderUI.showToast(editId ? "Đã cập nhật dịch vụ Elite thành công!" : "Dịch vụ Elite đã được gửi để phê duyệt!", "success");
        } else {
          alert(editId ? "Đã cập nhật dịch vụ Elite thành công!" : "Dịch vụ Elite đã được gửi để phê duyệt!");
        }
        overlay.classList.remove('is-open');
        document.body.classList.add('is-logging-in');
        // Xóa bộ nhớ tạm sau khi nộp thành công
        const isEditId = btnSubmit ? btnSubmit.dataset.editId || 'new' : 'new';
        localStorage.removeItem('wander_svc_draft_' + isEditId);

        // Dọn dẹp form và trạng thái
        if (window.clearSvcForm) window.clearSvcForm();
        
        // Notify other components that a new service was added or updated
        window.dispatchEvent(new CustomEvent('svc-added'));
      } else {
        alert('Lỗi: ' + resData.message);
      }
    } catch(err) {
      alert('Không thể kết nối máy chủ');
    } finally {
      btnSubmit.disabled = false;
      if (!btnSubmit.dataset.editId) {
        btnSubmit.textContent = 'Đăng dịch vụ Elite';
      }
    }
  };
}


