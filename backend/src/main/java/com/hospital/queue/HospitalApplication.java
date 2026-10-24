package com.hospital.queue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HospitalApplication {

    public static void main(String[] args) {
        SpringApplication.run(HospitalApplication.class, args);
        System.out.println("==========================================================");
        System.out.println(" HOSPITAL APPOINTMENT & QUEUE SYSTEM - BACKEND READY!     ");
        System.out.println(" REST API Base URL:  http://localhost:8080/api           ");
        System.out.println(" H2 Database Web UI: http://localhost:8080/h2-console    ");
        System.out.println("==========================================================");
    }
}
