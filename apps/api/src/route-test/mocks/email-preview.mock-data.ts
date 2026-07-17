import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';

export function createMockNewContactInput(userId: number): CreateUserContactInput {
  return {
    user_id: userId,
    contact_name: 'Jane Doe',
    contact_email: 'jane.doe@example.com',
    subject: 'Collaboration inquiry',
    message:
      'Hi! I came across your portfolio and would love to discuss a potential collaboration on an upcoming editorial shoot.\n\nAre you available for a quick call this week?\n\nBest,\nJane',
  };
}
