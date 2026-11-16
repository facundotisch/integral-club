import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function InformeJugadorPanel(props) {
  return <LegacyPanelWrapper panelId="informe" renderFn={renderers.informe} {...props} />;
}
