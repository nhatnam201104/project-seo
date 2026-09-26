package com.projectsale.api.auth.security.dto;

import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/** Untrusted display metadata supplied when a device session is created. */
public record DeviceInfo(
    UUID deviceId,
    String displayName,
    DevicePlatform platform,
    String userAgent,
    String ipAddress) {

  public static final int MAX_DISPLAY_NAME_LENGTH = 120;
  public static final int MAX_USER_AGENT_LENGTH = 512;
  public static final int MAX_IP_ADDRESS_LENGTH = 45;

  public DeviceInfo {
    Objects.requireNonNull(deviceId, "deviceId is required");
    userAgent = normalize(userAgent, MAX_USER_AGENT_LENGTH);
    ipAddress = normalize(ipAddress, MAX_IP_ADDRESS_LENGTH);
    platform = platform == null || platform == DevicePlatform.UNKNOWN
        ? inferPlatform(userAgent)
        : platform;
    displayName = normalize(displayName, MAX_DISPLAY_NAME_LENGTH);
    if (displayName == null) {
      displayName = fallbackDisplayName(platform, userAgent);
    }
  }

  static String normalize(String value, int maximumCodePoints) {
    if (value == null) {
      return null;
    }
    String normalized = value.strip();
    if (normalized.isEmpty()) {
      return null;
    }
    int codePoints = normalized.codePointCount(0, normalized.length());
    if (codePoints <= maximumCodePoints) {
      return normalized;
    }
    return normalized.substring(0, normalized.offsetByCodePoints(0, maximumCodePoints));
  }

  private static DevicePlatform inferPlatform(String userAgent) {
    if (userAgent == null) {
      return DevicePlatform.UNKNOWN;
    }
    String value = userAgent.toLowerCase(Locale.ROOT);
    if (value.contains("android")) {
      return DevicePlatform.ANDROID;
    }
    if (value.contains("iphone") || value.contains("ipad") || value.contains("ipod")) {
      return DevicePlatform.IOS;
    }
    if (value.contains("windows")) {
      return DevicePlatform.WINDOWS;
    }
    if (value.contains("macintosh") || value.contains("mac os x")) {
      return DevicePlatform.MACOS;
    }
    if (value.contains("linux")) {
      return DevicePlatform.LINUX;
    }
    return DevicePlatform.UNKNOWN;
  }

  private static String fallbackDisplayName(DevicePlatform platform, String userAgent) {
    String platformName = switch (platform) {
      case IOS -> "iPhone / iOS";
      case ANDROID -> "Android device";
      case WINDOWS -> "Windows";
      case MACOS -> "macOS";
      case LINUX -> "Linux";
      case OTHER -> "Other device";
      case UNKNOWN -> "Unknown device";
    };
    String browser = inferBrowser(userAgent);
    return browser == null ? platformName : browser + " on " + platformName;
  }

  private static String inferBrowser(String userAgent) {
    if (userAgent == null) {
      return null;
    }
    String value = userAgent.toLowerCase(Locale.ROOT);
    if (value.contains("edg/")) {
      return "Edge";
    }
    if (value.contains("opr/") || value.contains("opera")) {
      return "Opera";
    }
    if (value.contains("crios/") || value.contains("chrome/")) {
      return "Chrome";
    }
    if (value.contains("fxios/") || value.contains("firefox/")) {
      return "Firefox";
    }
    if (value.contains("safari/")) {
      return "Safari";
    }
    return null;
  }
}
