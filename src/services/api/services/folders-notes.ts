"use client";

import { useCallback } from "react";
import { API_URL } from "../config";
import useFetch from "../use-fetch";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  CreateFolderRequest,
  CreateNoteRequest,
  CreateNoteResponse,
  Folder,
  FolderContentsResponse,
  JobQueue,
  JobStatusEnum,
  Note,
  NoteTypeEnum,
  UpdateFolderRequest,
} from "../types/note-types";
import { RequestConfigType } from "./types/request-config";

type ApiResult<T> = {
  status: number;
  data: T;
};

function parseTags(tags: Note["tags"]): string[] {
  if (!tags) return [];

  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Plain comma-separated tags are also accepted.
  }

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeNote(note: Note): Note {
  return {
    ...note,
    type: note.inputType,
    content: note.rawText,
    url: note.sourceUrl ?? undefined,
    tagsList: parseTags(note.tags),
  };
}

function normalizeJob(job: JobQueue): JobQueue {
  const completed = job.status === JobStatusEnum.COMPLETED;
  const failed = job.status === JobStatusEnum.FAILED;

  return {
    ...job,
    progress: completed ? 100 : failed ? 100 : job.startedAt ? 50 : 0,
    message:
      job.errorMessage ??
      job.resultSummary ??
      (completed
        ? "Processing complete"
        : failed
          ? "Processing failed"
          : job.startedAt
            ? "Processing..."
            : "Queued for processing"),
  };
}

function buildFormData(data: CreateNoteRequest): FormData {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("inputType", data.type);
  formData.append("folderId", data.folderId);

  if (data.description) formData.append("description", data.description);
  if (data.content) formData.append("rawText", data.content);
  if (data.url) formData.append("sourceUrl", data.url);
  if (data.file) formData.append("file", data.file);

  return formData;
}

export function useGetFolderContentsService() {
  const fetch = useFetch();

  return useCallback(
    (
      parentId: string | null,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<FolderContentsResponse>> => {
      const requestUrl = new URL(`${API_URL}/v1/folders/contents`);
      if (parentId) {
        requestUrl.searchParams.append("parentId", parentId);
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<FolderContentsResponse>)
        .then((response) => ({
          status: response.status,
          data: {
            folders: (response.data as FolderContentsResponse).folders,
            notes: (response.data as FolderContentsResponse).notes.map(
              normalizeNote
            ),
          },
        }));
    },
    [fetch]
  );
}

export function useGetFolderService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<Folder>> => {
      return fetch(`${API_URL}/v1/folders/${id}`, {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<Folder>)
        .then((response) => ({
          status: response.status,
          data: response.data as Folder,
        }));
    },
    [fetch]
  );
}

export function useUpdateFolderService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      data: UpdateFolderRequest,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<Folder>> => {
      return fetch(`${API_URL}/v1/folders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<Folder>)
        .then((response) => ({
          status: response.status,
          data: response.data as Folder,
        }));
    },
    [fetch]
  );
}

export function useCreateFolderService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: CreateFolderRequest,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<Folder>> => {
      return fetch(`${API_URL}/v1/folders`, {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          color: data.color,
          position: data.position ?? 0,
          parentId: data.parentId ?? null,
        }),
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<Folder>)
        .then((response) => ({
          status: response.status,
          data: response.data as Folder,
        }));
    },
    [fetch]
  );
}

export function useDeleteFolderService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<undefined>> => {
      return fetch(`${API_URL}/v1/folders/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then((response) => ({
        status: response.status,
        data: undefined,
      }));
    },
    [fetch]
  );
}

export function useGetNoteService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<Note>> => {
      return fetch(`${API_URL}/v1/notes/${id}`, {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<Note>)
        .then((response) => ({
          status: response.status,
          data: normalizeNote(response.data as Note),
        }));
    },
    [fetch]
  );
}

export function useUpdateNoteService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      data: Partial<{
        name: Note["name"];
        description: Note["description"];
        tags: string[];
        content: string;
        url: string;
      }>,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<Note>> => {
      const payload = {
        name: data.name,
        description: data.description,
        tags: data.tags?.join(","),
        rawText: data.content,
        sourceUrl: data.url,
      };

      return fetch(`${API_URL}/v1/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<Note>)
        .then((response) => ({
          status: response.status,
          data: normalizeNote(response.data as Note),
        }));
    },
    [fetch]
  );
}

export function useCreateNoteService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: CreateNoteRequest,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<CreateNoteResponse>> => {
      const hasFile = data.type === NoteTypeEnum.FILE && data.file;
      const body = hasFile
        ? buildFormData(data)
        : JSON.stringify({
            name: data.name,
            description: data.description,
            inputType: data.type,
            folderId: data.folderId,
            rawText: data.type === NoteTypeEnum.TEXT ? data.content : undefined,
            sourceUrl: data.type === NoteTypeEnum.URL ? data.url : undefined,
          });

      return fetch(`${API_URL}/v1/notes`, {
        method: "POST",
        body,
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<CreateNoteResponse>)
        .then((response) => ({
          status: response.status,
          data: {
            ...(response.data as CreateNoteResponse),
            note: normalizeNote((response.data as CreateNoteResponse).note),
          },
        }));
    },
    [fetch]
  );
}

export function useGetJobStatusService() {
  const fetch = useFetch();

  return useCallback(
    (
      jobId: string,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<JobQueue>> => {
      return fetch(`${API_URL}/v1/job-queues/${jobId}`, {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<JobQueue>)
        .then((response) => ({
          status: response.status,
          data: normalizeJob(response.data as JobQueue),
        }));
    },
    [fetch]
  );
}

export function useGetAllFoldersService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType): Promise<ApiResult<Folder[]>> => {
      const requestUrl = new URL(`${API_URL}/v1/folders/contents`);

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<FolderContentsResponse>)
        .then((response) => ({
          status: response.status,
          data: (response.data as FolderContentsResponse).folders,
        }));
    },
    [fetch]
  );
}
