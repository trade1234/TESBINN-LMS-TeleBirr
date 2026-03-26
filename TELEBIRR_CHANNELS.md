## Telebirr Channels

This project supports two Telebirr channels that can coexist:

- `h5`
- `mini`

### Backend env naming

Shared fallback keys still work:

- `TELEBIRR_BASE_URL`
- `TELEBIRR_FABRIC_APP_ID`
- `TELEBIRR_APP_SECRET`
- `TELEBIRR_MERCHANT_APP_ID`
- `TELEBIRR_MERCHANT_CODE`
- `TELEBIRR_PRIVATE_KEY`
- `TELEBIRR_NOTIFY_URL`
- `TELEBIRR_REDIRECT_URL`

Channel-specific overrides are also supported:

- `TELEBIRR_H5_BASE_URL`
- `TELEBIRR_H5_WEB_BASE_URL`
- `TELEBIRR_H5_MERCHANT_APP_ID`
- `TELEBIRR_H5_PRIVATE_KEY`
- `TELEBIRR_MINI_BASE_URL`
- `TELEBIRR_MINI_WEB_BASE_URL`
- `TELEBIRR_MINI_MERCHANT_APP_ID`
- `TELEBIRR_MINI_PRIVATE_KEY`

Optional default:

- `TELEBIRR_DEFAULT_MODE=h5`
- `TELEBIRR_DEFAULT_MODE=mini`

### Frontend env naming

- `VITE_TELEBIRR_CHANNEL=h5`
- `VITE_TELEBIRR_CHANNEL=mini`
- `VITE_BUILD_BASE=/`
- `VITE_BUILD_BASE=./`

### Frontend build commands

- H5: `npm run build`
- Mini app conversion build: `npm run build:mini`

### Macle conversion

Use [macle.config.example.json](/c:/Users/Ordi/Desktop/TESBINN-fnal/TESBINN-LMS-TeleBirr-final/frontend/macle.config.example.json)
as a starting point for the converter configuration.
