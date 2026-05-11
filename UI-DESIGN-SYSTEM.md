# 🎨 WanderViet UI Design System v2.0

> **Phong cách thiết kế**: Hiện đại, dịu mắt, thu hút với điểm nhấn màu sắc tinh tế
> **Công nghệ**: Tailwind CSS + Shadcn/ui + Framer Motion + Lucide Icons

---

## 📐 Design Philosophy

### Tông màu chủ đạo (New Color Palette)

```css
/* Primary Colors - Dịu mắt hơn */
--primary: #6366f1;           /* Indigo 500 - chủ đạo */
--primary-light: #818cf8;     /* Indigo 400 - hover */
--primary-dark: #4f46e5;      /* Indigo 600 - active */

/* Secondary Colors */
--secondary: #06b6d4;         /* Cyan 500 */
--accent: #f472b6;            /* Pink 400 - điểm nhấn nữ tính */
--accent-warm: #fbbf24;       /* Amber 400 - CTA buttons */

/* Background - Gradient mềm mại */
--bg-light: linear-gradient(135deg, #fafafa 0%, #f0f9ff 50%, #faf5ff 100%);
--bg-dark: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);

/* Surface Colors */
--surface-light: rgba(255, 255, 255, 0.85);
--surface-dark: rgba(30, 41, 59, 0.6);
--glass-border: rgba(255, 255, 255, 0.2);

/* Text Colors */
--text-primary: #1e293b;
--text-secondary: #64748b;
--text-muted: #94a3b8;

/* Status Colors - Pastel */
--success: #86efac;           /* Green 300 */
--warning: #fde047;           /* Yellow 300 */
--error: #fca5a5;             /* Red 300 */
--info: #93c5fd;              /* Blue 300 */
```

### Typography

```css
/* Font Stack */
--font-display: 'Plus Jakarta Sans', sans-serif;
--font-body: 'Inter', 'Be Vietnam Pro', sans-serif;

/* Hierarchy */
H1: 2.5rem (40px) / font-weight: 700 / letter-spacing: -0.02em
H2: 1.875rem (30px) / font-weight: 600 / letter-spacing: -0.01em
H3: 1.25rem (20px) / font-weight: 600
Body: 0.875rem (14px) / font-weight: 400 / line-height: 1.6
Caption: 0.75rem (12px) / font-weight: 500
```

### Spacing System (Tailwind)

```
4px  - 1 (xs)
8px  - 2 (sm)
12px - 3
16px - 4 (base)
24px - 6
32px - 8
48px - 12
64px - 16
```

### Border Radius (Shadcn Style)

```
--radius-sm: 6px   (buttons, tags)
--radius-md: 12px  (cards, inputs)
--radius-lg: 16px  (modals, panels)
--radius-xl: 24px  (hero sections)
--radius-full: 9999px (pills, avatars)
```

---

## 🌟 Component Library

### Buttons (Shadcn Style)

```
Primary:    bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl
Secondary:  bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl
Accent:     bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl
Ghost:      hover:bg-slate-100 text-slate-700 rounded-xl
Outline:    border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl
```

### Cards

```
Standard:   bg-white rounded-2xl shadow-md border-0 p-6
Glass:      bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-6
Gradient:   bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-2xl p-6
Hover:      transition-all duration-300 hover:shadow-xl hover:-translate-y-1
```

### Inputs

```
Standard:   bg-white border border-slate-200 rounded-xl px-4 py-3
Focus:      ring-2 ring-indigo-500/20 border-indigo-500
Glass:      bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl
Search:     pl-12 pr-4 py-4 rounded-2xl shadow-lg
```

---

## 👤 1. USER WEB - Thiết kế chi tiết

### Layout Structure (Giữ nguyên cấu trúc HTML)
```
Header (Glassmorphism v2)
  └── Logo | Navigation | User Actions

Hero Section
  └── Gradient Background + Floating Animation
  └── Left: Title, Search, Tags
  └── Right: Floating Destination Card

Personal Picks
  └── Section Header + Grid Cards

Destinations
  └── Filter Pills + Destination Grid

Top Partners
  └── Horizontal Scroll Carousel

Promo Banner
  └── Gradient Cards + Countdown

Business Services
  └── Service Cards Grid

Smart Search
  └── Filter Cards (Budget, Pace, Interests)

Planner
  └── Left: Stop List | Right: Map

Itineraries
  └── Tab Navigation + Timeline

Features
  └── 4-column Feature Grid

Stats
  └── Animated Counter Row

Reviews
  └── Carousel with Dots

CTA Section
  └── Contact Form

Footer
```

