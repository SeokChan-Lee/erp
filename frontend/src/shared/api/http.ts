import axios, { AxiosError, type AxiosRequestConfig } from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});

type HttpOptions = AxiosRequestConfig & {
  json?: unknown;
};

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  try {
    const response = await api.request<T>({
      ...options,
      url: path.replace(/^\/api/, ""),
      data: options.json ?? options.data
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(readErrorMessage(error), error.response?.status ?? 0);
    }
    throw error;
  }
}

export function getErrorMessage(error: unknown, fallback = "요청 처리 중 오류가 발생했습니다.") {
  return error instanceof Error ? error.message : fallback;
}

function readErrorMessage(error: AxiosError) {
  const data = error.response?.data;
  if (isErrorBody(data)) {
    return data.message || "요청 처리 중 오류가 발생했습니다.";
  }
  return "요청 처리 중 오류가 발생했습니다.";
}

function isErrorBody(value: unknown): value is { message?: string; error?: string } {
  return typeof value === "object" && value !== null;
}
