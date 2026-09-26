package com.projectsale.common.mail;

import org.springframework.scheduling.annotation.Async;

public interface EmailService {
  @Async("emailExecutor")
  void sendVerificationEmail(String recipient, String otp);
}
