# 🔄 COMPLETE SYSTEM COMMUNICATION FLOW - HOW EVERYTHING TALKS TO EACH OTHER

---

## 📡 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WHOLE SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │  Parent  │    │ Teacher  │    │  Bursar  │    │   Admin  │             │
│   │   App    │    │   App    │    │   App    │    │   App    │             │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘             │
│        │               │               │               │                    │
│        └───────────────┼───────────────┼───────────────┘                    │
│                        ▼               ▼                                    │
│   ┌─────────────────────────────────────────────────────────────┐          │
│   │                    API GATEWAY (Backend)                     │          │
│   │              Express/Node.js + TypeScript                    │          │
│   └─────────────────────────────────────────────────────────────┘          │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         ▼                          ▼                          ▼             │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐        │
│   │  Database   │          │    Redis    │          │  WebSocket  │        │
│   │ PostgreSQL  │          │   (Cache)   │          │   Server    │        │
│   └─────────────┘          └─────────────┘          └─────────────┘        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────┐          │
│   │                    EXTERNAL INTEGRATIONS                     │          │
│   ├─────────────┬─────────────┬─────────────┬─────────────────┤          │
│   │   MPESA     │   SMS       │  WhatsApp   │     Email       │          │
│   │   Gateway   │ AfricasTalk │  Business   │   SendGrid      │          │
│   └─────────────┴─────────────┴─────────────┴─────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 👤 USER TO USER COMMUNICATION FLOWS

### 1. PARENT ↔ TEACHER CHAT (REAL-TIME)

```
Parent opens chat → Types message → Clicks Send
        │
        ▼
Frontend (React) → WebSocket.emit('send_message', {
    senderId: parentId,
    receiverId: teacherId,
    message: text,
    attachments: [],
    timestamp: Date.now()
})
        │
        ▼
Backend WebSocket Server → Receives event
        │
        ├──► Saves to PostgreSQL (messages table)
        ├──► Stores in Redis (recent chats cache)
        ├──► Checks if teacher is online
        │
        ├──► If ONLINE: WebSocket.emit to teacher's session → Teacher sees message instantly
        │
        └──► If OFFLINE: 
             ├──► Save as unread
             ├──► Send Push Notification (Firebase)
             ├──► Send SMS (if enabled)
             └──► Send Email digest
        │
        ▼
Teacher opens app → Sees unread badge → Reads message
        │
        ▼
Teacher types reply → Same flow back to parent
```

### 2. TEACHER → PARENT BULK MESSAGE (Class Announcement)

```
Teacher clicks "Send to All Parents" → Selects Class (Form 2A)
        │
        ▼
Frontend → POST /api/messages/bulk
        │
        ▼
Backend API → 
        ├──► Fetch all students in Form 2A
        ├──► Fetch all parents linked to those students
        ├──► Remove duplicates (if parent has 2+ children in same class)
        ├──► Create message record for each parent
        │
        ▼
Background Job Queue → Process each message
        │
        ├──► WebSocket: Send to online parents (real-time)
        ├──► Firebase: Push notification to offline parents
        ├──► SMS Queue: Send SMS (if opted in)
        ├──► Email Queue: Send email (if opted in)
        └──► WhatsApp: Send via WhatsApp Business API
        │
        ▼
All parents receive message simultaneously
```

---

## 📢 ANNOUNCEMENTS & UPDATES FLOW

### 3. ADMIN → EVERYONE (School-Wide Announcement)

```
Admin posts announcement → "School closed due to heavy rains"
        │
        ▼
Backend → Creates Announcement record in database
        │
        ▼
Trigger Event: 'announcement_created'
        │
        ├──► WebSocket Broadcast to ALL connected users (parents, teachers, staff)
        │    └──► Real-time popup notification in all dashboards
        │
        ├──► Background Job: Send to ALL parents (1000+)
        │    ├──► SMS Queue (batch send - 100 per minute)
        │    ├──► Email Queue (batch send - 500 per minute)
        │    ├──► WhatsApp Queue (batch send)
        │    └──► Push Notification Queue (Firebase)
        │
        ├──► WhatsApp Group Integration
        │    └──► Send to linked WhatsApp group via WhatsApp Business API
        │
        └──► Activity Log: Record who sent, when, to whom
        │
        ▼
Every parent receives message within 2-5 minutes (depending on batch size)
```

