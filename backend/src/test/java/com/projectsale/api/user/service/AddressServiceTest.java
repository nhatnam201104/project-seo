package com.projectsale.api.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.projectsale.api.user.dto.AddressRequest;
import com.projectsale.api.user.mapper.AddressMapper;
import com.projectsale.api.user.repository.AddressRepository;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.entity.Address;
import com.projectsale.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AddressServiceTest {

  private AddressRepository addresses;
  private UserRepository users;
  private AddressService service;
  private final UUID userId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    addresses = mock(AddressRepository.class);
    users = mock(UserRepository.class);
    service = new AddressService(addresses, users, new AddressMapper());
    when(addresses.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));
    when(users.findByPublicIdForUpdate(userId)).thenReturn(Optional.of(new User()));
  }

  private static AddressRequest request(boolean isDefault) {
    return new AddressRequest("An", "0912345678", " 12 Nguyễn Huệ ", "Bến Nghé", "Quận 1", "Hồ Chí Minh", isDefault);
  }

  private Address address(boolean isDefault) {
    var a = new Address();
    a.setPublicId(UUID.randomUUID());
    a.setUser(new User());
    a.setReceiverName("Old");
    a.setReceiverPhone("0900000000");
    a.setLine("x");
    a.setCity("y");
    a.setDefault(isDefault);
    return a;
  }

  @Test
  void firstAddressBecomesDefaultEvenWhenNotRequested() {
    when(addresses.countByUserPublicId(userId)).thenReturn(0L);

    var created = service.create(userId, request(false));

    assertThat(created.isDefault()).isTrue();
    assertThat(created.line()).isEqualTo("12 Nguyễn Huệ");
    verify(addresses).clearDefault(userId);
  }

  @Test
  void laterAddressKeepsExistingDefaultUnlessRequested() {
    when(addresses.countByUserPublicId(userId)).thenReturn(2L);

    var created = service.create(userId, request(false));

    assertThat(created.isDefault()).isFalse();
    verify(addresses, never()).clearDefault(any());
  }

  @Test
  void requestedDefaultClearsPreviousDefault() {
    when(addresses.countByUserPublicId(userId)).thenReturn(2L);

    var created = service.create(userId, request(true));

    assertThat(created.isDefault()).isTrue();
    verify(addresses).clearDefault(userId);
  }

  @Test
  void writesLockUserRowBeforeTouchingAddresses() {
    var existing = address(false);
    when(addresses.findByPublicIdAndUserPublicId(existing.getPublicId(), userId)).thenReturn(Optional.of(existing));
    when(addresses.countByUserPublicId(userId)).thenReturn(1L);

    service.create(userId, request(false));
    service.update(userId, existing.getPublicId(), request(false));
    service.makeDefault(userId, existing.getPublicId());
    service.delete(userId, existing.getPublicId());

    var order = inOrder(users, addresses);
    order.verify(users).findByPublicIdForUpdate(userId);
    order.verify(addresses).countByUserPublicId(userId);
    verify(users, times(4)).findByPublicIdForUpdate(userId);
  }

  @Test
  void writeForUnknownUserIsUserNotFound() {
    when(users.findByPublicIdForUpdate(userId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.create(userId, request(false)))
        .isInstanceOfSatisfying(AppException.class,
            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND));
  }

  @Test
  void otherUsersAddressIsNotFound() {
    var id = UUID.randomUUID();
    when(addresses.findByPublicIdAndUserPublicId(id, userId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.get(userId, id))
        .isInstanceOfSatisfying(AppException.class,
            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.ADDRESS_NOT_FOUND));
    assertThatThrownBy(() -> service.delete(userId, id)).isInstanceOf(AppException.class);
    assertThatThrownBy(() -> service.makeDefault(userId, id)).isInstanceOf(AppException.class);
    assertThatThrownBy(() -> service.update(userId, id, request(false))).isInstanceOf(AppException.class);
  }

  @Test
  void updateWithoutDefaultFlagKeepsDefaultAddress() {
    var existing = address(true);
    when(addresses.findByPublicIdAndUserPublicId(existing.getPublicId(), userId)).thenReturn(Optional.of(existing));

    var updated = service.update(userId, existing.getPublicId(), request(false));

    assertThat(updated.isDefault()).isTrue();
    assertThat(updated.receiverName()).isEqualTo("An");
    verify(addresses, never()).clearDefault(any());
  }

  @Test
  void updateWithDefaultFlagPromotesAddress() {
    var existing = address(false);
    when(addresses.findByPublicIdAndUserPublicId(existing.getPublicId(), userId)).thenReturn(Optional.of(existing));

    var updated = service.update(userId, existing.getPublicId(), request(true));

    assertThat(updated.isDefault()).isTrue();
    verify(addresses).clearDefault(userId);
  }

  @Test
  void deletingDefaultPromotesNextAddress() {
    var deleted = address(true);
    var next = address(false);
    when(addresses.findByPublicIdAndUserPublicId(deleted.getPublicId(), userId)).thenReturn(Optional.of(deleted));
    when(addresses.findFirstByUserPublicIdOrderByIdAsc(userId)).thenReturn(Optional.of(next));

    service.delete(userId, deleted.getPublicId());

    verify(addresses).delete(deleted);
    assertThat(next.isDefault()).isTrue();
  }

  @Test
  void deletingNonDefaultDoesNotTouchOthers() {
    var deleted = address(false);
    when(addresses.findByPublicIdAndUserPublicId(deleted.getPublicId(), userId)).thenReturn(Optional.of(deleted));

    service.delete(userId, deleted.getPublicId());

    verify(addresses).delete(deleted);
    verify(addresses, never()).findFirstByUserPublicIdOrderByIdAsc(any());
  }

  @Test
  void makeDefaultIsNoOpWhenAlreadyDefault() {
    var existing = address(true);
    when(addresses.findByPublicIdAndUserPublicId(existing.getPublicId(), userId)).thenReturn(Optional.of(existing));

    service.makeDefault(userId, existing.getPublicId());

    verify(addresses, never()).clearDefault(any());
  }

  @Test
  void makeDefaultSwitchesDefault() {
    var existing = address(false);
    when(addresses.findByPublicIdAndUserPublicId(existing.getPublicId(), userId)).thenReturn(Optional.of(existing));

    service.makeDefault(userId, existing.getPublicId());

    verify(addresses).clearDefault(userId);
    assertThat(existing.isDefault()).isTrue();
  }
}
