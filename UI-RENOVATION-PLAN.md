# 📋 KẾ HOẠCH NÂNG CẤP UI WANDERVIET

> **Mục tiêu**: Nâng cấp UI cho 3 trang User, Business, Admin theo phong cách hiện đại, dịu mắt
> **Yêu cầu**: Không thay đổi cấu trúc, giữ nguyên logic, chỉ nâng cấp UI
> **Công nghệ**: Tailwind CSS + Shadcn/ui + Framer Motion + Lucide Icons

---

## 🎯 TỔNG QUAN DỰ ÁN

### Phạm vi công việc
| STT | Hạng mục | Trang | Số lượng components | Mức độ phức tạp |
|-----|----------|-------|---------------------|-----------------|
| 1 | Header & Navigation | User | 1 | ⭐⭐ |
| 2 | Hero Section | User | 1 | ⭐⭐⭐ |
| 3 | Destination Cards | User | 1 | ⭐⭐ |
| 4 | Filter System | User | 1 | ⭐⭐ |
| 5 | Smart Search Form | User | 1 | ⭐⭐⭐ |
| 6 | Planner Interface | User | 2 | ⭐⭐⭐⭐ |
| 7 | Feature Grid | User | 1 | ⭐ |
| 8 | Stats Section | User | 1 | ⭐⭐ |
| 9 | Reviews Carousel | User | 1 | ⭐⭐ |
| 10 | CTA & Footer | User | 2 | ⭐⭐ |
| 11 | Sidebar | Business | 1 | ⭐⭐⭐ |
| 12 | Topbar | Business | 1 | ⭐⭐ |
| 13 | Dashboard Cards | Business | 4 | ⭐⭐ |
| 14 | Charts Container | Business | 2 | ⭐⭐ |
| 15 | Data Tables | Business | 3 | ⭐⭐⭐ |
| 16 | Service Management | Business | 2 | ⭐⭐⭐ |
| 17 | Welcome Overlay | Admin | 1 | ⭐⭐⭐ |
| 18 | Admin Header | Admin | 1 | ⭐⭐ |
| 19 | Admin Sidebar | Admin | 1 | ⭐⭐⭐ |
| 20 | Overview Panel | Admin | 5 | ⭐⭐⭐ |
| 21 | Analytics Charts | Admin | 3 | ⭐⭐⭐⭐ |
| 22 | User Management | Admin | 2 | ⭐⭐⭐ |
| 23 | AI Sentinel | Admin | 1 | ⭐⭐⭐ |
| 24 | Settings Drawer | Admin | 1 | ⭐⭐ |

---

## 📊 THỜI GIAN ƯỚC TÍNH

### Tuần 1: User Web (10 components)
| Ngày | Components | Giờ làm | Ghi chú |
|------|------------|--------|---------|
| Thứ 2 | Header + Hero | 6h | Setup Tailwind, fonts, base styles |
| Thứ 3 | Destination Cards + Filter | 5h | Grid layout, hover effects |
| Thứ 4 | Smart Search Form | 5h | Radio tiles, checkbox groups |
| Thứ 5 | Planner (Left panel + Map) | 6h | Glass panels, drag-drop styling |
| Thứ 6 | Features + Stats + Reviews | 5h | Animations, counters |
| Thứ 7 | CTA + Footer + Testing | 4h | Responsive check |

### Tuần 2: Business Web (6 components)
| Ngày | Components | Giờ làm | Ghi chú |
|------|------------|--------|---------|
| Thứ 2 | Sidebar + Topbar | 5h | Dark theme glass |
| Thứ 3 | Dashboard Cards | 4h | Gradient stats |
| Thứ 4 | Charts + Tables | 6h | Chart.js styling |
| Thứ 5 | Service Management | 5h | Forms, toggles |
| Thứ 6 | Settings Panel | 4h | Theme customization |

### Tuần 3: Admin Web (7 components)
| Ngày | Components | Giờ làm | Ghi chú |
|------|------------|--------|---------|
| Thứ 2 | Welcome Overlay + Header | 5h | Animations |
| Thứ 3 | Sidebar + Overview | 5h | Navigation groups |
| Thứ 4 | Analytics Charts | 6h | Complex visualizations |
| Thứ 5 | User Management | 5h | Tables, modals |
| Thứ 6 | AI Sentinel + Settings | 5h | Drawers, chat UI |

---