### 1.1 Header - Glassmorphism v2

**Mô tả thiết kế:**
- Background: `bg-white/70 backdrop-blur-xl`
- Border bottom: `border-white/20`
- Height: 64px
- Logo: Gradient text từ indigo sang cyan
- Navigation: Pills với hover effect mượt mà
- User actions: Rounded icons với notification dot

**Thay thế class cũ:**
```css
/* Cũ */
.site-header { backdrop-filter: blur(24px); background: var(--header-bg); }

/* Mới - Tailwind */
<nav class="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/70 border-b border-white/20">
```

### 1.2 Hero Section - Soft Gradient

**Background mới:**
- Gradient: `from-slate-50 via-indigo-50/30 to-cyan-50/20`
- 3 animated orbs với blur-3xl
- Floating card với continuous animation

**Typography:**
- Title: 5xl font-bold với gradient text
- Subtitle: lg text-slate-600

**Search Box:**
- Glass effect: `bg-white/80 backdrop-blur-sm`
- Rounded: `rounded-2xl`
- Shadow: `shadow-xl`
- Button gradient: `from-indigo-600 to-cyan-500`

### 1.3 Destination Cards

**Card design:**
- Border radius: `rounded-2xl`
- Shadow: `shadow-md hover:shadow-xl`
- Image: `aspect-[4/3]` với hover scale
- Heart button: Floating top-right với glass effect
- Rating badge: Bottom-left với star icon

**Hover animation:**
- Scale: 1.02
- Y translate: -4px
- Shadow tăng
- Image zoom: 1.1

### 1.4 Filter Bar - Animated Pills

**Design:**
- Pills dạng rounded-full
- Active: `bg-indigo-600 text-white shadow-lg`
- Inactive: `bg-white border border-slate-200`
- Stagger animation khi load

### 1.5 Smart Search Form

**Card container:**
- Gradient background: `from-white to-slate-50`
- Rounded: `rounded-3xl`
- Padding: 2rem

**Radio tiles:**
- Border: 2px với transition
- Selected: `border-indigo-500 bg-indigo-50`
- Hover: `hover:border-indigo-300`
- Rounded: `rounded-xl`

### 1.6 Planner Section

**Layout:**
- Left panel: 40% width
- Right map: 60% width
- Glass card container

**Stop list items:**
- Drag handle icon
- Number badge gradient
- Remove button (ghost)

### 1.7 Feature Cards

**Grid:** 4 columns responsive
**Card:**
- Icon: Gradient background circle
- Title: font-semibold
- Description: text-slate-500
- Hover: Border color change + lift

### 1.8 Stats Section

**Animated counters:**
- Large number: 3xl font-bold gradient
- Label: text-slate-500 uppercase tracking-wide
- Stagger animation on scroll

### 1.9 Reviews Carousel

**Card design:**
- Quote icon gradient
- Avatar với ring
- 5-star rating
- Navigation dots

### 1.10 CTA Section

**Background:**
- Gradient: `from-indigo-600 via-purple-600 to-pink-500`
- Rounded top corners

**Form:**
- Glass inputs
- Gradient submit button

---

## 🏢 2. BUSINESS WEB - Thiết kế chi tiết

### Layout Structure
```
Sidebar (Fixed, 280px)
  └── Logo | Profile Card | Navigation Groups | Footer

Main Content
  └── Topbar (Search, Date, Actions, User)
  └── View Container (Dynamic)
```

### 2.1 Sidebar - Premium Glass

**Design:**
- Width: 280px fixed
- Background: `bg-slate-900/80 backdrop-blur-2xl`
- Border right: `border-white/10`
- Logo gradient: `from-indigo-500 to-purple-500`

**Profile Card:**
- Glass effect
- Avatar với gradient fallback
- Badge: `bg-indigo-500/20 text-indigo-300`

**Navigation:**
- Groups với uppercase header
- Active item: `bg-gradient-to-r from-indigo-600 to-purple-600`
- Hover: `bg-white/5`
- Rounded: `rounded-xl`

### 2.2 Topbar

**Design:**
- Height: 72px
- Background: `bg-slate-900/70 backdrop-blur-xl`
- Border bottom: `border-white/10`

**Elements:**
- Title: font-bold text-xl
- Date chip: `bg-white/5 border border-white/10 rounded-xl`
- Search: Glass input với icon
- Bell: Notification badge pulse animation
- User chip: Avatar + name + dropdown

