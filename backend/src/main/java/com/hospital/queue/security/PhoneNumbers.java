package com.hospital.queue.security;

public final class PhoneNumbers {

    private PhoneNumbers() {}

    public static String normalize(String phone) {
        if (phone == null) throw new IllegalArgumentException("Phone number is required");
        String normalized = phone.trim().replaceAll("[^0-9+]", "");
        if (normalized.startsWith("00")) {
            normalized = "+" + normalized.substring(2);
        }
        if (!normalized.matches("\\+?[0-9]{7,15}")) {
            throw new IllegalArgumentException("Enter a valid phone number");
        }
        return normalized;
    }
}