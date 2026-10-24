package com.hospital.queue.controller;

import com.hospital.queue.dto.CallNextResponse;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.service.QueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getDoctorWaitingQueue(
            @PathVariable String doctorId,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(queueService.getDoctorWaitingQueue(doctorId, date));
    }

    @GetMapping("/doctor/{doctorId}/current")
    public ResponseEntity<Appointment> getCurrentlyConsulting(@PathVariable String doctorId) {
        return queueService.getCurrentlyConsulting(doctorId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/call-next")
    public ResponseEntity<CallNextResponse> callNextPatient(@RequestBody(required = false) Map<String, String> body) {
        String doctorId = body != null ? body.get("doctorId") : null;
        CallNextResponse response = queueService.callNextPatient(doctorId);
        return ResponseEntity.ok(response);
    }
}
