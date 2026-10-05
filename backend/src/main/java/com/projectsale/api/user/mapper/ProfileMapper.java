package com.projectsale.api.user.mapper;

import com.projectsale.api.user.dto.ProfileResponse;
import com.projectsale.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

  public ProfileResponse toResponse(User user) {
    return new ProfileResponse(
        user.getPublicId(),
        user.getEmail(),
        user.getFullName(),
        user.getPhone(),
        user.getDateOfBirth(),
        user.getGender(),
        user.getAvatarUrl());
  }
}
