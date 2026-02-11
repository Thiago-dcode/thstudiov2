import { ApiErrorKey } from "../constants/api-errors";
import { EnumType } from "../constants/enums";

export type Audit = {
  ip: string;
  user_agent: string;
  request_time: number;
  language?: EnumType<'LANGUAGE_CODE'>;
  user?: number;
};

export type Error = {
  status_code: number;
  api_error_code?: ApiErrorKey;
  message: string;
  errors: string[];
  path: string;
};
export type Pagination = {
  total_count: number,
  per_page: number,
  next_page?: number,
  prev_page?: number,
  current_page: number,
  last_page: number
}
type BaseResponse = {
  audit: Audit;
  count?: number
};

export type SuccessResponse<T> = BaseResponse & {
  pagination?: Pagination,
  data: T
  error: null;
};

export type ErrorResponse = BaseResponse & {
  error: Error;
  data: null;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;


export type ReturnError<T> = {
  errors: string[],
  inputErrors?: T,
}
export type ActionResponseError<T> = ReturnError<T> & {
  data: null,
}
export type ActionResponseSuccess<T> = {
  data: T,
  errors: null,
  inputErrors?: undefined,
}
// Server actions return `{ data, errors, inputErrors }` where `inputErrors` is a map of field -> message.
// `T` is the successful `data` shape; `K` is the optional `inputs` shape (for debugging/echoing inputs).
export type ActionReturn<T, K = Record<string, any>> = (ActionResponseError<Record<string, string>> | ActionResponseSuccess<T>) & {
  inputs?: K
};