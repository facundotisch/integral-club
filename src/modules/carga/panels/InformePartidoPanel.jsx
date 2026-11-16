import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function InformePartidoPanel(props) {
  return <LegacyPanelWrapper panelId="partido" renderFn={renderers.partido} {...props} />;
}
