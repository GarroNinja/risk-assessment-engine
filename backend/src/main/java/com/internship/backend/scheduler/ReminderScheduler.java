package com.internship.backend.scheduler;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.repository.RiskRecordRepository;
import com.internship.backend.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReminderScheduler {

    private final RiskRecordRepository repository;
    private final EmailService emailService;

    public ReminderScheduler(RiskRecordRepository repository,
                             EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyHighRiskReminder() {
        List<RiskRecord> highRisks = repository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .filter(r -> "OPEN".equals(r.getStatus()) && 
                             r.getRiskScore() != null && 
                             r.getRiskScore() >= 70)
                .toList();

        if (highRisks.isEmpty()) {
            System.out.println("[Scheduler] No high-risk open items today.");
            return;
        }

        System.out.printf("[Scheduler] Sending reminders for %d high-risk items.%n",
                highRisks.size());

        for (RiskRecord risk : highRisks) {
            try {
                emailService.sendOverdueNotification(risk);
            } catch (Exception e) {
                System.out.println("[Scheduler] Email failed for risk id=" + risk.getId());
            }
        }
    }

    @Scheduled(cron = "0 0 9 * * MON")
    public void sendWeeklySummary() {
        long total = repository.findByDeletedFalseOrderByCreatedAtDesc().size();
        long openCount = repository.findByStatusAndDeletedFalse("OPEN").size();

        System.out.printf(
            "[Scheduler] Weekly Summary — Total: %d | Open: %d%n",
            total, openCount);
    }
}