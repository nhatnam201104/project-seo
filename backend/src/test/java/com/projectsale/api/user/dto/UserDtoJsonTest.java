package com.projectsale.api.user.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectsale.enums.Gender;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/** Kiểm tra JSON thật (Jackson như Spring Boot) của DTO có thành phần record tên {@code isDefault}. */
class UserDtoJsonTest {

  private final ObjectMapper mapper = Jackson2ObjectMapperBuilder.json().build();

  @Test
  void addressResponseExposesOnlySnakeCaseIsDefault() throws Exception {
    JsonNode json = mapper.valueToTree(new AddressResponse(
        UUID.randomUUID(), "An", "0912345678", "l", "w", "d", "c", true));

    assertThat(json.has("is_default")).isTrue();
    assertThat(json.get("is_default").asBoolean()).isTrue();
    assertThat(json.has("default")).as("no duplicate 'default' property").isFalse();
    assertThat(json.has("isDefault")).isFalse();
  }

  @Test
  void addressRequestReadsIsDefaultFromSnakeCase() throws Exception {
    var request = mapper.readValue(
        "{\"receiver_name\":\"An\",\"receiver_phone\":\"0912345678\",\"line\":\"l\","
            + "\"ward\":\"w\",\"district\":\"d\",\"city\":\"c\",\"is_default\":true}",
        AddressRequest.class);

    assertThat(request.isDefault()).isTrue();
    assertThat(request.receiverName()).isEqualTo("An");
  }

  @Test
  void profileRequestReadsSnakeCaseAndIsoDate() throws Exception {
    var request = mapper.readValue(
        "{\"full_name\":\"An\",\"phone\":null,\"date_of_birth\":\"1995-10-24\",\"gender\":\"FEMALE\"}",
        ProfileRequest.Update.class);

    assertThat(request.fullName()).isEqualTo("An");
    assertThat(request.dateOfBirth()).isEqualTo(LocalDate.of(1995, 10, 24));
    assertThat(request.gender()).isEqualTo(Gender.FEMALE);
  }

  @Test
  void profileResponseWritesIsoDateString() throws Exception {
    JsonNode json = mapper.valueToTree(new ProfileResponse(
        UUID.randomUUID(), "a@b.vn", "An", null, LocalDate.of(1995, 10, 24), Gender.OTHER, null));

    assertThat(json.get("date_of_birth").asText()).isEqualTo("1995-10-24");
    assertThat(json.get("gender").asText()).isEqualTo("OTHER");
  }
}
