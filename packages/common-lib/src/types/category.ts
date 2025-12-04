import { CategorySchema } from "../schemas/category"
import { OffsetPaginationRequest } from "./request"


export type CategoryTranslation = {
    id:number,
    name:string,
    code:string
}
export type CategoryIndexRequest = OffsetPaginationRequest & {

    random?:boolean,
    search?:string,
    parent_id?:number,

}
export type CategoryBase = Omit<CategorySchema,'created_at'|'updated_at'|'tags'>& {
    tags:string[],
    translation?:CategoryTranslation
}

export type CategoryWithParent = Omit<CategoryBase, 'parent_id'> & {
    parent?:CategoryWithParent
}