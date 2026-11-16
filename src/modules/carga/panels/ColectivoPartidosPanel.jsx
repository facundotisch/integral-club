import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function ColectivoPartidosPanel(props) {
  return <LegacyPanelWrapper panelId="colpart" renderFn={renderers.colpart} {...props} />;
}
