import type {
 Address,
 PublicCreateAddressInput,
 UpdateAddressInput,
} from "@repo/common-lib/types/address";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class AddressService extends BaseService {
 constructor() {
 super(fetchApi(), "addresses");
 }
 async create(body: PublicCreateAddressInput): Promise<ApiResponse<Address>> {
 return await this.fetchApi.post({ body });
 }
 async update(
 id: number,
 body: UpdateAddressInput,
 ): Promise<ApiResponse<Address>> {
 return await this.fetchApi.patch({
 resource: `/${id}`,
 body,
 });
 }
}

export default new AddressService();
