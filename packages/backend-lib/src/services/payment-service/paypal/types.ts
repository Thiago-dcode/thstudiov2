
export type PaypalPaymentConfig = {
    clientId:string,
    secretKey:string,
    url:string

}

export type PaypalAuthResponse = {
    access_token: string,
    token_type: string,
    app_id: string,
    expires_at: number,
}

// Raw API response from PayPal
export type FullPaypaAuthResponse = {
    access_token: string,
    token_type: string,
    app_id: string,
    expires_in: number,
    scope: string,
    nonce: string,
}
export type PaypalProductType = 'PHYSICAL'| 'DIGITAL'| 'SERVICE'
export type PayPalProductCategory =
  | "SOFTWARE"
  | "GENERAL_SOFTWARE"
  | "ONLINE_SERVICES"
  | "INTERNET_AND_NETWORK_SERVICES"
  | "DIRECT_MARKETING_SUBSCRIPTION"
  | "SERVICES";
export type PaypalCreateProductInput = {
    id?:string,
    name:string,
    description?:string,
    type:PaypalProductType,
    category?:PayPalProductCategory,
    image_url?:string,
    home_url?:string
}
export type PaypalProductResponse = {
    id: string,
    name: string,
    description?: string,
    type: PaypalProductType,
    category?: PayPalProductCategory,
    image_url?: string,
    home_url?: string,
    create_time: string,
    update_time: string,
}

// Plan/Subscription Types
export type PaypalIntervalUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type PaypalTenureType = 'TRIAL' | 'REGULAR';
export type PaypalPlanStatus = 'CREATED' | 'INACTIVE' | 'ACTIVE';
export type PaypalSetupFeeFailureAction = 'CONTINUE' | 'CANCEL';

export type PaypalMoney = {
    value: string,
    currency_code: string,
}

export type PaypalFrequency = {
    interval_unit: PaypalIntervalUnit,
    interval_count: number,
}

export type PaypalPricingScheme = {
    fixed_price: PaypalMoney,
}

export type PaypalBillingCycle = {
    frequency: PaypalFrequency,
    tenure_type: PaypalTenureType,
    sequence: number,
    total_cycles: number,
    pricing_scheme: PaypalPricingScheme,
}

export type PaypalPaymentPreferences = {
    auto_bill_outstanding?: boolean,
    setup_fee?: PaypalMoney,
    setup_fee_failure_action?: PaypalSetupFeeFailureAction,
    payment_failure_threshold?: number,
}

export type PaypalTaxes = {
    percentage: string,
    inclusive?: boolean,
}

export type PaypalCreatePlanInput = {
    product_id: string,
    name: string,
    description?: string,
    status?: PaypalPlanStatus,
    billing_cycles: PaypalBillingCycle[],
    payment_preferences?: PaypalPaymentPreferences,
    taxes?: PaypalTaxes,
}

export type PaypalPlanResponse = {
    id: string,
    product_id: string,
    name: string,
    description?: string,
    status: PaypalPlanStatus,
    billing_cycles: PaypalBillingCycle[],
    payment_preferences?: PaypalPaymentPreferences,
    taxes?: PaypalTaxes,
    create_time: string,
    update_time: string,
}

// Subscription Types
export type PaypalShippingPreference = 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
export type PaypalUserAction = 'CONTINUE' | 'SUBSCRIBE_NOW';
export type PaypalPayerSelected = 'PAYPAL' | 'PAYPAL_CREDIT';
export type PaypalPayeePreferred = 'UNRESTRICTED' | 'IMMEDIATE_PAYMENT_REQUIRED';
export type PaypalSubscriptionStatus = 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';

export type PaypalSubscriberName = {
    given_name?: string,
    surname?: string,
}

export type PaypalFullName = {
    full_name?: string,
}

export type PaypalAddress = {
    address_line_1?: string,
    address_line_2?: string,
    admin_area_1?: string,
    admin_area_2?: string,
    postal_code?: string,
    country_code: string,
}

export type PaypalShippingAddress = {
    name?: PaypalFullName,
    address?: PaypalAddress,
}

export type PaypalSubscriber = {
    name?: PaypalSubscriberName,
    email_address?: string,
    shipping_address?: PaypalShippingAddress,
}

export type PaypalPaymentMethodPreference = {
    payer_selected?: PaypalPayerSelected,
    payee_preferred?: PaypalPayeePreferred,
}

export type PaypalApplicationContext = {
    brand_name?: string,
    locale?: string,
    shipping_preference?: PaypalShippingPreference,
    user_action?: PaypalUserAction,
    payment_method?: PaypalPaymentMethodPreference,
    return_url: string,
    cancel_url: string,
}

export type PaypalCreateSubscriptionInput = {
    plan_id: string,
    start_time?: string,
    quantity?: string,
    shipping_amount?: PaypalMoney,
    subscriber?: PaypalSubscriber,
    application_context?: PaypalApplicationContext,
}

export type PaypalSubscriptionLink = {
    href: string,
    rel: string,
    method?: string,
}

export type PaypalSubscriptionResponse = {
    id: string,
    plan_id: string,
    status: PaypalSubscriptionStatus,
    status_update_time?: string,
    start_time?: string,
    quantity?: string,
    subscriber?: PaypalSubscriber,
    create_time: string,
    links: PaypalSubscriptionLink[],
}