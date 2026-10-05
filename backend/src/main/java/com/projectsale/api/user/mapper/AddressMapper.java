package com.projectsale.api.user.mapper;

import com.projectsale.api.user.dto.AddressRequest;
import com.projectsale.api.user.dto.AddressResponse;
import com.projectsale.entity.Address;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

  public AddressResponse toResponse(Address address) {
    return new AddressResponse(
        address.getPublicId(),
        address.getReceiverName(),
        address.getReceiverPhone(),
        address.getLine(),
        address.getWard(),
        address.getDistrict(),
        address.getCity(),
        address.isDefault());
  }

  /** Chép các trường nhập liệu (không đụng tới user/publicId/cờ mặc định). */
  public void apply(AddressRequest request, Address address) {
    address.setReceiverName(request.receiverName().trim());
    address.setReceiverPhone(request.receiverPhone().trim());
    address.setLine(request.line().trim());
    address.setWard(request.ward().trim());
    address.setDistrict(request.district().trim());
    address.setCity(request.city().trim());
  }
}
