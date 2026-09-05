# 🧭 Navigation Logic - Chủ Dự Án Module

## 📋 Tổng quan

Navigation system được thiết kế responsive hoàn chỉnh, hoạt động mượt mà trên cả desktop và mobile với UX pattern chuẩn.

---

## 🎯 Component Architecture

### 1. **NavigationChuDuAn.jsx** - Main Sidebar Component

**State Management:**
```javascript
const [isCollapsed, setIsCollapsed] = useState(false);  // Desktop collapse state
const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile open/close state
```

**Event Listeners:**
- `window.addEventListener('cda:toggleSidebar', handler)` - Global event từ topbar để toggle mobile menu

**Menu Structure:**
- **Main Menu:** Dashboard, Tin đăng, Dự án, Cuộc hẹn
- **Report Menu:** Báo cáo, Hợp đồng
- **Footer:** Trang chủ, Cài đặt

**Navigation Logic:**
```javascript
const isActive = (path) => {
  if (path === '/chu-du-an/dashboard') {
    return location.pathname === path; // Exact match cho dashboard
  }
  return location.pathname.startsWith(path); // Prefix match cho sub-routes
};
```

**Click Handler:**
```javascript
onClick={() => { 
  navigate(item.path); 
  setIsMobileOpen(false); // Auto-close mobile menu khi navigate
}}
```

---

## 📱 Responsive Behavior

### **Desktop (≥1025px)**
✅ **Features:**
- Sidebar sticky, always visible
- Width: 280px (expanded) / 72px (collapsed)
- Toggle button: `←` (collapse) / `→` (expand)
- Topbar: **HIDDEN**
- Overlay: **DISABLED**

✅ **Interactions:**
- Click toggle button → Collapse/expand sidebar
- Navigation items show full text + icons
- User profile visible (when expanded)
- Quick actions button visible (when expanded)

---

### **Tablet (768px - 1024px)**
✅ **Features:**
- Sidebar: 240px (expanded) / 64px (collapsed)
- Topbar: **VISIBLE** (sticky top, auto-hide on scroll down)
- Overlay: **ENABLED** khi mobile menu open

✅ **Interactions:**
- Click hamburger icon (☰) → Toggle sidebar
- Sidebar slides in từ trái
- Click overlay → Close sidebar
- Navigate → Auto-close sidebar

---

### **Mobile (≤767px)**
✅ **Features:**
- Sidebar: Fixed position, `transform: translateX(-100%)` (hidden by default)
- Topbar: **ALWAYS VISIBLE**
- Overlay: Dark backdrop (rgba(0,0,0,0.5))
- Full-width sidebar khi open

✅ **Interactions:**
- Click hamburger (☰) → `isMobileOpen = true` → Sidebar slides in
- Click overlay → Close sidebar
- Click nav item → Navigate + auto-close
- Swipe left (future enhancement) → Close sidebar

---

## 🎨 CSS Classes Logic

### **Sidebar States:**
```css
.cda-sidebar                    /* Base: width 280px, sticky desktop */
.cda-sidebar.collapsed          /* Desktop collapsed: width 72px */
.cda-sidebar.mobile-open        /* Mobile open: transform(0) */
```

### **Overlay:**
```css
.cda-sidebar-overlay            /* Fixed backdrop, z-index 999 */
.cda-sidebar-overlay.active     /* Visible khi mobile menu open */
```

### **Topbar:**
```css
.cda-topbar                     /* Fixed top, display none on desktop */
.cda-topbar.hide                /* Auto-hide khi scroll down */
.cda-topbar-burger              /* Hamburger button với hover effect */
```

---

## 🔧 Layout Integration

