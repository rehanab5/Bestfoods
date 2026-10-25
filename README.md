# Best Foods

Flutter app (iOS + Android) with a Supabase backend and Stripe payments.

## Backend setup (Supabase)

1. Create a Supabase project and link it: `supabase link --project-ref <ref>`.
2. `supabase db push`, then run `supabase/seed.sql` (menu items). Add your restaurant rows to `locations` (template in the seed file) via SQL or the in-app admin panel.
3. Enable anonymous sign-ins (Auth settings; also set in `supabase/config.toml`).
4. Set function secrets:
   `supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... WEBHOOK_SECRET=... RESEND_API_KEY=... FROM_EMAIL=...`
5. Deploy: `supabase functions deploy create-order stripe-webhook order-status-notification delete-account`.
6. Stripe: add a webhook to `<project>/functions/v1/stripe-webhook` for `payment_intent.succeeded` and `payment_intent.payment_failed`.
7. Supabase Database Webhook on `orders` UPDATE -> `order-status-notification`, with header `x-webhook-secret: <WEBHOOK_SECRET>`.
8. Admin: create an email/password user, then `update profiles set role='admin' where id='<user id>'`.
   In the app, long-press the title on the Settings screen to open the admin panel.

## Run

```
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://<ref>.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<publishable key> \
  --dart-define=STRIPE_PUBLISHABLE_KEY=pk_...
```

Build: `flutter build apk` / `flutter build ipa` (iOS requires macOS + Xcode).
