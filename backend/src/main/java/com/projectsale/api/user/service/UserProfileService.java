package com.projectsale.api.user.service;

import com.projectsale.api.user.dto.UserRequest;
import com.projectsale.api.user.dto.UserResponse;
import com.projectsale.api.user.mapper.ProfileMapper;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.entity.User;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

  private final UserRepository userRepository;
  private final ProfileMapper mapper;
  private final PasswordEncoder passwordEncoder;

  @Transactional(readOnly = true)
  public UserResponse.Profile get(UUID userId) {
    return mapper.toResponse(find(userId));
  }

  @Transactional
  public UserResponse.Profile update(UUID userId, UserRequest.UpdateProfile request) {
    User user = find(userId);
    String phone = request.phone() == null || request.phone().isBlank() ? null : request.phone().trim();
    if (phone != null && !phone.equals(user.getPhone()) && userRepository.existsByPhone(phone)) {
      throw new AppException(ErrorCode.PHONE_ALREADY_EXIST);
    }
    user.setFullName(request.fullName().trim());
    user.setPhone(phone);
    user.setDateOfBirth(request.dateOfBirth());
    user.setGender(request.gender());
    user.setUpdatedAt(Instant.now());
    try {
      return mapper.toResponse(userRepository.saveAndFlush(user));
    } catch (DataIntegrityViolationException e) {
      // Race: số điện thoại vừa bị tài khoản khác chiếm giữa existsByPhone và flush (uk_users_phone).
      throw new AppException(ErrorCode.PHONE_ALREADY_EXIST);
    }
  }

  // TODO: thu hồi các phiên khác sau khi đổi mật khẩu (cần biết session hiện tại để không đăng xuất chính mình).
  @Transactional
  public void changePassword(UUID userId, UserRequest.ChangePassword request) {
    User user = find(userId);
    if (user.getPasswordHash() == null) {
      throw new AppException(ErrorCode.PASSWORD_NOT_SET);
    }
    if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
      throw new AppException(ErrorCode.INVALID_CURRENT_PASSWORD);
    }
    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    user.setUpdatedAt(Instant.now());
    userRepository.save(user);
  }

  private User find(UUID userId) {
    return userRepository.findByPublicId(userId)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
  }
}
