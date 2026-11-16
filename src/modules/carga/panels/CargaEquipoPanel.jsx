import React from 'react';
import LegacyPanelWrapper from '../components/LegacyPanelWrapper';
import { renderers } from '../../../panels/legacyRenderers';

export default function CargaEquipoPanel(props) {
  return <LegacyPanelWrapper panelId="carga" renderFn={renderers.carga} {...props} />;
}
