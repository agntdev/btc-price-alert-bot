# Crypto Price Alert Bot - GENERAL Design Document

## Summary
This Telegram bot monitors Bitcoin (BTC) price movements and sends alerts to a specified Telegram chat when the price changes by 10% or more from a reference point. Designed for individual cryptocurrency investors who want to track significant BTC price swings without constant manual monitoring. The bot uses a cryptocurrency price API for data and Telegram Bot API for notifications, maintaining a simple fixed-threshold alerting system.

## Core Entities
- **User**: Telegram account owner who configures and interacts with the bot
- **PriceRecord**: Tracks Bitcoin's last recorded price for change calculation
- **TelegramChat**: Stores chat ID and configuration for alert delivery
- **Alert**: Represents a triggered price movement event with metadata

Relationships:
```
User 1---1 TelegramChat
User 1---1 PriceRecord
PriceRecord 1---* Alert
TelegramChat 1---* Alert
```

## External Dependencies
- **Telegram Bot API**: 
  - Message sending (sendMessage)
  - Chat ID validation
- **Cryptocurrency Price API** (CoinGecko by default):
  - Real-time BTC price data
  - Market data endpoints
- **Persistence**:
  - Database for storing:
    - User configuration
    - Price records
    - Telegram chat associations
    - Alert history

## Full Feature List
- [ ] Bot initialization with API credential setup
- [ ] BTC price polling from configured API endpoint
- [ ] Percentage change calculation between current and reference price
- [ ] 10% threshold alert triggering (both positive and negative)
- [ ] Telegram message formatting with price change percentage
- [ ] Alert message delivery to pre-configured chat ID
- [ ] Reference price update after each alert trigger
- [ ] Error handling for API failures and network issues
- [ ] Basic command interface for user configuration (start, help)
- [ ] Alert history storage for 7-day retention
- [ ] Rate limiting for API requests (1 request/minute)

## Non-Goals
- Tracking any cryptocurrency other than Bitcoin
- User-configurable alert thresholds (fixed at 10%)
- Multi-chat alert distribution
- Historical price analysis or charting
- Scheduled alert times or recurring notifications
- Integration with trading platforms or wallets
- Mobile app or web interface components