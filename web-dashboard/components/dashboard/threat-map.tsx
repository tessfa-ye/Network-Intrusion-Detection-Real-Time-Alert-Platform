"use client";

import React, { useMemo } from 'react';
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
}

interface ThreatMapProps {
  threats: ThreatPoint[];
}

export function ThreatMap({ threats }: ThreatMapProps) {
  // Memoize the map to prevent rerenders during stream updates
  const mapContent = useMemo(() => (
    <ComposableMap
      projectionConfig={{
        rotate: [-10, 0, 0],
        scale: 147
      }}
      style={{
        width: "100%",
        height: "auto",
      }}
    >
      <Sphere id="sphere" stroke="#2a2e35" strokeWidth={0.5} fill="transparent" />
      <Graticule stroke="#2a2e35" strokeWidth={0.5} />
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="#1a1c23"
              stroke="#2a2e35"
              strokeWidth={0.5}
              style={{
                default: { outline: "none" },
                hover: { fill: "#21262d", outline: "none" },
                pressed: { outline: "none" },
              }}
            />
          ))
        }
      </Geographies>

      {threats.map(({ id, lat, lon, severity, city }) => (
        <Marker key={id} coordinates={[lon, lat]}>
          <g>
            {/* Pulse Animation */}
            <circle
              className="animate-ping"
              r={severity === 'critical' ? 6 : severity === 'high' ? 4 : 3}
              fill={
                severity === 'critical' ? '#ef4444' : 
                severity === 'high' ? '#f97316' : 
                '#eab308'
              }
              opacity={0.6}
            />
            {/* Solid Dot */}
            <circle
              r={severity === 'critical' ? 4 : severity === 'high' ? 3 : 2}
              fill={
                severity === 'critical' ? '#ef4444' : 
                severity === 'high' ? '#f97316' : 
                '#eab308'
              }
              className="cursor-pointer"
            />
            {/* Tooltip-like text on hover (Optional: css classes) */}
            <title>{`${severity.toUpperCase()} Attack in ${city || 'Unknown'}`}</title>
          </g>
        </Marker>
      ))}
    </ComposableMap>
  ), [threats]);

  return (
    <div className="relative w-full aspect-[16/9] bg-[#0d1117] rounded-xl border border-white/5 overflow-hidden shadow-2xl">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
         <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Live Threat Map</span>
      </div>
      
      {mapContent}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[9px] text-white/50 uppercase">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-[9px] text-white/50 uppercase">High</span>
        </div>
      </div>
    </div>
  );
}
