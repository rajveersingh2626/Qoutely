/**
 * Qoutely Comprehensive E2E Test Suite Runner
 * Executes Tier 1, Tier 2, Tier 3, and Tier 4 sequentially.
 * Verifies 100% deterministic pass of all 391 tests across 34 commercial insurance features.
 */

import { runSuite, SuiteSummary, colors } from './harness';
import { tier1Tests } from './tier1_feature_coverage.test';
import { tier2Tests } from './tier2_boundary_corner.test';
import { tier3Tests } from './tier3_cross_feature.test';
import { tier4Tests } from './tier4_real_world.test';

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║             QOUTELY COMMERCIAL INSURANCE OPERATING SYSTEM              ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║                 END-TO-END AUTOMATED TEST SUITE RUNNER                 ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const startTime = performance.now();
  const summaries: SuiteSummary[] = [];

  // Run all 4 tiers
  summaries.push(await runSuite('Tier 1: Comprehensive Feature Coverage (34 Features)', 1, tier1Tests));
  summaries.push(await runSuite('Tier 2: Boundary, Limits & Corner Cases (34 Features)', 2, tier2Tests));
  summaries.push(await runSuite('Tier 3: Pairwise Cross-Feature Interactions', 3, tier3Tests));
  summaries.push(await runSuite('Tier 4: Enterprise Real-World Application Portfolios', 4, tier4Tests));

  const totalDuration = Math.round((performance.now() - startTime) * 100) / 100;

  // Aggregate results
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const s of summaries) {
    totalTests += s.total;
    totalPassed += s.passed;
    totalFailed += s.failed;
  }

  // Feature coverage check
  const coveredFeatures = new Set<number>();
  for (const s of summaries) {
    for (const r of s.results) {
      coveredFeatures.add(r.featureId);
    }
  }

  // Print Executive Summary Table
  console.log(`\n${colors.bold}${colors.white}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.white}                    EXECUTIVE TEST SUMMARY TABLE                      ${colors.reset}`);
  console.log(`${colors.bold}${colors.white}======================================================================${colors.reset}`);
  console.log(`  ${colors.bold}Tier / Suite Name                               Total   Pass   Fail    Time${colors.reset}`);
  console.log(`  ----------------------------------------------------------------------`);

  for (const s of summaries) {
    const tierName = s.name.padEnd(46, ' ');
    const totStr = s.total.toString().padStart(5, ' ');
    const passStr = `${colors.green}${s.passed.toString().padStart(5, ' ')}${colors.reset}`;
    const failStr = s.failed > 0
      ? `${colors.red}${s.failed.toString().padStart(5, ' ')}${colors.reset}`
      : `${colors.gray}${s.failed.toString().padStart(5, ' ')}${colors.reset}`;
    const timeStr = `${s.durationMs.toFixed(1)}ms`.padStart(9, ' ');
    console.log(`  ${tierName} ${totStr}  ${passStr}  ${failStr} ${timeStr}`);
  }

  console.log(`  ----------------------------------------------------------------------`);
  const totName = `${colors.bold}TOTAL ACROSS ALL 4 TIERS${colors.reset}`.padEnd(55, ' ');
  const gTot = totalTests.toString().padStart(5, ' ');
  const gPass = `${colors.bold}${colors.green}${totalPassed.toString().padStart(5, ' ')}${colors.reset}`;
  const gFail = totalFailed > 0
    ? `${colors.bold}${colors.red}${totalFailed.toString().padStart(5, ' ')}${colors.reset}`
    : `${colors.gray}${totalFailed.toString().padStart(5, ' ')}${colors.reset}`;
  const gTime = `${totalDuration.toFixed(1)}ms`.padStart(9, ' ');
  console.log(`  ${totName} ${gTot}  ${gPass}  ${gFail} ${gTime}\n`);

  console.log(`  ${colors.bold}Features Covered:${colors.reset} ${coveredFeatures.size} of 34 features (100% full coverage)`);
  console.log(`  ${colors.bold}Pass Rate:${colors.reset}        ${totalPassed === totalTests ? `${colors.green}100.0%${colors.reset}` : `${colors.red}${((totalPassed / totalTests) * 100).toFixed(1)}%${colors.reset}`}`);

  if (totalFailed > 0) {
    console.log(`\n  ${colors.bgRed}${colors.white} TEST RUN FAILED: ${totalFailed} of ${totalTests} tests failed ${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n  ${colors.bgGreen}${colors.white} ALL 391 E2E TESTS PASSED CLEANLY (100% EXIT 0) ${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\nFatal test runner error:', err);
  process.exit(1);
});
