package com.projectsale.api.catalog.repository;

import com.projectsale.api.catalog.entity.Brand;
import com.projectsale.api.user.entity.EntityStatus;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findAllByStatusAndDeletedAtIsNullOrderByNameAsc(EntityStatus status);

    Optional<Brand> findBySlugAndStatusAndDeletedAtIsNull(String slug, EntityStatus status);
}
