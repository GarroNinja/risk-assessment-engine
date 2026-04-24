package com.internship.backend.service;

import com.internship.backend.entity.RiskRecord;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendCreateNotification(RiskRecord riskRecord) throws MessagingException {

        Context context = new Context();
        context.setVariable("title", riskRecord.getTitle());
        context.setVariable("category", riskRecord.getCategory());
        context.setVariable("status", riskRecord.getStatus());

        String html = templateEngine.process("risk-created", context);

        sendHtmlMail("test@gmail.com", "Risk Record Created", html);
    }

    public void sendOverdueNotification(RiskRecord riskRecord) throws MessagingException {

        Context context = new Context();
        context.setVariable("title", riskRecord.getTitle());
        context.setVariable("status", riskRecord.getStatus());

        String html = templateEngine.process("risk-overdue", context);

        sendHtmlMail("test@gmail.com", "Risk Record Overdue", html);
    }

    private void sendHtmlMail(String to, String subject, String html)
            throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(message, true);

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);

        mailSender.send(message);
    }
}