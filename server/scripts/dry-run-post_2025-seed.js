#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.resolve(__dirname, '..', 'data', 'post_2025.json');

const COMMUNE_TYPE_MAP = {
  xa: 'Xã',
  phuong: 'Phường',
  phường: 'Phường',
  x\u00E3: 'Xã',
  thiTran: 'Thị trấn',
  'thị trấn': 'Thị trấn',
  thi_tran: 'Thị trấn',
  huyen: 'Huyện',
  quan: 'Quận',
  'thi tr?n': 'Thị trấn'
};

function normalizeProvinceName(pathWithType) {
  const parts = String(pathWithType).split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : String(pathWithType).trim();
}

function deriveProvinceType(provinceName) {
  const normalized = String(provinceName).toLowerCase();
  if (normalized.includes('thành phố') || normalized.includes('thủ đô')) {
    return 'Thành phố';
  }
  return 'Tỉnh';
}

function normalizeCommuneType(rawType) {
  if (!rawType) return '';
  const key = String(rawType).trim().toLowerCase();
  if (COMMUNE_TYPE_MAP[key]) {
    return COMMUNE_TYPE_MAP[key];
  }
  return key
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

function validateNumericWardName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  // Only reject overly generic numeric names such as "Phường 1" or "Xã 2" without a locality suffix.
  const genericPattern = /^(Phuong|Phường|Xa|Xã|Thi tran|Thị trấn)\s*\d+\s*$/i;
  const numericOnlyPattern = /^\d+$/;
  return genericPattern.test(trimmed) || numericOnlyPattern.test(trimmed);
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('Input file not found:', INPUT_FILE);
    process.exit(1);
  }

  const rawText = fs.readFileSync(INPUT_FILE, 'utf8');
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
    process.exit(1);
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    console.error('No entries found in', INPUT_FILE);
    process.exit(1);
  }

  const groups = new Map();
  const numericViolations = [];

  for (const [code, entry] of entries) {
    if (!entry || typeof entry !== 'object') {
      console.error('Invalid entry for code', code, 'expected object but got', typeof entry);
      process.exit(1);
    }

    const communeName = String(entry.name_with_type || '').trim();
    if (!communeName) {
      console.error('Missing name_with_type for code', code);
      process.exit(1);
    }

    if (validateNumericWardName(communeName)) {
      numericViolations.push({ code, communeName, entry });
    }

    const parentCode = String(entry.parent_code || '').trim();
    if (!parentCode) {
      console.error('Missing parent_code for ward', code);
      process.exit(1);
    }

    const pathWithType = String(entry.path_with_type || '').trim();
    if (!pathWithType) {
      console.error('Missing path_with_type for ward', code);
      process.exit(1);
    }

    const provinceName = normalizeProvinceName(pathWithType);
    const communeType = normalizeCommuneType(entry.type);

    if (!groups.has(parentCode)) {
      groups.set(parentCode, {
        parentCode,
        provinceNames: new Set(),
        representatives: [],
        communes: []
      });
    }

    const group = groups.get(parentCode);
    group.provinceNames.add(provinceName);
    group.representatives.push({ code, entry, communeName, provinceName, communeType, pathWithType });
    group.communes.push({
      CommuneCode: code,
      CommuneName: communeName,
      CommuneType: communeType || 'Unknown',
      ProvinceName: provinceName,
      PathWithType: pathWithType
    });
  }

  const inconsistentGroups = [];
  const derivedProvinces = [];
  let totalCommunes = 0;

  for (const group of groups.values()) {
    if (group.provinceNames.size !== 1) {
      inconsistentGroups.push({
        parentCode: group.parentCode,
        provinceNames: [...group.provinceNames],
        sampleEntries: group.representatives.slice(0, 5).map((item) => ({ code: item.code, provinceName: item.provinceName, pathWithType: item.pathWithType }))
      });
    }
    const provinceName = [...group.provinceNames][0];
    derivedProvinces.push({
      parentCode: group.parentCode,
      ProvinceName: provinceName,
      ProvinceType: deriveProvinceType(provinceName),
      CommuneCount: group.communes.length
    });
    totalCommunes += group.communes.length;
  }

  if (numericViolations.length > 0) {
    console.error('Numeric ward-name validation failed. The following entries look invalid:');
    for (const violation of numericViolations.slice(0, 20)) {
      console.error(`- ${violation.code}: ${violation.communeName}`);
    }
    if (numericViolations.length > 20) {
      console.error(`...and ${numericViolations.length - 20} more`);
    }
    process.exit(2);
  }

  if (inconsistentGroups.length > 0) {
    console.error('Province name consistency check failed for some parent_code groups:');
    for (const group of inconsistentGroups) {
      console.error(`- parent_code=${group.parentCode}: ${group.provinceNames.join(' | ')}`);
      for (const sample of group.sampleEntries) {
        console.error(`    ${sample.code}: ${sample.provinceName} <- ${sample.pathWithType}`);
      }
    }
    process.exit(3);
  }

  derivedProvinces.sort((a, b) => a.ProvinceName.localeCompare(b.ProvinceName, 'vi')); 

  console.log('Dry-run summary for', INPUT_FILE);
  console.log('Total ward-level entries:', entries.length);
  console.log('Total distinct provinces derived:', derivedProvinces.length);
  console.log('Total raw communes:', totalCommunes);
  console.log('Derived provinces:');
  derivedProvinces.forEach((province) => {
    console.log(`- ${province.ProvinceName} (${province.ProvinceType}) — ${province.CommuneCount} communes`);
  });
}

main();
