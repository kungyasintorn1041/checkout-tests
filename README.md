# checkout-tests

โปรเจกต์ Automation Testing สำหรับระบบ E-commerce ด้วย Playwright และ TypeScript ครอบคลุมทั้ง UI Testing และ API Testing

---

## Tech Stack

- **Playwright** — Automation Testing Framework
- **TypeScript** — ภาษาที่ใช้เขียน test
- **Node.js** — Runtime environment
- **GitHub Actions** — CI/CD รัน test อัตโนมัติทุกครั้งที่ push code

---

## โครงสร้างโปรเจกต์

```
checkout-tests/
├── pages/                          # Page Object Model
│   ├── LoginPage.ts                # หน้า Login
│   └── CheckoutPage.ts             # หน้า Checkout
├── test-data/
│   └── cards.ts                    # Test data (users, checkout info)
├── tests/
│   ├── checkout/
│   │   ├── login.spec.ts           # Test Login
│   │   ├── checkout-success.spec.ts  # Test Checkout สำเร็จ
│   │   └── checkout-validation.spec.ts # Test Validation และ edge cases
│   └── api/
│       └── jsonplaceholder.spec.ts # API Testing (GET, POST, PUT, DELETE)
├── playwright.config.ts            # Config Playwright
└── tsconfig.json                   # Config TypeScript
```

---

## Test Cases ทั้งหมด (25 TCs)

### UI Testing — saucedemo.com (13 TCs)

| TC | Scenario | ประเภท |
|----|----------|--------|
| TC-001 | Checkout ด้วยข้อมูลครบถ้วน → สำเร็จ | Positive |
| TC-002 | ตรวจยอดรวม (Item total, Tax, Total) บน Summary page | Positive |
| TC-003 | ไม่กรอก First Name → แสดง error | Negative |
| TC-004 | ไม่กรอก Last Name → แสดง error | Negative |
| TC-005 | ไม่กรอก Zip Code → แสดง error | Negative |
| TC-006 | locked_out_user login ไม่ได้ → แสดง error | Negative |
| TC-007 | problem_user login สำเร็จ แต่รูปสินค้าแสดงผิด | Edge Case |
| TC-008 | problem_user checkout ไม่สำเร็จ — Last Name field มีปัญหา | Edge Case |
| TC-009 | Login ด้วย standard_user → สำเร็จ | Positive |
| TC-010 | Login ด้วย username ผิด → error | Negative |
| TC-011 | ไม่กรอก username → error | Negative |

### API Testing — JSONPlaceholder (12 TCs)

| TC | Method | Scenario | Expected |
|----|--------|----------|----------|
| TC-A01 | GET | ดึง posts ทั้งหมด | 200, ได้ 100 posts |
| TC-A02 | GET | ดึง post เดี่ยว | 200, ข้อมูลถูกต้อง |
| TC-A03 | GET | ดึง post ที่ไม่มี | 404 |
| TC-A04 | GET | ดึง comments ของ post | 200, postId ถูกต้อง |
| TC-A05 | POST | สร้าง post ใหม่ | 201, ได้ id กลับมา |
| TC-A06 | POST | ส่ง Content-Type header | 201, response เป็น JSON |
| TC-A07 | PUT | แก้ไข post ทั้งหมด | 200, ข้อมูลอัปเดต |
| TC-A08 | PATCH | แก้ไข post บางส่วน | 200, เฉพาะ field ที่ส่ง |
| TC-A09 | DELETE | ลบ post | 200, body ว่าง |
| TC-A10 | DELETE | ลบ post ที่ไม่มี | 200 (JSONPlaceholder behavior) |
| TC-A11 | GET | ตรวจ response headers | Content-Type เป็น JSON |
| TC-A12 | GET | ตรวจ response time | น้อยกว่า 3 วินาที |

---

## วิธีติดตั้งและรัน

### ข้อกำหนด

- Node.js v18 ขึ้นไป
- npm

### ติดตั้ง

```bash
git clone https://github.com/kungyasintorn1041/checkout-tests.git
cd checkout-tests
npm install
npx playwright install
```

### รัน test

```bash
# รันทั้งหมด
npx playwright test

# รันแค่ UI test
npx playwright test tests/checkout/

# รันแค่ API test
npx playwright test tests/api/

# รันแบบเห็น browser (headed mode)
npx playwright test tests/checkout/ --headed

# รันแบบ UI mode (แนะนำ — เห็น step ละเอียด)
npx playwright test --ui
```

### ดู test report

```bash
npx playwright show-report
```

---

## Design Patterns

### Page Object Model (POM)

แยก locator และ action ออกจาก test script ทำให้แก้ไขง่ายเมื่อ UI เปลี่ยน

```typescript
// ใช้งาน LoginPage ใน test
const loginPage = new LoginPage(page)
await loginPage.login(USERS.standard.username, USERS.standard.password)
```

### Test Data แยกออกจาก Script

เก็บข้อมูล test ใน `test-data/cards.ts` แยกออกมา ทำให้แก้ข้อมูลได้ที่เดียว

```typescript
// test-data/cards.ts
export const USERS = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  locked:   { username: 'locked_out_user', password: 'secret_sauce' },
  problem:  { username: 'problem_user', password: 'secret_sauce' }
}
```

---

## CI/CD

โปรเจกต์มี GitHub Actions ที่รัน test อัตโนมัติทุกครั้งที่ push code ขึ้น main branch ดูผลได้ที่แถบ **Actions** บน GitHub

---

## ผู้พัฒนา

Yasintorn Sirijaruwon — QA Automation Engineer
