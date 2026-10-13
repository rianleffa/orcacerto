import React from 'react';
import { recordSiteVisit } from '../../lib/analytics';

export const SiteVisitTracker: React.FC = () => {
  React.useEffect(() => {
    void recordSiteVisit();
  }, []);

  return null;
};
