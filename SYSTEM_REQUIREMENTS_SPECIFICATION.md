# Comprehensive System Requirements & Architecture Specification
## Multi-Category Educational E-Learning Platform & Binary MLM System

**Document Version:** 2.0.0  
**Project Root Directory:** `/Users/apple/Desktop/shamshad/e learning`  
**Target Platforms:** Cross-Platform Web Application (Vite + React + TypeScript) & Mobile Native Application (React Native Android/iOS)  
**Backend Ecosystem:** Node.js, Express.js, MongoDB (Mongoose), JWT Authentication, Razorpay Payments  

---

## Sign-off & Approval Ledger

| Stakeholder Role | Representative Name | Official Title | Approval Date | Status |
| :--- | :--- | :--- | :--- | :--- |
| Lead Solution Architect | ____________________ | Chief Technical Officer | ____ / ____ / 2026 | AGREED AND ACCEPTED |
| Product Manager | ____________________ | VP of E-Learning Content | ____ / ____ / 2026 | AGREED AND ACCEPTED |
| Affiliate Network Director | ____________________ | Head of MLM & Growth | ____ / ____ / 2026 | AGREED AND ACCEPTED |

---

# 1. Introduction & Executive Overview

## 1.1 Purpose
This document provides the definitive technical specification and operational blueprint for the **Multi-Category Educational E-Learning Platform & Integrated Binary MLM Affiliate Network**. The platform provides localized, state-specific educational content ranging from K-12 schooling to competitive entrance exam preparation, higher education degree courses, state/central government public service job prep, teacher certifications, and an instant-access digital e-book library.

In parallel with educational content delivery, the system integrates a robust **Binary Multi-Level Marketing (MLM) Engine** allowing students and affiliate partners to earn recurring binary matching income, build two-leg sales downlines (Left Leg & Right Leg), leverage spillover placements, and track carry-forward business volume (PV).

## 1.2 Scope
The application encompasses a unified multi-tier ecosystem:
1. **Web Portal (`/client`):** High-performance web application featuring state localization, responsive dashboard, interactive MCQ engines, video lesson streaming, digital e-book reader, wallet management, and a dynamic 4-depth binary tree visualizer.
2. **Android Native App (`/app`):** Complete React Native mobile app supporting dual theme system (Dark/Light mode), 1-click UPI top-up, mobile document camera/gallery picker for Aadhaar & PAN KYC uploads, 1-click referral link sharing via native OS share sheets, and full classroom access.
3. **Backend API Server (`/server`):** Node.js REST API providing secure JWT authentication, automated volume propagation up binary uplines, 1:1 matching calculation, daily capping protection, 5% Admin + 5% TDS deduction processing, wallet transaction ledgers, and admin settlement utilities.

---

# 2. System Architecture & 6 Core Educational Verticals

The learning hierarchy is structured into **6 Core Modules** to provide clear categorization across grade levels, exams, and career prep:

```
                          ┌─────────────────────────────────────────────────────────┐
                          │         LEARNING PLATFORM - 6 CORE MODULES              │
                          └────────────────────────────┬────────────────────────────┘
                                                       │
        ┌───────────────────┬──────────────────┬───────┴──────────┬──────────────────┬──────────────────┐
        │                   │                  │                  │                  │                  │
┌───────┴───────┐   ┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐
│  I. SCHOOL    │   │  II. SCHOOL   │  │  III. HIGHER  │  │  IV. STATE    │  │   V. CENTRAL  │  │  VI. TEACHER  │
│   EDUCATION   │   │  ENTRANCE &   │  │   EDUCATION   │  │   GOVT JOBS   │  │   GOVT JOBS   │  │  PREPARATION  │
│ (Class 1-12)  │   │  COMPETITIVE  │  │    (UG & PG)  │  │  PREPARATION  │  │  PREPARATION  │  │ & CERTIFY     │
└───────┬───────┘   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                   │                  │                  │                  │                  │
        ├─ State Board      ├─ Navodaya        ├─ M.A             ├─ SDA             ├─ Banking         ├─ B.Ed
        │  (Bilingual/Eng)  ├─ NTS             ├─ M.Com           ├─ FDA             │  (IBPS/SBI)      ├─ M.Ed
        ├─ CBSE Board       ├─ G-MAT           ├─ M.Sc            ├─ GPT             ├─ Railway (RRB)   ├─ TET (State)
        ├─ ICSE Board       ├─ NET             ├─ MBA             ├─ KAS             ├─ IAS / Civil     ├─ CTET (Central)
        └─ PUC / (+1 & +2)  ├─ NEET            └─ Custom UG/PG    └─ State Exams     └─ Central Exams   └─ Other Exams
           (Arts/Comm/Sci)  └─ JEE
```

