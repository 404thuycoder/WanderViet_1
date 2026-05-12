# 🎨 THIẾT KẾ LOGO THƯƠNG HIỆU WANDERVIET

> **Thương hiệu**: WanderViet — Du lịch tự túc, thông minh  
> **Phong cách**: Hiện đại, công nghệ, bản sắc Việt Nam  
> **Cảm hứng**: La bàn, bản đồ, sóng biển, đường di chuyển

---

## 🎯 CONCEPT THIẾT KẾ

### Ý tưởng chính: "La bàn định hướng trên bản đồ Việt Nam"

**Biểu tượng** kết hợp 3 yếu tố:
1. **La bàn (Compass)** — Khám phá, định hướng, phiêu lưu
2. **Chữ W** — WanderViet, đường sóng biển
3. **Vị trí (Location Pin)** — Điểm đến, kết nối

**Thông điệp**: *"WanderViet giúp bạn định hướng và khám phá mọi điểm đến tại Việt Nam một cách thông minh"*

---

## 🎨 THIẾT KẾ LOGO CHÍNH

### Biểu tượng (Icon)

```
        ╭─────────────╮
        │             │
        │    ╭───╮    │
        │   ╱  W  ╲   │
        │  │   ◆   │  │
        │   ╲     ╱   │
        │    ╰───╯    │
        │      │      │
        ╰──────┴──────╯
```

**Mô tả chi tiết:**
- Hình tròn bo tròn (squircle) làm nền
- La bàn 4 hướng ở viền trong
- Chữ W stylized ở trung tâm
- Điểm trung tâm là kim la bàn / vị trí

### Grid & Tỷ lệ

```
┌─────────────────────────────┐
│     ○    ← 12.5% padding    │
│   ┌───────┐                 │
│   │ ╲   ╱ │  ← La bàn      │
│   │  ╲ ╱  │    (hướng      │
│   │───●───│     4 hướng)   │
│   │  ╱ ╲  │                 │
│   │ ╱   ╲ │                 │
│   └───────┘                 │
│        ↑                    │
│    70% width               │
│                            │
│  ○ ◄── 15% padding         │
└─────────────────────────────┘

Tỷ lệ: 1:1 (Square)
Padding: 12.5% tất cả cạnh
```

### Hình dạng La bàn

```
       ▲
       │    Kim Bắc (Mũi tên)
   ╲       ╱
    ╲  W  ╱
     ╲ │ ╱
◄─────●─────►   Kim Đông & Tây
     ╱ │ ╲
    ╱     ╲
   ╱       ╲
       │
       ▼    Kim Nam

Các đường kim la bàn mảnh, hiện đại
Giao điểm trung tâm là chấm tròn gradient
```

---

## 📝 TYPOGRAPHY

### Font cho Logo

**Primary Font**: `Plus Jakarta Sans` (hoặc `Outfit`)
- Trọng lượng: `ExtraBold (800)` cho "Wander" + `SemiBold (600)` cho "Viet"
- Lý do: Hiện đại, hình học, dễ đọc, friendly

### Cách trình bày

**Version 1: Horizontal**
```
[Icon]  WanderViet
        ────────
        ExtraBold 600
```

**Version 2: Stacked**
```
     ╭────╮
     │Icon│
     ╰────╯
    Wander
      Viet
```

**Khoảng cách**: Letter-spacing -0.02em (tight)

---

## 🎨 COLOR PALETTE

### Màu chính (Primary)

| Tên | HEX | RGB | Ứng dụng |
|-----|-----|-----|----------|
| **Indigo Blue** | `#6366F1` | 99, 102, 241 | Nền icon, điểm nhấn |
| **Cyan Teal** | `#06B6D4` | 6, 182, 212 | Gradient kết hợp |
| **Violet** | `#8B5CF6` | 139, 92, 246 | Variant phụ |

### Gradient chính

```css
/* Gradient 135 độ — Biểu tượng chính */
background: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%);

/* Gradient 180 độ — La bàn */
background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);

/* Glow effect */
box-shadow: 0 0 40px rgba(99, 102, 241, 0.4);
```

### Màu phụ (Secondary)

| Tên | HEX | Ứng dụng |
|-----|-----|----------|
| **Warm Coral** | `#F472B6` | Business variant |
| **Amber Gold** | `#FBBF24` | Admin variant |
| **Emerald** | `#10B981` | Success, eco-friendly |

