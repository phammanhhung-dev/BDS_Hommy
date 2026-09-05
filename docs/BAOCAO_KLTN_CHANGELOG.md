# Changelog - Báo Cáo KLTN

## Version 3 - 2025-11-07 (Fixed Bold Markdown)

### ✅ Fixed Issues

#### 1. Bold Markdown `**...**` Parsing
- **Problem:** All text with `**bold syntax**` showed the asterisks instead of rendering bold
- **Examples:** 
  - `**Manual Testing:**` showed as "**Manual Testing:**" instead of **Manual Testing:**
  - `**Keywords:**` showed as "**Keywords:**" instead of **Keywords:**
  
- **Solution:** Enhanced `add_paragraph_text()` to parse markdown:
  ```python
  # Regex split: r'(\*\*.*?\*\*)'
  # For each part:
  #   - If starts/ends with **: Remove ** and make bold
  #   - Else: Regular text
  ```

- **Impact:** Fixed 71 instances throughout the document

---

## Version 2 - 2025-11-07 (First Major Fixes)

### ✅ Fixed Issues

#### 1. Password Hashing Algorithm
- **Problem:** Report stated "Bcrypt" but code actually uses "MD5"
- **Evidence:**
  - `server/controllers/authController.js:61` - Uses `crypto.createHash('md5')`
  - `client/src/pages/login/index.jsx:23` - Uses `CryptoJS.MD5()`
- **Fix:** Changed report from "2.5.3. Password Hashing (Bcrypt)" → "2.5.3. Password Hashing (MD5)"
- **Added:** Security warning about MD5 limitations

#### 2. Chat Rate Limit
- **Problem:** Code used 10 messages/minute but requirement was 50
- **Fixed both:**
  - Code: `server/socket/chatHandlers.js:12` - Changed `MAX_MESSAGES_PER_MINUTE = 10` → `50`
  - Report: `scripts/generate_baocao_kltn.py:545` - Changed description to 50 messages/minute
- **Status:** Code and report now synchronized ✅

#### 3. State Machine Headings Format
- **Problem:** Used `**3.3.1. TinĐăng State Machine:**` which doesn't appear in TOC
- **Fix:** Changed to `doc.add_heading('3.3.1. TinĐăng State Machine', level=3)`
- **Impact:** 4 headings now properly indexed in Table of Contents

---

## Version 1 - Original (Before Fixes)

### Known Issues
- ❌ Password hashing mismatch (Bcrypt vs MD5)
- ❌ Chat rate limit discrepancy (10 vs 50)
- ❌ State machine headings not in TOC
- ❌ Bold markdown showing asterisks

---

## Summary Statistics

### Changes by Version

| Version | Issues Fixed | Lines Changed | Files Modified |
|---------|--------------|---------------|----------------|
| v1      | 0            | -             | -              |
| v2      | 3            | ~10           | 2              |
| v3      | 1            | ~25           | 1              |
| **Total** | **4**      | **~35**       | **2 unique**   |

### Files Modified

1. **scripts/generate_baocao_kltn.py** (8 changes across 3 versions)
   - Line 95-117: Enhanced `add_paragraph_text()` with markdown parsing
   - Line 244: Fixed Keywords formatting
   - Line 533-537: Changed Bcrypt → MD5
   - Line 545: Changed 10 → 50 messages/minute
   - Lines 638, 643, 648, 652: Changed paragraph → heading for state machines

2. **server/socket/chatHandlers.js** (1 change)
   - Line 12: `MAX_MESSAGES_PER_MINUTE = 10` → `50`

---

## Testing Checklist

After each regeneration, verify:

- [ ] Open DOCX in Microsoft Word
- [ ] Update Table of Contents (References → Update Table)
- [ ] Check section 2.5.3 - Should say "MD5" not "Bcrypt"
- [ ] Check section 2.5.4 - Should say "50 messages/minute"
- [ ] Check section 3.3 - State machine headings should be in TOC
- [ ] Search for `**` - Should only appear in code blocks, not in regular text
- [ ] Check "Keywords:" - Should be bold without showing `**`
- [ ] Check "Manual Testing:" - Should be bold without showing `**`

---

## Next Steps

### Recommended Improvements

1. **Security Enhancement:**
   - Migrate from MD5 to bcrypt/argon2 for password hashing
   - Update both code and documentation

2. **Testing Coverage:**
   - Increase frontend unit test coverage from 30% → 60%+
   - Add E2E tests with Playwright/Cypress

3. **Documentation:**
   - Add actual screenshots to replace `[Chèn hình X.Y tại đây]`
   - Add UML diagrams (use case, sequence, class)
   - Fill in "Lời cảm ơn" and "Nhận xét GVHD" sections

4. **Performance:**
   - Add caching layer (Redis) for search queries
   - Optimize database queries with indexes
   - Implement CDN for static assets

---

## Maintainer Notes

### Regenerating Report

```bash
python scripts/generate_baocao_kltn.py
```

### Verifying Changes

```bash
# Check MD5 usage
grep -r "md5\|bcrypt" server/controllers/authController.js

# Check rate limit
grep -r "MAX_MESSAGES_PER_MINUTE" server/socket/chatHandlers.js

# Check bold markdown parsing
grep -r "\*\*[A-Za-z]" scripts/generate_baocao_kltn.py | wc -l
```

### Output

- **File:** `BaoCao_KLTN_HeThongChoThuePhongTro.docx`
- **Size:** ~57.7 KB
- **Pages:** ~80 (estimated after adding images)
- **Chapters:** 6 + References + Appendices

---

**Last Updated:** 2025-11-07  
**Document Version:** v3  
**Status:** ✅ Ready for submission (after adding screenshots)

