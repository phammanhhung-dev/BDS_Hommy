````markdown
# KYC_Optimization_Implementation_Plan.md

## 1. Goal & Scope

This document defines the implementation plan to **optimize the KYC (Know Your Customer) flow** for Vietnamese **Căn Cước Công Dân (CCCD)** cards.

The main goals are:

- Increase **QR code decoding success rate**.
- Improve **OCR accuracy** for CCCD fields (ID number, full name, date of birth, address, etc.).
- Make **face matching** more reliable and interpretable.
- Introduce a **risk scoring** model for better KYC decisions (auto-approve / manual review / reject).
- Keep the changes **incremental** and **backward-compatible** where possible (via config flags).

The system remains **client-focused** (browser) using OpenCV.js for image processing and Tesseract.js (or current OCR engine) for text recognition, with an option to move heavy OCR to backend in future phases.

---

## 2. User Review / Important Notes

### 2.1. OpenCV.js Dependency

- We will add **OpenCV.js** via CDN in `index.html`.
- OpenCV.js (WASM build) is large (~8 MB), so:
  - Initial page load may be slower.
  - We must ensure **lazy initialization** (load only when needed, with a loading indicator).

### 2.2. Face Matching Threshold Changes

- We will change **face distance thresholds** to:

  - `distance <= 0.45` → Auto-approve candidate.
  - `0.45 < distance <= 0.60` → Manual review.
  - `distance > 0.60` → Reject.

- This will **change acceptance rates** compared to current behavior.
- We must **log and monitor**:
  - Distribution of distances.
  - Share of auto-approve / review / reject before vs. after.

---

## 3. Overall Architecture Changes

### 3.1. New / Modified Modules

- **Client Infrastructure**
  - [MODIFY] `index.html`
  - [NEW] `ImageProcessingService.js`

- **KYC Components & Services**
  - [MODIFY] `OCRServiceV2.js`
  - [MODIFY] `QRCodeService.js`
  - [MODIFY] `FaceMatchingService.js`
  - [MODIFY] `XacThucKYC.jsx`

---

## 4. Client Infrastructure

### 4.1. `index.html`

**Changes:**

