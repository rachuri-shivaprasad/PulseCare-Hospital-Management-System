package com.hospital.queue.service;

import com.hospital.queue.dto.CallNextResponse;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.AppointmentStatus;
import com.hospital.queue.entity.Doctor;
import com.hospital.queue.repository.AppointmentRepository;
import com.hospital.queue.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class QueueService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    public QueueService(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    // Get waiting patients for a doctor and date (ordered sequentially)
    public List<Appointment> getDoctorWaitingQueue(String doctorId, String date) {
        if (date != null && !date.isBlank()) {
            return appointmentRepository.findByDoctorIdAndDateAndStatusOrderByTokenSequenceAsc(
                    doctorId, date, AppointmentStatus.WAITING);
        }
        return appointmentRepository.findByDoctorIdAndStatus(doctorId, AppointmentStatus.WAITING)
                .stream()
                .sorted((a, b) -> Integer.compare(a.getTokenSequence(), b.getTokenSequence()))
                .collect(Collectors.toList());
    }

    // Get the patient currently in consultation for a doctor
    public Optional<Appointment> getCurrentlyConsulting(String doctorId) {
        return appointmentRepository.findFirstByDoctorIdAndStatus(doctorId, AppointmentStatus.IN_CONSULTATION);
    }

    // Call Next Patient (Strict Queue Rule: Only ONE patient per doctor in consultation at a time)
    @Transactional
    public CallNextResponse callNextPatient(String doctorId) {
        if (doctorId != null && !doctorId.isBlank()) {
            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + doctorId));

            // Rule check: Is doctor already occupied?
            Optional<Appointment> currentlyActive = appointmentRepository.findFirstByDoctorIdAndStatus(
                    doctorId, AppointmentStatus.IN_CONSULTATION);

            if (currentlyActive.isPresent()) {
                Appointment active = currentlyActive.get();
                return CallNextResponse.busy(doctor.getName(), active.getTokenNumber(), active.getPatientName());
            }

            // Find next waiting patient ordered by token sequence
            Optional<Appointment> nextWaiting = appointmentRepository
                    .findFirstByDoctorIdAndStatusOrderByTokenSequenceAsc(doctorId, AppointmentStatus.WAITING);

            if (nextWaiting.isEmpty()) {
                return CallNextResponse.empty("Queue is empty. No patients currently waiting for Dr. " + doctor.getName());
            }

            Appointment patient = nextWaiting.get();
            patient.setStatus(AppointmentStatus.IN_CONSULTATION);
            patient.setCalledAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            appointmentRepository.save(patient);

            return CallNextResponse.success(patient, doctor.getId(), doctor.getName(), doctor.getRoomNumber());
        }

        // Generic Call Next across all free doctors
        List<Appointment> allActive = appointmentRepository.findByStatus(AppointmentStatus.IN_CONSULTATION);
        Set<String> busyDoctorIds = allActive.stream().map(Appointment::getDoctorId).collect(Collectors.toSet());

        List<Appointment> allWaiting = appointmentRepository.findByStatus(AppointmentStatus.WAITING)
                .stream()
                .sorted((a, b) -> Integer.compare(a.getTokenSequence(), b.getTokenSequence()))
                .collect(Collectors.toList());

        for (Appointment candidate : allWaiting) {
            if (!busyDoctorIds.contains(candidate.getDoctorId())) {
                Doctor doctor = doctorRepository.findById(candidate.getDoctorId()).orElse(null);
                candidate.setStatus(AppointmentStatus.IN_CONSULTATION);
                candidate.setCalledAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                appointmentRepository.save(candidate);

                String docName = doctor != null ? doctor.getName() : candidate.getDoctorName();
                String room = doctor != null ? doctor.getRoomNumber() : "OPD Cabin";
                return CallNextResponse.success(candidate, candidate.getDoctorId(), docName, room);
            }
        }

        if (allWaiting.isEmpty()) {
            return CallNextResponse.empty("OPD Lobby is empty! No patients currently waiting in queue.");
        }

        return CallNextResponse.empty("All doctors with waiting patients are currently in consultation. Please complete active sessions first.");
    }
}
