import { AxiosError, type AxiosRequestConfig } from "axios";

import { apiClient } from "@/lib/api/client";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.detail || "An error occurred with the API request.");
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const config: AxiosRequestConfig = {
    url: endpoint,
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
    data: options.body,
  };

  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.status ?? 0,
        error.response?.data ?? { detail: error.message },
      );
    }
    throw error;
  }
}
