import chalk from 'chalk';
import { queryTrip, createLocation, createModes, createLocationFromInput } from './graphql-client.js';
import { testScenarios } from './test-scenarios.js';
import { analyzeResults } from './result-analyzer.js';
import { config, presets } from './config.js';
import { generateDebugUIUrl } from './debug-url-generator.js';

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const helpRequested = args.includes('--help') || args.includes('-h');

// Get scenario filter
const scenarioIndex = args.findIndex(arg => arg === '--scenario');
const scenarioFilter = scenarioIndex !== -1 && args[scenarioIndex + 1] ? args[scenarioIndex + 1] : null;

// Handle endpoint selection
if (args.includes('--deployed')) {
  config.baseUrl = presets.deployed;
} else if (args.includes('--localhost')) {
  config.baseUrl = presets.localhost;
}

// Handle API type selection
if (args.includes('--gtfs')) {
  config.apiType = 'gtfs';
} else if (args.includes('--transmodel')) {
  config.apiType = 'transmodel';
}

// Show help
if (helpRequested) {
  console.log(chalk.blue.bold('\n🚍 OTP GTFS-Flex Campus Shuttle Integration Tests\n'));
  console.log('Usage: npm test [options]\n');
  console.log('Options:');
  console.log('  --localhost     Use localhost:8080 (default)');
  console.log('  --deployed      Use deployed site (ctp-otp.etch.app)');
  console.log('  --gtfs          Use GTFS GraphQL API (default)');
  console.log('  --transmodel    Use Transmodel GraphQL API');
  console.log('  --verbose       Show detailed output');
  console.log('  --scenario ID   Run only the specified scenario');
  console.log('  --help, -h      Show this help message\n');
  console.log('Environment variables:');
  console.log('  OTP_BASE_URL    Set custom base URL');
  console.log('  OTP_API_TYPE    Set API type (gtfs or transmodel)\n');
  console.log('Examples:');
  console.log('  npm test --deployed --gtfs');
  console.log('  npm test --transmodel --verbose');
  console.log('  OTP_API_TYPE=transmodel npm test');
  console.log('  OTP_BASE_URL=http://example.com:8080 npm test\n');
  process.exit(0);
}

console.log(chalk.blue.bold('\n🚍 OTP GTFS-Flex Campus Shuttle Integration Tests'));
console.log(chalk.gray(`\n📍 Using endpoint: ${config.baseUrl}`));
console.log(chalk.gray(`🔗 API Type: ${config.apiType.toUpperCase()} GraphQL\n`));

async function runTest(scenario) {
  console.log(chalk.yellow(`\n▶ Test ${scenario.id}: ${scenario.name}`));
  console.log(chalk.gray(`  ${scenario.description}`));

  try {
    // Resolve locations (may involve geocoding)
    console.log(chalk.gray('  🌍 Resolving locations...'));

    const fromResult = await createLocationFromInput(scenario.from);
    const toResult = await createLocationFromInput(scenario.to);

    // Show resolved locations
    console.log(chalk.cyan(`  📍 From: ${fromResult.info.title}`));
    console.log(chalk.gray(`     ${fromResult.info.description}`));
    console.log(chalk.cyan(`  📍 To: ${toResult.info.title}`));
    console.log(chalk.gray(`     ${toResult.info.description}`));

    // Generate debug UI URL
    const debugUrl = generateDebugUIUrl(scenario, fromResult, toResult, config.baseUrl);
    console.log(chalk.magenta(`  🔗 Debug UI: ${debugUrl}`));

    // Prepare variables
    const variables = {
      from: fromResult.location,
      to: toResult.location,
      dateTime: scenario.dateTime,
      modes: createModes(scenario.modes),
      numTripPatterns: 5,
      arriveBy: false,
      wheelchairAccessible: false
    };

    // Add unpreferred settings if specified
    if (scenario.unpreferred) {
      variables.unpreferred = {
        agencies: scenario.unpreferred.agencies.map(id => ({ id }))
      };
      if (scenario.unpreferred.cost) {
        variables.unpreferred.cost = scenario.unpreferred.cost;
      }
    }

    // Add banned settings if specified
    if (scenario.banned) {
      variables.banned = {
        authorities: scenario.banned.authorities
      };
    }

    // Add walk reluctance if specified
    if (scenario.walkReluctance) {
      variables.walkReluctance = scenario.walkReluctance;
    }

    if (verbose) {
      console.log(chalk.gray('\n  Request variables:'));
      console.log(chalk.gray(JSON.stringify(variables, null, 2)));
    }

    // Make the request
    console.log(chalk.gray('  🚀 Making trip request...'));
    const response = await queryTrip(variables);

    if (verbose && response.data) {
      console.log(chalk.gray('\n  Response:'));
      console.log(chalk.gray(JSON.stringify(response.data, null, 2).substring(0, 500) + '...'));
    }

    // Analyze results
    const analysis = analyzeResults(scenario, response);

    // Print results
    if (analysis.success) {
      console.log(chalk.green(`  ✅ SUCCESS`));
    } else {
      console.log(chalk.red(`  ❌ FAILED`));
    }

    // Print summary
    console.log(chalk.cyan(`  📊 Summary:`));
    console.log(`     - Itineraries found: ${analysis.itineraryCount}`);
    console.log(`     - Flex legs found: ${analysis.flexLegsFound}`);
    console.log(`     - Has walk leg: ${analysis.hasWalkLeg}`);
    console.log(`     - Has transit leg: ${analysis.hasTransitLeg}`);
    console.log(`     - BNMC/Campus in names: ${analysis.flexInName}`);
    if (scenario.expected && scenario.expected.noStairsInWalkSteps) {
      console.log(`     - Has stairs in walk steps: ${analysis.hasStairsInWalkSteps}`);
    }
    if (scenario.expected && scenario.expected.requireValidGeometry) {
      console.log(`     - Geometry issues: ${analysis.geometryIssues?.length || 0}`);
    }

    // Print geometry issues
    if (analysis.geometryIssues && analysis.geometryIssues.length > 0) {
      console.log(chalk.yellow(`  🗺️  Geometry issues:`));
      analysis.geometryIssues.forEach(issue => {
        console.log(chalk.yellow(`     - ${issue.leg} (${issue.mode}): ${issue.issue}${issue.pointCount ? ` (${issue.pointCount} points)` : ''}`));
      });
    }

    // Print errors
    if (analysis.errors.length > 0) {
      console.log(chalk.red(`  ⚠️  Errors:`));
      analysis.errors.forEach(err => console.log(chalk.red(`     - ${err}`)));
    }

    // Print warnings
    if (analysis.warnings.length > 0) {
      console.log(chalk.yellow(`  ⚠️  Warnings:`));
      analysis.warnings.forEach(warn => console.log(chalk.yellow(`     - ${warn}`)));
    }

    // Print leg details for first three itineraries
    if (analysis.details.length > 0) {
      for (let i = 0; i < Math.min(3, analysis.details.length); i++) {
        const itinerary = analysis.details[i];
        if (itinerary.legs.length > 0) {
          const itineraryLabel = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
          console.log(chalk.cyan(`  🚶 Legs in ${itineraryLabel} itinerary:`));
          console.log(chalk.gray(`     Duration: ${Math.round(itinerary.duration / 60)}min, Distance: ${Math.round(itinerary.distance)}m`));
          itinerary.legs.forEach((leg, idx) => {
            const flexIndicator = leg.isFlexLeg ? chalk.green(' [FLEX]') : '';
            const stairsIndicator = leg.hasStairs ? chalk.red(' [STAIRS]') : '';
            const agencyIndicator = leg.agencyId ? chalk.blue(` (${leg.agencyId})`) : '';
            const geoIndicator = leg.geometryPointCount ? chalk.gray(` [${leg.geometryPointCount} pts]`) : '';
            console.log(`     ${idx + 1}. ${chalk.bold(leg.mode)}${flexIndicator}${stairsIndicator}${agencyIndicator}${geoIndicator}: ${leg.from} → ${leg.to}`);
            if (verbose) {
              console.log(`        Distance: ${Math.round(leg.distance)}m, Duration: ${Math.round(leg.duration / 60)}min`);
            }
          });
        }
      }
    }

    return analysis;
  } catch (error) {
    console.log(chalk.red(`  ❌ ERROR: ${error.message}`));
    return {
      success: false,
      errors: [error.message],
      scenarioId: scenario.id,
      scenarioName: scenario.name
    };
  }
}

