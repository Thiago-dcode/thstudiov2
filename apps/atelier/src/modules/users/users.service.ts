import { BaseService } from "@/lib/services/base.service";
import { fetchApi } from "@/lib/facade/fetchApi";

export class UserService extends BaseService {
    constructor() {
        super(fetchApi, 'users');

    }

}

let UserServiceInstance: UserService | null = null;

export default (() => {
    if(!UserServiceInstance) {
        UserServiceInstance = new UserService();
    }
    return UserServiceInstance;
})()
