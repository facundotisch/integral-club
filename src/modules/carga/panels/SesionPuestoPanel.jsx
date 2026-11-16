import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function SesionPuestoPanel(props) {
  return <LegacyPanelWrapper panelId="sespos" renderFn={renderers.sespos} {...props} />;
}
