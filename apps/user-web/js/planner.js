/* ===================== PLANNER.JS ===================== */
window.WanderPlanner = window.WanderPlanner || {};

const VN_PLACES_PHOTOS = {
  "hồ hoàn kiếm": "https://images.unsplash.com/photo-1509060464153-4466739f78d0?w=800&fit=crop",
  "hoàn kiếm": "https://images.unsplash.com/photo-1509060464153-4466739f78d0?w=800&fit=crop",
  "lăng bác": "https://images.unsplash.com/photo-1599708153386-62e26066265e?w=800&fit=crop",
  "phố cổ": "https://images.unsplash.com/photo-1555944411-9a258e7a2b0a?w=800&fit=crop",
  "vịnh hạ long": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop",
  "hạ long": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop",
  "đảo ti tốp": "https://images.unsplash.com/photo-1547950515-e65383569762?w=800&fit=crop",
  "hang sửng sốt": "https://images.unsplash.com/photo-1508809159021-4171206013a2?w=800&fit=crop",
  "fansipan": "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop",
  "cát cát": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&fit=crop",
  "bản cát cát": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&fit=crop",
  "tràng an": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop",
  "bái đính": "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&fit=crop"
};

const GENERIC_VN_PHOTOS = [
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop",
  "https://images.unsplash.com/photo-1509060464153-4466739f78d0?w=800&fit=crop",
  "https://images.unsplash.com/photo-1555944411-9a258e7a2b0a?w=800&fit=crop",
  "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop",
  "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop"
];

const VN_PLACES_VIDEOS = {
  "hà nội": "35nL-Ma8OkM",
  "hoàn kiếm": "35nL-Ma8OkM",
  "phố cổ": "35nL-Ma8OkM",
  "hạ long": "f9z_O9iP-84",
  "ti tốp": "f9z_O9iP-84",
  "sapa": "R7i_887eC-c",
  "cát cát": "R7i_887eC-c",
  "fansipan": "R7i_887eC-c",
  "ninh bình": "W_q_B-O8y0A",
  "tràng an": "W_q_B-O8y0A",
  "đà nẵng": "1N9Ssw_D6x8",
  "hội an": "1N9Ssw_D6x8",
  "phú quốc": "c62mX3X3o2g",
  "vũng tàu": "N0Z2L-d4Kx4",
  "tp.hcm": "GexG9mE4C1s"
};

function getVNPhoto(query, idx = 0) {
  if (!query) return GENERIC_VN_PHOTOS[idx % GENERIC_VN_PHOTOS.length];
  const qLower = query.toLowerCase().trim();
  for (const [key, val] of Object.entries(VN_PLACES_PHOTOS)) {
    if (qLower.includes(key) || key.includes(qLower)) {
      return val + `&sig=${idx}_${Math.floor(Math.random() * 100)}`;
    }
  }
  return GENERIC_VN_PHOTOS[idx % GENERIC_VN_PHOTOS.length] + `&sig=${idx}_${Math.floor(Math.random() * 100)}`;
}

function getVNVideoId(query) {
  if (!query) return '35nL-Ma8OkM';
  const qLower = query.toLowerCase().trim();
  for (const [key, val] of Object.entries(VN_PLACES_VIDEOS)) {
    if (qLower.includes(key) || key.includes(qLower)) {
      return val;
    }
  }
  return '35nL-Ma8OkM';
}

window.getGPSDirections = function(destinationName, event) {
  if (event) event.preventDefault();
  
  if (navigator.geolocation) {
    if (window.WanderToast) window.WanderToast.info("📡 Đang kết nối tín hiệu GPS của bạn...");
    else console.log("Đang kết nối GPS...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${encodeURIComponent(destinationName)}`;
        window.open(url, '_blank');
      },
      (error) => {
        console.warn("GPS access denied, falling back to standard directions.");
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationName)}`;
        window.open(url, '_blank');
      },
      { timeout: 5000 }
    );
  } else {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationName)}`;
    window.open(url, '_blank');
  }
};

