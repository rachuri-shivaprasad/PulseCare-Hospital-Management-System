package com.hospital.queue.dto;

import com.hospital.queue.entity.Appointment;

public class CallNextResponse {

    private boolean success;
    private String message;
    private Appointment patient;
    private String doctorId;
    private String doctorName;
    private String roomNumber;

    public CallNextResponse() {}

    public CallNextResponse(boolean success, String message, Appointment patient, 
                            String doctorId, String doctorName, String roomNumber) {
        this.success = success;
        this.message = message;
        this.patient = patient;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.roomNumber = roomNumber;
    }

    public static CallNextResponse success(Appointment patient, String doctorId, String doctorName, String roomNumber) {
        String msg = String.format("Calling Token %s - %s to %s's Cabin!", 
                patient.getTokenNumber(), patient.getPatientName(), doctorName);
        return new CallNextResponse(true, msg, patient, doctorId, doctorName, roomNumber);
    }

    public static CallNextResponse busy(String doctorName, String currentToken, String patientName) {
        String msg = String.format("Dr. %s is currently consulting Token %s (%s). Please complete the active consultation before calling next.",
                doctorName, currentToken, patientName);
        return new CallNextResponse(false, msg, null, null, doctorName, null);
    }

    public static CallNextResponse empty(String message) {
        return new CallNextResponse(false, message, null, null, null, null);
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Appointment getPatient() { return patient; }
    public void setPatient(Appointment patient) { this.patient = patient; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
}
