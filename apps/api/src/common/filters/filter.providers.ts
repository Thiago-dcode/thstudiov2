import { APP_FILTER } from "@nestjs/core";
import { ResponseExceptionFilter } from "./response-exception.filter";

const FILTERS = [ResponseExceptionFilter] as const;


export const filterProviders = FILTERS.map((filter) => ({
  provide: APP_FILTER,
  useClass: filter,
}));