### 2.3 Dashboard Cards

**Stat cards grid:**
- 4 columns
- Gradient backgrounds:
  - Blue: `from-blue-500/20 to-cyan-500/20`
  - Green: `from-emerald-500/20 to-teal-500/20`
  - Purple: `from-purple-500/20 to-pink-500/20`
  - Amber: `from-amber-500/20 to-orange-500/20`

**Icons:**
- White background circle
- Gradient icon color

### 2.4 Charts Section

**Container:**
- Glass card: `bg-white/5 border border-white/10 rounded-2xl`
- Padding: 1.5rem

**Chart colors:**
- Primary: `#6366f1`
- Secondary: `#06b6d4`
- Grid: `rgba(255,255,255,0.1)`

### 2.5 Tables

**Header:**
- Background: `bg-white/5`
- Text: `text-slate-400 uppercase text-xs`

**Rows:**
- Border bottom: `border-white/5`
- Hover: `bg-white/5`
- Rounded corners on first/last

**Status badges:**
- Active: `bg-emerald-500/20 text-emerald-400`
- Pending: `bg-amber-500/20 text-amber-400`
- Inactive: `bg-slate-500/20 text-slate-400`

### 2.6 Service Management

**Service cards:**
- Image thumbnail rounded-lg
- Toggle switch (Shadcn style)
- Edit/Delete actions

**Form inputs:**
- Dark theme: `bg-slate-800 border-slate-700`
- Focus: `ring-indigo-500`

---

## 🛡️ 3. ADMIN WEB - Thiết kế chi tiết

### Layout Structure
```
Welcome Overlay (Animated)

Header
  └── Logo | System Pulse | Search | Clock | Notif | Profile

Sidebar (Collapsible)
  └── Navigation Groups | User Footer

Main Content
  └── Global Nav | AI Sentinel | Settings Drawer
  └── Tab Panels (Overview, Analytics, Users, etc.)
```

### 3.1 Welcome Overlay

**Animation:**
- Logo fade in + scale
- Title typewriter effect
- Progress bar shimmer
- Auto-dismiss sau 2s

**Design:**
- Background: `bg-slate-950`
- Gradient orbs animated
- Glass content card

### 3.2 Header - Cyber Elite

**System Pulse:**
- Green dot với pulse animation
- Latency indicator monospace
- Border: `border-emerald-500/30`

**Search Button:**
- Glass effect
- Keyboard shortcut: `⌘K`

**Settings Button:**
- Gear icon với rotate animation on hover

**Notification:**
- Bell với shake animation
- Red dot badge pulse

### 3.3 Sidebar

**Design:**
- Background: `bg-slate-900/50 backdrop-blur-xl`
- Border right: `border-white/5`

**Navigation Groups:**
- Header: `text-xs uppercase text-slate-500 font-bold`
- Items: `text-slate-400 hover:text-white`
- Active: `bg-gradient-to-r from-blue-600 to-cyan-600 text-white`
- Icons: Lucide 18px

**Badges:**
- Count: `bg-rose-500 text-white rounded-full text-xs`
- New tag: `bg-gradient-to-r from-amber-400 to-orange-400`

### 3.4 Overview Panel

**AI Insight Bar:**
- Gradient: `from-purple-500/10 to-blue-500/10`
- Border: `border-purple-500/20`
- Icon: Sparkles animation

**Stat Cards:**
```
Grid: 4 columns gap-6
Card: glass-panel-v2
Icon wrap: 48px rounded-2xl gradient background
Value: 2xl font-bold gradient text
Label: text-sm text-slate-400
```

**Quick Actions:**
- Icon buttons grid
- Hover: `bg-white/10 scale-105`
- Tooltip on hover

### 3.5 Analytics Panel

**Chart Container:**
- Height: 400px
- Background: `bg-slate-800/50`
- Rounded: 2xl

**Period Selectors:**
- Pills: `7D | 30D | 90D | 1Y`
- Active: `bg-blue-600`

**Data Cards:**
- Mini stat cards
- Sparkline charts
- Change indicator (up/down)

### 3.6 User Management

**Table Design:**
- Header: sticky, glass effect
- Row: hover highlight
- Avatar + Name column
- Role badges:
  - Admin: `bg-purple-500/20 text-purple-400`
  - User: `bg-blue-500/20 text-blue-400`
  - Business: `bg-emerald-500/20 text-emerald-400`

**Action Buttons:**
- Edit: `ghost` với pencil icon
- Delete: `ghost` với trash icon (red hover)