### 4. BURSAR → PARENTS (Fee Reminder)

```
Bursar selects "Send Fee Reminders" → Due date in 7 days
        │
        ▼
Backend → 
        ├──► Query all students with outstanding fees
        ├──► Filter by due date <= 7 days
        ├──► Group by parent (one parent, multiple children)
        ├──► Generate personalized message with total amount
        │
        ▼
For each parent:
        ├──► Create notification record
        ├──► Send SMS (shortened message with payment link)
        ├──► Send Email (detailed breakdown)
        ├──► Send WhatsApp (with quick pay button)
        └──► Send Push Notification (if app installed)
        │
        ▼
Parent clicks payment link → Opens fee payment page → Pays
        │
        ▼
MPESA Callback → Backend receives payment confirmation
        │
        ├──► Update fee balance
        ├──► Generate receipt
        ├──► Send confirmation to parent (SMS + Email + WhatsApp)
        └──► Notify Bursar dashboard (real-time update)
```

---

## 🔄 REAL-TIME DATA UPDATES

### 5. TEACHER MARKS ATTENDANCE → PARENT SEES INSTANTLY

```
Teacher marks John absent at 8:05 AM
        │
        ▼
Frontend → POST /api/attendance/mark
        │
        ▼
Backend:
        ├──► Save attendance record to database
        ├──► Check rule: "Notify parent if absent"
        │    └──► Trigger immediate notification to parent
        │         ├──► SMS: "John was absent today"
        │         ├──► Push: Notification to parent's phone
        │         └──► In-app: Real-time update on parent dashboard
        │
        ├──► WebSocket: Emit to parent's session (if online)
        │    └──► Parent dashboard updates instantly without refresh
        │
        └──► Update Redis cache (attendance summary for parent)
        │
        ▼
Parent opens app at 8:10 AM → Sees absence already recorded
```

### 6. TEACHER ENTERS GRADES → PARENT SEES INSTANTLY

```
Teacher enters CAT 1 scores for Form 2A Mathematics
        │
        ▼
Backend:
        ├──► Save grades to database
        ├──► Recalculate class average
        ├──► Recalculate student positions
        ├──► Generate grade comments (auto)
        │
        ├──► Check if "Auto-publish results" is enabled
        │    └──► If YES: Immediately publish to parents
        │
        ├──► WebSocket: Emit to all parents of students in Form 2A
        │    └──► Parent dashboard shows "New Results Available" badge
        │
        ├──► Send notification to parents
        │    ├──► SMS: "New results available. Check portal."
        │    └──► Push: "John scored 85% in Mathematics"
        │
        └──► Update parent cache (results summary)
```

---

## 📊 DATA SYNCHRONIZATION FLOWS

### 7. PARENT PAYS FEES → MULTIPLE SYSTEMS UPDATE

```
Parent pays KSh 10,000 via MPESA
        │
        ▼
MPESA Callback → Backend receives payment (real-time)
        │
        ▼
Backend Transaction Processor:
        ├──► Verify payment (check amount, reference, phone number)
        ├──► Match payment to student (by admission number reference)
        ├──► Update fee_balance table: DEDUCT 10,000
        ├──► Create payment_receipt record
        ├──► Generate receipt PDF
        │
        ├──► WebSocket: Emit to Parent's session
        │    └──► Parent dashboard: Fee balance updates instantly
        │
        ├──► WebSocket: Emit to Bursar's session
        │    └──► Bursar dashboard: New payment appears in real-time
        │
        ├──► Update Redis cache (parent fee summary)
        ├──► Invalidate previous cache keys
        │
        ├──► Trigger background jobs:
        │    ├──► Send receipt via SMS (with download link)
        │    ├──► Send receipt via Email (PDF attached)
        │    ├──► Send receipt via WhatsApp
        │    └──► Update financial analytics (daily collection total)
        │
        └──► Log to audit trail (who recorded payment)
```

