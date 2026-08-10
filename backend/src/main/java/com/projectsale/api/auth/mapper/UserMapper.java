package com.projectsale.api.auth.mapper;

import com.projectsale.api.auth.dto.AuthRequest.RegisterRequest;
import com.projectsale.api.auth.dto.AuthResponse.UserResponse;
import com.projectsale.entity.User;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface UserMapper {

  @Mapping(target = "id", source = "publicId")
  UserResponse toResponse(User user);

  @BeanMapping(ignoreByDefault = true)
  @Mapping(target = "email", source = "email")
  @Mapping(target = "fullName", source = "fullName")
  @Mapping(target = "phone", source = "phone")
  User toUserEntity(RegisterRequest request);
}
