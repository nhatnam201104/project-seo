package com.projectsale.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectsale.enums.Gender;
import org.junit.jupiter.api.Test;

class UserDefaultsTest {

  @Test
  void newUserWithoutProfileFieldsGetsDefaultsOnPersist() {
    var user = new User();

    user.assignDefaultValues();

    assertThat(user.getGender()).isEqualTo(Gender.OTHER);
    assertThat(user.getDateOfBirth()).isNull();
    assertThat(user.getAvatarUrl()).isNull();
  }

  @Test
  void persistKeepsExplicitGender() {
    var user = new User();
    user.setGender(Gender.FEMALE);

    user.assignDefaultValues();

    assertThat(user.getGender()).isEqualTo(Gender.FEMALE);
  }
}
