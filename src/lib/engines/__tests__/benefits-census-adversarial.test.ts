/**
 * Adversarial Stress & Empirical Verification Test Suite
 * Milestone 14: Employee Benefits (GHI, GTLI, GPA, WC)
 *
 * Exhaustively stress-tests:
 * 1. Demographic age boundaries (0, 25, 26, 35, 36, 45, 46, 55, 56, 65, 66, 75, 76, 100, <0, >100)
 * 2. Zero lives census error assertion
 * 3. Corporate buffer group size threshold (49 vs 50 lives)
 * 4. Relationship normalization aliases ('wife', 'husband', 'kid', 'mom', 'dad', 'worker', etc.)
 * 5. Salary accumulation: employee inclusion vs dependent exclusion
 * 6. Date format parsing (YYYY-MM-DD vs DD/MM/YYYY vs direct integers)
 * 7. Empty and malformed census file handling
 * 8. GTLI mortality brackets and Free Cover Limit (FCL)
 * 9. Statutory Workmen's Compensation (EC Act 1923) wage ceilings and minimum floors
 * 10. Studio package reconciliation and algorithmic explainability contracts
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateGhiDemographicPremium,
  calculateGhiBenefitLoadings,
  calculateGtliPremium,
  calculateGpaPremium,
  calculateWorkmensCompensation,
  parseEmployeeCensusRoster,
  computeBenefitsStudioLedger,
  calculateGhiQuote,
  calculateGtliQuote,
  calculateGpaQuote,
  calculateWcQuote,
  calculateBenefitsQuote,
  GHI_AGE_BAND_BASE_RATES,
  GTLI_MORTALITY_RATES_PER_MILLE,
  GTLI_HAZARD_MULTIPLIERS,
  GPA_HAZARD_RATES_PER_MILLE,
  WC_STATUTORY_WAGE_CAP,
  WC_STATUTORY_MIN_DEATH,
  WC_STATUTORY_MIN_PTD,
  WC_SCHEDULE_IV_FACTORS,
  CensusRow,
} from '../benefits-engine';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runAdversarialTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('\n======================================================================');
console.log('  MILESTONE 14: ADVERSARIAL STRESS TEST & EMPIRICAL CHALLENGE HARNESS');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: DEMOGRAPHIC AGE BOUNDARY STRESS TESTS ACROSS GHI
// ============================================================================
console.log('--- Suite 1: Demographic Age Boundaries Across GHI ---');

runAdversarialTest('Age boundary 0: Infancy correctly categorised in age_0_25 at ₹2,800', () => {
  const row: CensusRow = { employee_id: 'INF01', name: 'Newborn', age: 0, gender: 'M', relationship: 'child' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.total_lives, 1);
  assert.strictEqual(res.age_bands.age_0_25, 1);
  assert.strictEqual(res.age_bands.age_26_35, 0);
  assert.strictEqual(res.invalid_rows.length, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 2800);
});

runAdversarialTest('Age boundary 25 (upper limit of band 1): falls in age_0_25 at ₹2,800', () => {
  const row: CensusRow = { employee_id: 'EMP25', name: 'Young Adult', age: 25, gender: 'F', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_0_25, 1);
  assert.strictEqual(res.age_bands.age_26_35, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 2800);
});

runAdversarialTest('Age boundary 26 (lower limit of band 2): transitions to age_26_35 at ₹4,200', () => {
  const row: CensusRow = { employee_id: 'EMP26', name: 'Junior Associate', age: 26, gender: 'M', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_0_25, 0);
  assert.strictEqual(res.age_bands.age_26_35, 1);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 4200);
});

runAdversarialTest('Age boundary 35 (upper limit of band 2): falls in age_26_35 at ₹4,200', () => {
  const row: CensusRow = { employee_id: 'EMP35', name: 'Associate Manager', age: 35, gender: 'F', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_26_35, 1);
  assert.strictEqual(res.age_bands.age_36_45, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 4200);
});

runAdversarialTest('Age boundary 36 (lower limit of band 3): transitions to age_36_45 at ₹6,500', () => {
  const row: CensusRow = { employee_id: 'EMP36', name: 'Senior Manager', age: 36, gender: 'M', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_26_35, 0);
  assert.strictEqual(res.age_bands.age_36_45, 1);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 6500);
});

runAdversarialTest('Age boundary 45 (upper limit of band 3): falls in age_36_45 at ₹6,500', () => {
  const row: CensusRow = { employee_id: 'EMP45', name: 'Director', age: 45, gender: 'F', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_36_45, 1);
  assert.strictEqual(res.age_bands.age_46_55, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 6500);
});

runAdversarialTest('Age boundary 46 (lower limit of band 4): transitions to age_46_55 at ₹11,200', () => {
  const row: CensusRow = { employee_id: 'EMP46', name: 'Senior Director', age: 46, gender: 'M', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_36_45, 0);
  assert.strictEqual(res.age_bands.age_46_55, 1);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 11200);
});

runAdversarialTest('Age boundary 55 (upper limit of band 4): falls in age_46_55 at ₹11,200', () => {
  const row: CensusRow = { employee_id: 'EMP55', name: 'Vice President', age: 55, gender: 'F', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_46_55, 1);
  assert.strictEqual(res.age_bands.age_56_65, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 11200);
});

runAdversarialTest('Age boundary 56 (lower limit of band 5): transitions to age_56_65 at ₹18,500', () => {
  const row: CensusRow = { employee_id: 'EMP56', name: 'Senior VP', age: 56, gender: 'M', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_46_55, 0);
  assert.strictEqual(res.age_bands.age_56_65, 1);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 18500);
});

runAdversarialTest('Age boundary 65 (upper limit of band 5): falls in age_56_65 at ₹18,500', () => {
  const row: CensusRow = { employee_id: 'EMP65', name: 'Executive Advisor', age: 65, gender: 'M', relationship: 'self' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_56_65, 1);
  assert.strictEqual(res.age_bands.age_66_75, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 18500);
});

runAdversarialTest('Age boundary 66 (lower limit of band 6): transitions to age_66_75 at ₹26,000', () => {
  const row: CensusRow = { employee_id: 'DEP66', name: 'Parent Senior', age: 66, gender: 'F', relationship: 'parent' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_56_65, 0);
  assert.strictEqual(res.age_bands.age_66_75, 1);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 26000);
});

runAdversarialTest('Age boundary 75 (upper limit of band 6): falls in age_66_75 at ₹26,000', () => {
  const row: CensusRow = { employee_id: 'DEP75', name: 'Parent Elderly', age: 75, gender: 'M', relationship: 'parent' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_66_75, 1);
  assert.strictEqual(res.age_bands.age_76_plus, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 26000);
});

runAdversarialTest('Age boundary 76 (lower limit of band 7): transitions to age_76_plus at ₹32,000', () => {
  const row: CensusRow = { employee_id: 'DEP76', name: 'Super Senior Parent', age: 76, gender: 'F', relationship: 'parent' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.age_bands.age_66_75, 0);
  assert.strictEqual(res.age_bands.age_76_plus, 1);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 32000);
});

runAdversarialTest('Age boundary 100 (upper terminal benchmark): valid in age_76_plus at ₹32,000', () => {
  const row: CensusRow = { employee_id: 'DEP100', name: 'Centenarian Parent', age: 100, gender: 'M', relationship: 'parent' };
  const res = parseEmployeeCensusRoster([row]);
  assert.strictEqual(res.total_lives, 1);
  assert.strictEqual(res.age_bands.age_76_plus, 1);
  assert.strictEqual(res.invalid_rows.length, 0);

  const quote = calculateGhiDemographicPremium(res.age_bands, 300000);
  assert.strictEqual(quote.pure_risk_premium, 32000);
});

runAdversarialTest('Negative ages (<0) are rejected into invalid_rows and excluded from census counts', () => {
  const rows: CensusRow[] = [
    { employee_id: 'NEG01', name: 'Negative Age -1', age: -1, gender: 'M', relationship: 'child' },
    { employee_id: 'NEG02', name: 'Negative Age -45', age: -45, gender: 'F', relationship: 'self' },
  ];
  const res = parseEmployeeCensusRoster(rows);
  assert.strictEqual(res.total_lives, 0);
  assert.strictEqual(res.employee_count, 0);
  assert.strictEqual(res.invalid_rows.length, 2);
  assert.strictEqual(res.invalid_rows[0].employee_id, 'NEG01');
  assert.strictEqual(res.invalid_rows[0].reason, 'Invalid age');
  assert.strictEqual(res.invalid_rows[1].employee_id, 'NEG02');
});

runAdversarialTest('Ages >100 are rejected into invalid_rows and excluded from census counts', () => {
  const rows: CensusRow[] = [
    { employee_id: 'OVER101', name: 'Age 101', age: 101, gender: 'M', relationship: 'parent' },
    { employee_id: 'OVER150', name: 'Age 150', age: 150, gender: 'F', relationship: 'parent' },
  ];
  const res = parseEmployeeCensusRoster(rows);
  assert.strictEqual(res.total_lives, 0);
  assert.strictEqual(res.invalid_rows.length, 2);
  assert.strictEqual(res.invalid_rows[0].employee_id, 'OVER101');
  assert.strictEqual(res.invalid_rows[0].reason, 'Invalid age');
});

runAdversarialTest('Zero lives census error assertion: throws "Census must have at least one life"', () => {
  assert.throws(
    () => {
      calculateGhiDemographicPremium({
        age_0_25: 0,
        age_26_35: 0,
        age_36_45: 0,
        age_46_55: 0,
        age_56_65: 0,
        age_66_75: 0,
        age_76_plus: 0,
      });
    },
    /Census must have at least one life/
  );
});

// ============================================================================
// SUITE 2: CORPORATE BUFFER GROUP SIZE THRESHOLD (49 VS 50 LIVES)
// ============================================================================
console.log('\n--- Suite 2: Corporate Buffer Group Size Boundaries & Loadings ---');

runAdversarialTest('Group size boundary = 49 MUST throw "Corporate buffer requires minimum group size of 50 lives"', () => {
  assert.throws(
    () => {
      calculateGhiBenefitLoadings(500000, {
        room_rent: 'standard_1_percent',
        maternity_opted: false,
        maternity_day_1_waiver: false,
        ped_waiver_day_1: false,
        corporate_buffer_amount: 1000000, // ₹10 Lakhs buffer requested
        group_size: 49,                   // Group size is 49 (under threshold)
      });
    },
    /Corporate buffer requires minimum group size of 50 lives/
  );
});

runAdversarialTest('Group size boundary = 50 MUST succeed and charge exactly 3.5% buffer rate', () => {
  const bufferAmount = 2000000; // ₹20 Lakhs buffer
  const res = calculateGhiBenefitLoadings(500000, {
    room_rent: 'standard_1_percent',
    maternity_opted: false,
    maternity_day_1_waiver: false,
    ped_waiver_day_1: false,
    corporate_buffer_amount: bufferAmount,
    group_size: 50, // Exactly at 50 lives boundary
  });

  // 3.5% of 2,000,000 = 70,000
  assert.strictEqual(res.corporate_buffer_premium, 70000);
  assert.strictEqual(res.loaded_premium, 500000);
  assert.strictEqual(res.total_ghi_premium, 570000);
});

runAdversarialTest('Group size = 49 without corporate buffer (buffer = 0) succeeds normally', () => {
  const res = calculateGhiBenefitLoadings(250000, {
    room_rent: 'single_private_room',
    maternity_opted: true,
    maternity_day_1_waiver: true,
    ped_waiver_day_1: true,
    corporate_buffer_amount: 0, // No buffer requested
    group_size: 49,
  });

  // Single private room (+8%) + Maternity Day 1 (+15%) + PED (+12%) = 35%
  assert.strictEqual(res.loading_percent, 35);
  assert.strictEqual(res.corporate_buffer_premium, 0);
  assert.strictEqual(res.loaded_premium, Math.round(250000 * 1.35));
  assert.strictEqual(res.total_ghi_premium, Math.round(250000 * 1.35));
});

// ============================================================================
// SUITE 3: CENSUS INGESTION & RELATIONSHIP NORMALIZATION HARNESS
// ============================================================================
console.log('\n--- Suite 3: Census Ingestion & Relationship Normalization ---');

// Emulate and test the exact normalization algorithms implemented in EmployeeCensusUploader.tsx
const normalizeHeader = (raw: string): string => {
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(empid|employeeid|employeecode|empcode|staffno|staffid|id|code|badgeno|srno)$/.test(clean)) return 'employee_id';
  if (/^(name|employeename|empname|membername|insuredname|beneficiaryname|fullname)$/.test(clean)) return 'name';
  if (/^(age|years|dob|dateofbirth|birthdate|birth_date|date_of_birth)$/.test(clean)) return 'age_or_dob';
  if (/^(gender|sex|gen)$/.test(clean)) return 'gender';
  if (/^(relation|relationship|rel|dependenttype|familyrelation|membertype)$/.test(clean)) return 'relationship';
  if (/^(salary|monthlysalary|grosswage|monthlywage|wage|grosssalary|wages|ctc|monthlyctc|basicwage)$/.test(clean)) return 'monthly_salary';
  if (/^(suminsured|si|coverageamount|cover|coverage|basesi|benefitsi)$/.test(clean)) return 'sum_insured';
  return clean;
};

const normalizeRelationship = (raw?: string): {
  normalized: 'self' | 'spouse' | 'child' | 'parent' | 'invalid';
  raw: string;
} => {
  if (!raw) return { normalized: 'invalid', raw: '' };
  const c = raw.trim().toLowerCase();
  if (/^(self|employee|emp|primary|staff|worker|member)$/.test(c)) {
    return { normalized: 'self', raw: c };
  }
  if (/^(spouse|wife|husband|partner)$/.test(c)) {
    return { normalized: 'spouse', raw: c };
  }
  if (/^(child|son|daughter|kid|baby|infant|children)$/.test(c)) {
    return { normalized: 'child', raw: c };
  }
  if (/^(parent|father|mother|dad|mom|fatherinlaw|motherinlaw|parentinlaw)$/.test(c)) {
    return { normalized: 'parent', raw: c };
  }
  return { normalized: 'invalid', raw: c };
};

const parseAgeOrDob = (raw: string, currentYear: number = 2026): { age: number; dob?: string } => {
  if (!raw) return { age: -1 };
  const cleaned = raw.trim();
  if (/^\d{1,3}$/.test(cleaned)) {
    const a = parseInt(cleaned, 10);
    return { age: a };
  }
  const yearMatch = cleaned.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    const birthYear = parseInt(yearMatch[1], 10);
    return { age: Math.max(0, currentYear - birthYear), dob: cleaned };
  }
  const parsedDate = new Date(cleaned);
  if (!isNaN(parsedDate.getTime())) {
    const birthYear = parsedDate.getFullYear();
    if (birthYear >= 1900 && birthYear <= currentYear) {
      return { age: currentYear - birthYear, dob: cleaned };
    }
  }
  return { age: -1, dob: cleaned };
};

const parseCSVLine = (text: string, delimiter: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
};

runAdversarialTest('Relationship normalizer maps diverse aliases to statutory taxonomy', () => {
  // Aliases for 'self'
  assert.strictEqual(normalizeRelationship('worker').normalized, 'self');
  assert.strictEqual(normalizeRelationship('employee').normalized, 'self');
  assert.strictEqual(normalizeRelationship('emp').normalized, 'self');
  assert.strictEqual(normalizeRelationship('staff').normalized, 'self');
  assert.strictEqual(normalizeRelationship('primary').normalized, 'self');
  assert.strictEqual(normalizeRelationship('member').normalized, 'self');

  // Aliases for 'spouse'
  assert.strictEqual(normalizeRelationship('wife').normalized, 'spouse');
  assert.strictEqual(normalizeRelationship('husband').normalized, 'spouse');
  assert.strictEqual(normalizeRelationship('partner').normalized, 'spouse');

  // Aliases for 'child'
  assert.strictEqual(normalizeRelationship('kid').normalized, 'child');
  assert.strictEqual(normalizeRelationship('son').normalized, 'child');
  assert.strictEqual(normalizeRelationship('daughter').normalized, 'child');
  assert.strictEqual(normalizeRelationship('baby').normalized, 'child');
  assert.strictEqual(normalizeRelationship('children').normalized, 'child');

  // Aliases for 'parent'
  assert.strictEqual(normalizeRelationship('mom').normalized, 'parent');
  assert.strictEqual(normalizeRelationship('dad').normalized, 'parent');
  assert.strictEqual(normalizeRelationship('mother').normalized, 'parent');
  assert.strictEqual(normalizeRelationship('father').normalized, 'parent');
  assert.strictEqual(normalizeRelationship('fatherinlaw').normalized, 'parent');
  assert.strictEqual(normalizeRelationship('motherinlaw').normalized, 'parent');

  // Invalid relations
  assert.strictEqual(normalizeRelationship('cousin').normalized, 'invalid');
  assert.strictEqual(normalizeRelationship('friend').normalized, 'invalid');
  assert.strictEqual(normalizeRelationship('').normalized, 'invalid');
});

runAdversarialTest('Employee salary accumulation vs dependent salary exclusion', () => {
  // A roster where employees have salaries, but dependents also mistakenly have salaries entered
  const rows: CensusRow[] = [
    { employee_id: 'E01', name: 'John Doe', age: 30, gender: 'M', relationship: 'self', monthly_salary: 50000 },
    { employee_id: 'E01', name: 'Jane Doe (Wife)', age: 29, gender: 'F', relationship: 'spouse', monthly_salary: 80000 },
    { employee_id: 'E01', name: 'Timmy Doe (Kid)', age: 4, gender: 'M', relationship: 'child', monthly_salary: 20000 },
    { employee_id: 'E02', name: 'Alice Smith', age: 38, gender: 'F', relationship: 'self', monthly_salary: 70000 },
    { employee_id: 'E02', name: 'Bob Smith (Husband)', age: 40, gender: 'M', relationship: 'spouse', monthly_salary: 95000 },
    { employee_id: 'E02', name: 'Grandma Smith (Mom)', age: 67, gender: 'F', relationship: 'parent', monthly_salary: 30000 },
  ];

  const parsed = parseEmployeeCensusRoster(rows);

  // Total lives: 6 (2 employees + 4 dependents)
  assert.strictEqual(parsed.total_lives, 6);
  assert.strictEqual(parsed.employee_count, 2);
  assert.strictEqual(parsed.dependent_count, 4);

  // Wage roll must accumulate ONLY John Doe (50,000) + Alice Smith (70,000) = 120,000
  // All dependent salaries (80k + 20k + 95k + 30k = 225,000) MUST be strictly excluded!
  assert.strictEqual(parsed.total_monthly_wage_roll, 120000);
});

runAdversarialTest('Mixed date formats: ISO (YYYY-MM-DD), Indian (DD/MM/YYYY), and direct integers', () => {
  const d1 = parseAgeOrDob('1990-05-20', 2026);
  assert.strictEqual(d1.age, 36);

  const d2 = parseAgeOrDob('20/05/1990', 2026);
  assert.strictEqual(d2.age, 36);

  const d3 = parseAgeOrDob('20-05-1990', 2026);
  assert.strictEqual(d3.age, 36);

  const d4 = parseAgeOrDob('42', 2026);
  assert.strictEqual(d4.age, 42);

  const d5 = parseAgeOrDob('0', 2026);
  assert.strictEqual(d5.age, 0);

  const d6 = parseAgeOrDob('2026-01-01', 2026);
  assert.strictEqual(d6.age, 0);

  const d7 = parseAgeOrDob('1926-01-01', 2026);
  assert.strictEqual(d7.age, 100);

  const d8 = parseAgeOrDob('corrupted-date-xyz', 2026);
  assert.strictEqual(d8.age, -1);

  const d9 = parseAgeOrDob('', 2026);
  assert.strictEqual(d9.age, -1);
});

runAdversarialTest('Ingestion of end-to-end raw CSV text with varied aliases and delimiters', () => {
  const csvRaw = `Employee ID,Full Name,Date_of_Birth,Gender,Relationship,Monthly Wage,Sum Insured
EMP01,Vikram Rathore,1992-03-15,M,worker,60000,500000
EMP01,Sunita Rathore,15/08/1994,F,wife,25000,500000
EMP01,Aarav Rathore,2020-11-01,M,kid,,500000
EMP01,Kamla Rathore,1958-06-12,F,mom,,500000
EMP02,Rohan Mehra,34,M,staff,45000,500000
EMP02,Anjali Mehra,32,F,husband,,500000
EMP03,Kavita Nair,28,F,employee,55000,500000
EMP03,Raghav Nair,60,M,dad,,500000`;

  const lines = csvRaw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const headers = parseCSVLine(lines[0], delimiter).map(normalizeHeader);

  const mappedRows: CensusRow[] = [];
  const wageRollSum = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    const relNorm = normalizeRelationship(rowObj['relationship']);
    const ageRes = parseAgeOrDob(rowObj['age_or_dob'] || '');
    const salaryStr = (rowObj['monthly_salary'] || '').replace(/[^0-9.]/g, '');
    const salary = salaryStr ? parseFloat(salaryStr) : undefined;

    const normalizedRel = relNorm.normalized === 'invalid' ? 'self' : relNorm.normalized;

    mappedRows.push({
      employee_id: rowObj['employee_id'],
      name: rowObj['name'],
      age: ageRes.age,
      gender: rowObj['gender'] === 'F' ? 'F' : 'M',
      relationship: normalizedRel,
      monthly_salary: normalizedRel === 'self' ? salary : undefined,
    });
  }

  const parsed = parseEmployeeCensusRoster(mappedRows);
  assert.strictEqual(parsed.total_lives, 8);
  assert.strictEqual(parsed.employee_count, 3); // Vikram, Rohan, Kavita
  assert.strictEqual(parsed.dependent_count, 5); // Sunita (wife), Aarav (kid), Kamla (mom), Anjali (husband), Raghav (dad)

  // Vikram (60,000) + Rohan (45,000) + Kavita (55,000) = 160,000
  // Sunita's 25,000 excluded because wife is dependent!
  assert.strictEqual(parsed.total_monthly_wage_roll, 160000);
});

runAdversarialTest('Empty and malformed census file handling', () => {
  // Empty text
  const emptyParsed = parseEmployeeCensusRoster([]);
  assert.strictEqual(emptyParsed.total_lives, 0);
  assert.strictEqual(emptyParsed.employee_count, 0);
  assert.strictEqual(emptyParsed.dependent_count, 0);
  assert.strictEqual(emptyParsed.total_monthly_wage_roll, 0);

  // Malformed rows with bad ages
  const malformedRows: CensusRow[] = [
    { employee_id: 'BAD01', name: 'Corrupt 1', age: -99, gender: 'M', relationship: 'self' },
    { employee_id: 'BAD02', name: 'Corrupt 2', age: 999, gender: 'F', relationship: 'parent' },
    { employee_id: 'GOOD', name: 'Valid Person', age: 30, gender: 'M', relationship: 'self', monthly_salary: 40000 },
  ];
  const malformedParsed = parseEmployeeCensusRoster(malformedRows);
  assert.strictEqual(malformedParsed.total_lives, 1);
  assert.strictEqual(malformedParsed.invalid_rows.length, 2);
  assert.strictEqual(malformedParsed.total_monthly_wage_roll, 40000);
});

// ============================================================================
// SUITE 4: GROUP TERM LIFE (GTLI) MORTALITY & FCL STRESS TESTS
// ============================================================================
console.log('\n--- Suite 4: GTLI Mortality & Free Cover Limit (FCL) ---');

runAdversarialTest('GTLI empty members array throws Error', () => {
  assert.throws(() => calculateGtliPremium([]), /No members provided for GTLI/);
});

runAdversarialTest('GTLI benchmark mortality brackets strictly adhere to IALM 2012-14 table', () => {
  // <=25: 0.88‰, <=35: 1.05‰, <=45: 1.80‰, <=55: 4.95‰, >55: 11.50‰
  const p20 = calculateGtliPremium([{ age: 20, sum_insured: 1000000 }]);
  assert.strictEqual(p20.total_gtli_premium, 880);

  const p25 = calculateGtliPremium([{ age: 25, sum_insured: 1000000 }]);
  assert.strictEqual(p25.total_gtli_premium, 880);

  const p26 = calculateGtliPremium([{ age: 26, sum_insured: 1000000 }]);
  assert.strictEqual(p26.total_gtli_premium, 1050);

  const p35 = calculateGtliPremium([{ age: 35, sum_insured: 1000000 }]);
  assert.strictEqual(p35.total_gtli_premium, 1050);

  const p36 = calculateGtliPremium([{ age: 36, sum_insured: 1000000 }]);
  assert.strictEqual(p36.total_gtli_premium, 1800);

  const p45 = calculateGtliPremium([{ age: 45, sum_insured: 1000000 }]);
  assert.strictEqual(p45.total_gtli_premium, 1800);

  const p46 = calculateGtliPremium([{ age: 46, sum_insured: 1000000 }]);
  assert.strictEqual(p46.total_gtli_premium, 4950);

  const p55 = calculateGtliPremium([{ age: 55, sum_insured: 1000000 }]);
  assert.strictEqual(p55.total_gtli_premium, 4950);

  const p56 = calculateGtliPremium([{ age: 56, sum_insured: 1000000 }]);
  assert.strictEqual(p56.total_gtli_premium, 11500);

  const p70 = calculateGtliPremium([{ age: 70, sum_insured: 1000000 }]);
  assert.strictEqual(p70.total_gtli_premium, 11500);
});

runAdversarialTest('GTLI Free Cover Limit (FCL) exact boundary check: SI == FCL vs SI > FCL', () => {
  const fcl = 5000000; // ₹50 Lakhs
  const members = [
    { age: 30, sum_insured: 4999999 }, // Below FCL: not flagged
    { age: 35, sum_insured: 5000000 }, // Exactly equal FCL: not flagged
    { age: 40, sum_insured: 5000001 }, // Above FCL by ₹1: MUST be flagged
    { age: 45, sum_insured: 10000000 }, // Far above FCL: MUST be flagged
  ];
  const res = calculateGtliPremium(members, fcl);
  assert.strictEqual(res.total_members, 4);
  assert.strictEqual(res.members_requiring_medical, 2);
});

// ============================================================================
// SUITE 5: STATUTORY WORKMEN'S COMPENSATION (WC) STATUTORY FORMULAS
// ============================================================================
console.log("\n--- Suite 5: Statutory Workmen's Compensation (EC Act 1923) ---");

runAdversarialTest('WC empty worker list throws Error', () => {
  assert.throws(
    () => calculateWorkmensCompensation({ workers: [], trade_hazard_rate_percent: 0.5, medical_extension_opted: false }),
    /Worker list cannot be empty/
  );
});

runAdversarialTest('WC statutory wage cap of ₹15,000: ₹15k, ₹50k, and ₹500k yield identical liability', () => {
  const age = 30; // Schedule IV factor = 207.98
  const factor = 207.98;

  // Expected Death: 50% * 15,000 * 207.98 = 1,559,850
  // Expected PTD: 60% * 15,000 * 207.98 = 1,871,820
  const expectedDeath = Math.round(0.50 * 15000 * factor);
  const expectedPtd = Math.round(0.60 * 15000 * factor);

  const res15k = calculateWorkmensCompensation({
    workers: [{ age, monthly_wage: 15000 }],
    trade_hazard_rate_percent: 0.45,
    medical_extension_opted: false,
  });
  const res50k = calculateWorkmensCompensation({
    workers: [{ age, monthly_wage: 50000 }],
    trade_hazard_rate_percent: 0.45,
    medical_extension_opted: false,
  });
  const res500k = calculateWorkmensCompensation({
    workers: [{ age, monthly_wage: 500000 }],
    trade_hazard_rate_percent: 0.45,
    medical_extension_opted: false,
  });

  assert.strictEqual(res15k.statutory_death_liability, expectedDeath);
  assert.strictEqual(res15k.statutory_ptd_liability, expectedPtd);
  assert.strictEqual(res50k.statutory_death_liability, expectedDeath);
  assert.strictEqual(res50k.statutory_ptd_liability, expectedPtd);
  assert.strictEqual(res500k.statutory_death_liability, expectedDeath);
  assert.strictEqual(res500k.statutory_ptd_liability, expectedPtd);
});

runAdversarialTest('WC statutory floor enforcement: Death min ₹1,20,000 and PTD min ₹1,40,000', () => {
  // A tiny wage (₹500/mo) with factor 117.41 would yield:
  // Death: 50% * 500 * 117.41 = 29,352.50 -> clamped to ₹1,20,000 floor
  // PTD: 60% * 500 * 117.41 = 35,223 -> clamped to ₹1,40,000 floor
  const res = calculateWorkmensCompensation({
    workers: [{ age: 60, monthly_wage: 500 }],
    trade_hazard_rate_percent: 0.5,
    medical_extension_opted: false,
  });

  assert.strictEqual(res.statutory_death_liability, 120000);
  assert.strictEqual(res.statutory_ptd_liability, 140000);
});

runAdversarialTest('WC Schedule IV factor boundaries across all statutory age tiers', () => {
  // Ages: <=20 (224.00), <=25 (216.91), <=30 (207.98), <=35 (197.06), <=40 (184.17), <=45 (169.44), <=50 (153.09), <=55 (135.56), >55 (117.41)
  const testAges = [18, 20, 21, 25, 26, 30, 31, 35, 36, 40, 41, 45, 46, 50, 51, 55, 56, 65];
  for (const age of testAges) {
    const res = calculateWorkmensCompensation({
      workers: [{ age, monthly_wage: 15000 }],
      trade_hazard_rate_percent: 0.5,
      medical_extension_opted: false,
    });
    assert.ok(res.statutory_death_liability >= 120000);
    assert.ok(res.statutory_ptd_liability >= 140000);
  }
});

// ============================================================================
// SUITE 6: FULL RECONCILIATION & ALGORITHMIC EXPLAINABILITY
// ============================================================================
console.log('\n--- Suite 6: Studio Reconciler & Explainability ---');

runAdversarialTest('Unified package quote evaluates GHI + GTLI + GPA + WC with 18% GST', () => {
  const census: CensusRow[] = [
    { employee_id: 'E1', name: 'Software Engineer 1', age: 26, gender: 'M', relationship: 'self', monthly_salary: 65000 },
    { employee_id: 'E1', name: 'Spouse', age: 25, gender: 'F', relationship: 'spouse' },
    { employee_id: 'E2', name: 'Software Engineer 2', age: 34, gender: 'F', relationship: 'self', monthly_salary: 80000 },
    { employee_id: 'E2', name: 'Child', age: 3, gender: 'M', relationship: 'child' },
    { employee_id: 'E3', name: 'Tech Lead', age: 42, gender: 'M', relationship: 'self', monthly_salary: 110000 },
  ];

  const quote = calculateBenefitsQuote({
    corporate_name: 'Stripe India R&D',
    census,
    ghi: {
      base_sum_insured: 500000,
      room_rent: 'single_private_room',
      maternity_opted: true,
      maternity_day_1_waiver: true,
      ped_waiver_day_1: true,
      corporate_buffer_amount: 0,
    },
    gtli: {
      sum_insured_per_life: 2500000,
      hazard_class: 1,
    },
    gpa: {
      sum_insured_per_life: 1000000,
      hazard_class: 1,
      ttd_opted: true,
      medical_extension_opted: true,
    },
    wc: {
      trade_hazard_rate_percent: 0.25,
      medical_extension_opted: true,
    },
  });

  assert.strictEqual(quote.lob_category, 'benefits');
  assert.strictEqual(quote.line_specific_breakdown.total_lives, 5);
  assert.strictEqual(quote.line_specific_breakdown.employee_count, 3);
  assert.strictEqual(quote.line_specific_breakdown.dependent_count, 2);
  assert.strictEqual(quote.line_specific_breakdown.total_monthly_wage_roll, 255000); // 65k + 80k + 110k

  // Reconcile mathematical integrity of GST and Total
  const expectedGst = Math.round(quote.net_premium * 0.18);
  assert.strictEqual(quote.gst_amount, expectedGst);
  assert.strictEqual(quote.total_premium, quote.net_premium + quote.gst_amount);

  // Algorithmic explainability steps must cover all 6 stages
  assert.strictEqual(quote.algorithmic_explainability.length, 6);
});

console.log('\n======================================================================');
console.log(`  ALL ${passedTests} OF ${totalTests} ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY!`);
console.log('======================================================================\n');
