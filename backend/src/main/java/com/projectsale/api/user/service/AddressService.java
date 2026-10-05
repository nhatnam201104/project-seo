package com.projectsale.api.user.service;

import com.projectsale.api.user.dto.AddressRequest;
import com.projectsale.api.user.dto.AddressResponse;
import com.projectsale.api.user.mapper.AddressMapper;
import com.projectsale.api.user.repository.AddressRepository;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.entity.Address;
import com.projectsale.entity.User;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Địa chỉ giao hàng của người dùng hiện tại. Mọi truy vấn đều lọc theo chủ sở hữu:
 * địa chỉ của người khác trả 404 như địa chỉ không tồn tại.
 */
@Service
@RequiredArgsConstructor
public class AddressService {

  private final AddressRepository addressRepository;
  private final UserRepository userRepository;
  private final AddressMapper mapper;

  @Transactional(readOnly = true)
  public List<AddressResponse> list(UUID userId) {
    return addressRepository.findByUserPublicIdOrderByIsDefaultDescIdAsc(userId).stream()
        .map(mapper::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public AddressResponse get(UUID userId, UUID addressId) {
    return mapper.toResponse(owned(userId, addressId));
  }

  @Transactional
  public AddressResponse create(UUID userId, AddressRequest request) {
    var user = lockUser(userId);
    var address = new Address();
    address.setUser(user);
    mapper.apply(request, address);
    // Địa chỉ đầu tiên luôn là mặc định.
    boolean makeDefault = request.isDefault() || addressRepository.countByUserPublicId(userId) == 0;
    if (makeDefault) {
      addressRepository.clearDefault(userId);
    }
    address.setDefault(makeDefault);
    return mapper.toResponse(addressRepository.save(address));
  }

  @Transactional
  public AddressResponse update(UUID userId, UUID addressId, AddressRequest request) {
    lockUser(userId);
    var address = owned(userId, addressId);
    mapper.apply(request, address);
    if (request.isDefault() && !address.isDefault()) {
      addressRepository.clearDefault(userId);
      address.setDefault(true);
    }
    // Bỏ tick "mặc định" trên địa chỉ đang mặc định thì giữ nguyên: luôn phải có một địa chỉ mặc định.
    return mapper.toResponse(addressRepository.save(address));
  }

  @Transactional
  public void delete(UUID userId, UUID addressId) {
    lockUser(userId);
    var address = owned(userId, addressId);
    boolean wasDefault = address.isDefault();
    addressRepository.delete(address);
    addressRepository.flush();
    if (wasDefault) {
      addressRepository.findFirstByUserPublicIdOrderByIdAsc(userId).ifPresent(next -> {
        next.setDefault(true);
        addressRepository.save(next);
      });
    }
  }

  @Transactional
  public void makeDefault(UUID userId, UUID addressId) {
    lockUser(userId);
    var address = owned(userId, addressId);
    if (address.isDefault()) {
      return;
    }
    addressRepository.clearDefault(userId);
    address.setDefault(true);
    addressRepository.save(address);
  }

  /**
   * Khoá dòng user trước khi đọc/ghi địa chỉ: tuần tự hoá create/update/delete/makeDefault của cùng một
   * người dùng để không bao giờ xuất hiện hai địa chỉ mặc định.
   */
  private User lockUser(UUID userId) {
    return userRepository.findByPublicIdForUpdate(userId)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
  }

  private Address owned(UUID userId, UUID addressId) {
    return addressRepository.findByPublicIdAndUserPublicId(addressId, userId)
        .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
  }
}