### Module Breakdown Detail:
1. **Module I: School Education (Class 1 to 12)**
   - **State Board:** State Medium / Regional Bilingual (Classes 1–10) & State English Medium (Classes 1–10).
   - **CBSE Board:** Classes 1–10 standardized NCERT curriculum.
   - **ICSE Board:** Classes 1–10 Council for the Indian School Certificate Examinations.
   - **PUC / Senior Secondary (+1 & +2):** Arts Stream (Subjects 1–6), Commerce Stream (Subjects 1–6), Science Stream (Physics, Chemistry, Maths, Biology).
2. **Module II: School Entrance & Competitive Exams**
   - **Navodaya Entrance Exam:** Jawahar Navodaya Vidyalaya selection test (Class 6 & 9).
   - **NTS:** National Talent Search examination.
   - **G-MAT & NET:** Graduate Management & National Eligibility Tests.
   - **NEET & JEE:** All-India pre-medical and engineering entrance examinations.
3. **Module III: Higher Education (UG & PG)**
   - **Degree Courses:** Master of Arts (M.A), Master of Commerce (M.Com), Master of Science (M.Sc), Master of Business Administration (MBA), and custom university modules.
4. **Module IV: State Government Jobs Preparation**
   - **State Services:** Second Division Assistant (SDA), First Division Assistant (FDA), General Primary Teacher (GPT), Karnataka Administrative Services (KAS), and State Police / Revenue Officers.
5. **Module V: Central Government Jobs Preparation**
   - **All-India Services:** Banking Exams (IBPS, SBI PO/Clerk), Railway Recruitment Board (RRB NTPC/Group D), IAS / Civil Services (UPSC Prelims & Mains), and SSC CGL.
6. **Module VI: Teacher Preparation & Certifications**
   - **Teaching Credentials:** Bachelor of Education (B.Ed), Master of Education (M.Ed), State Teacher Eligibility Test (State TET), Central Teacher Eligibility Test (CTET), and Assistant Professor exams.

---

# 3. Functional Requirements

## 3.1 Authentication, Localization & KYC Verification
- **User Authentication:** Supports login/registration via Unique User ID, Mobile Number, or Full Name with encrypted Password hashing (bcrypt).
- **State Regional Localization:** On first login, users select their preferred state region (e.g., Karnataka, Delhi NCR, Maharashtra, UP, Tamil Nadu, West Bengal), dynamically tailoring the home dashboard to show state-specific board courses and job prep modules.
- **Know Your Customer (KYC) Module:**
  - Mandatory identity verification for paid course activations, e-book purchases, and binary MLM wallet withdrawals.
  - Supports **Aadhaar Card** (12-digit format validation) and **PAN Card** (10-character alphanumeric validation).
  - Integrated mobile photo/file upload scanner for proof document attachment.
  - Multi-stage approval status (`NOT_SUBMITTED` ➔ `PENDING` ➔ `VERIFIED` / `REJECTED`).
- **Subscription Validity Engine:** Default course subscription period is set to **1 Year (365 Days)** from activation date.

## 3.2 Main Dashboard & Promotional Engine
- **Header Slot:** Displays dynamic announcement tickers, high-impact promotional banners, and DRM video advertisement slots.
- **Content Navigation:** Tabbed & grid views for exploring the 6 core educational verticals.
- **Progress Tracking:** Real-time completion bars showing finished lessons, attempted MCQs, and target mastery.

## 3.3 Content Delivery & 5 Primary Asset Formats
Inside every course chapter, the platform delivers 5 primary learning asset formats:
1. **Lessons:** Structured reading material and rich text notes.
2. **Notes:** Downloadable and viewable summary notes in PDF format.
3. **MCQ (Multiple Choice Questions):** Interactive quiz engine with real-time scoring, instant answer feedback, timers, and detailed explanations.
4. **Attachments:** PDF worksheets, lab guides, and supplementary reference files.
5. **Videos:** Embedded and DRM-protected video lecture streaming with playback speed control.

## 3.4 Standalone Digital Library & E-Book Store
- Independent store catalog enabling users to buy single e-books without purchasing a full course subscription.
- **Catalog Examples:**
  - *KAS Preparation Handbook* — ₹50 (Original ₹299)
  - *Indian Constitution & Polity* — ₹100 (Original ₹499)
  - *Class 10 Physics Mind Maps* — ₹149 (Original ₹299)
- **Instant Digital Delivery:** Unlocked immediately in the user's personal digital library upon payment verification.

## 3.5 Payment, Pricing & In-App Wallet Management
- **In-App Digital Wallet:** Enables 1-click course batch enrollment and e-book purchases using pre-funded wallet credits.
- **UPI Top-Up Integration:** Direct integration with payment gateways (Razorpay) for instant wallet top-ups.
- **Transaction History Ledger:** Immutable audit trail logging all top-ups (`CREDIT`), course purchases (`DEBIT`), e-book purchases (`DEBIT`), and binary MLM payouts (`AFFILIATE_COMMISSION`).
- **Dynamic Pricing Engine:** Flexible admin configuration for subject packs, standalone e-books, and annual pass subscriptions.

