# 🎨 DESIGN SYSTEM - COLOR PALETTES BY ACTOR

**Version:** 2.0  
**Date:** October 24, 2025  
**Scope:** Định nghĩa bộ màu chuyên biệt cho 5 actors trong hệ thống DapPhongTro

---

## 📖 Tổng quan

Mỗi actor có một bộ màu riêng biệt phản ánh:
- **Vai trò** và **quyền hạn** trong hệ thống
- **Trải nghiệm** phù hợp với use cases
- **Tâm lý** và **hành vi** người dùng

---

## 1️⃣ Khách hàng (Customer) - **Soft Tech Theme**

**Profile:** Người dùng cuối, tìm kiếm nơi ở, cần UI thân thiện, dễ đọc, tối giản.

### 🎨 Color Palette

```css
/* Customer Theme - Soft Tech */
--customer-primary: #334155;        /* Slate 700 - Neutral, professional */
--customer-secondary: #6366F1;      /* Indigo 500 - Trust, action */
--customer-accent: #06B6D4;         /* Cyan 500 - Fresh, modern */
--customer-background: #F9FAFB;     /* Light gray - Clean */
--customer-surface: #FFFFFF;        /* Pure white - Clarity */
--customer-text: #0B1220;           /* Ink cool - Readable */
--customer-border: #E5E7EB;         /* Gray 200 */
```

### 🎯 Usage Guidelines

- **Primary (Slate 700):** Navigation, body text, content dài để tránh chói
- **Secondary (Indigo 500):** CTA buttons, links chính, active states
- **Accent (Cyan 500):** Icons, charts, highlights, empty states
- **Hover:** Indigo tối ~8% (`#5457C9`)
- **Focus:** Indigo với opacity 0.15 ring

### 📱 Components

- Search bar: Border Indigo on focus
- Cards: Surface white on Background gray
- CTA: Indigo background, white text
- Success messages: Cyan accents

---

## 2️⃣ Chủ dự án (Project Owner) - **Emerald Noir Theme**

**Profile:** B2B cao cấp, quản lý tài sản, cần cảm giác sang trọng, chuyên nghiệp.

### 🎨 Color Palette

```css
/* Project Owner Theme - Emerald Noir (Current Implementation) */
--chuduan-primary: #14532D;         /* Deep Emerald - Wealth, stability */
--chuduan-secondary: #0F766E;       /* Teal 700 - Growth */
--chuduan-accent: #D4AF37;          /* Gold - Premium, exclusive */
--chuduan-background: #F5F7F7;      /* Porcelain - Elegant */
--chuduan-surface: #FFFFFF;         /* Pure white */
--chuduan-text: #111827;            /* Gray 900 - Strong contrast */
```

### 🎯 Usage Guidelines

- **Primary (Deep Emerald):** Headers, main CTA, navigation active
- **Secondary (Teal 700):** Sub-actions, info badges, status "verified"
- **Accent (Gold):** Tiết chế - chỉ dùng cho icons nhỏ, dividers mảnh, metric highlights
- **Hover Primary:** Tối ~8% (`#0F3A20`)
- **Hover Gold:** Sáng ~6% (`#DDB945`)

### 📱 Components

- Dashboard cards: Gold border-top (2px)
- Metrics: Gold icons với deep emerald text
- CTA: Deep emerald background, white text
- Premium badges: Gold background, dark text

**⚠️ Note:** Hiện tại module Chủ dự án đang dùng **Purple theme tạm thời**. Sẽ migrate sang Emerald Noir ở phase 2.

---

## 3️⃣ Nhân viên Bán hàng (Sales Staff) - **Corporate Blue Theme**

**Profile:** Staff tuyến đầu, cần UI nhanh, hiệu quả, tập trung vào productivity.

### 🎨 Color Palette

```css
/* Sales Theme - Corporate Blue */
--sales-primary: #1D4ED8;           /* Blue 600 - Trust, authority */
--sales-secondary: #0EA5E9;         /* Sky 500 - Communication */
--sales-accent: #F59E0B;            /* Amber 500 - Urgency, highlights */
--sales-background: #F8FAFC;        /* Slate 50 - Professional */
--sales-surface: #FFFFFF;           /* Pure white */
--sales-text: #0F172A;              /* Slate 900 - High contrast */
```

### 🎯 Usage Guidelines

- **Primary (Blue 600):** Main CTA, links, active states
- **Secondary (Sky 500):** Info statuses, notifications, secondary actions
- **Accent (Amber 500):** Highlights, empty states, warnings, pending items
- **Hover Primary:** Tối ~8% (`#1A43B8`)
- **High contrast:** Text on Background đạt WCAG AAA

### 📱 Components

- Appointment cards: Sky blue borders for "upcoming"
- Action buttons: Blue primary
- Urgent tasks: Amber badges
- Lead status: Blue (contacted), Amber (follow-up), Green (closed)

---

## 4️⃣ Nhân viên Điều hành (Operator) - **Editorial Warm Theme**

**Profile:** Backoffice, xử lý content, duyệt tin, cần UI êm mắt cho đọc lâu.

### 🎨 Color Palette

```css
/* Operator Theme - Editorial Warm */
--operator-primary: #7A3E2E;        /* Terracotta deep - Earthy, stable */
--operator-secondary: #5B5A57;      /* Warm Gray - Neutral */
--operator-accent: #C9A227;         /* Ochre - Attention, editorial */
--operator-background: #FFFBF5;     /* Cream - Warm, comfortable */
--operator-surface: #F3EEE7;        /* Bone - Soft */
--operator-text: #1B1B1B;           /* Ink - Readable */
```

### 🎯 Usage Guidelines

