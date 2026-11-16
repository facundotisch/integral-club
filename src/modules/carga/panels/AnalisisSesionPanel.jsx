import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function AnalisisSesionPanel(props) {
  return <LegacyPanelWrapper panelId="sesion" renderFn={renderers.sesion} {...props} />;
}
