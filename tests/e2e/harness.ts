/**
 * Qoutely E2E Test Suite - Harness & Assertion Runner
 * Strictly deterministic, zero-dependency, ANSI-colored assertion framework.
 */

export interface TestCase {
  id: string;
  featureId: number;
  featureName: string;
  tier: 1 | 2 | 3 | 4;
  description: string;
  fn: () => void | Promise<void>;
}

export interface TestResult {
  id: string;
  featureId: number;
  featureName: string;
  tier: 1 | 2 | 3 | 4;
  description: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface SuiteSummary {
  name: string;
  tier: number;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

// ANSI escape codes for formatting
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
};

// Assertion Helpers
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`AssertionFailed: ${message}`);
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actual !== expected && actualStr !== expectedStr) {
    throw new Error(
      `AssertionFailed: Expected [${expectedStr}] but got [${actualStr}]${message ? ` - ${message}` : ''}`
    );
  }
}

export function assertCloseTo(actual: number, expected: number, delta: number = 0.01, message?: string): void {
  const diff = Math.abs(actual - expected);
  if (diff > delta) {
    throw new Error(
      `AssertionFailed: Expected ~${expected} (+/-${delta}) but got ${actual} (diff ${diff.toFixed(4)})${message ? ` - ${message}` : ''}`
    );
  }
}

export function assertGreaterOrEqual(actual: number, expected: number, message?: string): void {
  if (actual < expected) {
    throw new Error(
      `AssertionFailed: Expected ${actual} >= ${expected}${message ? ` - ${message}` : ''}`
    );
  }
}

export function assertLessOrEqual(actual: number, expected: number, message?: string): void {
  if (actual > expected) {
    throw new Error(
      `AssertionFailed: Expected ${actual} <= ${expected}${message ? ` - ${message}` : ''}`
    );
  }
}

export function assertMatch(actual: string, regex: RegExp, message?: string): void {
  if (!regex.test(actual)) {
    throw new Error(
      `AssertionFailed: String "${actual}" does not match pattern ${regex}${message ? ` - ${message}` : ''}`
    );
  }
}

export function assertThrows(fn: () => any, expectedErrorSubstring?: string, message?: string): void {
  let threw = false;
  let errorMsg = '';
  try {
    fn();
  } catch (err: any) {
    threw = true;
    errorMsg = err?.message || String(err);
  }
  if (!threw) {
    throw new Error(`AssertionFailed: Function was expected to throw but did not${message ? ` - ${message}` : ''}`);
  }
  if (expectedErrorSubstring && !errorMsg.toLowerCase().includes(expectedErrorSubstring.toLowerCase())) {
    throw new Error(
      `AssertionFailed: Expected error containing "${expectedErrorSubstring}" but got "${errorMsg}"${message ? ` - ${message}` : ''}`
    );
  }
}

export async function assertThrowsAsync(fn: () => Promise<any>, expectedErrorSubstring?: string, message?: string): Promise<void> {
  let threw = false;
  let errorMsg = '';
  try {
    await fn();
  } catch (err: any) {
    threw = true;
    errorMsg = err?.message || String(err);
  }
  if (!threw) {
    throw new Error(`AssertionFailed: Async function was expected to throw but did not${message ? ` - ${message}` : ''}`);
  }
  if (expectedErrorSubstring && !errorMsg.toLowerCase().includes(expectedErrorSubstring.toLowerCase())) {
    throw new Error(
      `AssertionFailed: Expected error containing "${expectedErrorSubstring}" but got "${errorMsg}"${message ? ` - ${message}` : ''}`
    );
  }
}

/**
 * Runner function for a suite of test cases
 */
export async function runSuite(suiteName: string, tier: 1 | 2 | 3 | 4, tests: TestCase[]): Promise<SuiteSummary> {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  RUNNING: ${suiteName} (Tier ${tier}) — ${tests.length} Tests${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}\n`);

  const results: TestResult[] = [];
  const startSuite = performance.now();
  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const startTest = performance.now();
    let passed = false;
    let error: string | undefined;

    try {
      const res = test.fn();
      if (res instanceof Promise) {
        await res;
      }
      passed = true;
      passedCount++;
    } catch (err: any) {
      passed = false;
      failedCount++;
      error = err?.message || String(err);
    }

    const durationMs = Math.round((performance.now() - startTest) * 100) / 100;
    results.push({
      id: test.id,
      featureId: test.featureId,
      featureName: test.featureName,
      tier: test.tier,
      description: test.description,
      passed,
      durationMs,
      error,
    });

    // Formatting test output
    const statusTag = passed
      ? `${colors.green}✓ PASS${colors.reset}`
      : `${colors.red}✗ FAIL${colors.reset}`;
    const testNum = `[${(i + 1).toString().padStart(3, ' ')}/${tests.length}]`;
    const fTag = `${colors.gray}[F${test.featureId.toString().padStart(2, '0')}]${colors.reset}`;

    if (!passed) {
      console.log(`  ${statusTag} ${testNum} ${fTag} ${colors.bold}${test.id}${colors.reset}: ${test.description} (${durationMs}ms)`);
      console.log(`         ${colors.red}Error: ${error}${colors.reset}`);
    } else if ((i + 1) % 25 === 0 || i === tests.length - 1 || tier >= 3) {
      console.log(`  ${statusTag} ${testNum} ${fTag} ${test.id}: ${test.description} (${durationMs}ms)`);
    }
  }

  const totalDurationMs = Math.round((performance.now() - startSuite) * 100) / 100;
  console.log(`\n  ${colors.bold}Suite Summary: ${suiteName}${colors.reset}`);
  console.log(`  Passed: ${colors.green}${passedCount}${colors.reset} / ${tests.length} | Failed: ${failedCount > 0 ? colors.red : colors.gray}${failedCount}${colors.reset} | Duration: ${totalDurationMs}ms\n`);

  return {
    name: suiteName,
    tier,
    total: tests.length,
    passed: passedCount,
    failed: failedCount,
    durationMs: totalDurationMs,
    results,
  };
}
