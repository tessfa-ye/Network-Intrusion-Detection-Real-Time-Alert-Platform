"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Sphere,
  Graticule
} from 'react-simple-maps';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface ThreatPoint {
  id: string;
  lat: number;
  lon: number;
  severity: string;
  city?: string;
  country?: string;
  sourceIP?: string;
}

interface ThreatMapProps {
  threats: ThreatPoint[];
}

export function ThreatMap({ threats }: ThreatMapProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    land: isDark ? '#1e293b' : '#e2e8f0',
    border: isDark ? '#334155' : '#cbd5e1',
    graticule: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? 'text-blue-400/80' : 'text-slate-600',
    legendText: isDark ? 'text-white/60' : 'text-slate-500'
  };

  const mapContent = useMemo(() => (
    <ComposableMap
      projectionConfig={{
        rotate: [-10, 0, 0],
        scale: 165,
        center: [0, 5]
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <Sphere id="sphere" stroke={colors.border} strokeWidth={0.5} fill="transparent" />
      <Graticule stroke={colors.graticule} strokeWidth={0.5} />
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies
            .filter(geo => geo.properties.name !== "Antarctica")
            .map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={colors.land}
              stroke={colors.border}
              strokeWidth={0.3}
              style={{
                default: { outline: "none" },
                hover: { fill: isDark ? "#334155" : "#cbd5e1", outline: "none" },
                pressed: { outline: "none" },
              }}
            />
          ))
        }
      </Geographies>

      {threats.map(({ id, lat, lon, severity, city, country, sourceIP }) => (
        <Marker key={id} coordinates={[lon, lat]}>
          <g>
            <circle
              className="animate-pulse"
              r={severity === 'critical' ? 8 : 6}
              fill={
                severity === 'critical' ? '#ef4444' : 
                severity === 'high' ? '#f97316' : 
                '#eab308'
              }
              opacity={0.4}
            />
            <circle
              r={severity === 'critical' ? 4 : 3}
              fill={
                severity === 'critical' ? '#ef4444' : 
                severity === 'high' ? '#f97316' : 
                '#eab308'
              }
              className="cursor-pointer"
            />
            <title>{`${severity.toUpperCase()} Attack in ${city || 'Unknown'}${country ? `, ${country}` : ''} (${sourceIP || 'No IP'})`}</title>
          </g>
        </Marker>
      ))}
    </ComposableMap>
  ), [threats, isDark, colors]);

  if (!mounted) return <div className="w-full h-full bg-slate-100 dark:bg-[#020617] rounded-xl animate-pulse" />;

  return (
    <div 
        className="relative w-full h-full overflow-hidden transition-all duration-500"
        style={{ backgroundColor: colors.bg }}
    >
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-white/10 dark:bg-black/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-sm">
         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
         <span className={`text-xs uppercase tracking-[0.2em] font-bold ${colors.text}`}>Live Threat Intelligence</span>
      </div>
      
      <div className="flex items-center justify-center h-full w-full">
         {mapContent}
      </div>
    </div>
  );
}
