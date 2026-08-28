package com.projectsale.api.auth.security.dto;

/** Latest untrusted request metadata observed while rotating a refresh token. */
public record DeviceActivity(String userAgent, String ipAddress) {

  public DeviceActivity {
    userAgent = DeviceInfo.normalize(userAgent, DeviceInfo.MAX_USER_AGENT_LENGTH);
    ipAddress = DeviceInfo.normalize(ipAddress, DeviceInfo.MAX_IP_ADDRESS_LENGTH);
  }
}
