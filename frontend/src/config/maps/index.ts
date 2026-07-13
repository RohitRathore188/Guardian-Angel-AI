import { MapConfig } from './types';
import citizenMap from './citizen.map';
import policeMap from './police.map';
import hospitalMap from './hospital.map';
import volunteerMap from './volunteer.map';
import ngoMap from './ngo.map';
import childWelfareMap from './childWelfare.map';
import adminMap from './admin.map';

export * from './types';

const allMaps: Record<string, MapConfig> = {
  citizen: citizenMap,
  police: policeMap,
  hospital: hospitalMap,
  volunteer: volunteerMap,
  ngo: ngoMap,
  child_welfare: childWelfareMap,
  admin: adminMap,
};

export const getMapConfig = (role: string): MapConfig => {
  const normalizedRole = role === 'childWelfare' ? 'child_welfare' : role;
  return allMaps[normalizedRole] || policeMap; // Fallback to police
};
