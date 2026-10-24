# PulseCare Hospital OPD Scheduling & Queue Rules

This document outlines the architectural policies, concurrency mechanisms, and queue rules governing the PulseCare Hospital Appointment and Queue Management System.

---

## 1. Shared OPD Queue Policy vs Traditional Slots

- **Multiple Patients Per Slot**: PulseCare operates an Outpatient Department (OPD) queue model. Multiple patients are permitted to book the same doctor, date, and time slot. An existing `WAITING` appointment does **not** block other patients from booking into that session.
- **Account-Level & Phone-Level Duplicate Prevention**:
  - For logged-in patients (`ROLE_PATIENT`), a patient cannot book the *same doctor, date, and time-slot* twice under their own account while an active booking exists (`existsByDoctorIdAndDateAndTimeSlotAndPatientIdAndStatusNot`).
  - For anonymous / guest bookings, the patient's normalized phone number cannot be booked into the same doctor, date, and slot twice while active (`existsByDoctorIdAndDateAndTimeSlotAndPatientPhoneAndStatusNot`).
  - If a patient cancels their booking (`CANCELLED`), their slot occupancy is released, allowing rebooking if needed.

---

## 2. Concurrency-Safe Deterministic Token Generation

- **Token Format**: `{DOCTOR_CODE}-TK{SEQUENCE:02d}` (e.g., `DR1-TK01`, `DR1-TK02`).
- **Doctor & Date Scoping**: Tokens are strictly scoped per doctor and per date. Each doctor begins their queue with token `01` on each new consultation day.
- **Pessimistic Concurrency Locking**:
  - `AppointmentService.createAppointment` acquires a pessimistic write lock on the `Doctor` record via `doctorRepository.findByIdForUpdate(doctorId)`.
  - Sequential calculation computes `max(tokenSequence) + 1` atomically inside an active database transaction.
  - Concurrent bookings from simultaneous threads or web clients cannot generate duplicate active tokens.

---

## 3. Queue State Transitions & Lifecycle

Appointments move through a strictly regulated forward lifecycle:

```
[ BOOKING ] ──> WAITING ──> IN_CONSULTATION ──> COMPLETED
                  │              │
                  ├──> SKIPPED   └──> SKIPPED
                  │
                  └──> CANCELLED
```

1. **WAITING**: Initial state upon booking or receptionist walk-in creation. Patients are ordered strictly by `tokenSequence ASC`.
2. **IN_CONSULTATION**: Triggered when a doctor or receptionist clicks `Call Next` or `Start Consultation`.
   - **One-Patient-Per-Doctor Rule**: Only **one** patient per doctor may be in consultation at any time. Attempting to call another patient while a consultation is active returns HTTP `409 CONFLICT` or a busy response.
3. **COMPLETED**: Consultation completed, prescription and physician advice recorded.
   - Completed appointments **cannot** be reopened or cancelled.
4. **SKIPPED**: Patient was absent or unresponsive when their token was announced.
5. **CANCELLED**: Can only be performed on active `WAITING` appointments. Cancelled appointments **cannot** transition back into active consultation.

---

## 4. Booker vs Care Recipient Separation

- When a logged-in account holder (e.g. `Rachuri Shivaprasad`) books an appointment for a family member or friend (e.g. `Vamshi Krishna`):
  - Form-entered patient fields (`patientName`, `patientPhone`, `patientAge`, `patientGender`) are stored explicitly on the `Appointment` entity.
  - The appointment entity maintains a database relation to the account holder's `Patient` record (`appointment.patient`), ensuring it appears in the booker's Patient Portal history.
  - Doctor cabins, receptionist queues, and printable token slips display the actual care recipient's details (`Vamshi Krishna`).

---

## 5. Security & Role Authorization

- **Patient Portal (`/api/patient/appointments`)**: Restricted to authenticated patient (`ROLE_PATIENT`), returning only their own appointments.
- **Reception Desk & Doctor Cabins (`/api/appointments`, `/api/queue/**`)**: Protected by `ROLE_STAFF`.
- **CSRF Protection**: All non-idempotent mutating requests (`POST`, `PUT`, `DELETE`) require a valid `X-CSRF-TOKEN` header obtained from `/api/auth/csrf`.