## 🛠️ CHUẨN BỊ MÔI TRƯỜNG

### Bước 1: Cài đặt Dependencies
```bash
# Trong thư mục dự án
cd f:\WanderViet_1\WanderViet_1

# Cài Tailwind CSS (nếu chưa có)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Cài Shadcn/ui components
npx shadcn@latest init

# Các components cần thiết
npx shadcn add button card input badge avatar switch select tabs dialog dropdown-menu navigation-menu scroll-area separator skeleton tooltip

# Cài Framer Motion
npm install framer-motion

# Cài Lucide React Icons
npm install lucide-react
```

### Bước 2: Cấu hình Tailwind
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./apps/**/*.{html,js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'Be Vietnam Pro', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        accent: {
          pink: '#f472b6',
          cyan: '#06b6d4',
          amber: '#fbbf24',
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  },
  plugins: [],
}
```

### Bước 3: Thêm Fonts
```html
<!-- Trong <head> của mỗi HTML file -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## ✅ CHECKLIST CHI TIẾT THEO TRANG

### 1. USER WEB (`apps/user-web/`)

#### 1.1 Global Styles
- [ ] Tạo `global-tailwind.css` với custom properties
- [ ] Định nghĩa color palette mới
- [ ] Setup font families
- [ ] Định nghĩa shadow system
- [ ] Định nghĩa border-radius scale

#### 1.2 Header (`index.html` header section)
- [ ] Glassmorphism background (`bg-white/70 backdrop-blur-xl`)
- [ ] Logo với gradient text
- [ ] Navigation pills với hover effect
- [ ] User avatar với notification dot
- [ ] Mobile hamburger menu
- [ ] **Test**: Scroll behavior, responsive

#### 1.3 Hero Section
- [ ] Gradient background với animated orbs
- [ ] Title gradient text (indigo → cyan → pink)
- [ ] Search box glass effect
- [ ] Search button gradient
- [ ] Floating destination card
- [ ] Card animation (float, shadow pulse)
- [ ] Tags pills với hover
- [ ] **Test**: Animation smooth, responsive

#### 1.4 Destination Cards
- [ ] Card component structure
- [ ] Image aspect ratio 4:3
- [ ] Image hover zoom effect
- [ ] Heart button (glass floating)
- [ ] Rating badge với star icon
- [ ] Price tag styling
- [ ] Location text với MapPin icon
- [ ] Category tags
- [ ] Hover lift animation
- [ ] **Test**: Grid responsive, hover smooth

#### 1.5 Filter Bar
- [ ] Pills container
- [ ] Active state styling
- [ ] Icon + text alignment
- [ ] Stagger animation on load
- [ ] Hover transitions
- [ ] **Test**: Filter functionality preserved

#### 1.6 Smart Search Form
- [ ] Card container gradient
- [ ] Section headers với icons
- [ ] Radio tiles (Budget, Pace)
- [ ] Checkbox groups (Interests, Habits)
- [ ] Selected state styling
- [ ] Submit button gradient
- [ ] **Test**: Form submission works

#### 1.7 Planner Section
- [ ] Two-column layout (40% - 60%)
- [ ] Left panel glass effect
- [ ] Stop list items styling
- [ ] Drag handle icon
- [ ] Remove button
- [ ] Map container styling
- [ ] Action buttons row
- [ ] **Test**: Map displays correctly

#### 1.8 Features Grid
- [ ] 4-column grid responsive
- [ ] Icon gradient backgrounds
- [ ] Card hover effect
- [ ] **Test**: Icons align, text readable

#### 1.9 Stats Section
- [ ] Counter animation setup
- [ ] Large number styling
- [ ] Label styling
- [ ] **Test**: Numbers animate on scroll

#### 1.10 Reviews Carousel
- [ ] Card styling
- [ ] Quote icon
- [ ] Avatar với ring
- [ ] Star rating
- [ ] Navigation arrows
- [ ] Dots indicator
- [ ] **Test**: Carousel works

#### 1.11 CTA Section
- [ ] Gradient background
- [ ] Form inputs glass
- [ ] Submit button
- [ ] **Test**: Form submits

---

### 2. BUSINESS WEB (`apps/business-web/`)

#### 2.1 Global Dark Theme Setup
- [ ] Dark mode color variables
- [ ] Background gradient
- [ ] Text colors
- [ ] Border colors

