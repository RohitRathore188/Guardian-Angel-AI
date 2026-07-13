import type { WidgetConfig } from './types';
import citizenWidgets from './citizen.widgets';
import policeWidgets from './police.widgets';
import hospitalWidgets from './hospital.widgets';
import volunteerWidgets from './volunteer.widgets';
import ngoWidgets from './ngo.widgets';
import childWelfareWidgets from './childWelfare.widgets';
import adminWidgets from './admin.widgets';

export * from './types';

const allWidgets: Record<string, WidgetConfig[]> = {
  citizen: citizenWidgets,
  police: policeWidgets,
  hospital: hospitalWidgets,
  volunteer: volunteerWidgets,
  ngo: ngoWidgets,
  child_welfare: childWelfareWidgets,
  admin: adminWidgets,
};

export const getWidgets = (role: string): WidgetConfig[] => {
  const normalizedRole = role === 'childWelfare' ? 'child_welfare' : role;
  const list = allWidgets[normalizedRole] || [];
  return [...list].sort((a, b) => a.priority - b.priority);
};
