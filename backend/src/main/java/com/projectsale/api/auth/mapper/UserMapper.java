package com.projectsale.api.auth.mapper;

import com.projectsale.api.auth.dto.AuthDtos.UserResponse;
import com.projectsale.api.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface UserMapper {

  @Mapping(target = "id", source = "publicId")
  UserResponse toResponse(User user);
}
