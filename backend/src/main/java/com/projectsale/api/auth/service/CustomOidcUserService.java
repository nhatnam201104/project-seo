package com.projectsale.api.auth.service;

import java.util.Set;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import com.projectsale.api.auth.security.oauth2.AppOidcUser;
import com.projectsale.api.auth.service.GoogleAccountProvisioner.GoogleProfile;
import com.projectsale.entity.User;

import lombok.RequiredArgsConstructor;

/**
 * Sau khi Spring xác minh ID token Google (chữ ký, iss, aud, exp, nonce), ánh xạ
 * sang tài khoản nội bộ qua {@link GoogleAccountProvisioner}.
 */
@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final GoogleAccountProvisioner provisioner;

    @Override
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        OidcUser google = super.loadUser(request);

        User user = provisioner.provision(new GoogleProfile(
                google.getSubject(),
                google.getEmail(),
                Boolean.TRUE.equals(google.getEmailVerified()),
                google.getFullName()));

        var authorities = Set.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        return new AppOidcUser(user.getPublicId(), authorities, google.getIdToken(), google.getUserInfo());
    }
}
