"use client";

import { useCallback } from "react";
import { API_URL } from "../config";
import useFetch from "../use-fetch";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  ContentChunk,
  CreateContentChunkRequest,
  PaginatedContentChunksResponse,
  UpdateContentChunkRequest,
} from "../types/content-chunk-types";
import { RequestConfigType } from "./types/request-config";

type ApiResult<T> = {
  status: number;
  data: T;
};

type ListParams = {
  page: number;
  limit: number;
  noteId: string;
};

function buildContentChunksUrl(params: ListParams) {
  const requestUrl = new URL(`${API_URL}/v1/content-chunks`);

  Object.entries(params).forEach(([key, value]) => {
    requestUrl.searchParams.append(key, String(value));
  });

  return requestUrl;
}

export function useGetContentChunksService() {
  const fetch = useFetch();

  return useCallback(
    (
      params: ListParams,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<PaginatedContentChunksResponse>> => {
      return fetch(buildContentChunksUrl(params), {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<PaginatedContentChunksResponse>)
        .then((response) => ({
          status: response.status,
          data: response.data as PaginatedContentChunksResponse,
        }));
    },
    [fetch]
  );
}

export function useCreateContentChunkService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: CreateContentChunkRequest,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<ContentChunk>> => {
      return fetch(`${API_URL}/v1/content-chunks`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<ContentChunk>)
        .then((response) => ({
          status: response.status,
          data: response.data as ContentChunk,
        }));
    },
    [fetch]
  );
}

export function useUpdateContentChunkService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      data: UpdateContentChunkRequest,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<ContentChunk>> => {
      return fetch(`${API_URL}/v1/content-chunks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<ContentChunk>)
        .then((response) => ({
          status: response.status,
          data: response.data as ContentChunk,
        }));
    },
    [fetch]
  );
}

export function useDeleteContentChunkService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType): Promise<ApiResult<void>> =>
      fetch(`${API_URL}/v1/content-chunks/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then((response) => ({
        status: response.status,
        data: undefined,
      })),
    [fetch]
  );
}