#### 2.2 Sidebar
- [ ] Fixed width 280px
- [ ] Glass background (`bg-slate-900/80 backdrop-blur-2xl`)
- [ ] Logo gradient box
- [ ] Profile card glass
- [ ] Navigation groups
- [ ] Active item gradient
- [ ] Hover states
- [ ] Footer avatar
- [ ] **Test**: Navigation works, active state

#### 2.3 Topbar
- [ ] Height 72px
- [ ] Glass background
- [ ] Title styling
- [ ] Date chip
- [ ] Search input
- [ ] Notification bell với pulse
- [ ] User chip với dropdown
- [ ] **Test**: Dropdown functions

#### 2.4 Dashboard Stat Cards
- [ ] 4-column grid
- [ ] Card glass effect
- [ ] Gradient backgrounds (4 colors)
- [ ] Icon circles
- [ ] Large numbers
- [ ] Labels
- [ ] Trend indicators
- [ ] **Test**: Data displays correctly

#### 2.5 Charts Section
- [ ] Container glass
- [ ] Chart.js color scheme
- [ ] Legend styling
- [ ] **Test**: Charts render

#### 2.6 Data Tables
- [ ] Header sticky glass
- [ ] Row hover highlight
- [ ] Border styling
- [ ] Status badges
- [ ] Action buttons
- [ ] **Test**: Sorting, pagination works

#### 2.7 Service Management
- [ ] Service cards
- [ ] Toggle switches
- [ ] Edit/Delete actions
- [ ] Form inputs dark theme
- [ ] **Test**: CRUD operations work

#### 2.8 Settings Panel
- [ ] Tab navigation
- [ ] Theme toggles
- [ ] Color pickers
- [ ] **Test**: Settings save

---

### 3. ADMIN WEB (`apps/admin-web/`)

#### 3.1 Welcome Overlay
- [ ] Full screen overlay
- [ ] Logo animation
- [ ] Progress bar
- [ ] Auto-dismiss logic
- [ ] **Test**: Shows on login

#### 3.2 Header
- [ ] System pulse indicator
- [ ] Latency display
- [ ] Search trigger
- [ ] Settings button
- [ ] Notification bell
- [ ] Profile section
- [ ] **Test**: All buttons work

#### 3.3 Sidebar
- [ ] Navigation groups
- [ ] Group headers
- [ ] Icons (Lucide)
- [ ] Active state
- [ ] Badges (count, "NEW")
- [ ] User footer
- [ ] **Test**: Navigation, badge counts

#### 3.4 Overview Panel
- [ ] AI Insight bar
- [ ] Stat cards row
- [ ] Quick actions grid
- [ ] Recent activity list
- [ ] **Test**: Data loads

#### 3.5 Analytics Charts
- [ ] Period selectors
- [ ] Line chart styling
- [ ] Bar chart styling
- [ ] Pie chart styling
- [ ] **Test**: Charts interactive

#### 3.6 User Management
- [ ] Table structure
- [ ] Avatar + name column
- [ ] Role badges
- [ ] Status indicators
- [ ] Action buttons
- [ ] Modal forms
- [ ] **Test**: Edit, delete works

#### 3.7 AI Sentinel
- [ ] Floating trigger button
- [ ] Pulse ring animation
- [ ] Drawer slide-in
- [ ] Chat interface
- [ ] Message bubbles
- [ ] Input area
- [ ] **Test**: Chat functions

#### 3.8 Settings Drawer
- [ ] Theme presets
- [ ] Accent colors
- [ ] Toggles
- [ ] Sliders
- [ ] **Test**: Settings apply

---

## 🎨 DESIGN TOKENS REFERENCE

### Colors
```
Primary:      #6366f1 (Indigo 500)
Primary Light:#818cf8 (Indigo 400)
Primary Dark: #4f46e5 (Indigo 600)
Secondary:    #06b6d4 (Cyan 500)
Accent Pink:  #f472b6 (Pink 400)
Accent Amber: #fbbf24 (Amber 400)
Success:      #86efac (Green 300)
Warning:      #fde047 (Yellow 300)
Error:        #fca5a5 (Red 300)
```

### Typography
```
Display Font: Plus Jakarta Sans
Body Font:    Inter, Be Vietnam Pro
H1:           2.5rem (40px), bold
H2:           1.875rem (30px), semibold
H3:           1.25rem (20px), semibold
Body:         0.875rem (14px), normal
Caption:      0.75rem (12px), medium
```

