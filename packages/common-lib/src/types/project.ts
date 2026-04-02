import { ProjectSchema } from "../schemas/project";
import { OffsetPaginationRequest } from "./request";

export type Project = ProjectSchema;

export type ProjectIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
};

type InternalProjectFields =
  | "id"
  | "created_at"
  | "updated_at"
  | "is_featured"
  | "is_highlight";

export type CreateProjectInput = Omit<ProjectSchema, InternalProjectFields>;

export type UpdateProjectInput = Partial<Omit<ProjectSchema, InternalProjectFields>>;
