# Data Migration Plan: MVP to V0 WorldMap

## Executive Summary

This document outlines the differences between the MVP data structure (source of truth) and the V0 WorldMap data structure, and provides a migration plan to synchronize V0 with MVP's comprehensive dataset.

## Data Counts

### Countries
- **MVP**: 155 countries total
  - countries_part1.ts: 56 countries
  - countries_part2.ts: 44 countries
  - countries_part3.ts: 55 countries
- **V0 WorldMap**: 63 countries
- **Gap**: MVP has 92 MORE countries than V0

### Cities
- **MVP**: 1,051 cities (exported from SuperHero Tactics World Bible CSV)
- **V0 WorldMap**: 83 cities (subset for demonstration)
- **Gap**: MVP has 968 MORE cities than V0

## Interface/Schema Differences

### Country Interface

#### Fields in BOTH MVP and V0
Both systems share these core fields:
- name, president, population, populationRating, motto, nationality
- governmentPerception, governmentCorruption, presidentialTerm, leaderTitle
- militaryServices, militaryBudget, intelligenceServices, intelligenceBudget
- capitalPunishment, mediaFreedom, lawEnforcement, lawEnforcementBudget
- gdpNational, gdpPerCapita, healthcare, higherEducation, socialDevelopment, lifestyle
- cyberCapabilities, digitalDevelopment, science
- cloning, lswActivity, lswRegulations, vigilantism

#### Fields ONLY in MVP
```typescript
id: number                    // Unique numeric identifier
code: string                  // 2-3 letter country code (e.g., "US", "NO", "ALB")
governmentType: string        // Specific government structure type
terrorismActivity: string     // String values: "0", "20", "25", "75", "Active", "Rare", "Inactive"
leaderGender: string          // "Male" | "Female" | ""
cultureCode: number           // Region code (1-14)
cultureGroup: string          // Culture group letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
```

#### Fields ONLY in V0
```typescript
code: number                           // Numeric code instead of string
governmentStructure: GovernmentStructureType  // Typed government structure
terrorismActivity: number              // Numeric value instead of string
presidentGender: "Male" | "Female" | "" // Different field name than MVP
flag?: string                          // Optional display field
partners?: string[]                    // Optional relationship field
adversaries?: string[]                 // Optional relationship field
```

#### Key Differences
1. **Country Code**: MVP uses string codes ("US", "NO"), V0 uses numeric codes (163, 162)
2. **Government Field Name**: MVP has `governmentType` (string), V0 has `governmentStructure` (typed enum)
3. **Terrorism Activity**: MVP uses mixed string values, V0 uses numbers
4. **Leader Gender**: MVP uses `leaderGender`, V0 uses `presidentGender`
5. **Culture System**: MVP has rich culture system (cultureCode + cultureGroup), V0 lacks this
6. **Unique ID**: MVP has explicit `id` field, V0 doesn't

### City Interface

#### Fields in BOTH MVP and V0
Both systems share these core fields:
- sector, countryCode, cultureCode, name, country
- population, populationRating, populationType
- hvt, crimeIndex, safetyIndex

#### Structural Differences
**City Types Field**:
- **MVP**: Separate fields for up to 4 city types:
  ```typescript
  cityType1: string   // First city type
  cityType2: string   // Second city type (can be empty)
  cityType3: string   // Third city type (can be empty)
  cityType4: string   // Fourth city type (can be empty)
  ```

- **V0**: Single array field:
  ```typescript
  cityTypes: CityType[]  // Array of city types (more efficient)
  ```

#### Data Format
- **MVP**: Empty city types stored as empty strings `""`
- **V0**: Empty city types omitted from array

## Data Quality Issues

### Government Corruption Values
**CRITICAL**: MVP documentation states "Government corruption values INVERTED: higher = MORE corrupt"
- This means the CSV source had low values for corrupt countries
- MVP inverted these (100 - original) so higher numbers = more corrupt
- V0 data appears to have different corruption values than MVP
- **Example**: Norway
  - MVP: `governmentCorruption: 15` (very clean - 15% corrupt)
  - V0: `governmentCorruption: 85` (appears inverted - 85% clean?)

