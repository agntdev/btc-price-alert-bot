# Crypto Price Alert Bot - UX SPEC Document

## COMMAND TREE
| Command | Description | Permissions |
|---------|-------------|-------------|
| /start | Initialize bot setup or restart monitoring | All users |
| /status | Show current configuration (last price, chat ID) | Authenticated users |
| /history | View alert history (last 7 days) | Authenticated users |
| /help | Display available commands and usage | All users |
| /setchat | Manually set Telegram chat ID (for advanced users) | Admin users |

## DIALOG STATE MACHINE
**States:**
1. **Initial State**  
   - Waiting for /start command  
   - Checks if chat ID is already configured  

2. **Chat Setup**  
   - Prompts user for Telegram chat ID  
   - Validates chat ID format  
   - Transitions to Monitoring on successful setup  

3. **Monitoring**  
   - Periodically polls BTC price (every 5 mins)  
   - Calculates percentage change from reference price  
   - Triggers Alert state if ≥10% change detected  

4. **Alert State**  
   - Sends formatted alert to configured chat  
   - Updates reference price to current value  
   - Returns to Monitoring  

5. **History State**  
   - Displays list of alerts from the last 7 days  
   - Shows timestamp, percentage change, and price  

6. **Error State**  
   - Handles API failures, invalid chat IDs, or calculation errors  
   - Retries after 5-minute cooldown  

**Transitions:**  
`Initial → Chat Setup` (on missing chat ID)  
`Chat Setup → Monitoring` (valid chat ID)  
`Monitoring → Alert` (10%+ price change)  
`Monitoring → Error` (API failure)  
`Error → Monitoring` (after retry)  
`Monitoring → History` (on /history command)  
`History → Monitoring` (after viewing history)

## INLINE-KEYBOARD LAYOUT
**Chat Setup Screen**  
```
[✅ Confirm Chat ID]  
[ℹ️ How to find your chat ID]
```

**Status Screen**  
```
[🔄 Refresh Status]  
[⚙️ Reconfigure Chat]  
[📜 View Alert History]
```

**History Screen**  
```
[⬅️ Back to Status]
```

**Error Screen**  
```
[🔁 Retry API Request]  
[❌ Cancel and Exit]
```

## MESSAGE COPY & TONE
**Welcome Message**  
`"Welcome to BTC Alert Bot! Please provide your Telegram chat ID to receive 10% price movement alerts."`

**Alert Message**  
`"🚀 Bitcoin price increased by +12.3%! Current price: $68,420"`  
`"⚠️ Bitcoin price decreased by -10.5%. Current price: $58,200"`  

**Status Message**  
`"📊 Current Configuration:  
- Reference Price: $65,000  
- Chat ID: @yourusername  
- Threshold: 10%  
- API: CoinGecko (active)"`

**History Message**  
`"🗓️ Alert History (Last 7 Days):  
1. 2023-09-25 14:30: +12.3% → $68,420  
2. 2023-09-24 09:15: -10.5% → $58,200"`

**Error Message**  
`"⚠️ Failed to fetch Bitcoin price. Retrying in 5 minutes..."`

**Tone:**  
- Professional yet approachable  
- Uses emojis for visual clarity  
- Direct and action-oriented language  

## EDGE CASES
| Scenario | Bot Response |
|----------|--------------|
| Invalid chat ID | `"❌ Invalid Telegram chat ID format. Please use @username or numeric ID."` |
| API timeout | `"⚠️ Network error. Retrying in 5 minutes..."` |
| Unknown command | `"❓ Unknown command. Use /help to see available options."` |
| No price data | `"⚠️ No Bitcoin price data available. Check API status."` |
| No alert history | `"📭 No alerts in the last 7 days."` |
| Permission denied | `"🚫 You don't have permission to configure this bot."` |

## i18n STRINGS
**Translatable Strings (marked with `[[...]]**  
- `[[Welcome to BTC Alert Bot! Please provide your Telegram chat ID...]]`  
- `[[Bitcoin price changed by {+12.3%}! Current price: $68,420]]`  
- `[[Failed to fetch Bitcoin price. Retrying in 5 minutes...]]`  
- `[[Invalid Telegram chat ID format. Please use @username or numeric ID.]]`  
- `[[You don't have permission to configure this bot.]]`  
- `[[Current Configuration: - Reference Price: $65,000 - Chat ID: @yourusername - Threshold: 10% - API: CoinGecko (active)]]`  
- `[[Alert History (Last 7 Days): 1. 2023-09-25 14:30: +12.3% → $68,420 2. 2023-09-24 09:15: -10.5% → $58,200]]`  
- `[[No alerts in the last 7 days.]]`  

**Non-Translatable Elements:**  
- Technical terms (BTC, API names)  
- Percentage symbols (%)  
- Telegram-specific IDs (e.g., @username format)