- **Primary (Terracotta):** Headings, section titles, main actions
- **Secondary (Warm Gray):** Body text, borders, dividers
- **Accent (Ochre):** Links, highlights, điểm nhấn quan trọng
- **Hover Accent:** Đậm ~8% (`#B08F1F`)
- **Nền ấm:** Cream background cho trải nghiệm đọc lâu không mỏi mắt

### 📱 Components

- Content cards: Bone surface on Cream background
- Approval buttons: Terracotta
- Links trong text: Ochre
- Status badges: Warm Gray với text màu tối

---

## 5️⃣ Quản trị viên (System Administrator) - **Forest & Stone Theme**

**Profile:** Cao cấp nhất, quản lý toàn hệ thống, cần UI đáng tin cậy, mạnh mẽ.

### 🎨 Color Palette

```css
/* Admin Theme - Forest & Stone */
--admin-primary: #1B4332;           /* Forest - Authority, control */
--admin-secondary: #2D6A4F;         /* Moss - Growth, system health */
--admin-accent: #B68C3A;            /* Brass - Premium data, key metrics */
--admin-background: #F3F4F1;        /* Stone - Stable, neutral */
--admin-surface: #FFFFFF;           /* Pure white */
--admin-text: #101418;              /* Charcoal - Strong */
```

### 🎯 Usage Guidelines

- **Primary (Forest):** Hero sections, main CTA, critical actions
- **Secondary (Moss):** Status "healthy", progress indicators, sub-actions
- **Accent (Brass):** Tiết kiệm - chỉ cho icons quan trọng, số liệu key
- **Cards:** Surface white on Stone background với shadow nhẹ
- **Danger actions:** Override với red (#DC2626)

### 📱 Components

- Dashboard hero: Forest gradient
- System health: Moss status badges
- Key metrics: Brass icons
- Critical buttons: Forest background, white text
- Audit logs: Stone background với white cards

---

## 🔄 Migration Strategy

### Phase 1 (Current - Oct 2025)
- ✅ Customer: Implementing Soft Tech
- ⚠️ Project Owner: Using **Purple temporary** (Light Glass Morphism)
- 🔜 Sales: Not implemented yet
- 🔜 Operator: Not implemented yet
- 🔜 Admin: Not implemented yet

### Phase 2 (Nov 2025)
- Migrate Project Owner → Emerald Noir
- Implement Sales → Corporate Blue
- Implement Operator → Editorial Warm

### Phase 3 (Dec 2025)
- Implement Admin → Forest & Stone
- Create theme switcher component
- Document all components per theme

---

## 📐 Design Tokens Structure

Mỗi actor có bộ design tokens riêng theo pattern:

```css
:root {
  /* Actor-specific colors */
  --{actor}-primary: #HEX;
  --{actor}-primary-dark: #HEX;      /* Hover state */
  --{actor}-primary-light: #HEX;     /* Light variant */
  --{actor}-primary-bg: rgba(...);   /* Background tint */
  
  --{actor}-secondary: #HEX;
  --{actor}-accent: #HEX;
  
  --{actor}-background: #HEX;        /* Page background */
  --{actor}-surface: #HEX;           /* Card/panel background */
  --{actor}-text: #HEX;              /* Primary text */
  --{actor}-text-secondary: #HEX;    /* Secondary text */
  
  --{actor}-border: #HEX;
  --{actor}-shadow: rgba(...);
}
```

### Component Mapping Example

```css
/* Customer buttons */
.customer-btn-primary {
  background: var(--customer-secondary); /* Indigo */
  color: white;
}
.customer-btn-primary:hover {
  background: #5457C9; /* Indigo dark 8% */
}

/* Project Owner buttons */
.chuduan-btn-primary {
  background: var(--chuduan-primary); /* Deep Emerald */
  color: white;
}
.chuduan-btn-primary:hover {
  background: #0F3A20; /* Emerald darker 8% */
}
```

---

## 🧪 Testing Guidelines

### Accessibility (WCAG 2.1 AA)
- Text/Background contrast ≥ 4.5:1 (normal text)
- Text/Background contrast ≥ 3:1 (large text)
- Colorblind-safe combinations

### Cross-theme Consistency
- Semantic meaning (success/warning/danger) giữ nguyên across themes
- Spacing, typography, shadows giống nhau
- Chỉ màu sắc thay đổi

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS variables support
- Fallback colors cho IE11 (nếu cần)

---

## 📚 Related Files

- **Current Implementation:**
  - `client/src/styles/ChuDuAnDesignSystem.css` (Purple/Light Glass Morphism)
  - `client/src/pages/ChuDuAn/*.css` (Component styles)

- **Future Implementation:**
  - `client/src/styles/CustomerDesignSystem.css` (Soft Tech)
  - `client/src/styles/SalesDesignSystem.css` (Corporate Blue)
  - `client/src/styles/OperatorDesignSystem.css` (Editorial Warm)
  - `client/src/styles/AdminDesignSystem.css` (Forest & Stone)

- **Documentation:**
  - `.github/copilot-instructions.md` - Main design guidelines
  - `.github/FIGMA_DESIGN_SYSTEM_RULES.md` - Figma integration
  - `docs/use-cases-v1.2.md` - Actor definitions

---

## 🎯 Action Items

- [ ] Review và approve bộ màu với stakeholders
- [ ] Tạo Figma design files cho 5 themes
- [ ] Implement CustomerDesignSystem.css (Soft Tech)
- [ ] Migrate ChuDuAnDesignSystem.css sang Emerald Noir
- [ ] Document component examples cho mỗi theme
- [ ] Create theme switcher utility (nếu cần multi-role users)
- [ ] Accessibility audit cho tất cả color combinations

---

**Approved by:** [Pending]  
**Last updated:** October 24, 2025  
**Next review:** November 15, 2025
