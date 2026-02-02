import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { Address, PublicCreateAddressInput, UpdateAddressInput } from "@repo/common-lib/types/address";


class AddressService extends BaseService {
    constructor() {
       super(fetchApi(), 'addresses');
    }
    async create(body: PublicCreateAddressInput): Promise<ApiResponse<Address>> {
        return await this.fetchApi.post({body});
    }
    async update(id: number, body: UpdateAddressInput): Promise<ApiResponse<Address>> {
        return await this.fetchApi.patch({
            resource: `/${id}`,
            body
        });
    }
}

export default new AddressService();

