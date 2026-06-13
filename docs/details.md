# Crypto Price Alert Bot - DETAILS Design Document

## SCREENS

### 1. **Initial State Screen**
- **Trigger:** Bot startup or `/start` command when no chat ID is configured.
- **Message:**
  ```
  [[Welcome to BTC Alert Bot! Please provide your Telegram chat ID to receive 10% price movement alerts.]]
  ```
- **Keyboard:** None
- **Transitions:**
  - User provides chat ID → `Chat Setup Screen`
  - `/help` command → `Help Screen`

---

### 2. **Chat Setup Screen**
- **Trigger:** User provides chat ID or `/start` when chat ID is missing.
- **Message:**
  ```
  [[Please provide your Telegram chat ID (e.g., @username or numeric ID).]]
  ```
- **Keyboard:**
  ```
  [✅ Confirm Chat ID]  
  [ℹ️ How to find your chat ID]
  ```
- **Transitions:**
  - `✅ Confirm Chat ID` → Validate and store chat ID → `Monitoring Screen`
  - `ℹ️ How to find your chat ID` → `Chat ID Help Screen`
  - Invalid chat ID → `Error Screen` with message:
    ```
    [[Invalid Telegram chat ID format. Please use @username or numeric ID.]]
    ```

---

### 3. **Chat ID Help Screen**
- **Trigger:** User clicks `ℹ️ How to find your chat ID` from `Chat Setup Screen`.
- **Message:**
  ```
  [[To find your Telegram chat ID:
  1. Open Telegram.
  2. Go to your profile.
  3. Look for your username (e.g., @yourusername) or numeric ID.
  4. Enter it here to proceed.]]
  ```
- **Keyboard:**
  ```
  [⬅️ Back to Setup]
  ```
- **Transitions:**
  - `⬅️ Back to Setup` → `Chat Setup Screen`

---

### 4. **Monitoring Screen**
- **Trigger:** Bot is actively running and monitoring BTC price.
- **Message:** No visible message (bot runs in background).
- **Keyboard:** None
- **Transitions:**
  - 10%+ price change → `Alert Screen`
  - `/status` command → `Status Screen`
  - `/history` command → `History Screen`
  - API failure → `Error Screen`

---

### 5. **Alert Screen**
- **Trigger:** BTC price changes by 10% or more.
- **Message:**
  ```
  🚀 Bitcoin price increased by +12.3%! Current price: $68,420
  ```
  or
  ```
  ⚠️ Bitcoin price decreased by -10.5%. Current price: $58,200
  ```
- **Keyboard:** None
- **Transitions:**
  - Alert sent → Update reference price → Return to `Monitoring Screen`

---

### 6. **Status Screen**
- **Trigger:** `/status` command.
- **Message:**
  ```
  [[Current Configuration:
  - Reference Price: $65,000
  - Chat ID: @yourusername
  - Threshold: 10%
  - API: CoinGecko (active)]]
  ```
- **Keyboard:**
  ```
  [🔄 Refresh Status]  
  [⚙️ Reconfigure Chat]  
  [📜 View Alert History]
  ```
- **Transitions:**
  - `🔄 Refresh Status` → Re-fetch and display status
  - `⚙️ Reconfigure Chat` → `Chat Setup Screen`
  - `📜 View Alert History` → `History Screen`

---

### 7. **History Screen**
- **Trigger:** `/history` command or from `Status Screen`.
- **Message:**
  ```
  [[Alert History (Last 7 Days):
  1. 2023-09-25 14:30: +12.3% → $68,420
  2. 2023-09-24 09:15: -10.5% → $58,200]]
  ```
- **Keyboard:**
  ```
  [⬅️ Back to Status]
  ```
- **Transitions:**
  - `⬅️ Back to Status` → `Status Screen`

---

### 8. **Error Screen**
- **Trigger:** API failure, invalid chat ID, or unknown command.
- **Message:**
  ```
  [[Failed to fetch Bitcoin price. Retrying in 5 minutes...]]
  ```
- **Keyboard:**
  ```
  [🔁 Retry API Request]  
  [❌ Cancel and Exit]
  ```
- **Transitions:**
  - `🔁 Retry API Request` → Retry API call → `Monitoring Screen`
  - `❌ Cancel and Exit` → Exit to `Initial State Screen`

---

### 9. **Help Screen**
- **Trigger:** `/help` command.
- **Message:**
  ```
  [[Available commands:
  /start - Initialize bot setup
  /status - View current configuration
  /history - View alert history
  /help - Show this help message
  /setchat - Manually set Telegram chat ID (admin only)]]
  ```
- **Keyboard:** None
- **Transitions:**
  - `/start` → `Initial State Screen`
  - `/status` → `Status Screen`
  - `/history` → `History Screen`
  - `/setchat` → `Chat Setup Screen` (if admin)

---

## COMPONENTS

