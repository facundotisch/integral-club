import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function RankingPlantelPanel(props) {
  return <LegacyPanelWrapper panelId="ranking" renderFn={renderers.ranking} {...props} />;
}