### Terrorism Activity Values
MVP has inconsistent string values that need normalization:
- String numeric values: "0", "20", "25", "75"
- Word values: "Active", "Rare", "Inactive"

V0 uses pure numeric values (0, 20, 25, 75).

**Mapping needed**:
```typescript
"Inactive" or "0" → 0
"Rare" or "20" or "25" → 25
"Active" or "75" → 75
```

## Migration Requirements

### Phase 1: Country Data Migration

#### Step 1: Field Mapping
Create transformation layer to convert MVP → V0 format:

```typescript
interface MVPCountry {
  id: number
  code: string                    // String code
  governmentType: string          // Generic string
  terrorismActivity: string       // Mixed string values
  leaderGender: string           // MVP field name
  cultureCode: number
  cultureGroup: string
  // ... other fields
}

interface V0Country {
  code: number                              // Numeric code
  governmentStructure: GovernmentStructureType  // Typed enum
  terrorismActivity: number                 // Numeric value
  presidentGender: "Male" | "Female" | ""  // V0 field name
  // ... other fields
}
```

#### Step 2: Country Code Conversion
**Problem**: MVP has string codes, V0 has numeric codes

**Solutions**:
1. **Option A - Keep V0 numeric**: Create mapping table MVP.code → V0.code
   - Requires maintaining ISO-3166 country code mappings
   - Example: "US" → 840, "NO" → 578, "SI" → 705

2. **Option B - Change V0 to string codes** (RECOMMENDED)
   - More human-readable
   - Matches international standards (ISO 3166-1 alpha-2/3)
   - Easier to maintain and debug
   - Better for APIs and data exchange

**Recommendation**: Change V0 to use string country codes like MVP

#### Step 3: Add Missing Fields to V0
Add these MVP-only fields to V0 schema:
- `id: number` - Sequential identifier
- `cultureCode: number` - Region classification (1-14)
- `cultureGroup: string` - Culture group ('A'-'F')

Optionally keep V0's additional fields:
- `flag?: string` - Can be generated from country code
- `partners?: string[]` - Strategic relationships (populate later)
- `adversaries?: string[]` - Strategic relationships (populate later)

#### Step 4: Data Validation
Before migration, validate:
1. All 155 MVP countries have valid data
2. Government corruption values are consistently inverted
3. No duplicate country codes or IDs
4. All culture codes map to valid culture groups
5. TerrorismActivity values normalized to numeric

### Phase 2: City Data Migration

#### Step 1: City Types Array Conversion
Transform MVP's 4 separate cityType fields into V0's array format:

```typescript
// MVP format
cityType1: "Military"
cityType2: "Political"
cityType3: ""
cityType4: ""

// Convert to V0 format
cityTypes: ["Military", "Political"]  // Omit empty strings
```

#### Step 2: Data Verification
Verify for all 1,051 cities:
1. countryCode exists in country dataset
2. cultureCode matches country's cultureCode
3. populationType is valid enum value
4. crimeIndex + safetyIndex ≈ 100 (should be inversely related)

#### Step 3: Sector Grid Validation
Ensure all 1,051 cities have valid sector codes:
- Format: 2 letters + 1 number (e.g., "LJ5", "LD4")
- Letters represent grid coordinates
- Numbers may represent additional classification

### Phase 3: Data Enrichment

#### Country Enhancements
After base migration, enrich V0 with:

1. **Flag Images**: Generate flag URLs from country codes
   ```typescript
   flag: `https://flagcdn.com/w320/${code.toLowerCase()}.png`
   ```

2. **Strategic Relationships**: Define partners/adversaries
   - Based on faction system (US, China, India, Nigeria)
   - Based on governmentPerception and lswRegulations
   - Historical alliances and conflicts

3. **Computed Fields**: Add helper fields
   - `region: string` - Derived from cultureCode
   - `stabilityScore: number` - Computed from multiple factors
   - `freedomIndex: number` - Derived from media freedom, government type

#### City Enhancements
1. **Geographic Coordinates**: Add lat/lon for map display
2. **Mission Templates**: Link cities to investigation templates based on cityTypes
3. **LSW Hotspots**: Flag high-threat cities (high LSW activity in country + high crime)

## Data That Would Be Lost

### If Migrating V0 → MVP (Wrong Direction)
Would lose:
- 92 countries worth of comprehensive data
- 968 cities worth of location data
- Culture classification system
- String country codes (more standard)

### If Replacing MVP with V0 (Wrong Direction)
Would lose:
- 92% of country data
- 92% of city data
- Critical culture system for name generation and regional gameplay
- Standard ISO country codes

## Migration Strategy (RECOMMENDED)

### Approach: MVP as Source of Truth ✓

**Rationale**: MVP has comprehensive, validated data from SuperHero Tactics World Bible

**Steps**:
1. Backup V0 current data
2. Update V0 interfaces to match MVP structure (use string codes)
3. Export all MVP data (155 countries, 1,051 cities)
4. Transform data format (city types to array, field name mappings)
5. Import into V0
6. Validate data integrity
7. Update V0 queries to use string country codes
8. Test WorldMap functionality with full dataset

### Alternative: Hybrid Approach

If V0 has custom enhancements worth keeping:
1. Start with MVP as base (155 countries, 1,051 cities)
2. Overlay V0-specific enhancements (flags, partners, adversaries)
3. Use MVP's structure (string codes, culture system)
4. Keep V0's display-oriented fields as optional additions

## Implementation Checklist

### Pre-Migration
- [ ] Backup V0 WorldMap data
- [ ] Document any V0-specific customizations
- [ ] Create test environment
- [ ] Verify MVP data integrity (corruption values, terrorism mapping)

### Schema Changes
- [ ] Update V0 Country interface (add id, cultureCode, cultureGroup)
- [ ] Change V0 country code from number to string
- [ ] Rename presidentGender → leaderGender (or keep both)
- [ ] Update governmentStructure field name
- [ ] Ensure terrorismActivity is number type

### Data Transformation
- [ ] Create MVP→V0 converter script
- [ ] Map city types: 4 fields → array
- [ ] Normalize terrorism activity values
- [ ] Verify corruption value interpretation
- [ ] Generate any missing required fields

### Data Import
- [ ] Import 155 countries from MVP
- [ ] Import 1,051 cities from MVP
- [ ] Validate foreign key relationships (country codes)
- [ ] Verify culture code consistency

### Testing
- [ ] Test country lookups by code
- [ ] Test city queries by country
- [ ] Test culture group filtering
- [ ] Test map rendering with full dataset
- [ ] Verify game mechanics (investigations, missions) work with new data

### Post-Migration
- [ ] Update V0 documentation
- [ ] Archive old V0 data files
- [ ] Update any V0-specific queries/filters
- [ ] Monitor for data issues in production

## Risk Assessment

### High Risk
- **Data Loss**: If migration fails, could lose V0 customizations
  - **Mitigation**: Complete backup before migration

- **Breaking Changes**: Code expecting numeric country codes will break
  - **Mitigation**: Comprehensive testing, update all queries

### Medium Risk
- **Performance**: 1,051 cities vs 83 cities (12x increase)
  - **Mitigation**: Test map rendering, add pagination/virtualization if needed

- **Corruption Value Confusion**: Inverted values could cause bugs
  - **Mitigation**: Clear documentation, add data validation tests

### Low Risk
- **City Types Array**: Simple structural change
  - **Mitigation**: Straightforward transformation logic

## Timeline Estimate

- **Schema Updates**: 2-4 hours
- **Data Transformation Script**: 4-6 hours
- **Data Import & Validation**: 2-3 hours
- **Code Updates**: 4-8 hours (depends on V0 codebase size)
- **Testing**: 4-6 hours
- **Documentation**: 2-3 hours

**Total**: 18-30 hours (2.5-4 days of development)

## Conclusion

MVP contains the authoritative, comprehensive dataset with 155 countries and 1,051 cities from the SuperHero Tactics World Bible. V0 WorldMap should be updated to use MVP's data structure and full dataset. The primary technical challenge is converting country codes from V0's numeric format to MVP's standard string format, and restructuring city types from 4 separate fields to an array.

The recommended approach is to treat MVP as the source of truth and migrate its complete dataset into V0, preserving V0's display enhancements (flags, relationships) as optional fields.