### **ChuDuAnLayout.jsx:**
```jsx
<div className="chu-du-an-layout">
  {/* Topbar - chỉ hiện trên tablet/mobile */}
  <div className="cda-topbar">
    <button onClick={() => window.dispatchEvent(new Event('cda:toggleSidebar'))}>
      ☰
    </button>
    <div className="cda-topbar-title">Chủ dự án</div>
  </div>
  
  {/* Sidebar - responsive tự động */}
  <NavigationChuDuAn />
  
  {/* Main content */}
  <div className="chu-du-an-main">
    <div className="chu-du-an-content">{children}</div>
  </div>
</div>
```

### **Auto-hide Topbar Logic:**
```javascript
useEffect(() => {
  let lastY = window.scrollY || 0;
  const onScroll = () => {
    const current = window.scrollY || 0;
    const topbar = document.querySelector('.cda-topbar');
    if (current > lastY && current > 64) {
      topbar.classList.add('hide'); // Scroll down → hide
    } else {
      topbar.classList.remove('hide'); // Scroll up → show
    }
    lastY = current;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}, []);
```

---

## ✅ Testing Checklist

### **Desktop (1920x1080):**
- [ ] Sidebar hiển thị đầy đủ, sticky bên trái
- [ ] Toggle button hoạt động (collapse/expand)
- [ ] Topbar KHÔNG hiện
- [ ] Navigation active state đúng route
- [ ] Click nav item → Navigate thành công
- [ ] User profile + Quick action button hiển thị (khi expanded)

### **Tablet (1024x768 landscape):**
- [ ] Topbar hiện ở trên cùng
- [ ] Click hamburger → Sidebar slide in
- [ ] Click overlay → Sidebar close
- [ ] Auto-hide topbar khi scroll down
- [ ] Show topbar khi scroll up
- [ ] Sidebar không che content

### **Mobile (375x667 portrait):**
- [ ] Sidebar ẩn mặc định
- [ ] Topbar fixed top, KHÔNG auto-hide
- [ ] Click hamburger → Full sidebar slide in
- [ ] Dark overlay xuất hiện
- [ ] Click nav item → Navigate + auto-close
- [ ] Click overlay → Close sidebar
- [ ] Content padding đủ rộng cho touch

---

## 🎯 Key Features Implemented

✅ **Desktop collapse/expand** với smooth transition  
✅ **Mobile slide-in drawer** với overlay backdrop  
✅ **Auto-close** khi navigate (tránh user phải close thủ công)  
✅ **Global event system** (`cda:toggleSidebar`) cho communication giữa topbar và sidebar  
✅ **Active route highlighting** với logic exact match cho dashboard  
✅ **Auto-hide topbar** trên tablet khi scroll (tiết kiệm screen space)  
✅ **Accessibility:** aria-labels, keyboard-friendly, semantic HTML  

---

## 🐛 Known Issues & Future Enhancements

### **Current Limitations:**
- Mobile swipe gesture chưa được implement (có thể dùng library như `react-swipeable`)
- Không có animation cho user avatar khi collapse/expand
- Quick actions button không có tooltip khi collapsed

### **Future Improvements:**
- [ ] Add swipe-to-close gesture trên mobile
- [ ] Implement keyboard shortcuts (Ctrl+B để toggle sidebar)
- [ ] Add badge notifications cho "Tin đăng" (số tin chờ duyệt)
- [ ] Persistent state: Lưu `isCollapsed` vào localStorage
- [ ] Add smooth scroll-to-top button

---

## 🎨 Color Scheme (Emerald Noir Theme)

**Topbar & Sidebar Header:**
```css
background: linear-gradient(135deg, #14532D 0%, #0F766E 100%);
/* Deep Emerald → Teal gradient */
```

**Nav Active State:**
```css
background: linear-gradient(135deg, rgba(20, 83, 45, 0.15), rgba(15, 118, 110, 0.1));
color: #14532D;
border-left: 3px solid linear-gradient(#14532D, #0F766E);
```

**Hover Effects:**
```css
background: rgba(20, 83, 45, 0.08); /* Subtle emerald tint */
```

---

**Last Updated:** October 24, 2025  
**Version:** 2.0 - Full responsive với Emerald Noir theme
