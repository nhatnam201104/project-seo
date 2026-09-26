package com.projectsale.api.catalog.controller;

import static com.projectsale.api.catalog.dto.CatalogDtos.BrandDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.BrandResponse;

import com.projectsale.api.catalog.service.CatalogService;
import com.projectsale.common.response.ApiResponse;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/brands")
public class BrandController {

  private final CatalogService catalogService;

  public BrandController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping
  public ApiResponse<List<BrandResponse>> list() {
    return ApiResponse.ok(catalogService.brands());
  }

  @GetMapping("/{slug}")
  public ApiResponse<BrandDetail> detail(@PathVariable String slug) {
    return ApiResponse.ok(catalogService.brand(slug));
  }
}
