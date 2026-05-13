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
    }
    .svc-modal-overlay.is-open { opacity: 1; visibility: visible; }
 
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
 
    .svc-modal-body { padding: 0; overflow-y: auto; flex: 1; background: transparent; }
    .svc-form { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
    
    .svc-section-title { font-size: 13px; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
    
    .svc-form-group { display: flex; flex-direction: column; gap: 8px; }
    .svc-form-label { font-size: 13px; font-weight: 700; color: #94a3b8; }
    .svc-form-input { border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px 16px; font-size: 14px; transition: all 0.2s; background: rgba(255,255,255,0.03); color: #fff; font-family: inherit; }
    .svc-form-input:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
    .svc-form-input::placeholder { color: #4b5563; }
    
    .svc-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
 
    /* List Builder UI */
    .builder-list { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
    .builder-item { display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); animation: fadeIn 0.3s ease; }
    .builder-item input { flex: 1; border: none; background: transparent; font-size: 13px; outline: none; color: #fff; }
    .builder-btn-remove { color: #f87171; cursor: pointer; padding: 4px; border-radius: 6px; }
    .builder-btn-remove:hover { background: rgba(239,68,68,0.1); }
    .btn-add-item { width: fit-content; padding: 8px 16px; border-radius: 10px; border: 1px dashed rgba(99,102,241,0.3); color: #a5b4fc; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 8px; }
    .btn-add-item:hover { background: rgba(99,102,241,0.05); border-color: #6366f1; }
 
    .svc-modal-footer { padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 16px; background: rgba(0,0,0,0.1); }
    .btn-svc { padding: 14px 28px; border-radius: 16px; font-size: 15px; font-weight: 800; cursor: pointer; transition: 0.3s; border: none; font-family: inherit; }
    .btn-svc-cancel { background: rgba(255,255,255,0.05); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); }
    .btn-svc-cancel:hover { background: rgba(255,255,255,0.08); }
    .btn-svc-submit { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; box-shadow: 0 10px 20px rgba(99,102,241,0.2); }
    .btn-svc-submit:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99,102,241,0.3); }
 
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

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
            <!-- SECTION 1: CƠ BẢN -->
            <div class="svc-section">
              <div class="svc-section-title">Thông tin cơ bản</div>
              <div class="svc-form-group" style="margin-bottom: 20px;">
                <label class="svc-form-label">Tên dịch vụ/Tour *</label>
                <input type="text" id="svc-name" class="svc-form-input" placeholder="Tên hiển thị thu hút khách hàng" required>
              </div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Phân loại *</label>
                  <select id="svc-kind" class="svc-form-input">
                    <option value="trai-nghiem">Trải nghiệm / Điểm đến</option>
                    <option value="khach-san">Khách sạn / Villa</option>
                    <option value="nha-hang">Nhà hàng / Quán ăn</option>
                    <option value="giai-tri">Giải trí / Sự kiện</option>
                    <option value="tien-ich">Tiện ích du lịch</option>
                  </select>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Nhóm quản lý *</label>
                  <select id="svc-businessCategory" class="svc-form-input">
                    <option value="dining">Ẩm thực (Dining)</option>
                    <option value="stay">Lưu trú (Stay)</option>
                    <option value="tour">Tour & Trải nghiệm</option>
                    <option value="facility">Tiện ích & Cơ sở vật chất</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div class="svc-form-group" style="margin-top: 20px;">
                <label class="svc-form-label">Giá khởi điểm (VND) *</label>
                <input type="number" id="svc-price" class="svc-form-input" placeholder="3200000" required>
              </div>
            </div>

            <!-- SECTION 2: CHI TIẾT ĐỊA ĐIỂM -->
            <div class="svc-section">
              <div class="svc-section-title">Địa điểm & Liên hệ</div>
              <div class="svc-form-row">
                <div class="svc-form-group">
                  <label class="svc-form-label">Vùng/Miền *</label>
                  <input type="text" id="svc-region" class="svc-form-input" placeholder="VD: Sapa, Lào Cai" required>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Số điện thoại hỗ trợ</label>
                  <input type="text" id="svc-phone" class="svc-form-input" placeholder="090...">
                </div>
              </div>
              <div class="svc-form-group" style="margin-top: 15px;">
                <label class="svc-form-label">Địa chỉ chính xác</label>
                <input type="text" id="svc-address" class="svc-form-input" placeholder="Số nhà, Tên đường...">
              </div>
            </div>

            <!-- SECTION 3: TOUR SPECIFIC (Conditional) -->
            <div class="svc-section" id="tour-extras" style="background: rgba(99,102,241,0.03); padding: 20px; border-radius: 20px; border: 1px dashed rgba(99,102,241,0.2);">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <input type="checkbox" id="svc-is-tour" style="width:20px; height:20px; cursor:pointer;">
                <label for="svc-is-tour" class="svc-form-label" style="cursor:pointer; margin:0;">Đây là Tour du lịch (Có lịch trình & ngày đi)</label>
              </div>
              <div id="tour-fields" style="display:none; gap:20px; flex-direction:column;">
                <div class="svc-form-row">
                   <div class="svc-form-group">
                     <label class="svc-form-label">Thời lượng</label>
                     <input type="text" id="svc-duration" class="svc-form-input" placeholder="VD: 3 Ngày 2 Đêm">
                   </div>
                   <div class="svc-form-group">
                     <label class="svc-form-label">Độ khó</label>
                     <select id="svc-diff" class="svc-form-input">
                       <option value="easy">Dễ dàng (Easy)</option>
                       <option value="medium">Vừa sức (Medium)</option>
                       <option value="hard">Thử thách (Hard)</option>
                     </select>
                   </div>
                </div>
                <div class="svc-form-group">
                  <label class="svc-form-label">Lịch trình chi tiết (Day-by-Day)</label>
                  <div id="itinerary-list" class="builder-list"></div>
                  <div class="btn-add-item" id="btn-add-day">+ Thêm ngày hành trình</div>
                </div>
              </div>
            </div>

            <!-- SECTION 4: NỘI DUNG ELITE -->
            <div class="svc-section">
              <div class="svc-section-title">Nội dung Elite</div>
              <div class="svc-form-group">
                <label class="svc-form-label">Mô tả tổng quan</label>
                <textarea id="svc-desc" class="svc-form-input" style="height:100px; resize:none;" placeholder="Viết những lời chào mời hấp dẫn nhất..."></textarea>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Dấu ấn đặc biệt (Highlights)</label>
                <div id="highlight-list" class="builder-list"></div>
                <div class="btn-add-item" id="btn-add-hl">+ Thêm điểm nổi bật</div>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Ảnh trưng bày (Dán link cách nhau bằng dấu phẩy)</label>
                <textarea id="svc-imgs" class="svc-form-input" style="height:60px; resize:none;" placeholder="https://..."></textarea>
              </div>
              <div class="svc-form-group">
                <label class="svc-form-label">Video (Youtube/TikTok URL)</label>
                <input type="text" id="svc-video" class="svc-form-input" placeholder="https://youtube.com/...">
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

  // --- LOGIC: HIỆN/ẨN TOUR FIELDS ---
  const chkTour = document.getElementById('svc-is-tour');
  const tourFields = document.getElementById('tour-fields');
  chkTour.addEventListener('change', () => {
    tourFields.style.display = chkTour.checked ? 'flex' : 'none';
  });

  // --- LOGIC: BUILDER HÀNH TRÌNH ---
  const itineraryList = document.getElementById('itinerary-list');
  const btnAddDay = document.getElementById('btn-add-day');
  btnAddDay.addEventListener('click', () => {
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
  btnAddHl.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'builder-item';
    div.innerHTML = `
      <input type="text" placeholder="VD: Khách sạn 5 sao cao cấp nhất Sapa" class="hl-input">
      <span class="builder-btn-remove">✕</span>
    `;
    div.querySelector('.builder-btn-remove').onclick = () => div.remove();
    hlList.appendChild(div);
  });

  // --- OVERLAY LOGIC ---
  const overlay = document.getElementById('add-svc-overlay');
  const btnClose = document.getElementById('add-svc-close');
  const btnCancel = document.getElementById('add-svc-cancel-btn');
  const btnSubmit = document.getElementById('add-svc-submit-btn');
  const form = document.getElementById('add-svc-form');

  const triggers = document.querySelectorAll(triggerSelector);
  triggers.forEach(btn => btn.onclick = () => overlay.classList.add('is-open'));

  const close = () => { overlay.classList.remove('is-open'); form.reset(); itineraryList.innerHTML = ''; hlList.innerHTML = ''; };
  btnClose.onclick = close;
  btnCancel.onclick = close;
  overlay.onclick = (e) => e.target === overlay && close();

  // --- SUBMIT LOGIC ---
  btnSubmit.onclick = async () => {
    const name = document.getElementById('svc-name').value;
    if (!name) return alert('Vui lòng nhập tên dịch vụ');
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Đang xử lý...';

    const highlights = Array.from(hlList.querySelectorAll('.hl-input')).map(i => i.value).filter(Boolean);
    const itinerary = Array.from(itineraryList.children).map((div, idx) => ({
      day: idx + 1,
      title: div.querySelector('.it-title').value,
      detail: div.querySelector('.it-desc').value
    })).filter(it => it.title);

    const payload = {
      name,
      kind: document.getElementById('svc-kind').value,
      priceFrom: document.getElementById('svc-price').value,
      region: document.getElementById('svc-region').value,
      address: document.getElementById('svc-address').value,
      contactPhone: document.getElementById('svc-phone').value,
      description: document.getElementById('svc-desc').value,
      videoUrl: document.getElementById('svc-video').value,
      images: document.getElementById('svc-imgs').value.split(',').map(s => s.trim()).filter(Boolean),
      businessCategory: document.getElementById('svc-businessCategory').value,
      isTour: chkTour.checked,
      tourDuration: document.getElementById('svc-duration').value,
      tourDifficulty: document.getElementById('svc-diff').value,
      tourItinerary: itinerary,
      highlights: highlights
    };

    try {
      const token = localStorage.getItem('wander_token') || localStorage.getItem('biz_auth_token');
      const res = await fetch('/api/business/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã tạo thành công! Dịch vụ đang chờ kiểm duyệt Elite.');
        location.reload();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch(err) {
      alert('Không thể kết nối máy chủ');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Đăng dịch vụ Elite';
    }
  };
}


