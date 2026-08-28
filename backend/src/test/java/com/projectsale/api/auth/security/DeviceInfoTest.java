package com.projectsale.api.auth.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.auth.security.dto.DevicePlatform;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DeviceInfoTest {

  @Test
  void derivesConservativeWindowsDisplayNameFromUserAgent() {
    DeviceInfo device = new DeviceInfo(
        UUID.randomUUID(),
        null,
        DevicePlatform.UNKNOWN,
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0 Safari/537.36",
        "127.0.0.1");

    assertThat(device.platform()).isEqualTo(DevicePlatform.WINDOWS);
    assertThat(device.displayName()).isEqualTo("Chrome on Windows");
  }

  @Test
  void preservesClientProvidedHardwareNameAsDisplayMetadata() {
    DeviceInfo device = new DeviceInfo(
        UUID.randomUUID(),
        "iPhone 14 của Nam",
        DevicePlatform.IOS,
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        "2001:db8::1");

    assertThat(device.displayName()).isEqualTo("iPhone 14 của Nam");
    assertThat(device.platform()).isEqualTo(DevicePlatform.IOS);
  }

  @Test
  void truncatesUntrustedMetadataToStorageLimits() {
    DeviceInfo device = new DeviceInfo(
        UUID.randomUUID(),
        "d".repeat(121),
        DevicePlatform.OTHER,
        "u".repeat(513),
        "i".repeat(46));

    assertThat(device.displayName()).hasSize(120);
    assertThat(device.userAgent()).hasSize(512);
    assertThat(device.ipAddress()).hasSize(45);
  }
}