async function main() {
  const results = [];

  // Filter scenarios if requested
  const scenarios = scenarioFilter
    ? testScenarios.filter(s => s.id === scenarioFilter)
    : testScenarios;

  if (scenarioFilter && scenarios.length === 0) {
    console.log(chalk.red(`\n❌ No scenario found with id: ${scenarioFilter}\n`));
    process.exit(1);
  }

  for (const scenario of scenarios) {
    const result = await runTest(scenario);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, config.testDelay));
  }

  // Print final summary
  console.log(chalk.blue.bold('\n\n📋 FINAL SUMMARY\n'));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total tests: ${results.length}`);
  console.log(chalk.green(`✅ Successful: ${successful}`));
  console.log(chalk.red(`❌ Failed: ${failed}`));

  // List failed tests
  if (failed > 0) {
    console.log(chalk.red('\nFailed tests:'));
    results.filter(r => !r.success).forEach(r => {
      const scenario = testScenarios.find(s => s.id === r.scenarioId);
      console.log(chalk.red(`  - ${scenario.name} (${scenario.id})`));
    });
  }

  // List successful tests with flex
  const flexSuccesses = results.filter(r => r.success && r.flexLegsFound > 0);
  if (flexSuccesses.length > 0) {
    console.log(chalk.green('\n✨ Tests with successful FLEX routing:'));
    flexSuccesses.forEach(r => {
      const scenario = testScenarios.find(s => s.id === r.scenarioId);
      console.log(chalk.green(`  - ${scenario.name} (${scenario.id})`));
    });
  }

  // List successful tests without flex (expected behavior)
  const noFlexSuccesses = results.filter(r => r.success && r.flexLegsFound === 0);
  if (noFlexSuccesses.length > 0) {
    console.log(chalk.yellow('\n⚠️  Tests successful but no FLEX routing (may be expected):'));
    noFlexSuccesses.forEach(r => {
      const scenario = testScenarios.find(s => s.id === r.scenarioId);
      console.log(chalk.yellow(`  - ${scenario.name} (${scenario.id})`));
    });
  }

  // Show detailed breakdown
  console.log(chalk.blue('\n📊 Detailed Results:'));
  results.forEach(r => {
    const scenario = testScenarios.find(s => s.id === r.scenarioId);
    const status = r.success ? '✅' : '❌';
    const flexInfo = r.flexLegsFound > 0 ? ` [${r.flexLegsFound} FLEX legs]` : '';
    console.log(`  ${status} ${scenario.name} (${scenario.id})${flexInfo}`);
  });

  console.log(chalk.blue('\n🏁 Test run complete!\n'));
}

// Run the tests
main().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});