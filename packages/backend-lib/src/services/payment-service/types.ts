import { PaypalPaymentConfig } from "./paypal/types"
import { StripePaymentConfig } from "./stripe/types"

export type PaymentDriver = 'stripe'| 'paypal'


export type PaymentConfig = StripePaymentConfig | PaypalPaymentConfig


