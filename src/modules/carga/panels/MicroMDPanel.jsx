import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function MicroMDPanel(props) {
  return <LegacyPanelWrapper panelId="microMD" renderFn={renderers.microMD} {...props} />;
}
