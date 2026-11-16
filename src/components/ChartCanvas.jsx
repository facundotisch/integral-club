import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar plugin de etiquetas numéricas
Chart.register(ChartDataLabels);

export default function ChartCanvas({ config, height }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    try {
      chartRef.current = new Chart(canvasRef.current, config);
    } catch (e) {
      console.error('Chart.js render error:', e);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [config]);

  const heightStyle = height !== undefined
    ? (typeof height === 'number' ? { height: `${height}px` } : { height })
    : { height: '100%' };

  return (
    <div 
      className="chart-wrap" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        marginTop: 0, 
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...heightStyle 
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          display: 'block'
        }} 
      />
    </div>
  );
}