### 8. ADMIN UPDATES SCHOOL INFO → ALL USERS SEE NEW DATA

```
Admin edits "School Motto" from "Excel" to "Strive for Excellence"
        │
        ▼
Backend: PUT /api/school/profile
        │
        ├──► Update school table in database
        ├──► Invalidate ALL Redis cache keys containing school info
        ├──► Trigger cache refresh
        │
        ├──► WebSocket: Broadcast 'school_info_updated' to ALL connected users
        │    └──► All dashboards: Show toast "School info updated"
        │    └──► Frontend refetches school data
        │
        └──► Log to activity_logs (Admin changed motto)
```

---

## 📱 EXTERNAL INTEGRATION FLOWS

### 9. WHATSAPP INTEGRATION FLOW

```
Admin posts announcement → "Sports Day on Saturday"
        │
        ▼
Backend → Check if "WhatsApp Integration" is enabled
        │
        ├──► Format message for WhatsApp (short, with buttons)
        ├──► Send to WhatsApp Business API endpoint
        │
        ▼
WhatsApp Business API → 
        ├──► Receives message
        ├──► Sends to linked WhatsApp Group
        └──► Also sends to parent phone numbers (if opted in)
        │
        ▼
Parent receives on WhatsApp → Can reply
        │
        ▼
WhatsApp Webhook → Parent's reply comes back to backend
        │
        ├──► Parse message
        ├──► Determine if query (e.g., "My fee balance?")
        ├──► Auto-respond via chatbot or forward to admin
        └──► Log interaction
```

### 10. SMS INTEGRATION FLOW (AfricasTalking)

```
System needs to send 500 SMS messages
        │
        ▼
Backend → SMS Service
        ├──► Create SMS queue in Redis
        ├──► Process in batches of 100 (rate limiting)
        ├──► For each batch:
        │    ├──► Call AfricasTalking API
        │    ├──► Send messages
        │    ├──► Track delivery reports
        │    └──► Update status (sent, delivered, failed)
        │
        ├──► If failed: Retry 3 times with exponential backoff
        ├──► Log all SMS to database (for audit)
        │
        └──► Update credit balance (deduct from account)
```

---

## 🔔 NOTIFICATION DELIVERY FLOW

### 11. COMPLETE NOTIFICATION PIPELINE

```
Trigger Event Occurs (e.g., new homework assigned)
        │
        ▼
Event Emitter → 'homework_assigned'
        │
        ▼
Notification Service:
        ├──► Determine affected users (parents of students in class)
        ├──► For each user:
        │    ├──► Check user preferences (SMS, Email, Push, WhatsApp)
        │    ├──► Create notification record in database
        │    │
        │    ├──► If PUSH enabled:
        │    │    ├──► Send to Firebase Cloud Messaging (FCM)
        │    │    └──► FCM sends to device
        │    │
        │    ├──► If SMS enabled:
        │    │    ├──► Add to SMS queue
        │    │    └──► Process via AfricasTalking
        │    │
        │    ├──► If EMAIL enabled:
        │    │    ├──► Generate email template
        │    │    ├──► Add to email queue
        │    │    └──► Send via SendGrid/Amazon SES
        │    │
        │    └──► If WHATSAPP enabled:
        │         ├──► Format for WhatsApp
        │         └──► Send via WhatsApp Business API
        │
        ├──► WebSocket: Send to online users (real-time)
        │
        └──► Update analytics: notifications_sent counter
```

---

## 🔄 CACHE UPDATE FLOWS

### 12. DATA CHANGE → CACHE INVALIDATION

