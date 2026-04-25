package com.internship.backend.scheduler;

import com.internship.backend.entity.RiskRecord;
import com.internship.backend.repository.RiskRecordRepository;
import com.internship.backend.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scheduled jobs that run automatically in the background.
 *
 * - Every day at 8 AM  → remind about high-risk open items
 * - Every Monday 9 AM  → send weekly summary email
 *
 * Enable scheduling by adding @EnableScheduling to BackendApplication.java
 */
@Component
public class ReminderScheduler {

    private final RiskRecordRepository repository;
    private final EmailService          emailService;

    public ReminderScheduler(RiskRecordRepository repository,
                             EmailService emailService) {
        this.repository   = repository;
        this.emailService = emailService;
    }

    /**
     * Daily at 08:00 — find all OPEN risks with score >= 70 and send reminder.
     * cron = "second minute hour day month weekday"
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyHighRiskReminder() {
        List<RiskRecord> highRisks = repository.findHighScoreOpenRisks();

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

    /**
     * Every Monday at 09:00 — log a weekly summary (extend to send email if needed).
     */
    @Scheduled(cron = "0 0 9 * * MON")
    public void sendWeeklySummary() {
        long total      = repository.countByDeletedFalse();
        long openCount  = repository.countByStatusAndDeletedFalse("OPEN");
        long highRisk   = repository.findHighScoreOpenRisks().size();

        System.out.printf(
            "[Scheduler] Weekly Summary — Total: %d | Open: %d | High-Risk: %d%n",
            total, openCount, highRisk);

        // TODO: call emailService.sendWeeklySummaryEmail(...) when template is ready
    }
}