### Màu nền

```
Light Mode:  #FFFFFF (nền trắng)
Dark Mode:   #0F172A (nền đen xanh)
Glass:       rgba(255, 255, 255, 0.1)
```

---

## 🎨 CÁC PHIÊN BẢN LOGO

### 1. Logo chính (Primary)

**Mô tả**: Gradient Indigo → Cyan, nền trong suốt
```
Sử dụng: Website, ứng dụng, marketing materials
Kích thước: 512×512px trở lên
```

### 2. Logo Dark Mode

**Mô tả**: Màu sáng trên nền tối
```
Icon: Gradient #818CF8 → #22D3EE (sáng hơn)
Text: #F8FAFC (white)
Glow: 0 0 30px rgba(129, 140, 248, 0.5)
```

### 3. Logo Monochrome

**Mô tả**: Một màu, dùng cho watermark, in ấn đen trắng
```
Version: Indigo #6366F1 (đậm)
Hoặc: White #FFFFFF trên nền đen
```

### 4. Logo Business (Variant)

**Mô tả**: Màu Warm Coral + Gold cho trang Business
```
Gradient: #F472B6 → #FBBF24
Biểu tượng: Có thể thêm yếu tố "building" hoặc "briefcase"
```

### 5. Logo Admin (Variant)

**Mô tả**: Màu Amber + điểm nhấn công nghệ
```
Gradient: #FBBF24 → #F59E0B
Glow: 0 0 40px rgba(251, 191, 36, 0.4)
```

### 6. Icon Only (Favicon/App Icon)

```
Kích thước: 16×16, 32×32, 180×180, 192×192, 512×512
Nền: Gradient chính
Biểu tượng: Chỉ la bàn + chữ W
```

### 7. Logo đơn giản (Minimal)

**Mô tả**: Chỉ chữ W stylized
```
W được thiết kế như:
- Hai đường sóng biển
- Hoặc hai đường đường chân trời núi
- Kết thúc bằng mũi tên chỉ lên
```

---

## 📐 KÍCH THƯỚC & SPECIFICATIONS

### Kích thước chuẩn

| Loại | Kích thước | Định dạng | Ghi chú |
|------|------------|-----------|---------|
| Favicon | 16×16, 32×32 | .ico, .png | Multi-size |
| App Icon | 192×192, 512×512 | .png, .svg | PWA, Mobile |
| Website Logo | 200×50, 400×100 | .svg (responsive) | Header |
| Social Media | 1200×630 | .png, .jpg | OG Image |
| Print | Vector | .svg, .ai, .pdf | CMYK ready |
| Watermark | 100×100 | .png | Transparent |

### Clear Space (Không gian tối thiểu)

```
┌─────────────────────────────────────┐
│          ↑ 1x height                │
│    ┌───────────────────────┐        │
│    │                       │        │
│ ←x │      [LOGO]          │ x→     │
│    │                       │        │
│    └───────────────────────┘        │
│          ↓ 1x height                │
└─────────────────────────────────────┘

x = chiều cao của chữ "W" trong logo
```

### Minimum Size

- **Digital**: Không nhỏ hơn 24px chiều cao
- **Print**: Không nhỏ hơn 10mm chiều cao

---

## 🎨 VISUAL EXAMPLES (Mô tả chi tiết)

### Version 1: Hiện đại - Đề xuất chính

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│     ╭──────────────────────────────╮                       │
│     │                              │                       │
│     │          ▲                     │                       │
│     │         ╱ ╲                    │                       │
│     │        ╱   ╲                   │                       │
│     │       ╱  W  ╲                  │     WanderViet        │
│     │      ╱       ╲                 │     ───────────        │
│     │     ╱    ●    ╲                │                        │
│     │    ╱           ╲               │     Du lịch tự túc      │
│     │         │                      │     thông minh        │
│     │         ▼                      │                        │
│     │                              │                       │
│     ╰──────────────────────────────╯                       │
│                                                            │
│     Gradient: #6366F1 → #06B6D4                           │
│     Background: White / Transparent                        │
│     Shape: Rounded square (squircle)                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Version 2: Đường cong (Wave Concept)

