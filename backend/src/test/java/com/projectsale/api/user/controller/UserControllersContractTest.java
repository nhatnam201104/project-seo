package com.projectsale.api.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.projectsale.api.user.dto.AddressResponse;
import com.projectsale.api.user.dto.ProfileResponse;
import com.projectsale.api.user.service.AddressService;
import com.projectsale.api.user.service.UserProfileService;
import com.projectsale.common.exception.ApiExceptionHandler;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.enums.Gender;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class UserControllersContractTest {

  private UserProfileService profileService;
  private AddressService addressService;
  private MockMvc mvc;
  private final UUID userId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    profileService = mock(UserProfileService.class);
    addressService = mock(AddressService.class);
    mvc = MockMvcBuilders.standaloneSetup(new UserController(profileService), new AddressController(addressService))
        .setControllerAdvice(new ApiExceptionHandler())
        .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
        .build();
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(userId, null, List.of()));
  }

  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  private static final String ADDRESS_BODY = """
      {"receiver_name":"An","receiver_phone":"0912345678","line":"12 Nguyễn Huệ",
       "ward":"Bến Nghé","district":"Quận 1","city":"Hồ Chí Minh","is_default":true}
      """;

  @Test
  void getProfileUsesSnakeCaseContract() throws Exception {
    when(profileService.get(userId)).thenReturn(new ProfileResponse(
        userId, "a@b.vn", "An", "0912345678", LocalDate.of(1995, 10, 24), Gender.MALE, null));

    mvc.perform(get("/api/v1/users/me"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.full_name").value("An"))
        .andExpect(jsonPath("$.data.date_of_birth").value("1995-10-24"))
        .andExpect(jsonPath("$.data.gender").value("MALE"))
        .andExpect(jsonPath("$.data.avatar_url").doesNotExist())
        .andExpect(jsonPath("$.error").doesNotExist());
  }

  @Test
  void updateProfileRejectsInvalidBodyBeforeServiceCall() throws Exception {
    mvc.perform(put("/api/v1/users/me")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"full_name\":\"\",\"phone\":\"123\",\"date_of_birth\":\"2999-01-01\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.detailMessage").value(Matchers.allOf(
            Matchers.containsString("fullName"), Matchers.containsString("phone"),
            Matchers.containsString("dateOfBirth"))));

    verifyNoInteractions(profileService);
  }

  @Test
  void updateProfileAcceptsNullOptionalFields() throws Exception {
    when(profileService.update(any(), any())).thenReturn(new ProfileResponse(
        userId, "a@b.vn", "An", null, null, null, null));

    mvc.perform(put("/api/v1/users/me")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"full_name\":\"An\",\"phone\":null,\"date_of_birth\":null,\"gender\":null}"))
        .andExpect(status().isOk());
  }

  @Test
  void changePasswordValidatesLengthAndMapsServiceError() throws Exception {
    mvc.perform(post("/api/v1/users/me/password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"current_password\":\"x\",\"new_password\":\"short\"}"))
        .andExpect(status().isBadRequest());

    org.mockito.Mockito.doThrow(new AppException(ErrorCode.INVALID_CURRENT_PASSWORD))
        .when(profileService).changePassword(any(), any());
    mvc.perform(post("/api/v1/users/me/password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"current_password\":\"wrong\",\"new_password\":\"newpassword2\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.message").value("Mật khẩu hiện tại không đúng"));
  }

  @Test
  void createAddressReturns201AndValidates() throws Exception {
    var id = UUID.randomUUID();
    when(addressService.create(any(), any())).thenReturn(new AddressResponse(
        id, "An", "0912345678", "12 Nguyễn Huệ", "Bến Nghé", "Quận 1", "Hồ Chí Minh", true));

    mvc.perform(post("/api/v1/users/me/addresses")
            .contentType(MediaType.APPLICATION_JSON).content(ADDRESS_BODY))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.id").value(id.toString()))
        .andExpect(jsonPath("$.data.receiver_name").value("An"))
        .andExpect(jsonPath("$.data.is_default").value(true));

    mvc.perform(post("/api/v1/users/me/addresses")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"receiver_name\":\"\",\"receiver_phone\":\"1\",\"line\":\"\",\"ward\":\"\",\"district\":\"\",\"city\":\"\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void addressNotFoundIs404() throws Exception {
    var id = UUID.randomUUID();
    when(addressService.get(userId, id)).thenThrow(new AppException(ErrorCode.ADDRESS_NOT_FOUND));

    mvc.perform(get("/api/v1/users/me/addresses/" + id))
        .andExpect(status().isNotFound());
  }

  @Test
  void listUpdateDeleteAndDefaultDelegateWithCurrentUser() throws Exception {
    var id = UUID.randomUUID();
    when(addressService.list(userId)).thenReturn(List.of());
    when(addressService.update(any(), any(), any())).thenReturn(new AddressResponse(
        id, "An", "0912345678", "l", "w", "d", "c", false));

    mvc.perform(get("/api/v1/users/me/addresses")).andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray());
    mvc.perform(put("/api/v1/users/me/addresses/" + id)
            .contentType(MediaType.APPLICATION_JSON).content(ADDRESS_BODY)).andExpect(status().isOk());
    mvc.perform(post("/api/v1/users/me/addresses/" + id + "/default")).andExpect(status().isOk());
    mvc.perform(delete("/api/v1/users/me/addresses/" + id)).andExpect(status().isOk());

    verify(addressService).makeDefault(userId, id);
    verify(addressService).delete(userId, id);
  }
}
