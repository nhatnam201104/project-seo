package com.projectsale.api.auth.security.oauth2;

import java.util.Collection;
import java.util.Objects;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

/** Principal sau đăng nhập Google, mang sẵn {@code publicId} của tài khoản nội bộ. */
public class AppOidcUser extends DefaultOidcUser {

  private static final long serialVersionUID = 1L;

  private final UUID userId;

  public AppOidcUser(
      UUID userId,
      Collection<? extends GrantedAuthority> authorities,
      OidcIdToken idToken,
      OidcUserInfo userInfo) {
    super(authorities, idToken, userInfo, "sub");
    this.userId = Objects.requireNonNull(userId, "userId is required");
  }

  public UUID getUserId() {
    return userId;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof AppOidcUser that && super.equals(that) && userId.equals(that.userId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), userId);
  }
}
