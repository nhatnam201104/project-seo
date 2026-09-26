package com.projectsale.common.web;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình tin cậy server SSR (prefix {@code app.proxy}).
 *
 * @param sharedSecret bí mật dùng chung với frontend SSR; để trống thì backend không
 *                     bao giờ tin các header chuyển tiếp (IP/User-Agent của trình duyệt).
 */
@ConfigurationProperties("app.proxy")
public record ProxyProperties(String sharedSecret) {}
