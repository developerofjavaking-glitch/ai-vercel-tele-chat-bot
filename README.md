# Vercel Telegram AI Chat Bot

## Deploy
1. Upload these files to a GitHub repository.
2. Import the repository at https://vercel.com/new.
3. In Vercel Project Settings → Environment Variables, add:
   - `TELEGRAM_BOT_TOKEN` = your new Telegram bot token
   - `OPENROUTER_API_KEY` = your OpenRouter API key
   - `TELEGRAM_WEBHOOK_SECRET` = a secret string you create (letters, digits, `_`, `-`)
4. Deploy or redeploy after adding variables.

## Telegram webhook
After deployment, the webhook endpoint is:
`https://YOUR-VERCEL-DOMAIN.vercel.app/api/webhook`

Set it using this URL in Chrome after replacing placeholders:
`https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/setWebhook?url=https%3A%2F%2FYOUR-VERCEL-DOMAIN.vercel.app%2Fapi%2Fwebhook&secret_token=YOUR_WEBHOOK_SECRET`

Do not share that final URL; it contains your bot token.

## Notes
- Uses OpenRouter model `openrouter/free`; availability and limits may vary.
- This starter bot does not store conversation history.
- If you exposed a bot token or API key, revoke/regenerate it before deployment.