### Spacing
```
xs:   4px   (1)
sm:   8px   (2)
md:   16px  (4)
lg:   24px  (6)
xl:   32px  (8)
2xl:  48px  (12)
3xl:  64px  (16)
```

### Border Radius
```
sm:   6px   (buttons, tags)
md:   12px  (cards, inputs)
lg:   16px  (modals, panels)
xl:   24px  (hero sections)
full: 9999px (pills, avatars)
```

### Shadows
```
sm:   0 1px 2px 0 rgba(0,0,0,0.05)
md:   0 4px 6px -1px rgba(0,0,0,0.1)
lg:   0 10px 15px -3px rgba(0,0,0,0.1)
xl:   0 20px 25px -5px rgba(0,0,0,0.1)
glow: 0 0 20px rgba(99,102,241,0.3)
```

---

## 🔄 QUY TRÌNH LÀM VIỆC

### Cho mỗi component:

1. **Analyze** (15 min)
   - Xem cấu trúc HTML hiện tại
   - Xác định classes cũ cần thay
   - Lên danh sách icons Lucide cần dùng

2. **Design** (30 min)
   - Viết classes Tailwind mới
   - Plan animation với Framer Motion
   - Xác định responsive breakpoints

3. **Implement** (60-120 min)
   - Thêm classes Tailwind
   - Thay icons cũ bằng Lucide
   - Wrap với motion components
   - Test interactions

4. **Review** (15 min)
   - So sánh với design system
   - Check responsive
   - Verify functionality preserved

---

## 📁 FILES CẦN CHỈNH SỬA

### User Web
```
apps/user-web/
├── index.html          (Hero, Destinations, Search, Planner, CTA)
├── styles.css          (Thêm Tailwind classes)
├── global-tokens.css  (Cập nhật variables)
├── profile.html
├── place-detail.html
├── planner.html
├── my-trips.html
└── ...
```

### Business Web
```
apps/business-web/
├── index.html          (Sidebar, Topbar, Views)
├── dashboard.html
├── business.css        (Dark theme styles)
├── global-tokens.css
└── ...
```

### Admin Web
```
apps/admin-web/
├── index.html          (Welcome, Header, Sidebar, Panels)
├── admin.css           (Elite dark theme)
├── global-tokens.css
└── ...
```

---

## 🚦 MỐC KIỂM TRA (Milestones)

### Milestone 1: User Web Complete
- [ ] Hero section responsive
- [ ] Cards grid hoạt động
- [ ] Filter functionality preserved
- [ ] Planner layout stable
- [ ] Mobile responsive pass

### Milestone 2: Business Web Complete
- [ ] Sidebar navigation works
- [ ] Dashboard stats display
- [ ] Tables render correctly
- [ ] Dark theme consistent
- [ ] Forms functional

### Milestone 3: Admin Web Complete
- [ ] Welcome overlay animation
- [ ] All panels accessible
- [ ] Charts interactive
- [ ] AI Sentinel functional
- [ ] Settings apply correctly

### Milestone 4: Final Polish
- [ ] Cross-browser testing
- [ ] Performance audit
- [ ] Accessibility check
- [ ] Animation performance
- [ ] Documentation update

---

## 📝 GHI CHÚ QUAN TRỌNG

### Giữ nguyên chức năng:
1. Tất cả `data-*` attributes
2. Event handlers (onclick, onsubmit)
3. Form names và IDs
4. API endpoints
5. LocalStorage keys

### Thay đổi được phép:
1. CSS classes (thêm Tailwind)
2. Icon elements (thay bằng Lucide)
3. Animation wrappers
4. Layout spacing
5. Color schemes

### Không được đụng vào:
1. JavaScript logic
2. Component structure HTML
3. Data binding
4. Routing
5. Authentication flow

---

## ✅ SIGN-OFF CHECKLIST

Trước khi deploy:
- [ ] Tất cả components được style
- [ ] Không có lỗi console
- [ ] Responsive hoạt động
- [ ] Animations mượt mà (60fps)
- [ ] Lighthouse score > 90
- [ ] Accessibility pass (WCAG 2.1 AA)
- [ ] Cross-browser test (Chrome, Firefox, Safari, Edge)

---

**Người lập kế hoạch**: AI Assistant  
**Ngày lập**: 11/05/2026  
**Phiên bản**: 1.0
