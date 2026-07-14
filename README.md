# DWG Mobile Operations Center v1

Installable Delaware Weather Guy forecast dashboard using Rainbow Weather, NWS Delaware alerts, Netlify Functions, and Web Push notifications.

## Required Netlify environment variables

- `RAINBOW_API_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (example: `mailto:you@example.com`)

Netlify build settings are defined in `netlify.toml`.
