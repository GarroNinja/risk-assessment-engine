package com.internship.backend.service;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.repository.RiskRecordRepository;
import jakarta.mail.MessagingException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OverdueNotificationService {

    private final RiskRecordRepository repository;
    private final EmailService emailService;

    public OverdueNotificationService(RiskRecordRepository repository,
                                      EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 9 * * *")
    public void sendOverdueNotifications() {

        List<RiskRecord> overdueRecords =
                repository.findByStatus("OVERDUE");

        for (RiskRecord record : overdueRecords) {
            try {
                emailService.sendOverdueNotification(record);
            } catch (MessagingException e) {
                e.printStackTrace();
            }
        }
    }
}