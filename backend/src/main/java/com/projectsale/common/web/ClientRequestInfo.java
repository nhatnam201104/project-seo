package com.projectsale.common.web;

/** IP và User-Agent của người dùng cuối (trình duyệt), không phải của server SSR. */
public record ClientRequestInfo(String ip, String userAgent) {}
