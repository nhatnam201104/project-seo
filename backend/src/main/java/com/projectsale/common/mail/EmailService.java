package com.projectsale.common.mail;

public interface EmailService {
  void sendVerificationEmail(String recipient, String verificationUrl);
}
