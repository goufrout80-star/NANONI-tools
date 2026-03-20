import { z } from 'zod'

export const WaitlistSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 
      'Name contains invalid characters'),

  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform(v => v.toLowerCase().trim()),

  role: z.string()
    .transform(v => v.toLowerCase())
    .pipe(z.enum([
      'designer', 'marketer', 'creator',
      'developer', 'founder', 'other'
    ], { errorMap: () => ({ message: 'Please select a role' }) })),

  source: z.string()
    .transform(v => v.toLowerCase())
    .pipe(z.enum([
      'twitter', 'instagram', 'linkedin',
      'tiktok', 'google', 'friend', 'other'
    ]))
    .optional()
    .default('other'),

  captchaToken: z.string()
    .min(1, 'Please complete the captcha'),
})

export const VerificationSchema = z.object({
  email: z.string().email(),
  code: z.string()
    .regex(/^NNN \d{4} \d{4}$/,
      'Invalid code format — use NNN XXXX XXXX')
})

export type WaitlistFormData = z.infer<typeof WaitlistSchema>
export type VerificationData = z.infer<typeof VerificationSchema>