### 3.7 AI Sentinel Drawer

**Trigger Button:**
- Floating bottom-right
- Gradient: `from-purple-600 to-blue-600`
- Pulse ring animation
- Brain icon glow

**Drawer:**
- Width: 400px
- Glass background
- Chat interface
- Input với send button gradient

### 3.8 Settings Drawer

**Groups:**
- Giao diện: Theme presets, Accent colors, Radius, Blur
- Hiệu ứng: Toggles với switch animation
- Hệ thống: Time format, Performance mode

**Color Presets:**
- Grid 5x1
- Selected: `ring-2 ring-white`

---

## 🎬 Animation Specifications

### Framer Motion Variants

```typescript
// Page transition
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Card hover
const cardHover = {
  rest: { scale: 1, y: 0, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  hover: { 
    scale: 1.02, 
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Stagger children
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Floating animation
const float = {
  y: [0, -10, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
};

// Pulse for notifications
const pulse = {
  scale: [1, 1.2, 1],
  transition: { duration: 2, repeat: Infinity }
};
```

---

## 📱 Responsive Breakpoints

```
sm: 640px   - Mobile landscape
md: 768px   - Tablet
lg: 1024px  - Desktop
xl: 1280px  - Large desktop
2xl: 1536px - Extra large
```

### Key Responsive Changes

**Mobile:**
- Sidebar collapses to hamburger menu
- Grid becomes single column
- Hero text size reduces
- Search full width

**Tablet:**
- 2-column grids
- Sidebar narrows
- Font sizes slightly smaller

**Desktop:**
- Full layout
- Hover effects active
- Sidebar fully expanded

---

## 🔧 Implementation Notes

### Shadcn/ui Components cần cài đặt:

```bash
npx shadcn add button
npx shadcn add card
npx shadcn add input
npx shadcn add badge
npx shadcn add avatar
npx shadcn add switch
npx shadcn add select
npx shadcn add tabs
npx shadcn add dialog
npx shadcn add dropdown-menu
npx shadcn add navigation-menu
npx shadcn add scroll-area
npx shadcn add separator
npx shadcn add skeleton
npx shadcn add tooltip
```

### Lucide Icons cần dùng:

```typescript
import {
  Search, Bell, User, Heart, Star, MapPin,
  Compass, Sparkles, Wallet, Clock, CheckCircle,
  Settings, LogOut, Menu, X, ChevronDown,
  ChevronRight, Home, Calendar, Users, Building,
  MessageSquare, BarChart3, Shield, FileText,
  Mail, Phone, Globe, Filter, Grid, List,
  Plus, Trash2, Edit3, Eye, Download,
  Upload, RefreshCw, Check, XCircle, AlertCircle,
  Info, ArrowRight, ArrowLeft, ExternalLink,
  Moon, Sun, Monitor, Smartphone, Tablet
} from 'lucide-react';
```

### Tailwind Config extensions:

```javascript
// tailwind.config.js
module.exports = {
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
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    }
  }
}
```

---

## ✅ Migration Checklist

### User Web
- [ ] Header glassmorphism v2
- [ ] Hero gradient + floating card
- [ ] Destination cards với hover
- [ ] Filter pills animation
- [ ] Smart search form styling
- [ ] Planner glass panels
- [ ] Feature cards grid
- [ ] Stats counter animation
- [ ] Reviews carousel
- [ ] CTA gradient section

### Business Web
- [ ] Sidebar premium glass
- [ ] Profile card redesign
- [ ] Navigation active states
- [ ] Topbar layout
- [ ] Stat cards gradient
- [ ] Charts container
- [ ] Tables redesign
- [ ] Service management UI
- [ ] Settings panel

### Admin Web
- [ ] Welcome overlay animation
- [ ] Header system pulse
- [ ] Sidebar navigation
- [ ] AI insight bar
- [ ] Overview stat cards
- [ ] Analytics charts
- [ ] User management table
- [ ] AI sentinel drawer
- [ ] Settings customization

---

## 🎯 Design Principles Summary

1. **Soft & Modern**: Gradient mềm mại, không gian thoáng đãng
2. **Consistent**: Cùng design language xuyên suốt 3 trang
3. **Accessible**: Độ tương phản đảm bảo, focus states rõ ràng
4. **Animated**: Hiệu ứng mượt mà, không gây rối mắt
5. **Responsive**: Hoạt động tốt trên mọi thiết bị
6. **Maintainable**: Class Tailwind rõ ràng, dễ điều chỉnh
