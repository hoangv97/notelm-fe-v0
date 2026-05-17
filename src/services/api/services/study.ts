"use client";

import { useCallback } from "react";
import { API_URL } from "../config";
import useFetch from "../use-fetch";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  Flashcard,
  PaginatedStudyResponse,
  Quiz,
  QuizQuestion,
} from "../types/study-types";
import { RequestConfigType } from "./types/request-config";

type ApiResult<T> = {
  status: number;
  data: T;
};

type ListParams = {
  page: number;
  limit: number;
};

function buildListUrl(
  path: string,
  params: ListParams & Record<string, string | number>
) {
  const requestUrl = new URL(`${API_URL}/v1/${path}`);

  Object.entries(params).forEach(([key, value]) => {
    requestUrl.searchParams.append(key, String(value));
  });

  return requestUrl;
}

export function useGetFlashcardsService() {
  const fetch = useFetch();

  return useCallback(
    (
      params: ListParams & { noteId: string },
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<PaginatedStudyResponse<Flashcard>>> => {
      return fetch(buildListUrl("flashcards", params), {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<PaginatedStudyResponse<Flashcard>>)
        .then((response) => ({
          status: response.status,
          data: response.data as PaginatedStudyResponse<Flashcard>,
        }));
    },
    [fetch]
  );
}

export function useUpdateFlashcardService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      data: Partial<Pick<Flashcard, "front" | "back" | "tags" | "difficulty">>,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<Flashcard>> => {
      return fetch(`${API_URL}/v1/flashcards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<Flashcard>)
        .then((response) => ({
          status: response.status,
          data: response.data as Flashcard,
        }));
    },
    [fetch]
  );
}

export function useDeleteFlashcardService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType): Promise<ApiResult<void>> =>
      fetch(`${API_URL}/v1/flashcards/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then((response) => ({
        status: response.status,
        data: undefined,
      })),
    [fetch]
  );
}

export function useGetQuizzesService() {
  const fetch = useFetch();

  return useCallback(
    (
      params: ListParams & { noteId: string },
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<PaginatedStudyResponse<Quiz>>> => {
      return fetch(buildListUrl("quizzes", params), {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<PaginatedStudyResponse<Quiz>>)
        .then((response) => ({
          status: response.status,
          data: response.data as PaginatedStudyResponse<Quiz>,
        }));
    },
    [fetch]
  );
}

export function useGetQuizQuestionsService() {
  const fetch = useFetch();

  return useCallback(
    (
      params: ListParams & { quizId: string },
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<PaginatedStudyResponse<QuizQuestion>>> => {
      return fetch(buildListUrl("quiz-questions", params), {
        method: "GET",
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<PaginatedStudyResponse<QuizQuestion>>)
        .then((response) => ({
          status: response.status,
          data: response.data as PaginatedStudyResponse<QuizQuestion>,
        }));
    },
    [fetch]
  );
}

export function useUpdateQuizQuestionService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: string,
      data: Partial<
        Pick<
          QuizQuestion,
          | "question"
          | "options"
          | "correctAnswer"
          | "explanation"
          | "type"
          | "difficulty"
          | "tags"
        >
      >,
      requestConfig?: RequestConfigType
    ): Promise<ApiResult<QuizQuestion>> => {
      return fetch(`${API_URL}/v1/quiz-questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      })
        .then(wrapperFetchJsonResponse<QuizQuestion>)
        .then((response) => ({
          status: response.status,
          data: response.data as QuizQuestion,
        }));
    },
    [fetch]
  );
}

export function useDeleteQuizQuestionService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType): Promise<ApiResult<void>> =>
      fetch(`${API_URL}/v1/quiz-questions/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then((response) => ({
        status: response.status,
        data: undefined,
      })),
    [fetch]
  );
}
