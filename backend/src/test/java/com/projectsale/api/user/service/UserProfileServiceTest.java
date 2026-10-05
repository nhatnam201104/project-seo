package com.projectsale.api.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.projectsale.api.user.dto.UserRequest;
import com.projectsale.api.user.mapper.ProfileMapper;
import com.projectsale.api.user.mapper.ProfileMapperImpl;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.entity.User;
import com.projectsale.enums.Gender;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserProfileServiceTest {

  private UserRepository users;
  private PasswordEncoder encoder;
  private UserProfileService service;
  private User user;
  private final UUID userId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    users = mock(UserRepository.class);
    encoder = new BCryptPasswordEncoder(4);
    service = new UserProfileService(users, new ProfileMapperImpl(), encoder);
    user = new User();
    user.setPublicId(userId);
    user.setEmail("a@b.vn");
    user.setPhone("0912345678");
    user.setFullName("Old");
    user.setPasswordHash(encoder.encode("password1"));
    when(users.findByPublicId(userId)).thenReturn(Optional.of(user));
    when(users.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
  }

  @Test
  void updateTrimsNameAndStoresOptionalFields() {
    var result = service.update(userId, new UserRequest.UpdateProfile(
        "  Nguyễn An ", "0987654321", LocalDate.of(1995, 10, 24), Gender.FEMALE));

    assertThat(result.fullName()).isEqualTo("Nguyễn An");
    assertThat(result.phone()).isEqualTo("0987654321");
    assertThat(result.dateOfBirth()).isEqualTo(LocalDate.of(1995, 10, 24));
    assertThat(result.gender()).isEqualTo(Gender.FEMALE);
    assertThat(user.getUpdatedAt()).isNotNull();
  }

  @Test
  void updateClearsOptionalFieldsAndFallsBackToDefaultGender() {
    var result = service.update(userId, new UserRequest.UpdateProfile("An", null, null, null));

    assertThat(result.phone()).isNull();
    assertThat(result.dateOfBirth()).isNull();
    assertThat(result.gender()).isEqualTo(Gender.OTHER);
  }

  @Test
  void updateRejectsPhoneUsedByAnotherAccount() {
    when(users.existsByPhone("0987654321")).thenReturn(true);

    assertThatThrownBy(() -> service.update(userId, new UserRequest.UpdateProfile("An", "0987654321", null, null)))
        .isInstanceOfSatisfying(AppException.class,
            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.PHONE_ALREADY_EXIST));
    verify(users, never()).saveAndFlush(any());
  }

  @Test
  void updateMapsConcurrentDuplicatePhoneToPhoneAlreadyExist() {
    when(users.existsByPhone("0987654321")).thenReturn(false);
    when(users.saveAndFlush(any(User.class))).thenThrow(new DataIntegrityViolationException("uk_users_phone"));

    assertThatThrownBy(() -> service.update(userId, new UserRequest.UpdateProfile("An", "0987654321", null, null)))
        .isInstanceOfSatisfying(AppException.class,
            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.PHONE_ALREADY_EXIST));
  }

  @Test
  void updateKeepingOwnPhoneDoesNotCheckUniqueness() {
    service.update(userId, new UserRequest.UpdateProfile("An", "0912345678", null, null));

    verify(users, never()).existsByPhone(any());
  }

  @Test
  void changePasswordStoresNewHash() {
    service.changePassword(userId, new UserRequest.ChangePassword("password1", "newpassword2"));

    assertThat(encoder.matches("newpassword2", user.getPasswordHash())).isTrue();
    verify(users).save(user);
  }

  @Test
  void changePasswordRejectsWrongCurrentPassword() {
    assertThatThrownBy(() -> service.changePassword(userId, new UserRequest.ChangePassword("nope", "newpassword2")))
        .isInstanceOfSatisfying(AppException.class,
            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.INVALID_CURRENT_PASSWORD));
    verify(users, never()).save(any());
  }

  @Test
  void changePasswordRejectsGoogleAccountWithoutPassword() {
    user.setPasswordHash(null);

    assertThatThrownBy(() -> service.changePassword(userId, new UserRequest.ChangePassword("x", "newpassword2")))
        .isInstanceOfSatisfying(AppException.class,
            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.PASSWORD_NOT_SET));
  }

  @Test
  void unknownUserIsNotFound() {
    var other = UUID.randomUUID();
    when(users.findByPublicId(other)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.get(other)).isInstanceOf(AppException.class);
  }
}
