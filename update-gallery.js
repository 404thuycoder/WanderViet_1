const fs = require('fs');
let content = fs.readFileSync('apps/user-web/place-detail.html', 'utf8');

const target = `            // ELITE: Merge legacy images and new gallery system
            allGalleryItems = (place.gallery && place.gallery.length > 0) 
                ? place.gallery 
                : (place.images || []).map(img => ({ url: img, category: 'general', type: 'image' }));
            
            if (allGalleryItems.length === 0) {
                if (gallerySec) gallerySec.style.display = 'none';
                return;
            }
            if (gallerySec) gallerySec.style.display = 'block';`;

const replacement = `            // ELITE: Merge legacy images and new gallery system & DEDUPLICATE URLS
            const uniqueMap = new Map();
            (place.gallery || []).forEach(item => {
                if (item && item.url) uniqueMap.set(item.url, item);
            });
            (place.images || []).forEach(url => {
                if(url && !uniqueMap.has(url)) uniqueMap.set(url, { url: url, category: 'general', type: 'image' });
            });
            allGalleryItems = Array.from(uniqueMap.values());
            
            if (allGalleryItems.length === 0) {
                if (gallerySec) gallerySec.style.display = 'none';
                return;
            }
            if (gallerySec) gallerySec.style.display = 'block';

            // Khởi tạo Slideshow tự động thay đổi ảnh đẹp
            slideItems = allGalleryItems.filter(it => it.type !== 'video').slice(0, 8); // Top 8 ảnh đẹp nhất
            if (slideItems.length > 0) {
                const el = document.getElementById('gallery-slideshow');
                if(el) el.style.display = 'block';
                updateSlide();
                startSlideshow();
            }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('apps/user-web/place-detail.html', content, 'utf8');
    console.log('Successfully updated place-detail.html');
} else {
    // Try to handle crlf just in case
    const t2 = target.replace(/\n/g, '\r\n');
    if (content.includes(t2)) {
        content = content.replace(t2, replacement.replace(/\n/g, '\r\n'));
        fs.writeFileSync('apps/user-web/place-detail.html', content, 'utf8');
        console.log('Successfully updated place-detail.html (CRLF)');
    } else {
        console.log('Target not found in file');
    }
}
