package com.projectsale.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.projectsale.api.auth.service.GoogleAccountProvisioner.GoogleProfile;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.entity.User;
import com.projectsale.enums.AuthProvider;
import com.projectsale.enums.StatusEnum;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

class GoogleAccountProvisionerTest {

  private static final String SUB = "109876543210987654321";
  private static final String EMAIL = "member@gmail.com";

  private UserRepository userRepository;
  private GoogleAccountProvisioner provisioner;

  @BeforeEach
  void setUp() {
    userRepository = mock(UserRepository.class);
    when(userRepository.findByProviderAndProviderId(any(), any())).thenReturn(Optional.empty());
    when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
    when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    provisioner = new GoogleAccountProvisioner(userRepository);
  }

  @Test
  void registersActiveGoogleUserWithoutPasswordWhenEmailIsUnknown() {
    User user = provisioner.provision(profile(true, "Nguyen Van A"));

    assertThat(user.getEmail()).isEqualTo(EMAIL);
    assertThat(user.getProvider()).isEqualTo(AuthProvider.GOOGLE);
    assertThat(user.getProviderId()).isEqualTo(SUB);
    assertThat(user.getStatus()).isEqualTo(StatusEnum.ACTIVE);
    assertThat(user.getFullName()).isEqualTo("Nguyen Van A");
    assertThat(user.getPasswordHash()).isNull();
    verify(userRepository).save(user);
  }

  @Test
  void returnsUserAlreadyLinkedBySubjectWithoutOverwritingTheirName() {
    User linked = user(StatusEnum.ACTIVE, AuthProvider.GOOGLE, SUB, "Tên tự đặt");
    when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, SUB))
        .thenReturn(Optional.of(linked));

    User user = provisioner.provision(profile(true, "Google Name"));

    assertThat(user).isSameAs(linked);
    assertThat(user.getFullName()).isEqualTo("Tên tự đặt");
    verify(userRepository, never()).findByEmail(any());
  }

  @Test
  void linksVerifiedLocalAccountAndKeepsItsPassword() {
    User local = user(StatusEnum.ACTIVE, AuthProvider.LOCAL, null, null);
    local.setPasswordHash("bcrypt-hash");
    when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(local));

    User user = provisioner.provision(profile(true, "Google Name"));

    assertThat(user).isSameAs(local);
    assertThat(user.getProvider()).isEqualTo(AuthProvider.GOOGLE);
    assertThat(user.getProviderId()).isEqualTo(SUB);
    assertThat(user.getPasswordHash()).isEqualTo("bcrypt-hash");
    assertThat(user.getFullName()).isEqualTo("Google Name");
  }

  @Test
  void pendingLocalAccountIsActivatedAndLosesThePasswordNobodyProvedOwnershipOf() {
    User pending = user(StatusEnum.PENDING, AuthProvider.LOCAL, null, "Attacker");
    pending.setPasswordHash("attacker-chosen-hash");
    when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(pending));

    User user = provisioner.provision(profile(true, "Owner"));

    assertThat(user.getStatus()).isEqualTo(StatusEnum.ACTIVE);
    assertThat(user.getPasswordHash()).isNull();
    assertThat(user.getProviderId()).isEqualTo(SUB);
  }

  @Test
  void disabledAccountFoundByEmailIsRejectedAndNotLinked() {
    User disabled = user(StatusEnum.UNACTIVE, AuthProvider.LOCAL, null, null);
    when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(disabled));

    assertOAuthError(() -> provisioner.provision(profile(true, null)),
        GoogleAccountProvisioner.ACCOUNT_DISABLED);

    assertThat(disabled.getProviderId()).isNull();
    verify(userRepository, never()).save(any());
  }

  @Test
  void disabledAccountFoundBySubjectIsRejected() {
    User disabled = user(StatusEnum.UNACTIVE, AuthProvider.GOOGLE, SUB, null);
    when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, SUB))
        .thenReturn(Optional.of(disabled));

    assertOAuthError(() -> provisioner.provision(profile(true, null)),
        GoogleAccountProvisioner.ACCOUNT_DISABLED);
  }

  @Test
  void unverifiedGoogleEmailIsRejectedBeforeAnyLookup() {
    assertOAuthError(() -> provisioner.provision(profile(false, null)),
        GoogleAccountProvisioner.EMAIL_NOT_VERIFIED);

    verify(userRepository, never()).findByEmail(any());
    verify(userRepository, never()).save(any());
  }

  @Test
  void emailAlreadyLinkedToAnotherGoogleSubjectIsRejected() {
    User other = user(StatusEnum.ACTIVE, AuthProvider.GOOGLE, "another-subject", null);
    when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(other));

    assertOAuthError(() -> provisioner.provision(profile(true, null)),
        GoogleAccountProvisioner.ACCOUNT_CONFLICT);

    assertThat(other.getProviderId()).isEqualTo("another-subject");
    verify(userRepository, never()).save(any());
  }

  @Test
  void overlongGoogleNameIsTruncatedToTheColumnLength() {
    User user = provisioner.provision(profile(true, "x".repeat(200)));

    assertThat(user.getFullName()).hasSize(120);
  }

  private static GoogleProfile profile(boolean emailVerified, String fullName) {
    return new GoogleProfile(SUB, EMAIL, emailVerified, fullName);
  }

  private static User user(StatusEnum status, AuthProvider provider, String providerId,
      String fullName) {
    User user = new User();
    user.setEmail(EMAIL);
    user.setStatus(status);
    user.setProvider(provider);
    user.setProviderId(providerId);
    user.setFullName(fullName);
    return user;
  }

  private static void assertOAuthError(
      org.assertj.core.api.ThrowableAssert.ThrowingCallable call, String errorCode) {
    assertThatThrownBy(call).isInstanceOfSatisfying(OAuth2AuthenticationException.class,
        exception -> assertThat(exception.getError().getErrorCode()).isEqualTo(errorCode));
  }
}
