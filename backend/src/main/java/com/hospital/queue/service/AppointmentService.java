package com.hospital.queue.service;

import com.hospital.queue.dto.AppointmentRequest;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.AppointmentStatus;
import com.hospital.queue.entity.Doctor;
import com.hospital.queue.entity.Patient;
import com.hospital.queue.repository.AppointmentRepository;
import com.hospital.queue.repository.DoctorRepository;
import com.hospital.queue.repository.PatientRepository;
import com.hospital.queue.security.PhoneNumbers;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {



    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository,
                              PatientRepository patientRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAppointments(String date, String doctorId, String status) {
        if (date != null && !date.isBlank()) {
            if (doctorId != null && !doctorId.isBlank()) {
                return appointmentRepository.findByDoctorIdAndDate(doctorId, date);
            }
            return appointmentRepository.findByDate(date);
        }
        if (doctorId != null && !doctorId.isBlank()) {
            return appointmentRepository.findByDoctorId(doctorId);
        }
        if (status != null && !status.isBlank()) {
            return appointmentRepository.findByStatus(AppointmentStatus.fromString(status));
        }
        return appointmentRepository.findAll();
    }

    public Optional<Appointment> getAppointmentById(String id) {
        return appointmentRepository.findById(id);
    }

    // Creates an appointment with strictly sequential token generation per doctor and date
    @Transactional
    public Appointment createAppointment(AppointmentRequest request) {
        return createAppointment(request, null);
    }

    @Transactional
    public Appointment createAppointment(AppointmentRequest request, Authentication authentication) {
        Doctor doctor = doctorRepository.findByIdForUpdate(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + request.getDoctorId()));

        String patientPhone = PhoneNumbers.normalize(request.getPatientPhone());
        Patient patient;
        if (authentication != null && authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_PATIENT"))) {
            // The logged-in account is the BOOKER. The appointment may be for a friend or family member,
            // so we preserve whatever the user entered in the form (name, phone, age, gender).
            // We still link the appointment to the logged-in account so it appears in their dashboard.
            patient = patientRepository.findByPhone(authentication.getName())
                    .orElseThrow(() -> new AccessDeniedException("Authenticated patient record was not found"));
            // Do NOT overwrite request fields – the form-entered details are the actual patient details.

            // Duplicate guard: same account cannot book the same slot twice
            if (appointmentRepository.existsByDoctorIdAndDateAndTimeSlotAndPatientIdAndStatusNot(
                    doctor.getId(), request.getDate(), request.getTimeSlot(),
                    AppointmentStatus.CANCELLED, patient.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "You already have a booking with this doctor for the selected date and time. " +
                        "Please cancel it first or choose a different slot.");
            }
        } else {
                var matchingPatients = patientRepository.findAll().stream()
                    .filter(existingPatient -> PhoneNumbers.normalize(existingPatient.getPhone()).equals(patientPhone))
                    .toList();
                if (matchingPatients.size() > 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This phone number matches multiple existing patient records. Contact the clinic.");
                }
                patient = matchingPatients.isEmpty() ? null : matchingPatients.get(0);
            if (patient != null && patient.getPasswordHash() != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Sign in before booking with this registered patient's phone number");
            }
            if (patient == null) {
                patient = patientRepository.save(new Patient(
                        request.getPatientName().trim(),
                        patientPhone,
                        request.getPatientAge(),
                        request.getPatientGender()
                ));
            }
            request.setPatientPhone(patient.getPhone());

            // Duplicate guard: same phone cannot book the same slot twice (anonymous path)
            if (appointmentRepository.existsByDoctorIdAndDateAndTimeSlotAndPatientPhoneAndStatusNot(
                    doctor.getId(), request.getDate(), request.getTimeSlot(),
                    AppointmentStatus.CANCELLED, patient.getPhone())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A booking for this phone number already exists for the selected slot. " +
                        "Please choose a different slot.");
            }
        }

        String date = request.getDate();
        // Sequential token calculation
        Integer maxSeq = appointmentRepository.findMaxTokenSequenceByDoctorAndDate(doctor.getId(), date);
        int nextSeq = (maxSeq != null ? maxSeq : 0) + 1;

        String doctorCode = (doctor.getDoctorCode() != null && !doctor.getDoctorCode().isBlank()) 
                ? doctor.getDoctorCode() 
                : "DR1";
        String tokenNumber = String.format("%s-TK%02d", doctorCode, nextSeq);

        String id = "APT-" + System.currentTimeMillis() % 100000;
        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        Appointment appointment = new Appointment(
                id,
                tokenNumber,
                nextSeq,
                request.getPatientName().trim(),
                request.getPatientPhone().trim(),
                request.getPatientAge(),
                request.getPatientGender(),
                doctor.getId(),
                doctor.getName(),
                doctor.getDepartment(),
                date,
                request.getTimeSlot(),
                request.getSymptoms(),
                AppointmentStatus.WAITING,
                nowStr
        );
        appointment.setPatient(patient);

        return appointmentRepository.save(appointment);
    }

    // Start Consultation
    @Transactional
    public Appointment startConsultation(String appointmentId) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));

        if (apt.getStatus() != AppointmentStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Only WAITING appointments can be moved to consultation (current status: " + apt.getStatus() + ")");
        }

        // Rule: Only ONE patient per doctor in consultation at a time
        Optional<Appointment> currentlyActive = appointmentRepository.findFirstByDoctorIdAndStatus(
                apt.getDoctorId(), AppointmentStatus.IN_CONSULTATION);
        if (currentlyActive.isPresent() && !currentlyActive.get().getId().equals(apt.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Doctor is currently consulting patient with token " + currentlyActive.get().getTokenNumber() + 
                    ". Please complete or skip active consultation first.");
        }

        apt.setStatus(AppointmentStatus.IN_CONSULTATION);
        apt.setCalledAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return appointmentRepository.save(apt);
    }

    // Complete Consultation
    @Transactional
    public Appointment completeConsultation(String appointmentId, String notes) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));

        if (apt.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled appointments cannot be completed");
        }
        if (apt.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed appointments cannot be reopened");
        }

        apt.setStatus(AppointmentStatus.COMPLETED);
        apt.setCompletedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        if (notes != null && !notes.isBlank()) {
            apt.setNotes(notes);
        } else if (apt.getNotes() == null || apt.getNotes().isBlank()) {
            apt.setNotes("Consultation successfully completed.");
        }

        return appointmentRepository.save(apt);
    }

    // Skip Appointment
    @Transactional
    public Appointment skipAppointment(String appointmentId, String reason) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));

        if (apt.getStatus() == AppointmentStatus.CANCELLED || apt.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only active or waiting appointments can be skipped");
        }

        apt.setStatus(AppointmentStatus.SKIPPED);
        apt.setSkippedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        apt.setNotes(reason != null && !reason.isBlank() ? reason : "Patient was absent when token was called.");

        return appointmentRepository.save(apt);
    }

    // Cancel Appointment
    @Transactional
    public Appointment cancelAppointment(String appointmentId) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));

        if (apt.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed appointments cannot be cancelled");
        }

        apt.setStatus(AppointmentStatus.CANCELLED);
        apt.setCancelledAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        return appointmentRepository.save(apt);
    }

    @Transactional
    public Appointment cancelPatientAppointment(String appointmentId, Long patientId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + appointmentId));
        if (appointment.getPatient() == null || !patientId.equals(appointment.getPatient().getId())) {
            throw new AccessDeniedException("You cannot cancel another patient's appointment");
        }
        if (appointment.getStatus() != AppointmentStatus.WAITING) {
            throw new IllegalArgumentException("Only waiting appointments can be cancelled by a patient");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return appointmentRepository.save(appointment);
    }
}
