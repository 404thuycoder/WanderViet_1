const fs = require('fs');
const path = require('path');

const htmlFile = path.join(__dirname, '../apps/user-web/navigator.html');
let html = fs.readFileSync(htmlFile, 'utf8');

const oldSelector = `        <!-- Tìm kiếm (Sidebar version) -->
        <div id="target-selector" class="sidebar-search">
          <div class="search-title">📍 Địa điểm tham quan</div>
          <div class="search-box-sidebar">
            <input type="text" id="target-input" placeholder="Địa điểm hành trình" readonly style="cursor: default; background: rgba(0,0,0,0.02);" />
          </div>
          <ul id="autocomplete-list" class="autocomplete-list-sidebar" hidden></ul>
          
          <div class="quick-targets-sidebar" id="quick-targets-row">
            <button class="chip" data-lat="21.028511" data-lng="105.804817">Hà Nội</button>
            <button class="chip" data-lat="16.054407" data-lng="108.202167">Đà Nẵng</button>
          </div>
        </div>`;

const newSelector = `        <!-- Tìm kiếm (Sidebar version) -->
        <div id="target-selector" class="sidebar-search">
          <div class="search-title" style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">ĐIỂM ĐÓN CỦA BẠN</div>
          <div class="search-box-sidebar" style="background: rgba(0,0,0,0.02); margin-bottom: 15px;">
            <span style="color: #ef4444; margin-right: 8px;">📍</span>
            <input type="text" id="pickup-input" placeholder="Đang lấy GPS..." readonly style="cursor: default; background: transparent; padding: 0; width: 100%; border: none; outline: none; font-weight: 600; color: #64748b;" />
          </div>

          <div class="search-title" style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">ĐIỂM TRẢ / ĐIỂM ĐẾN</div>
          <div class="search-box-sidebar" style="position: relative;">
            <span style="color: #6366f1; margin-right: 8px;">📍</span>
            <input type="text" id="target-input" placeholder="Ví dụ: Sân bay Nội Bài hoặc Tên khách sạn..." autocomplete="off" style="padding: 0; width: 100%; border: none; outline: none; font-weight: 600;" />
          </div>
          <ul id="autocomplete-list" class="autocomplete-list-sidebar" hidden></ul>
          
          <div class="quick-targets-sidebar" id="quick-targets-row" style="margin-top: 15px;">
            <button class="chip" data-lat="21.028511" data-lng="105.804817">Hà Nội</button>
            <button class="chip" data-lat="16.054407" data-lng="108.202167">Đà Nẵng</button>
          </div>
        </div>`;

if (html.includes('📍 Địa điểm tham quan')) {
  html = html.replace(oldSelector, newSelector);
  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log('navigator.html patched.');
} else {
  console.log('navigator.html already patched or pattern not found.');
}

const jsFile = path.join(__dirname, '../apps/user-web/js/navigator.js');
let js = fs.readFileSync(jsFile, 'utf8');

// Add pickupInput to els
if (!js.includes('pickupInput: document.getElementById(\'pickup-input\')')) {
  js = js.replace("targetInput: document.getElementById('target-input'),", 
                  "targetInput: document.getElementById('target-input'),\n  pickupInput: document.getElementById('pickup-input'),");
}

// Update GPS location display logic inside startGPS
const gpsUpdateLogic = `    // Cập nhật marker
    if (!State.userMarkerObj) {`;

const newGpsUpdateLogic = `    if (els.pickupInput) {
      els.pickupInput.value = "GPS: " + crd.latitude.toFixed(5) + ", " + crd.longitude.toFixed(5) + " (Sẵn sàng)";
    }
    // Cập nhật marker
    if (!State.userMarkerObj) {`;

if (js.includes(gpsUpdateLogic) && !js.includes('els.pickupInput.value = "GPS: "')) {
  js = js.replace(gpsUpdateLogic, newGpsUpdateLogic);
}

// Add autocomplete logic at the bottom of the file
const autocompleteScript = `
// =================== AUTOCOMPLETE CHO TARGET INPUT ===================
(function initTargetAutocomplete() {
  let timeoutId;
  if (!els.targetInput || !els.autocomplete) return;

  // Lấy placeId từ URL (nếu có) để set giá trị mặc định cho destination
  const urlParams = new URLSearchParams(window.location.search);
  const initialPlaceId = urlParams.get('placeId') || urlParams.get('id');

  // Khôi phục hành vi cũ: nếu có targetLoc trong URL
  const targetLat = urlParams.get('lat');
  const targetLng = urlParams.get('lng');
  const targetName = urlParams.get('destName') || urlParams.get('name');

  if (targetLat && targetLng && targetName) {
    els.targetInput.value = targetName;
  } else if (initialPlaceId) {
    // Để logic init load địa điểm xử lý
  }

  els.targetInput.removeAttribute('readonly');
  els.targetInput.style.cursor = 'text';
  els.targetInput.style.background = 'transparent';

  els.targetInput.addEventListener('input', function (e) {
    clearTimeout(timeoutId);
    const query = e.target.value.trim();
    
    if (query.length < 3) {
      els.autocomplete.hidden = true;
      return;
    }
    
    timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query + ', Vietnam')}&limit=5\`);
        const data = await res.json();
        
        els.autocomplete.innerHTML = '';
        if (data && data.length > 0) {
          data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = \`<i class="fas fa-map-marker-alt"></i> \${item.display_name.split(',')[0]} <small>\${item.display_name.split(',').slice(1,3).join(',')}</small>\`;
            li.addEventListener('click', () => {
              els.targetInput.value = item.display_name.split(',')[0];
              els.autocomplete.hidden = true;
              setTarget(parseFloat(item.lat), parseFloat(item.lon));
              if (State.userLoc) {
                fetchOSRMRoute();
              }
            });
            els.autocomplete.appendChild(li);
          });
          els.autocomplete.hidden = false;
        } else {
          els.autocomplete.hidden = true;
        }
      } catch (err) {
        console.error('Autocomplete err:', err);
      }
    }, 500);
  });

  document.addEventListener('click', function(e) {
    if (els.autocomplete && !els.autocomplete.contains(e.target) && e.target !== els.targetInput) {
      els.autocomplete.hidden = true;
    }
  });
})();
`;

if (!js.includes('AUTOCOMPLETE CHO TARGET INPUT')) {
  js += autocompleteScript;
}

// BUMP VERSION IN HTML TO RELOAD CACHE
if (html.includes('navigator.js?v=1776819067182')) {
  html = html.replace('navigator.js?v=1776819067182', 'navigator.js?v=2.0.0');
  fs.writeFileSync(htmlFile, html, 'utf8');
} else if (html.includes('navigator.js?v=')) {
  html = html.replace(/navigator\.js\?v=[0-9.]+/, 'navigator.js?v=2.0.1');
  fs.writeFileSync(htmlFile, html, 'utf8');
}

fs.writeFileSync(jsFile, js, 'utf8');
console.log('navigator.js patched.');