```
Teacher updates student's grade (85% → 90%)
        │
        ▼
Backend: UPDATE results table
        │
        ├──► Database trigger: record change
        ├──► Invalidate Redis cache keys:
        │    ├─── student:grades:{studentId}
        │    ├─── class:results:{classId}
        │    ├─── parent:dashboard:{parentId}
        │    └─── teacher:class:{teacherId}
        │
        ├──► Recalculate dependent data:
        │    ├─── Class average (update cache)
        │    ├─── Student position (update cache)
        │    └─── Parent summary (update cache)
        │
        └──► WebSocket: Push update to affected users
             └──► Parent dashboard updates automatically
```

---

## 🔄 BACKGROUND JOB FLOWS

### 13. DAILY AUTOMATED JOBS (Cron Jobs)

```
Every day at 6:00 AM:
        │
        ▼
Cron Trigger → Backend Job Scheduler
        │
        ├──► JOB 1: Attendance Reminders
        │    └──► Check which students were absent yesterday
        │    └──► Send SMS to parents: "John was absent yesterday"
        │
        ├──► JOB 2: Fee Due Reminders
        │    └──► Check due dates in next 7 days
        │    └──► Send reminders to parents with outstanding
        │
        ├──► JOB 3: Low Stock Alerts
        │    └──► Query inventory for items below reorder level
        │    └──► Send email to store keeper
        │
        ├──► JOB 4: Database Backup
        │    └──► Create PostgreSQL dump
        │    └──► Upload to Cloud Storage (AWS S3)
        │    └──► Send backup confirmation to admin
        │
        ├──► JOB 5: Report Generation
        │    └──► Generate daily financial report
        │    └──► Email to bursar and principal
        │
        ├──► JOB 6: Cache Warmup
        │    └──► Preload frequently accessed data into Redis
        │
        └──► JOB 7: Log Rotation
             └──► Archive old logs (>30 days)
             └────► Delete old temporary files
```

---

## 🔄 REAL-TIME DASHBOARD UPDATES

### 14. WEBSOCKET EVENT TYPES

```javascript
// All real-time events the system emits

WebSocket Events:
├── message:new          // New chat message
├── message:read         // Message was read
├── attendance:marked    // Attendance was marked
├── result:published     // New results available
├── fee:paid            // Fee payment received
├── fee:overdue         // Fee became overdue
├── announcement:new     // New school announcement
├── homework:assigned    // New homework assigned
├── homework:submitted   // Student submitted homework
├── homework:graded      // Homework was graded
├── event:reminder       // Event reminder
├── meeting:booked       // Meeting was booked
├── meeting:cancelled    // Meeting was cancelled
├── stock:low           // Low stock alert
├── stock:request       // New stock request
├── discipline:merit     // Merit given to student
├── discipline:demerit   // Demerit given
├── streak:awarded       // Streak achieved
├── profile:updated      // User profile changed
└── system:maintenance   // System maintenance notice
```

---

## 🔄 ERROR HANDLING & RETRY FLOWS

### 15. FAILED MESSAGE RETRY MECHANISM

```
System attempts to send SMS → FAILS (network error)
        │
        ▼
Backend → Retry Queue (Redis Bull)
        ├──► Retry 1: After 5 seconds
        ├──► Retry 2: After 30 seconds
        ├──► Retry 3: After 2 minutes
        ├──► Retry 4: After 5 minutes
        └──► Retry 5: After 15 minutes
        │
        ├──► If all retries fail:
        │    ├──► Mark message as FAILED in database
        │    ├──► Log error to error_logs table
        │    ├──► Send alert to admin (email)
        │    └──► Add to dead letter queue for manual review
        │
        └──► Admin can manually retry from dashboard
```

---

## 🔄 SYSTEM UPGRADE & UPDATE FLOW

### 16. HOW SYSTEM UPDATES ITSELF

