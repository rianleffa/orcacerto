import React from 'react';
import { Budget, CompanyProfile } from '../../types/database';
import { ModernTemplate } from './ModernTemplate';
import { ElegantTemplate } from './ElegantTemplate';
import { MinimalistTemplate } from './MinimalistTemplate';

interface BudgetTemplateRendererProps {
  budget: Budget;
  company: CompanyProfile;
}

export const BudgetTemplateRenderer: React.FC<BudgetTemplateRendererProps> = ({
  budget,
  company,
}) => {
  switch (budget.template_id) {
    case 'elegant':
      return <ElegantTemplate budget={budget} company={company} />;
    case 'minimalist':
      return <MinimalistTemplate budget={budget} company={company} />;
    case 'modern':
    default:
      return <ModernTemplate budget={budget} company={company} />;
  }
};
