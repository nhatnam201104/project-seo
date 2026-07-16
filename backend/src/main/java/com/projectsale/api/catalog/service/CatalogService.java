package com.projectsale.api.catalog.service;

import static com.projectsale.api.catalog.dto.CatalogDtos.BrandDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.BrandResponse;
import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryResponse;
import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryTree;
import static com.projectsale.api.catalog.dto.CatalogDtos.ProductDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.ProductSummary;

import com.projectsale.api.catalog.entity.Category;
import com.projectsale.api.catalog.entity.Product;
import com.projectsale.api.catalog.mapper.CatalogMapper;
import com.projectsale.api.catalog.repository.BrandRepository;
import com.projectsale.api.catalog.repository.CategoryRepository;
import com.projectsale.api.catalog.repository.ProductRepository;
import com.projectsale.api.common.exception.AppException;
import com.projectsale.api.user.entity.EntityStatus;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Đọc catalog công khai: sản phẩm, danh mục, thương hiệu (chỉ bản ghi ACTIVE,
 * chưa xoá mềm).
 */
@Service
@Transactional(readOnly = true)
public class CatalogService {

  private static final String DEFAULT_SORT = "createdAt,desc";
  private static final Map<String, String> JAVA_SORT_FIELDS = Map.of("createdAt", "createdAt", "minPrice", "minPrice",
      "name", "name");
  private static final Map<String, String> SQL_SORT_FIELDS = Map.of("createdAt", "created_at", "minPrice", "min_price",
      "name", "name");

  private final ProductRepository productRepository;
  private final CategoryRepository categoryRepository;
  private final BrandRepository brandRepository;
  private final CatalogMapper catalogMapper;

  public CatalogService(
      ProductRepository productRepository,
      CategoryRepository categoryRepository,
      BrandRepository brandRepository,
      CatalogMapper catalogMapper) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
    this.catalogMapper = catalogMapper;
  }

  public Page<ProductSummary> list(
      UUID categoryId,
      UUID brandId,
      BigDecimal minPrice,
      BigDecimal maxPrice,
      String color,
      String gender,
      Boolean hasLens,
      String faceTag,
      int page,
      int size,
      String sort) {
    validatePriceRange(minPrice, maxPrice);
    Page<Product> products = productRepository.findAll(
        ProductSpecifications.filter(
            categoryId, brandId, minPrice, maxPrice, color, gender, hasLens, faceTag),
        toPageable(page, size, sort, false));
    return products.map(catalogMapper::toSummary);
  }

  public Page<ProductSummary> search(String query, int page, int size, String sort) {
    Page<Product> products = productRepository.searchVisible(query.trim(), toPageable(page, size, sort, true));
    return products.map(catalogMapper::toSummary);
  }

  public ProductDetail detail(String slug) {
    return catalogMapper.toDetail(findActiveProduct(slug));
  }

  public List<ProductSummary> related(String slug) {
    Product product = findActiveProduct(slug);
    return productRepository
        .findTop4ByCategoryIdAndIdNotAndStatusAndDeletedAtIsNullOrderByRatingAvgDescCreatedAtDescIdDesc(
            product.getCategory().getId(), product.getId(), EntityStatus.ACTIVE)
        .stream()
        .map(catalogMapper::toSummary)
        .toList();
  }

  public List<CategoryResponse> categories() {
    return categoryRepository.findAllByStatusAndDeletedAtIsNullOrderByNameAsc(EntityStatus.ACTIVE).stream()
        .map(catalogMapper::toCategory)
        .toList();
  }

  public CategoryDetail category(String slug) {
    Category category = categoryRepository
        .findBySlugAndStatusAndDeletedAtIsNull(slug, EntityStatus.ACTIVE)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy danh mục"));
    return catalogMapper.toCategoryDetail(category);
  }

  public List<CategoryTree> categoryTree() {
    List<Category> activeCategories = categoryRepository
        .findAllByStatusAndDeletedAtIsNullOrderByNameAsc(EntityStatus.ACTIVE);
    Map<Long, List<Category>> childrenByParentId = activeCategories.stream()
        .filter(category -> category.getParent() != null)
        .collect(
            Collectors.groupingBy(
                category -> category.getParent().getId(),
                LinkedHashMap::new,
                Collectors.toList()));
    Set<Long> activeIds = activeCategories.stream().map(Category::getId).collect(Collectors.toSet());
    return activeCategories.stream()
        .filter(
            category -> category.getParent() == null || !activeIds.contains(category.getParent().getId()))
        .map(root -> toTree(root, childrenByParentId, new HashSet<>()))
        .toList();
  }

  public List<BrandResponse> brands() {
    return brandRepository.findAllByStatusAndDeletedAtIsNullOrderByNameAsc(EntityStatus.ACTIVE).stream()
        .map(catalogMapper::toBrand)
        .toList();
  }

  public BrandDetail brand(String slug) {
    return brandRepository
        .findBySlugAndStatusAndDeletedAtIsNull(slug, EntityStatus.ACTIVE)
        .map(catalogMapper::toBrandDetail)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy thương hiệu"));
  }

  private Product findActiveProduct(String slug) {
    return productRepository
        .findBySlugAndStatusAndDeletedAtIsNull(slug, EntityStatus.ACTIVE)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm"));
  }

  private CategoryTree toTree(
      Category category, Map<Long, List<Category>> childrenByParentId, Set<Long> visitedIds) {
    UUID parentPublicId = category.getParent() == null ? null : category.getParent().getPublicId();
    if (!visitedIds.add(category.getId())) {
      return new CategoryTree(
          category.getPublicId(),
          category.getName(),
          category.getSlug(),
          category.getImageUrl(),
          parentPublicId,
          List.of());
    }
    List<CategoryTree> children = childrenByParentId.getOrDefault(category.getId(), List.of()).stream()
        .map(child -> toTree(child, childrenByParentId, new HashSet<>(visitedIds)))
        .toList();
    return new CategoryTree(
        category.getPublicId(),
        category.getName(),
        category.getSlug(),
        category.getImageUrl(),
        parentPublicId,
        children);
  }

  private void validatePriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
    if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
      throw AppException.validation("minPrice phải nhỏ hơn hoặc bằng maxPrice");
    }
  }

  private Pageable toPageable(int page, int size, String rawSort, boolean nativeQuery) {
    String sort = (rawSort == null || rawSort.isBlank()) ? DEFAULT_SORT : rawSort;
    String[] parts = sort.split(",", -1);
    boolean validDirection = parts.length == 2
        && (parts[1].equalsIgnoreCase("asc") || parts[1].equalsIgnoreCase("desc"));
    if (!validDirection) {
      throw AppException.validation("Tham số sort phải có dạng field,asc|desc");
    }
    String field = (nativeQuery ? SQL_SORT_FIELDS : JAVA_SORT_FIELDS).get(parts[0]);
    if (field == null) {
      throw AppException.validation("Trường sort không được hỗ trợ");
    }
    Sort.Direction direction = Sort.Direction.fromString(parts[1]);
    return PageRequest.of(page, size, Sort.by(direction, field));
  }
}
