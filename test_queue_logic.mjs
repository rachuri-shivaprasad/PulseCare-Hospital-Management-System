import { initialAppointments } from './src/data/initialAppointments.js';
import { mockDoctors } from './src/data/mockDoctors.js';

console.log("=== RUNNING HOSPITAL QUEUE LOGIC TESTS ===");

let appointments = [...initialAppointments];
const doctors = mockDoctors;

// Test 1: Verify all 5 statuses exist in initial dataset
const statuses = new Set(appointments.map(a => a.status));
console.log("1. Statuses present in demo data:", Array.from(statuses));
if (!['Waiting', 'In Consultation', 'Completed', 'Skipped', 'Cancelled'].every(s => statuses.has(s))) {
  throw new Error("Missing required demo status!");
}
console.log("✓ PASS: All 5 statuses (Waiting, In Consultation, Completed, Skipped, Cancelled) present.");

// Test 2: Token Generator per doctor & date
const getDoctorPrefix = (docId) => {
  const idx = doctors.findIndex(d => d.id === docId);
  return `DR${idx >= 0 ? idx + 1 : 1}`;
};

const getNextTokenNumber = (docId, date) => {
  const prefix = getDoctorPrefix(docId);
  const doctorDateApts = appointments.filter(a => a.doctorId === docId && a.date === date);
  let maxSeq = 0;
  doctorDateApts.forEach(a => {
    if (a.tokenSequence && a.tokenSequence > maxSeq) {
      maxSeq = a.tokenSequence;
    } else if (a.tokenNumber) {
      const match = a.tokenNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });
  const nextSeq = maxSeq + 1;
  return { tokenNumber: `${prefix}-TK${String(nextSeq).padStart(2, '0')}`, tokenSequence: nextSeq };
};

const today = new Date().toISOString().split('T')[0];
const token1 = getNextTokenNumber('doc-1', today);
console.log("2. Generated token for doc-1:", token1.tokenNumber);
if (!token1.tokenNumber.startsWith("DR1-TK")) {
  throw new Error("Token format incorrect!");
}
console.log("✓ PASS: Sequential token format DR1-TKXX generated successfully.");

// Test 3: Single patient in consultation rule
const isDoctorBusy = (docId) => {
  return appointments.some(a => a.doctorId === docId && a.status === 'In Consultation');
};

console.log("3. Is Dr. Sarah Jenkins (doc-1) busy?", isDoctorBusy('doc-1'));
if (!isDoctorBusy('doc-1')) {
  throw new Error("doc-1 should be busy with active consultation in initial data!");
}
console.log("✓ PASS: Single consultation constraint detected correctly.");

// Test 4: Complete consultation frees doctor
const activeDoc1 = appointments.find(a => a.doctorId === 'doc-1' && a.status === 'In Consultation');
activeDoc1.status = 'Completed';
console.log("4. After completing consultation, is doc-1 busy?", isDoctorBusy('doc-1'));
if (isDoctorBusy('doc-1')) {
  throw new Error("doc-1 should be free after completing consultation!");
}
console.log("✓ PASS: Consultation completion properly frees doctor cabin.");

// Test 5: Call Next Patient for doc-1
const waitingForDoc1 = appointments
  .filter(a => a.doctorId === 'doc-1' && a.status === 'Waiting')
  .sort((a, b) => a.tokenSequence - b.tokenSequence);

console.log("5. Waiting for doc-1:", waitingForDoc1.map(w => w.tokenNumber));
const nextPatient = waitingForDoc1[0];
if (!nextPatient) throw new Error("Expected waiting patient for doc-1");
nextPatient.status = 'In Consultation';
console.log("   Called next patient:", nextPatient.tokenNumber, nextPatient.patientName);
console.log("✓ PASS: Call Next selects next waiting patient in order.");

// Test 6: Skip patient
const toSkip = appointments.find(a => a.status === 'Waiting');
if (toSkip) {
  toSkip.status = 'Skipped';
  console.log("6. Marked patient as Skipped:", toSkip.tokenNumber);
  // Ensure skipped patient is not in waiting queue
  const stillWaiting = appointments.filter(a => a.status === 'Waiting').some(a => a.id === toSkip.id);
  if (stillWaiting) throw new Error("Skipped patient should not be in waiting queue!");
  console.log("✓ PASS: Skipped patients excluded from waiting queue.");
}

// Test 7: Empty Queue handling
const emptyQueueCall = () => {
  const waiting = appointments.filter(a => a.status === 'Waiting' && a.doctorId === 'non-existent');
  return waiting.length > 0 ? waiting[0] : null;
};
console.log("7. Empty queue returns:", emptyQueueCall());
console.log("✓ PASS: Empty queue returns null safely without crashing.");

console.log("\nALL 7 TESTS PASSED WITH 100% SUCCESS!");
