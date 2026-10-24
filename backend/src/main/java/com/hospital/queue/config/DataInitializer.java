package com.hospital.queue.config;

import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.AppointmentStatus;
import com.hospital.queue.entity.Doctor;
import com.hospital.queue.repository.AppointmentRepository;
import com.hospital.queue.repository.DoctorRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.hospital.queue.repository.PatientRepository patientRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializer(DoctorRepository doctorRepository, 
                           AppointmentRepository appointmentRepository,
                           com.hospital.queue.repository.PatientRepository patientRepository,
                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initializeDoctors();
        initializeStaffUsers();
        initializeSampleAppointments();
    }

    public void initializeDoctors() {
        if (doctorRepository.count() == 0) {
            List<Doctor> doctors = List.of(
                new Doctor("doc-1", "Dr. Sarah Jenkins", "Cardiology", "Senior Consultant Cardiologist",
                    "MD, DM (Cardiology), FACC", "15+ Years", 4.9, 184, "Room 102 (OPD Block A)",
                    "$60", "Mon, Wed, Fri (09:00 AM - 02:00 PM)", "Today, 10:30 AM",
                    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
                    "Specializing in preventive cardiology, coronary interventions, echocardiography, and heart failure management with over 15 years of clinical excellence.",
                    "DR1"),

                new Doctor("doc-2", "Dr. Rajesh Sharma", "Neurology", "Chief Neurosurgeon & Neurologist",
                    "MBBS, MS, MCh (Neurosurgery)", "14+ Years", 4.8, 142, "Room 205 (Neuro Sciences Wing)",
                    "$75", "Tue, Thu, Sat (10:00 AM - 03:00 PM)", "Today, 11:00 AM",
                    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
                    "Pioneer in stroke management, spinal disc disorders, Parkinson's care, and advanced non-invasive neuro-monitoring procedures.",
                    "DR2"),

                new Doctor("doc-3", "Dr. Elena Rostova", "Pediatrics", "Consultant Pediatrician & Neonatologist",
                    "MD (Pediatrics), FAAP", "10+ Years", 4.9, 220, "Room 108 (Child Care Clinic)",
                    "$50", "Mon - Fri (08:30 AM - 01:30 PM)", "Today, 09:30 AM",
                    "https://images.unsplash.com/photo-1594824813637-a16e87a0e7db?auto=format&fit=crop&q=80&w=400",
                    "Warm and compassionate pediatric care focusing on newborn health, immunization schedules, childhood nutrition, and developmental milestones.",
                    "DR3"),

                new Doctor("doc-4", "Dr. Marcus Chen", "Orthopedics", "Senior Joint Replacement Surgeon",
                    "MBBS, MS (Ortho), FRCS", "16+ Years", 4.8, 165, "Room 114 (Bone & Joint Center)",
                    "$65", "Mon, Tue, Thu (09:00 AM - 01:00 PM)", "Today, 10:00 AM",
                    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
                    "Specialist in robotic knee and hip replacements, arthroscopy, sports injury rehabilitation, and complex fracture management.",
                    "DR4"),

                new Doctor("doc-5", "Dr. Aisha Patel", "Dermatology", "Clinical & Aesthetic Dermatologist",
                    "MD (Dermatology, Venereology & Leprosy)", "9+ Years", 4.7, 118, "Room 301 (Skin & Aesthetics)",
                    "$55", "Mon, Wed, Sat (11:00 AM - 04:00 PM)", "Today, 12:00 PM",
                    "https://images.unsplash.com/photo-1559839734-6017b83ec6a4?auto=format&fit=crop&q=80&w=400",
                    "Expertise in clinical dermatology, chronic eczema and psoriasis management, acne scarring treatments, and advanced phototherapy.",
                    "DR5"),

                new Doctor("doc-6", "Dr. David Miller", "General Medicine", "Director of Internal Medicine",
                    "MD (Internal Medicine), FACP", "18+ Years", 4.9, 310, "Room 101 (OPD Triage Main)",
                    "$45", "Mon - Sat (08:00 AM - 02:00 PM)", "Today, 09:15 AM",
                    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
                    "Comprehensive care for acute and lifestyle disorders including hypertension, diabetic management, infectious diseases, and preventive checkups.",
                    "DR6")
            );

            doctorRepository.saveAll(doctors);
            System.out.println(">>> Initialized 6 Specialist Doctors in H2 Database.");
        }
    }

    public void initializeStaffUsers() {
        if (patientRepository.findByPhone("+15550000000").isEmpty()) {
            com.hospital.queue.entity.Patient staff = new com.hospital.queue.entity.Patient("OPD Receptionist", "+15550000000", 32, "Staff");
            staff.setPasswordHash(passwordEncoder.encode("StaffPassword!2026"));
            staff.setRole("ROLE_STAFF");
            patientRepository.save(staff);
            System.out.println(">>> Initialized OPD Receptionist staff account (+1 555 000 0000).");
        }

        // Seed doctor staff accounts so doctors can log in to their cabin
        String[][] doctorAccounts = {
            {"Dr. Sarah Jenkins", "+15550000001", "Female"},
            {"Dr. Rajesh Sharma", "+15550000002", "Male"},
            {"Dr. Elena Rostova", "+15550000003", "Female"},
            {"Dr. Marcus Chen", "+15550000004", "Male"},
            {"Dr. Aisha Patel", "+15550000005", "Female"},
            {"Dr. David Miller", "+15550000006", "Male"}
        };

        for (String[] docInfo : doctorAccounts) {
            String phone = docInfo[1];
            if (patientRepository.findByPhone(phone).isEmpty()) {
                com.hospital.queue.entity.Patient docPatient = new com.hospital.queue.entity.Patient(docInfo[0], phone, 45, docInfo[2]);
                docPatient.setPasswordHash(passwordEncoder.encode("DoctorPassword!2026"));
                docPatient.setRole("ROLE_STAFF");
                patientRepository.save(docPatient);
            }
        }
    }

    public void initializeSampleAppointments() {
        if (appointmentRepository.count() == 0) {
            String today = LocalDate.now().toString();

            List<Appointment> initialList = List.of(
                createSample("APT-1001", "DR1-TK01", 1, "Robert Anderson", "+1 (555) 234-5678", 54, "Male",
                    "doc-1", "Dr. Sarah Jenkins", "Cardiology", today, "09:00 AM",
                    "Occasional chest tightness after climbing stairs, mild dizziness.", AppointmentStatus.COMPLETED,
                    "ECG reviewed; normal sinus rhythm. Prescribed Aspirin 75mg."),

                createSample("APT-1002", "DR3-TK01", 1, "Emily Watson", "+1 (555) 345-6789", 29, "Female",
                    "doc-3", "Dr. Elena Rostova", "Pediatrics", today, "09:30 AM",
                    "Accompanied child for 1-year MMR vaccination and growth check.", AppointmentStatus.COMPLETED,
                    "Vaccines administered smoothly. Child weight 9.8 kg, milestones age-appropriate."),

                createSample("APT-1003", "DR1-TK02", 2, "James Henderson", "+1 (555) 456-7890", 42, "Male",
                    "doc-1", "Dr. Sarah Jenkins", "Cardiology", today, "10:00 AM",
                    "High blood pressure readings recorded at home (150/95), mild throbbing headache.", AppointmentStatus.IN_CONSULTATION,
                    "Currently evaluating ambulatory BP profile. Blood drawn for lipid panel."),

                createSample("APT-1004", "DR2-TK01", 1, "Sophia Martinez", "+1 (555) 567-8901", 35, "Female",
                    "doc-2", "Dr. Rajesh Sharma", "Neurology", today, "10:30 AM",
                    "Chronic recurring migraine with visual aura lasting 3+ days.", AppointmentStatus.IN_CONSULTATION,
                    "Examining cranial nerves and photophobia sensitivity."),

                createSample("APT-1005", "DR4-TK01", 1, "Michael Chang", "+1 (555) 678-9012", 48, "Male",
                    "doc-4", "Dr. Marcus Chen", "Orthopedics", today, "11:00 AM",
                    "Persistent sharp pain in right knee after tennis match, slight swelling.", AppointmentStatus.WAITING,
                    ""),

                createSample("APT-1006", "DR5-TK01", 1, "Olivia Taylor", "+1 (555) 789-0123", 24, "Female",
                    "doc-5", "Dr. Aisha Patel", "Dermatology", today, "11:30 AM",
                    "Allergic contact rash on forearms and neck after using new detergent.", AppointmentStatus.WAITING,
                    ""),

                createSample("APT-1007", "DR6-TK01", 1, "David Wilson", "+1 (555) 890-1234", 62, "Male",
                    "doc-6", "Dr. David Miller", "General Medicine", today, "11:45 AM",
                    "Seasonal flu symptoms, dry cough for 4 days, low-grade fever.", AppointmentStatus.WAITING,
                    ""),

                createSample("APT-1008", "DR1-TK03", 3, "Grace Hopper", "+1 (555) 901-2345", 38, "Female",
                    "doc-1", "Dr. Sarah Jenkins", "Cardiology", today, "12:00 PM",
                    "Routine annual cardiac wellness checkup; family history of early heart disease.", AppointmentStatus.WAITING,
                    ""),

                createSample("APT-1009", "DR2-TK02", 2, "Alan Turing", "+1 (555) 912-3456", 41, "Male",
                    "doc-2", "Dr. Rajesh Sharma", "Neurology", today, "10:45 AM",
                    "Patient stepped away from OPD waiting lounge when called.", AppointmentStatus.SKIPPED,
                    "Patient absent when token called."),

                createSample("APT-1010", "DR4-TK02", 2, "Eleanor Roosevelt", "+1 (555) 923-4567", 58, "Female",
                    "doc-4", "Dr. Marcus Chen", "Orthopedics", today, "11:15 AM",
                    "Rescheduled to next week by patient request.", AppointmentStatus.CANCELLED,
                    "Cancelled due to patient personal scheduling conflict.")
            );

            appointmentRepository.saveAll(initialList);
            System.out.println(">>> Initialized 10 Sample OPD Appointments across 5 statuses in H2 Database.");
        }
    }

    private Appointment createSample(String id, String tokenNumber, int seq, String name, String phone,
                                     int age, String gender, String docId, String docName, String dept,
                                     String date, String slot, String symptoms, AppointmentStatus status, String notes) {
        Appointment apt = new Appointment(id, tokenNumber, seq, name, phone, age, gender,
                docId, docName, dept, date, slot, symptoms, status, "2026-10-09T08:30:00");
        apt.setNotes(notes);
        return apt;
    }
}
