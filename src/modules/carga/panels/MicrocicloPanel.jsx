import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function MicrocicloPanel(props) {
  return <LegacyPanelWrapper panelId="colent" renderFn={renderers.colent} {...props} />;
}
