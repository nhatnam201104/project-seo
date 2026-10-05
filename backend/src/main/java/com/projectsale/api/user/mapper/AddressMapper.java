package com.projectsale.api.user.mapper;

import com.projectsale.api.user.dto.UserRequest.SaveAddress;
import com.projectsale.api.user.dto.UserResponse;
import com.projectsale.entity.Address;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface AddressMapper {

  @Mapping(target = "id", source = "publicId")
  @Mapping(target = "isDefault", source = "default")
  UserResponse.Address toResponse(Address address);

  /** Chép các trường nhập liệu (không đụng tới user/publicId/cờ mặc định). */
  @BeanMapping(ignoreByDefault = true)
  @Mapping(target = "receiverName", source = "receiverName", qualifiedByName = "trim")
  @Mapping(target = "receiverPhone", source = "receiverPhone", qualifiedByName = "trim")
  @Mapping(target = "line", source = "line", qualifiedByName = "trim")
  @Mapping(target = "ward", source = "ward", qualifiedByName = "trim")
  @Mapping(target = "district", source = "district", qualifiedByName = "trim")
  @Mapping(target = "city", source = "city", qualifiedByName = "trim")
  void apply(SaveAddress request, @MappingTarget Address address);

  @Named("trim")
  default String trim(String value) {
    return value == null ? null : value.trim();
  }
}
