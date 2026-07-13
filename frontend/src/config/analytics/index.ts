import { AnalyticsConfig } from './types';
import citizenAnalytics from './citizen.analytics';
import policeAnalytics from './police.analytics';
import hospitalAnalytics from './hospital.analytics';
import volunteerAnalytics from './volunteer.analytics';
import ngoAnalytics from './ngo.analytics';
import childWelfareAnalytics from './childWelfare.analytics';
import adminAnalytics from './admin.analytics';

export * from './types';

const allAnalytics: Record<string, AnalyticsConfig> = {
  citizen: citizenAnalytics,
  police: policeAnalytics,
  hospital: hospitalAnalytics,
  volunteer: volunteerAnalytics,
  ngo: ngoAnalytics,
  child_welfare: childWelfareAnalytics,
  admin: adminAnalytics,
};

export const getAnalytics = (role: string): AnalyticsConfig => {
  const normalizedRole = role === 'childWelfare' ? 'child_welfare' : role;
  return allAnalytics[normalizedRole] || policeAnalytics; // Default fallback to police
};
