# PulseCare — Hospital Appointment and Queue Management System

A modern, responsive healthcare outpatient department (OPD) appointment and real-time token queue management web application built for college project demonstration.

Developed with **React + Vite**, **React Router**, and **custom Vanilla CSS** featuring a professional medical blue & crisp white aesthetic.

---

## 🌟 Key Features & Pages

### 1. Home Page (`/`)
- **Modern Medical Branding**: Hospital name, emergency hotlines (`108` / `911`), and accredited status.
- **Live OPD Queue Overview**: Real-time ticker showing current tokens in consultation, patients waiting, and turnaround times.
- **Workflow Overview**: 4-step outpatient care journey (Slot Booking → Digital Token → Live Tracking → Doctor Cabin).
- **Featured Specialists & Clinical Specialties**: Direct access to Cardiology, Neurology, Pediatrics, Orthopedics, Dermatology, and General Medicine.

### 2. Doctors Directory (`/doctors`)
- **Specialist Profiles**: High-resolution doctor profiles with qualifications, years of experience, patient ratings, and OPD cabin numbers.
- **Filtering & Search**: Real-time search by doctor name, medical specialty, or keywords.
- **Availability Schedule**: Live badges showing doctor availability and next open slots.
- **One-Click Booking**: Direct booking action button linking into pre-filled appointment slots.

### 3. Appointment Booking (`/book`)
- **Smart Patient Intake Form**: Patient name, contact number, age, gender, doctor selection, preferred date (Today/Tomorrow), and time slots.
- **Interactive Time Slot Picker**: Dynamically selectable slots with validation.
- **Instant Token Slip Generator**: On booking submission, a realistic physical-style OPD Token Slip modal is generated with unique token number (e.g., `TK-109`), mock barcode, and print functionality (`window.print()`).
- **Immediate State Synchronization**: Automatically enters the patient into the Receptionist queue and Doctor Cabin.

### 4. Patient Dashboard & Live Token Tracker (`/patient-dashboard`)
- **Live Queue Position Tracker**:
  - Patient's token number vs. currently serving token.
  - Number of patients ahead in the queue.
  - Estimated wait time calculation (~12 minutes per patient).
- **Visual Progress Stepper**: Tracks status across (Token Issued → In Waiting Lounge → In Cabin → Completed).
- **Digital Token Slip Viewer & Printer**: On-demand printable receipt.
- **Triage Vitals Display**: Displays recorded blood pressure, heart rate, and body temperature.
- **Appointment Management**: View history and cancel waiting appointments.

### 5. Receptionist Queue Desk (`/receptionist`)
- **Queue KPI Stats**: Total registered today, patients waiting, active consultations, and completed patients.
- **"CALL NEXT PATIENT" Action**: Announces the next waiting patient, plays an audio chime via the Web Audio API, and advances their status to *In Consultation*.
- **Quick Walk-In Registration**: Instant modal to register walk-in patients and issue immediate OPD tokens without pre-booking.
- **Queue Management Table**: Filter by department or status (Waiting, In Consultation, Completed, Cancelled). Individual call and cancellation controls.

### 6. Doctor Consultation Cabin (`/doctor-dashboard`)
- **Cabin Doctor Switcher**: Switch between different doctors (Dr. Sarah Jenkins, Dr. Rajesh Sharma, Dr. Marcus Chen, etc.) to demo multi-cabin operations.
- **Active Patient Card**: Displays the patient currently inside the cabin, their triage vitals (BP, SpO2, pulse, temperature), and reported symptoms.
- **Prescription & Clinical Notes**: Integrated textarea for diagnosis and medications.
- **"COMPLETE CONSULTATION" Action**: Completes the session, saves the clinical advice, updates queue statistics, and frees the cabin.
- **Cabin Queue Log**: Shows patients waiting specifically for this doctor and the completed consultation history.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Routing**: React Router DOM (`BrowserRouter`, `Routes`, `Route`, `NavLink`)
- **Styling**: Vanilla CSS (CSS variables, flexbox, CSS grid, glassmorphic blur, elevation shadows)
- **Icons**: Lucide React
- **Audio Feedback**: Web Audio API (hospital announcement chime)
- **State & Persistence**: React Context (`AppointmentQueueContext`) with `localStorage` fallback & demo reset button.

---

## 🚀 How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Launch

1. Open PowerShell or Terminal in the project directory:
   ```powershell
   cd "c:\Users\Praveen Rachuri\OneDrive\Documents\Desktop\hospital appointment"
   ```

2. Install dependencies (already installed):
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧪 Demonstration Walkthrough (For Presentation / College Viva)

Follow this 5-minute flow to demonstrate the interconnected system:

1. **Overview**: Open `http://localhost:3000/`. Notice the **Live OPD Queue ticker** at the top showing the currently served token and waiting count.
2. **Explore Doctors**: Click **Doctors** in the top navigation. Filter by "Cardiology" or search for "Sarah". Click **Book with Dr. Jenkins**.
3. **Book Appointment**:
   - Enter name `Alexander Pierce`, phone `555-019-2834`, age `41`.
   - Pick time slot `10:00 AM`.
   - Click **Confirm Appointment & Generate Token**.
   - Notice the **OPD Token Slip** popup with a newly generated token (e.g. `TK-109`).
4. **Track as Patient**: Click **Go to Patient Portal**. Notice Alexander Pierce's token displayed with the live progress bar and estimated wait time.
5. **Manage at Reception Desk**: Click **Reception Desk**.
   - Find Alexander Pierce in the queue.
   - Click the green **CALL NEXT PATIENT** button. Listen to the hospital chime and see the announcement banner flash.
6. **Doctor Consultation**: Click **Doctor Cabin**.
   - Notice Alexander Pierce is now the active patient inside Dr. Sarah Jenkins' cabin!
   - Review his vitals and enter prescription notes.
   - Click **COMPLETE CONSULTATION**. The session completes and the cabin is freed!
7. **Reset State**: Click **Reset Demo Data** in the top bar anytime to restore the default sample dataset.