```
    ╭────────────────────────╮
    │    ～～～～～～～      │
    │   ～  ╭───╮  ～      │
    │  ～  │ W │  ～      │
    │   ～  ╰───╯  ～      │
    │    ～～～～～～～      │
    ╰────────────────────────╯

Ý nghĩa:
- Đường cong ở trên và dưới: Sóng biển Việt Nam
- Chữ W: Wander + Wave
- Phù hợp cho du lịch biển đảo
```

### Version 3: La bàn cổ điển hiện đại

```
         N
         ▲
    NW ╱   ╲ NE
        │ ◆ │
    SW ╲   ╲ SE
         ▼
         S

• Kim la bàn mảnh, tinh tế
• Tâm là vòng tròn gradient
• Có thể thêm chữ W nhỏ ở tâm
• Phong cách: Premium, đáng tin cậy
```

### Version 4: Bản đồ stylized

```
    ╭───────────────────╮
    │      ╭────╮       │
    │     ╱      ╲      │
    │    │  ●───  │     │  ← Hình dạng VN đơn giản
    │     ╲      ╱      │
    │      ╰────╯       │
    │         ●         │  ← Location pin
    ╰───────────────────╯

Ý nghĩa:
- Hình dạng Việt Nam tối giản
- Location pin đánh dấu điểm đến
- Phong cách: Bản sắc Việt, dễ nhớ
```

---

## 🎯 ANIMATION GUIDELINES

### Logo Animation (Loading/Splash)

**Sequence**:
1. Icon xuất hiện từ scale 0.8 → 1 (0.3s)
2. Gradient shimmer effect (0.5s)
3. Text fade in từ trái sang (0.3s)
4. Subtle pulse glow (loop)

```css
@keyframes logo-appear {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes gradient-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Hover Effects

```css
.logo:hover {
  transform: scale(1.02);
  filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
  transition: all 0.3s ease;
}
```

---

## 📋 USAGE GUIDELINES

### ✅ DO (Nên làm)

- [x] Sử dụng file SVG cho web (scale không mất chất lượng)
- [x] Để padding đủ xung quanh logo
- [x] Sử dụng gradient chính cho nền sáng
- [x] Dùng phiên bản monochrome khi in đen trắng
- [x] Giữ tỷ lệ 1:1 cho icon
- [x] Đảm bảo độ tương phản > 4.5:1 (WCAG AA)

### ❌ DON'T (Không nên)

- [ ] Kéo dãn, bóp méo logo
- [ ] Thay đổi màu sắc ngoài palette
- [ ] Xoay logo
- [ ] Thêm hiệu ứng bóng đổ quá đậm
- [ ] Đặt logo trên background phức tạp
- [ ] Thay đổi font chữ
- [ ] Sử dụng icon nhỏ hơn 16px

### Vị trí sử dụng

| Vị trí | Logo type | Kích thước |
|--------|-----------|------------|
| Website Header | Primary Horizontal | 160×40px |
| Mobile Header | Icon Only | 40×40px |
| Favicon | Icon | 32×32px |
| PWA App Icon | Icon Rounded | 192×192px |
| Email Signature | Horizontal Compact | 120×30px |
| Social Avatar | Icon | 400×400px |
| OG Image | Stacked | 1200×630px |
| Business Card | Icon + Text | 30mm×10mm |

---

## 🖼️ EXPORT SPECIFICATIONS

### File Formats

| Định dạng | Mục đích | Ghi chú |
|-----------|----------|---------|
| **SVG** | Web, Scale | Preferred for web |
| **PNG** | Web, Social | Transparent BG, 300dpi |
| **PDF** | Print | Vector, CMYK |
| **AI/EPS** | Design | Master file |
| **ICO** | Favicon | Multi-size 16-256px |
| **WEBP** | Web optimized | Smaller than PNG |

### SVG Structure

```svg
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients -->
    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1"/>
      <stop offset="100%" style="stop-color:#06B6D4"/>
    </linearGradient>
    <!-- Glow filter -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background shape -->
  <rect x="32" y="32" width="448" height="448" rx="96" 
        fill="url(#primaryGradient)"/>
  
  <!-- Compass/Icon paths -->
  <g fill="white" filter="url(#glow)">
    <!-- Compass North -->
    <path d="M256 96 L272 200 L256 192 L240 200 Z"/>
    <!-- Other directions... -->
    <!-- Center W -->
    <text x="256" y="320" text-anchor="middle" 
          font-family="Plus Jakarta Sans" font-weight="800" 
          font-size="160">W</text>
  </g>
