package com.projectsale.api.user.repository;

import com.projectsale.entity.Address;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AddressRepository extends JpaRepository<Address, Long> {

  List<Address> findByUserPublicIdOrderByIsDefaultDescIdAsc(UUID userPublicId);

  Optional<Address> findByPublicIdAndUserPublicId(UUID publicId, UUID userPublicId);

  long countByUserPublicId(UUID userPublicId);

  Optional<Address> findFirstByUserPublicIdOrderByIdAsc(UUID userPublicId);

  /** Bỏ cờ mặc định của mọi địa chỉ của user (trước khi đặt địa chỉ mặc định mới). */
  @Modifying
  @Query("update Address a set a.isDefault = false where a.user.publicId = :userId and a.isDefault = true")
  int clearDefault(@Param("userId") UUID userId);
}
