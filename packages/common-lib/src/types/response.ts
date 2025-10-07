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
    message: string;
    errors: string[];
    path: string;
  };
  type BaseResponse<T> = {
    audit: Audit;
    error: Error | null;
    data: T | null;
  };

  
  export type SuccessResponse<T> = BaseResponse<T> & {
    error: null;
  };

  export type ErrorResponse = BaseResponse<null> & {
    error: Error;
    data: null;
  };
  
  export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
  