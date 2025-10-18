# Data Directory

This directory stores delegations data for automated subscription processing.

## Files

### `delegations.json`
Contains all active delegations exported from browser localStorage.

**Format:**
```json
[
  {
    "id": "delegation_123456",
    "delegator": "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C",
    "delegate": "0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f",
    "authority": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "caveats": [
      {
        "type": "erc20PeriodTransfer",
        "tokenAddress": "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698",
        "periodAmount": "10000000",
        "periodDuration": 604800,
        "startDate": 1234567890
      }
    ],
    "salt": "0x",
    "signature": "0xabcdef1234567890...",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### `delegations-state.json`
Stores the processing state (e.g., lastRedeemed timestamps) for each delegation.
This file is auto-generated and updated by the automated-subscriptions script.

## How to Export Delegations from Browser

### Method 1: Browser Console
1. Open the web app (http://localhost:3000)
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run this command:
```javascript
copy(localStorage.getItem('delegations'))
```
5. Paste the output into `data/delegations.json`

### Method 2: Export Feature (if implemented)
1. Go to http://localhost:3000/dashboard
2. Click "Export Delegations" button
3. Save the downloaded JSON file to `data/delegations.json`

### Method 3: Manual Creation
Create `data/delegations.json` manually with the format shown above.

## Running Automated Subscriptions

Once you have `delegations.json` in this directory, run:

```bash
npm run auto-subscriptions
```

The script will:
1. Read delegations from `delegations.json`
2. Check which ones are due for redemption
3. Process eligible delegations
4. Save state to `delegations-state.json`
5. Log results to `logs/automated-subscriptions.log`

## Notes

- The `data/` directory is gitignored to prevent committing sensitive delegation data
- Make sure delegations have valid signatures before processing
- Automated redemption requires proper wallet/bundler setup in Node.js environment
- For production, consider using a database instead of JSON files