---

# 4. Binary MLM Network & Binary Income Mechanics

```
                             ┌──────────────────────────────────────┐
                             │                 YOU                  │
                             │         (Affiliate / Partner)        │
                             └──────────────────┬───────────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │                                                     │
          ┌──────────┴──────────┐                               ┌──────────┴──────────┐
          │      LEFT LEG       │                               │      RIGHT LEG      │
          │    (Binary Team)    │                               │    (Binary Team)    │
          └──────────┬──────────┘                               └──────────┬──────────┘
                     │                                                     │
          ┌──────────┴──────────┐                               ┌──────────┴──────────┐
          │  L1 (Affiliate)     │                               │  R1 (Affiliate)     │
          └────┬───────────┬────┘                               └────┬───────────┬────┘
               │           │                                         │           │
        ┌──────┴───┐   ┌───┴──────┐                           ┌──────┴───┐   ┌───┴──────┐
        │   L1.1   │   │   L1.2   │                           │   R1.1   │   │   R1.2   │
        └──────────┘   └──────────┘                           └──────────┘   └──────────┘
```

## 4.1 Binary Structure Overview
- **Two-Leg Tree:** Every member recruits or places new members into only two primary downline branches: **Left Leg** and **Right Leg**.
- **Spillover Mechanism:** Extra recruits beyond the first two automatically spill over down the binary tree into open extreme left, extreme right, or auto-balanced spots, helping downline members build their network volume.
- **Placement Preferences:** Members can set placement preferences to `AUTO` (places in weaker volume leg), `LEFT` (forces extreme left branch), or `RIGHT` (forces extreme right branch).

## 4.2 Binary Volume & Matching Income Rules
- **Volume Tracking (PV):** Each user registration or course purchase generates Point Volume (PV) (e.g., 100 PV per standard enrollment). Volume accumulates independently in the Left Leg and Right Leg.
- **1:1 Pair Matching:** Binary income triggers on matched volume between Left and Right legs.
  $$\text{Matched PV} = \min(\text{Carried Left PV}, \text{Carried Right PV})$$
- **Pay Leg Commission Rate:** Pay leg commission is set at **10%** of the total matched PV volume on the weaker leg.
  $$\text{Gross Bonus} = \text{Matched PV} \times 10\%$$
- **Carry Forward Mechanism:** Unmatched surplus volume on the stronger leg is **NEVER LOST**; it rolls over indefinitely to subsequent payout cycles.
  $$\text{Carried Left After} = \text{Carried Left Before} - \text{Matched PV}$$
  $$\text{Carried Right After} = \text{Carried Right Before} - \text{Matched PV}$$

## 4.3 Financial Rules, Capping Limits & Deductions
- **Daily Payout Capping Limit:** To ensure total financial sustainability and prevent over-payouts, daily matching bonus earnings are capped at **₹25,000 per day**.
  $$\text{Capped Gross Bonus} = \min(\text{Gross Bonus}, ₹25,000)$$
- **Mandatory Statutory Deductions Engine:**
  1. **Admin Fee (5%):** System maintenance & operational charges.
  2. **TDS Tax Deduction (5%):** Tax Deducted at Source under Indian Income Tax regulations.
  $$\text{Admin Fee} = \text{Capped Gross Bonus} \times 5\%$$
  $$\text{TDS Deduction} = \text{Capped Gross Bonus} \times 5\%$$
  $$\text{Net Payable Payout} = \text{Capped Gross Bonus} - \text{Admin Fee} - \text{TDS Deduction}$$

## 4.4 Leadership Rank Progression Table
| Rank | Total Accumulated Business Volume (PV) | Perks & Benefits |
| :--- | :--- | :--- |
| **BRONZE** | 0 – 999 PV | Base 10% Matching Bonus |
| **SILVER** | 1,000 – 4,999 PV | 10% Bonus + Basic Leadership Recognition |
| **GOLD** | 5,000 – 19,999 PV | 10% Bonus + Priority Support + Award Badge |
| **DIAMOND** | 20,000 – 49,999 PV | 10% Bonus + Special Regional Rewards |
| **CROWN AMBASSADOR** | 50,000+ PV | 10% Bonus + Annual Leadership Retreat |

## 4.5 Mathematical Worked Example (1:1 Pair Matching)

### Scenario Setup:
- **Left Leg Volume:** 12,500 PV
- **Right Leg Volume:** 9,800 PV

### Step-by-Step Calculation:
1. **Identify Weaker Leg & Matched Volume:**  
   $$\text{Matched PV} = \min(12,500, 9,800) = 9,800 \text{ PV}$$