```
Developer pushes new code to GitHub
        │
        ▼
CI/CD Pipeline (GitHub Actions):
        ├──► Run tests (jest, vitest)
        ├──► Build frontend (npm run build)
        ├──► Build backend (tsc)
        ├──► Run migrations (prisma migrate deploy)
        ├──► Run database backups (pre-update)
        │
        ▼
Deployment Strategy (Zero Downtime):
        │
        ├──► Start new backend instance (blue)
        ├──► Run health checks on new instance
        ├──► Switch load balancer from old (green) to new (blue)
        ├──► Keep old instance running for 5 minutes
        ├──► Drain connections from old instance
        ├──► Shutdown old instance
        │
        ▼
Frontend Deployment:
        ├──► Build new frontend bundle
        ├──► Upload to CDN (Cloudflare)
        ├──► Invalidate cache
        ├──► Users see new version on next page load
        │
        ▼
Database Migrations:
        ├──► Run migrations in transaction
        ├──► If migration fails: Rollback
        ├──► Update Prisma client
        └──► Update Redis schemas
        │
        ▼
WebSocket Server:
        ├──► Notify connected users: "Update in 30 seconds"
        ├──► Allow existing connections to finish
        ├──► Restart WebSocket server
        ├──► Reconnect users automatically
        │
        ▼
Post-Deployment:
        ├──► Run smoke tests (critical paths)
        ├──► Update documentation
        ├──► Send deployment notification to admin
        └──► Monitor error rates for 1 hour
```

---

## 🔄 DATABASE REPLICATION & SYNC

### 17. MASTER-SLAVE REPLICATION

```
Master Database (Primary - writes)
        │
        ├──► All writes go here (INSERT, UPDATE, DELETE)
        │
        └──► Continuous replication to:
             │
             ├──► Slave 1 (Read Replica - reporting)
             │    └──► All report generation reads from here
             │
             ├──► Slave 2 (Read Replica - user queries)
             │    └──► Parent/Teacher dashboard reads from here
             │
             └──► Backup Server (Disaster Recovery)
                  └──► Nightly full backup
                  └──► WAL archiving (point-in-time recovery)
```

---

## 🔄 LOAD BALANCING & SCALING

### 18. HOW SYSTEM HANDLES HIGH TRAFFIC

```
User Request comes in (1000+ concurrent users)
        │
        ▼
Load Balancer (Nginx/HAProxy):
        ├──► Distributes traffic across 5 backend instances
        ├──► Health checks every 10 seconds
        ├──► Sticky sessions (WebSocket connections)
        │
        ▼
Backend Instances (5x Node.js):
        ├──► Instance 1,2,3: API requests
        ├──► Instance 4,5: WebSocket connections
        │
        ▼
Redis Cluster:
        ├──► 3 Master nodes (sharding)
        ├──► 3 Slave nodes (replicas)
        ├──► Handles: Sessions, Cache, Queues, Pub/Sub
        │
        ▼
Database Connection Pool:
        ├─── Max 100 connections per instance
        ├─── Connection timeout: 30 seconds
        └─── Idle timeout: 60 seconds
```

---

## 🔄 DATA BACKUP & RECOVERY FLOW

### 19. AUTOMATED BACKUP PIPELINE

```
Every 6 hours (00:00, 06:00, 12:00, 18:00):
        │
        ▼
Backup Service:
        ├──► Create database dump (pg_dump)
        ├──► Compress with gzip (60-80% size reduction)
        ├──► Encrypt with GPG (AES-256)
        ├──► Upload to multiple locations:
        │    ├──► AWS S3 (primary)
        │    ├──► Google Cloud Storage (secondary)
        │    └──► Local NAS (tertiary)
        │
        ├──► Retention policy:
        │    ├─── Hourly: Keep 24 hours
        │    ├─── Daily: Keep 30 days
        │    ├─── Weekly: Keep 12 weeks
        │    └─── Monthly: Keep 12 months
        │
        ├──► Send backup report to admin (email)
        │    ├─── Backup size
        │    ├─── Upload status
        │    └─── Verification hash
        │
        └──► Test restore on staging environment weekly
```

---

## 🔄 MONITORING & ALERTING FLOW

### 20. SYSTEM HEALTH MONITORING