- Add OpenCV.js via CDN (WASM build):

  ```html
  <script async src="https://docs.opencv.org/4.x/opencv.js"></script>
````

* Optionally, expose a global promise or callback to detect when `cv` is ready.

  ```html
  <script>
    window.cvReady = new Promise((resolve) => {
      const check = () => {
        if (window.cv && window.cv.imread) {
          resolve(window.cv);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  </script>
  ```

---

## 5. ImageProcessingService.js

### 5.1. Responsibilities

`ImageProcessingService.js` will centralize all **OpenCV-based** operations:

* Load OpenCV and ensure readiness.
* Warp CCCD image to a canonical, flat view.
* Deskew / auto-rotate image if needed.
* Apply adaptive / Otsu thresholding for OCR.
* Provide helpers for cropping ROIs and faces.

### 5.2. API Design

```ts
// Pseudo-type signature
class ImageProcessingService {
  async loadOpenCV(): Promise<void>;
  async warpPerspective(imageDataUrl: string): Promise<string>;  // returns warped imageDataUrl
  async deskew(imageDataUrl: string): Promise<string>;           // optional, returns deskewed image
  async adaptiveThreshold(
    imageDataUrlOrMat: string | cv.Mat,
    options?: ThresholdOptions
  ): Promise<cv.Mat>;
  cropROI(
    mat: cv.Mat,
    roi: { x: number; y: number; w: number; h: number }
  ): cv.Mat;
  cropFaceFromCard(
    warpedCardMat: cv.Mat,
    faceRoi: { xPct: number; yPct: number; wPct: number; hPct: number }
  ): cv.Mat;
}
```

### 5.3. CCCD-Specific Assumptions

Vietnamese CCCD cards follow the **ID-1 format** (ISO/IEC 7810): physical size ~**85.6 × 53.98 mm**, similar to credit cards. We will map this to a canonical resolution for processing, e.g.:

* **Canonical resolution:** `1000 × 630` pixels (approx. 1.586 aspect ratio).

This gives enough resolution for OCR while keeping performance reasonable.

### 5.4. Warping CCCD to Canonical View

**Algorithm (warpPerspective):**

1. Convert imageDataUrl → `cv.Mat`.

2. Convert to grayscale.

3. Apply Gaussian blur.

4. Apply Canny edge detection.

5. Find contours with `cv.findContours`.

6. Select the **largest contour** that approximates to a **four-point polygon** (card boundary).

7. Order points (top-left, top-right, bottom-right, bottom-left).

8. Compute perspective transform (`cv.getPerspectiveTransform`) mapping these points to:

   * `dst = [[0,0], [1000,0], [1000,630], [0,630]]`

9. Apply `cv.warpPerspective` to get `warpedCardMat`.

10. Convert `warpedCardMat` back to data URL.

**Fallback behavior:**

* If we cannot find a valid 4-point contour:

  * Log a warning.
  * Return the **original image** (no warp), so the rest of the flow still works.
  * Optionally set a flag in KYC result: `warpFailed: true`.

### 5.5. Deskew / Auto-Rotate

Deskew is primarily useful when card orientation is significantly rotated (e.g. 90° or arbitrary angles).

**Strategy:**

* For CCCD, we often detect the card outline anyway; we can reuse angle:

  1. Use the same largest contour from warp step.
  2. Compute `minAreaRect` of the contour.
  3. Extract angle:

     * Normalize angle to the nearest of {0°, 90°, 180°, 270°}.
  4. Rotate image to correct orientation.

* Deskew will be used as a **fallback for QR**:

  * If initial QR scan fails:

    * Run `deskew` → get `deskewedImage`.
    * Try QR scanning again on `deskewedImage`.

### 5.6. Adaptive / Otsu Thresholding for OCR

We will use **per-ROI** thresholding instead of full-frame thresholding.

**Options:**

```ts
type ThresholdOptions = {
  type?: 'ADAPTIVE_MEAN' | 'ADAPTIVE_GAUSSIAN' | 'OTSU';
  blockSize?: number;      // odd, default 15
  C?: number;              // default 2
  blur?: boolean;          // whether to blur before threshold
};
```

**Default settings for CCCD ROIs:**

* For **printed text fields** (ID number, name, date, address):

  * Convert ROI to grayscale.
  * Optionally apply `cv.medianBlur(roi, 3)` if noise is visible.
  * Use **adaptive Gaussian threshold**:

    ```js
    blockSize = 15;   // odd: 11–21 suggested
    C = 2;
    ```

* For **high-contrast regions** or very uniform lighting:

  * Use **Otsu** (`cv.threshold` with `THRESH_BINARY + THRESH_OTSU`).

Result: a binarized `cv.Mat` fed into OCR.

---

## 6. OCRServiceV2.js

### 6.1. Responsibilities

* Coordinate the OCR pipeline for CCCD (front & back).
* Call `ImageProcessingService.warpPerspective` before ROI extraction.
* Compute **ROIs by percentage** on the warped canonical image (`1000x630`).
* Preprocess per ROI (scale, grayscale, threshold).
* Call Tesseract.js (or current OCR engine) with **field-specific parameters**.
* Return structured field results and raw text for debugging.

### 6.2. Processing Flow

`recognizeAll(imageDataUrl: string): Promise<KycOcrResult>`

1. Wait for `ImageProcessingService.loadOpenCV()`.
2. Call `warpPerspective(imageDataUrl)` → `warpedImageDataUrl`.
3. Convert warpedImageDataUrl → `cv.Mat`.
4. For each CCCD field, compute ROI in pixels from normalized layout.
5. For each ROI:

   * Crop ROI.
   * Resize (scale factor **1.5–2x**, not 3x).
   * Convert to grayscale.
   * Run `adaptiveThreshold` (Gaussian, blockSize=15, C=2).
   * Optionally apply small dilation/erosion if needed.
   * Convert ROI `cv.Mat` → ImageData / canvas for Tesseract.
   * Call Tesseract.js with **field-specific config** (see below).
6. Aggregate results into a `KycOcrResult`, including:

   * `rawText`, `normalizedText`, `confidence`, `fieldName`.

### 6.3. Field Layout & ROIs (Vietnam CCCD – Front Side)

Assuming warped resolution **1000x630** (width x height), we define ROIs by **percentage** of width/height:

> Note: These numbers are illustrative and must be calibrated using real CCCD samples, but the structure stays the same.

| Field        | xPct | yPct | wPct | hPct | Notes                            |
| ------------ | ---- | ---- | ---- | ---- | -------------------------------- |
| soCCCD       | 0.30 | 0.14 | 0.40 | 0.08 | Big bold number on top right     |
| tenDayDu     | 0.28 | 0.24 | 0.60 | 0.08 | Full name                        |
| ngaySinh     | 0.28 | 0.33 | 0.30 | 0.07 | Date of birth                    |
| gioiTinh     | 0.60 | 0.33 | 0.15 | 0.07 | Gender                           |
| quocTich     | 0.78 | 0.33 | 0.18 | 0.07 | Nationality (usually “VIỆT NAM”) |
| queQuan      | 0.28 | 0.41 | 0.65 | 0.09 | Place of origin (1–2 lines)      |
| noiThuongTru | 0.28 | 0.53 | 0.65 | 0.13 | Permanent address (1–3 lines)    |
| faceImage    | 0.04 | 0.26 | 0.20 | 0.35 | Portrait on left                 |
| qrCode       | 0.78 | 0.05 | 0.18 | 0.15 | QR (if present on top right)     |

Implementation detail:

```js
const CANONICAL_WIDTH = 1000;
const CANONICAL_HEIGHT = 630;

const ROIS = {
  soCCCD:      { xPct: 0.30, yPct: 0.14, wPct: 0.40, hPct: 0.08 },
  tenDayDu:    { xPct: 0.28, yPct: 0.24, wPct: 0.60, hPct: 0.08 },
  ngaySinh:    { xPct: 0.28, yPct: 0.33, wPct: 0.30, hPct: 0.07 },
  gioiTinh:    { xPct: 0.60, yPct: 0.33, wPct: 0.15, hPct: 0.07 },
  quocTich:    { xPct: 0.78, yPct: 0.33, wPct: 0.18, hPct: 0.07 },
  queQuan:     { xPct: 0.28, yPct: 0.41, wPct: 0.65, hPct: 0.09 },
  noiThuongTru:{ xPct: 0.28, yPct: 0.53, wPct: 0.65, hPct: 0.13 },
  faceImage:   { xPct: 0.04, yPct: 0.26, wPct: 0.20, hPct: 0.35 },
  qrCode:      { xPct: 0.78, yPct: 0.05, wPct: 0.18, hPct: 0.15 },
};
```

### 6.4. Tesseract Configuration per Field (Vietnam CCCD)

We assume Tesseract.js with `vie.traineddata` (Vietnamese LSTM). For accuracy, we use different `psm`, `whitelist` and dictionary settings per field.

#### 6.4.1. Global Defaults

```js
const DEFAULT_TESSERACT_CONFIG = {
  lang: 'vie',
  oem: 1,                // LSTM only
  tessedit_pageseg_mode: 6, // default PSM for blocks
};
```

#### 6.4.2. Field-Specific Configs

**ID Number (soCCCD)**

* Format: 12 digits (`[0-9]{12}`).
* Config:

```js
const configSoCCCD = {
  tessedit_pageseg_mode: 8,  // PSM_SINGLE_WORD
  tessedit_char_whitelist: '0123456789',
  load_system_dawg: 0,
  load_freq_dawg: 0,
};
```

**Date of Birth / Issue Date (ngaySinh, ngayCap)**

* Format: `dd/MM/yyyy`.
* Config:

```js
const configDate = {
  tessedit_pageseg_mode: 7,  // PSM_SINGLE_TEXT_LINE
  tessedit_char_whitelist: '0123456789/',
  load_system_dawg: 0,
  load_freq_dawg: 0,
};
```

**Gender (gioiTinh)**

* Expected: “NAM”, “NỮ” (or sometimes “Nam”, “Nữ”).
* Config:

```js
const configGender = {
  tessedit_pageseg_mode: 8,  // single word
  tessedit_char_whitelist: 'NAMnữNỮnam',
  // Keep dictionary or not? We can keep system_dawg = 1, freq_dawg = 0.
};
```

**Nationality (quocTich)**

* Almost always “VIỆT NAM”.
* Config:

```js
const configNationality = {
  tessedit_pageseg_mode: 7,  // single line
  // Let dictionary help a bit; then we normalize via post-processing.
};
```

**Full Name (tenDayDu)**

* Usually uppercase Vietnamese with diacritics, one line.
* Config:

```js
const configFullName = {
  tessedit_pageseg_mode: 7,  // single line
  // Allow full Vietnamese alphabet; keep dictionary.
};
```

**Origin & Permanent Address (queQuan, noiThuongTru)**

* Multi-word, often multi-line Vietnamese addresses with diacritics.
* Config:

```js
const configAddress = {
  tessedit_pageseg_mode: 4,  // single column / block of text
  // Allow all letters, digits, punctuation.
};
```

### 6.5. Post-Processing & Validation Rules

After OCR, we apply strict normalization and validation:

* **soCCCD:**

  * Remove spaces and non-digits.
  * Must match `/^[0-9]{12}$/`.
  * Correct common misreads (`O`/`0`, `I`/`1`, etc.) before final validation.

* **Dates (ngaySinh, ngayCap, ngayHetHan):**

  * Normalize separators (`.` or `-` → `/`).
  * Parse using regex `/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/`.
  * Basic sanity checks (day 1–31, month 1–12, year reasonable).

* **Gender:**

  * Normalize to `NAM` or `NỮ` (case-insensitive, remove accents when comparing).
  * Map ambiguous results (e.g. “NẠM”, “NAm”) to most probable.

* **Nationality:**

  * Normalize to `VIỆT NAM`.
  * Remove diacritics and compare to `VIET NAM` or `VIETNAM` in regex.

* **Addresses:**

  * Uppercase, normalize whitespace.
  * (Future) optional fuzzy matching against a dictionary of Vietnamese provinces/districts to correct minor OCR errors.

---

## 7. QRCodeService.js

### 7.1. Responsibilities

* Decode QR codes from CCCD (front/back) images.
* Use deskew / rotation retries when initial decode fails.
* Provide parsed structured data from QR (if spec is known).
* Cooperate with `mergeAndValidate` logic for cross-checking vs OCR data.
* Contribute to **Risk Score**.

### 7.2. Flow

1. Try QR decode on **warped** image (or QR ROI from warped image).
2. If decode fails:

   * Call `ImageProcessingService.deskew(warpedImage)` and retry.
   * Optionally, try several rotations (e.g. ±10°, ±20°).
3. If still fails:

   * Log failure.
   * Mark `qrStatus = 'FAILED'`.

### 7.3. QR ROI (Vietnam CCCD)

From the canonical warped image:

* Define QR ROI as:

  ```js
  const qrRoi = ROIS.qrCode; // from earlier ROIs config
  ```

* Crop this region and send to QR decoder (html5-qrcode or other library).

### 7.4. Parsing QR Contents

Depending on the CCCD QR specification (often `|` or `@` separated fields), we:

* Decode text → parse into fields:

  * `qrSoCCCD`, `qrFullName`, `qrNgaySinh`, `qrNgayCap`, etc.
* Normalize content with the **same rules** as OCR post-processing.

### 7.5. Merge & Validation Logic (per Field)

For each core field (ID, DOB, Gender, Nationality, Name, Address):

* Compute **string similarity** between:

  * `normalizedOcrValue`
  * `normalizedQrValue`

* Use Levenshtein-based similarity or Jaro–Winkler, e.g.:

  ```ts
  similarity = 1 - (levenshteinDistance / maxLen);
  ```

* CCCD-specific thresholds:

  * **Short, structured fields** (soCCCD, ngaySinh, ngayCap):

    * Require **exact match** or `similarity >= 0.98` to consider “match”.
  * **Name & address fields** (tenDayDu, queQuan, noiThuongTru):

    * **High confidence**: `similarity >= 0.90`
    * **Medium**: `0.75 <= similarity < 0.90`
    * **Low**: `< 0.75`

We will expose these as constants in `QRCodeService.js` or a shared `KycConfig`.

---

## 8. FaceMatchingService.js

### 8.1. Responsibilities

* Crop the **face image** from the CCCD (using known ROI on warped card).
* Detect face in:

  * CCCD portrait.
  * Live/selfie frame.
* Compute face embeddings (e.g. 128-D vector).
* Compute **distance** between embeddings.
* Return:

  * `distance: number`
  * Optional `similarity: number` for UI display.

### 8.2. Distance vs Similarity

We will treat **distance** as the canonical internal metric:

* Typical range: `[0, ~1]` (depending on model).
* Smaller distance → more likely same person.

For UI, if we still want a “% match”, we may define:

```ts
similarity = Math.max(0, 1 - distance); // simple mapping
```

But **all decision thresholds** will be based on **distance**, not similarity.

### 8.3. Thresholds (Vietnam CCCD KYC Context)

We adopt:

* `distance <= 0.45` → **Auto-approve** (face match considered strong).
* `0.45 < distance <= 0.60` → **Manual review** (uncertain zone).
* `distance > 0.60` → **Reject** (face mismatch).

These values must be **calibrated on real data** (see Verification Plan), but are a practical starting point consistent with common face-recognition guidelines.

### 8.4. Crop Face from Card

Instead of running face detection on full card:

* Use ROI from `ROIS.faceImage` on the warped image.
* Crop this region and run face detection / embedding extraction.
* Advantage:

  * Less chance of false detections.
  * Faster processing.

---

## 9. XacThucKYC.jsx

### 9.1. Responsibilities

* Orchestrate the whole KYC flow:

  * Capture image from camera or file.
  * Call `ImageProcessingService` → `OCRServiceV2` → `QRCodeService` → `FaceMatchingService`.
  * Compute final **KYC risk score** and **decision**.
* Display:

  * Field results (OCR vs QR vs merged).
  * Face match distance/similarity.
  * Risk score and decision:

    * `AUTO_APPROVE`
    * `MANUAL_REVIEW`
    * `REJECT`

### 9.2. Updated `processKYC` Flow

1. Receive `imageDataUrl` (front CCCD).
2. Call `ImageProcessingService.warpPerspective(imageDataUrl)`.
3. In parallel or sequence:

   * `OCRServiceV2.recognizeAll(warpedImage)`.
   * `QRCodeService.decodeFrom(warpedImage)` or `QRCodeService.decodeFromROI(warpedImage)`.
4. Get selfie/live frame and run:

   * `FaceMatchingService.compareFaces(cardFace, selfieFace)`.
5. Call `mergeAndValidate` to:

   * Merge OCR + QR per field.
   * Compute **per-field confidence**.
6. Compute **Risk Score** (see section 10).
7. Map Risk Score + face distance to **final decision**.
8. Update UI with:

   * Highlighted fields (correct / mismatch / low confidence).
   * Risk Score.
   * Decision & reason.

---

## 10. Risk Scoring Model

### 10.1. Inputs to Risk Score

We define several components:

* `QR_ok`: 1 if QR decoded successfully, 0 if failed.
* `CoreFields_match`: fraction of core fields (ID, DOB, Gender, Nationality) where OCR vs QR match with high confidence.
* `FaceScore`: mapped from face distance to [0,1].
* `AddressSimilarity`: similarity index (0–1) between QR and OCR addresses.

### 10.2. Mapping Face Distance to FaceScore

We define:

```ts
function computeFaceScore(distance: number): number {
  if (distance >= 0.60) return 0;              // strong mismatch
  if (distance <= 0.45) return 1;              // strong match
  // Linear interpolation between 0.45 and 0.60
  return (0.60 - distance) / (0.60 - 0.45);    // scales from 1 → 0
}
```

### 10.3. Computing CoreFields_match

Let `coreFields = ['soCCCD', 'ngaySinh', 'gioiTinh', 'quocTich']`:

* For each field:

  * If QR exists and OCR similarity ≥ high-threshold (e.g. 0.98 for structured, 0.90 for name), mark as match.
* Then:

```ts
CoreFields_match = matchedCoreFieldsCount / coreFields.length;
```

### 10.4. AddressSimilarity

* Use normalized addresses (remove case, diacritics, excess spaces).
* Compute similarity via Levenshtein or Jaro–Winkler.
* Typical values:

  * ≥0.90: strong match
  * 0.75–0.90: moderate
  * <0.75: weak

### 10.5. Risk Score Formula

We define weights tuned for CCCD KYC context:

```ts
RiskScore =
  0.30 * QR_ok +
  0.30 * CoreFields_match +
  0.25 * FaceScore +
  0.15 * AddressSimilarity;
```

Rationale:

* QR presence (and consistency) is a strong factor (30%).
* Core fields consistency (ID, DOB, Gender, Nationality) is equally strong (30%).
* Face matching is also very important (25%).
* Address similarity is important but more error-prone in OCR (15%).

### 10.6. Mapping Risk Score to Decision

* `RiskScore >= 0.90` and `distance <= 0.45`:

  * **Decision:** `AUTO_APPROVE`.

* `0.70 <= RiskScore < 0.90` or `0.45 < distance <= 0.60`:

  * **Decision:** `MANUAL_REVIEW`.

* `RiskScore < 0.70` or `distance > 0.60`:

  * **Decision:** `REJECT` (or at least “high risk, require strong manual re-check”).

These thresholds should be tuned after collecting **real KYC data** and measuring false-positive / false-negative rates.

---

## 11. Verification & Monitoring Plan

### 11.1. Baseline Before Changes

Before deploying the new pipeline:

* Run current KYC system on a benchmark set, e.g.:

  * 100–200 CCCD images with known ground truth.
* Record:

  * Field-level accuracy (ID, DOB, Name, Address…).
  * QR decode success rate.
  * Face distance distribution for known-matching pairs.
  * Share of auto-approve / manual-review / reject (if available).

### 11.2. After Implementation

Using the same benchmark:

* Rerun with new system.
* Compare:

  * **Field accuracy** gains (especially soCCCD, Name, Address).
  * **QR success rate** (should increase).
  * Face distance distribution and how many pairs fall into each band:

    * <=0.45, 0.45–0.60, >0.60.
  * RiskScore distribution and decision bands.

### 11.3. Logging & Flags

* Add logs (or optional debug mode) to capture:

  * Whether warp succeeded.
  * QR decode attempts and success/failure.
  * OCR field confidence.
  * Face distance.
  * RiskScore and final decision.
* Introduce **feature flags** (config or environment-based) for:

  * `ENABLE_WARPING`
  * `ENABLE_NEW_FACE_THRESHOLDS`
  * `ENABLE_RISK_SCORE_DECISION`
* In case of unexpected issues, we can **roll back** quickly by disabling flags.

---

## 12. Future Enhancements (Phase 2+)

* Move heavy OCR to backend (e.g. VietOCR / PaddleOCR) for better Vietnamese text accuracy, while keeping Tesseract.js as fallback.
* Add **MRZ (machine-readable zone)** parsing from the back side of CCCD to cross-validate data.
* Introduce basic **liveness detection** for selfie (blink / head movement).
* Build a **labelled dataset** of CCCD images and results to train / fine-tune models and calibrate thresholds more scientifically.

---

**End of KYC_Optimization_Implementation_Plan.md**