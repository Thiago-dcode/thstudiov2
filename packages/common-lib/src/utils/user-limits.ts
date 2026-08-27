import { BasePlan } from '../types/plan';
import { UserExtraData } from '../types/user-extra-data';

export class UserLimits {
  /**
   * Whether adding `incomingSize` (MB) stays within the plan storage cap.
   * `-1` on `storage_limit_mb` means unlimited.
   */
  static storageSize(data: {
    userExtraData: UserExtraData;
    userPlan: BasePlan;
    incomingSize: number;
  }): boolean {
    const { userExtraData, userPlan, incomingSize } = data;
    if (userPlan.storage_limit_mb === -1) return true;
    const newSize = userExtraData.storage_used_mb + incomingSize;
    return newSize <= userPlan.storage_limit_mb;
  }

  /**
   * Whether the account is not currently banned (ban_lift in the past or absent).
   */
  static accountStrikes(data: {
    userExtraData: UserExtraData;
    now?: Date;
  }): boolean {
    const { userExtraData, now = new Date() } = data;
    if (!userExtraData.ban_lift) return true;
    return new Date(userExtraData.ban_lift) <= now;
  }

  /** Whether the plan allows media compression. */
  static mediaCompression(data: { userPlan: BasePlan }): boolean {
    return data.userPlan.allow_media_compression;
  }

  /** Whether the user still has AI credits available. */
  static aiCredits(data: {
    userExtraData: UserExtraData;
    userPlan: BasePlan;
  }): boolean {
    const { userExtraData, userPlan } = data;
    const totalCredits = userExtraData.ai_credits + userPlan.ai_credits;
    return userExtraData.ai_credits_consumed < totalCredits;
  }

  /**
   * Whether adding storage write requests stays within the daily cap.
   * `-1` on `limit_write_storage_per_day` means unlimited.
   */
  static dailyStorageRequests(data: {
    userPlan: BasePlan;
    currentRequests: number;
    incomingRequests: number;
  }): boolean {
    const { userPlan, currentRequests, incomingRequests } = data;
    if (userPlan.limit_write_storage_per_day === -1) return true;
    return currentRequests + incomingRequests <= userPlan.limit_write_storage_per_day;
  }

  /**
   * Whether adding entities stays within the plan cap.
   * `-1` on `maxAllowed` means unlimited.
   */
  static entityCount(data: {
    currentCount: number;
    incomingCount: number;
    maxAllowed: number;
  }): boolean {
    const { currentCount, incomingCount, maxAllowed } = data;
    if (maxAllowed === -1) return true;
    return currentCount + incomingCount <= maxAllowed;
  }
}
