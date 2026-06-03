# 🚫 EVERYTHING THAT MUST NOT BE HARDCODED - COMPLETE LIST

## 🎯 CORE PRINCIPLE: **NOTHING SHOULD BE HARDCODED**

Every single piece of data that can change between schools, terms, or users MUST come from database or environment variables.

---

## 📊 1. SCHOOL INFORMATION (100% DYNAMIC)

### School Profile
```
❌ School name (e.g., "ABC Academy") 
❌ School motto
❌ School vision
❌ School mission
❌ Founding year
❌ Founder name
❌ School history/description
❌ School phone number
❌ School email address
❌ School physical address
❌ School P.O. Box
❌ School website URL
❌ School logo image path
❌ School favicon
❌ School cover image
❌ School colors (primary, secondary)
❌ School theme (dark/light mode setting)
```

### Location & Environment
```
❌ GPS coordinates (latitude, longitude)
❌ Region/County name
❌ Soil type (e.g., "loamy", "clay")
❌ Soil fertility level
❌ Soil images paths
❌ Road access type (tarmac, murram, dirt)
❌ Road distance from town
❌ Road condition
❌ Road photos
❌ Surrounding towns/landmarks
❌ Nearby schools/hospitals/markets
❌ Climate type (tropical, temperate)
❌ Average temperature
❌ Rainfall patterns
❌ Drone shot image paths
❌ Aerial video paths
```

### Infrastructure
```
❌ Number of classrooms
❌ Classroom capacity per room
❌ Classroom images
❌ Laboratory types (science, computer, language)
❌ Laboratory equipment count
❌ Laboratory images
❌ Library book count
❌ Library seating capacity
❌ Library images
❌ Sports fields (football, basketball, volleyball)
❌ Sports facilities images
❌ Dormitory names
❌ Dormitory capacity per house
❌ Dormitory images
❌ Dining hall capacity
❌ Dining hall images
❌ Chapel/Prayer hall name
❌ Chapel capacity
❌ Admin block description
```

---

## 👥 2. USER ROLES & PERMISSIONS (100% DYNAMIC)

### Role Definitions
```
❌ Role names (Admin, Principal, Teacher, Parent, Bursar, Store Keeper)
❌ Role descriptions
❌ Role hierarchy levels
❌ Permission to role mappings
❌ Custom permission flags
❌ Module access rights per role
❌ CRUD permissions per role (create, read, update, delete)
❌ Report access per role
❌ Dashboard widget access per role
```

### Custom Permissions (Granular)
```
❌ Can_view_students
❌ Can_edit_students
❌ Can_delete_students
❌ Can_view_fees
❌ Can_collect_fees
❌ Can_view_reports
❌ Can_send_sms
❌ Can_approve_requests
❌ Can_manage_inventory
❌ Can_access_chat
❌ Can_start_video_meeting
❌ Can_generate_receipts
❌ Can_process_payroll
❌ (and 100+ more permissions - ALL dynamic)
```

---

## 📚 3. ACADEMIC SETUP (100% DYNAMIC)

### Classes & Streams
```
❌ Class names (Form 1, Form 2, Form 3, Form 4)
❌ Class abbreviations (F1, F2, F3, F4)
❌ Stream names (A, B, C, D, E, East, West, North, South)
❌ Class capacity (max students per class)
❌ Class order/sequence (which class comes first)
❌ Promotion rules (which class to move to next)
```

### Subjects
```
❌ Subject names (Mathematics, English, Kiswahili, Biology, Chemistry, Physics, History, Geography, CRE, Business Studies, Agriculture, Computer Studies)
❌ Subject codes (MATH101, ENG102)
❌ Subject categories (Core, Elective, Sciences, Humanities)
❌ Subject grades/levels (Form 1-4)
❌ Subject weighting (for GPA calculation)
❌ Subject pass marks (minimum score)
❌ Subject teachers assignment (which teacher teaches which subject)
```

