import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function PlanillaSemanalPanel(props) {
  return <LegacyPanelWrapper panelId="planilla" renderFn={renderers.planilla} {...props} />;
}
