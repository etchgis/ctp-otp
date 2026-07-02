# OTP GTFS-Flex Integration Tests

This Node.js project tests the GTFS-Flex campus shuttle service implementation in OpenTripPlanner using either the GTFS GraphQL API or Transmodel GraphQL API.

## Prerequisites

- Node.js 14+ installed
- Access to either:
  - Local OTP instance on `http://localhost:8080`, OR
  - Deployed OTP instance at `https://ctp-otp.etch.app/`
- OTP must have:
  - FlexRouting enabled in `otp-config.json`
  - Graph built with the campus-shuttle-gtfs feed

## Installation

```bash
cd otp-flex-tests
npm install
```

## Running Tests

### Using Local OTP (default)
```bash
npm test                    # Run all tests (GTFS API, localhost)
npm run test:verbose        # Run with verbose output
npm run test:gtfs           # Explicitly use GTFS API
npm run test:transmodel     # Use Transmodel API
```

### Using Deployed OTP
```bash
npm run test:deployed           # Run against deployed site (GTFS API)
npm run test:deployed:verbose   # Deployed site with verbose output
npm run test:gtfs:deployed      # GTFS API on deployed site
npm run test:transmodel:deployed # Transmodel API on deployed site
```

### Custom Configuration
```bash
# Using environment variables
OTP_BASE_URL=http://example.com:8080 npm test
OTP_API_TYPE=transmodel npm test

# Show help
npm run help
```

### Command Line Options
- `--localhost` - Use localhost:8080 (default)
- `--deployed` - Use deployed site (ctp-otp.etch.app)
- `--gtfs` - Use GTFS GraphQL API (default)
- `--transmodel` - Use Transmodel GraphQL API
- `--verbose` - Show detailed output
- `--help`, `-h` - Show help message

### API Differences
- **GTFS API** (`/otp/gtfs/v1`) - Uses `plan` query with separate date/time parameters
- **Transmodel API** (`/otp/transmodel/v3`) - Uses `trip` query with ISO datetime format

Both APIs are automatically supported - the test suite converts between formats as needed.

## Test Scenarios

The full list lives in `test-scenarios.js`. Each scenario defines an origin/destination
(coordinates or a geocoded place name), a time of day, the requested modes, and expected
results. The scenarios cover:

- **Rail-Bus and Bus-Bus transfers** across the transit network
- **HDS flex** (Human-Driven Shuttle) combined with transit: Rail to HDS, Bus to HDS, HDS to Rail
- **BNMC campus zone** flex (within-zone, walk-to-zone, walk-from-zone)
- **UB shuttle** origin/destination pairs
- **Service hours** edge cases (early morning, after hours, weekend no-service)

### Dates

Scenarios store only a **time of day**; the date is computed at load time as the next upcoming
service day (weekday, or Saturday for weekend cases), with the correct America/New_York offset.
This keeps the suite valid over time instead of rotting to a fixed past date.

## Geocoding Support

The test suite now supports both coordinate pairs and place names/addresses:

### Coordinate Format
```javascript
from: { lat: 42.9046, lon: -78.8596 }
```

### Place Name/Address Format
```javascript
from: "Buffalo Niagara Medical Campus Innovation Center"
to: "200 Main Street, Buffalo, NY"
```

The geocoding service automatically resolves place names and addresses to coordinates using the Complete Trip geocoding API. Each test will show the resolved locations before making the trip request.

## Expected Results

Each scenario carries an `expected` block that the analyzer checks against. When the
GTFS-Flex service is working correctly:
- Flex scenarios show flex legs (look for "BNMC Campus Zone" or the shuttle zone in place names)
- Out-of-service scenarios (after hours, weekend) show no flex service, as expected
- The final summary lists which scenarios routed with flex and which did not

## Understanding the Output

Each test shows:
- ✅ SUCCESS or ❌ FAILED status
- Number of itineraries found
- Number of flex legs detected
- Presence of walk/transit legs
- Whether BNMC/Campus appears in place names
- Detailed leg information for the first itinerary

## Troubleshooting

If all tests fail:
1. Check that OTP is running on http://localhost:8080
2. Verify FlexRouting is enabled in otp-config.json
3. Confirm the graph was built with campus-shuttle-gtfs feed
4. Check the OTP logs for flex-related messages

## Project Structure

- `index.js` - Main test runner
- `graphql-client.js` - GraphQL client for Transmodel API
- `geocoder.js` - Geocoding service for address/place name resolution
- `config.js` - Configuration management for endpoints
- `test-scenarios.js` - Test case definitions (includes geocoded examples)
- `result-analyzer.js` - Response analysis logic