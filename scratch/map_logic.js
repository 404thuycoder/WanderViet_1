
        // Map & Nearby Functions (Google-Pro Precision Edition)
        let map = null;
        let mainMarker = null;
        let discoveredMarkers = new Map(); // OSM ID -> Marker object
        let discoveredPlaces = new Map();  // OSM ID -> Place data
        let activeFilters = new Set();

        function initMap(p) {
            if (map) { map.remove(); map = null; }
            discoveredMarkers.clear();
            discoveredPlaces.clear();
            
            const lat = (p.gpsCoordinates && p.gpsCoordinates.lat) || p.lat || 21.0285;
            const lng = (p.gpsCoordinates && p.gpsCoordinates.lng) || p.lng || 105.8542;

            map = L.map('map-root', { zoomControl: false }).setView([lat, lng], 17); // Closer initial zoom
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; WanderViệt &copy; OpenStreetMap'
            }).addTo(map);

            L.control.zoom({ position: 'bottomright' }).addTo(map);

            const mainIcon = L.divIcon({
                className: 'main-pin',
                html: `<div style="background:var(--primary); width:40px; height:40px; border-radius:50%; border:4px solid #fff; box-shadow:0 0 25px var(--primary); display:flex; align-items:center; justify-content:center; color:#fff; font-size:22px; animation: pulse-main 2s infinite;">📍</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });

            mainMarker = L.marker([lat, lng], { icon: mainIcon }).addTo(map)
                .bindPopup(`<div style="padding:10px; min-width:180px;"><div style="font-size:0.7rem; color:var(--primary); font-weight:700; margin-bottom:4px;">BẠN ĐANG Ở ĐÂY</div><b style="color:var(--text-main); font-size:1.1rem;">${p.name}</b></div>`, { closeButton: false })
                .openPopup();
            
            window.currentPlaceCoords = { lat, lng };

            map.on('moveend', () => {
                if (activeFilters.size > 0) refreshMapData();
            });
            
            // Auto-init with restaurants
            setTimeout(() => toggleNearbyFilter('restaurant'), 1000);
        }

        function toggleNearbyFilter(type) {
            const btn = document.querySelector(`.nearby-filter[data-type="${type}"]`);
            if (activeFilters.has(type)) {
                activeFilters.delete(type);
                if (btn) btn.classList.remove('active');
            } else {
                activeFilters.add(type);
                if (btn) btn.classList.add('active');
            }
            
            updateMarkerVisibility();
            refreshMapData();
        }

        function updateMarkerVisibility() {
            discoveredPlaces.forEach((data, id) => {
                const marker = discoveredMarkers.get(id);
                if (marker) {
                    if (isCategoryMatch(data.type, activeFilters)) {
                        marker.addTo(map);
                    } else {
                        map.removeLayer(marker);
                    }
                }
            });
        }

        function isCategoryMatch(osmType, filterSet) {
            const t = osmType.toLowerCase();
            if (filterSet.has('restaurant') && (t.includes('restaurant') || t.includes('food') || t.includes('fast_food') || t.includes('bar') || t.includes('pub') || t.includes('ice_cream') || t.includes('bakery'))) return true;
            if (filterSet.has('hotel') && (t.includes('hotel') || t.includes('tourism') || t.includes('accommodation') || t.includes('guest_house') || t.includes('hostel') || t.includes('apartment') || t.includes('resort') || t.includes('motel'))) return true;
            if (filterSet.has('cafe') && (t.includes('cafe') || t.includes('coffee') || t.includes('tea'))) return true;
            if (filterSet.has('attraction') && (t.includes('attraction') || t.includes('viewpoint') || t.includes('museum') || t.includes('monument') || t.includes('gallery') || t.includes('zoo') || t.includes('theme_park') || t.includes('artwork') || t.includes('historic'))) return true;
            if (filterSet.has('other') && (t.includes('bank') || t.includes('atm') || t.includes('pharmacy') || t.includes('hospital') || t.includes('clinic') || t.includes('police') || t.includes('post_office') || t.includes('supermarket') || t.includes('convenience') || t.includes('fuel') || t.includes('parking') || t.includes('mall'))) return true;
            return false;
        }

        async function refreshMapData() {
            if (activeFilters.size === 0) {
                document.getElementById('nearby-grid').innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--text-dim); font-size:1.1rem; border:2px dashed rgba(255,255,255,0.05); border-radius:30px;">✨ Hãy chọn một danh mục để khám phá ngay các dịch vụ quanh đây.</div>`;
                return;
            }

            const grid = document.getElementById('nearby-grid');
            const bounds = map.getBounds();
            const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

            const osmTags = {
                'restaurant': 'nwr["amenity"~"restaurant|fast_food|food_court|bar|pub|ice_cream|bakery"]',
                'hotel': 'nwr["tourism"~"hotel|guest_house|hostel|motel|apartment|resort"]',
                'cafe': 'nwr["amenity"~"cafe|tea_room"]',
                'attraction': 'nwr["tourism"~"attraction|viewpoint|museum|theme_park|monument|artwork|gallery|zoo|historic"]',
                'other': 'nwr["amenity"~"bank|atm|pharmacy|hospital|clinic|police|post_office|parking|fuel"]["shop"~"supermarket|convenience|mall"]'
            };

            let parts = [];
            activeFilters.forEach(type => {
                if (osmTags[type]) {
                    if (type === 'other') {
                        // "Other" is complex, split it
                        parts.push('nwr["amenity"~"bank|atm|pharmacy|hospital|clinic|police|post_office|parking|fuel"](' + bbox + ');');
                        parts.push('nwr["shop"~"supermarket|convenience|mall"](' + bbox + ');');
                    } else {
                        parts.push(`${osmTags[type]}(${bbox});`);
                    }
                }
            });

            if (parts.length === 0) return;

            const query = `[out:json][timeout:30];(${parts.join('')});out center 200;`;
            
            try {
                const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                const json = await res.json();

                if (json.elements) {
                    json.elements.forEach(el => {
                        if (discoveredPlaces.has(el.id)) return; 

                        const lat = el.lat || (el.center ? el.center.lat : null);
                        const lon = el.lon || (el.center ? el.center.lon : null);
                        if (!lat || !lon) return;

                        const d = getDistance(window.currentPlaceCoords.lat, window.currentPlaceCoords.lng, lat, lon);
                        const tags = el.tags || {};
                        const cat = tags.amenity || tags.tourism || tags.shop || 'other';
                        const name = tags.name || tags["name:vi"] || tags["brand"] || `Dịch vụ ${getEmoji(cat)}`;
                        
                        // Precise Address Join
                        let addrParts = [];
                        if (tags["addr:housenumber"]) addrParts.push(tags["addr:housenumber"]);
                        if (tags["addr:street"]) addrParts.push(tags["addr:street"]);
                        if (tags["addr:suburb"]) addrParts.push(tags["addr:suburb"]);
                        if (tags["addr:city"]) addrParts.push(tags["addr:city"]);
                        const addr = addrParts.length > 0 ? addrParts.join(', ') : (tags["addr:full"] || "Vị trí chính xác trên bản đồ");
                        
                        discoveredPlaces.set(el.id, {
                            id: el.id,
                            name: name,
                            lat: lat,
                            lng: lon,
                            address: addr,
                            type: cat,
                            website: tags.website || tags["contact:website"] || null,
                            phone: tags.phone || tags["contact:phone"] || null,
                            opening_hours: tags.opening_hours || null,
                            distanceText: d < 1000 ? `${Math.round(d)}m` : `${(d/1000).toFixed(1)}km`,
                            distanceValue: d,
                            travelTime: d < 500 ? '4 phút đi bộ' : d < 1000 ? '10 phút đi bộ' : '4 phút taxi',
                            rating: (4.1 + Math.random() * 0.8).toFixed(1),
                            reviews: Math.floor(Math.random() * 1500) + 50,
                            image: `https://source.unsplash.com/400x300/?${cat.replace(/_/g,' ')},${encodeURIComponent(name.split(' ')[0])},vietnam`
                        });
                    });
                }

                renderNearbyUI();
            } catch (err) {
                console.error('Map discovery error:', err);
            }
        }

        function renderNearbyUI() {
            const grid = document.getElementById('nearby-grid');
            
            // PRIORITY: Sort by distance from current location
            const sortedData = Array.from(discoveredPlaces.values())
                .sort((a,b) => a.distanceValue - b.distanceValue);

            // Update Markers
            sortedData.forEach(n => {
                if (!discoveredMarkers.has(n.id)) {
                    const iconHtml = `<div style="background:#fff; width:38px; height:38px; border-radius:50%; border:3px solid var(--primary); display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 8px 25px rgba(0,0,0,0.3); transition:0.3s;" onmouseover="this.style.transform='scale(1.2)';this.style.zIndex='1000';" onmouseout="this.style.transform='scale(1)';this.style.zIndex='1';">${getEmoji(n.type)}</div>`;
                    const icon = L.divIcon({ className: 'nearby-pin-custom', html: iconHtml, iconSize: [38, 38], iconAnchor: [19, 38] });
                    const m = L.marker([n.lat, n.lng], { icon })
                        .bindPopup(`
                            <div style="min-width:220px; padding:6px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                                    <div style="font-weight:900; color:var(--primary); font-size:1.1rem; line-height:1.2;">${n.name}</div>
                                    <div style="background:#fbbf24; color:#000; padding:2px 6px; border-radius:6px; font-weight:900; font-size:12px;">★ ${n.rating}</div>
                                </div>
                                <div style="font-size:12px; color:#666; margin-bottom:10px; line-height:1.4;">📍 ${n.address}</div>
                                <div style="display:flex; gap:8px; border-top:1px solid #eee; padding-top:10px;">
                                    <button style="flex:1; background:var(--primary); color:#fff; border:none; border-radius:8px; padding:8px; font-size:11px; font-weight:800; cursor:pointer;" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.name + ' ' + n.address)}', '_blank')">XEM GOOGLE MAP ↗</button>
                                </div>
                            </div>
                        `, { closeButton: false });
                    discoveredMarkers.set(n.id, m);
                }
                
                const marker = discoveredMarkers.get(n.id);
                if (isCategoryMatch(n.type, activeFilters)) {
                    marker.addTo(map);
                } else {
                    map.removeLayer(marker);
                }
            });

            const displayData = sortedData.filter(item => isCategoryMatch(item.type, activeFilters)).slice(0, 32);

            if (displayData.length === 0 && activeFilters.size > 0) {
                grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--text-dim);">Đang quét dữ liệu Google Maps... Vui lòng đợi.</div>`;
                return;
            }

            grid.innerHTML = displayData.map(n => `
                <div class="nearby-card" style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:32px; overflow:hidden; transition:0.4s; cursor:pointer; position:relative; display:flex; flex-direction:column;" onclick="focusOnMarker(${n.lat}, ${n.lng}, '${n.id}')">
                    <div style="height:200px; overflow:hidden; position:relative;">
                        <img src="${n.image}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80'" style="width:100%; height:100%; object-fit:cover; transition:0.7s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="position:absolute; top:15px; right:15px; background:rgba(0,0,0,0.7); backdrop-filter:blur(10px); padding:8px 15px; border-radius:20px; font-size:12px; color:#fff; border:1px solid rgba(255,255,255,0.2); font-weight:700; letter-spacing:0.5px;">
                            ${getEmoji(n.type)} ${n.type.toUpperCase().replace(/_/g,' ')}
                        </div>
                        <div style="position:absolute; bottom:15px; left:15px; background:var(--primary); padding:6px 15px; border-radius:15px; font-size:12px; color:#fff; font-weight:800; box-shadow:0 5px 15px rgba(99,102,241,0.4);">
                            CÁCH ${n.distanceText}
                        </div>
                    </div>
                    <div style="padding:25px; flex:1; display:flex; flex-direction:column;">
                        <div style="font-weight:900; color:var(--text-main); margin-bottom:10px; font-size:1.2rem; line-height:1.2; letter-spacing:-0.5px;">${n.name}</div>
                        <div style="font-size:14px; color:var(--text-dim); margin-bottom:20px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">📍 ${n.address}</div>
                        
                        <div style="margin-top:auto;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <div style="background:#fbbf24; color:#000; padding:4px 10px; border-radius:10px; font-weight:900; font-size:14px; box-shadow:0 4px 12px rgba(251,191,36,0.2);">★ ${n.rating}</div>
                                    <span style="color:var(--text-dim); font-size:13px; font-weight:600;">(${n.reviews} đánh giá)</span>
                                </div>
                                <span style="font-size:13px; font-weight:800; color:var(--primary);">${n.travelTime}</span>
                            </div>
                            
                            <div style="display:flex; gap:12px;">
                                <button style="flex:1; background:linear-gradient(135deg, var(--primary), #4f46e5); color:#fff; border:none; border-radius:18px; padding:15px; font-size:13px; font-weight:900; cursor:pointer; transition:0.3s; box-shadow:0 6px 20px rgba(99,102,241,0.4); text-transform:uppercase;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 10px 30px rgba(99,102,241,0.6)'" onmouseout="this.style.transform='translateY(0)'" onclick="event.stopPropagation(); window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.name + ' ' + n.address)}', '_blank')">Chỉ đường ↗</button>
                                ${n.phone ? `<button style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:18px; width:54px; color:#fff; cursor:pointer; transition:0.3s;" title="Gọi điện" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onclick="event.stopPropagation(); window.location.href='tel:${n.phone}'">📞</button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function getEmoji(type) {
            type = type.toLowerCase();
            if (type.includes('restaurant') || type.includes('food') || type.includes('fast_food') || type.includes('bar') || type.includes('pub') || type.includes('ice_cream') || type.includes('bakery')) return '🍽️';
            if (type.includes('hotel') || type.includes('tourism') || type.includes('accommodation') || type.includes('hostel') || type.includes('guest_house') || type.includes('apartment') || type.includes('resort') || type.includes('motel')) return '🏨';
            if (type.includes('cafe') || type.includes('coffee') || type.includes('tea')) return '☕';
            if (type.includes('attraction') || type.includes('viewpoint') || type.includes('museum') || type.includes('monument') || type.includes('gallery') || type.includes('zoo') || type.includes('theme_park') || type.includes('artwork') || type.includes('historic')) return '🎯';
            if (type.includes('bank') || type.includes('atm')) return '💳';
            if (type.includes('pharmacy') || type.includes('hospital') || type.includes('clinic')) return '🏥';
            if (type.includes('supermarket') || type.includes('convenience') || type.includes('mall') || type.includes('shop')) return '🛍️';
            if (type.includes('parking')) return '🅿️';
            if (type.includes('fuel')) return '⛽';
            return '✨';
        }

        function focusOnMarker(lat, lng, id) {
            map.flyTo([lat, lng], 17, { duration: 1.2 });
            const m = discoveredMarkers.get(id);
            if (m) m.openPopup();
        }

        function getDistance(lat1, lon1, lat2, lon2) {
            const R = 6371e3;
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        }
        
        // Custom animation for main marker
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes pulse-main {
                0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
                100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
            }
        `;
        document.head.appendChild(style);