### Grading System
```
❌ Grade letters (A, B+, B, C+, C, D+, D, E, F)
❌ Grade score ranges (70-100 = A, 60-69 = B, etc.)
❌ Grade point values (A=12, B=10, etc.)
❌ Grade remarks (Excellent, Very Good, Good, Satisfactory, Pass, Fail)
❌ Pass mark threshold
❌ Distinction threshold
❌ Credit threshold
```

### Academic Calendar
```
❌ Term names (Term 1, Term 2, Term 3)
❌ Term start dates
❌ Term end dates
❌ Half-term break dates
❌ Exam week dates
❌ Holiday start/end dates
❌ School opening/closing dates
❌ Current active term
❌ Current academic year (2024, 2025)
```

---

## 📅 4. ATTENDANCE RULES (100% DYNAMIC)

```
❌ Attendance marking time limit (e.g., must mark within 24 hours)
❌ Late arrival threshold (minutes)
❌ Absent notification threshold (days)
❌ Auto-notify parent after X absences
❌ Excused absence categories (sick, family, travel, emergency)
❌ Attendance percentage warning level (e.g., 80%)
❌ Days in term (total school days)
❌ Subjects per day count
❌ Attendance reporting format
```

---

## 💰 5. FEE STRUCTURE (100% DYNAMIC)

### Fee Components
```
❌ Tuition fee amount (per term/year)
❌ Boarding fee amount
❌ Lunch fee amount
❌ Transport fee amount
❌ Laboratory fee amount
❌ Sports fee amount
❌ Uniform fee amount
❌ Library fee amount
❌ Activity fee amount
❌ Development fee amount
❌ Medical fee amount
❌ Insurance fee amount
❌ (Any custom fee name and amount)
```

### Fee Rules
```
❌ Fee due dates per term
❌ Late fee penalty amount (fixed or percentage)
❌ Late fee grace period (days)
❌ Discount types (sibling, early payment, merit-based)
❌ Discount percentages
❌ Scholarship amounts (full, half, partial)
❌ Bursary amounts
❌ Payment plan options (termly, monthly, weekly)
❌ Installment due dates
❌ Minimum payment amount
❌ Default payment method (cash, MPESA, bank)
```

---

## 📦 6. INVENTORY CATEGORIES (100% DYNAMIC)

```
❌ Category names (Stationery, Textbooks, Uniforms, Sports Equipment, Lab Equipment, Computer Equipment, Furniture, Cleaning Supplies, Kitchen Supplies, Medical Supplies, Maintenance Tools)
❌ Category descriptions
❌ Sub-categories under each main category
❌ Item attributes per category (size, color, brand, model)
❌ Stock units (pieces, sets, pairs, kilograms, liters, boxes)
❌ Reorder level defaults (min quantity before reorder)
❌ Maximum stock level (to prevent overstock)
❌ Storage location types (shelf, rack, room, building)
```

---

## ⚖️ 7. DISCIPLINE RULES (100% DYNAMIC)

### Merit Categories
```
❌ Merit names (Academic Excellence, Good Behavior, Cleanliness, Sports Achievement, Leadership, Community Service, Most Improved, Perfect Attendance)
❌ Merit points values (5, 10, 20 points)
❌ Merit badge images
❌ Merit certificate templates
```

### Demerit Categories
```
❌ Demerit names (Late Submission, Misconduct, Uniform Violation, Absenteeism, Bullying, Cheating, Littering, Disrespect)
❌ Demerit points values (-5, -10, -20)
❌ Warning thresholds (3 demerits = warning, 5 = detention, 10 = suspension)
```

### Streaks System
```
❌ Streak types (Cleanliness, Academic, Attendance)
❌ Streak milestones (7 days, 14 days, 30 days, 60 days, 90 days)
❌ Streak rewards (certificate, prize, recognition)
❌ Streak reset rules (miss 1 day = reset)
❌ Streak freeze allowance (days allowed to miss)
```

### Punishment Types
```
❌ Punishment names (Cleaning Duty, Extra Classes, Detention, Community Service, Suspension, Expulsion)
❌ Punishment duration (1 hour, 1 day, 1 week, 1 term)
❌ Punishment escalation rules
```

---

## 📱 8. COMMUNICATION SETTINGS (100% DYNAMIC)

