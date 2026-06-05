const VN_DESTINATION_PHOTOS = {
  "hồ hoàn kiếm": ["https://sakos.vn/wp-content/uploads/2024/01/THUMB-SAKOS-20.jpg"],
  "bún chả hương liên": ["https://mms.img.susercontent.com/vn-11134513-7r98o-lstxf7m02f2c77@resize_ss1242x600!@crop_w1242_h600_cT"],
  "phở thìn bờ hồ": ["https://cafebiz.cafebizcdn.vn/zoom/700_438/162123310254002176/2023/2/23/avatar1677154808691-1677154809528736470105.jpg"]
};

function getVNPhoto(query, idx = 0) {
  if (!query) return "GENERIC";
  const qLower = query.toLowerCase().trim();

  let bestMatch = null;
  let bestKeyLen = 0;
  for (const [key, photos] of Object.entries(VN_DESTINATION_PHOTOS)) {
    if (qLower.includes(key) || key.includes(qLower)) {
      if (key.length > bestKeyLen) {
        bestKeyLen = key.length;
        bestMatch = photos;
      }
    }
  }
  if (bestMatch) {
    const photoIdx = (Math.abs(idx) + qLower.length) % bestMatch.length;
    return bestMatch[photoIdx];
  }
  return "GENERIC";
}

console.log("Result for 'Bún chả Hương Liên':", getVNPhoto("Bún chả Hương Liên", 0));
console.log("Result for '📍 Bún Chả Hương Liên':", getVNPhoto("📍 Bún Chả Hương Liên", 0));
