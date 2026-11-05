# ระบบฝึกปฏิบัติวิชาชีพ RMUTI

ระบบจัดการการฝึกปฏิบัติวิชาชีพ คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน

## โปรแกรมและเครื่องมือที่ใช้จริง

| โปรแกรม/เครื่องมือ | สถานะ | การใช้งานในระบบ |
|---|---|---|
| Visual Studio Code | ใช้พัฒนา | เขียนและแก้ไขโค้ดของระบบ |
| XAMPP | ใช้จริง | ให้บริการ Apache, PHP และ MySQL บนเครื่องเดียว |
| Node.js | ใช้จริง | ติดตั้งแพ็กเกจและ build หน้าเว็บ |
| React + TypeScript | ใช้จริง | สร้างหน้าเว็บและหน้าการทำงานทั้งหมด |
| Vite | ใช้จริง | รันและ build หน้าเว็บ |
| Tailwind CSS | ใช้จริง | ออกแบบหน้าตาและการจัดวาง |
| PHP | ใช้จริง | ทำ API ฝั่งเซิร์ฟเวอร์ |
| MySQL | ใช้จริง | เก็บข้อมูลระบบ |
| phpMyAdmin | ใช้จริงผ่าน XAMPP | นำเข้าและจัดการฐานข้อมูล |
| PDO | ใช้จริง | เชื่อมต่อ PHP กับ MySQL อย่างปลอดภัย |
| JavaScript / HTML / CSS | ใช้จริงผ่าน React และ Vite | ทำงานเป็นพื้นฐานของหน้าเว็บ |

รายการ Express.js, EJS, MySQL2, express-session และ Bootstrap ในเอกสารอ้างอิงเป็นเครื่องมือของระบบ Node.js อีกแบบหนึ่ง ไม่ใช่ส่วนประกอบของระบบนี้ เพราะระบบปัจจุบันใช้ PHP + PDO เป็น Backend, React เป็น Frontend และ Tailwind CSS เป็นชุดออกแบบ การติดตั้งแพ็กเกจเหล่านั้นเพิ่มโดยไม่ใช้จริงจะไม่ทำให้ระบบทำงานดีขึ้นและจะทำให้เอกสารคลาดเคลื่อน

## วิธีติดตั้งบน XAMPP

### 1. ติดตั้ง XAMPP
- ดาวน์โหลดและติดตั้ง XAMPP จาก https://www.apachefriends.org
- เปิด XAMPP Control Panel แล้ว Start **Apache** และ **MySQL**

### 2. นำเข้าฐานข้อมูล
- เปิดเบราว์เซอร์ ไปที่ http://localhost/phpmyadmin
- คลิก **Import** เลือกไฟล์ `database/database.sql` แล้วกด Go
- ระบบจะสร้างฐานข้อมูล `rmuti_practicum` พร้อมตารางทั้งหมดและข้อมูลเริ่มต้น

### 3. วางไฟล์ PHP API
- คัดลอกโฟลเดอร์ `api/` ทั้งโฟลเดอร์ไปวางใน `C:\xampp\htdocs\` (Windows) หรือ `/opt/lampp/htdocs/` (Linux/Mac)
- สร้างโฟลเดอร์ `uploads` ใน `htdocs/api/` และกำหนดสิทธิ์เขียน (chmod 777)

### 4. วางไฟล์ Frontend (ที่ build แล้ว)
- รัน `npm install` แล้ว `npm run build` ในโปรเจกต์นี้
- คัดลอกไฟล์ในโฟลเดอร์ `dist/` ไปวางใน `htdocs/` (รวม index.html และโฟลเดอร์ assets)

### 5. การตั้งค่า API URL
- ไฟล์ `.env` มีค่า `VITE_API_URL=http://localhost/api`
- ถ้าวาง API ในตำแหน่งอื่น ให้แก้ค่านี้แล้ว build ใหม่

### 6. การเข้าสู่ระบบ
- เปิด http://localhost ในเบราว์เซอร์
- บัญชีแอดมินเริ่มต้น:
  - อีเมล: `admin@rmuti.ac.th`
  - รหัสผ่าน: `admin123`
- แอดมินสามารถอนุมัติบัญชีผู้ใช้ใหม่ได้ในเมนู "อนุมัติสมาชิก"

## โครงสร้างโปรเจกต์

```
├── api/              # PHP API (Backend)
│   ├── config.php    # การเชื่อมต่อฐานข้อมูล
│   ├── auth.php      # ตรวจสอบ token
│   ├── login.php     # เข้าสู่ระบบ
│   ├── register.php  # สมัครสมาชิก
│   ├── me.php        # ข้อมูลผู้ใช้ปัจจุบัน
│   ├── users.php     # จัดการผู้ใช้
│   ├── units.php     # หน่วยงาน
│   ├── semesters.php # ปีการศึกษา
│   ├── activities.php # บันทึกกิจกรรม
│   ├── attendance.php # บันทึกเวลา
│   ├── lesson_plans.php # แผนการสอน
│   ├── evaluations.php # การประเมิน
│   ├── audit_logs.php  # บันทึกระบบ
│   ├── stats.php     # สถิติ
│   └── upload.php    # อัปโหลดรูปโปรไฟล์
├── database/
│   └── database.sql  # SQL schema สำหรับ import
├── src/              # React Frontend
│   ├── context/AuthContext.tsx
│   ├── lib/api.ts    # API client
│   ├── types/index.ts
│   └── pages/        # หน้าทั้งหมด
├── .env              # ตัวแปร环境
└── package.json
```

## บทบาทผู้ใช้

- **นักศึกษา**: บันทึกกิจกรรม, ลงเวลา, ส่งแผนการสอน, ดูผลการประเมิน
- **ครูพี่เลี้ยง**: ดูนักศึกษาในความดูแล, ตรวจบันทึกกิจกรรม, อนุมัติเวลา
- **อาจารย์**: ตรวจแผนการสอน, ประเมินผลนักศึกษา, ดูสรุปผล
- **แอดมิน**: อนุมัติบัญชี, จัดการผู้ใช้, หน่วยงาน, ปีการศึกษา, รายงาน, บันทึกระบบ

## พัฒนา (Development)

```bash
npm install
npm run dev      # รัน dev server (port 5173)
npm run build    # build สำหรับ production
```