</svg>
```

---

## 🎨 BRAND COLORS IN CODE

### CSS Variables

```css
:root {
  /* Brand Primary */
  --brand-primary: #6366F1;
  --brand-primary-light: #818CF8;
  --brand-primary-dark: #4F46E5;
  
  /* Brand Secondary */
  --brand-secondary: #06B6D4;
  --brand-secondary-light: #22D3EE;
  
  /* Brand Gradient */
  --brand-gradient: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%);
  
  /* Brand Glow */
  --brand-glow: 0 0 40px rgba(99, 102, 241, 0.4);
  
  /* Business Variant */
  --brand-business: linear-gradient(135deg, #F472B6 0%, #FBBF24 100%);
  
  /* Admin Variant */
  --brand-admin: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
}
```

### Tailwind Classes

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366F1',
          'primary-light': '#818CF8',
          'primary-dark': '#4F46E5',
          secondary: '#06B6D4',
          'secondary-light': '#22D3EE',
          coral: '#F472B6',
          amber: '#FBBF24',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
        'brand-business': 'linear-gradient(135deg, #F472B6 0%, #FBBF24 100%)',
        'brand-admin': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
      },
      boxShadow: {
        'brand-glow': '0 0 40px rgba(99, 102, 241, 0.4)',
        'brand-glow-sm': '0 0 20px rgba(99, 102, 241, 0.3)',
      }
    }
  }
}
```

---

## 📱 APP ICON SPECIFICATIONS

### iOS App Icon

```
Kích thước: 1024×1024px
Corner radius: 180px (tự động bởi iOS)
Background: Gradient chính
Safe zone: 90% center
```

### Android Adaptive Icon

```
Foreground: 108×108dp (1080×1080px)
Background: 108×108dp (màu gradient)
Safe zone: 66dp center
```

### Maskable Icon (PWA)

```
Kích thước: 512×512px
Safe zone: 80% center (không bị cắt bởi mask)
Background: Gradient chính
```

---

## 🎯 COMPARISON: Before vs After

### Logo cũ (Hiện tại)
- Chữ W đơn giản
- Màu sắc cơ bản
- Thiếu nhận diện thương hiệu
- Không có biểu tượng riêng

### Logo mới (Đề xuất)
- Biểu tượng la bàn độc đáo
- Gradient hiện đại
- Dễ nhận diện, memorable
- Nhiều variant cho các trang
- Animation-ready
- Scalable vector

---

## ✅ CHECKLIST IMPLEMENTATION

### Thiết kế
- [ ] Hoàn thiện concept 1 (Primary)
- [ ] Hoàn thiện concept 2 (Wave) - tùy chọn
- [ ] Hoàn thiện concept 3 (Map) - tùy chọn
- [ ] Chọn final concept
- [ ] Tinh chỉnh typography
- [ ] Xác nhận color palette

### Xuất file
- [ ] SVG master file
- [ ] PNG các kích thước: 16, 32, 192, 512, 1024
- [ ] ICO favicon
- [ ] PDF print version
- [ ] SVG animation version
- [ ] Dark mode variants

### Integration
- [ ] Favicon cho tất cả trang
- [ ] Logo header User Web
- [ ] Logo header Business Web
- [ ] Logo header Admin Web
- [ ] OG Image social media
- [ ] PWA manifest icons
- [ ] Email signature

---

## 🎨 INSPIRATION BOARD

### Influences
- **Airbnb**: Belonging, bản đồ, đơn giản
- **Google Maps**: La bàn, location, tin cậy
- **Duolingo**: Màu sắc vui tươi, friendly
- **Notion**: Tối giản, functional
- **Vietnam Airlines**: Bản sắc Việt Nam

### Mood Keywords
- Adventure (Phiêu lưu)
- Smart (Thông minh)
- Friendly (Thân thiện)
- Trustworthy (Đáng tin cậy)
- Modern (Hiện đại)
- Vietnamese (Việt Nam)

---

**Ngày tạo**: 12/05/2026  
**Phiên bản**: 1.0  
**Trạng thái**: Concept & Specifications
