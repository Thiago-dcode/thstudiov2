import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { FactoryLogService } from '../../log-service';
import { FullPaypaAuthResponse, PaypalAuthResponse, PaypalCreateProductInput, PaypalPaymentConfig, PaypalProductResponse, PaypalCreatePlanInput, PaypalPlanResponse } from './types';
import { config } from '@repo/common-lib/config';


 class PaypalPaymentService {

  private readonly log = FactoryLogService.createLogService('file',{
    channel:'paypal',
});
    private authData:PaypalAuthResponse|null;
    
constructor(public readonly config:PaypalPaymentConfig){
    this.authData = null;
}
get auth():PaypalAuthResponse|null{
  return this.authData;
}
get isConnected():boolean{

    return this.authData && this.authData.expires_at > Date.now()?true:false;
}
public async  connect(){
    //Skip if the auth still valid
    if(this.isConnected) return this;
    try {
        const auth = Buffer.from(`${this.config.clientId}:${this.config.secretKey}`).toString("base64");
        const response = await fetch(`${this.config.url}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${auth}`,
          },
          body: "grant_type=client_credentials",
        });
        if(!response.ok){
            const errorBody = await response.text();
            this.log.error(`${response.status} ERROR CONNECTING TO PAYPAL`, {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                body: errorBody,
            });
            this.authData = null;
            return this;
        }
        const data:FullPaypaAuthResponse = await response.json();
       this.authData = {
        access_token: data.access_token,
        app_id: data.app_id,
        expires_at: Date.now() + data.expires_in * 1000,
        token_type: data.token_type
       }
       this.log.success(`SUCCESS CONNECTING TO PAYPAL`);
    } catch (error) {
        this.authData = null;
        console.log(`PAYPAL CONNECTION ERROR`, error);
        this.log.channel('paypal').error(`${error instanceof Error? error.name:''} ERROR CONNECTING TO PAYPAL `,{
            error: error instanceof Error ? error.message: '',
        });
        
    }
return this;
}
public async postRequest<T>( resource:string,body:Record<string,any>):Promise<T|null>{
  try {
    await this.connect();
    if (!this.auth) {
      this.log.error(`PAYPAL NOT AUTHENTICATED - Cannot POST ${resource}`);
      return null;
    }
    const response = await fetch(`${this.config.url}/${resource}`, {
      method: 'POST',
      headers: {
        'Authorization': `${this.auth.token_type} ${this.auth.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': await generateUUID(),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = await response.text();
      this.log.error(`${response.status} ERROR POST PAYPAL: ${resource}`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body: errorBody,
      });
      return null;
    }
    const data:T = await response.json();
    console.log(`PAYPAL POST REQUEST SUCCESS: ${resource}`, data);
    return data;

  } catch (error) {
    console.log(`ERROR PAYPAL POST REQUEST ${resource}`, error)
    this.log.error(`${error instanceof Error ? error.name : ''} ERROR POST PAYPAL: ${resource}`, {
      error: error instanceof Error ? error.message : '',
    });
    return null;
  }
}

get product(){
  return new PaypalProductService(this);
}

get plan(){
  return new PaypalPlanService(this);
}

}


class PaypalProductService {
  constructor(private readonly paypalService: PaypalPaymentService) {}

  public async create(body: PaypalCreateProductInput) {
    return await this.paypalService.postRequest<PaypalProductResponse>('v1/catalogs/products', body); 
  }
}

class PaypalPlanService {
  constructor(private readonly paypalService: PaypalPaymentService) {}

  public async create(body: PaypalCreatePlanInput) {
    return await this.paypalService.postRequest<PaypalPlanResponse>('v1/billing/plans', body);
  }
}


export const paypal =  new PaypalPaymentService(config().paypal).connect();