import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // We can load any initial data for the dashboard here
  return {
    stats: {
      users: 1254,
      dataEntries: 24589,
      reports: 142
    }
  };
};