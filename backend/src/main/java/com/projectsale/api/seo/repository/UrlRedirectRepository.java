package com.projectsale.api.seo.repository;

import com.projectsale.entity.UrlRedirect;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UrlRedirectRepository extends JpaRepository<UrlRedirect, Long> {
}