### 1. **Chat Setup Component**
- **Purpose:** Collect and validate user's Telegram chat ID.
- **Inputs:** Chat ID (string)
- **Validation:**
  - Must be a valid Telegram username (`@username`) or numeric ID.
- **Side Effects:**
  - Store chat ID in database.
  - Update `TelegramChat` entity.

---

### 2. **Price Monitoring Component**
- **Purpose:** Poll BTC price from API and calculate percentage change.
- **Inputs:** None (runs periodically)
- **Polling Interval:** Every 5 minutes
- **Side Effects:**
  - Store current price in `PriceRecord` entity.
  - Compare with reference price.
  - Trigger alert if change ≥ 10%.

---

### 3. **Alert Component**
- **Purpose:** Generate and send alert message to configured chat.
- **Inputs:** Current price, reference price, percentage change
- **Message Templates:**
  - `🚀 Bitcoin price increased by +{X}%! Current price: ${Y}`
  - `⚠️ Bitcoin price decreased by -{X}%. Current price: ${Y}`
- **Side Effects:**
  - Send message via Telegram Bot API.
  - Store alert in `Alert` entity.

---

### 4. **Status Component**
- **Purpose:** Display current bot configuration.
- **Inputs:** None
- **Outputs:**
  - Reference price
  - Chat ID
  - Threshold
  - API status
- **Side Effects:** None

---

### 5. **History Component**
- **Purpose:** Display alert history for the last 7 days.
- **Inputs:** None
- **Outputs:**
  - List of alerts with timestamp, percentage change, and price
- **Side Effects:** None

---

### 6. **Error Handling Component**
- **Purpose:** Handle API failures and invalid inputs.
- **Inputs:** Error type (e.g., API timeout, invalid chat ID)
- **Outputs:**
  - Error message
  - Retry or exit options
- **Side Effects:**
  - Retry API call after 5-minute cooldown.
  - Exit to `Initial State Screen` if user cancels.

---

## TRANSITIONS

| Current State | Input/Event | Next State | Side Effects |
|---------------|-------------|------------|--------------|
| Initial State | `/start` | Chat Setup | None |
| Chat Setup | Valid chat ID | Monitoring | Store chat ID |
| Chat Setup | Invalid chat ID | Error | Show error message |
| Chat Setup | `ℹ️ How to find your chat ID` | Chat ID Help | None |
| Chat ID Help | `⬅️ Back to Setup` | Chat Setup | None |
| Monitoring | 10%+ price change | Alert | Send alert, update reference price |
| Monitoring | `/status` | Status | None |
| Monitoring | `/history` | History | None |
| Monitoring | API failure | Error | Show error message |
| Status | `🔄 Refresh Status` | Status | Re-fetch status |
| Status | `⚙️ Reconfigure Chat` | Chat Setup | None |
| Status | `📜 View Alert History` | History | None |
| History | `⬅️ Back to Status` | Status | None |
| Error | `🔁 Retry API Request` | Monitoring | Retry API call |
| Error | `❌ Cancel and Exit` | Initial State | None |

---

## DATA

### Entities

#### 1. **User**
- **Fields:**
  - `id` (Primary Key)
  - `telegram_id` (Unique)
  - `is_admin` (Boolean)

#### 2. **TelegramChat**
- **Fields:**
  - `id` (Primary Key)
  - `chat_id` (String, Unique)
  - `user_id` (Foreign Key to User)

#### 3. **PriceRecord**
- **Fields:**
  - `id` (Primary Key)
  - `price` (Decimal)
  - `timestamp` (DateTime)
  - `user_id` (Foreign Key to User)

#### 4. **Alert**
- **Fields:**
  - `id` (Primary Key)
  - `percentage_change` (Decimal)
  - `price` (Decimal)
  - `timestamp` (DateTime)
  - `price_record_id` (Foreign Key to PriceRecord)
  - `chat_id` (Foreign Key to TelegramChat)

---

## Acceptance Notes

- **Initialization:** Bot must prompt for chat ID on first run or if chat ID is missing.
- **Chat Setup:** Must validate chat ID format and store it in the database.
- **Monitoring:** Must poll BTC price every 5 minutes and calculate percentage change.
- **Alert Trigger:** Must send alert to configured chat when price changes by ≥10%.
- **Reference Price Update:** Must update reference price after each alert.
- **Status Display:** Must show current configuration including reference price, chat ID, threshold, and API status.
- **History Display:** Must show alert history for the last 7 days with timestamps and price changes.
- **Error Handling:** Must retry API calls after 5-minute cooldown and allow user to cancel.
- **Command Interface:** Must support `/start`, `/status`, `/history`, `/help`, and `/setchat` commands.
- **Rate Limiting:** Must limit API requests to 1 per minute to avoid rate limiting.
- **Persistence:** Must store all relevant data in a database for continuity and history tracking.