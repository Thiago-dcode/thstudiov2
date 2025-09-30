import { EnumType } from "@repo/database/schemas/database";

export type Audit = {
  ip: string;
  user_agent: string;
  request_time: number;
  language?: EnumType<'LANGUAGE_CODE'>;
  user?: number;
};

type BaseResponse = {
  audit: Audit;
};


export type SuccessResponse = BaseResponse & {
  data: any;
};

export type ErrorResponse = BaseResponse & {
  error: string;
};

export type Response = SuccessResponse | ErrorResponse;
