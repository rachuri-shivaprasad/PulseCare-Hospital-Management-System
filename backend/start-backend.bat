@echo off
title Hospital Queue Backend (Spring Boot)
echo ========================================================
echo  STARTING HOSPITAL QUEUE SYSTEM - JAVA SPRING BOOT API
echo ========================================================
cd /d "%~dp0"

IF EXIST "C:\apache-maven\apache-maven-3.9.6\bin\mvn.cmd" (
    "C:\apache-maven\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
) ELSE (
    mvn spring-boot:run
)
pause
