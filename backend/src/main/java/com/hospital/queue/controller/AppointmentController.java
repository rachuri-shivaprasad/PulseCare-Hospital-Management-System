package com.hospital.queue.controller;

import com.hospital.queue.dto.AppointmentRequest;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAppointments(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(appointmentService.getAppointments(date, doctorId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable String id) {
        return appointmentService.getAppointmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            Authentication authentication) {
        Appointment created = appointmentService.createAppointment(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Appointment> startConsultation(@PathVariable String id) {
        return ResponseEntity.ok(appointmentService.startConsultation(id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Appointment> completeConsultation(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : "";
        return ResponseEntity.ok(appointmentService.completeConsultation(id, notes));
    }

    @PostMapping("/{id}/skip")
    public ResponseEntity<Appointment> skipAppointment(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "";
        return ResponseEntity.ok(appointmentService.skipAppointment(id, reason));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable String id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }
}
