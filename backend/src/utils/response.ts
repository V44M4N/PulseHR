export interface ApiMeta {
  page?:       number;
  limit?:      number;
  total?:      number;
  totalPages?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data:    T;
  meta?:   ApiMeta;
}

export interface ApiError {
  success: false;
  error: {
    code:    string;
    message: string;
  };
}

export function ok<T>(data: T, meta?: ApiMeta): ApiSuccess<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function fail(code: string, message: string): ApiError {
  return { success: false, error: { code, message } };
}
