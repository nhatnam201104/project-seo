package com.projectsale.api.auth.security;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.projectsale.entity.User;
import com.projectsale.enums.RolesEnum;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

class JwtServiceTest {
    @Test
    void issuesAndVerifiesExpectedClaims() {
        String secret = Base64.getEncoder().encodeToString(new byte[32]);
        JwtService service = new JwtService(new JwtProperties(secret, "projectsale-api", "projectsale-web",
                Duration.ofMinutes(15), Period.ofDays(30), Duration.ofSeconds(60)));
        User user = mock(User.class);
        UUID id = UUID.randomUUID();
        when(user.getPublicId()).thenReturn(id);
        when(user.getRole()).thenReturn(RolesEnum.USER);
        var claims = service.verify(service.issue(user));
        assertThat(claims.userId()).isEqualTo(id);
        assertThat(claims.role()).isEqualTo("USER");
    }

    @Test
    void rejectsWeakSecret() {
        String weak = Base64.getEncoder().encodeToString(new byte[16]);
        assertThatThrownBy(() -> new JwtService(
                new JwtProperties(weak, "i", "a", Duration.ofMinutes(1), Period.ofDays(1), Duration.ZERO)))
                .isInstanceOf(IllegalStateException.class);
    }
}
