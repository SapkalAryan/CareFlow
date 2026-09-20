# CareFlow - Doctor-Patient-Pharmacy Platform

CareFlow is a production-ready, full-stack healthcare management web application connecting Doctors, Patients, and Pharmacies into a unified, secure digital ecosystem.

Built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **MongoDB Atlas via Mongoose**, **NextAuth.js (JWT + bcrypt 12 rounds)**, and **OpenAI API (GPT-4o-mini)** for AI-assisted prescription structuring.

---

## 🌟 Key Features & Architecture

### 1. Doctor Portal (`/doctor`)
- **Dashboard Overview**: Real-time stats (`Total Patients`, `Active Prescriptions`, `Pending Refills`, `Upcoming Follow-Ups`).
- **Patient Management**: Register new patient accounts, search directory by name/phone/ID, and view complete medical history & timeline.
- **AI Prescription Assistant**: Input natural-language medication instructions (e.g., *"Give patient amlodipine 5 mg once daily after breakfast for 30 days"*). Uses OpenAI GPT-4o-mini to convert free-text into structured fields (`medicine`, `strength`, `dosage`, `frequency`, `timing`, `duration`, `quantity`).
- **Rule 4 AI Safety Boundary**: The AI assistant strictly returns `requiresDoctorConfirmation: true`. Prescriptions are NEVER auto-saved without doctor review and explicit confirmation.
- **Refill Authorization**: Review patient refill requests; approve (generates new authorized prescription duplicate), reject, or request follow-up consultation.

### 2. Patient Portal (`/patient`)
- **Dashboard Overview**: Active prescriptions, pending pharmacy orders, and refill alerts.
- **Medical Timeline**: Complete chronological audit feed of all healthcare events (`CONSULTATION`, `PRESCRIPTION_CREATED`, `ORDER_PLACED`, `PHARMACY_ACCEPTED`, `DISPENSED`, `REFILL_REQUESTED`).
- **Medication Ordering**: One-click "Order Medicines" to send prescriptions to registered pharmacies.
- **Refill Requests**: Request repeat prescription authorizations directly to attending doctors.

### 3. Pharmacy Portal (`/pharmacy`)
- **Fulfillment Center**: View incoming prescriptions & orders categorized by status (`SENT_TO_PHARMACY`, `ACCEPTED`, `PROCESSING`, `READY_FOR_PICKUP`, `DISPENSED`).
- **Privacy Controls**: Strict HIPAA-grade data sanitization. Pharmacy views display ONLY fulfillment-relevant fields (`medicineNames`, `strengths`, `quantities`, `patientName`, `prescriptionId`). NO full medical history or private doctor clinical notes are exposed.
- **Status Workflow**: Step-by-step status transitions automatically post real-time `TimelineEvent` records to the patient's feed.

---

## 🔒 Security & Validation Constraints

- **Zero Dummy Data**: No seed scripts, demo accounts, or mock arrays. Database starts empty; every record originates from real user input.
- **Real Database Persistence**: Mongoose schemas enforcing indexed unique constraints (`email`, `prescriptionId`, `orderId`).
- **Authentication**: NextAuth Credentials provider using bcrypt with **12 rounds** of salt hashing.
- **Route & API Protection**: Next.js `middleware.ts` enforces role-based access control (RBAC) on all routes.
- **Audit Logging**: Mandatory logging of user actions (`USER_REGISTERED`, `READ_PATIENT_PROFILE`, `CREATE_PRESCRIPTION`, `UPDATE_ORDER_STATUS`) to `AuditLog`.
- **Validation**: Strict Zod schemas on every form and API route.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Custom Medical Theme Components
- **Database**: MongoDB Atlas via Mongoose
- **Auth**: NextAuth.js (Auth.js) with JWT & bcrypt (12 rounds)
- **AI Engine**: OpenAI API (GPT-4o-mini)
- **File Storage**: Vercel Blob
- **Validation**: Zod

---

## 🚀 Environment Variables (`.env`)

Copy `.env.example` to `.env.local` and configure your credentials:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/careflow?retryWrites=true&w=majority
NEXTAUTH_SECRET=a_random_32_character_secret_key_here
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=sk-proj-...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## 💻 Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 📦 Vercel Deployment Instructions

1. Push your code repository to GitHub/GitLab.
2. Import project into Vercel Dashboard.
3. Configure Environment Variables in Vercel project settings:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel production URL e.g. `https://careflow-app.vercel.app`)
   - `OPENAI_API_KEY`
4. Deploy! Next.js 14 App Router routes, server actions, and Mongoose connection handling build seamlessly on Vercel.
