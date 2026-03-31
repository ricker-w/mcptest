import { readFileSync } from 'node:fs';

/** A single test case parsed from JUnit XML */
export interface JUnitTestCase {
  name: string;
  classname: string;
  time: number;
  failure?: {
    message: string;
    type: string;
    body: string;
  };
}

/** A single test suite parsed from JUnit XML */
export interface JUnitSuite {
  name: string;
  tests: number;
  failures: number;
  cases: JUnitTestCase[];
}

/** Top-level structure of a parsed JUnit XML report */
export interface ParsedJUnit {
  totalTests: number;
  totalFailures: number;
  totalTime: number;
  suites: JUnitSuite[];
}

/**
 * Extracts the value of an XML attribute from a tag's attribute string.
 * Returns the empty string if the attribute is not found.
 */
function extractAttr(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1] ?? '';
}

/**
 * Parses a JUnit XML string into a structured object.
 * Uses regular expressions — no external dependencies.
 */
export function parseJUnitXml(xml: string): ParsedJUnit {
  // Extract testsuites-level totals
  const testsuitesMatch = xml.match(/<testsuites([^>]*)>/);
  const testsuitesAttrs = testsuitesMatch?.[1] ?? '';

  const totalTests = Number.parseInt(extractAttr(testsuitesAttrs, 'tests') || '0', 10);
  const totalFailures = Number.parseInt(extractAttr(testsuitesAttrs, 'failures') || '0', 10);
  const totalTime = Number.parseFloat(extractAttr(testsuitesAttrs, 'time') || '0');

  // Extract each testsuite block
  const suites: JUnitSuite[] = [];
  const suiteRegex = /<testsuite([^>]*)>([\s\S]*?)<\/testsuite>/g;

  for (const suiteMatch of xml.matchAll(suiteRegex)) {
    const suiteAttrs = suiteMatch[1] ?? '';
    const suiteBody = suiteMatch[2] ?? '';

    const suiteName = extractAttr(suiteAttrs, 'name');
    const suiteTests = Number.parseInt(extractAttr(suiteAttrs, 'tests') || '0', 10);
    const suiteFailures = Number.parseInt(extractAttr(suiteAttrs, 'failures') || '0', 10);

    // Extract test cases within this suite (both self-closing and with body)
    const cases: JUnitTestCase[] = [];
    const testcaseRegex = /<testcase([^>]*)>([\s\S]*?)<\/testcase>|<testcase([^>]*)\/>/g;

    for (const caseMatch of suiteBody.matchAll(testcaseRegex)) {
      const caseAttrs = caseMatch[1] ?? caseMatch[3] ?? '';
      const caseBody = caseMatch[2] ?? '';

      const caseName = extractAttr(caseAttrs, 'name');
      const classname = extractAttr(caseAttrs, 'classname');
      const time = Number.parseFloat(extractAttr(caseAttrs, 'time') || '0');

      // Check for a <failure> element inside the test case
      const failureMatch = caseBody.match(/<failure([^>]*)>([\s\S]*?)<\/failure>/);

      if (failureMatch) {
        const failureAttrs = failureMatch[1] ?? '';
        const failureBody = failureMatch[2] ?? '';
        cases.push({
          name: caseName,
          classname,
          time,
          failure: {
            message: extractAttr(failureAttrs, 'message'),
            type: extractAttr(failureAttrs, 'type'),
            body: failureBody.trim(),
          },
        });
      } else {
        cases.push({ name: caseName, classname, time });
      }
    }

    suites.push({ name: suiteName, tests: suiteTests, failures: suiteFailures, cases });
  }

  return { totalTests, totalFailures, totalTime, suites };
}

/**
 * Validates that the given JUnit XML string has the minimal expected structure.
 * Throws an Error with a descriptive message if the XML is invalid.
 */
export function assertJUnitValid(xml: string): void {
  if (!xml.includes('<testsuites')) {
    throw new Error('JUnit XML is missing the <testsuites> root element');
  }
  if (!xml.includes('</testsuites>')) {
    throw new Error('JUnit XML has an unclosed <testsuites> element');
  }
  if (!xml.includes('<testsuite')) {
    throw new Error('JUnit XML contains no <testsuite> elements');
  }
}

/**
 * Reads a JUnit XML file from the given path and returns the parsed structure.
 *
 * @param filePath - Absolute path to the JUnit XML report file
 */
export function readJUnitFile(filePath: string): ParsedJUnit {
  const xml = readFileSync(filePath, 'utf8');
  return parseJUnitXml(xml);
}
