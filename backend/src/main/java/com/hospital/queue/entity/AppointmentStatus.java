package com.hospital.queue.entity;

public enum AppointmentStatus {
    WAITING("Waiting"),
    IN_CONSULTATION("In Consultation"),
    COMPLETED("Completed"),
    SKIPPED("Skipped"),
    CANCELLED("Cancelled");

    private final String displayName;

    AppointmentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static AppointmentStatus fromString(String statusStr) {
        if (statusStr == null) return WAITING;
        for (AppointmentStatus status : AppointmentStatus.values()) {
            if (status.name().equalsIgnoreCase(statusStr.replace(" ", "_")) ||
                status.displayName.equalsIgnoreCase(statusStr)) {
                return status;
            }
        }
        return WAITING;
    }
}
