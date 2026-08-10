package com.projectsale.common.mail;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
class SmtpEmailServiceTest {

  @Mock private JavaMailSender mailSender;
  private SmtpEmailService emailService;

  @Test
  void sendsAnHtmlVerificationEmail() {
    var message = new MimeMessage(Session.getInstance(new Properties()));
    when(mailSender.createMimeMessage()).thenReturn(message);
    emailService = new SmtpEmailService(mailSender, new MailProperties("noreply@example.com"));

    emailService.sendVerificationEmail("buyer@example.com", "https://web.example/verify?token=abc");

    verify(mailSender).send(any(MimeMessage.class));
  }
}
