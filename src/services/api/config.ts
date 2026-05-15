"use client";

const apiPrefix = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const API_URL = apiPrefix.endsWith("/api")
  ? apiPrefix
  : `${apiPrefix.replace(/\/$/, "")}/api`;
export const AUTH_REFRESH_URL = API_URL + "/v1/auth/refresh";
export const AUTH_ME_URL = API_URL + "/v1/auth/me";
export const AUTH_LOGOUT_URL = API_URL + "/v1/auth/logout";
