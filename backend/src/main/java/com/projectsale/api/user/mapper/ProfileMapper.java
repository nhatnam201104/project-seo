package com.projectsale.api.user.mapper;

import com.projectsale.api.user.dto.UserResponse.Profile;
import com.projectsale.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ProfileMapper {

  @Mapping(target = "id", source = "publicId")
  Profile toResponse(User user);
}
