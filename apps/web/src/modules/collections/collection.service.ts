import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { Collection, CreateCollectionInput, UpdateCollectionInput, CollectionIndexRequest } from "@repo/common-lib/types/collection";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";

class CollectionService extends BaseService {
    constructor() {
        super(fetchApi(), 'collections');
    }
    async findAll(request?: CollectionIndexRequest): Promise<ApiResponse<Collection[]>> {
        return await this.fetchApi.get({
            resource: request ? queryParamBuilder('', request) : ''
        });
    }
    async create(body: CreateCollectionInput): Promise<ApiResponse<Collection>> {
        return await this.fetchApi.post({ body });
    }
    async update(id: number, body: UpdateCollectionInput): Promise<ApiResponse<Collection>> {
        return await this.fetchApi.patch({
            resource: `/${id}`,
            body
        });
    }
    async delete(id: number): Promise<ApiResponse<void>> {
        return await this.fetchApi.delete({ resource: `/${id}` });
    }
}

export default new CollectionService();
