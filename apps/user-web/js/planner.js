/* ===================== PLANNER.JS ===================== */
window.WanderPlanner = window.WanderPlanner || {};

const VN_DESTINATION_PHOTOS = {
  // --- MIỀN BẮC ---
  "hà nội": ["https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&fit=crop", "https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=800&fit=crop", "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800&fit=crop"],
  "hoàn kiếm": ["https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&fit=crop"],
  "phố cổ": ["https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=800&fit=crop"],
  "hạ long": ["https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "vịnh hạ long": ["https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop"],
  "sapa": ["https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop", "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&fit=crop"],
  "fansipan": ["https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop"],
  "cát cát": ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&fit=crop"],
  "ninh bình": ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop", "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&fit=crop"],
  "tràng an": ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "hà giang": ["https://images.unsplash.com/photo-1524230572899-a752b3835840?w=800&fit=crop", "https://images.unsplash.com/photo-1625834317364-b32c140fd360?w=800&fit=crop"],
  "đồng văn": ["https://images.unsplash.com/photo-1524230572899-a752b3835840?w=800&fit=crop"],
  "mộc châu": ["https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop"],
  "cao bằng": ["https://images.unsplash.com/photo-1575986767340-5d17ae767ab0?w=800&fit=crop", "https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?w=800&fit=crop"],
  "mai châu": ["https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop", "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&fit=crop"],
  "tam đảo": ["https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "ba vì": ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop", "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&fit=crop"],
  "cát bà": ["https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "vịnh lan hạ": ["https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop"],
  "yên bái": ["https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop", "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop"],
  "mù cang chải": ["https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop", "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop"],
  "điện biên": ["https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop", "https://images.unsplash.com/photo-1524230572899-a752b3835840?w=800&fit=crop"],
  "lạng sơn": ["https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&fit=crop"],
  "bắc kạn": ["https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "tuyên quang": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&fit=crop"],
  "thái nguyên": ["https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop"],
  "đảo cô tô": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&fit=crop"],

  // --- MIỀN TRUNG ---
  "đà nẵng": ["https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop", "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&fit=crop"],
  "hội an": ["https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&fit=crop", "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&fit=crop", "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&fit=crop"],
  "huế": ["https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop", "https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?w=800&fit=crop"],
  "nha trang": ["https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?w=800&fit=crop", "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "đà lạt": ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop", "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&fit=crop", "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&fit=crop"],
  "đà lạc": ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop", "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&fit=crop"],
  "quy nhơn": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "phú yên": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop"],
  "tuy hòa": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&fit=crop"],
  "mũi né": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "phan thiết": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "bình thuận": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop"],
  "phong nha": ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "quảng bình": ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop"],
  "bình ba": ["https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "pleiku": ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&fit=crop", "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop"],
  "gia lai": ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&fit=crop"],
  "buôn ma thuột": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&fit=crop", "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop"],
  "đắk lắk": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&fit=crop"],
  "kon tum": ["https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop"],
  "lý sơn": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&fit=crop"],
  "quảng ngãi": ["https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "quảng trị": ["https://images.unsplash.com/photo-1587922546307-776227941871?w=800&fit=crop", "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&fit=crop"],
  "vịnh vân phong": ["https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],

  // --- MIỀN NAM ---
  "tp.hcm": ["https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&fit=crop", "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "sài gòn": ["https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&fit=crop", "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop"],
  "vũng tàu": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&fit=crop"],
  "phú quốc": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&fit=crop"],
  "cần thơ": ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop", "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&fit=crop"],
  "côn đảo": ["https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "an giang": ["https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "tây ninh": ["https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "bến tre": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "kiên giang": ["https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "đồng tháp": ["https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "cà mau": ["https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "mũi cà mau": ["https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop"],
  "bạc liêu": ["https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "sóc trăng": ["https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "trà vinh": ["https://images.unsplash.com/photo-1590054387835-ab72678fef01?w=800&fit=crop", "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&fit=crop"],
  "hậu giang": ["https://images.unsplash.com/photo-1587922546307-776227941871?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "vĩnh long": ["https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop", "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop"],
  "tiền giang": ["https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop", "https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop"],
  "đảo nam du": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop", "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&fit=crop"],
  "hòn sơn": ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"],
  "châu đốc": ["https://images.unsplash.com/photo-1571508601936-6ca847b47ae4?w=800&fit=crop", "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800&fit=crop"]
};

const GENERIC_VN_PHOTOS = [
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop",
  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&fit=crop",
  "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop",
  "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?w=800&fit=crop",
  "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop",
  "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&fit=crop",
  "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800&fit=crop"
];

const VN_PLACES_VIDEOS = {
  "hà nội": "1dodeGKcr1A",
  "hoàn kiếm": "1dodeGKcr1A",
  "phố cổ": "1dodeGKcr1A",
  "hạ long": "Lgvc0l1UyaU",
  "ti tốp": "Lgvc0l1UyaU",
  "sapa": "xUQ9W45XbYM",
  "cát cát": "xUQ9W45XbYM",
  "fansipan": "xUQ9W45XbYM",
  "ninh bình": "MhFBjagBUTk",
  "tràng an": "MhFBjagBUTk",
  "tam cốc": "MhFBjagBUTk",
  "hang múa": "MhFBjagBUTk",
  "đà nẵng": "1dodeGKcr1A",
  "hội an": "1dodeGKcr1A",
  "bà nà": "1dodeGKcr1A",
  "phú quốc": "Lgvc0l1UyaU",
  "vũng tàu": "xUQ9W45XbYM",
  "tp.hcm": "1dodeGKcr1A",
  "sài gòn": "1dodeGKcr1A",
  "đà lạt": "Lgvc0l1UyaU",
  "nha trang": "xUQ9W45XbYM",
  "huế": "MhFBjagBUTk",
  "quảng bình": "1dodeGKcr1A",
  "phong nha": "1dodeGKcr1A",
  "côn đảo": "Lgvc0l1UyaU",
  "mộc châu": "xUQ9W45XbYM",
  "hà giang": "xUQ9W45XbYM",
  "quy nhơn": "Lgvc0l1UyaU",
  "phú yên": "Lgvc0l1UyaU",
  "cần thơ": "1dodeGKcr1A",
  "bến tre": "1dodeGKcr1A",
  "cà mau": "1dodeGKcr1A",
  "an giang": "1dodeGKcr1A",
  "tây ninh": "1dodeGKcr1A",
  "bình thuận": "Lgvc0l1UyaU",
  "mũi né": "Lgvc0l1UyaU",
  "phan thiết": "Lgvc0l1UyaU"
};

function getVNPhoto(query, idx = 0) {
  if (!query) return GENERIC_VN_PHOTOS[idx % GENERIC_VN_PHOTOS.length];
  const qLower = query.toLowerCase().trim();
  
  // Kiểm tra điểm đến cụ thể trước
  for (const [key, photos] of Object.entries(VN_DESTINATION_PHOTOS)) {
    if (qLower.includes(key) || key.includes(qLower)) {
      // Dùng hàm băm đơn giản hoặc random theo idx để chọn ảnh trong tập ảnh của địa điểm đó
      const photoIdx = (Math.abs(idx) + qLower.length) % photos.length;
      return photos[photoIdx];
    }
  }
  
  return GENERIC_VN_PHOTOS[(Math.abs(idx) + qLower.length) % GENERIC_VN_PHOTOS.length];
}
window.getVNPhoto = getVNPhoto;


function getVNVideoId(query) {
  if (!query) return '1dodeGKcr1A';
  const qLower = query.toLowerCase().trim();
  for (const [key, val] of Object.entries(VN_PLACES_VIDEOS)) {
    if (qLower.includes(key) || key.includes(qLower)) {
      return val;
    }
  }
  if (window.currentDestName) {
    const dLower = window.currentDestName.toLowerCase().trim();
    for (const [key, val] of Object.entries(VN_PLACES_VIDEOS)) {
      if (dLower.includes(key) || key.includes(dLower)) {
        return val;
      }
    }
  }
  return '1dodeGKcr1A';
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
  const stepSmartWizard = document.getElementById('stepSmartWizard');
  const btnSaveTrip = document.getElementById('btnSaveTrip');
  const versionTabs = document.getElementById('versionTabs');

  let currentItineraryId = null;
  let planHistory = [];
  let currentPlanIndex = -1;
  let currentFormStep = 1;

  // =====================================================
  // Initialize new Step 2 features
  // =====================================================
  
  // Set up event listeners for new features
  const setupStep2Listeners = () => {
    // Days/Nights auto-sync
    const daysInput = document.getElementById('days');
    const nightsInput = document.getElementById('nights');
    
    // Ensure default values
    if (daysInput && !daysInput.value) daysInput.value = 3;
    if (nightsInput && !nightsInput.value) nightsInput.value = 2;
    
    if (daysInput) {
      daysInput.addEventListener('input', () => {
        const days = parseInt(daysInput.value) || 1;
        if (nightsInput) nightsInput.value = Math.max(0, days - 1);
        updateBudgetEstimate();
      });
      daysInput.addEventListener('change', () => {
        const days = parseInt(daysInput.value) || 1;
        if (nightsInput) nightsInput.value = Math.max(0, days - 1);
        updateBudgetEstimate();
      });
    }
    if (nightsInput) {
      nightsInput.addEventListener('input', () => {
        const nights = parseInt(nightsInput.value) || 0;
        if (daysInput) daysInput.value = nights + 1;
        updateBudgetEstimate();
      });
      nightsInput.addEventListener('change', () => {
        const nights = parseInt(nightsInput.value) || 0;
        if (daysInput) daysInput.value = nights + 1;
        updateBudgetEstimate();
      });
    }
    
    // Budget select change
    const budgetSelect = document.getElementById('budget');
    if (budgetSelect) {
      budgetSelect.addEventListener('change', () => {
        const val = budgetSelect.value;
        if (val.includes('1 triệu')) selectTravelTier('budget');
        else if (val.includes('3') || val.includes('7')) selectTravelTier('normal');
        else if (val.includes('15')) selectTravelTier('luxury');
        updateBudgetEstimate();
      });
    }
    
    // Trip date change
    const tripDate = document.getElementById('tripDate');
    if (tripDate) {
      tripDate.addEventListener('change', updateDateTimeHints);
    }
    
    // Departure time change
    const departureTime = document.getElementById('departureTime');
    if (departureTime) {
      departureTime.addEventListener('change', updateDateTimeHints);
    }
    
    // Điểm đến thay đổi -> cập nhật chi phí di chuyển
    const destInput = document.getElementById('dest');
    if (destInput) {
      destInput.addEventListener('input', () => {
        setTimeout(() => updateBudgetEstimate(), 200);
      });
      destInput.addEventListener('change', () => {
        updateBudgetEstimate();
      });
    }
    
    // Member inputs
    ['adults', 'children', 'toddlers', 'seniors'].forEach(type => {
      const input = document.getElementById(type);
      if (input) {
        input.addEventListener('change', () => {
          updateTotalMembers();
          updateBudgetEstimate();
        });
      }
    });
    
    updateTotalMembers();
    updateBudgetEstimate();
    updateDateTimeHints();
  };
  
  // Run setup after a small delay to ensure DOM is ready
  setTimeout(setupStep2Listeners, 100);
  
  // Initialize travel tier selection (highlight the default tier)
  setTimeout(() => {
    if (typeof selectTravelTier === 'function') {
      selectTravelTier('normal');
    }
  }, 150);

  // =====================================================
  // FORM STEP NAVIGATION (2 Bước)
  // =====================================================
  window.switchFormStep = function(step) {
    const step1 = document.getElementById('formStep1');
    const step2 = document.getElementById('formStep2');
    const tabs = document.querySelectorAll('.form-step-tab');

    if (step === 1) {
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.step === '1');
      });
      currentFormStep = 1;
    } else if (step === 2) {
      if (step1) step1.style.display = 'none';
      if (step2) step2.style.display = 'block';
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.step === '2');
      });
      currentFormStep = 2;
      
      // Sync data from Step 1 to Step 2
      syncStep1ToStep2();
    }
  };

  // Sync data from Step 1 to Step 2 inputs
  function syncStep1ToStep2() {
    const destInput = document.getElementById('dest');
    if (destInput) {
      // Get destinations from selectedDestinations array or existing value
      const selectedDests = window.selectedDestinations || [];
      if (selectedDests.length > 0) {
        // Join all destination names
        destInput.value = selectedDests.map(d => d.name || d.destination || d).join(', ');
      }
      // If no array but there's existing value, keep it
    }
    
    // Sync selected destinations preview
    syncSelectedDestinationsPreview();
    
    // Update date/time hints
    updateDateTimeHints();
    
    // Initialize budget estimate
    updateBudgetEstimate();
    
    // Update total members
    updateTotalMembers();
  }

  // Sync selected destinations from Step 1 to Step 2 preview
  function syncSelectedDestinationsPreview() {
    const preview = document.getElementById('selectedDestPreview');
    const chipsContainer = document.getElementById('selectedDestChipsStep2');
    const emptyMsg = document.getElementById('selectedDestEmpty');
    const countSpan = document.getElementById('selectedCount');
    const destInput = document.getElementById('dest');
    
    if (!chipsContainer) return;
    
    // Get selected destinations from Step 1
    const selectedDests = window.selectedDestinations || [];
    const destText = destInput?.value?.trim() || '';
    
    // Always show the preview section when in step 2
    if (preview) {
      preview.style.display = 'block';
    }
    
    // Update count based on array length or text
    if (countSpan) {
      const count = selectedDests.length || (destText ? 1 : 0);
      countSpan.textContent = count > 0 ? ` (${count} địa điểm)` : '';
    }
    
    // Clear container
    chipsContainer.innerHTML = '';
    
    // If no destinations at all, show empty state
    if (selectedDests.length === 0 && !destText) {
      if (emptyMsg) {
        emptyMsg.style.display = 'block';
      }
      return;
    }
    
    if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
    
    // If we have destination objects from Step 1
    if (selectedDests.length > 0) {
      selectedDests.forEach((dest, index) => {
        const destName = dest.name || dest.destination || dest;
        const chip = createDestChip(destName, index);
        chipsContainer.appendChild(chip);
      });
      
      // Add "Delete all" button if multiple destinations
      if (selectedDests.length > 1) {
        const deleteAllBtn = createDeleteAllButton();
        chipsContainer.appendChild(deleteAllBtn);
      }
    } 
    // If we just have text in dest input (manually typed)
    else if (destText) {
      const chip = createDestChip(destText, -1);
      chipsContainer.appendChild(chip);
    }
  }

  // Create a destination chip element
  function createDestChip(destName, index) {
    const chip = document.createElement('div');
    chip.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.6rem;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 2rem;
      font-size: 0.8rem;
      color: #60a5fa;
      font-weight: 600;
    `;
    
    // Remove button only if we have array data
    const removeBtn = index >= 0 ? `
      <button type="button" onclick="removeDestinationFromStep2(${index})" style="
        background: rgba(239, 68, 68, 0.2);
        border: none;
        color: #f87171;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        line-height: 1;
        padding: 0;
      ">×</button>
    ` : '';
    
    chip.innerHTML = `<span>📍 ${destName}</span>${removeBtn}`;
    return chip;
  }

  // Create "Delete all" button
  function createDeleteAllButton() {
    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.type = 'button';
    deleteAllBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.6rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 2rem;
      font-size: 0.7rem;
      color: #f87171;
      cursor: pointer;
      margin-left: 0.25rem;
    `;
    deleteAllBtn.innerHTML = '🗑️ Xóa tất cả';
    deleteAllBtn.onclick = () => {
      if (confirm('Bạn có chắc muốn xóa tất cả điểm đến?')) {
        window.selectedDestinations = [];
        const destInput = document.getElementById('dest');
        if (destInput) destInput.value = '';
        syncSelectedDestinationsPreview();
      }
    };
    return deleteAllBtn;
  }

  // Remove a destination from the selected list in Step 2
  window.removeDestinationFromStep2 = function(index) {
    if (!window.selectedDestinations || window.selectedDestinations.length === 0) return;
    
    window.selectedDestinations.splice(index, 1);
    
    // Update hidden dest field
    const destInput = document.getElementById('dest');
    if (destInput) {
      destInput.value = window.selectedDestinations.map(d => d.name || d.destination || d).join(', ');
    }
    
    syncSelectedDestinationsPreview();
  };

  // Update date/time hints for better UX
  function updateDateTimeHints() {
    const tripDate = document.getElementById('tripDate');
    const departureTime = document.getElementById('departureTime');
    const dateHint = document.getElementById('tripDateHint');
    const timeHint = document.getElementById('departureTimeHint');
    
    if (tripDate && tripDate.value && dateHint) {
      const date = new Date(tripDate.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        dateHint.textContent = 'Hôm nay';
      } else if (diffDays === 1) {
        dateHint.textContent = 'Ngày mai';
      } else if (diffDays > 1 && diffDays <= 7) {
        dateHint.textContent = `${diffDays} ngày nữa`;
      } else {
        dateHint.textContent = date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
      }
    }
    
    if (departureTime && departureTime.value && timeHint) {
      const [hours, minutes] = departureTime.value.split(':');
      const hour = parseInt(hours);
      
      if (hour >= 5 && hour < 12) {
        timeHint.textContent = 'Buổi sáng';
      } else if (hour >= 12 && hour < 18) {
        timeHint.textContent = 'Buổi chiều';
      } else if (hour >= 18 && hour < 22) {
        timeHint.textContent = 'Buổi tối';
      } else {
        timeHint.textContent = 'Đêm khuya';
      }
    }
  }

  // Days/Nights adjustment
  window.adjustDays = function(delta) {
    const daysInput = document.getElementById('days');
    const nightsInput = document.getElementById('nights');
    if (!daysInput || !nightsInput) return;
    
    let days = parseInt(daysInput.value) || 3;
    days = Math.max(1, Math.min(14, days + delta));
    daysInput.value = days;
    
    // Nights = days - 1 (for typical trip)
    const nights = Math.max(0, days - 1);
    nightsInput.value = nights;
    
    updateBudgetEstimate();
  };

  window.adjustNights = function(delta) {
    const daysInput = document.getElementById('days');
    const nightsInput = document.getElementById('nights');
    if (!daysInput || !nightsInput) return;
    
    let nights = parseInt(nightsInput.value) || 2;
    nights = Math.max(0, Math.min(13, nights + delta));
    nightsInput.value = nights;
    
    // Days = nights + 1
    const days = nights + 1;
    daysInput.value = days;
    
    updateBudgetEstimate();
  };

  // Member count adjustment
  window.adjustMember = function(type, delta) {
    const input = document.getElementById(type);
    if (!input) return;
    
    let count = parseInt(input.value) || 0;
    const max = type === 'adults' ? 10 : 10;
    const min = type === 'adults' ? 1 : 0;
    count = Math.max(min, Math.min(max, count + delta));
    input.value = count;
    
    updateTotalMembers();
    updateBudgetEstimate();
  };

  // Update total members count
  function updateTotalMembers() {
    const adults = parseInt(document.getElementById('adults')?.value) || 0;
    const children = parseInt(document.getElementById('children')?.value) || 0;
    const toddlers = parseInt(document.getElementById('toddlers')?.value) || 0;
    const seniors = parseInt(document.getElementById('seniors')?.value) || 0;
    const total = adults + children + toddlers + seniors;
    
    const totalDisplay = document.getElementById('totalMembers');
    if (totalDisplay) {
      totalDisplay.textContent = total + ' người';
    }
    
    // Update companion select
    const companion = document.getElementById('companion');
    if (companion) {
      if (total === 1) companion.value = 'Một mình';
      else if (total === 2) companion.value = 'Cặp đôi';
      else if (total > 2 && children > 0) companion.value = 'Gia đình';
      else companion.value = 'Bạn bè';
    }
  }

  // Travel tier selection
  let currentTravelTier = 'normal';
  
  // Chi phí theo từng hạng mục (giá/người/ngày) - theo thị trường Việt Nam 2025
  const tierCosts = {
    // Budget - Tiết kiệm ( backpacker, khách sạn bình dân)
    budget: {
      hotel: { perRoom: 350000, maxPerRoom: 2 },     // 350K/phòng/đêm ( dorm, nhà nghỉ)
      food: { perAdult: 150000, perChild: 100000 },   // 150K người lớn, 100K trẻ em/ngày
      transport: 100000,                              // 100K/người/ngày (bus, xe máy thuê)
      ticket: 150000,                                  // 150K/người/ngày (vé tham quan)
      entertain: 50000                                // 50K/người/ngày (đồ uống, cà phê)
    },
    // Normal - Tiêu chuẩn (3-4 sao, ăn uống ngon)
    normal: {
      hotel: { perRoom: 750000, maxPerRoom: 2 },     // 750K/phòng/đêm (3-4 sao)
      food: { perAdult: 300000, perChild: 200000 },   // 300K người lớn, 200K trẻ em/ngày
      transport: 200000,                              // 200K/người/ngày (grab, thuê xe)
      ticket: 300000,                                  // 300K/người/ngày
      entertain: 100000                                // 100K/người/ngày
    },
    // Luxury - Cao cấp (5 sao, resort, ăn nhà hàng)
    luxury: {
      hotel: { perRoom: 2000000, maxPerRoom: 2 },    // 2M/phòng/đêm (5 sao, resort)
      food: { perAdult: 500000, perChild: 350000 },   // 500K người lớn, 350K trẻ em/ngày
      transport: 400000,                              // 400K/người/ngày (ô tô riêng, tài xế)
      ticket: 500000,                                  // 500K/người/ngày
      entertain: 200000                                // 200K/người/ngày
    }
  };
  
  // ================================================
  // DATABASE CHI PHÍ ĐỊA ĐIỂM NỔI BẬT
  // ================================================
  const SPOT_COSTS = {
    // ===== HÀ NỘI =====
    "Lăng Bác & Chùa Một Cột": { ticket: 0, food: 0, type: "attraction" },
    "Hồ Hoàn Kiếm & Đền Ngọc Sơn": { ticket: 0, food: 0, type: "attraction" },
    "Phở Thìn Bờ Hồ": { ticket: 0, food: 70000, type: "restaurant" },
    "Bún Chả Đắc Kim": { ticket: 0, food: 60000, type: "restaurant" },
    "Xem Múa Rối Nước Bông Sen": { ticket: 150000, food: 0, type: "experience" },
    "Tour Đêm Nhà Tù Hỏa Lò": { ticket: 200000, food: 0, type: "experience" },
    "Chả cá Lã Vọng": { ticket: 0, food: 200000, type: "restaurant" },
    "Trà Hạt Long An": { ticket: 0, food: 80000, type: "cafe" },
    "Phủ Tây Hồ": { ticket: 0, food: 0, type: "attraction" },
    
    // ===== TP.HCM =====
    "Dinh Độc Lập": { ticket: 75000, food: 0, type: "attraction" },
    "Nhà Thờ Đức Bà": { ticket: 0, food: 0, type: "attraction" },
    "Cơm Tấm Nguyễn Văn Cừ": { ticket: 0, food: 55000, type: "restaurant" },
    "Hủ Tiếu Thanh Xuân": { ticket: 0, food: 50000, type: "restaurant" },
    "Du Thuyền Sông Sài Gòn": { ticket: 350000, food: 200000, type: "experience" },
    "Bóng Nước Kịch Nói Sân Khấu": { ticket: 200000, food: 0, type: "experience" },
    "Bảo Tàng Chứng Tích Chiến Tranh": { ticket: 150000, food: 0, type: "attraction" },
    "Phố Đi Bộ Nguyễn Huệ": { ticket: 0, food: 0, type: "attraction" },
    "Bến Thành": { ticket: 0, food: 0, type: "attraction" },
    "Landmark 81": { ticket: 0, food: 0, type: "attraction" },
    "Bánh Mì Huỳnh Hoa": { ticket: 0, food: 55000, type: "restaurant" },
    "Cơm Tấm Kiều Giang": { ticket: 0, food: 60000, type: "restaurant" },
    "Hủ Tiếu Nam Vang Quảng Đức": { ticket: 0, food: 60000, type: "restaurant" },
    "Cà Phê Trung Nguyên Legend": { ticket: 0, food: 60000, type: "cafe" },
    
    // ===== ĐÀ NẴNG =====
    "Ngũ Hành Sơn": { ticket: 0, food: 0, type: "attraction" },
    "Cầu Vàng Bà Nà Hills": { ticket: 750000, food: 0, type: "attraction" },
    "Bà Nà Hills": { ticket: 750000, food: 0, type: "attraction" },
    "Bánh Tráng Trần": { ticket: 0, food: 100000, type: "restaurant" },
    "Mì Quảng Bà Mua": { ticket: 0, food: 60000, type: "restaurant" },
    "Dù Lượn Trên Bán Đảo Sơn Trà": { ticket: 450000, food: 0, type: "experience" },
    "Du Thuyền Sông Hàn Ngắm Cầu Rồng": { ticket: 350000, food: 150000, type: "experience" },
    "Cà Phê Mitora": { ticket: 0, food: 60000, type: "cafe" },
    "Hải Sản Năm Đảnh": { ticket: 0, food: 250000, type: "restaurant" },
    
    // ===== HỘI AN =====
    "Chùa Cầu Nhật Bản": { ticket: 0, food: 0, type: "attraction" },
    "Rừng Dừa Bảy Mẫu": { ticket: 150000, food: 0, type: "attraction" },
    "Bánh Mì Phượng": { ticket: 0, food: 45000, type: "restaurant" },
    "Cao Lầu Thanh": { ticket: 0, food: 60000, type: "restaurant" },
    "Thả Hoa Đăng Dòng Sông Hoài": { ticket: 50000, food: 0, type: "experience" },
    "Học Làm Đèn Lồng Truyền Thống": { ticket: 150000, food: 0, type: "experience" },
    
    // ===== HUẾ =====
    "Đại Nội Huế (Hoàng Thành)": { ticket: 150000, food: 0, type: "attraction" },
    "Lăng Khải Định": { ticket: 100000, food: 0, type: "attraction" },
    "Nhà Hàng Cung Đình": { ticket: 0, food: 300000, type: "restaurant" },
    "Cơm Hến Hoa Đông": { ticket: 0, food: 50000, type: "restaurant" },
    "Nghe Ca Huế Trên Sông Hương": { ticket: 200000, food: 150000, type: "experience" },
    "Đi Xích Lô Vòng Quanh Phố Cổ": { ticket: 100000, food: 0, type: "experience" },
    "Bún Hến Quảng Điền": { ticket: 0, food: 50000, type: "restaurant" },
    "Bánh Nậm Đông Ba": { ticket: 0, food: 30000, type: "restaurant" },
    "Cung An Định": { ticket: 150000, food: 0, type: "attraction" },
    "Lăng Vua Minh Mạng": { ticket: 100000, food: 0, type: "attraction" },
    
    // ===== NHA TRANG =====
    "Tháp Bà Ponagar": { ticket: 0, food: 0, type: "attraction" },
    "Nhà Thờ Đá Nha Trang": { ticket: 0, food: 0, type: "attraction" },
    "VinWonders Nha Trang": { ticket: 350000, food: 0, type: "attraction" },
    "Nem Nướng Đặng Văn Quyên": { ticket: 0, food: 100000, type: "restaurant" },
    "Hải Sản Thanh Sương": { ticket: 0, food: 200000, type: "restaurant" },
    "Lặn Biển Ngắm San Hô Hòn Mun": { ticket: 450000, food: 0, type: "experience" },
    "Tắm Bùn Khoáng Tháp Bà": { ticket: 250000, food: 0, type: "experience" },
    
    // ===== SAPA =====
    "Bản Cát Cát": { ticket: 70000, food: 150000, type: "attraction" },
    "Đỉnh Fansipan": { ticket: 300000, food: 0, type: "attraction" },
    "Fansipan": { ticket: 300000, food: 0, type: "attraction" },
    "Cáp treo Fansipan": { ticket: 650000, food: 0, type: "attraction" },
    "Lẩu Cá Hồi Song Nhi": { ticket: 0, food: 200000, type: "restaurant" },
    "Nhà Hàng A Phủ": { ticket: 0, food: 150000, type: "restaurant" },
    "Tắm Lá Thuốc Dao Đỏ Ta Phìn": { ticket: 150000, food: 0, type: "experience" },
    "Chợ Tình Sapa Đêm Thứ Bảy": { ticket: 0, food: 0, type: "experience" },
    
    // ===== HẠ LONG =====
    "Vịnh Hạ Long (Động Thiên Cung - Hang Sửng Sốt)": { ticket: 250000, food: 0, type: "attraction" },
    "Sun World Hạ Long Complex": { ticket: 350000, food: 0, type: "attraction" },
    "Chả Mực Thoan Hạ Long": { ticket: 0, food: 150000, type: "restaurant" },
    "Nhà Hàng Hồng Hạnh": { ticket: 0, food: 200000, type: "restaurant" },
    "Chèo Thuyền Kayak Qua Hang Luồn": { ticket: 150000, food: 0, type: "experience" },
    "Nghỉ Đêm Trên Du Thuyền 5 Sao": { ticket: 2000000, food: 500000, type: "experience" },
    
    // ===== NINH BÌNH =====
    "Khu du lịch sinh thái Tràng An": { ticket: 250000, food: 0, type: "attraction" },
    "Hang Múa": { ticket: 100000, food: 0, type: "attraction" },
    "Nhà Hàng Thăng Long Ninh Bình": { ticket: 0, food: 150000, type: "restaurant" },
    "Nhà Hàng Ba Cửa": { ticket: 0, food: 150000, type: "restaurant" },
    "Đi Đò Chèo Tràng An Hóa Thân Phim Ảnh": { ticket: 200000, food: 0, type: "experience" },
    "Đạp Xe Qua Các Bản Làng Tam Cốc": { ticket: 80000, food: 0, type: "experience" },
    
    // ===== HÀ GIANG =====
    "Mã Pí Lèng": { ticket: 0, food: 0, type: "attraction" },
    "Cột Cờ Lũng Cú": { ticket: 0, food: 0, type: "attraction" },
    "Nhà Hàng Hương Quyên": { ticket: 0, food: 150000, type: "restaurant" },
    "Quán Ăn Thanh Bình": { ticket: 0, food: 100000, type: "restaurant" },
    "Hoa Tam Giác Mạch Mùa Thu": { ticket: 0, food: 0, type: "experience" },
    "Trekking Cao Nguyên Đá": { ticket: 0, food: 0, type: "experience" },
    
    // ===== MỘC CHÂU =====
    "Đồi Chè Trái Tim Mộc Châu": { ticket: 0, food: 0, type: "attraction" },
    "Thác Dải Yếm": { ticket: 50000, food: 0, type: "attraction" },
    "Trang Trại Mận Mỹ Úc": { ticket: 0, food: 80000, type: "restaurant" },
    "Nhà Hàng Ba Liều": { ticket: 0, food: 120000, type: "restaurant" },
    "Cắm Trại Thung Lũng Mận": { ticket: 50000, food: 0, type: "experience" },
    "Bơi Suối Nước Nóng Mộc Châu": { ticket: 100000, food: 0, type: "experience" },
    
    // ===== CAO BẰNG =====
    "Thác Bản Giốc": { ticket: 40000, food: 0, type: "attraction" },
    "Động Ngườm Ngao": { ticket: 80000, food: 0, type: "attraction" },
    "Pác Bó - Khu Di Tích Cách Mạng": { ticket: 0, food: 0, type: "attraction" },
    
    // ===== ĐÀ LẠT =====
    "Hồ Tuyền Lâm & Thiền Viện Trúc Lâm": { ticket: 0, food: 0, type: "attraction" },
    "Thác Datanla": { ticket: 80000, food: 0, type: "attraction" },
    "Vườn Dâu Tây Dalat Farm": { ticket: 50000, food: 100000, type: "attraction" },
    "Lẩu Gà Lá É Tao Ngộ": { ticket: 0, food: 180000, type: "restaurant" },
    "Bánh Căn Tăng Bạt Hổ": { ticket: 0, food: 40000, type: "restaurant" },
    "Café Mê Tiền": { ticket: 0, food: 60000, type: "cafe" },
    "Cơm Lam Đà Lạt": { ticket: 0, food: 40000, type: "restaurant" },
    "Săn Mây Đồi Chè Cầu Đất": { ticket: 0, food: 0, type: "experience" },
    "Cắm Trại Đồi Đa Phú": { ticket: 50000, food: 0, type: "experience" },
    
    // ===== PHÚ QUỐC =====
    "Bãi Sao": { ticket: 0, food: 0, type: "attraction" },
    "Grand World Phú Quốc": { ticket: 0, food: 0, type: "attraction" },
    "Vinpearl Safari": { ticket: 500000, food: 0, type: "attraction" },
    "Chùa Hộ Quốc": { ticket: 0, food: 0, type: "attraction" },
    "Bún Quậy Thanh Hùng": { ticket: 0, food: 60000, type: "restaurant" },
    "Nhà Ghẹ Hàm Ninh": { ticket: 0, food: 200000, type: "restaurant" },
    "Gỏi Cá Trích": { ticket: 0, food: 120000, type: "restaurant" },
    "Ngắm Hoàng Hôn Sunset Sanato": { ticket: 0, food: 0, type: "experience" },
    "Tour 4 Đảo Cano Phú Quốc": { ticket: 350000, food: 0, type: "experience" },
    
    // ===== CẦN THƠ =====
    "Chợ Nổi Cái Răng": { ticket: 0, food: 50000, type: "attraction" },
    "Nhà Cổ Bình Thủy": { ticket: 30000, food: 0, type: "attraction" },
    "Lẩu Mắm Dạ Lý": { ticket: 0, food: 180000, type: "restaurant" },
    "Nem Nướng Thanh Vân": { ticket: 0, food: 80000, type: "restaurant" },
    "Trải Nghiệm Làm Bánh Hủ Tiếu Sông Nước": { ticket: 100000, food: 50000, type: "experience" },
    "Ăn Hủ Tiếu Gõ Trên Ghe Chợ Nổi": { ticket: 0, food: 50000, type: "experience" },
    
    // ===== AN GIANG =====
    "Núi Sam": { ticket: 0, food: 0, type: "attraction" },
    "Chùa Phi Lai": { ticket: 0, food: 0, type: "attraction" },
    "Làng Nổi Châu Đốc": { ticket: 50000, food: 0, type: "attraction" },
    "Chợ Châu Đốc": { ticket: 0, food: 0, type: "attraction" },
    "Bánh Pía Châu Đốc": { ticket: 0, food: 30000, type: "restaurant" },
    "Thăm Làng Nổi Trên Sông": { ticket: 80000, food: 0, type: "experience" },
    "Mua Sắm Chợ Biên Giới": { ticket: 0, food: 0, type: "experience" },
    
    // ===== BÌNH BA =====
    "Bãi Nồm Bình Ba": { ticket: 0, food: 0, type: "attraction" },
    "Bãi Chướng Bình Ba": { ticket: 0, food: 0, type: "attraction" },
    "Bãi Nhà Cũ Bình Ba": { ticket: 0, food: 0, type: "attraction" },
    "Nhà Hàng Hải Sản Tươi Sống": { ticket: 0, food: 200000, type: "restaurant" },
    "Lặn Biển Ngắm San Hô": { ticket: 300000, food: 0, type: "experience" },
    "Nải Bình Ba": { ticket: 0, food: 0, type: "experience" },
    
    // ===== TUY HÒA =====
    "Tháp Nhạn Tuy Hòa": { ticket: 0, food: 0, type: "attraction" },
    "Vịnh Vũng Rô": { ticket: 0, food: 0, type: "attraction" },
    "Nhà Hàng Hải Sản Vũng Rô": { ticket: 0, food: 200000, type: "restaurant" },
    "Bánh Xèo Tuy Hòa": { ticket: 0, food: 60000, type: "restaurant" },
    "Chèo Thuyền Kayak Vịnh Vũng Rô": { ticket: 150000, food: 0, type: "experience" },
    "Ngắm Hoàng Hôn Bờ Biển": { ticket: 0, food: 0, type: "experience" },
    
    // ===== PLEIKU =====
    "Biển Hồ T'Nơng Pleiku": { ticket: 0, food: 0, type: "attraction" },
    "Chùa Minh Thành": { ticket: 0, food: 0, type: "attraction" },
    "Thủy Điện Yaly": { ticket: 0, food: 0, type: "attraction" },
    "Nhà Hàng Đặc Sản Tây Nguyên": { ticket: 0, food: 150000, type: "restaurant" },
    
    // ===== NÚI CẤP =====
    "Núi Cấp": { ticket: 30000, food: 0, type: "attraction" },
    "Chùa Vĩnh Nghiêm": { ticket: 0, food: 0, type: "attraction" },
  };
  
  // Chi phí mặc định theo loại (nếu không có trong database)
  const DEFAULT_COSTS = {
    attraction: { ticket: 100000, food: 0 },
    restaurant: { ticket: 0, food: 100000 },
    cafe: { ticket: 0, food: 50000 },
    experience: { ticket: 150000, food: 0 },
    region: { ticket: 0, food: 0 }
  };
  
  // Lấy chi phí cho một địa điểm
  function getSpotCost(spotName) {
    // Tìm chính xác
    if (SPOT_COSTS[spotName]) {
      return SPOT_COSTS[spotName];
    }
    
    // Tìm gần đúng
    const normalizedName = spotName.toLowerCase();
    for (const [name, cost] of Object.entries(SPOT_COSTS)) {
      if (normalizedName.includes(name.toLowerCase()) || name.toLowerCase().includes(normalizedName)) {
        return cost;
      }
    }
    
    // Mặc định theo category
    return null;
  }
  
  // Tính tổng chi phí các địa điểm đã chọn
  function calculateSelectedSpotsCost() {
    const spots = window.selectedAttractionData || [];
    let totalTicket = 0;
    let totalFood = 0;
    let spotCount = 0;
    
    spots.forEach(spot => {
      const cost = getSpotCost(spot.name);
      if (cost) {
        totalTicket += cost.ticket || 0;
        totalFood += cost.food || 0;
        spotCount++;
      } else {
        // Dùng chi phí mặc định
        const defaultCost = DEFAULT_COSTS[spot.category] || DEFAULT_COSTS.attraction;
        totalTicket += defaultCost.ticket;
        totalFood += defaultCost.food;
        spotCount++;
      }
    });
    
    return { totalTicket, totalFood, spotCount };
  }

  // ================================================
  // DATABASE TỌA ĐỘ CÁC THÀNH PHỐ VIỆT NAM
  // ================================================
  const CITY_COORDS = {
    // Miền Bắc
    "Hà Nội": { lat: 21.0285, lng: 105.8542 },
    "Hạ Long": { lat: 20.9101, lng: 107.1839 },
    "Sapa": { lat: 22.3363, lng: 103.8430 },
    "Ninh Bình": { lat: 20.2537, lng: 105.9750 },
    "Hà Giang": { lat: 22.8233, lng: 104.9826 },
    "Cao Bằng": { lat: 22.1447, lng: 106.1983 },
    "Lai Châu": { lat: 22.3956, lng: 103.3610 },
    "Điện Biên": { lat: 21.3860, lng: 103.0131 },
    "Lào Cai": { lat: 22.4855, lng: 103.8708 },
    "Yên Bái": { lat: 21.7228, lng: 104.9119 },
    "Thái Nguyên": { lat: 21.5942, lng: 105.8482 },
    "Bắc Kạn": { lat: 22.1470, lng: 105.8348 },
    "Tuyên Quang": { lat: 21.8236, lng: 105.2167 },
    "Vĩnh Phúc": { lat: 21.3068, lng: 105.5875 },
    "Phú Thọ": { lat: 21.4098, lng: 105.2153 },
    "Quảng Ninh": { lat: 20.9527, lng: 106.7590 },
    "Bắc Giang": { lat: 21.2782, lng: 106.1976 },
    "Hưng Yên": { lat: 20.6465, lng: 106.0510 },
    "Hải Dương": { lat: 20.9379, lng: 106.3159 },
    "Hải Phòng": { lat: 20.8584, lng: 106.6650 },
    "Nam Định": { lat: 20.4238, lng: 106.1623 },
    "Thái Bình": { lat: 20.5366, lng: 106.3380 },
    "Nghệ An": { lat: 18.6791, lng: 105.6814 },
    "Thanh Hóa": { lat: 19.8067, lng: 105.7850 },
    
    // Miền Trung
    "Hà Tĩnh": { lat: 18.3427, lng: 105.8960 },
    "Quảng Bình": { lat: 17.4689, lng: 106.6219 },
    "Quảng Trị": { lat: 16.7381, lng: 107.0840 },
    "Thừa Thiên Huế": { lat: 16.4637, lng: 107.5909 },
    "Đà Nẵng": { lat: 16.0544, lng: 108.2022 },
    "Quảng Nam": { lat: 15.5734, lng: 108.4739 },
    "Quảng Ngãi": { lat: 15.1204, lng: 108.8004 },
    "Bình Định": { lat: 13.7820, lng: 109.2190 },
    "Phú Yên": { lat: 13.0885, lng: 109.0928 },
    "Khánh Hòa": { lat: 12.2388, lng: 109.1966 },
    "Ninh Thuận": { lat: 11.5744, lng: 108.9999 },
    "Bình Thuận": { lat: 10.9294, lng: 108.0663 },
    
    // Tây Nguyên
    "Đắk Lắk": { lat: 12.7100, lng: 108.2375 },
    "Đắk Nông": { lat: 12.2586, lng: 107.8387 },
    "Gia Lai": { lat: 13.9842, lng: 108.1353 },
    "Kon Tum": { lat: 14.3496, lng: 108.0006 },
    "Lâm Đồng": { lat: 11.9403, lng: 108.4413 },
    "Đà Lạt": { lat: 11.9463, lng: 108.4413 },
    
    // Miền Nam
    "TP.HCM": { lat: 10.8231, lng: 106.6297 },
    "Tây Ninh": { lat: 11.3353, lng: 106.0838 },
    "Bình Dương": { lat: 10.9789, lng: 106.6548 },
    "Đồng Nai": { lat: 10.9541, lng: 106.8622 },
    "Bà Rịa Vũng Tàu": { lat: 10.5419, lng: 107.2420 },
    "Vũng Tàu": { lat: 10.4806, lng: 107.1839 },
    "Bình Phước": { lat: 11.5333, lng: 106.8827 },
    "Tiền Giang": { lat: 10.4499, lng: 106.3424 },
    "Bến Tre": { lat: 10.2410, lng: 106.4239 },
    "Trà Vinh": { lat: 9.9459, lng: 106.3427 },
    "Vĩnh Long": { lat: 10.0677, lng: 105.7849 },
    "Đồng Tháp": { lat: 10.4925, lng: 105.6925 },
    "An Giang": { lat: 10.5210, lng: 105.1244 },
    "Kiên Giang": { lat: 10.0442, lng: 105.0800 },
    "Cần Thơ": { lat: 10.0452, lng: 105.7469 },
    "Hậu Giang": { lat: 9.7729, lng: 105.4666 },
    "Sóc Trăng": { lat: 9.6044, lng: 105.9739 },
    "Bạc Liêu": { lat: 9.2941, lng: 105.7268 },
    "Cà Mau": { lat: 9.1870, lng: 105.1471 },
    "Phú Quốc": { lat: 10.2278, lng: 103.9600 },
    "Côn Đảo": { lat: 8.7058, lng: 106.5955 }
  };
  
  // ================================================
  // HÀM TÍNH KHOẢNG CÁCH (HAVERSINE FORMULA)
  // ================================================
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Khoảng cách km
  }
  
  // ================================================
  // TÍNH CHI PHÍ DI CHUYỂN THEO KHOẢNG CÁCH
  // ================================================
  function calculateTransportCost(distanceKm, tier) {
    if (distanceKm <= 5) {
      // Cùng thành phố - gần như miễn phí (đi bộ, xe đạp)
      return tier === 'luxury' ? 50000 : (tier === 'normal' ? 30000 : 20000);
    }
    
    // Chi phí theo km và tier (1 CHIỀU - đã tính khứ hồi)
    const costPerKm = {
      budget: 3500,    // 3,500 VNĐ/km (xe máy thuê ~100K/ngày + xăng)
      normal: 6000,    // 6,000 VNĐ/km (ô tô chia sẻ, taxi Grab)
      luxury: 12000    // 12,000 VNĐ/km (ô tô riêng/ thuê xe có tài xế)
    };
    
    let baseCost = 0;
    if (distanceKm > 300) {
      // Ước tính vé máy bay khứ hồi
      baseCost = {
        budget: 800000,   // Máy bay giá rẻ
        normal: 1500000,  // Máy bay thường
        luxury: 3000000   // Hạng thương gia
      }[tier];
    } else if (distanceKm > 100) {
      // Cao tốc hoặc đường dài (khứ hồi)
      baseCost = distanceKm * costPerKm[tier] * 2;
    } else {
      // Di chuyển nội vùng (khứ hồi)
      baseCost = distanceKm * costPerKm[tier] * 2;
    }
    
    return Math.round(baseCost);
  }
  
  // Lấy tọa độ điểm đến từ danh sách đã chọn
  function getDestinationCoords() {
    // Ưu tiên 1: Lấy trực tiếp từ input dest
    const destInput = document.getElementById('dest');
    if (destInput && destInput.value && destInput.value.trim()) {
      const coords = getCoordsByName(destInput.value.trim());
      if (coords) return coords;
    }
    
    // Ưu tiên 2: selectedDestinations (object array)
    let selectedDests = window.selectedDestinations || [];
    
    // Ưu tiên 3: selectedDestNames (string array)
    if (selectedDests.length === 0) {
      selectedDests = window.selectedDestNames || [];
    }
    
    if (selectedDests.length === 0) {
      return null;
    }
    
    // Lấy tên điểm đến đầu tiên
    let destName = '';
    if (typeof selectedDests[0] === 'object') {
      destName = selectedDests[0].name || selectedDests[0].destination || '';
    } else {
      destName = selectedDests[0] || '';
    }
    
    return getCoordsByName(destName);
  }
  
  // Tìm tọa độ theo tên
  function getCoordsByName(name) {
    if (!name) return null;
    
    // Chuẩn hóa tên (bỏ dấu, lowercase)
    const normalizedName = name.toLowerCase().trim();
    
    // Tìm trong database
    for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
      const normalizedCity = cityName.toLowerCase();
      
      // So khớp chính xác hoặc một phần
      if (normalizedCity.includes(normalizedName) || normalizedName.includes(normalizedCity)) {
        return coords;
      }
      
      // Trường hợp TP.HCM / Sài Gòn
      if (normalizedName.includes('hcm') || normalizedName.includes('sài gòn')) {
        if (normalizedCity.includes('hcm') || normalizedCity.includes('sài gòn')) {
          return coords;
        }
      }
    }
    return null;
  }
  
  // Chi phí giảm cho trẻ em và người cao tuổi
  const CHILD_UNDER_5_DISCOUNT = 1.0;    // Miễn phí hoàn toàn
  const CHILD_6_11_DISCOUNT = 0.30;       // Giảm 30%
  const SENIOR_DISCOUNT = 0.20;            // Giảm 20%

  window.selectTravelTier = function(tier) {
    currentTravelTier = tier;
    
    // Update button styles
    document.querySelectorAll('.travel-tier-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.style.borderColor = '';
      btn.style.background = '';
      btn.style.color = '';
    });
    
    const activeBtn = document.querySelector(`.travel-tier-btn[data-tier="${tier}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      if (tier === 'budget') {
        activeBtn.style.borderColor = '#fbbf24';
        activeBtn.style.background = 'rgba(251,191,36,0.15)';
        activeBtn.style.color = '#fbbf24';
      } else if (tier === 'normal') {
        activeBtn.style.borderColor = '#10b981';
        activeBtn.style.background = 'rgba(16,185,129,0.15)';
        activeBtn.style.color = '#10b981';
      } else if (tier === 'luxury') {
        activeBtn.style.borderColor = '#8b5cf6';
        activeBtn.style.background = 'rgba(139,92,246,0.15)';
        activeBtn.style.color = '#8b5cf6';
      }
    }
    
    updateBudgetEstimate();
  };

  // Update budget estimate - chi tiết theo từng khoản
  function updateBudgetEstimate() {
    const days = parseInt(document.getElementById('days')?.value) || 1;
    const nights = parseInt(document.getElementById('nights')?.value) || (days - 1);
    const adults = parseInt(document.getElementById('adults')?.value) || 0;
    const children = parseInt(document.getElementById('children')?.value) || 0;  // 6-11 tuổi
    const toddlers = parseInt(document.getElementById('toddlers')?.value) || 0; // 0-5 tuổi
    const seniors = parseInt(document.getElementById('seniors')?.value) || 0;
    
    // Lấy chi phí theo tier đã chọn
    const tier = tierCosts[currentTravelTier];
    
    // ===== 1. TÍNH TIỀN PHÒNG KHÁCH SẠN =====
    // Tính số người cần tính phòng (trẻ dưới 5 tuổi ngủ chung miễn phí)
    const payablePeople = adults + children + seniors; // Trẻ 6-11 + NL + NC tuổi
    // Tính số phòng cần thiết (mỗi phòng tối đa 2 người)
    const roomsNeeded = Math.ceil(payablePeople / tier.hotel.maxPerRoom);
    const hotelTotal = tier.hotel.perRoom * roomsNeeded * nights;
    
    // Chi tiết phòng
    const hotelDetail = document.getElementById('hotelDetail');
    if (hotelDetail) {
      hotelDetail.textContent = `${roomsNeeded} phòng × ${formatCurrency(tier.hotel.perRoom)} × ${nights} đêm`;
    }
    
    // ===== 2. TÍNH TIỀN ĂN UỐNG =====
    // Người lớn & trẻ 6-11 & người cao tuổi: ăn đầy đủ
    // Trẻ dưới 5 tuổi: miễn phí ăn
    const mealPeople = adults + children + seniors;
    const foodTotal = tier.food.perAdult * mealPeople * days;
    
    // Chi tiết ăn uống
    const foodDetail = document.getElementById('foodDetail');
    if (foodDetail) {
      let foodDesc = `${mealPeople} người × ${formatCurrency(tier.food.perAdult)} × ${days} ngày`;
      if (toddlers > 0) foodDesc += ` + ${toddlers} trẻ <5tuổi miễn phí`;
      foodDetail.textContent = foodDesc;
    }
    
    // ===== 3. TÍNH TIỀN DI CHUYỂN (DỰA TRÊN GPS) =====
    // Lấy tọa độ khởi hành từ GPS hoặc mặc định Hà Nội
    const formStep2 = document.getElementById('aiPlannerFormStep2');
    const hasGPS = formStep2?.dataset?.lat && formStep2?.dataset?.lon;
    const depLat = parseFloat(formStep2?.dataset?.lat) || 21.0285; // Mặc định Hà Nội
    const depLng = parseFloat(formStep2?.dataset?.lon) || 105.8542;
    
    // Lấy tọa độ điểm đến
    const destCoords = getDestinationCoords();
    const destLat = destCoords?.lat || 16.0544; // Mặc định Đà Nẵng
    const destLng = destCoords?.lng || 108.2022;
    
    // Tính khoảng cách
    const distanceKm = calculateDistance(depLat, depLng, destLat, destLng);
    const transportTotal = calculateTransportCost(distanceKm, currentTravelTier);
    
    const transportDetail = document.getElementById('transportDetail');
    const transportIcon = document.getElementById('transportIcon');
    const transportRoute = document.getElementById('transportRoute');
    
    // Lấy tên điểm đến
    let destName = 'Điểm đến';
    const selectedDests = window.selectedDestinations || window.selectedDestNames || [];
    if (selectedDests.length > 0) {
      destName = typeof selectedDests[0] === 'object' 
        ? (selectedDests[0].name || selectedDests[0].destination || 'Điểm đến')
        : selectedDests[0];
    } else {
      const destInput = document.getElementById('dest');
      if (destInput?.value) destName = destInput.value;
    }
    
    // Lấy tên điểm khởi hành
    const depName = hasGPS ? (formStep2?.dataset?.departureName || 'Vị trí của bạn') : 'Hà Nội (mặc định)';
    
    // Hiển thị tuyến đường
    if (transportRoute) {
      transportRoute.textContent = `📍 ${depName} → ${destName}`;
    }
    
    // Hiển thị chi tiết và icon
    if (transportDetail) {
      if (distanceKm <= 5) {
        transportDetail.textContent = '📍 Cùng khu vực - Di chuyển nội bộ (Grab, xe máy)';
      } else if (distanceKm > 300) {
        transportDetail.textContent = `✈️ Khoảng ${Math.round(distanceKm)}km - Máy bay khứ hồi`;
      } else if (distanceKm > 100) {
        transportDetail.textContent = `🚗 Khoảng ${Math.round(distanceKm)}km - Ô tô cao tốc (khứ hồi)`;
      } else {
        transportDetail.textContent = `🛵 Khoảng ${Math.round(distanceKm)}km - Xe máy/Grab (khứ hồi)`;
      }
    }
    if (transportIcon) {
      if (distanceKm <= 5) transportIcon.textContent = '🏠';
      else if (distanceKm > 300) transportIcon.textContent = '✈️';
      else if (distanceKm > 100) transportIcon.textContent = '🚗';
      else transportIcon.textContent = '🛵';
    }
    
    // ===== 4. TÍNH TIỀN VÉ THAM QUAN =====
    // Người lớn: 100%, Trẻ 6-11: giảm 30%, Trẻ <5: miễn phí, Người cao tuổi: giảm 20%
    const ticketAdults = tier.ticket * adults * days;
    const ticketChildren = tier.ticket * (1 - CHILD_6_11_DISCOUNT) * children * days;
    const ticketSeniors = tier.ticket * (1 - SENIOR_DISCOUNT) * seniors * days;
    const ticketToddlers = 0; // Miễn phí
    const ticketTotal = ticketAdults + ticketChildren + ticketSeniors + ticketToddlers;
    
    const ticketDetail = document.getElementById('ticketDetail');
    if (ticketDetail) {
      let parts = [];
      if (adults > 0) parts.push(`NL: ${formatCurrency(tier.ticket)}×${adults}×${days}`);
      if (children > 0) parts.push(`6-11t: -30%`);
      if (seniors > 0) parts.push(`NC: -20%`);
      if (toddlers > 0) parts.push(`<5t: miễn phí`);
      ticketDetail.textContent = parts.join(' | ');
    }
    
    // ===== 5. TÍNH TIỀN GIẢI TRÍ & ĐỒ UỐNG =====
    // Tất cả mọi người đều tính (trẻ dưới 5 giảm 50%)
    const totalPeople = adults + children + toddlers + seniors;
    
    const entertainAdults = tier.entertain * (adults + seniors + children) * days;
    const entertainToddlers = tier.entertain * 0.5 * toddlers * days;
    const entertainTotal = entertainAdults + entertainToddlers;
    
    const entertainDetail = document.getElementById('entertainDetail');
    if (entertainDetail) {
      let entertainDesc = `Người lớn: ${formatCurrency(tier.entertain)} × ${days} ngày`;
      if (toddlers > 0) entertainDesc += ` + Trẻ nhỏ -50%`;
      entertainDetail.textContent = entertainDesc;
    }
    
    // ===== TÍNH CHI PHÍ ĐỊA ĐIỂM ĐÃ CHỌN =====
    const spotsCost = calculateSelectedSpotsCost();
    let spotsGrandTotal = 0;
    const spotsCostSection = document.getElementById('selectedSpotsCostSection');
    const spotsTotalEl = document.getElementById('spotsTotal');
    const spotsDetailEl = document.getElementById('spotsDetail');
    const spotsListEl = document.getElementById('spotsList');
    
    if (spotsCost.spotCount > 0) {
      if (spotsCostSection) spotsCostSection.style.display = 'block';
      
      // Chi phí địa điểm cho tất cả mọi người
      const spotsPerPerson = spotsCost.totalTicket + spotsCost.totalFood;
      spotsGrandTotal = spotsPerPerson * totalPeople;
      
      // Hiển thị
      if (spotsTotalEl) {
        spotsTotalEl.textContent = formatCurrency(spotsGrandTotal);
      }
      if (spotsDetailEl) {
        let detail = `${spotsCost.spotCount} địa điểm × ${totalPeople} người`;
        if (spotsCost.totalTicket > 0) detail += ` | Vé: ${formatCurrency(spotsCost.totalTicket)}/ng`;
        if (spotsCost.totalFood > 0) detail += ` | Ăn: ${formatCurrency(spotsCost.totalFood)}/ng`;
        spotsDetailEl.textContent = detail;
      }
      if (spotsListEl) {
        const spotNames = (window.selectedAttractionData || []).map(s => s.name).join(', ');
        spotsListEl.textContent = spotNames.substring(0, 100) + (spotNames.length > 100 ? '...' : '');
      }
    } else {
      if (spotsCostSection) spotsCostSection.style.display = 'none';
    }
    
    // ===== TỔNG HỢP =====
    const grandTotal = hotelTotal + foodTotal + transportTotal + ticketTotal + entertainTotal + spotsGrandTotal;
    const perPerson = totalPeople > 0 ? Math.round(grandTotal / totalPeople) : 0;
    
    // Cập nhật DOM
    document.getElementById('hotelTotal').textContent = formatCurrency(hotelTotal);
    document.getElementById('foodTotal').textContent = formatCurrency(foodTotal);
    document.getElementById('transportTotal').textContent = formatCurrency(transportTotal);
    document.getElementById('ticketTotal').textContent = formatCurrency(ticketTotal);
    document.getElementById('entertainTotal').textContent = formatCurrency(entertainTotal);
    
    // Tổng cộng
    document.getElementById('totalBudget').textContent = formatCurrency(grandTotal);
    document.getElementById('perPersonBudget').textContent = formatCurrency(perPerson);
    
    // Label thời gian
    const tripLabel = document.getElementById('tripDurationLabel');
    if (tripLabel) {
      tripLabel.textContent = `${days} ngày ${nights} đêm`;
    }
    
    // Tóm tắt thành viên
    const membersSummary = document.getElementById('membersSummary');
    if (membersSummary) {
      let parts = [];
      if (adults > 0) parts.push(`${adults} NL`);
      if (children > 0) parts.push(`${children} TE`);
      if (toddlers > 0) parts.push(`${toddlers} TN`);
      if (seniors > 0) parts.push(`${seniors} NCT`);
      membersSummary.textContent = `${parts.join(' + ')} = ${totalPeople} người`;
    }
  }

  // Format currency
  function formatCurrency(amount) {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1) + 'M';
    }
    return amount.toLocaleString('vi-VN');
  }

  // Location functions
  let locationMap = null;
  let locationMarker = null;

  window.getCurrentLocation = function() {
    if (!navigator.geolocation) {
      if (window.WanderToast) {
        window.WanderToast.warning("Trình duyệt không hỗ trợ định vị");
      }
      return;
    }
    
    if (window.WanderToast) {
      window.WanderToast.info("📍 Đang lấy vị trí của bạn...");
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Show map container
        const mapContainer = document.getElementById('locationMapContainer');
        if (mapContainer) mapContainer.style.display = 'block';
        
        // Initialize or update map
        await initLocationMap(lat, lon);
        
        // Get address from coordinates
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await response.json();
          const address = data.display_name || `Vị trí (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
          
          document.getElementById('selectedLocationDisplay').style.display = 'flex';
          document.getElementById('selectedLocationText').textContent = address;
          document.getElementById('departureLocation').value = address;
          
          // Store in data attribute
          document.getElementById('aiPlannerFormStep2').dataset.lat = lat;
          document.getElementById('aiPlannerFormStep2').dataset.lon = lon;
          document.getElementById('aiPlannerFormStep2').dataset.departureName = address.split(',')[0]; // Lấy phần đầu của địa chỉ
          
          if (window.WanderToast) {
            window.WanderToast.success("Đã xác định vị trí!");
          }
          
          // Cập nhật chi phí di chuyển sau khi có GPS
          setTimeout(() => updateBudgetEstimate(), 100);
        } catch (err) {
          console.error("Error getting address:", err);
          document.getElementById('selectedLocationDisplay').style.display = 'flex';
          document.getElementById('selectedLocationText').textContent = `Vị trí (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (window.WanderToast) {
          window.WanderToast.warning("Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí.");
        }
      },
      { timeout: 10000 }
    );
  };

  window.toggleManualLocation = function() {
    const manualInput = document.getElementById('manualLocationInput');
    const mapContainer = document.getElementById('locationMapContainer');
    
    if (manualInput) {
      manualInput.style.display = manualInput.style.display === 'none' ? 'block' : 'none';
    }
    if (mapContainer) {
      mapContainer.style.display = 'none';
    }
  };

  async function initLocationMap(lat, lon) {
    const mapDiv = document.getElementById('locationMap');
    if (!mapDiv) return;
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error("Leaflet not loaded");
      return;
    }
    
    if (locationMap) {
      locationMap.setView([lat, lon], 13);
    } else {
      locationMap = L.map('locationMap').setView([lat, lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(locationMap);
      
      // Click handler for map
      locationMap.on('click', async (e) => {
        const { lat: clickLat, lng: clickLon } = e.latlng;
        
        if (locationMarker) {
          locationMarker.setLatLng(e.latlng);
        } else {
          locationMarker = L.marker(e.latlng).addTo(locationMap);
        }
        
        // Get address
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLon}`);
          const data = await response.json();
          const address = data.display_name || `Vị trí (${clickLat.toFixed(4)}, ${clickLon.toFixed(4)})`;
          
          document.getElementById('selectedLocationDisplay').style.display = 'flex';
          document.getElementById('selectedLocationText').textContent = address;
          document.getElementById('departureLocation').value = address;
          
          document.getElementById('aiPlannerFormStep2').dataset.lat = clickLat;
          document.getElementById('aiPlannerFormStep2').dataset.lon = clickLon;
        } catch (err) {
          console.error("Error getting address:", err);
        }
      });
    }
    
    if (locationMarker) {
      locationMarker.setLatLng([lat, lon]);
    } else {
      locationMarker = L.marker([lat, lon]).addTo(locationMap);
    }
  }

  // Submit form from Step 2 to Wizard
  window.submitFormToWizard = function() {
    // Get all form data from Step 2
    const dest = document.getElementById('dest')?.value || '';
    const days = parseInt(document.getElementById('days')?.value) || 1;
    const nights = parseInt(document.getElementById('nights')?.value) || (days - 1);
    const companion = document.getElementById('companion')?.value || '';
    const budget = document.getElementById('budget')?.value || '';
    const additionalInfo = document.getElementById('additionalInfo')?.value || '';
    const tripDate = document.getElementById('tripDate')?.value || '';
    const departureTime = document.getElementById('departureTime')?.value || '08:00';
    
    // Get member counts
    const adults = parseInt(document.getElementById('adults')?.value) || 0;
    const children = parseInt(document.getElementById('children')?.value) || 0;
    const toddlers = parseInt(document.getElementById('toddlers')?.value) || 0;
    const seniors = parseInt(document.getElementById('seniors')?.value) || 0;
    const totalMembers = adults + children + toddlers + seniors;
    
    // Get departure location
    const departureLocation = document.getElementById('departureLocation')?.value || '';
    const formStep2 = document.getElementById('aiPlannerFormStep2');
    const depLat = formStep2?.dataset?.lat || '';
    const depLon = formStep2?.dataset?.lon || '';

    // Get selected styles/sessions
    const selectedStyles = [];
    document.querySelectorAll('.style-chip[data-style].active').forEach(chip => {
      selectedStyles.push(chip.dataset.style);
    });
    const selectedSessions = [];
    document.querySelectorAll('.style-chip[data-session].active').forEach(chip => {
      selectedSessions.push(chip.dataset.session);
    });

    // Prepare data for Smart Wizard
    const formData = {
      destination: dest,
      days: days,
      nights: nights,
      companion: companion,
      budget: budget,
      additionalInfo: additionalInfo,
      tripDate: tripDate,
      departureTime: departureTime,
      styles: selectedStyles.join(', '),
      sessions: selectedSessions.join(', '),
      // Member data
      adults: adults,
      children: children,
      toddlers: toddlers,
      seniors: seniors,
      totalMembers: totalMembers,
      travelTier: currentTravelTier,
      // Departure location
      departureLocation: departureLocation,
      departureLat: depLat,
      departureLon: depLon,
      // Selected destinations from Step 1
      selectedDestinations: window.selectedDestinations ? JSON.stringify(window.selectedDestinations) : ''
    };

    console.log("📝 [Form Step 2] Submitting to Wizard:", formData);

    // Check if destination is filled
    if (!dest && !window.selectedDestinations?.length) {
      if (window.WanderToast) {
        window.WanderToast.warning("Vui lòng chọn điểm đến trước!");
      } else {
        alert("Vui lòng chọn điểm đến trước!");
      }
      switchFormStep(1);
      return;
    }

    // Start Smart Wizard with this data
    if (window.SmartWizard && typeof window.SmartWizard.start === 'function') {
      window.SmartWizard.start(formData);
    } else {
      // Fallback: directly trigger form submission
      const form = document.getElementById('aiPlannerFormStep2') || document.getElementById('aiPlannerForm');
      if (form) {
        // Create hidden fields and submit
        Object.entries(formData).forEach(([key, value]) => {
          let input = form.querySelector(`[name="${key}"]`);
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            form.appendChild(input);
          }
          input.value = value;
        });
        
        // Trigger the original submit flow
        if (typeof window.doGenerate === 'function') {
          window.doGenerate(formData);
        } else {
          // Try to trigger btnStartSmartWizard click behavior
          const wizardBtn = document.getElementById('btnStartSmartWizard');
          if (wizardBtn) {
            wizardBtn.click();
          }
        }
      }
    }
  };

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
    const stepDiscovery = document.getElementById('stepDiscovery');
    const stepCompare = document.getElementById('stepCompare');
    const formStepNav = document.getElementById('formStepNav');

    function switchPath(activeBtn, targetStepId) {
      // Clear active class from all mode buttons
      [btnModeForm, btnModeDiscovery, btnModeCompare].forEach(btn => btn?.classList.remove('active'));
      activeBtn.classList.add('active');

      // Hide ALL steps/sections first
      // Form steps (formStep1, formStep2)
      const formStep1 = document.getElementById('formStep1');
      const formStep2 = document.getElementById('formStep2');
      if (formStep1) formStep1.style.display = 'none';
      if (formStep2) formStep2.style.display = 'none';
      
      // Other paths
      if (stepDiscovery) stepDiscovery.style.display = 'none';
      if (stepSmartWizard) stepSmartWizard.style.display = 'none';
      if (stepCompare) stepCompare.style.display = 'none';
      
      // Form step nav (only show for Form mode)
      if (formStepNav) formStepNav.style.display = 'none';

      // Reset comparison mode visuals if switching away from compare
      const container = document.getElementById('timelineContent');
      if (container) container.classList.remove('comparison-mode-active');
      const saveBtn = document.getElementById('btnSaveTrip');
      if (saveBtn) saveBtn.style.display = 'inline-flex';

      // Show target step based on which tab was clicked
      if (targetStepId === 'stepBasic' || targetStepId === 'formStep1') {
        // Form Mode - show formStep1 (Step 1: Chọn điểm đến)
        if (formStepNav) formStepNav.style.display = 'flex';
        if (formStep1) {
          formStep1.style.display = 'block';
          formStep1.style.display = ''; // Remove inline style to use CSS
        }
        // Reset to step 1
        switchFormStep(1);
      } else if (targetStepId === 'stepDiscovery') {
        // Discovery Mode
        if (stepDiscovery) stepDiscovery.style.display = 'flex';
        if (discoveryHistory.length === 0 && discoveryMessages.children.length === 0) {
          addDiscoveryBubble("Chào bạn! Tôi là WanderAI. Hãy cho tôi biết ngân sách và sở thích, tôi sẽ gợi ý cho bạn nhé! ✨", "ai");
          renderDiscoverySuggestions();
        }
      } else if (targetStepId === 'stepCompare') {
        // Compare Mode
        if (stepCompare) stepCompare.style.display = 'flex';
        if (typeof window.loadSavedTripsForComparison === 'function') {
          window.loadSavedTripsForComparison();
        }
      }
    }

    btnModeForm.addEventListener('click', () => {
      switchPath(btnModeForm, 'stepBasic');
    });

    btnModeDiscovery.addEventListener('click', () => {
      switchPath(btnModeDiscovery, 'stepDiscovery');
    });

    if (btnModeCompare) {
      btnModeCompare.addEventListener('click', () => {
        switchPath(btnModeCompare, 'stepCompare');
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

      // Hide form steps and show wizard
      const formStep1 = document.getElementById('formStep1');
      const formStep2 = document.getElementById('formStep2');
      const formStepNav = document.getElementById('formStepNav');
      const stepDiscovery = document.getElementById('stepDiscovery');
      const stepCompare = document.getElementById('stepCompare');
      
      if (formStepNav) formStepNav.style.display = 'none';
      if (formStep1) formStep1.style.display = 'none';
      if (formStep2) formStep2.style.display = 'none';
      if (stepDiscovery) stepDiscovery.style.display = 'none';
      if (stepCompare) stepCompare.style.display = 'none';
      if (stepSmartWizard) stepSmartWizard.style.display = 'flex';
      
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

  function formatCost(val) {
    if (val === undefined || val === null || val === '') return '3.500.000 VNĐ';
    let str = String(val).trim();
    if (/^\d+$/.test(str)) {
      const num = Number(str);
      if (num < 100) return num + ' Triệu VNĐ';
      return num.toLocaleString('vi-VN') + ' VNĐ';
    }
    if (!str.toLowerCase().includes('vnđ') && !str.toLowerCase().includes('vnd') && !str.toLowerCase().includes('đ') && !str.toLowerCase().includes('triệu')) {
      str += ' VNĐ';
    }
    return str;
  }

  function formatNameAndCost(str) {
    if (!str) return 'Khách sạn / Homestay trung tâm';
    // Format các số lớn từ 5 chữ số trở lên thành định dạng tiền tệ (VD: 3500000 -> 3.500.000 VNĐ)
    return str.replace(/\b(\d{5,})\b/g, (match) => {
      return Number(match).toLocaleString('vi-VN') + ' VNĐ';
    });
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

    let wTemp = weather ? Number(weather.temp) : 28;
    let wCond = weather ? weather.condition : 'Nắng ấm / Mát mẻ';
    const cleanD = String(dest || "").split(',')[0].trim();
    if (weather && wTemp < 18 && !cleanD.toLowerCase().includes('sapa') && !cleanD.toLowerCase().includes('đà lạt')) {
      wTemp = Math.floor(Math.random() * 5) + 27; // 27°C - 31°C cho khu vực đồng bằng/biển
    }

    const aiHotelRaw = plan.accommodationSuggestion ? plan.accommodationSuggestion.nameAndCost : '';
    let aiHName = aiHotelRaw ? aiHotelRaw.split('-')[0].split('(')[0].replace(/Khách sạn/i, '').replace(/Resort/i, '').replace(/Homestay/i, '').trim() : '';
    if (!aiHName || aiHName.toLowerCase() === 'trung tâm') aiHName = cleanD;

    return `
      <div class="itinerary-column-wrapper">
        <div class="timeline-header-premium-v2" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 78, 59, 0.2)); border-left: 4px solid var(--accent);">
          <div class="timeline-header-content">
            <div style="display:flex; justify-content: space-between; align-items: center;">
               <div class="destination-badge-v2" style="background: var(--accent); color: white;">📍 ${dest}</div>
               <div style="display:flex; gap: 0.5rem; align-items: center;">
                  ${weather ? `<span class="version-badge" style="background:rgba(59,130,246,0.1); color:#60a5fa; border: 1px solid #3b82f6; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800; display:flex; align-items:center; gap:4px;">☁️ ${wTemp}°C - ${wCond}</span>` : ''}
                  <span class="version-badge" style="background:rgba(255,255,255,0.1); color:var(--accent); border: 1px solid var(--accent); padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800;">✨ AI OPTIMIZED</span>
               </div>
            </div>
            <h2 class="main-itinerary-title-v2" style="font-size: 1.5rem; margin-top: 0.75rem; color: #fff;">${plan.title || `Hành trình ${days} ngày`}</h2>
            <p class="timeline-summary-v2" style="font-size: 0.9rem; line-height: 1.6; color: rgba(255,255,255,0.7);">${plan.tripSummary || plan.summary || 'Kế hoạch du lịch được WanderAI thiết kế riêng cho bạn.'}</p>
          </div>
          
          <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">#KhámPháViệtNam</span>
            <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">#TốiƯuBởiAI</span>
            <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">#DuLịchThôngMinh</span>
            <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">#${cleanD.replace(/\s+/g, '')}</span>
          </div>
          
          <div class="itinerary-stats-grid-v2" style="margin-top: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
              <span class="stat-label-v2" style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 0.5rem;">💰 Dự toán chi phí</span>
              <span class="stat-value-v2" style="color: var(--accent); font-size: 1.25rem; font-weight: 800; display: block;">${formatCost(plan.estimatedCost || plan.totalEstimatedCost)}</span>
            </div>
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
              <span class="stat-label-v2" style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 0.5rem;">🚶 Nhịp độ di chuyển</span>
              <span class="stat-value-v2" style="color: #fff; font-size: 1.1rem; font-weight: 700; display: block;">${plan.pace || 'Vừa phải - Thư thái'}</span>
            </div>
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
              <span class="stat-label-v2" style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 0.5rem;">🎒 Phong cách / Thể loại</span>
              <span class="stat-value-v2" style="color: #38bdf8; font-size: 1.1rem; font-weight: 700; display: block;">${plan.vibe || plan.style || 'Khám phá tự nhiên & Trải nghiệm'}</span>
            </div>
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
              <span class="stat-label-v2" style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 0.5rem;">🚗 Phương tiện đề xuất</span>
              <span class="stat-value-v2" style="color: #f472b6; font-size: 1.1rem; font-weight: 700; display: block;">${plan.transport || plan.bestTransit || 'Ô tô / Xe máy phượt / Đi bộ'}</span>
            </div>
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
              <span class="stat-label-v2" style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 0.5rem;">🌤️ Thời tiết & Khí hậu</span>
              <span class="stat-value-v2" style="color: #fbbf24; font-size: 1.1rem; font-weight: 700; display: block;">${weather ? `${wTemp}°C (${wCond})` : '28°C - 32°C (Nắng đẹp lý tưởng)'}</span>
            </div>
            <div class="stat-box-v2" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); backdrop-filter: blur(10px);">
              <span class="stat-label-v2" style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 0.5rem;">💡 Lời khuyên chuẩn bị</span>
              <span class="stat-value-v2" style="color: #a78bfa; font-size: 1.1rem; font-weight: 700; display: block;">Trang phục thoải mái, kem chống nắng, mũ rộng vành</span>
            </div>
          </div>
        </div>

        <div class="accomm-premium-card" style="margin-top: 2rem; background: linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8)); border: 1px solid rgba(59, 130, 246, 0.3); border-left: 4px solid #3b82f6; padding: 1.75rem; border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 10px 35px rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 2rem;">🏨</span>
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #fff;">GỢI Ý LƯU TRÚ TỔNG HỢP • BỞI WANDER AI</h3>
                <span style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">Đầy đủ lựa chọn từ Bình dân đến Cao cấp tại ${cleanD}</span>
              </div>
            </div>
            <span style="background: rgba(59, 130, 246, 0.25); color: #60a5fa; font-size: 0.75rem; padding: 6px 14px; border-radius: 20px; font-weight: 800; border: 1px solid rgba(59, 130, 246, 0.4);">✨ Tích hợp Google Maps API</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 1.75rem;">
            <!-- AI Đề xuất / Tiêu chuẩn -->
            <div style="background: rgba(59, 130, 246, 0.15); border: 2px solid #3b82f6; padding: 1.25rem; border-radius: 16px; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <span style="position: absolute; top: -12px; right: 16px; background: #3b82f6; color: #fff; font-size: 0.7rem; font-weight: 800; padding: 2px 10px; border-radius: 10px; text-transform: uppercase;">⭐ AI Đề xuất</span>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <span style="font-size: 1.5rem;">${plan.accommodationSuggestion ? (plan.accommodationSuggestion.icon || '🏢') : '🏢'}</span>
                  <span style="font-size: 0.85rem; font-weight: 800; color: #93c5fd; text-transform: uppercase;">Khách sạn / Resort Tiêu chuẩn</span>
                </div>
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; color: #fff; font-weight: 800;">${plan.accommodationSuggestion ? formatNameAndCost(plan.accommodationSuggestion.nameAndCost) : `Khách sạn trung tâm ${cleanD} (~800.000 VNĐ/đêm)`}</h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.85rem; color: rgba(255,255,255,0.85); line-height: 1.5; font-style: italic;">"${plan.accommodationSuggestion ? (plan.accommodationSuggestion.reason || 'Vị trí đắc địa, dịch vụ chuẩn mực và không gian hòa hợp trọn vẹn với trải nghiệm chuyến đi.') : 'Vị trí thuận tiện di chuyển, phòng ốc sạch sẽ, tiện nghi đầy đủ.'}"</p>
              </div>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((aiHName ? aiHName : 'Khách sạn') + ' ' + cleanD)}" target="_blank" style="align-self: flex-start; background: rgba(59, 130, 246, 0.3); color: #93c5fd; padding: 6px 14px; border-radius: 15px; font-size: 0.8rem; font-weight: 700; text-decoration: none; border: 1px solid rgba(59, 130, 246, 0.5); display: inline-flex; align-items: center; gap: 6px;">
                <span>📍 Kiểm tra phòng trên Google Maps</span>
              </a>
            </div>

            <!-- Bình dân / Homestay -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.15); padding: 1.25rem; border-radius: 16px; transition: all 0.3s ease; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <span style="font-size: 1.5rem;">🏡</span>
                  <span style="font-size: 0.85rem; font-weight: 800; color: #10b981; text-transform: uppercase;">Homestay / Bình dân</span>
                </div>
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; color: #fff; font-weight: 800;">Homestay Bản địa (~250.000 - 450.000 VNĐ/đêm)</h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.85rem; color: rgba(255,255,255,0.75); line-height: 1.5; font-style: italic;">"Không gian ấm cúng, thiết kế xinh xắn gần gũi thiên nhiên, cực kỳ phù hợp cho các bạn phượt thủ hoặc nhóm bạn trẻ tối ưu chi phí."</p>
              </div>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Homestay ' + cleanD)}" target="_blank" style="align-self: flex-start; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 6px 14px; border-radius: 15px; font-size: 0.8rem; font-weight: 700; text-decoration: none; border: 1px solid rgba(16, 185, 129, 0.3); display: inline-flex; align-items: center; gap: 6px;">
                <span>📍 Tìm Homestay trên Google Maps</span>
              </a>
            </div>

            <!-- Cao cấp / Resort 5 sao -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.15); padding: 1.25rem; border-radius: 16px; transition: all 0.3s ease; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <span style="font-size: 1.5rem;">👑</span>
                  <span style="font-size: 0.85rem; font-weight: 800; color: #f59e0b; text-transform: uppercase;">Resort & Villa 5★</span>
                </div>
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; color: #fff; font-weight: 800;">Resort Nghỉ dưỡng Thượng hạng (~2.500.000+ VNĐ/đêm)</h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.85rem; color: rgba(255,255,255,0.75); line-height: 1.5; font-style: italic;">"Trải nghiệm nghỉ dưỡng đẳng cấp 5 sao với hồ bơi vô cực, dịch vụ spa trọn gói và tầm nhìn toàn cảnh tuyệt mỹ."</p>
              </div>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Resort 5 sao ' + cleanD)}" target="_blank" style="align-self: flex-start; background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 6px 14px; border-radius: 15px; font-size: 0.8rem; font-weight: 700; text-decoration: none; border: 1px solid rgba(245, 158, 11, 0.3); display: inline-flex; align-items: center; gap: 6px;">
                <span>📍 Khám phá Resort trên Google Maps</span>
              </a>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((aiHName ? (aiHName + ' ') : 'Khách sạn ') + cleanD)}" target="_blank" class="btn" style="padding: 0.85rem 2.25rem; font-size: 1.05rem; border-radius: 30px; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 0.75rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4); transition: all 0.3s ease;">
              <span>📍 Chuyển Trực Tiếp Đến Google Maps Để Xem Phòng & Đặt Ngay</span>
            </a>
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
                  const actName = act.task || act.activity || act.name || '';
                  const actDesc = act.description || act.visualNote || '';
                  const actCost = act.cost || '';
                  const actTransport = act.transport || '';
                  const actRating = parseFloat(act.rating) || 0;
                  const actSession = act.session || '';
                  const actLocation = act.location || '';
                  const actAddress = act.address || act.location || '';
                  const sessionColor = actSession === 'Sáng' ? '#f59e0b' : actSession === 'Chiều' ? '#f97316' : '#818cf8';
                  const sessionEmoji = actSession === 'Sáng' ? '☀️' : actSession === 'Chiều' ? '⛅' : '🌙';
                  const starHtml = actRating > 0 ? Array.from({length: 5}, (_, i) => 
                    i < Math.floor(actRating) ? '★' : (i < actRating ? '½' : '☆')
                  ).join('') : '';
                  const actData = JSON.stringify(act).replace(/'/g, "&apos;").replace(/`/g, '&#96;');
                  let actMapQuery = actLocation || actAddress || actName;
                  if (window.currentDestName && !actMapQuery.toLowerCase().includes(window.currentDestName.toLowerCase())) {
                    actMapQuery += ', ' + window.currentDestName;
                  }
                  return `
                  <div class="premium-activity-card-v2" style="padding:0; background:transparent; border:none; margin-bottom:2rem; display:flex; gap:1.25rem; position:relative;">
                    <!-- Time + Session Column -->
                    <div style="min-width:72px; display:flex; flex-direction:column; align-items:center; padding-top:16px; gap:4px;">
                      <span style="font-weight:900; color:var(--accent); font-size:1rem; letter-spacing:0.5px; line-height:1;">${act.time || '--:--'}</span>
                      ${actSession ? `<span style="font-size:0.65rem; font-weight:700; color:${sessionColor}; background:${sessionColor}18; padding:2px 6px; border-radius:8px; white-space:nowrap;">${sessionEmoji} ${actSession}</span>` : ''}
                    </div>

                    <!-- Content Card - Compact Design -->
                    <div style="flex:1; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:1.25rem; overflow:hidden; transition:all 0.3s ease; box-shadow:0 4px 20px rgba(0,0,0,0.15);" 
                         onmouseenter="this.style.borderColor='rgba(16,185,129,0.3)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 30px rgba(0,0,0,0.25)'"
                         onmouseleave="this.style.borderColor='rgba(255,255,255,0.08)'; this.style.transform=''; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.15)'">
                      
                      <!-- Image Banner (compact) -->
                      <div style="height:140px; position:relative; overflow:hidden;">
                        <img 
                          src="${getVNPhoto(actName, aIdx)}" 
                          alt="${actName}"
                          loading="lazy"
                          style="width:100%; height:100%; object-fit:cover;"
                          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1528127269322-539801943592?w=600&fit=crop';"
                        >
                        <!-- Overlay gradient -->
                        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);"></div>
                        <!-- Location chip on image -->
                        ${actLocation ? `<div style="position:absolute; bottom:8px; left:10px; display:flex; align-items:center; gap:4px; font-size:0.7rem; color:#fff; font-weight:600; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); padding:3px 8px; border-radius:10px; max-width:80%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ${actLocation}</div>` : ''}
                        <!-- Cost badge top-right -->
                        ${actCost ? `<div style="position:absolute; top:8px; right:8px; background:rgba(251,191,36,0.92); color:#000; font-size:0.72rem; font-weight:900; padding:3px 10px; border-radius:10px; backdrop-filter:blur(4px);">💰 ${actCost}</div>` : `<div style="position:absolute; top:8px; right:8px; background:rgba(16,185,129,0.85); color:#fff; font-size:0.72rem; font-weight:900; padding:3px 10px; border-radius:10px;">Miễn phí</div>`}
                        <!-- Source tag -->
                        <div class="content-source-tag" style="position:absolute; top:8px; left:8px; font-size:0.6rem; opacity:0.6;">📸 WanderViet</div>
                      </div>

                      <!-- Info Body -->
                      <div style="padding:1rem 1.1rem 0.9rem;">
                        <!-- Title Row -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; margin-bottom:0.5rem;">
                          <h4 style="font-size:1rem; color:#fff; margin:0; font-weight:800; line-height:1.3; flex:1;">${actName}</h4>
                          ${actRating > 0 ? `<div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px; flex-shrink:0;">
                            <span style="color:#fbbf24; font-size:0.7rem; letter-spacing:1px;">${starHtml}</span>
                            <span style="color:#fbbf24; font-size:0.7rem; font-weight:800;">${actRating}/5</span>
                          </div>` : ''}
                        </div>

                        <!-- Transport badge -->
                        ${actTransport ? `<div style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; color:#60a5fa; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2); padding:3px 10px; border-radius:20px; margin-bottom:0.6rem; font-weight:600;">${actTransport}</div>` : ''}

                        <!-- Description -->
                        ${actDesc ? `<p style="font-size:0.82rem; line-height:1.6; color:rgba(255,255,255,0.65); margin:0 0 0.75rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${actDesc}</p>` : ''}

                        <!-- Action Row -->
                        <div style="display:flex; gap:8px; flex-wrap:wrap; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.06);">
                          <button type="button" 
                            onclick='showActivityDetails(${actData})'
                            style="flex:1; background:var(--accent); border:none; color:#fff; padding:7px 12px; border-radius:20px; font-size:0.78rem; font-weight:700; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 3px 12px rgba(16,185,129,0.3);"
                            onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform=''">
                            🔍 Xem chi tiết & Review
                          </button>
                          <a href="#" 
                            onclick="window.getGPSDirections('${actMapQuery.replace(/'/g, "\\'")}', event)"
                            style="flex:1; background:#1d4ed8; border:none; color:#fff; padding:7px 12px; border-radius:20px; font-size:0.78rem; font-weight:700; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:5px; text-decoration:none; box-shadow:0 3px 12px rgba(29,78,216,0.3);"
                            onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform=''">
                            🗺️ GPS
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  ${act.transitToNext ? `
                  <!-- Transit Connection -->
                  <div style="margin: -0.5rem 0 1rem 97px; display:flex; align-items:center; gap:8px; color:#38bdf8; font-size:0.78rem; font-weight:600; background:rgba(56,189,248,0.05); padding:7px 14px; border-radius:20px; border:1px solid rgba(56,189,248,0.15); width:fit-content;">
                     <span style="font-size:0.9rem;">⚡</span>
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

    const actName = act.task || act.activity || act.name || '';
    let mapQuery = act.location || act.address || actName;
    if (window.currentDestName && !mapQuery.toLowerCase().includes(window.currentDestName.toLowerCase())) {
      mapQuery += ', ' + window.currentDestName;
    }
    const query = encodeURIComponent(mapQuery);

    body.innerHTML = `
      <!-- Photo Gallery Grid -->
      <div class="modal-photo-grid" style="padding: 1rem 2rem 0;">
        <div class="modal-photo-item modal-photo-main">
          <img class="ken-burns" src="${getVNPhoto(actName, 0)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1528127269322-539801943592?w=800&fit=crop';">
          <div class="content-source-tag">Nguồn: WanderViet Photography</div>
        </div>
        <div class="modal-photo-item">
          <img class="ken-burns" src="${getVNPhoto(actName + ' nature', 1)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop';">
          <div class="content-source-tag">Nguồn: TripAdvisor User</div>
        </div>
        <div class="modal-photo-item">
          <img class="ken-burns" src="${getVNPhoto(actName + ' culture', 2)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&fit=crop';">
          <div class="content-source-tag">Nguồn: Instagram Community</div>
        </div>
      </div>
      
      <div class="activity-modal-info" style="margin-top: -30px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap: wrap; gap: 10px;">
           <div>
             <h2 class="activity-modal-title" style="margin:0 0 0.5rem; font-size:1.75rem; font-weight:800;">${actName}</h2>
             <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-size:0.9rem; color:var(--text-muted);">
               <span>📍 ${act.address || act.location || actName}</span>
               <span style="color:rgba(255,255,255,0.2);">•</span>
               <div style="display:flex; align-items:center; gap:4px;">
                 <span style="color:#fbbf24; font-size:1rem; letter-spacing:2px;">${Array.from({length: 5}, (_, i) => i < Math.floor(parseFloat(act.rating) || 4.5) ? '★' : (i < (parseFloat(act.rating) || 4.5) ? '½' : '☆')).join('')}</span>
                 <span style="color:#fbbf24; font-weight:800; margin-left:4px;">${parseFloat(act.rating) || 4.5}/5</span>
               </div>
             </div>
           </div>
           <div style="display:flex; gap: 10px; flex-wrap:wrap;">
             ${window.currentWeatherData ? `<span style="background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid rgba(59,130,246,0.3); padding:6px 16px; border-radius:25px; font-weight:800; font-size:0.85rem; display:flex; align-items:center; box-shadow:0 4px 12px rgba(59,130,246,0.15);">☁️ ${window.currentWeatherData.temp}°C - ${window.currentWeatherData.condition}</span>` : ''}
             <span style="background:rgba(251,191,36,0.15); color:#fbbf24; border:1px solid rgba(251,191,36,0.4); padding:6px 16px; border-radius:25px; font-weight:900; font-size:0.85rem; display:flex; align-items:center; box-shadow:0 4px 12px rgba(251,191,36,0.15);">💰 CHI PHÍ: ${act.cost || 'Miễn phí'}</span>
           </div>
        </div>

        <!-- FULL WIDTH MAP SECTION -->
        <div class="full-width-map-section" style="margin-bottom: 2.5rem;">
            <div class="detail-section-title" style="font-size: 1.25rem; margin-top: 1.5rem;">📍 Vị trí & Hướng dẫn di chuyển</div>
            
            <div style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.25); padding: 1.5rem; border-radius: 1.25rem; margin-bottom: 1.5rem; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
               <h4 style="color: var(--accent); margin-top: 0; margin-bottom: 0.5rem; font-size: 1.1rem; display:flex; align-items:center; gap:8px;">
                 <span>🧭 Hướng dẫn di chuyển chi tiết</span>
                 <span style="background:var(--accent); color:#000; font-size:0.7rem; font-weight:900; padding:2px 8px; border-radius:10px; text-transform:uppercase;">AI Gợi ý</span>
               </h4>
               <p style="color: rgba(255,255,255,0.85); font-size: 0.95rem; line-height: 1.6; margin: 0;">
                  Phương tiện tối ưu nhất để đến <strong>${actName}</strong> là <strong>${act.transport || 'Ô tô / Taxi'}</strong>. 
                  Bạn có thể xem trực tiếp vị trí trên bản đồ bên dưới, hoặc nhấn nút <strong>Nhận Chỉ Đường GPS</strong> để mở Google Maps với lộ trình tối ưu từ vị trí hiện tại của bạn.
               </p>
               <div style="margin-top: 1.25rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                 <a href="#" onclick="window.getGPSDirections('${mapQuery.replace(/'/g, "\\'")}', event)" class="btn-open-external-map" style="background: #3b82f6; border:none; color:#fff; display: inline-flex; align-items:center; gap:8px; width: auto; padding: 10px 25px; border-radius: 30px; font-weight:700; text-decoration: none; box-shadow:0 6px 20px rgba(59,130,246,0.3); transition:all 0.2s;" onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform=''">
                    <span>🗺️ Nhận Chỉ Đường GPS</span>
                 </a>
                 <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#fff; font-weight:600;">
                    <span style="color:var(--accent);">🚗</span>
                    <span>${act.transitToNext || 'Khoảng cách ước tính: ~2.5 km'}</span>
                 </div>
               </div>
            </div>

            <div class="map-iframe-wrapper" style="height: 450px; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); width: 100%;">
              <iframe 
                src="https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed" 
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

      // 3. UI - Hide all form steps and other paths
      const formStepNav = document.getElementById('formStepNav');
      const formStep1 = document.getElementById('formStep1');
      const formStep2 = document.getElementById('formStep2');
      const stepDiscovery = document.getElementById('stepDiscovery');
      const stepCompare = document.getElementById('stepCompare');
      
      if (formStepNav) formStepNav.style.display = 'none';
      if (formStep1) formStep1.style.display = 'none';
      if (formStep2) formStep2.style.display = 'none';
      if (stepDiscovery) stepDiscovery.style.display = 'none';
      if (stepCompare) stepCompare.style.display = 'none';
      if (stepSmartWizard) stepSmartWizard.style.display = 'none';
      
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
        const postSave = document.getElementById('postSaveActions');
        if (postSave) postSave.style.display = 'flex';
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

  window.resetAIPlanner = function() {
    document.querySelector('.planner-container')?.classList.remove('show-result');
    const plannerFormCard = document.getElementById('plannerFormCard');
    if (plannerFormCard) plannerFormCard.style.display = 'flex';
    
    // Đưa các step về đúng trạng thái ban đầu
    // Form steps
    const formStep1 = document.getElementById('formStep1');
    const formStep2 = document.getElementById('formStep2');
    const formStepNav = document.getElementById('formStepNav');
    
    if (formStepNav) formStepNav.style.display = 'flex';
    if (formStep1) {
      formStep1.style.display = 'block';
      formStep1.style.display = ''; // Remove inline style
    }
    if (formStep2) formStep2.style.display = 'none';
    
    // Other paths
    const stepDiscovery = document.getElementById('stepDiscovery');
    const stepSmartWizard = document.getElementById('stepSmartWizard');
    const stepCompare = document.getElementById('stepCompare');
    
    if (stepDiscovery) stepDiscovery.style.display = 'none';
    if (stepSmartWizard) stepSmartWizard.style.display = 'none';
    if (stepCompare) stepCompare.style.display = 'none';
    
    // Đặt lại SmartWizard về trạng thái ban đầu (InputArea hiện, ConfirmationArea ẩn)
    const smartConfirmationArea = document.getElementById('smartConfirmationArea');
    if (smartConfirmationArea) smartConfirmationArea.style.display = 'none';
    const smartInputArea = document.getElementById('smartInputArea');
    if (smartInputArea) smartInputArea.style.display = 'flex';

    // Đặt lại các nút chuyển mode trên cùng về active cho "Lập lịch"
    document.querySelectorAll('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
    const btnModeForm = document.getElementById('btnModeForm');
    if (btnModeForm) btnModeForm.classList.add('active');

    const resultContainer = document.getElementById('timelineResult');
    if (resultContainer) resultContainer.style.display = 'none';
    const placeholder = document.getElementById('resultPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
    const btnSaveTrip = document.getElementById('btnSaveTrip');
    if (btnSaveTrip) {
      btnSaveTrip.disabled = false;
      btnSaveTrip.textContent = "♥️ Lưu Lịch Trình Này";
      btnSaveTrip.style.background = "linear-gradient(135deg, #f43f5e, #e11d48)";
      btnSaveTrip.style.display = 'inline-flex';
    }
    const statusEl = document.getElementById('saveTripStatus');
    if (statusEl) statusEl.style.display = 'none';
    const postSave = document.getElementById('postSaveActions');
    if (postSave) postSave.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- VIEW SAVED TRIP LOGIC ---
  const urlParams = new URLSearchParams(window.location.search);
  const isViewMode = urlParams.get('view') === 'true';
  const savedTripJson = sessionStorage.getItem('wander_view_trip');

  if (isViewMode && (savedTripJson || urlParams.get('itinId'))) {
    try {
      const itinId = urlParams.get('itinId');
      
      const processPlan = (plan, destination, days) => {
        // Kích hoạt show-result để CSS hiển thị timelineResult và ẩn formCard
        document.querySelector('.planner-container')?.classList.add('show-result');
        const plannerFormCard = document.getElementById('plannerFormCard');
        if (plannerFormCard) plannerFormCard.style.display = 'none';
        const btnSaveTrip = document.getElementById('btnSaveTrip');
        if (btnSaveTrip) btnSaveTrip.style.display = 'none';

        if (placeholder) placeholder.style.display = 'none';
        if (loader) loader.style.display = 'none';
        
        // Hiển thị vùng kết quả
        if (resultContainer) resultContainer.style.display = 'block';
        if (refineBox) refineBox.style.display = 'block';
        
        // Hiển thị banner View Mode
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
          if (viewModeHeader && viewModeHeader.style.display !== 'none') {
            viewModeHeader.scrollIntoView({ behavior: 'smooth' });
          } else if (resultContainer) {
            resultContainer.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
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

// ================================================================
// Selected Destinations Chips (Simple, non-intrusive)
// ================================================================
window.selectedDestNames = [];

function updateSelectedChips() {
  var container = document.getElementById('selectedDestChips');
  var list = document.getElementById('selectedDestList');
  if (!container || !list) return;

  if (window.selectedDestNames.length === 0) {
    container.style.display = 'none';
  } else {
    container.style.display = 'block';
    list.innerHTML = window.selectedDestNames.map(function(name, idx) {
      return '<span class="selected-dest-chip">' + name + ' <button type="button" class="remove-btn" onclick="removeDestChip(' + idx + ')">×</button></span>';
    }).join('');
  }
}

function addDestChip(name) {
  if (!name || window.selectedDestNames.indexOf(name) !== -1) return;
  window.selectedDestNames.push(name);
  updateSelectedChips();
}

function removeDestChip(idx) {
  if (window.selectedDestNames && window.selectedDestNames.length > idx) {
    window.selectedDestNames.splice(idx, 1);
    updateSelectedChips();
  }
}

// ================================================================
// Map Zoom with GPS
// ================================================================
function openMapZoom() {
  var overlay = document.getElementById('mapZoomOverlay');
  var zoomBody = document.getElementById('mapZoomBody');
  var zoomGps = document.getElementById('mapZoomGps');
  var currentCoords = window.currentMapCoords || [21.0278, 105.8342];
  var cityName = window.currentMapCity || 'Điểm đến';

  // Create container for map
  zoomBody.innerHTML = '<div id="mapZoomContainer" style="height:100%;"></div>';

  // Show GPS info
  zoomGps.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span>📍</span><strong>' + cityName + '</strong></div><div style="margin-top:0.5rem; color:var(--text-muted);">🌐 GPS: <code style="background:rgba(0,0,0,0.2); padding:0.15rem 0.3rem; border-radius:0.25rem;">' + currentCoords[0].toFixed(6) + ', ' + currentCoords[1].toFixed(6) + '</code></div>';

  overlay.classList.add('active');

  // Init Leaflet after modal opens
  setTimeout(function() {
    if (typeof L !== 'undefined') {
      try {
        if (window.mapZoomInstance) {
          window.mapZoomInstance.remove();
        }
        window.mapZoomInstance = L.map('mapZoomContainer', { zoomControl: true, attributionControl: true }).setView(currentCoords, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(window.mapZoomInstance);

        // Add destination marker
        L.marker(currentCoords).addTo(window.mapZoomInstance).bindPopup('<b>' + cityName + '</b>').openPopup();

        // Add user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(pos) {
            var userCoords = [pos.coords.latitude, pos.coords.longitude];
            L.circle(userCoords, { radius: 300, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }).addTo(window.mapZoomInstance);
            L.marker(userCoords, { icon: L.divIcon({ className: 'user-marker', html: '📍', iconSize: [24, 24] }) }).addTo(window.mapZoomInstance).bindPopup('📍 Vị trí của bạn');
            L.polyline([userCoords, currentCoords], { color: '#60a5fa', dashArray: '5, 10', weight: 2 }).addTo(window.mapZoomInstance);
          }, function() {});
        }
      } catch (e) {
        zoomBody.innerHTML = '<p style="color:#fff; text-align:center; padding:3rem;">Không thể tải bản đồ</p>';
      }
    } else {
      zoomBody.innerHTML = '<p style="color:#fff; text-align:center; padding:3rem;">Bản đồ không khả dụng</p>';
    }
  }, 100);
}

function closeMapZoom(e) {
  if (!e || e.target === document.getElementById('mapZoomOverlay')) {
    document.getElementById('mapZoomOverlay').classList.remove('active');
  }
}

// ESC to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeMapZoom();
});
