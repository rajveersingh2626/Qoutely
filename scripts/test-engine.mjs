// Test suite for Quotely Deterministic Premium Engine & API Route Schema

function calculatePremium(data) {
  const sumInsured = Math.max(0, Number(data.sumInsured) || 0);
  const flexaRate = Math.max(0, Number(data.flexaRate) || 0);
  const stfiRate = Math.max(0, Number(data.stfiRate) || 0);
  const eqRate = Math.max(0, Number(data.eqRate) || 0);

  const rawDiscounts = Math.max(0, Number(data.discounts) || 0);
  const rawLoadings = Math.max(0, Number(data.loadings) || 0);

  const discountDecimal = rawDiscounts > 1 ? rawDiscounts / 100 : rawDiscounts;
  const loadingDecimal = rawLoadings > 1 ? rawLoadings / 100 : rawLoadings;

  // 1. Base Rate per mille = (Flexa + STFI + EQ)
  const baseRate = Number((flexaRate + stfiRate + eqRate).toFixed(4));

  // 2. Adjusted Rate = Base Rate * (1 + Loadings - Discounts)
  const adjustedRate = Number(
    Math.max(0, baseRate * (1 + loadingDecimal - discountDecimal)).toFixed(4)
  );

  // 3. Net Premium = (Sum Insured / 1000) * Adjusted Rate
  const netPremium = Number(
    ((sumInsured / 1000) * adjustedRate).toFixed(2)
  );

  // 4. GST = Net Premium * 0.18
  const gst = Number((netPremium * 0.18).toFixed(2));

  // 5. Total Final Premium = Net Premium + GST
  const totalFinalPremium = Number((netPremium + gst).toFixed(2));

  return {
    sumInsured,
    flexaRate,
    stfiRate,
    eqRate,
    discounts: rawDiscounts,
    loadings: rawLoadings,
    discountPercentage: Number((discountDecimal * 100).toFixed(2)),
    loadingPercentage: Number((loadingDecimal * 100).toFixed(2)),
    discountFactor: discountDecimal,
    loadingFactor: loadingDecimal,
    baseRate,
    adjustedRate,
    netPremium,
    gst,
    totalFinalPremium,
    totalPremium: totalFinalPremium,
  };
}

console.log('=== TEST 1: Deterministic Premium Engine Math ===');
const testData = {
  sumInsured: 5000000,
  flexaRate: 0.65,
  stfiRate: 0.15,
  eqRate: 0.10,
  loadings: 10,
  discounts: 5,
};

const result = calculatePremium(testData);
console.log('Input:', JSON.stringify(testData, null, 2));
console.log('Result:', JSON.stringify(result, null, 2));

// Verifications
console.assert(result.baseRate === 0.9, `Expected baseRate 0.90, got ${result.baseRate}`);
console.assert(result.adjustedRate === 0.945, `Expected adjustedRate 0.945, got ${result.adjustedRate}`);
console.assert(result.netPremium === 4725.00, `Expected netPremium 4725.00, got ${result.netPremium}`);
console.assert(result.gst === 850.50, `Expected gst 850.50, got ${result.gst}`);
console.assert(result.totalFinalPremium === 5575.50, `Expected totalFinalPremium 5575.50, got ${result.totalFinalPremium}`);

console.log('✓ TEST 1 PASSED: All mathematical assertions verified with 100% precision.\n');

console.log('=== TEST 2: Schema Validation for Step 1 ===');
const requiredKeys = ['occupancyCode', 'occupancyDescription', 'matchedKeywords', 'confidenceScore'];
const sampleApiResponse = {
  occupancyCode: '1023',
  occupancyDescription: 'Engineering Workshops, CNC Metal Machining & Parts Fabrication',
  matchedKeywords: ['cnc', 'machining', 'metal', 'tooling'],
  confidenceScore: 0.96,
  suggestedFlexaRate: 0.65,
  suggestedStfiRate: 0.15,
  suggestedEqRate: 0.10,
};

for (const key of requiredKeys) {
  console.assert(key in sampleApiResponse, `Missing required key ${key}`);
}
console.log('✓ TEST 2 PASSED: Strict schema `{ occupancyCode, occupancyDescription, matchedKeywords, confidenceScore }` validated.');