2. **Calculate Gross Matching Bonus (10%):**  
   $$\text{Gross Bonus} = 9,800 \text{ PV} \times 10\% = ₹980.00$$
3. **Check Daily Capping Guard (₹25,000):**  
   $$₹980.00 \le ₹25,000 \implies \text{Capped Gross Bonus} = ₹980.00$$
4. **Apply Deductions (5% Admin + 5% TDS):**  
   $$\text{Admin Fee} = ₹980 \times 0.05 = ₹49.00$$  
   $$\text{TDS Deduction} = ₹980 \times 0.05 = ₹49.00$$  
   $$\text{Total Deductions} = ₹49.00 + ₹49.00 = ₹98.00$$
5. **Net Wallet Payout:**  
   $$\text{Net Payout} = ₹980.00 - ₹98.00 = ₹882.00$$
6. **Carry Forward Volume to Next Cycle:**  
   $$\text{Left Leg Carry Forward} = 12,500 - 9,800 = \mathbf{2,700 \text{ PV}}$$  
   $$\text{Right Leg Carry Forward} = 9,800 - 9,800 = \mathbf{0 \text{ PV}}$$

---

# 5. Project Verification & Implementation Audit Matrix

A complete audit of the codebase (`/server`, `/client`, `/app`) confirms that all required features specified in the requirements are fully implemented and verified in the project:

| Category / Module | Specified Feature | Implementation File Location | Status |
| :--- | :--- | :--- | :--- |
| **6 Core Verticals** | School K-12 (State, CBSE, ICSE, PUC) | `client/src/mockData.ts`, `server/src/seedCourses.js` | ✅ VERIFIED & IMPLEMENTED |
| **6 Core Verticals** | School Entrance (NEET, JEE, Navodaya, NTS) | `client/src/components/ContentHierarchy.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **6 Core Verticals** | Higher Education UG/PG (M.A, M.Com, MBA) | `server/src/models/Category.js`, `client/src/mockData.ts` | ✅ VERIFIED & IMPLEMENTED |
| **6 Core Verticals** | State Govt Jobs (KAS, SDA, FDA, GPT) | `client/src/components/ContentHierarchy.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **6 Core Verticals** | Central Govt Jobs (Banking, RRB, IAS) | `client/src/components/ContentHierarchy.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **6 Core Verticals** | Teacher Prep & Certifications (B.Ed, TET, CTET) | `client/src/components/ContentHierarchy.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **Authentication** | User ID / Mobile / Name + Password Login | `server/src/controllers/authController.js`, `app/screens/AuthScreen.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **Localization** | State Regional Selection (KA, DL, MH, UP, TN, WB) | `client/src/components/StatePickerModal.tsx`, `server/src/models/State.js` | ✅ VERIFIED & IMPLEMENTED |
| **KYC Module** | Aadhaar & PAN verification + Image File Upload Scanner | `server/src/controllers/kycController.js`, `app/screens/StudentHomeScreen.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **5 Asset Formats** | Lessons, Notes, MCQs, Attachments, Videos | `server/src/models/LearningAsset.js`, `client/src/components/McqQuizEngine.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **E-Book Store** | Standalone purchases (KAS ₹50, Constitution ₹100) + Delivery | `server/src/controllers/ebookController.js`, `client/src/components/WalletEbookStore.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **Wallet System** | In-app Wallet, UPI Top-Up, Transaction History Log | `server/src/controllers/walletController.js`, `server/src/models/Wallet.js` | ✅ VERIFIED & IMPLEMENTED |
| **MLM Topology** | Two-Leg Binary Tree (Left Leg & Right Leg) | `server/src/models/MLMNode.js`, `client/src/components/MlmTreeVisualizer.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **MLM Placement** | Spillover algorithm & AUTO/LEFT/RIGHT Preference | `server/src/utils/mlmService.js`, `app/screens/StudentHomeScreen.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **MLM Payout** | 1:1 Matched PV 10% Bonus + Carry Forward Volume | `server/src/controllers/mlmController.js`, `server/src/models/MlmPayout.js` | ✅ VERIFIED & IMPLEMENTED |
| **MLM Safeguards** | ₹25,000 Daily Capping + 5% Admin & 5% TDS Deductions | `server/src/controllers/mlmController.js`, `client/src/components/AdminPanel.tsx` | ✅ VERIFIED & IMPLEMENTED |
| **Mobile App** | Dual Dark/Light Theme + Native 1-Click Referral Link Share | `app/screens/StudentHomeScreen.tsx` | ✅ VERIFIED & IMPLEMENTED |

---

# 6. Conclusion

The **Web E-Learning Platform & Android App with Integrated Binary MLM Network** meets all technical, architectural, functional, and financial requirements. The system seamlessly unites state-localized education delivery with a powerful binary incentive model, backed by immutable audit trails and automated financial safeguards.
