package com.projectsale.common.validate.phone;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectsale.api.user.controller.UserController;
import com.projectsale.api.user.dto.UserRequest;
import com.projectsale.common.rateLimit.RateLimit;
import com.projectsale.common.rateLimit.RateLimit.KeyType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class PhoneValidatorTest {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  private boolean profilePhoneValid(String phone) {
    return validator.validate(new UserRequest.UpdateProfile("An", phone, null, null)).stream()
        .noneMatch(v -> v.getPropertyPath().toString().equals("phone"));
  }

  private boolean addressPhoneValid(String phone) {
    return validator.validate(new UserRequest.SaveAddress("An", phone, "l", "w", "d", "c", false)).stream()
        .noneMatch(v -> v.getPropertyPath().toString().equals("receiverPhone"));
  }

  @Test
  void nullablePhoneAcceptsNullButStillRejectsBlankAndMalformed() {
    assertThat(profilePhoneValid(null)).isTrue();
    assertThat(profilePhoneValid("0912345678")).isTrue();
    assertThat(profilePhoneValid("+84912345678")).isTrue();
    assertThat(profilePhoneValid("")).isFalse();
    assertThat(profilePhoneValid("123")).isFalse();
  }

  @Test
  void requiredPhoneRejectsNull() {
    assertThat(addressPhoneValid(null)).isFalse();
    assertThat(addressPhoneValid("0912345678")).isTrue();
    assertThat(addressPhoneValid("0123456789")).isFalse();
  }

  @Test
  void changePasswordIsRateLimitedByIp() throws Exception {
    var method = UserController.class.getMethod("changePassword", java.util.UUID.class, UserRequest.ChangePassword.class);
    var rules = method.getAnnotationsByType(RateLimit.class);

    assertThat(rules).hasSize(1);
    assertThat(rules[0].keyType()).isEqualTo(KeyType.IP_ADDRESS);
  }
}
