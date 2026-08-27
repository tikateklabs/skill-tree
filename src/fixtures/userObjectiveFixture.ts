import type { UserObjective } from "../domain/userObjective.js";

/**
 * A hand-authored, schema-valid UserObjective: current/target
 * compensation, one preference with a confidently-interpreted value,
 * and one the AI could not confidently interpret (interpreted: null,
 * sourceText still preserved) - see
 * openspec/changes/career-profile-domain-model/specs/user-objective-model/
 * spec.md.
 */
export const COMPANY_PREFERENCE_TEXT =
  "I prefer working for a product company compared to services companies that primarily work for clients or contract engagements";

export function buildUserObjectiveFixture(): UserObjective {
  return {
    currentCompensation: { amount: 4_000_000, currency: "INR", period: "annual" },
    targetCompensation: { amount: 8_000_000, currency: "INR", period: "annual" },
    locationPreference: { sourceText: "Open to Bangalore or fully remote", interpreted: "Bangalore or remote" },
    companyPreference: { sourceText: COMPANY_PREFERENCE_TEXT, interpreted: "product" },
    roleDirectionPreference: {
      sourceText: "Something that lets me keep growing technically, not purely people management",
      interpreted: null,
    },
    industryPreferences: {
      prefer: [],
      avoid: [
        { sourceText: "Avoid pure services/staffing companies", interpreted: "services" },
      ],
    },
    otherPreferences: [],
  };
}
