import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function CompararJugadoresPanel(props) {
  return <LegacyPanelWrapper panelId="comparar" renderFn={renderers.comparar} {...props} />;
}
