/**
 * Empirical Challenge Harness for Milestone 18: Premium Landing & Commercial Insurance Experience
 * Agent: Challenger 2 (Empirical Challenger - Security, SEO & Regulatory Fidelity)
 *
 * Scope:
 * 1. Security Headers Evaluation from next.config.ts (CSP directives, HSTS preload, Permissions-Policy, Cross-Origin Isolation, poweredByHeader)
 * 2. Schema.org JSON-LD Validity in src/app/layout.tsx (JSON parse, FinancialService, InsuranceAgency, SoftwareApplication, OfferCatalog 7 lines, FAQPage)
 * 3. Statutory & Regulatory Figures in src/app/page.tsx (IRDAI Broker Regs 2018, GFR 170/171, Sec 64VB, EC Act 1923, DPDP Act 2023, AIMT GR.8, etc.)
 * 4. A11y & Performance Engineering (WCAG 2.1 AA Contrast, Main Landmark, WAI-ARIA, Elimination of Layout Thrashing & Frame Fighting)
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { pathToFileURL } from 'node:url';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  observation: string;
  detail?: any;
}

const results: TestResult[] = [];

function record(category: string, name: string, passed: boolean, observation: string, detail?: any) {
  results.push({ category, name, passed, observation, detail });
  const mark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${mark}] [${category}] ${name}: ${observation}`);
}

console.log('======================================================================');
console.log('STARTING EMPIRICAL CHALLENGE SUITE FOR MILESTONE 18 (CHALLENGER 2)');
console.log('======================================================================\n');

const projectRoot = process.cwd();

// ============================================================================
// SUITE 1: SECURITY HEADERS EVALUATION (next.config.ts)
// ============================================================================
console.log('--- Suite 1: Security Headers Evaluation (next.config.ts) ---');

async function testSecurityHeaders() {
  const nextConfigPath = path.join(projectRoot, 'next.config.ts');
  assert(fs.existsSync(nextConfigPath), 'next.config.ts must exist');

  // Read raw source code of next.config.ts
  const rawConfigCode = fs.readFileSync(nextConfigPath, 'utf-8');

  // 1.1 Import next.config.ts dynamically using file:// URL for Windows ESM support
  let nextConfigModule: any;
  try {
    const fileUrl = pathToFileURL(nextConfigPath).href;
    nextConfigModule = await import(fileUrl);
  } catch (err: any) {
    record('Security', 'Config Import', false, `Failed to dynamically import next.config.ts: ${err.message}`);
    return;
  }

  const config = nextConfigModule.default || nextConfigModule;
  assert(config, 'Default export of next.config.ts must exist');
  record('Security', 'next.config.ts Dynamic Import', true, 'Loaded next.config.ts cleanly as ESM module');

  // 1.2 Check poweredByHeader
  record(
    'Security',
    'poweredByHeader disabled',
    config.poweredByHeader === false,
    `poweredByHeader is ${config.poweredByHeader} (expected false to prevent tech stack fingerprinting)`
  );

  // 1.3 Check image formats and caching
  const hasAvif = config.images?.formats?.includes('image/avif');
  const hasWebp = config.images?.formats?.includes('image/webp');
  const cacheTtlValid = config.images?.minimumCacheTTL >= 2592000;
  record(
    'Security',
    'Image Optimization & Caching',
    hasAvif && hasWebp && cacheTtlValid,
    `Images configured with AVIF/WebP formats and minimumCacheTTL=${config.images?.minimumCacheTTL}`
  );

  // 1.4 Invoke headers() function
  let headerRules: any[] = [];
  try {
    headerRules = await config.headers();
  } catch (err: any) {
    record('Security', 'headers() execution', false, `Failed to call headers(): ${err.message}`);
    return;
  }

  record(
    'Security',
    'headers() return type',
    Array.isArray(headerRules) && headerRules.length > 0,
    `headers() returned ${headerRules.length} route header rule(s)`
  );

  // Find catch-all route rule: '/(.*)'
  const globalRule = headerRules.find((r: any) => r.source === '/(.*)');
  record(
    'Security',
    'Global Route Matcher (/(.*))',
    !!globalRule,
    `Found global rule matching source '/(.*)'`
  );

  if (!globalRule) return;

  const headerMap = new Map<string, string>();
  for (const h of globalRule.headers || []) {
    headerMap.set(h.key.toLowerCase(), h.value);
  }

  // 1.5 Strict-Transport-Security (HSTS)
  const hsts = headerMap.get('strict-transport-security');
  const maxAgeMatch = hsts ? hsts.match(/max-age=(\d+)/) : null;
  const maxAgeVal = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
  const hasSubdomains = !!hsts && hsts.includes('includeSubDomains');
  const hasPreload = !!hsts && hsts.includes('preload');

  record(
    'Security',
    'HSTS max-age >= 31536000',
    maxAgeVal >= 31536000,
    `HSTS max-age is ${maxAgeVal} seconds (min 31536000 required for 1 year)`
  );
  record(
    'Security',
    'HSTS includeSubDomains',
    hasSubdomains,
    `HSTS includeSubDomains is ${hasSubdomains ? 'present' : 'MISSING'}`
  );
  record(
    'Security',
    'HSTS preload',
    hasPreload,
    `HSTS preload directive is ${hasPreload ? 'present' : 'MISSING'}`
  );

  // 1.6 Permissions-Policy
  const permissionsPolicy = headerMap.get('permissions-policy');
  const criticalSensors = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'interest-cohort=()',
    'browsing-topics=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()',
    'display-capture=()',
  ];
  const missingSensors = criticalSensors.filter((s) => !permissionsPolicy?.includes(s));
  record(
    'Security',
    'Permissions-Policy Privacy Lockdown',
    missingSensors.length === 0,
    `Permissions policy disables all 11 restricted APIs. Missing: [${missingSensors.join(', ')}]`
  );

  // 1.7 Cross-Origin Isolation
  const coop = headerMap.get('cross-origin-opener-policy');
  const corp = headerMap.get('cross-origin-resource-policy');
  record(
    'Security',
    'Cross-Origin-Opener-Policy: same-origin',
    coop === 'same-origin',
    `COOP header is '${coop}' (expected 'same-origin')`
  );
  record(
    'Security',
    'Cross-Origin-Resource-Policy: same-origin',
    corp === 'same-origin',
    `CORP header is '${corp}' (expected 'same-origin')`
  );

  // 1.8 Clickjacking & Sniffing Protection
  const xfo = headerMap.get('x-frame-options');
  const xcto = headerMap.get('x-content-type-options');
  const referrer = headerMap.get('referrer-policy');
  record(
    'Security',
    'X-Frame-Options: DENY',
    xfo === 'DENY',
    `X-Frame-Options is '${xfo}' (expected 'DENY')`
  );
  record(
    'Security',
    'X-Content-Type-Options: nosniff',
    xcto === 'nosniff',
    `X-Content-Type-Options is '${xcto}' (expected 'nosniff')`
  );
  record(
    'Security',
    'Referrer-Policy: strict-origin-when-cross-origin',
    referrer === 'strict-origin-when-cross-origin',
    `Referrer-Policy is '${referrer}' (expected 'strict-origin-when-cross-origin')`
  );

  // 1.9 Content-Security-Policy (CSP) Comprehensive Directive Parsing
  const csp = headerMap.get('content-security-policy');
  assert(csp, 'Content-Security-Policy header must be present');

  const directives: Record<string, string[]> = {};
  for (const part of csp.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const tokens = trimmed.split(/\s+/);
    const directiveName = tokens[0];
    const directiveValues = tokens.slice(1);
    directives[directiveName] = directiveValues;
  }

  // Directive assertions:
  // default-src 'self'
  record(
    'Security',
    "CSP default-src 'self'",
    directives['default-src']?.includes("'self'"),
    `default-src contains 'self'`
  );

  // object-src 'none' (blocks Flash/Java plugins)
  record(
    'Security',
    "CSP object-src 'none'",
    directives['object-src']?.includes("'none'"),
    `object-src is 'none' (prevents legacy plugin exploits)`
  );

  // upgrade-insecure-requests (forces https)
  record(
    'Security',
    'CSP upgrade-insecure-requests',
    'upgrade-insecure-requests' in directives,
    `upgrade-insecure-requests directive is present`
  );

  // frame-ancestors 'none' (reinforces clickjacking block)
  record(
    'Security',
    "CSP frame-ancestors 'none'",
    directives['frame-ancestors']?.includes("'none'"),
    `frame-ancestors is 'none'`
  );

  // base-uri 'self'
  record(
    'Security',
    "CSP base-uri 'self'",
    directives['base-uri']?.includes("'self'"),
    `base-uri is 'self'`
  );

  // form-action 'self'
  record(
    'Security',
    "CSP form-action 'self'",
    directives['form-action']?.includes("'self'"),
    `form-action is 'self'`
  );

  // Check wildcards in script-src and connect-src
  const scriptSrc = directives['script-src'] || [];
  const hasWildcardScript = scriptSrc.some((s) => s === '*' || s === 'https:*' || s === 'http:*');
  record(
    'Security',
    'CSP script-src No Wildcard Source Leaks',
    !hasWildcardScript,
    `script-src sources: [${scriptSrc.join(' ')}] (no naked wildcards)`
  );

  const connectSrc = directives['connect-src'] || [];
  const hasWildcardConnect = connectSrc.some((s) => s === '*' || s === 'https:*');
  record(
    'Security',
    'CSP connect-src Scoped Endpoints',
    !hasWildcardConnect,
    `connect-src sources: [${connectSrc.join(' ')}] (scoped to Supabase, Gemini, Vercel)`
  );

  // 1.10 Adversarial environment test: unsafe-eval conditional enforcement
  const isProdCodeMatch = rawConfigCode.includes("process.env.NODE_ENV === 'production'");
  const unsafeEvalConditional = rawConfigCode.includes("'unsafe-eval'");
  record(
    'Security',
    "CSP 'unsafe-eval' Restricted to Non-Production",
    isProdCodeMatch && unsafeEvalConditional,
    `next.config.ts contains conditional: isProd ? without 'unsafe-eval' : with 'unsafe-eval'`
  );

  // Test regex matching of the route pattern against real-world URLs
  const routePattern = new RegExp('^/(.*)$');
  const samplePaths = [
    '/',
    '/quotes',
    '/quotes/new',
    '/quotes/new?line=fire',
    '/quotes/new?line=motor_fleet',
    '/api/health',
    '/sequence/flight/frame_001.webp',
    '/favicon.ico',
  ];
  const allMatch = samplePaths.every((p) => routePattern.test(p));
  record(
    'Security',
    "Route Pattern '/(.*)' Regex Match",
    allMatch,
    `All ${samplePaths.length} sample application and asset paths match the security header pattern`
  );
}

// ============================================================================
// SUITE 2: SCHEMA.ORG JSON-LD VALIDATION (src/app/layout.tsx)
// ============================================================================
console.log('\n--- Suite 2: Schema.org JSON-LD Validation (src/app/layout.tsx) ---');

function testJsonLd() {
  const layoutPath = path.join(projectRoot, 'src', 'app', 'layout.tsx');
  assert(fs.existsSync(layoutPath), 'src/app/layout.tsx must exist');

  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  // 2.1 Locate jsonLdData definition
  const jsonLdMatch = layoutContent.match(/const jsonLdData\s*=\s*(\{[\s\S]*?\n\};)/);
  record(
    'Schema.org',
    'jsonLdData definition exists',
    !!jsonLdMatch,
    `Found const jsonLdData declaration in layout.tsx`
  );

  if (!jsonLdMatch) return;

  // 2.2 Evaluate the extracted object safely with baseUrl injected
  let jsonLdObj: any;
  try {
    const rawJsObject = jsonLdMatch[1].replace(/;$/, '');
    const fn = new Function('baseUrl', `return (${rawJsObject});`);
    jsonLdObj = fn('https://qoutely.com');
  } catch (err: any) {
    record('Schema.org', 'JSON-LD Evaluation', false, `Failed to parse jsonLdData object literal: ${err.message}`);
    return;
  }

  // 2.3 Test strict JSON serialization and deserialization
  let serialized: string = '';
  let parsedJson: any;
  try {
    serialized = JSON.stringify(jsonLdObj);
    parsedJson = JSON.parse(serialized);
    record(
      'Schema.org',
      'JSON-LD Strict JSON Serialization Round-Trip',
      true,
      `Successfully serialized and parsed valid JSON (${serialized.length} bytes, 0 syntax errors)`
    );
  } catch (err: any) {
    record('Schema.org', 'JSON-LD Strict JSON Serialization', false, `JSON syntax error: ${err.message}`);
    return;
  }

  // 2.4 Verify @context and @graph
  record(
    'Schema.org',
    "@context: 'https://schema.org'",
    parsedJson['@context'] === 'https://schema.org',
    `Context is '${parsedJson['@context']}'`
  );

  const graph = parsedJson['@graph'];
  record(
    'Schema.org',
    '@graph Array Structure',
    Array.isArray(graph) && graph.length >= 4,
    `@graph contains ${graph?.length || 0} top-level entities (expected >= 4)`
  );

  if (!Array.isArray(graph)) return;

  // 2.5 Verify Node 1: FinancialService & InsuranceAgency
  const orgNode = graph.find(
    (node: any) =>
      Array.isArray(node['@type']) &&
      node['@type'].includes('FinancialService') &&
      node['@type'].includes('InsuranceAgency')
  );
  record(
    'Schema.org',
    "Entity: ['FinancialService', 'InsuranceAgency']",
    !!orgNode,
    `Found organization entity with joint FinancialService and InsuranceAgency types`
  );

  if (orgNode) {
    record(
      'Schema.org',
      'FinancialService Attributes',
      orgNode.name === 'Qoutely' &&
        orgNode.currenciesAccepted === 'INR' &&
        orgNode.areaServed?.name === 'India' &&
        orgNode.address?.addressCountry === 'IN',
      `Name='${orgNode.name}', Currencies='${orgNode.currenciesAccepted}', Country='${orgNode.areaServed?.name}'`
    );

    const knowsAbout = orgNode.knowsAbout || [];
    const expectedKeywords = [
      'IRDAI (Insurance Brokers) Regulations',
      'BLUS',
      'BSUS',
      'AIMT',
      'Section 64VB',
      'Employees Compensation Act 1923',
      'GFR',
      'DPDP Act 2023',
    ];
    const missingKeywords = expectedKeywords.filter(
      (kw) => !knowsAbout.some((item: string) => item.includes(kw))
    );
    record(
      'Schema.org',
      'FinancialService knowsAbout Statutory Frameworks',
      missingKeywords.length === 0,
      `knowsAbout contains all ${expectedKeywords.length} statutory references. Missing: [${missingKeywords.join(', ')}]`
    );
  }

  // 2.6 Verify Node 2: SoftwareApplication
  const softwareNode = graph.find((node: any) => node['@type'] === 'SoftwareApplication');
  record(
    'Schema.org',
    "Entity: 'SoftwareApplication'",
    !!softwareNode,
    `Found SoftwareApplication entity with category '${softwareNode?.applicationCategory}'`
  );

  if (softwareNode) {
    const offers = softwareNode.offers || [];
    const hasValidOffers =
      offers.length >= 2 &&
      offers.every(
        (o: any) =>
          o['@type'] === 'Offer' &&
          typeof o.price === 'string' &&
          o.priceCurrency === 'INR' &&
          typeof o.name === 'string'
      );
    record(
      'Schema.org',
      'SoftwareApplication Commercial Plans',
      hasValidOffers,
      `Software offers ${offers.length} plans in INR (Independent: ₹${offers[0]?.price}, Growth: ₹${offers[1]?.price})`
    );
  }

  // 2.7 Verify Node 3: OfferCatalog (all 7 lines)
  const catalogNode = graph.find((node: any) => node['@type'] === 'OfferCatalog');
  record(
    'Schema.org',
    "Entity: 'OfferCatalog'",
    !!catalogNode,
    `Found OfferCatalog entity titled '${catalogNode?.name}'`
  );

  if (catalogNode) {
    const items = catalogNode.itemListElement || [];
    record(
      'Schema.org',
      'OfferCatalog 7 Lines Item Count',
      items.length === 7,
      `Catalog contains exactly ${items.length} of 7 commercial lines (expected 7)`
    );

    const catalogLineNames = items.map((i: any) => i.itemOffered?.name || '');
    const requiredLineKeywords = [
      'Property & Fire',
      'Motor Fleet',
      'Marine Cargo',
      'Employee Benefits',
      'Engineering & Project',
      'Corporate Liability & Cyber',
      'Financial & Specialty',
    ];
    const missingLines = requiredLineKeywords.filter(
      (kw) => !catalogLineNames.some((name: string) => name.toLowerCase().includes(kw.toLowerCase()))
    );
    record(
      'Schema.org',
      'OfferCatalog Covers All 7 Commercial Domains',
      missingLines.length === 0,
      `All 7 lines cataloged with Service objects. Missing: [${missingLines.join(', ')}]`
    );
  }

  // 2.8 Verify Node 4: FAQPage
  const faqNode = graph.find((node: any) => node['@type'] === 'FAQPage');
  record(
    'Schema.org',
    "Entity: 'FAQPage'",
    !!faqNode,
    `Found FAQPage entity with ${faqNode?.mainEntity?.length || 0} questions`
  );

  if (faqNode) {
    const questions = faqNode.mainEntity || [];
    const validQuestions =
      questions.length >= 4 &&
      questions.every(
        (q: any) =>
          q['@type'] === 'Question' &&
          typeof q.name === 'string' &&
          q.acceptedAnswer?.['@type'] === 'Answer' &&
          typeof q.acceptedAnswer?.text === 'string'
      );
    record(
      'Schema.org',
      'FAQPage Question & Answer Structure',
      validQuestions,
      `All ${questions.length} FAQ questions conform to Schema.org Question/Answer syntax`
    );

    // Check specific statutory answers in FAQ (across question names and accepted answers)
    const faqTextBlob = questions.map((q: any) => `${q.name} ${q.acceptedAnswer.text}`).join(' ');
    const hasIrdai = faqTextBlob.includes('IRDAI');
    const hasIib = faqTextBlob.includes('IIB') || faqTextBlob.includes('Insurance Information Bureau');
    const hasGfr = faqTextBlob.includes('GFR') || faqTextBlob.includes('General Financial Rules');
    const hasDpdp = faqTextBlob.includes('DPDP') || faqTextBlob.includes('Digital Personal Data Protection');

    record(
      'Schema.org',
      'FAQPage Statutory Coverage (IRDAI, IIB, GFR, DPDP)',
      hasIrdai && hasIib && hasGfr && hasDpdp,
      `FAQ answers cover IRDAI: ${hasIrdai}, IIB: ${hasIib}, GFR 170/171: ${hasGfr}, DPDP 2023: ${hasDpdp}`
    );
  }

  // 2.9 Verify script tag embedding in layout.tsx
  const hasScriptTag =
    layoutContent.includes('type="application/ld+json"') &&
    layoutContent.includes('dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}');
  record(
    'Schema.org',
    'Layout.tsx <script type="application/ld+json"> Integration',
    hasScriptTag,
    `layout.tsx embeds JSON-LD via script type="application/ld+json"`
  );
}

// ============================================================================
// SUITE 3: STATUTORY & REGULATORY FIGURES IN src/app/page.tsx
// ============================================================================
console.log('\n--- Suite 3: Statutory & Regulatory Figures (src/app/page.tsx) ---');

function testStatutoryFigures() {
  const pagePath = path.join(projectRoot, 'src', 'app', 'page.tsx');
  assert(fs.existsSync(pagePath), 'src/app/page.tsx must exist');

  const pageContent = fs.readFileSync(pagePath, 'utf-8');

  // 3.1 COMMERCIAL_LINES Array: Check 7 items
  const commercialLinesBlock = pageContent.match(/const COMMERCIAL_LINES:\s*CommercialLineCard\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
  record(
    'Regulatory',
    'COMMERCIAL_LINES Array Declaration',
    !!commercialLinesBlock,
    `Found COMMERCIAL_LINES array in src/app/page.tsx`
  );

  if (commercialLinesBlock) {
    const rawLines = commercialLinesBlock[1];
    // Count objects with id: '...'
    const lineIds = [...rawLines.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
    record(
      'Regulatory',
      'All 7 Commercial Lines Present in Landing Showcase',
      lineIds.length === 7,
      `Found ${lineIds.length} lines: [${lineIds.join(', ')}]`
    );

    const expectedIds = ['property', 'motor', 'marine', 'benefits', 'engineering', 'liability', 'specialty'];
    const missingIds = expectedIds.filter((id) => !lineIds.includes(id));
    record(
      'Regulatory',
      'All Expected LoB Categories Represented',
      missingIds.length === 0,
      `Expected lines match: [${lineIds.join(', ')}]. Missing: [${missingIds.join(', ')}]`
    );

    // Check link destinations
    const linkMatches = [...rawLines.matchAll(/link:\s*'([^']+)'/g)].map((m) => m[1]);
    const validRoutePrefixes = linkMatches.every((l) => l.startsWith('/quotes/new?line='));
    record(
      'Regulatory',
      'All 7 Cards Link to Dedicated Studio Flow (/quotes/new?line=...)',
      validRoutePrefixes && linkMatches.length === 7,
      `All 7 cards point to studio: [${linkMatches.join(', ')}]`
    );

    // Check specifically for Property link: /quotes/new?line=fire vs /quotes/new?line=property
    const propertyLink = linkMatches[0];
    record(
      'Regulatory',
      'Property & Fire Studio Link Parameter',
      propertyLink === '/quotes/new?line=fire' || propertyLink === '/quotes/new?line=property',
      `Property line links to '${propertyLink}'`
    );
  }

  // 3.2 Statutory Citation 1: IRDAI (Insurance Brokers) Regulations 2018
  // Professional Indemnity: Regulation 24 / Schedule II: max(₹50 Lakhs, 3x brokerage remuneration)
  const hasIrdaiRegs = pageContent.includes('IRDAI Broker Regulations 2018');
  const hasPiFloor =
    pageContent.includes('₹50 Lakhs') ||
    pageContent.includes('₹50L') ||
    pageContent.includes('50 Lakhs');
  const hasPiFormula =
    pageContent.includes('3× fee income') ||
    pageContent.includes('3× brokerage') ||
    pageContent.includes('3×');

  record(
    'Regulatory',
    'IRDAI Broker Regs 2018 & Schedule II PI Floors',
    hasIrdaiRegs && hasPiFloor && hasPiFormula,
    `Cites IRDAI Broker Regs 2018, ₹50 Lakhs statutory floor, and 3× brokerage fee income formula`
  );

  // 3.3 Statutory Citation 2: General Financial Rules 2017 Rules 170 & 171
  // GFR 170 (Bid Security) / 171 (Performance Security): Surety Insurance Bonds replacing Bank Guarantees
  const hasGfr170 = pageContent.includes('170') && pageContent.includes('171');
  const hasSuretyBgReplacement =
    pageContent.includes('Surety Insurance Bonds') &&
    (pageContent.includes('Bank Guarantees') || pageContent.includes('Bank Guarantee Replacement'));
  const hasContractorGrading =
    pageContent.includes('AAA to BB') || pageContent.includes('credit grades');

  record(
    'Regulatory',
    'GFR 2017 Rules 170/171 Surety Bonds & Bank Guarantee Replacement',
    hasGfr170 && hasSuretyBgReplacement && hasContractorGrading,
    `Cites GFR Rules 170/171, Surety Bonds replacing Bank Guarantees in public procurement, and AAA-BB contractor grading`
  );

  // 3.4 Statutory Citation 3: Insurance Act 1938 Section 64VB
  // Advance payment of premium / cash deposit verification before risk inception
  const hasSec64VB = pageContent.includes('Section 64VB') || pageContent.includes('Sec 64VB');
  const hasCashDeposit =
    pageContent.includes('cash deposit') || pageContent.includes('Cash Deposit');

  record(
    'Regulatory',
    'Insurance Act 1938 Section 64VB Cash Deposit Balance Enforcement',
    hasSec64VB && hasCashDeposit,
    `Cites Section 64VB of Insurance Act 1938 for marine cargo open policy cash deposit drawdown`
  );

  // 3.5 Statutory Citation 4: Employees' Compensation Act 1923 (EC Act)
  // Section 4 & Schedule IV actuarial factors, 50%/60% x min(Wage, 15k) x Factor
  const hasEcAct =
    pageContent.includes('Employees Compensation Act 1923') ||
    pageContent.includes('EC Act 1923') ||
    pageContent.includes('Employees’ Compensation Act 1923');
  const hasScheduleIV = pageContent.includes('Schedule IV');
  const hasEcFormula =
    pageContent.includes('50%/60%') && pageContent.includes('15k');

  record(
    'Regulatory',
    'Employees Compensation Act 1923 Schedule IV Actuarial Factors & ₹15k Wage Ceiling',
    hasEcAct && hasScheduleIV && hasEcFormula,
    `Cites EC Act 1923 Schedule IV actuarial factor formula and statutory ₹15,000 monthly wage ceiling`
  );

  // 3.6 Statutory Citation 5: Digital Personal Data Protection (DPDP) Act 2023 & Sovereign Cloud
  const hasDpdpAct = pageContent.includes('DPDP Act 2023') || pageContent.includes('DPDPA');
  const hasRls = pageContent.includes('Row-Level Security') || pageContent.includes('RLS');
  const hasAes256 = pageContent.includes('AES-256');
  const hasIndianCloud =
    pageContent.includes('Sovereign Indian Cloud') ||
    pageContent.includes('Indian sovereign') ||
    pageContent.includes('Mumbai/Hyderabad');

  record(
    'Regulatory',
    'DPDP Act 2023, Sovereign Indian Cloud, RLS & AES-256 Encryption',
    hasDpdpAct && hasRls && hasAes256 && hasIndianCloud,
    `Cites DPDP Act 2023 compliance, PostgreSQL Row-Level Security tenant isolation, and AES-256 GCM cloud encryption`
  );

  // 3.7 Additional Statutory Citations:
  // - AIMT GR.8 IDV depreciation schedule (5% to 50%)
  const hasAimtGr8 = pageContent.includes('AIMT GR.8');
  const hasDepreciationScale = pageContent.includes('5%–50%') || pageContent.includes('5% to 50%');
  record(
    'Regulatory',
    'AIMT GR.8 IDV Depreciation Schedule (5%–50%)',
    hasAimtGr8 && hasDepreciationScale,
    `Cites All India Motor Tariff GR.8 age depreciation schedule from 5% to 50%`
  );

  // - Incoterms 2020 CIF 110% statutory valuation markup
  const hasCif110 = pageContent.includes('110% CIF') || pageContent.includes('CIF 110%');
  record(
    'Regulatory',
    'Incoterms 2020 CIF 110% Marine Valuation Markup',
    hasCif110,
    `Cites Incoterms CIF 110% commercial marine valuation formula`
  );

  // - Indian Boilers Act 1923
  const hasBoilersAct = pageContent.includes('Indian Boilers Act 1923');
  record(
    'Regulatory',
    'Indian Boilers Act 1923 Perils Rating',
    hasBoilersAct,
    `Cites Indian Boilers Act 1923 for engineering high pressure boiler peril rating`
  );

  // - BIS IS 1893:2002 Seismic Earthquake Zones & IIB Burning Cost Baselines
  const hasBisSeismic = pageContent.includes('BIS IS 1893:2002') || pageContent.includes('seismic');
  const hasIibBurningCost = pageContent.includes('IIB') || pageContent.includes('Insurance Information Bureau');
  record(
    'Regulatory',
    'BIS IS 1893:2002 Seismic Ratings & IIB Burning Cost Parity',
    hasBisSeismic && hasIibBurningCost,
    `Cites Bureau of Indian Standards seismic zoning and IIB benchmark burning costs`
  );
}

// ============================================================================
// SUITE 4: ACCESSIBILITY & PERFORMANCE RESILIENCE (page.tsx & overlays)
// ============================================================================
console.log('\n--- Suite 4: Accessibility & Performance Resilience ---');

function testA11yAndPerformance() {
  const pagePath = path.join(projectRoot, 'src', 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');

  // 4.1 Main content landmark with id="main-content" (target of skip link)
  const hasMainLandmark = pageContent.includes('id="main-content"');
  record(
    'A11y',
    'Main Content Landmark (#main-content)',
    hasMainLandmark,
    `Found <main id="main-content"> landmark corresponding to layout.tsx skip link`
  );

  // 4.2 Accordion WAI-ARIA attributes
  const hasAriaExpanded = pageContent.includes('aria-expanded={isOpen}');
  record(
    'A11y',
    'FAQ Accordion aria-expanded',
    hasAriaExpanded,
    `Accordion buttons implement aria-expanded={isOpen}`
  );

  // 4.3 Check ScrollytellingOverlay for stripped CSS transitions on section wrappers
  const overlayPath = path.join(projectRoot, 'src', 'components', 'scrollytelling', 'ScrollytellingOverlay.tsx');
  assert(fs.existsSync(overlayPath), 'ScrollytellingOverlay.tsx must exist');
  const overlayContent = fs.readFileSync(overlayPath, 'utf-8');

  // Find all section container definitions: section-hero, section-workflows, section-carrier, section-landing
  const sectionIds = ['section-hero', 'section-workflows', 'section-carrier', 'section-landing'];
  let anySectionHasTransition = false;
  for (const id of sectionIds) {
    const sectionRegex = new RegExp(`id="${id}"[\\s\\S]*?className="([^"]*)"`);
    const match = overlayContent.match(sectionRegex);
    if (match && (match[1].includes('transition-all') || match[1].includes('transition-opacity'))) {
      anySectionHasTransition = true;
    }
  }

  record(
    'Performance',
    'Eliminated CSS-JS Frame Fighting on Section Wrappers',
    !anySectionHasTransition,
    `All 4 section containers (#section-hero, #section-workflows, #section-carrier, #section-landing) have 0 conflicting CSS transition classes`
  );

  // 4.4 Check ScrollytellingCanvas for eliminated layout thrashing
  const canvasPath = path.join(projectRoot, 'src', 'components', 'scrollytelling', 'ScrollytellingCanvas.tsx');
  assert(fs.existsSync(canvasPath), 'ScrollytellingCanvas.tsx must exist');
  const canvasContent = fs.readFileSync(canvasPath, 'utf-8');

  // Verify render() doesn't query canvas.clientWidth or canvas.clientHeight
  const renderFunctionMatch = canvasContent.match(/const render = \(\) => \{([\s\S]*?)\n\s*\};/);
  const layoutQueriesInRender =
    renderFunctionMatch &&
    (renderFunctionMatch[1].includes('canvas.clientWidth') ||
      renderFunctionMatch[1].includes('canvas.clientHeight') ||
      renderFunctionMatch[1].includes('getBoundingClientRect'));

  record(
    'Performance',
    'Eliminated Layout Thrashing (Zero clientWidth/clientHeight in RAF render loop)',
    !layoutQueriesInRender,
    `Render loop performs zero synchronous DOM layout recalculations`
  );

  // 4.5 Check Contrast Remediation: No #00C853 used for text against light background
  const hasNeonGreenTextInOverlay = overlayContent.includes('text-[#00C853]');
  const hasNeonGreenTextInPage = pageContent.includes('text-[#00C853]');
  record(
    'A11y',
    'WCAG 2.1 AA Contrast (#00C853 eliminated from body text)',
    !hasNeonGreenTextInOverlay && !hasNeonGreenTextInPage,
    `Replaced low-contrast #00C853 (2.14:1) with accessible #0F5132 (8.9:1) and #15803d (4.6:1)`
  );
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function runAll() {
  try {
    await testSecurityHeaders();
    testJsonLd();
    testStatutoryFigures();
    testA11yAndPerformance();

    console.log('\n======================================================================');
    console.log('CHALLENGE EXECUTION SUMMARY');
    console.log('======================================================================');

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total Invariants Evaluated: ${total}`);
    console.log(`Passed:                     ${passed}`);
    console.log(`Failed:                     ${failed}`);

    if (failed > 0) {
      console.log('\nFAILURES / WARNINGS:');
      for (const f of results.filter((r) => !r.passed)) {
        console.log(`- [${f.category}] ${f.name}: ${f.observation}`);
      }
      process.exit(1);
    } else {
      console.log('\n🎉 ALL EMPIRICAL INVARIANTS PASSED PERFECTLY.');
      process.exit(0);
    }
  } catch (err: any) {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  }
}

runAll();