### Notification Channels
```
❌ SMS enabled (true/false)
❌ Email enabled (true/false)
❌ WhatsApp enabled (true/false)
❌ Push enabled (true/false)
❌ SMS API key (AfricasTalking)
❌ SMS sender ID
❌ Email SMTP host
❌ Email SMTP port
❌ Email username
❌ Email password
❌ WhatsApp API token
❌ WhatsApp phone number ID
❌ WhatsApp business account ID
```

### Notification Templates
```
❌ SMS templates (fee reminder, attendance alert, result published, event reminder, emergency alert)
❌ Email templates (all of the above, with HTML formatting)
❌ WhatsApp message templates
❌ Push notification templates
❌ Template variables ({{student_name}}, {{fee_amount}}, {{due_date}}, etc.)
```

### WhatsApp Integration
```
❌ WhatsApp group link/ID
❌ Auto-post to WhatsApp (true/false)
❌ WhatsApp posting schedule
❌ WhatsApp message format
❌ WhatsApp business API webhook URL
```

---

## 🔧 9. SYSTEM CONFIGURATIONS (100% DYNAMIC)

### General Settings
```
❌ System name
❌ System timezone (Africa/Nairobi, UTC+3)
❌ Date format (DD/MM/YYYY, MM/DD/YYYY)
❌ Time format (12-hour, 24-hour)
❌ Currency symbol (KES, $, £, €)
❌ Currency code (KES, USD, GBP, EUR)
❌ Language (English, Kiswahili, French, Arabic)
❌ Default landing page URL
❌ Footer copyright text
```

### Security Settings
```
❌ Password minimum length (8, 10, 12)
❌ Password require uppercase (true/false)
❌ Password require numbers (true/false)
❌ Password require symbols (true/false)
❌ Session timeout minutes (30, 60, 120)
❌ Max login attempts (3, 5, 10)
❌ Lockout duration minutes (15, 30, 60)
❌ Two-factor authentication required (true/false)
❌ Allowed IP addresses (for admin access)
❌ JWT token expiry (7 days, 30 days)
```

### MPESA Settings
```
❌ MPESA consumer key
❌ MPESA consumer secret
❌ MPESA paybill number
❌ MPESA till number
❌ MPESA passkey
❌ MPESA environment (sandbox, production)
❌ MPESA callback URL
❌ MPESA shortcode type (paybill, till)
```

### Email Settings
```
❌ SMTP host (smtp.gmail.com, smtp.sendgrid.net)
❌ SMTP port (465, 587)
❌ SMTP secure (true/false)
❌ SMTP username
❌ SMTP password
❌ From email address
❌ From name
❌ Email signature
```

---

## 🎨 10. UI CONFIGURATIONS (100% DYNAMIC)

### Theme Settings
```
❌ Primary brand color (HEX code)
❌ Secondary brand color (HEX code)
❌ Success color (HEX code)
❌ Error color (HEX code)
❌ Warning color (HEX code)
❌ Info color (HEX code)
❌ Font family (Poppins, Roboto, Open Sans, Inter)
❌ Border radius (4px, 8px, 12px)
❌ Dark mode default (true/false)
❌ Sidebar collapsed default (true/false)
❌ Animation enabled (true/false)
```

### Dashboard Layouts
```
❌ Dashboard widget order per role
❌ Widget visibility per role
❌ Default tab on login
❌ Menu order per role
❌ Show/hide menu items per role
```

---

## 🌍 11. TRANSLATIONS (100% DYNAMIC)

```
❌ All UI text in italian
❌ All UI text in English
❌ All UI text in Kiswahili
❌ All UI text in French
❌ All UI text in Arabic (RTL)
❌ Error messages (all languages)
❌ Validation messages (all languages)
❌ Button labels (all languages)
❌ Menu items (all languages)
❌ Table headers (all languages)
❌ Form labels (all languages)
❌ Report text (all languages)
❌ Email templates (all languages)
❌ SMS templates (all languages)
```

---

## 📊 12. REPORTS & EXPORTS (100% DYNAMIC)

