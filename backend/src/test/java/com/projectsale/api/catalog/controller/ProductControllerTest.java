package com.projectsale.api.catalog.controller;
import static org.mockito.Mockito.*; import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*; import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*; import com.projectsale.api.catalog.service.CatalogService;
import com.projectsale.common.exception.ApiExceptionHandler;

import org.junit.jupiter.api.Test; import org.springframework.test.web.servlet.setup.MockMvcBuilders;
class ProductControllerTest {
 @Test void rejectsUnknownListParameter() throws Exception {CatalogService service=mock(CatalogService.class);var mvc=MockMvcBuilders.standaloneSetup(new ProductController(service)).setControllerAdvice(new ApiExceptionHandler()).build();mvc.perform(get("/api/v1/products").param("unknown","x")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.message").exists());verifyNoInteractions(service);}
}
