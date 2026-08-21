package com.projectsale.api.catalog.repository;

import com.projectsale.entity.Brand;
import com.projectsale.enums.StatusEnum;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findAllByStatusAndDeletedAtIsNullOrderByNameAsc(StatusEnum status);

    Optional<Brand> findBySlugAndStatusAndDeletedAtIsNull(String slug, StatusEnum status);
}
