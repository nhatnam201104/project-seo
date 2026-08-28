package com.projectsale.common.device;

import com.projectsale.api.auth.security.dto.DeviceActivity;
import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.auth.security.dto.DevicePlatform;
import com.projectsale.common.web.ClientRequestInfo;
import java.util.UUID;

/**
 * Builds normalized device metadata from the resolved end-user identity (see
 * {@code ClientRequestResolver}) and client-supplied device fields.
 */
public final class DeviceInfoFactory {

  private DeviceInfoFactory() {}

  public static DeviceInfo from(
      UUID deviceId,
      String deviceName,
      DevicePlatform platform,
      ClientRequestInfo client) {
    return new DeviceInfo(deviceId, deviceName, platform, client.userAgent(), client.ip());
  }

  public static DeviceActivity activityFrom(ClientRequestInfo client) {
    return new DeviceActivity(client.userAgent(), client.ip());
  }
}