```
Every 1 minute:
        │
        ▼
Monitoring Service:
        ├──► Check API response time (>500ms = warn, >2s = critical)
        ├──► Check database connection (ping)
        ├──► Check Redis connection (ping)
        ├──► Check WebSocket server (connectivity)
        ├──► Check disk space (>80% = warn, >90% = critical)
        ├──► Check memory usage (>80% = warn, >90% = critical)
        ├──► Check CPU usage (>80% = warn, >90% = critical)
        │
        ▼
If ANY check fails:
        │
        ├──► Log to system_health table
        ├──► Send alert to admin:
        │    ├──► SMS (critical only)
        │    ├──► Email (all alerts)
        │    ├──► Telegram (if configured)
        │    └──► PagerDuty/Opsgenie (if integrated)
        │
        ├──► Auto-remediation:
        │    ├─── If high memory: Restart instance
        │    ├─── If high CPU: Scale up (add instance)
        │    ├─── If DB full: Run cleanup script
        │    └─── If disk full: Delete old logs
        │
        └──► Create incident report
```

---

## 📊 COMPLETE COMMUNICATION SUMMARY TABLE

| Communication Type | Sender | Receiver | Protocol | Real-time? | Persistence |
|-------------------|--------|----------|----------|------------|-------------|
| Parent-Teacher Chat | Parent/Teacher | Parent/Teacher | WebSocket | ✅ Yes | Database |
| Announcement | Admin | Everyone | HTTP + WebSocket | ✅ Yes | Database |
| Fee Reminder | Bursar | Parent | HTTP + SMS + Email | ❌ No (batch) | Database |
| Attendance Alert | System | Parent | WebSocket + SMS | ✅ Yes | Database |
| Grade Published | Teacher | Parent | WebSocket + Push | ✅ Yes | Database |
| Payment Confirmation | MPESA | Parent | SMS + Email + WebSocket | ✅ Yes | Database |
| Low Stock Alert | System | Store Keeper | Email + Push | ❌ No (daily) | Database |
| Meeting Booking | Parent | Teacher | WebSocket + Email | ✅ Yes | Database |
| System Update | Developer | Admin | Email + Telegram | ❌ No | N/A |
| Backup Report | System | Admin | Email | ❌ No | Database |

---

## ✅ WHAT YOU MUST ADD TO THE SYSTEM

### CRITICAL COMPONENTS MISSING FROM ABOVE:

1. **WebSocket Server** - For real-time chat and live updates
2. **Message Queue (Redis Bull)** - For handling bulk notifications
3. **Background Job Scheduler (Node Cron)** - For automated tasks
4. **Notification Service** - Unified API for SMS, Email, Push, WhatsApp
5. **Event Emitter** - For decoupled communication between modules
6. **Cache Layer (Redis)** - For fast data access
7. **Load Balancer** - For scaling to many users
8. **CDN** - For serving static assets (images, videos)
9. **Backup Service** - Automated database backups
10. **Monitoring Service** - Health checks and alerts
11. **API Rate Limiter** - Prevent abuse
12. **Audit Logger** - Track all actions
13. **Webhook Receiver** - For MPESA and WhatsApp callbacks
14. **File Upload Service** - For images, videos, documents
15. **PDF Generator** - For report cards, receipts, invoices
16. **Excel Processor** - For bulk imports/exports

---

## 🚀 FINAL ANSWER

**The whole system communicates through:**

1. **HTTP/HTTPS** - Regular API calls (CRUD operations)
2. **WebSockets** - Real-time chat, live updates, notifications
3. **Message Queues** - Bulk operations, background jobs
4. **Webhooks** - External integrations (MPESA, WhatsApp)
5. **Cron Jobs** - Scheduled tasks (backups, reminders)
6. **Database Triggers** - Internal data change events
7. **Redis Pub/Sub** - Cross-instance communication
8. **Event Emitters** - Decoupled module communication
9. **SMS Gateway** - Text messages to parents
10. **Email Service** - Email notifications
11. **Push Notifications** - Mobile app alerts
12. **WhatsApp API** - WhatsApp messages

**EVERYTHING is connected. When one thing changes, ALL relevant users see it instantly!** 🔥