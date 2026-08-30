---
name: api-mail
description: >-
  Add a NestJS mailable and send email from a processor or service. Use when the
  user asked to send email, create a mailable in mails/, or wire MailService
  sendAsync/sendBatchAsync — not because a processor exists.
---

# API Recipe: Mail

Use when the user asked to send email. Mailables live in `mails/`. Prefer `MailService.sendAsync` / `sendBatchAsync` from the processor or service that owns the side effect. Do not add a wait-list-style mailer because a processor exists.

Reference: `apps/api/src/v1/modules/wait-list/` mails — copy only if this request includes email.

## After implementing

If this is a middle change (not a typo fix), follow `.agents/skills/api-verification/SKILL.md`.

## Related skills

- `.agents/skills/api-queue-processor/SKILL.md` — send from the job that owns the side effect
- `.agents/skills/api-service/SKILL.md` — only if the service owns the send
- `.agents/skills/full-api-module/SKILL.md` — composing this recipe with others