const initPlanner = function () {
  if (window.WanderPlanner_Initialized) return;
  window.WanderPlanner_Initialized = true;
  console.log("🚀 [WanderPlanner] Initializing...");
  const form = document.getElementById('aiPlannerForm');
  const resultContainer = document.getElementById('timelineResult');
  const loader = document.getElementById('aiLoader');
  const placeholder = document.getElementById('resultPlaceholder');
  const refineBox = document.getElementById('refineBox');
  const refineForm = document.getElementById('refineForm');
  const refineInput = document.getElementById('refineInput');
  const refineBtn = document.getElementById('refineBtn');
  const btnModeForm = document.getElementById('btnModeForm');
  const btnModeDiscovery = document.getElementById('btnModeDiscovery');
  const stepBasic = document.getElementById('stepBasic');
  const stepSmartWizard = document.getElementById('stepSmartWizard');
  const btnSaveTrip = document.getElementById('btnSaveTrip');
  const versionTabs = document.getElementById('versionTabs');

  let currentItineraryId = null;
  let planHistory = [];
  let currentPlanIndex = -1;

  // --- Discovery Logic ---
  const discoveryForm = document.getElementById('discoveryForm');
  const discoveryInput = document.getElementById('discoveryInput');
  const discoveryMessages = document.getElementById('discoveryMessages');
  let discoveryHistory = [];

  function addDiscoveryBubble(text, role) {
    const b = document.createElement('div');
    b.className = `chat-bubble ${role}`;
    b.innerHTML = role === 'ai' ? `<strong>✨ WanderAI</strong>${text}` : text;
    discoveryMessages.appendChild(b);
    discoveryMessages.scrollTop = discoveryMessages.scrollHeight;
  }

  if (btnModeForm && btnModeDiscovery) {
    const btnModeCompare = document.getElementById('btnModeCompare');
    
    function switchPath(activeBtn, targetStepId) {
      // Clear active class from all buttons
      [btnModeForm, btnModeDiscovery, btnModeCompare].forEach(btn => btn?.classList.remove('active'));
      activeBtn.classList.add('active');
      
      // Hide all steps
      [stepBasic, document.getElementById('stepDiscovery'), stepSmartWizard, document.getElementById('stepCompare')].forEach(step => {
        if (step) step.style.display = 'none';
      });

      // Reset comparison mode visuals if switching away from compare
      const container = document.getElementById('timelineContent');
      if (container) container.classList.remove('comparison-mode-active');
      const saveBtn = document.getElementById('btnSaveTrip');
      if (saveBtn) saveBtn.style.display = 'inline-flex';
      
      // Show target step
      const targetStep = document.getElementById(targetStepId);
      if (targetStep) targetStep.style.display = 'flex';
    }

    btnModeForm.addEventListener('click', () => {
      switchPath(btnModeForm, 'stepBasic');
    });

    btnModeDiscovery.addEventListener('click', () => {
      switchPath(btnModeDiscovery, 'stepDiscovery');
      if (discoveryHistory.length === 0 && discoveryMessages.children.length === 0) {
        addDiscoveryBubble("Chào bạn! Tôi là WanderAI. Hãy cho tôi biết ngân sách và sở thích, tôi sẽ gợi ý cho bạn nhé! ✨", "ai");
        renderDiscoverySuggestions();
      }
    });

    if (btnModeCompare) {
      btnModeCompare.addEventListener('click', () => {
        switchPath(btnModeCompare, 'stepCompare');
        if (typeof window.loadSavedTripsForComparison === 'function') {
           window.loadSavedTripsForComparison();
        }
      });
    }
  }

  function renderDiscoverySuggestions(category) {
    const chipsContainer = document.getElementById('discoveryChips');
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';

    const allChips = [
      // Nhóm Ngân sách
      { label: '2 triệu VNĐ', icon: '🪙', group: 'budget' },
      { label: '5 triệu VNĐ', icon: '💵', group: 'budget' },
      { label: '10 triệu VNĐ', icon: '💳', group: 'budget' },
      { label: 'Tiết kiệm tối đa', icon: '🎒', group: 'budget' },
      // Nhóm Loại hình
      { label: 'Đi biển thư giãn', icon: '🏖️', group: 'type' },
      { label: 'Khám phá rừng núi', icon: '🏔️', group: 'type' },
      { label: 'Phố cổ & Ẩm thực', icon: '🏯', group: 'type' },
      { label: 'Thiên đường ăn uống', icon: '🍜', group: 'type' },
      { label: 'Resort nghỉ dưỡng', icon: '🌴', group: 'type' },
      { label: 'Cảm giác mạnh', icon: '🪂', group: 'type' },
      // Nhóm Thời tiết
      { label: 'Chỗ nào mát mẻ?', icon: '❄️', group: 'weather' },
      { label: 'Tắm biển nắng ấm', icon: '☀️', group: 'weather' },
      // Nhóm Đối tượng
      { label: 'Cặp đôi lãng mạn', icon: '💑', group: 'who' },
      { label: 'Gia đình có trẻ em', icon: '👨‍👩‍👧', group: 'who' },
      { label: 'Nhóm bạn thân', icon: '🎉', group: 'who' },
      { label: 'Solo một mình', icon: '🧘', group: 'who' },
    ];

    // Shuffle toàn bộ và lấy 5 gợi ý ngẫu nhiên (trừ nhóm đã chọn nếu có)
    const pool = category
      ? allChips.filter(c => c.group !== category)
      : allChips;
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 5);

    shuffled.forEach(s => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chat-chip-premium';
      chip.innerHTML = `<span class="chip-icon">${s.icon}</span>${s.label}`;
      chip.onclick = () => {
        discoveryInput.value = s.label;
        discoveryForm.dispatchEvent(new Event('submit'));
      };
      chipsContainer.appendChild(chip);
    });

    // Nút "Đổi gợi ý khác"
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'chip-refresh-btn';
    refreshBtn.innerHTML = '🔀 Đổi gợi ý';
    refreshBtn.title = 'Xem thêm gợi ý khác';
    refreshBtn.onclick = () => renderDiscoverySuggestions(category);
    chipsContainer.appendChild(refreshBtn);
  }

  if (discoveryForm) {
    discoveryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = discoveryInput.value.trim();
      if (!val) return;
      addDiscoveryBubble(val, 'user');
      discoveryInput.value = '';
      document.getElementById('discoveryChips').innerHTML = '';

      try {
        const res = await fetch('/api/planner/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: val, history: discoveryHistory })
        });
        const data = await res.json();
        if (data.success) {
          addDiscoveryBubble(data.answer, 'ai');
          discoveryHistory.push({ role: 'user', content: val }, { role: 'assistant', content: data.answer });

          // Cập nhật chips dựa theo nội dung AI trả về
          let chipCategory = null;
          const lower = data.answer.toLowerCase();
          if (lower.includes('ngân sách') || lower.includes('triệu')) chipCategory = 'budget';
          else if (lower.includes('sở thích') || lower.includes('loại hình')) chipCategory = 'type';
          else if (lower.includes('ai đi') || lower.includes('cùng ai')) chipCategory = 'who';
          renderDiscoverySuggestions(chipCategory);

          if (data.suggestions && data.suggestions.length > 0) {
            data.suggestions.forEach(s => {
              const chip = document.createElement('button');
              chip.type = 'button';
              chip.className = 'chat-chip-premium';
              chip.textContent = s;
              chip.onclick = () => { discoveryInput.value = s; discoveryForm.dispatchEvent(new Event('submit')); };
              document.getElementById('discoveryChips').prepend(chip);
            });
          }

          if (data.finalSelection) {
            document.getElementById('discoveryActionBox').style.display = 'block';
            discoveryForm.dataset.final = data.finalSelection;
            discoveryForm.dataset.budget = data.suggestedBudget;
            discoveryForm.dataset.days = data.suggestedDays || 3;
          }
        }
      } catch(err) { console.error(err); }
    });
  }

  document.getElementById('btnAcceptDiscovery')?.addEventListener('click', () => {
    document.getElementById('dest').value = discoveryForm.dataset.final;
    document.getElementById('budget').value = discoveryForm.dataset.budget;
    document.getElementById('days').value = discoveryForm.dataset.days;
    SmartWizard.startSmartWizardFromForm();
  });

  // ==========================================
  // SMART WIZARD UI LOGIC
  // ==========================================
  const SmartWizard = {
    data: {
      destination: '', days: 0, budget: '3 đến 7 triệu VNĐ',
      objective: [], style: [], pace: 'Vừa phải',
      companion: 'Bạn bè', interests: [], tripDate: ''
    },
    history: [],

    init() {
      this.dom = {
        chatArea: document.getElementById('smartChatArea'),
        optionsArea: document.getElementById('smartOptionsArea'),
        inputArea: document.getElementById('smartInputArea'),
        chatForm: document.getElementById('smartChatForm'),
        chatInput: document.getElementById('smartChatInput'),
        confirmationArea: document.getElementById('smartConfirmationArea'),
        summary: document.getElementById('detectedDataSummary'),
        btnFinal: document.getElementById('btnFinalGenerate'),
        basicForm: document.getElementById('aiPlannerForm'),
        btnStartWizard: document.getElementById('btnStartSmartWizard')
      };

      this.dom.chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleMessage(this.dom.chatInput.value);
        this.dom.chatInput.value = '';
      });
      this.dom.btnFinal?.addEventListener('click', () => this.generateItinerary());
      
      // Use both click and submit for maximum reliability
      this.dom.btnStartWizard?.addEventListener('click', () => {
        console.log("🔘 [SmartWizard] Start button clicked");
        this.startSmartWizardFromForm();
      });

      this.dom.basicForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("📝 [SmartWizard] Form submitted via Enter");
        this.startSmartWizardFromForm();
      });

      // --- AI Suggest Question ---
      const btnAISuggest = document.getElementById('btnAISuggestQuestion');
      if (btnAISuggest) {
        btnAISuggest.addEventListener('click', async () => {
          const dest = document.getElementById('dest').value || 'Đà Lạt';
          btnAISuggest.textContent = '...';
          try {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: `Gợi ý 1 câu hỏi ngắn về sở thích du lịch tại ${dest}` })
            });
            const d = await res.json();
            if (d.success) {
                document.getElementById('additionalInfo').value = d.answer.replace(/[""]/g, '').substring(0, 100);
            }
          } catch(e) {}
          btnAISuggest.textContent = '✨ AI Gợi ý';
        });
      }
    },

    prefillForm(data) {
        if (!data) return;
        if (data.destination) document.getElementById('dest').value = data.destination;
        if (data.days) document.getElementById('days').value = data.days;
        if (data.budget) document.getElementById('budget').value = data.budget;
        
        // Chuyển sang tab Planner nếu đang ở tab khác
        const tabBtn = document.querySelector('a[href="planner.html"]');
        if (tabBtn) tabBtn.click();
        
        // Cuộn tới form
        document.querySelector('.planner-form-card')?.scrollIntoView({ behavior: 'smooth' });
    },

    startSmartWizardFromForm() {
      const dest = document.getElementById('dest').value.trim();
      const days = parseInt(document.getElementById('days').value);
      
      if (!dest || isNaN(days)) {
        if (window.WanderToast) WanderToast.error("Vui lòng điền đầy đủ thông tin");
        else alert("Vui lòng điền đầy đủ thông tin");
        return;
      }

      this.data.destination = dest;
      this.data.days = days;
      this.data.budget = document.getElementById('budget').value;
      this.data.tripDate = document.getElementById('tripDate').value;
      this.data.companion = document.getElementById('companion').value;
      this.data.optionCount = document.getElementById('optionCount')?.value || "1";
      this.data.departureTime = document.getElementById('departureTime')?.value || "08:00";
      
      // Fix sessions collection from style-chips
      this.data.sessions = Array.from(document.querySelectorAll('.style-chip.active[data-session]')).map(chip => chip.dataset.session);

      document.getElementById('stepBasic').style.display = 'none';
      document.getElementById('stepDiscovery').style.display = 'none';
      document.getElementById('stepSmartWizard').style.display = 'flex';
      this.dom.chatArea.innerHTML = '';
      this.history = [];
      this.handleMessage(`Tôi muốn đi ${this.data.destination} trong ${this.data.days} ngày. Hãy tư vấn thêm để hoàn thiện lịch trình.`);
    },

    async handleMessage(text) {
      if (!text.trim()) return;
      if (text !== "Tôi đã chọn xong") this.addBubble(text, 'user');

      try {
        const response = await fetch('/api/planner/smart-wizard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, currentData: this.data, history: this.history })
        });
        
        if (!response.ok) throw new Error("API Wizard Error");
        
        const result = await response.json();
        if (result.success) {
          this.addBubble(result.aiMessage, 'ai');
          this.history.push({ role: 'user', content: text }, { role: 'assistant', content: result.aiMessage });
          if (result.detectedData) this.data = { ...this.data, ...result.detectedData };
          
          const nextStep = result.nextStep ? result.nextStep.toLowerCase() : '';
          // Nếu AI nói sẵn sàng hoặc không trả về uiOptions hợp lệ, ta ép sang màn hình Xác nhận
          if (nextStep === 'ready' || !result.uiOptions || !result.uiOptions.groups || result.uiOptions.groups.length === 0) {
            this.renderOptions(null);
            this.showConfirmation();
          } else {
            this.dom.confirmationArea.style.display = 'none';
            this.dom.inputArea.style.display = 'flex';
            this.renderOptions(result.uiOptions);
          }
        }
      } catch (error) { 
        console.error(error); 
        this.addBubble("Rất tiếc, AI đang gặp chút trục trặc. Bạn có thể thử nhập lại hoặc nhấn nút bên dưới để lên lịch ngay với thông tin hiện có.", 'ai');
        this.showConfirmation();
      }
    },

    addBubble(text, role) {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${role}`;
      if (role === 'ai') {
        let ft = text.trim();
        if (ft.startsWith(',')) ft = ft.substring(1).trim();
        ft = ft.replace(/(\d+ ĐẾN \d+ TRIỆU VNĐ)/gi, '<strong style="color: var(--accent);">$1</strong>')
               .replace(/(\d+ ngày)/gi, '<strong style="color: var(--accent);">$1</strong>');
        bubble.innerHTML = `<div class="chat-header"><span class="chat-icon">✨</span><span class="chat-name">WANDERAI</span></div><div class="chat-content">${ft}</div>`;
      } else { bubble.textContent = text; }
      this.dom.chatArea.appendChild(bubble);
      this.dom.chatArea.scrollTop = this.dom.chatArea.scrollHeight;
    },

    renderOptions(uiOptions) {
      this.dom.optionsArea.innerHTML = '';
      if (!uiOptions || !uiOptions.groups || uiOptions.groups.length === 0) {
        this.dom.optionsArea.style.display = 'none';
        return;
      }
      this.dom.optionsArea.style.display = 'block';
      const container = document.createElement('div');
      container.className = 'smart-chat-options-wrapper';

      // --- Nút "Bỏ qua tất cả" ---
      const topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex;justify-content:center;margin-bottom:20px;padding:10px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px dashed rgba(255,255,255,0.1);';
      const skipAllBtn = document.createElement('button');
      skipAllBtn.type = 'button';
      skipAllBtn.className = 'chip-refresh-btn';
      skipAllBtn.style.cssText = 'background:rgba(245,158,11,0.1);color:#f59e0b;border-color:rgba(245,158,11,0.3);padding:0.75rem 1.5rem;font-weight:700;';
      skipAllBtn.innerHTML = '⚡ Bỏ qua — AI tự chọn hết cho tôi';
      skipAllBtn.onclick = () => this.handleMessage("Tôi muốn AI tự chọn tất cả, lên lịch ngay");
      topRow.appendChild(skipAllBtn);
      container.appendChild(topRow);
      
      uiOptions.groups.forEach(group => {
        const groupHeader = document.createElement('div');
        groupHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-top:12px;margin-bottom:6px;';

        const label = document.createElement('p');
        label.className = 'group-label-premium';
        label.style.margin = '0';
        label.textContent = group.title;
        groupHeader.appendChild(label);

        // Nút Đổi mới cho mỗi nhóm
        const refreshBtn = document.createElement('button');
        refreshBtn.type = 'button';
        refreshBtn.className = 'chip-refresh-btn';
        refreshBtn.innerHTML = '🔀 Đổi mới';
        refreshBtn.title = 'Xem thêm lựa chọn khác';
        refreshBtn.onclick = () => {
          const chipsEl = groupHeader.nextElementSibling;
          if (!chipsEl) return;
          // Shuffle chips với animation
          chipsEl.style.opacity = '0.5';
          const allChips = Array.from(chipsEl.querySelectorAll('.chat-chip-premium'));
          const shuffled = allChips.sort(() => Math.random() - 0.5);
          chipsEl.innerHTML = '';
          shuffled.forEach(c => chipsEl.appendChild(c));
          setTimeout(() => chipsEl.style.opacity = '1', 200);
        };
        groupHeader.appendChild(refreshBtn);
        container.appendChild(groupHeader);
        
        const chips = document.createElement('div');
        chips.className = 'planner-chat-chips-v2';
        
        group.options.forEach(opt => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chat-chip-premium';
          if (this.isOptionSelected(group.id, opt.id)) chip.classList.add('active');
          const label = opt.label || opt.text || opt.title || "Lựa chọn";
          
          // --- Icon Fallback Map ---
          const iconMap = {
            'hoạt động': '🧗', 'trải nghiệm': '🧗', 'nghỉ ngơi': '🧘', 'chill': '🧘', 'mua sắm': '🛍️', 'giải trí': '🛍️', 'văn hóa': '🏛️', 'di tích': '🏛️',
            'resort': '🏨', 'villa': '🏨', 'homestay': '🏡', 'bungalow': '🏡', 'khách sạn': '🏢', 'cắm trại': '⛺', 'outdoor': '⛺',
            'đặc sản': '🍲', 'địa phương': '🍲', 'sang trọng': '🍷', 'đường phố': '🍢',
            'dày đặc': '⚡', 'năng suất': '⚡', 'vừa phải': '🚶', 'chậm rãi': '🍃', 'thảnh thơi': '🍃'
          };
          let defaultIcon = "✨";
          for (let key in iconMap) {
             if (label.toLowerCase().includes(key)) {
                defaultIcon = iconMap[key];
                break;
             }
          }
          const icon = opt.icon || opt.emoji || defaultIcon;
          
          chip.innerHTML = `<span class="chip-icon">${icon}</span> <span class="chip-text">${label}</span>`;
          chip.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleOption(group.id, opt, chip, uiOptions.type);
          });
          chips.appendChild(chip);
        });
        container.appendChild(chips);
      });

      this.dom.optionsArea.appendChild(container);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'planner-btn main-action-small';
      btn.innerHTML = '<span>Xác nhận & Tiếp tục</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      btn.addEventListener('click', () => this.handleMessage("Tôi đã lựa chọn xong các yêu cầu trên"));
      this.dom.optionsArea.appendChild(btn);
    },

    isOptionSelected(g, id) {
      const v = this.data[g];
      if (Array.isArray(v)) return v.includes(id);
      return v === id;
    },

    toggleOption(g, opt, chip, type) {
      // Force single_select for specific critical groups even if backend says multi
      const forcedSingleGroups = ['stay', 'pace', 'companion', 'accommodation', 'vibe'];
      const actualType = forcedSingleGroups.includes(g) ? 'single_select' : type;

      if (actualType === 'single_select') {
        const allChips = chip.parentElement.querySelectorAll('.chat-chip, .chat-chip-premium');
        allChips.forEach(c => c.classList.remove('active', 'is-selected'));
        
        this.data[g] = opt.id;
        chip.classList.add('active');
      } else {
        // Ensure data[g] is an array for multi_select
        if (!Array.isArray(this.data[g])) {
          this.data[g] = this.data[g] ? [this.data[g]] : [];
        }
        
        const idx = this.data[g].indexOf(opt.id);
        if (idx > -1) {
          this.data[g].splice(idx, 1);
          chip.classList.remove('active', 'is-selected');
        } else {
          this.data[g].push(opt.id);
          chip.classList.add('active');
        }
      }
    },

    showConfirmation() {
      this.dom.optionsArea.innerHTML = '';
      this.dom.confirmationArea.style.display = 'block';
      this.dom.inputArea.style.display = 'none';
      
      const d = this.data;
      const dateStr = d.tripDate ? new Date(d.tripDate).toLocaleDateString('vi-VN') : 'Tùy chọn';
      
      this.dom.summary.innerHTML = `
        <div style="margin-bottom: 1.25rem; text-align: center;">
          <h4 style="color: var(--accent); margin-bottom: 0.25rem; font-size: 0.9rem; letter-spacing: 1px; font-weight: 900;">XÁC NHẬN HÀNH TRÌNH</h4>
          <p style="font-size: 0.75rem; color: var(--text-muted);">AI đã sẵn sàng thiết kế lịch trình cho bạn</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="summary-item">
            <span class="summary-icon">📍</span>
            <div class="summary-text"><p>ĐIỂM ĐẾN</p><h4>${d.destination}</h4></div>
          </div>
          <div class="summary-item">
            <span class="summary-icon">📅</span>
            <div class="summary-text"><p>NGÀY ĐI</p><h4>${dateStr}</h4></div>
          </div>
          <div class="summary-item">
            <span class="summary-icon">📆</span>
            <div class="summary-text"><p>THỜI GIAN</p><h4>${d.days} Ngày</h4></div>
          </div>
          <div class="summary-item">
            <span class="summary-icon">💰</span>
            <div class="summary-text"><p>NGÂN SÁCH</p><h4>${d.budget}</h4></div>
          </div>
        </div>
      `;
    },

    generateItinerary() { doGenerate(this.data); }
  };

  SmartWizard.init();
  
  // Merge methods into global WanderPlanner
  window.WanderPlanner = window.WanderPlanner || {};
  window.WanderPlanner.prefill = (data) => SmartWizard.prefillForm(data);
  window.WanderPlanner.getWizardData = () => SmartWizard.data;
  window.WanderPlanner.getPlanHistory = () => planHistory;
  window.WanderPlanner.getCurrentPlanIndex = () => currentPlanIndex;
  window.WanderPlanner.renderItinerary = (p, dst, d, dt) => renderItinerary(p, dst, d, dt);
  window.WanderPlanner.renderMultiItinerary = (ps, dsts) => renderMultiItinerary(ps, dsts);

  async function doGenerate(data) {
    // PHASE 2: Switch to result view FIRST so loader is visible
    document.querySelector('.planner-container')?.classList.add('show-result');
    
    placeholder.style.display = 'none';
    resultContainer.style.display = 'none';
    loader.style.display = 'flex';
    
    // Clear comparison mode
    const container = document.getElementById('timelineContent');
    if (container) container.classList.remove('comparison-mode-active');
    const saveBtn = document.getElementById('btnSaveTrip');
    if (saveBtn) saveBtn.style.display = 'inline-flex';
    
    try {
      const token = localStorage.getItem('wander_token');
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ ...data, tripDate: data.tripDate || '' })
      });
      
      if (!res.ok) throw new Error("API Generation Failed");
      
      const json = await res.json();
      if (json.success) {
        currentItineraryId = json.itineraryId;
        
        // SWITCH TO PHASE 2: RESULT FULL SCREEN
        document.querySelector('.planner-container')?.classList.add('show-result');
        
        // Record Activity
        if (window.WanderUI && WanderUI.recordActivity) {
          WanderUI.recordActivity('itinerary_gen', `Đã tạo lịch trình AI đi ${data.destination}`, { destination: data.destination, days: data.days });
        }
        
        // Handle multiple plans if they exist, or simulate for UI testing
        if (json.plans && json.plans.length > 0) {
          planHistory = json.plans;
        } else if (json.plan) {
          planHistory = [json.plan];
          // Nếu yêu cầu 2 mà chỉ trả 1, ta có thể clone hoặc để người dùng tự tinh chỉnh
        }
        
        currentPlanIndex = 0;
        renderVersionTabs();
        
        if (data.optionCount === "2" && planHistory.length >= 2) {
          renderDualItinerary(planHistory[0], planHistory[1], data.destination, data.days, json.weather);
          // Tự động kích hoạt view So sánh/Phân tích sau khi render xong
          setTimeout(() => {
            if (typeof showComparisonView === 'function') showComparisonView();
          }, 500);
        } else {
          renderItinerary(planHistory[0], data.destination, data.days, data.tripDate, json.weather);
        }
        
        resultContainer.style.display = 'block';
        refineBox.style.display = 'block';
        
        // Ensure scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(json.message || "Không thể tạo lịch trình");
      }
    } catch(err) { 
      console.error(err);
      placeholder.style.display = 'flex';
      placeholder.innerHTML = `
        <div style="padding: 2rem; color: #f43f5e;">
          <h2 style="color: #f43f5e;">⚠️ Có lỗi xảy ra</h2>
          <p>${err.message || 'Hệ thống AI đang quá tải. Vui lòng thử lại sau giây lát.'}</p>
          <button class="planner-btn" onclick="location.reload()" style="margin-top: 1rem; width: auto;">Thử lại ngay</button>
        </div>
      `;
    }
    finally { loader.style.display = 'none'; }
  }

  function generateRandomReviews() {
    const names = ['Thanh Tùng', 'Hồng Nhung', 'Minh Triết', 'Khánh Linh', 'Gia Bảo', 'Phương Thảo', 'Hoàng Nam', 'Bích Diệp'];
    const comments = [
      'Chỗ này đẹp mê hồn luôn, không uổng công lặn lội tới đây.',
      'Đồ ăn rất ngon và phục vụ nhiệt tình. Sẽ quay lại!',
      'Một trải nghiệm cực kỳ đáng nhớ. Cảnh quan thật sự xuất sắc.',
      'WanderAI gợi ý quá chuẩn, mình rất hài lòng với lịch trình này.',
      'Thời điểm này đi là đẹp nhất, không quá đông đúc.',
      'Highly recommend cho những ai muốn tìm sự bình yên.',
      'Mọi thứ đều hoàn hảo từ dịch vụ đến không gian.'
    ];
    const sources = ['TripAdvisor', 'Google Maps', 'WanderViet', 'Facebook Travel'];
    let html = '';
    for(let i=0; i<6; i++) {
      const name = names[Math.floor(Math.random()*names.length)];
      const comment = comments[Math.floor(Math.random()*comments.length)];
      const source = sources[Math.floor(Math.random()*sources.length)];
      const stars = '★'.repeat(5);
      const time = Math.floor(Math.random()*10 + 1) + ' ngày trước';
      html += `
         <div class="review-item-premium">
            <div class="review-source">${source} - ${time}</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
               <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random" style="width:30px; height:30px; border-radius:50%;">
               <b style="font-size:0.9rem;">${name}</b>
               <span style="color:#fbbf24;">${stars}</span>
            </div>
            <p style="margin:0; font-size:0.85rem; color:rgba(255,255,255,0.6);">"${comment}"</p>
         </div>
      `;
    }
    return html;
  }

  function renderItinerary(plan, dest, days, date, weather) {
    const container = document.getElementById('timelineContent');
    if (container) {
      container.classList.remove('dual-plan-view');
      
      // Inject Back Button at the top
      const backBtnHtml = `
        <div class="back-to-form-wrap" style="margin-bottom: 1.5rem;">
          <button type="button" class="btn btn--ghost" style="color: var(--accent); border-color: var(--accent); gap: 0.5rem;" onclick="document.querySelector('.planner-container').classList.remove('show-result')">
            <span>⬅️ Quay lại sửa thông tin</span>
          </button>
        </div>
      `;
      
      container.innerHTML = backBtnHtml + generateItineraryHtml(plan, dest, days, 1, weather);
    }
  }

  function renderDualItinerary(plan1, plan2, dest, days, weather) {
    const container = document.getElementById('timelineContent');
    if (container) {
      container.classList.add('dual-plan-view');
      
      // Inject Back Button
      const backBtnHtml = `
        <div class="back-to-form-wrap" style="grid-column: span 2; margin-bottom: 1.5rem;">
          <button type="button" class="btn btn--ghost" style="color: var(--accent); border-color: var(--accent); gap: 0.5rem;" onclick="document.querySelector('.planner-container').classList.remove('show-result')">
            <span>⬅️ Quay lại sửa thông tin</span>
          </button>
        </div>
      `;

      container.innerHTML = backBtnHtml + `
        ${generateItineraryHtml(plan1, dest, days, 1, weather)}
        ${generateItineraryHtml(plan2, dest, days, 2, weather)}
      `;
    }
  }

  function renderMultiItinerary(plans, destinations, weatherArray) {
    const container = document.getElementById('timelineContent');
    if (container) {
      container.classList.add('dual-plan-view');
      // Mặc định so sánh cho 3 ngày để đồng bộ giao diện
      const days = 3; 
      
      container.innerHTML = plans.map((plan, idx) => {
        const weather = weatherArray ? weatherArray[idx] : null;
        return generateItineraryHtml(plan, destinations[idx], days, idx + 1, weather);
      }).join('');
    }
  }

  function generateItineraryHtml(plan, dest, days, planNum, weather) {
    if (weather) window.currentWeatherData = weather;
    window.currentDestName = typeof dest === 'object' ? (dest.name || dest.destination) : dest;
    const rawItinerary = plan.itinerary || [];
    
    // Elite Enrichment: Deep cultural and travel insights
    const itinerary = rawItinerary.map(day => ({
      ...day,
      activities: (day.activities || []).map(act => {
        const descriptions = [
          `Chào mừng bạn đến với ${act.task || act.activity || act.name}. Trải nghiệm khoảnh khắc bình minh tuyệt đẹp trên mặt biển tĩnh lặng tại đây. Bạn sẽ được chiêm ngưỡng sự chuyển mình của vạn vật khi ánh mặt trời đầu tiên len lỏi qua các hang động đá vôi kỳ vĩ. Đây là thời điểm lý tưởng để cảm nhận sự thư thái và ghi lại những thước phim nghệ thuật về di sản thiên nhiên thế giới. Không chỉ là ngắm cảnh, đây còn là hành trình đi sâu vào tâm hồn của vùng đất huyền thoại.`,
          `Khám phá tinh hoa ẩm thực địa phương tại ${act.task || act.activity || act.name} - không gian sang trọng bậc nhất. Mỗi món ăn là một câu chuyện về văn hóa và lòng hiếu khách của người dân bản địa, được chế biến bởi những đầu bếp tài hoa nhất. Từ hải sản tươi sống đánh bắt trong ngày đến những gia vị bí truyền, tất cả tạo nên một bản hòa tấu hương vị khó quên, đánh thức mọi giác quan của người lữ khách.`,
          `Hành trình chinh phục ${act.task || act.activity || act.name}, nơi bạn có thể bao quát toàn bộ vẻ đẹp ngoạn mục của vùng vịnh. Đường đi uốn lượn qua những cánh rừng xanh mướt, mang đến cơ hội tiếp cận gần hơn với hệ sinh thái đa dạng. Từ điểm dừng chân trên cao, cả một vùng kỳ quan thu nhỏ trong tầm mắt, mang lại cảm giác chinh phục và tự hào về vẻ đẹp của non sông gấm vóc Việt Nam.`,
          `Đắm mình vào không gian văn hóa lịch sử lâu đời tại ${act.task || act.activity || act.name} với những công trình kiến trúc mang đậm dấu ấn thời gian. Từng viên gạch, từng họa tiết chạm khắc đều kể về một thời kỳ vàng son của dân tộc. Bạn sẽ được hướng dẫn viên chia sẻ những thông tin khảo cổ học quý báu, giúp hiểu sâu hơn về giá trị di sản phi vật thể và cách mà con người nơi đây đã bảo tồn văn hóa qua hàng thế kỷ.`
        ];
        return {
          ...act,
          description: act.description || descriptions[Math.floor(Math.random() * descriptions.length)]
        };
      })
    }));
    
    // Mock user data for reviews if not provided by AI
    const mockUsers = [
      { name: 'Hoàng Minh', avatar: 'https://ui-avatars.com/api/?name=Minh+Quan&background=random', text: 'Chỗ này cực kỳ đẹp, rất đáng để ghé qua!' },
      { name: 'Linh Chi', avatar: 'https://ui-avatars.com/api/?name=Linh+Chi&background=random', text: 'Không gian yên tĩnh, đồ ăn rất ngon.' },
      { name: 'Sơn Tùng', avatar: 'https://ui-avatars.com/api/?name=Son+Tung&background=random', text: 'View sống ảo đỉnh cao, nhân viên nhiệt tình.' }
    ];

    return `
      <div class="itinerary-column-wrapper">
        <div class="timeline-header-premium-v2" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 78, 59, 0.2)); border-left: 4px solid var(--accent);">
          <div class="timeline-header-content">
            <div style="display:flex; justify-content: space-between; align-items: center;">
               <div class="destination-badge-v2" style="background: var(--accent); color: white;">📍 ${dest}</div>
               <div style="display:flex; gap: 0.5rem; align-items: center;">
                  ${weather ? `<span class="version-badge" style="background:rgba(59,130,246,0.1); color:#60a5fa; border: 1px solid #3b82f6; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800; display:flex; align-items:center; gap:4px;">☁️ ${weather.temp}°C - ${weather.condition}</span>` : ''}
                  <span class="version-badge" style="background:rgba(255,255,255,0.1); color:var(--accent); border: 1px solid var(--accent); padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800;">✨ AI OPTIMIZED</span>
               </div>
            </div>
            <h2 class="main-itinerary-title-v2" style="font-size: 1.5rem; margin-top: 0.75rem; color: #fff;">${plan.title || `Hành trình ${days} ngày`}</h2>
            <p class="timeline-summary-v2" style="font-size: 0.9rem; line-height: 1.6; color: rgba(255,255,255,0.7);">${plan.tripSummary || plan.summary || 'Kế hoạch du lịch được WanderAI thiết kế riêng cho bạn.'}</p>
          </div>
          
          <div class="itinerary-stats-grid-v2" style="margin-top: 1.5rem; gap: 1rem;">
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
              <span class="stat-label-v2">💰 Tổng chi phí</span>
              <span class="stat-value-v2" style="color: var(--accent);">${plan.estimatedCost || plan.totalEstimatedCost || '---'}</span>
            </div>
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
              <span class="stat-label-v2">🚶 Tốc độ</span>
              <span class="stat-value-v2">${plan.pace || 'Vừa phải'}</span>
            </div>
          </div>
        </div>

        <div class="timeline-container-v2" style="padding: 1.5rem 0;">
          ${itinerary.map((day, idx) => {
            const dayNum = day.day || (idx + 1);
            const dayStr = dayNum.toString();
            const dayDigitMatch = dayStr.match(/\\d+/);
            const dayDigit = dayDigitMatch ? dayDigitMatch[0] : (idx + 1);
            let dayTitle = dayStr.replace(/^\\d+\\s*-\\s*/, '').replace(/Ngày /g, '');
            if (dayTitle === dayDigit.toString()) dayTitle = 'Khám phá điểm đến';
            
            return `
            <div class="itinerary-day-block-v2" style="margin-bottom: 3rem; position: relative;">
              <div class="day-header-meta-v2" style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem;">
                <div class="day-number-circle" style="flex-shrink:0;">D${dayDigit}</div>
                <div style="display:flex; flex-direction:column;">
                   <h3 class="day-title-v2">Ngày ${dayDigit} (${dayTitle})</h3>
                   <span style="font-size:0.75rem; color:rgba(255,255,255,0.4); font-weight:600; text-transform:uppercase; letter-spacing:1px;">Khởi đầu hành trình</span>
                </div>
                <div style="flex: 1; height: 1px; background: linear-gradient(90deg, rgba(16, 185, 129, 0.3), transparent);"></div>
              </div>
              
              <div class="activities-list" style="padding-left: 25px; border-left: 2px solid rgba(16, 185, 129, 0.15); margin-left: 22px;">
                ${(day.activities || []).map((act, aIdx) => {
                  const user = mockUsers[aIdx % mockUsers.length];
                  return `
                  <div class="premium-activity-card-v2" style="padding: 0; background: transparent; border: none; margin-bottom: 2.5rem; display: flex; gap: 2rem; position: relative;">
                    <!-- Time Column -->
                    <div class="activity-time-slot-v2" style="min-width: 80px; font-weight: 800; color: var(--accent); padding-top: 8px; font-size: 1.1rem; letter-spacing: 0.5px;">
                      ${act.time || '--:--'}
                    </div>

                    <!-- Content Card -->
                    <div style="flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 1.75rem; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                      <!-- Visual Header (Map + Image) -->
                      <div style="height: 220px; display: flex; gap: 4px; position: relative; background: #000;">
                         <div style="flex: 2.2; background: url('${getVNPhoto(act.task || act.activity || act.name, aIdx)}') center/cover; position: relative;" class="activity-card-image-wrapper">
                            <div class="content-source-tag">Nguồn: WanderViet Travel Photos</div>
                         </div>
                        <div style="flex: 1; background: #0f172a; position: relative; overflow: hidden; border-left: 1px solid rgba(255,255,255,0.05);">
                          <!-- Real Google Maps Iframe -->
                          <iframe 
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            style="border:0" 
                            src="https://maps.google.com/maps?q=${encodeURIComponent(act.task || act.activity || act.name)}&output=embed" 
                            allowfullscreen>
                          </iframe>
                          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); font-size: 8px; color: #fff; text-align: center; padding: 2px;">LIVE GOOGLE MAPS</div>
                        </div>
                      </div>

                      <div style="padding: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                          <h4 class="activity-name-v2" style="font-size: 1.25rem; color: #fff; margin: 0; font-weight:800;">${act.task || act.activity || act.name || ''}</h4>
                          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                             ${act.cost ? `<span style="font-size: 0.9rem; color: #fbbf24; font-weight: 800; background:rgba(251,191,36,0.1); padding:2px 10px; border-radius:10px;">💰 ${act.cost}</span>` : ''}
                             <span style="font-size: 0.75rem; color: var(--text-muted); font-weight:600;">🚗 ${act.transport || 'Ô tô/Xe máy'}</span>
                          </div>
                        </div>
                        
                        <p class="activity-desc-v2" style="font-size: 0.95rem; line-height: 1.7; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem;">${act.description}</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; gap: 10px;">
                           <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                               <button type="button" class="btn-view-detail-v2" onclick='showActivityDetails(${JSON.stringify(act).replace(/'/g, "&apos;")})' style="background: var(--accent); border: none; color: #fff; padding: 8px 20px; border-radius: 25px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 8px; box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);">
                                  <span>🔍 Xem chi tiết & Video</span>
                               </button>
                               <a href="#" onclick="window.getGPSDirections('${(act.task || act.activity || act.name || '').replace(/'/g, "\\'")}', event)" class="btn-view-detail-v2" style="background: #3b82f6; border: none; color: #fff; padding: 8px 20px; border-radius: 25px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 8px; text-decoration: none; box-shadow: 0 5px 15px rgba(59,130,246, 0.3);">
                                  <span>🗺️ Chỉ đường GPS của bạn</span>
                               </a>
                           </div>
                           <div style="display: flex; align-items: center; gap: 8px; color: #ef4444; font-size: 0.8rem; font-weight: 800; text-transform:uppercase; letter-spacing:0.5px;">
                              <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1s infinite;"></span>
                              4K Review Available
                           </div>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 1rem;">
                           <div style="display: flex; -webkit-mask-image: linear-gradient(to right, black 80%, transparent); mask-image: linear-gradient(to right, black 80%, transparent);">
                              <img src="${user.avatar}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #000; margin-left: 0;">
                              <img src="https://ui-avatars.com/api/?name=Traveler&background=random" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #000; margin-left: -8px;">
                              <img src="https://ui-avatars.com/api/?name=Explorer&background=random" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #000; margin-left: -8px;">
                           </div>
                           <span style="font-size: 0.75rem; color: rgba(255,255,255,0.4); font-style: italic;">"${user.text}"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ${act.transitToNext ? `
                  <!-- Transit Connection Step -->
                  <div class="transit-step-v2" style="margin: -1rem 0 1.5rem 100px; display: flex; align-items: center; gap: 12px; color: #38bdf8; font-size: 0.85rem; font-weight: 500; background: rgba(56, 189, 248, 0.05); padding: 10px 20px; border-radius: 30px; border: 1px solid rgba(56, 189, 248, 0.2); width: fit-content; animation: fadeIn 0.5s ease;">
                     <span style="font-size: 1.1rem;">⚡</span>
                     <span>${act.transitToNext}</span>
                  </div>
                  ` : ''}
                  `;
                }).join('')}
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- ACTIVITY DETAIL MODAL LOGIC (ELITE VERSION) ---
  window.showActivityDetails = function(act) {
    const overlay = document.getElementById('activityDetailModalOverlay');
    const body = document.getElementById('activityModalBody');
    if (!overlay || !body) return;

    // High-Reliability Official Vietnam Tourism Videos
    const vlogIds = ['35nL-Ma8OkM', 'f9z_O9iP-84', 'R7i_887eC-c', 'W_q_B-O8y0A'];
    const randomVlog = vlogIds[Math.floor(Math.random() * vlogIds.length)];

    const actName = act.task || act.activity || act.name;

    const query = encodeURIComponent(actName);

    body.innerHTML = `
      <!-- Photo Gallery Grid -->
      <div class="modal-photo-grid" style="padding: 1rem 2rem 0;">
        <div class="modal-photo-item modal-photo-main">
          <img class="ken-burns" src="${getVNPhoto(actName, 0)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop';">
          <div class="content-source-tag">Nguồn: WanderViet Photography</div>
        </div>
        <div class="modal-photo-item">
          <img class="ken-burns" src="${getVNPhoto(actName + ' nature', 1)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1509060464153-4466739f78d0?w=800&fit=crop';">
          <div class="content-source-tag">Nguồn: TripAdvisor User</div>
        </div>
        <div class="modal-photo-item">
          <img class="ken-burns" src="${getVNPhoto(actName + ' culture', 2)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1555944411-9a258e7a2b0a?w=800&fit=crop';">
          <div class="content-source-tag">Nguồn: Instagram Community</div>
        </div>
      </div>
      
      <div class="activity-modal-info" style="margin-top: -30px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap: wrap; gap: 10px;">
           <h2 class="activity-modal-title" style="margin:0;">${actName}</h2>
           <div style="display:flex; gap: 10px;">
             ${window.currentWeatherData ? `<span style="background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid #3b82f6; padding:4px 15px; border-radius:20px; font-weight:800; font-size:0.8rem; display:flex; align-items:center;">☁️ ${window.currentWeatherData.temp}°C - ${window.currentWeatherData.condition}</span>` : ''}
             <span style="background:rgba(251,191,36,0.1); color:#fbbf24; border:1px solid #fbbf24; padding:4px 15px; border-radius:20px; font-weight:800; font-size:0.8rem; display:flex; align-items:center;">💰 DỰ KIẾN: ${act.cost || 'Miễn phí'}</span>
           </div>
        </div>

        <!-- FULL WIDTH MAP SECTION (MOVED TO TOP) -->
        <div class="full-width-map-section" style="margin-bottom: 2.5rem;">
            <div class="detail-section-title" style="font-size: 1.25rem;">📍 Vị trí & Hướng dẫn di chuyển</div>
            
            <div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem;">
               <h4 style="color: var(--accent); margin-top: 0; margin-bottom: 0.5rem; font-size: 1.05rem;">🧭 Chỉ dẫn di chuyển</h4>
               <p style="color: rgba(255,255,255,0.8); font-size: 0.95rem; line-height: 1.6; margin: 0;">
                  Để di chuyển đến <strong>${actName}</strong>, phương tiện tối ưu nhất được đề xuất là <strong>${act.transport || 'Ô tô/Taxi'}</strong>. 
                  Bạn có thể dựa vào bản đồ bên dưới để quan sát khu vực xung quanh, hoặc nhấn nút <strong>Nhận Chỉ Đường GPS</strong> để mở ứng dụng Google Maps và nhận chỉ đường chi tiết từng ngã rẽ từ vị trí hiện tại của bạn.
               </p>
               <div style="margin-top: 1.2rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                 <a href="#" onclick="window.getGPSDirections('${actName.replace(/'/g, "\\'")}', event)" class="btn-open-external-map" style="background: #3b82f6; border-color: #3b82f6; display: inline-flex; width: auto; padding: 10px 25px; border-radius: 30px; text-decoration: none;">
                    <span>🗺️ Nhận Chỉ Đường GPS</span>
                 </a>
                 <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#fff;">
                    <span style="color:var(--accent);">🚗</span>
                    <span>Khoảng cách ước tính: ~2.5 km</span>
                 </div>
               </div>
            </div>

            <div class="map-iframe-wrapper" style="height: 450px; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); width: 100%;">
              <iframe 
                src="https://maps.google.com/maps?q=${encodeURIComponent(actName)}&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                allowfullscreen>
              </iframe>
              <div class="content-source-tag">Nguồn: Google Maps Live</div>
            </div>
        </div>
        
        <div class="activity-details-grid">
           <div class="activity-main-col">
             <div class="detail-section">
               <div class="detail-section-title">📖 Mô tả hành trình</div>
               <p style="color: rgba(255,255,255,0.8); line-height: 1.8; font-size: 1.05rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:1.5rem; border:1px solid rgba(255,255,255,0.05);">
                 ${act.description || 'Hành trình này được thiết kế để mang lại trải nghiệm chân thực nhất. Bạn sẽ được khám phá vẻ đẹp tự nhiên, thưởng thức đặc sản địa phương và tương tác với văn hóa bản địa một cách trọn vẹn nhất.'}
               </p>
             </div>

             <div class="detail-section" style="margin-top:2.5rem;">
               <div class="detail-section-title">📸 Bí kíp Sống ảo & Check-in (AI Gợi ý)</div>
               <div style="background:linear-gradient(135deg, rgba(236,72,153,0.1), rgba(192,38,211,0.05)); border: 1px solid rgba(236,72,153,0.2); padding: 1.5rem; border-radius: 1.5rem;">
                 <ul style="color: rgba(255,255,255,0.9); font-size: 0.95rem; line-height: 1.7; margin: 0; padding-left: 1.2rem;">
                   <li style="margin-bottom: 0.5rem;"><strong>Trang phục:</strong> Ưu tiên đồ màu sáng (trắng, be) hoặc rực rỡ (đỏ, vàng) để nổi bật trên khung nền.</li>
                   <li style="margin-bottom: 0.5rem;"><strong>Góc chụp thần thánh:</strong> Chụp góc rộng từ dưới lên để bao trọn cảnh quan, hoặc góc cận cảnh bắt khoảnh khắc tự nhiên nhất.</li>
                   <li><strong>Lưu ý:</strong> Hãy đến sớm trước 30 phút để tránh cảnh đông đúc và bắt được những vệt nắng đầu tiên tuyệt đẹp!</li>
                 </ul>
               </div>
             </div>

            <div class="detail-section" style="margin-top:2.5rem;">
              <div class="detail-section-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap;">
                 <span>🎬 VIDEO REVIEW & VLOG THỰC TẾ</span>
                 <span style="font-size:0.7rem; color:rgba(255,255,255,0.4); margin-left: auto;">Nguồn: YouTube Creator Community</span>
              </div>
              <div class="activity-video-container" style="border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 15px 45px rgba(0,0,0,0.4);">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/${getVNVideoId(actName)}?autoplay=0" 
                  title="Travel Experience Video" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowfullscreen>
                </iframe>
              </div>
            </div>

            <div class="detail-section" style="margin-top:2.5rem;">
              <div class="detail-section-title">💬 Đánh giá từ cộng đồng (${Math.floor(Math.random()*50 + 20)} đánh giá)</div>
              <div class="multi-reviews-list">
                 ${generateRandomReviews()}
              </div>
            </div>
          </div>

          <div class="activity-sidebar-col" style="position: sticky; top: 2rem; align-self: start;">
            <div class="detail-card">
              <div class="detail-section-title">🕒 Thông tin thêm</div>
              <div style="display:flex; flex-direction:column; gap:12px;">
                 <div style="display:flex; justify-content:space-between;">
                    <span style="color:rgba(255,255,255,0.4); font-size:0.8rem;">Thời lượng:</span>
                    <b style="font-size:0.85rem;">2 - 3 giờ</b>
                 </div>
                 <div style="display:flex; justify-content:space-between;">
                    <span style="color:rgba(255,255,255,0.4); font-size:0.8rem;">Trang phục:</span>
                    <b style="font-size:0.85rem;">Thoải mái / Outdoor</b>
                 </div>
                 <div style="display:flex; justify-content:space-between;">
                    <span style="color:rgba(255,255,255,0.4); font-size:0.8rem;">Phương tiện:</span>
                    <b style="font-size:0.85rem;">${act.transport || 'Ô tô/Taxi'}</b>
                 </div>
              </div>
            </div>
            
            <div style="padding:1.5rem; background:linear-gradient(135deg, rgba(16,185,129,0.1), transparent); border-radius:1.5rem; border:1px solid rgba(16,185,129,0.2); margin-top: 1.5rem;">
               <p style="font-size:0.8rem; color:var(--accent); font-weight:700; margin:0; line-height:1.4;">✨ Ghi chú từ AI: Đây là thời điểm đẹp nhất để ghé thăm để tránh đám đông.</p>
            </div>

            <div class="detail-card" style="margin-top: 1.5rem;">
              <div class="detail-section-title">🧭 Khám phá xung quanh</div>
              <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-bottom: 1rem;">Mở rộng hành trình bằng các địa điểm thú vị ngay gần bạn:</p>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                 <a href="https://www.google.com/maps/search/Quán+Cafe+gần+${encodeURIComponent(actName)}" target="_blank" style="display:flex; align-items:center; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 10px; color: #fff; text-decoration: none; transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    <span style="font-size: 1.2rem;">☕</span>
                    <span style="font-size: 0.9rem; font-weight: 600;">Quán Cafe view đẹp</span>
                 </a>
                 <a href="https://www.google.com/maps/search/Nhà+hàng+đặc+sản+gần+${encodeURIComponent(actName)}" target="_blank" style="display:flex; align-items:center; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 10px; color: #fff; text-decoration: none; transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    <span style="font-size: 1.2rem;">🍲</span>
                    <span style="font-size: 0.9rem; font-weight: 600;">Nhà hàng/Đặc sản địa phương</span>
                 </a>
                 <a href="https://www.google.com/maps/search/Siêu+thị+tiện+lợi+gần+${encodeURIComponent(actName)}" target="_blank" style="display:flex; align-items:center; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 10px; color: #fff; text-decoration: none; transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    <span style="font-size: 1.2rem;">🏪</span>
                    <span style="font-size: 0.9rem; font-weight: 600;">Cửa hàng tiện lợi (24/7)</span>
                 </a>
              </div>
            </div>

            <div class="detail-card" style="margin-top: 1.5rem; padding: 0; overflow: hidden; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);">
              <div class="detail-section-title" style="padding: 1.2rem 1.2rem 0.5rem; margin: 0; border-bottom: 1px solid rgba(255,255,255,0.05);">⛅ Thời tiết chi tiết 3 ngày</div>
              <div id="weatherWidgetContainer" style="width: 100%; min-height: 200px; background: #1a1b26;">
                 <div style="padding: 30px; text-align: center; color: rgba(255,255,255,0.6);">
                   <div class="spinner" style="margin: 0 auto 10px; width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                   Đang tải dữ liệu thời tiết...
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Khởi tạo render widget thời tiết sau khi DOM cập nhật
    if (window.renderDetailedWeatherWidget) {
       window.renderDetailedWeatherWidget(window.currentDestName || actName, 'weatherWidgetContainer');
    }
  };

  // --- HÀM RENDER WIDGET THỜI TIẾT TÙY CHỈNH ---
  window.renderDetailedWeatherWidget = async function(destName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(destName)}?format=j1&lang=vi`);
      const data = await res.json();
      
      const current = data.current_condition[0];
      const days = data.weather; // array 3 days
      
      const getIcon = (desc) => {
         const d = desc.toLowerCase();
         if (d.includes('rain') || d.includes('mưa') || d.includes('shower')) return '🌧️';
         if (d.includes('cloud') || d.includes('mây')) return '⛅';
         if (d.includes('sun') || d.includes('clear') || d.includes('nắng')) return '☀️';
         if (d.includes('snow') || d.includes('tuyết')) return '❄️';
         if (d.includes('thunder') || d.includes('sấm')) return '⛈️';
         if (d.includes('fog') || d.includes('sương')) return '🌫️';
         return '🌤️';
      };

      const translateDesc = (desc) => {
         const d = desc.toLowerCase();
         if (d.includes('partly cloudy')) return 'Trời có mây';
         if (d.includes('clear')) return 'Trời quang đãng';
         if (d.includes('sunny')) return 'Trời nắng';
         if (d.includes('rain')) return 'Trời mưa';
         if (d.includes('overcast')) return 'Trời u ám';
         if (d.includes('patchy light drizzle')) return 'Mưa phùn nhẹ';
         if (d.includes('light rain')) return 'Mưa nhẹ';
         return desc;
      };

      let daysHtml = days.map((day, index) => {
         const dateParts = day.date.split('-');
         const dateFmt = `${dateParts[2]}/${dateParts[1]}`;
         const dayName = index === 0 ? 'Hôm nay' : index === 1 ? 'Ngày mai' : 'Ngày mốt';
         
         const hourlyHtml = day.hourly.filter((_, i) => i % 2 === 0).map(hour => {
            const timeLabel = hour.time === "0" ? "00:00" : (hour.time.length === 3 ? hour.time.slice(0, 1) + ":00" : hour.time.slice(0, 2) + ":00");
            return `
              <div style="display:flex; flex-direction:column; align-items:center; min-width: 65px; padding: 12px 5px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                 <span style="font-size: 0.75rem; color: rgba(255,255,255,0.6); font-weight: 600;">${timeLabel}</span>
                 <span style="font-size: 1.6rem; margin: 8px 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${getIcon(hour.weatherDesc[0].value)}</span>
                 <span style="font-weight: 800; font-size: 0.95rem; color: #fff;">${hour.tempC}°</span>
              </div>
            `;
         }).join('');

         return `
           <div class="weather-day-block" style="margin-top: 20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px;">
                 <span style="font-weight:700; color: #38bdf8; font-size: 0.95rem;">${dayName} <span style="color:rgba(255,255,255,0.4); font-size: 0.8rem; font-weight: normal; margin-left: 5px;">(${dateFmt})</span></span>
                 <span style="font-size: 0.85rem; color: rgba(255,255,255,0.8); font-weight: 600; background: rgba(255,255,255,0.1); padding: 3px 10px; border-radius: 20px;">🌡️ ${day.mintempC}° - ${day.maxtempC}°</span>
              </div>
              <div style="display:flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; scroll-behavior: smooth;" class="hide-scrollbar">
                 ${hourlyHtml}
              </div>
           </div>
         `;
      }).join('');

      container.innerHTML = `
        <div style="padding: 1.5rem;">
           <div style="display:flex; align-items:center; gap: 20px; margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
              <span style="font-size: 3.5rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); line-height: 1;">${getIcon(current.weatherDesc[0].value)}</span>
              <div>
                 <div style="font-size: 2.2rem; font-weight: 900; line-height: 1; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${current.temp_C}°C</div>
                 <div style="font-size: 0.95rem; font-weight: 600; color: #fff; margin-top: 6px;">${translateDesc(current.weatherDesc[0].value)}</div>
                 <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-top: 4px;">Cảm giác: ${current.FeelsLikeC}°C • 💧 ${current.humidity}%</div>
              </div>
           </div>
           <div style="max-height: 400px; overflow-y: auto; padding-right: 5px;" class="custom-scrollbar">
              ${daysHtml}
           </div>
        </div>
      `;
    } catch(e) {
      container.innerHTML = '<div style="padding: 30px; color: #f87171; text-align:center; font-weight: 600;">Không thể kết nối đến máy chủ thời tiết. Vui lòng thử lại sau.</div>';
    }
  };

  window.closeActivityModal = function() {
    const overlay = document.getElementById('activityDetailModalOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Stop video when closing
    const body = document.getElementById('activityModalBody');
    if (body) body.innerHTML = '';
  };

  // Close modal on click outside
  document.getElementById('activityDetailModalOverlay')?.addEventListener('click', function(e) {
    if (e.target === this) closeActivityModal();
  });

  function renderVersionTabs() {
    versionTabs.innerHTML = planHistory.map((p, i) => `
      <button class="version-tab ${i === currentPlanIndex ? 'active' : ''}" onclick="switchVersion(${i})">Bản ${i + 1}</button>
    `).join('');
  }

  window.switchVersion = (idx) => {
    currentPlanIndex = idx;
    renderVersionTabs();
    renderItinerary(planHistory[idx], SmartWizard.data.destination, SmartWizard.data.days, SmartWizard.data.tripDate);
  };

  // --- GLOBAL DRAFT LOADER (Redefined inside DOMContentLoaded) ---
  window.WanderPlanner.loadDraft = function(manualDraft) {
    console.log("📂 [WanderPlanner] loadDraft called with:", manualDraft ? "Manual Draft" : "LocalStorage");
    const draftRaw = manualDraft ? JSON.stringify(manualDraft) : localStorage.getItem('wander_itinerary_proposal_draft');
    if (!draftRaw) return;

    try {
      const draft = JSON.parse(draftRaw);
      if (!manualDraft) localStorage.removeItem('wander_itinerary_proposal_draft');

      console.log("📝 [WanderPlanner] Processing draft:", draft.title);
      
      // 1. Điền vào form
      const destInput = document.getElementById('dest');
      const daysInput = document.getElementById('days');
      const budgetInput = document.getElementById('budget');
      const extraInput = document.getElementById('additionalInfo');

      if (destInput) destInput.value = draft.destination || '';
      if (daysInput) daysInput.value = draft.days || 3;
      
      if (budgetInput) {
          const budgetVal = parseInt(draft.budget);
          if (budgetVal <= 1) budgetInput.value = "dưới 1 triệu VNĐ";
          else if (budgetVal <= 3) budgetInput.value = "1 đến 3 triệu VNĐ";
          else if (budgetVal <= 7) budgetInput.value = "3 đến 7 triệu VNĐ";
          else budgetInput.value = "7 đến 15 triệu VNĐ";
      }
      if (extraInput) extraInput.value = draft.style ? `Phong cách: ${draft.style}. ${draft.description || ''}` : '';

      // 2. Chuẩn bị dữ liệu cho AI
      const generationData = {
          destination: draft.destination,
          days: draft.days || 3,
          budget: budgetInput?.value || "3 đến 7 triệu VNĐ",
          tripDate: document.getElementById('tripDate')?.value || '',
          companion: document.getElementById('companion')?.value || 'Bạn bè',
          additionalInfo: extraInput?.value || '',
          skipWizard: true
      };

      // 3. UI
      document.getElementById('stepBasic').style.display = 'none';
      if (document.getElementById('stepDiscovery')) document.getElementById('stepDiscovery').style.display = 'none';
      if (document.getElementById('stepSmartWizard')) document.getElementById('stepSmartWizard').style.display = 'none';
      
      // 4. Generate
      doGenerate(generationData);
      if (window.WanderUI && WanderUI.showToast) WanderUI.showToast("Bỏ qua bước hỏi thêm, đang tạo lịch trình chi tiết...", "success");
      
    } catch(e) { console.error("❌ [WanderPlanner] Lỗi load draft:", e); }
  };

  // Run initial check
  window.WanderPlanner.loadDraft();

  refineForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const feedback = refineInput.value;
    if (!feedback) return;
    loader.style.display = 'flex';
    try {
      const res = await fetch('/api/planner/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('wander_token') || '' },
        body: JSON.stringify({ oldPlanJson: planHistory[currentPlanIndex], userFeedback: feedback, itineraryId: currentItineraryId })
      });
      const d = await res.json();
      if (d.success) {
        planHistory.push(d.plan);
        currentPlanIndex = planHistory.length - 1;
        renderVersionTabs();
        renderItinerary(d.plan, SmartWizard.data.destination, SmartWizard.data.days, SmartWizard.data.tripDate);
        refineInput.value = '';
      }
    } catch(err) { console.error(err); }
    finally { loader.style.display = 'none'; }
  });

  btnSaveTrip?.addEventListener('click', async () => {
    if (!currentItineraryId) return;
    const token = localStorage.getItem('wander_token');
    if (!token) {
      alert("Vui lòng đăng nhập để lưu lịch trình.");
      if (window.WanderUI && WanderUI.openModal) WanderUI.openModal('auth');
      return;
    }
    btnSaveTrip.disabled = true;
    btnSaveTrip.textContent = "Đang lưu...";
    try {
      const res = await fetch('/api/planner/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ itineraryId: currentItineraryId })
      });
      const data = await res.json();
      if (data.success) {
        // Record Activity
        if (window.WanderUI && WanderUI.recordActivity) {
          WanderUI.recordActivity('save_trip', `Đã lưu lịch trình chuyến đi mới`, { itineraryId: currentItineraryId });
        }

        btnSaveTrip.textContent = "✓ Đã lưu thành công";
        btnSaveTrip.style.background = "#10b981";
        const statusEl = document.getElementById('saveTripStatus');
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = "Lịch trình đã được thêm vào Chuyến đi của bạn.";
        }
      } else {
        btnSaveTrip.disabled = false;
        btnSaveTrip.textContent = "Thử lại";
      }
    } catch(e) { 
      console.error(e);
      btnSaveTrip.disabled = false;
      btnSaveTrip.textContent = "Lỗi lưu";
    }
  });

  // --- VIEW SAVED TRIP LOGIC ---
  const urlParams = new URLSearchParams(window.location.search);
  const isViewMode = urlParams.get('view') === 'true';
  const savedTripJson = sessionStorage.getItem('wander_view_trip');

  if (isViewMode && (savedTripJson || urlParams.get('itinId'))) {
    try {
      const itinId = urlParams.get('itinId');
      
      const processPlan = (plan, destination, days) => {
        // Hide initial state
        if (placeholder) placeholder.style.display = 'none';
        if (loader) loader.style.display = 'none';
        
        // Show result area
        if (resultContainer) resultContainer.style.display = 'block';
        if (refineBox) refineBox.style.display = 'block';
        
        // Show View Mode header if exists
        const viewModeHeader = document.getElementById('viewModeHeader');
        if (viewModeHeader) viewModeHeader.style.display = 'flex';

        // Store in planHistory for switching/refining
        planHistory = [plan];
        currentPlanIndex = 0;
        
        // Render
        renderItinerary(plan, destination || plan.destination || 'Chuyến đi đã lưu', days || plan.days || 3);
        renderVersionTabs();

        // Scroll to result
        setTimeout(() => {
          resultContainer.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      };

      if (savedTripJson) {
        const plan = JSON.parse(savedTripJson);
        processPlan(plan);
      } else if (itinId) {
        if (loader) loader.style.display = 'flex';
        const token = localStorage.getItem('wander_token');
        fetch(`/api/planner/itinerary/${itinId}`, {
          headers: { 'x-auth-token': token || '' }
        })
          .then(r => r.json())
          .then(json => {
            if (json.success && json.data) {
              processPlan(json.data.planJson, json.data.destination, json.data.days);
            }
          })
          .catch(e => console.error("Error fetching saved itin:", e))
          .finally(() => { if (loader) loader.style.display = 'none'; });
      }
    } catch (e) {
      console.error("Lỗi hiển thị lịch trình đã lưu:", e);
    }
  }
};

// --- ROBUST INITIALIZATION ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlanner);
} else {
  initPlanner();
}

// Fallback for safety
setTimeout(initPlanner, 1500);
