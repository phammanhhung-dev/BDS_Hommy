# BEM Migration Guide - Chi tiết

## 📚 Mục lục

1. [BEM Methodology Overview](#bem-methodology-overview)
2. [Naming Conventions](#naming-conventions)
3. [Migration Patterns](#migration-patterns)
4. [Step-by-Step Migration Process](#step-by-step-migration-process)
5. [Examples from Actual Migrations](#examples-from-actual-migrations)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
7. [Testing Checklist](#testing-checklist)

---

## 🎯 BEM Methodology Overview

**BEM = Block Element Modifier**

### Block
Standalone entity that is meaningful on its own.
```css
.button { }
.modal { }
.header { }
```

### Element
Part of a block that has no standalone meaning.
```css
.button__icon { }
.modal__header { }
.header__logo { }
```

### Modifier
Flag on a block or element for changing appearance or behavior.
```css
.button--primary { }
.button--disabled { }
.modal__header--large { }
```

---

## 📝 Naming Conventions

### 1. Block Names
- **Format:** `kebab-case`
- **Pattern:** Component name or feature name
- **Examples:**
  ```css
  .modal-cap-nhat-du-an
  .login-page
  .dashboard-chart
  ```

### 2. Element Names
- **Format:** `block__element` (double underscore)
- **Examples:**
  ```css
  .modal-cap-nhat-du-an__header
  .login-page__form
  .dashboard-chart__legend
  ```

### 3. Modifier Names
- **Format:** `block--modifier` or `block__element--modifier` (double dash)
- **Examples:**
  ```css
  .modal-cap-nhat-du-an__btn--primary
  .login-page--rainbow
  .dashboard-chart__bar--active
  ```

### 4. Animation Names
- **Format:** `block-animation-name`
- **Pattern:** Prefix keyframe animations with block name to avoid conflicts
- **Examples:**
  ```css
  @keyframes modal-cap-nhat-du-an-spin { }
  @keyframes login-page-rainbow-bg { }
  ```

---

## 🔄 Migration Patterns

### Pattern 1: Simple Modal/Component

**Before:**
```css
.modal-overlay { }
.modal-container { }
.modal-header { }
.modal-title { }
.modal-close { }
.modal-body { }
.modal-footer { }
.btn { }
.btn.primary { }
```

**After (BEM):**
```css
.modal-component__overlay { }
.modal-component { }
.modal-component__header { }
.modal-component__title { }
.modal-component__close-btn { }
.modal-component__body { }
.modal-component__footer { }
.modal-component__btn { }
.modal-component__btn--primary { }
```

### Pattern 2: Nested Selectors

**Before:**
```css
.modal-preview-duan .modal-header { }
.modal-preview-duan .modal-header .title { }
.modal-preview-duan .modal-body .content { }
```

**After (BEM):**
```css
.modal-preview-duan__header { }
.modal-preview-duan__header-title { }
.modal-preview-duan__body-content { }
```

**⚠️ Rule:** Avoid nesting in BEM. Use flat structure with descriptive element names.

### Pattern 3: State/Modifier Classes

**Before:**
```css
.button { }
.button.active { }
.button.disabled { }
.input.error { }
```

**After (BEM):**
```css
.component__btn { }
.component__btn--active { }
.component__btn--disabled { }
.component__input--error { }
```

### Pattern 4: Multiple Word Elements

**Before:**
```css
.form-group { }
.input-field { }
.submit-button { }
```

**After (BEM):**
```css
.form__group { }
.form__input-field { }  /* multi-word element name is OK */
.form__submit-btn { }
```

### Pattern 5: Animations

**Before:**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

**After (BEM):**
```css
@keyframes component-name-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.component-name__spinner {
  animation: component-name-spin 1s linear infinite;
}
```

---

## 🚀 Step-by-Step Migration Process

### Step 1: Analyze Current CSS

**Command:**
```bash
# View CSS file
cat client/src/components/YourComponent/YourComponent.css

# Check for JSX usage
grep -r "className=" client/src/components/YourComponent/
```

**Questions to answer:**
1. What is the main component name? → This becomes your **block name**
2. How many unique selectors are there?
3. Are there nested selectors that need flattening?
4. Are there animations that need prefixing?

### Step 2: Create Class Name Mapping

Create a mapping table:

| Old Class Name | New BEM Class Name | Type |
|----------------|-------------------|------|
| `.modal-overlay` | `.modal-component__overlay` | Element |
| `.modal-container` | `.modal-component` | Block |
| `.btn primary` | `.modal-component__btn--primary` | Element + Modifier |
| `.header` | `.modal-component__header` | Element |

### Step 3: Migrate CSS File

```css
/* ============================================
   COMPONENT NAME - BEM NAMING CONVENTION
   Block: component-name
   ============================================ */

/* Block */
.component-name {
  /* styles */
}

/* Elements */
.component-name__element {
  /* styles */
}

.component-name__another-element {
  /* styles */
}

/* Modifiers */
.component-name__element--modifier {
  /* styles */
}

/* Animations */
@keyframes component-name-animation {
  /* keyframes */
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .component-name__element {
    /* responsive styles */
  }
}
```

### Step 4: Migrate JSX/TSX File

**Find JSX file:**
```bash
find client/src -name "YourComponent.jsx" -o -name "YourComponent.tsx"
```

**Replace className references:**

**Before:**
```jsx
<div className="modal-overlay">
  <div className="modal-container">
    <div className="modal-header">
      <h2 className="modal-title">Title</h2>
      <button className="modal-close">×</button>
    </div>
    <div className="modal-body">
      <button className="btn primary">Submit</button>
    </div>
  </div>
</div>
```

**After:**
```jsx
<div className="modal-component__overlay">
  <div className="modal-component">
    <div className="modal-component__header">
      <h2 className="modal-component__title">Title</h2>
      <button className="modal-component__close-btn">×</button>
    </div>
    <div className="modal-component__body">
      <button className="modal-component__btn modal-component__btn--primary">Submit</button>
    </div>
  </div>
</div>
```

**Tips:**
- Search and replace with care: `"modal-container"` → `"modal-component"`
- Use regex for multiple replacements if confident
- Always verify in browser after changes

### Step 5: Test in Browser

1. **Visual Check:**
   - Open component in browser
   - Verify all styles are applied correctly
   - Check responsive breakpoints
   - Test interactions (hover, focus, active states)

2. **Check Console:**
   - No CSS warnings
   - No missing class names

3. **Cross-browser Test:**
   - Chrome
   - Firefox
   - Safari (if available)

### Step 6: Document Changes

Add to commit message:
```
refactor(css): migrate ComponentName to BEM

- Migrate ComponentName.css to BEM with block `component-name`
- Update JSX className references
- Prefix animations: spin → component-name-spin

Co-authored-by: AI Agent <ai@cursor.com>
```

---

## 📖 Examples from Actual Migrations

### Example 1: ModalCapNhatDuAn

**Original Structure (Non-BEM):**
```css
.modal-duan-overlay { }
.modal-duan-container { }
.modal-duan-header { }
.modal-duan-title { }
.modal-duan-close { }
.modal-duan-body { }
.modal-duan-grid { }
.modal-duan-field { }
.modal-duan-field.checkbox { }
.checkbox-label { }
.field-hint { }
.label-required { }
.modal-duan-btn { }
.modal-duan-btn.primary { }
.modal-duan-btn.secondary { }
```

**New BEM Structure:**
```css
.modal-cap-nhat-du-an__overlay { }
.modal-cap-nhat-du-an { }  /* Block */
.modal-cap-nhat-du-an__header { }
.modal-cap-nhat-du-an__title { }
.modal-cap-nhat-du-an__close-btn { }
.modal-cap-nhat-du-an__body { }
.modal-cap-nhat-du-an__grid { }
.modal-cap-nhat-du-an__field { }
.modal-cap-nhat-du-an__field--checkbox { }  /* Modifier */
.modal-cap-nhat-du-an__label--checkbox { }
.modal-cap-nhat-du-an__hint { }
.modal-cap-nhat-du-an__label--required { }
.modal-cap-nhat-du-an__btn { }
.modal-cap-nhat-du-an__btn--primary { }  /* Modifier */
.modal-cap-nhat-du-an__btn--secondary { }
```

**Key Changes:**
1. **Block name:** `modal-duan-*` → `modal-cap-nhat-du-an`
2. **Elements:** Added `__` separator
3. **Modifiers:** `.class1.class2` → `.class1--modifier`
4. **Consistency:** All classes prefixed with block name

**JSX Migration:**
```jsx
// Before
<div className="modal-duan-overlay">
  <div className="modal-duan-container">
    <div className="modal-duan-field checkbox">
      <label className="checkbox-label">...</label>
    </div>
    <button className="modal-duan-btn primary">Save</button>
  </div>
</div>

// After
<div className="modal-cap-nhat-du-an__overlay">
  <div className="modal-cap-nhat-du-an">
    <div className="modal-cap-nhat-du-an__field modal-cap-nhat-du-an__field--checkbox">
      <label className="modal-cap-nhat-du-an__label--checkbox">...</label>
    </div>
    <button className="modal-cap-nhat-du-an__btn modal-cap-nhat-du-an__btn--primary">Save</button>
  </div>
</div>
```

### Example 2: Login Page

**Original Structure:**
```css
.login-page { }
.login-form { }
.form-group { }
.back-home-btn { }
.login-links { }
.toggle-switch { }
.switch { }
.slider { }
```

**New BEM Structure:**
```css
.login-page { }  /* Block */
.login-page__form { }
.login-page__form-group { }
.login-page__back-btn { }
.login-page__links { }
.login-page__toggle-switch { }
.login-page__switch { }
.login-page__switch-slider { }
.login-page--rainbow { }  /* Modifier for animation mode */
```

**Animation Prefix:**
```css
/* Before */
@keyframes spin { }
@keyframes rainbow-bg { }
@keyframes rotate-deer { }

/* After */
@keyframes login-page-spin { }
@keyframes login-page-rainbow-bg { }
@keyframes login-page-rotate-deer { }
```

**JSX Migration:**
```jsx
// Before
<div className={`login-page${isSwitchOn ? ' rainbow' : ''}`}>
  <form className="login-form">
    <div className="form-group">
      <input />
    </div>
    <button className="back-home-btn">Back</button>
  </form>
</div>

// After
<div className={`login-page${isSwitchOn ? ' login-page--rainbow' : ''}`}>
  <form className="login-page__form">
    <div className="login-page__form-group">
      <input className="login-page__input" />
    </div>
    <button className="login-page__back-btn">Back</button>
  </form>
</div>
```

---

## ⚠️ Common Pitfalls & Solutions

### Pitfall 1: Over-nesting Elements

**❌ Wrong:**
```css
.block__element__sub-element__item { }
```

**✅ Correct:**
```css
.block__element-item { }
```

**Rule:** BEM doesn't mirror DOM structure. Use flat, descriptive names.

### Pitfall 2: Generic Class Names

**❌ Wrong:**
```css
.modal-overlay { }  /* Conflicts with other modals */
.header { }  /* Too generic */
.button { }  /* Used everywhere */
```

**✅ Correct:**
```css
.modal-preview-duan__overlay { }
.modal-preview-duan__header { }
.modal-preview-duan__btn { }
```

### Pitfall 3: Modifier Without Base

**❌ Wrong:**
```css
.block__btn--primary { }  /* No base .block__btn */
```

**✅ Correct:**
```css
.block__btn { }  /* Base styles */
.block__btn--primary { }  /* Modifier on top of base */
```

**JSX:**
```jsx
{/* Apply both base and modifier */}
<button className="block__btn block__btn--primary">Click</button>
```

### Pitfall 4: Mixing BEM with Non-BEM

**❌ Wrong:**
```css
.modal-component__header .title { }  /* Nested selector */
.modal-component__btn.active { }  /* Non-BEM modifier */
```

**✅ Correct:**
```css
.modal-component__header-title { }
.modal-component__btn--active { }
```

### Pitfall 5: Forgetting to Update Animations

**❌ Wrong:**
```css
@keyframes spin { }  /* Global, can conflict */

.modal-component__spinner {
  animation: spin 1s;  /* References global */
}
```

**✅ Correct:**
```css
@keyframes modal-component-spin { }

.modal-component__spinner {
  animation: modal-component-spin 1s;
}
```

---

## ✅ Testing Checklist

After migration, verify:

- [ ] **Visual Check**
  - [ ] Component renders correctly
  - [ ] No visual regressions
  - [ ] Responsive design still works
  - [ ] All breakpoints tested

- [ ] **Interactive States**
  - [ ] Hover states work
  - [ ] Focus states work
  - [ ] Active/pressed states work
  - [ ] Disabled states work

- [ ] **Modifiers**
  - [ ] All modifier classes work
  - [ ] Multiple modifiers can be combined
  - [ ] Conditional modifiers toggle correctly

- [ ] **Animations**
  - [ ] All animations play correctly
  - [ ] No animation conflicts with other components
  - [ ] Animation names are unique

- [ ] **Browser Compatibility**
  - [ ] Chrome: ✓
  - [ ] Firefox: ✓
  - [ ] Safari: ✓
  - [ ] Edge: ✓

- [ ] **Console Checks**
  - [ ] No CSS warnings
  - [ ] No missing class references
  - [ ] No 404s for CSS files

- [ ] **Code Quality**
  - [ ] CSS is formatted consistently
  - [ ] JSX className props are on correct elements
  - [ ] No duplicate selectors
  - [ ] Comments updated if needed

---

## 🔧 Tools & Scripts

### Quick Search & Replace Script (Bash)

```bash
#!/bin/bash
# replace-bem.sh - Replace old class with new BEM class

OLD_CLASS="modal-duan"
NEW_CLASS="modal-cap-nhat-du-an"
FILE_PATH="client/src/components/ChuDuAn/ModalCapNhatDuAn.jsx"

# Replace in JSX
sed -i "s/className=\"${OLD_CLASS}/className=\"${NEW_CLASS}/g" $FILE_PATH

echo "✅ Replaced ${OLD_CLASS} with ${NEW_CLASS} in ${FILE_PATH}"
```

### Grep Helper Commands

```bash
# Find all CSS files
find client/src -name "*.css" -type f

# Find all components using a specific class
grep -r "className=\"old-class\"" client/src/

# Find animation usage
grep -r "@keyframes" client/src/ --include="*.css"

# Count class occurrences
grep -o "\.old-class" file.css | wc -l
```

---

## 📚 References

- [BEM Official](https://getbem.com/)
- [BEM Methodology](https://en.bem.info/methodology/)
- [CSS Guidelines - BEM](https://cssguidelin.es/#bem-like-naming)
- [Goldbergyoni Node Best Practices](https://github.com/goldbergyoni/nodebestpractices) (Referenced in `.cursor/rules/main.md`)
- [BEM React](https://github.com/bem/bem-react) (Referenced in `.cursor/rules/main.md`)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-04  
**Author:** AI Agent + Human Review


















