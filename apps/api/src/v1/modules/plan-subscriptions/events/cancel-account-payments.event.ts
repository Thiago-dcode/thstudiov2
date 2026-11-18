export class CancelAccountPaymentsEvent {
  constructor(
    public readonly userId: number,
    public readonly stripeCustomerId: string | null,
  ) {}
}
