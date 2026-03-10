import { useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CountrySanctionData } from "../../lib/types";
import { DARK_BASEMAP, choroplethPaint, bubblePaint } from "../../lib/mapStyles";
import { MAP_CONFIG } from "../../lib/constants";


interface SanctionsMapProps {
  countryData: Record<string, CountrySanctionData>;
}

const CHOROPLETH_LAYER = "countries-choropleth";
const BORDER_LAYER = "countries-border";
const BUBBLE_LAYER = "countries-bubbles";
const SOURCE_ID = "countries";

function computeCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  const coords: number[][] = [];

  function collectCoords(g: GeoJSON.Geometry) {
    if (g.type === "Polygon") {
      for (const ring of g.coordinates) {
        for (const c of ring) coords.push(c);
      }
    } else if (g.type === "MultiPolygon") {
      for (const polygon of g.coordinates) {
        for (const ring of polygon) {
          for (const c of ring) coords.push(c);
        }
      }
    }
  }

  collectCoords(geometry);
  if (coords.length === 0) return null;

  let sumLng = 0;
  let sumLat = 0;
  for (const c of coords) {
    sumLng += c[0];
    sumLat += c[1];
  }
  return [sumLng / coords.length, sumLat / coords.length];
}

export function SanctionsMap({ countryData }: SanctionsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredIdRef = useRef<string | number | null>(null);
  const tooltipRef = useRef<maplibregl.Popup | null>(null);

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_BASEMAP,
      center: MAP_CONFIG.initialCenter,
      zoom: MAP_CONFIG.initialZoom,
      attributionControl: false,
      renderWorldCopies: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    mapRef.current = map;

    map.on("load", async () => {
      try {
        const res = await fetch("/countries.geojson");
        if (!res.ok) throw new Error("Failed to load GeoJSON");
        const geojson = await res.json();

        // Enrich features with sanctions data
        const bubbleFeatures: GeoJSON.Feature[] = [];

        for (const feature of geojson.features) {
          const iso2 = feature.properties?.["ISO3166-1-Alpha-2"];
          const data = iso2 ? countryData[iso2] : undefined;

          feature.properties = {
            ...feature.properties,
            total: data?.total ?? 0,
            sdn: data?.sdn ?? 0,
            consolidated: data?.consolidated ?? 0,
            daily_added: data?.daily_added ?? 0,
            daily_removed: data?.daily_removed ?? 0,
            net_change: data
              ? data.daily_added - data.daily_removed
              : 0,
            has_sanctions: data ? data.total > 0 : false,
            programs: data?.programs?.join(", ") ?? "",
            country_name: data?.name ?? feature.properties?.name ?? "",
          };

          // Build bubble features for countries with daily changes
          if (data && (data.daily_added + data.daily_removed > 0)) {
            const centroid = computeCentroid(feature.geometry);
            if (centroid) {
              bubbleFeatures.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: centroid },
                properties: { ...feature.properties },
              });
            }
          }
        }

        // Add polygon source
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: geojson,
          generateId: true,
        });

        // Add bubble source
        map.addSource("country-bubbles", {
          type: "geojson",
          data: { type: "FeatureCollection", features: bubbleFeatures },
        });

        // Choropleth fill layer
        map.addLayer({
          id: CHOROPLETH_LAYER,
          type: "fill",
          source: SOURCE_ID,
          paint: choroplethPaint as maplibregl.FillLayerSpecification["paint"],
        });

        // Border line layer
        map.addLayer({
          id: BORDER_LAYER,
          type: "line",
          source: SOURCE_ID,
          paint: {
            "line-color": "rgba(255, 255, 255, 0.15)",
            "line-width": 0.5,
          },
        });

        // Bubble layer
        map.addLayer({
          id: BUBBLE_LAYER,
          type: "circle",
          source: "country-bubbles",
          paint: bubblePaint as maplibregl.CircleLayerSpecification["paint"],
        });

        // Hover effect via feature-state
        map.on("mousemove", CHOROPLETH_LAYER, (e) => {
          if (!e.features || e.features.length === 0) return;

          // Clear previous hover
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: SOURCE_ID, id: hoveredIdRef.current },
              { hover: false }
            );
          }

          const feature = e.features[0];
          const featureId = feature.id;
          if (featureId === undefined) return;

          hoveredIdRef.current = featureId;
          map.setFeatureState(
            { source: SOURCE_ID, id: featureId },
            { hover: true }
          );

          map.getCanvas().style.cursor = "pointer";

          // Tooltip
          const name =
            feature.properties?.country_name || feature.properties?.name || "Unknown";
          const total = feature.properties?.total ?? 0;

          if (!tooltipRef.current) {
            tooltipRef.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: "sanctions-tooltip",
              offset: 12,
            });
          }

          tooltipRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family: var(--font-mono, monospace); font-size: 12px; padding: 2px 0;">
                <strong>${name}</strong><br/>
                <span style="color: #9ca3af;">Sanctions: </span>${Number(total).toLocaleString()}
              </div>`
            )
            .addTo(map);
        });

        map.on("mouseleave", CHOROPLETH_LAYER, () => {
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: SOURCE_ID, id: hoveredIdRef.current },
              { hover: false }
            );
            hoveredIdRef.current = null;
          }
          map.getCanvas().style.cursor = "";
          tooltipRef.current?.remove();
        });

        // Click popup with details
        map.on("click", CHOROPLETH_LAYER, (e) => {
          if (!e.features || e.features.length === 0) return;

          const props = e.features[0].properties;
          if (!props) return;

          const name = props.country_name || props.name || "Unknown";
          const total = Number(props.total ?? 0);
          const sdn = Number(props.sdn ?? 0);
          const consolidated = Number(props.consolidated ?? 0);
          const programs = props.programs || "";
          const dailyAdded = Number(props.daily_added ?? 0);
          const dailyRemoved = Number(props.daily_removed ?? 0);
          const netChange = dailyAdded - dailyRemoved;

          const programsList = programs
            ? programs
                .split(", ")
                .map(
                  (p: string) =>
                    `<span style="display:inline-block;background:rgba(59,130,246,0.2);color:#60a5fa;padding:1px 6px;border-radius:4px;font-size:10px;margin:1px 2px;">${p}</span>`
                )
                .join("")
            : '<span style="color:#6b7280;">None</span>';

          const changeColor =
            netChange > 0 ? "#22c55e" : netChange < 0 ? "#ef4444" : "#6b7280";
          const changePrefix = netChange > 0 ? "+" : "";

          new maplibregl.Popup({
            closeButton: true,
            maxWidth: "280px",
            className: "sanctions-popup",
          })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family: var(--font-mono, monospace); font-size: 12px; line-height: 1.6;">
                <div style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #f1f5f9;">${name}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-bottom: 8px;">
                  <div><span style="color:#9ca3af;">Total</span></div>
                  <div style="text-align:right;font-weight:600;">${total.toLocaleString()}</div>
                  <div><span style="color:#9ca3af;">SDN</span></div>
                  <div style="text-align:right;">${sdn.toLocaleString()}</div>
                  <div><span style="color:#9ca3af;">Consolidated</span></div>
                  <div style="text-align:right;">${consolidated.toLocaleString()}</div>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; margin-bottom: 6px;">
                  <span style="color:#9ca3af;">Daily: </span>
                  <span style="color:#22c55e;">+${dailyAdded}</span>
                  <span style="color:#6b7280;"> / </span>
                  <span style="color:#ef4444;">-${dailyRemoved}</span>
                  <span style="color:#6b7280;"> = </span>
                  <span style="color:${changeColor};font-weight:600;">${changePrefix}${netChange}</span>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                  <div style="color:#9ca3af; margin-bottom: 3px;">Programs:</div>
                  <div style="display:flex;flex-wrap:wrap;">${programsList}</div>
                </div>
              </div>`
            )
            .addTo(map);
        });
      } catch (err) {
        console.error("Error loading map data:", err);
      }
    });
  }, [countryData]);

  useEffect(() => {
    initMap();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initMap]);

  return (
    <>
      <style>{`
        .sanctions-tooltip .maplibregl-popup-content {
          background: rgba(15, 23, 42, 0.95);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .sanctions-tooltip .maplibregl-popup-tip {
          border-top-color: rgba(15, 23, 42, 0.95);
        }
        .sanctions-popup .maplibregl-popup-content {
          background: rgba(15, 23, 42, 0.95);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 14px 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        }
        .sanctions-popup .maplibregl-popup-tip {
          border-top-color: rgba(15, 23, 42, 0.95);
        }
        .sanctions-popup .maplibregl-popup-close-button {
          color: #9ca3af;
          font-size: 18px;
          padding: 4px 8px;
        }
        .sanctions-popup .maplibregl-popup-close-button:hover {
          color: #f1f5f9;
          background: transparent;
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
      />
    </>
  );
}
