package com.projectsale.common.mail;

import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SmtpEmailService implements EmailService {
  private final JavaMailSender mailSender;
  private final MailProperties properties;

  @Override
  public void sendVerificationEmail(String recipient, String verificationUrl) {
    var message = mailSender.createMimeMessage();
    try {
      var helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
      helper.setFrom(properties.from());
      helper.setTo(recipient);
      helper.setSubject("Xác thực địa chỉ email");
      helper.setText(
          "<p>Cảm ơn bạn đã đăng ký.</p>"
              + "<p>Nhấn vào liên kết sau để xác thực email: "
              + "<a href=\""
              + verificationUrl
              + "\">Xác thực email</a>.</p>",
          true);
      mailSender.send(message);
    } catch (jakarta.mail.MessagingException exception) {
      throw new IllegalStateException("Unable to prepare verification email", exception);
    }
  }
}
