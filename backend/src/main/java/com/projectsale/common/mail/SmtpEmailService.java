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
  public void sendVerificationEmail(String recipient, String otp) {
    var message = mailSender.createMimeMessage();
    try {
      var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
      helper.setFrom(properties.from());
      helper.setTo(recipient);
      helper.setSubject("Mã xác thực email của bạn");
      helper.setText(renderOtpText(otp), renderOtpHtml(otp));
      mailSender.send(message);
    } catch (jakarta.mail.MessagingException exception) {
      throw new IllegalStateException("Unable to prepare verification email", exception);
    }
  }

  static String renderOtpText(String otp) {
    return "Mã xác thực ProjectSale của bạn là: "
        + otp
        + "\n\nKhông chia sẻ mã này với bất kỳ ai.";
  }

  static String renderOtpHtml(String otp) {
    return """
        <!doctype html>
        <html lang="vi">
          <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f7fb;">
              <tr><td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
                  <tr><td style="background-color:#2563eb;padding:28px 40px;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">ProjectSale</td>
                      <td align="right" style="color:#bfdbfe;font-size:13px;">Xác thực tài khoản</td>
                    </tr></table>
                  </td></tr>
                  <tr><td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#475569;">Chào bạn,</p>
                    <h1 style="margin:0 0 16px;font-size:26px;line-height:34px;color:#172033;">Xác thực địa chỉ email</h1>
                    <p style="margin:0 0 28px;font-size:16px;line-height:25px;color:#475569;">Dùng mã bên dưới để hoàn tất đăng ký tài khoản ProjectSale.</p>
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;"><tr>
                      <td align="center" style="padding:22px 16px;color:#1d4ed8;font-size:32px;font-weight:700;letter-spacing:8px;line-height:40px;">%s</td>
                    </tr></table>
                    <p style="margin:24px 0 0;font-size:14px;line-height:22px;color:#64748b;">Vì an toàn tài khoản, không chia sẻ mã này với bất kỳ ai.</p>
                  </td></tr>
                  <tr><td style="border-top:1px solid #e2e8f0;padding:22px 40px;color:#94a3b8;font-size:12px;line-height:18px;">Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email.</td></tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>
        """.formatted(otp);
  }
}
