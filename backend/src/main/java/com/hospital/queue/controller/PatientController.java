package com.hospital.queue.controller;

import com.hospital.queue.entity.Appointment;
import com.hospital.queue.security.PatientPrincipal;
import com.hospital.queue.service.AppointmentService;
import com.hospital.queue.repository.PatientAppointmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/patient/appointments")
public class PatientController {

    private final PatientAppointmentRepository patientAppointmentRepository;
    private final AppointmentService appointmentService;

    public PatientController(PatientAppointmentRepository patientAppointmentRepository,
                             AppointmentService appointmentService) {
        this.patientAppointmentRepository = patientAppointmentRepository;
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<Appointment> getMyAppointments(@AuthenticationPrincipal PatientPrincipal principal) {
        return patientAppointmentRepository.findByPatient_IdOrderByDateDescTokenSequenceAsc(
                principal.getPatientId());
    }

    @PostMapping("/{appointmentId}/cancel")
    public ResponseEntity<Appointment> cancelMyAppointment(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal PatientPrincipal principal) {
        return ResponseEntity.ok(appointmentService.cancelPatientAppointment(
                appointmentId, principal.getPatientId()));
    }
}