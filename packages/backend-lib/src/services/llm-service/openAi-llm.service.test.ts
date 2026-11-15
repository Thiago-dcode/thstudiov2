const mockLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockCreate = jest.fn();

jest.mock('../log-service/factory-log.service', () => ({
  FactoryLogService: { createLogService: () => mockLog },
}));
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ responses: { create: mockCreate } })),
}));

import { OpenAILLMService } from './openAi-llm.service';

const PROMPT = 'SECRETPROMPT describe this private photo';
const OUTPUT = 'SECRETOUTPUT the model said this';

const request = { messages: [{ role: 'user', content: PROMPT }], maxTokens: 100, temperature: 0 } as any;
const service = () => new OpenAILLMService({ apiKey: 'sk-test', model: 'gpt-4o' } as any);

const okResponse = (over: Record<string, unknown> = {}) => ({
  status: 'completed',
  output_text: OUTPUT,
  output: [{ type: 'message', content: [{ type: 'output_text', text: OUTPUT }] }],
  usage: { input_tokens: 11, output_tokens: 22, total_tokens: 33 },
  _request_id: 'req_openai_1',
  ...over,
});

describe('OpenAILLMService logging', () => {
  beforeEach(() => {
    Object.values(mockLog).forEach((fn) => fn.mockReset());
    mockCreate.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-30: success logs "OpenAI call completed" with tokens, duration and the request id', async () => {
    mockCreate.mockResolvedValue(okResponse());
    await service().complete(request);
    expect(mockLog.info).toHaveBeenCalledTimes(1);
    const [message, fields] = mockLog.info.mock.calls[0];
    expect(message).toBe('OpenAI call completed');
    expect(fields).toMatchObject({
      model: 'gpt-4o', status: 'completed', input_tokens: 11, output_tokens: 22, openai_request_id: 'req_openai_1', refusal: false,
    });
    expect(typeof fields.duration_ms).toBe('number');
  });

  it('AC-30: an incomplete response logs warn "OpenAI call incomplete" with the reason', async () => {
    mockCreate.mockResolvedValue(okResponse({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }));
    await service().complete(request);
    expect(mockLog.warn).toHaveBeenCalledTimes(1);
    expect(mockLog.warn.mock.calls[0][0]).toBe('OpenAI call incomplete');
    expect(mockLog.warn.mock.calls[0][1]).toMatchObject({ incomplete_reason: 'max_output_tokens' });
    expect(mockLog.info).not.toHaveBeenCalled();
  });

  it('AC-30: a refusal sets refusal:true', async () => {
    mockCreate.mockResolvedValue(
      okResponse({ output_text: '', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }] }),
    );
    await service().complete(request);
    expect(mockLog.info.mock.calls[0][1].refusal).toBe(true);
  });

  it('AC-30: an APIError(429) logs error with http_status and rethrows', async () => {
    const failure = Object.assign(new Error('rate limited'), { name: 'RateLimitError', status: 429, requestID: 'req_fail' });
    mockCreate.mockRejectedValue(failure);
    await expect(service().complete(request)).rejects.toBe(failure);
    expect(mockLog.error).toHaveBeenCalledTimes(1);
    const [message, fields] = mockLog.error.mock.calls[0];
    expect(message).toBe('OpenAI call failed');
    expect(fields).toMatchObject({ model: 'gpt-4o', error_name: 'RateLimitError', http_status: 429, openai_request_id: 'req_fail' });
  });

  it('AC-30: a non-API error logs http_status null', async () => {
    mockCreate.mockRejectedValue(new TypeError('socket'));
    await expect(service().complete(request)).rejects.toThrow('socket');
    expect(mockLog.error.mock.calls[0][1]).toMatchObject({ error_name: 'TypeError', http_status: null });
  });

  it('AC-30: no line contains the prompt or the output text, and console.warn is never used', async () => {
    mockCreate.mockResolvedValue(okResponse({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }));
    await service().complete(request);
    mockCreate.mockResolvedValue(okResponse());
    await service().complete(request);
    mockCreate.mockRejectedValue(Object.assign(new Error(`bad ${'x'}`), { status: 400 }));
    await service().complete(request).catch(() => undefined);
    const dumped = JSON.stringify(Object.values(mockLog).map((fn) => fn.mock.calls));
    expect(dumped).not.toMatch(/SECRETPROMPT|SECRETOUTPUT/);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
