package com.projectsale.api.catalog.mapper;

import static com.projectsale.api.catalog.dto.CatalogDtos.BrandDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.BrandResponse;
import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryResponse;
import static com.projectsale.api.catalog.dto.CatalogDtos.ProductDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.ProductImageResponse;
import static com.projectsale.api.catalog.dto.CatalogDtos.ProductSummary;
import static com.projectsale.api.catalog.dto.CatalogDtos.ProductVariantResponse;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

import com.projectsale.entity.Brand;
import com.projectsale.entity.Category;
import com.projectsale.entity.Product;
import com.projectsale.entity.ProductImage;
import com.projectsale.entity.ProductVariant;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CatalogMapper {

    @Mapping(target = "id", source = "publicId")
    @Mapping(target = "status", expression = "java(product.getStatus().name())")
    ProductSummary toSummary(Product product);

    @Mapping(target = "id", source = "publicId")
    @Mapping(target = "brand", expression = "java(new com.projectsale.api.catalog.dto.CatalogDtos.NamedRef(product.getBrand().getName(), product.getBrand().getSlug()))")
    @Mapping(target = "category", expression = "java(new com.projectsale.api.catalog.dto.CatalogDtos.NamedRef(product.getCategory().getName(), product.getCategory().getSlug()))")
    @Mapping(target = "faceTags", expression = "java(product.getFaceTags() == null ? java.util.List.of() : java.util.List.copyOf(product.getFaceTags()))")
    ProductDetail toDetail(Product product);

    @Mapping(target = "variantId", source = "publicId")
    ProductVariantResponse toVariant(ProductVariant variant);

    ProductImageResponse toImage(ProductImage image);

    @Mapping(target = "id", source = "publicId")
    @Mapping(target = "parentId", source = "parent.publicId")
    CategoryResponse toCategory(Category category);

    @Mapping(target = "id", source = "publicId")
    @Mapping(target = "parentId", source = "parent.publicId")
    CategoryDetail toCategoryDetail(Category category);

    @Mapping(target = "id", source = "publicId")
    BrandResponse toBrand(Brand brand);

    @Mapping(target = "id", source = "publicId")
    BrandDetail toBrandDetail(Brand brand);
}
