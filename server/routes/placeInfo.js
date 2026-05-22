const express = require('express');
const router = express.Router();

// Simple mock data for place info (coords + sample reviews)
const PLACE_DB = {
  'hà nội': { coords: [21.0278, 105.8342], reviews: [
    { user: 'Nguyễn Văn A', rating: 5, text: 'Thủ đô tuyệt vời, nhiều trải nghiệm.' },
    { user: 'Trần Thị B', rating: 4, text: 'Ẩm thực ngon, nhưng lúc cao điểm khá đông.' }
  ] },
  'hạ long': { coords: [20.9101, 107.1839], reviews: [
    { user: 'Lê Văn C', rating: 5, text: 'Vịnh Hạ Long đẹp như tranh.' },
    { user: 'Phạm Hương', rating: 4, text: 'Nên đi vào sáng sớm để tránh nắng.' }
  ] }
};

router.get('/', (req, res) => {
  const name = (req.query.name || req.query.q || '').toLowerCase().trim();
  if (!name) return res.json({ success: false, message: 'missing name' });

  // Try exact or prefix match
  const key = Object.keys(PLACE_DB).find(k => name.includes(k) || k.includes(name)) || null;
  if (key) {
    return res.json({ success: true, data: PLACE_DB[key] });
  }

  // Fallback: return generic coords (Hà Nội) and generated reviews
  const fallback = {
    coords: [21.0278, 105.8342],
    reviews: [
      { user: 'Khách', rating: 5, text: `Địa điểm ${req.query.name || 'này'} rất đẹp!` },
      { user: 'Người dùng', rating: 4, text: 'Trải nghiệm tốt, nên ghé thử.' }
    ]
  };
  res.json({ success: true, data: fallback });
});

module.exports = router;
