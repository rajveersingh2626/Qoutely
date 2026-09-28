import occupanciesData from '@/data/occupancies.json';
import eqZonesData from '@/data/earthquake_zones.json';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProposalInputData {
  clientName?: string;
  gstNumber?: string;
  district?: string;
  state?: string;
  occupancyCode?: string;
  constructionType?: string;
  sumInsuredBuilding?: number;
  sumInsuredPM?: number;
  sumInsuredStock?: number;
  sumInsuredTotal?: number;
}

/**
 * Validates Indian GSTIN number (15 characters alphanumeric with valid state code)
 */
export function validateGSTIN(gstin?: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  // Standard Indian GST format: 2 digits state code + 5 chars PAN + 4 digits + 1 char entity + 1 char Z + 1 check digit
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(clean);
}

/**
 * Validates District against official Earthquake Zone dataset
 */
export function validateDistrict(district?: string): boolean {
  if (!district) return false;
  const dLower = district.trim().toLowerCase();
  const zones = (eqZonesData as unknown as {
    zones: Array<{
      states: Array<{ districts: string[] }>;
    }>;
  }).zones || [];

  for (const z of zones) {
    for (const s of z.states) {
      for (const d of s.districts) {
        const target = d.toLowerCase();
        if (target === dLower || dLower.includes(target) || target.includes(dLower)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Validates Occupancy Code against official IIB Schedule 3 dataset
 */
export function validateOccupancyCode(code?: string): boolean {
  if (!code) return false;
  const c = code.trim();
  return (occupanciesData as any[]).some(occ => occ.code === c);
}

/**
 * Validates Construction Type per AIFT standards
 */
export function validateConstructionType(type?: string): boolean {
  if (!type) return false;
  const allowed = ['class a', 'class b', 'class c', 'kutcha', 'pucca', 'first class', 'second class'];
  return allowed.includes(type.trim().toLowerCase());
}

/**
 * Comprehensive Deterministic Underwriting Input Validator
 */
export function validateProposalInputs(data: ProposalInputData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Client Name
  if (!data.clientName || data.clientName.trim().length < 2) {
    errors.push('Client or company name is required.');
  }

  // 2. GST Number
  if (data.gstNumber && !validateGSTIN(data.gstNumber)) {
    warnings.push(`GSTIN '${data.gstNumber}' does not match standard 15-character format (e.g. 07AAAAA0000A1Z5).`);
  }

  // 3. District
  if (data.district && !validateDistrict(data.district)) {
    warnings.push(`District '${data.district}' could not be matched directly to official Seismic Zoning. Defaulting to Zone III.`);
  }

  // 4. Occupancy Code
  if (data.occupancyCode && !validateOccupancyCode(data.occupancyCode)) {
    errors.push(`Occupancy Code '${data.occupancyCode}' does not exist in official IIB Schedule 3 taxonomy. AI hallucinated code rejected.`);
  }

  // 5. Construction Type
  if (data.constructionType && !validateConstructionType(data.constructionType)) {
    warnings.push(`Construction type '${data.constructionType}' is non-standard. AIFT standard construction types are Class A/B/C or Kutcha.`);
  }

  // 6. Sum Insured Numeric Validation
  const bldg = Number(data.sumInsuredBuilding || 0);
  const pm = Number(data.sumInsuredPM || 0);
  const stock = Number(data.sumInsuredStock || 0);
  const total = Number(data.sumInsuredTotal || (bldg + pm + stock));

  if (isNaN(total) || total <= 0) {
    errors.push('Total Sum Insured must be a positive numeric value.');
  }

  if (total > 0 && total < 100000) {
    warnings.push('Sum insured appears unusually low (< ₹1,00,000) for commercial property coverage.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