### Report Templates
```
❌ Report card layout template
❌ Receipt layout template
❌ Invoice layout template
❌ Certificate template
❌ ID card template
❌ Admission letter template
❌ Transfer letter template
❌ Fee statement template
❌ Attendance sheet template
❌ Result slip template
```

### Export Formats
```
❌ Default date format in exports
❌ Default number format (decimal places)
❌ Excel export columns order
❌ PDF export page size (A4, Letter)
❌ PDF export orientation (portrait, landscape)
❌ Include logo in exports (true/false)
❌ Include signature line (true/false)
```

---

## 🔄 13. BUSINESS RULES (100% DYNAMIC)

```
❌ Maximum students per class
❌ Maximum subjects per student
❌ Minimum attendance percentage to sit exams
❌ Fee clearance required before exams (true/false)
❌ Report cards released only after fee payment (true/false)
❌ Parent meeting booking window (days before)
❌ Homework submission grace period (hours)
❌ Maximum homework resubmissions allowed
❌ Late homework penalty (marks deduction)
❌ Maximum demerits before parent meeting
❌ Streak freeze days allowed per term
❌ Borrowing limit per student (max items)
❌ Borrowing duration (days)
❌ Library fine per day (amount)
```

---

## 📁 14. FILE UPLOAD PATHS (100% DYNAMIC)

```
❌ Student photo upload path
❌ Teacher photo upload path
❌ Parent photo upload path
❌ School logo upload path
❌ School cover image path
❌ Report card save path
❌ Receipt save path
❌ Invoice save path
❌ Certificate save path
❌ Assignment submission path
❌ Media gallery upload path
❌ Drone photos path
❌ Infrastructure photos path
❌ Event photos path
❌ Backup storage path
```

---

## 🔑 15. API ENDPOINTS (100% DYNAMIC)

### Base URLs (Environment Variables - NOT hardcoded)
```
❌ API_BASE_URL (https://api.school.com/v1)
❌ FRONTEND_URL (https://school.com)
❌ WS_URL (wss://ws.school.com)
❌ MPESA_CALLBACK_URL
❌ SMS_CALLBACK_URL
❌ WHATSAPP_WEBHOOK_URL
```

### External API Keys (Environment Variables)
```
❌ MPESA_CONSUMER_KEY
❌ MPESA_CONSUMER_SECRET
❌ AFRICASTALKING_API_KEY
❌ AFRICASTALKING_USERNAME
❌ SENDGRID_API_KEY
❌ WHATSAPP_API_TOKEN
❌ CLOUDINARY_CLOUD_NAME
❌ CLOUDINARY_API_KEY
❌ CLOUDINARY_API_SECRET
❌ GOOGLE_MAPS_API_KEY
❌ FIREBASE_SERVER_KEY
❌ REDIS_URL
❌ DATABASE_URL
```

---

## 📋 16. FEATURE TOGGLES (100% DYNAMIC)

```
❌ Enable chat system (true/false)
❌ Enable video meetings (true/false)
❌ Enable MPESA payments (true/false)
❌ Enable WhatsApp integration (true/false)
❌ Enable SMS notifications (true/false)
❌ Enable email notifications (true/false)
❌ Enable push notifications (true/false)
❌ Enable library module (true/false)
❌ Enable inventory module (true/false)
❌ Enable transport module (true/false)
❌ Enable boarding module (true/false)
❌ Enable alumni module (true/false)
❌ Enable multi-language (true/false)
❌ Enable dark mode (true/false)
❌ Enable backup (true/false)
❌ Enable analytics (true/false)
```

---

## 🗄️ 17. DATABASE CONNECTION (100% DYNAMIC)

```
❌ DB_HOST (localhost, 127.0.0.1, postgres.school.com)
❌ DB_PORT (5432, 3306)
❌ DB_NAME (school_db, prod_db)
❌ DB_USER (postgres, admin)
❌ DB_PASSWORD
❌ DB_SSL_ENABLED (true/false)
❌ DB_MAX_CONNECTIONS (20, 50, 100)
❌ DB_IDLE_TIMEOUT (30, 60 seconds)
❌ DB_CONNECTION_TIMEOUT (10, 30 seconds)
```

---
