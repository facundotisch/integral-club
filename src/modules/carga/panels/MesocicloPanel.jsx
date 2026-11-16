import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function MesocicloPanel(props) {
  return <LegacyPanelWrapper panelId="meso" renderFn={renderers.meso} {...props} />;
}
