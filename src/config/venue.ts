/**
 * OFFICIAL VENUE DIMENSIONS & PLANIMETRY (Units: meters & m²)
 * Source of truth: Official Cenexpo C.A. PDFs:
 * 1. "PABELLON AGROALIENTARIO.pdf" (Pages 4 & 5: Plano General & Planimetría del Salón de Exposiciones)
 * 2. "PARTICIPACIÓN EXPOAUTO.pdf" (Pages 4 & 5: Vista General & Planimetría e Inversión por Espacio)
 */

export const VENUE_DIMENSIONS = {
  // 1. Salón de Exposiciones (Nave principal posterior del Casino Militar)
  HALL_W: 38.0, // meters total horizontal length (25m stands zone + 6.5m round tables lounge + 6.5m SHOW BISNET)
  HALL_L: 21.5, // meters total vertical width (from top wall z=0 to bottom wall z=21.5)
  HALL_H: 6.5,  // meters interior height to ceiling/trusses
  HALL_TOTAL_AREA_M2: 817.0, // 38.0m x 21.5m

  // Main entrance/exit door on the left wall (between island 17 and stand 01)
  ENTRANCE_DOOR_Z: 16.5,
  ENTRANCE_DOOR_WIDTH: 3.0,

  // Stand Type 1: Rosado (Pared inferior de entrada, stands 01 al 09)
  ROSADO_FRONT: 2.5, // meters wide
  ROSADO_DEPTH: 3.0, // meters deep
  ROSADO_AREA_M2: 7.5, // 2,5 x 3 = 7,50 m²
  ROSADO_PRICE_USD: 480, // $480 Tasa BCV€

  // Stand Type 2: Turquesa (Islas centrales y pared superior, stands 10 al 51)
  TURQUESA_FRONT: 2.5, // meters wide
  TURQUESA_DEPTH: 2.0, // meters deep
  TURQUESA_AREA_M2: 5.0, // 2,5 x 2 = 5,00 m²
  TURQUESA_PRICE_USD: 400, // $400 Tasa BCV€

  STAND_HEIGHT: 2.4, // meters standard partition height

  // Interior Aisles (Salón de Exposiciones)
  AISLE_LEFT_W: 2.5,      // Left access corridor (x = 0 to 2.5m)
  AISLE_TOP_W: 2.5,       // Top aisle between row 51-42 and island 34-41 (z = 2.0 to 4.5m)
  AISLE_CENTER_W: 2.0,    // Central aisle between island 33-26 and island 25-18 (z = 8.5 to 10.5m)
  AISLE_SOUTH_W: 4.0,     // Main entrance aisle between island 17-10 and row 01-09 (z = 14.5 to 18.5m)

  // Networking Round Tables Zone (7 tables x 6 chairs = 42 seats)
  ROUND_TABLES_ZONE: {
    xMin: 25.0,
    xMax: 31.5,
    zMin: 0.5,
    zMax: 18.5,
    width: 6.5,
    length: 18.0,
    areaM2: 117.0,
    tablesCount: 7,
    chairsPerTable: 6,
  },

  // SHOW BISNET Stage (Right side of the Exhibition Hall)
  SHOW_BISNET: {
    xMin: 31.5,
    xMax: 38.0,
    zMin: 0.0,
    zMax: 18.5,
    width: 6.5,
    length: 18.5,
    areaM2: 120.25,
  },

  // 2. Salón de Conferencias y Área de Rueda de Negocios (3-story main Casino building)
  CONF_HALL: {
    width: 22.0,
    length: 18.0,
    areaM2: 396.0,
    porchWidth: 6.0,
    porchDepth: 5.0,
    floors: 3,
  },

  // 3. Área Festival Automotriz - Expoauto La Grita 2026 (8 numbered vehicle zones)
  EXPOAUTO: {
    totalExhibitionAreaM2: 990,
    totalLotWidth: 68.0,
    totalLotDepth: 32.0,
    zonesCount: 8,
  },
} as const;

export type StandType =
  | 'turquesa'
  | 'rosado'
  | 'expoauto_100'
  | 'expoauto_110'
  | 'expoauto_140'
  | 'expoauto_170';

export type StandStatus = 'disponible' | 'reservado' | 'vendido' | 'bloqueado';
export type StandFacing = '+z' | '-z' | '+x' | '-x';

export interface StandRecord {
  id: string;
  code: string;
  zone_id: 'zone-exposicion' | 'zone-automotriz';
  x: number;
  z: number;
  width: number;  // span along horizontal axis (meters)
  depth: number;  // span along vertical axis (meters)
  area_m2: number; // official area in m²
  rotation: number;
  facing: StandFacing;
  type: StandType;
  price_usd: number;
  location_label: string;
  status: StandStatus;
  hold_until: string | null;
  exhibitor_id: string | null;
}

export const STAND_TYPE_META: Record<
  StandType,
  {
    label: string;
    shortLabel: string;
    color: string;
    dimensionsLabel: string;
    areaM2: number;
    priceUsd: number;
    officialNote: string;
  }
> = {
  rosado: {
    label: 'Salón Exposición · Tipo Rosado (7,50 m²)',
    shortLabel: 'Rosado 7,50 m² ($480)',
    color: '#F5B7B8',
    dimensionsLabel: '2,50 m × 3,00 m = 7,50 m²',
    areaM2: 7.5,
    priceUsd: 480,
    officialNote: 'Pared inferior de entrada (Stands 01 al 08) · $480 a Tasa BCV€',
  },
  turquesa: {
    label: 'Salón Exposición · Tipo Turquesa (5,00 m²)',
    shortLabel: 'Turquesa 5,00 m² ($400)',
    color: '#4DA1A9',
    dimensionsLabel: '2,50 m × 2,00 m = 5,00 m²',
    areaM2: 5.0,
    priceUsd: 400,
    officialNote: '4 islas centrales de 6 módulos (09 al 32) y pared norte (33 al 41) · $400 a Tasa BCV€',
  },
  expoauto_100: {
    label: 'Expoauto · Verde Claro (100 m²)',
    shortLabel: 'Expoauto 100 m² ($1.600)',
    color: '#CBE8CC',
    dimensionsLabel: '10,0 m × 10,0 m = 100 m²',
    areaM2: 100,
    priceUsd: 1600,
    officialNote: 'Frente a Calle Vía Llano Los Zambranos (Zonas 2, 3, 4 y 5) · $1.600 a Tasa BCV',
  },
  expoauto_110: {
    label: 'Expoauto · Rosado (110 m²)',
    shortLabel: 'Expoauto 110 m² ($1.750)',
    color: '#F8CECC',
    dimensionsLabel: '10,0 m × 11,0 m = 110 m²',
    areaM2: 110,
    priceUsd: 1750,
    officialNote: 'Sector diagonal superior izquierdo (Zona 6) · $1.750 a Tasa BCV',
  },
  expoauto_140: {
    label: 'Expoauto · Naranja (140 m²)',
    shortLabel: 'Expoauto 140 m² ($1.950)',
    color: '#F7A464',
    dimensionsLabel: '10,0 m × 14,0 m = 140 m²',
    areaM2: 140,
    priceUsd: 1950,
    officialNote: 'Sector diagonal central (Zona 7) · $1.950 a Tasa BCV',
  },
  expoauto_170: {
    label: 'Expoauto · Celeste (170 m²)',
    shortLabel: 'Expoauto 170 m² ($2.100)',
    color: '#84CEF2',
    dimensionsLabel: '10,0 m × 17,0 m = 170 m²',
    areaM2: 170,
    priceUsd: 2100,
    officialNote: 'Zonas amplias junto al edificio principal (Zonas 1 y 8) · $2.100 a Tasa BCV',
  },
};

export const STAND_STATUS_META: Record<
  StandStatus,
  { label: string; color: string; bgTint: string; borderTint: string; iconName: 'check' | 'clock' | 'lock' | 'slash' }
> = {
  disponible: {
    label: 'Disponible',
    color: '#2F9E44',
    bgTint: '#EBF7EE',
    borderTint: '#2F9E44',
    iconName: 'check',
  },
  reservado: {
    label: 'Reservado (48 h)',
    color: '#E8A317',
    bgTint: '#FDF6E7',
    borderTint: '#E8A317',
    iconName: 'clock',
  },
  vendido: {
    label: 'Vendido',
    color: '#B23A2E',
    bgTint: '#FBECEB',
    borderTint: '#B23A2E',
    iconName: 'lock',
  },
  bloqueado: {
    label: 'Bloqueado',
    color: '#9AA59F',
    bgTint: '#F1F3F2',
    borderTint: '#9AA59F',
    iconName: 'slash',
  },
};

/**
 * Generates the exact 41 stands of the updated Salón de Exposiciones planimetry (01 to 41):
 * - 8 Rosado stands (01 to 08) along the bottom entrance wall (2.5m x 3.0m = 7.50 m²)
 * - 24 Turquesa stands (09 to 32) arranged in 4 central 3x2 islands with a central vertical aisle
 * - 9 Turquesa stands (33 to 41) along the North wall (left to right: 41 down to 33)
 * plus the 8 official vehicle exhibition spaces of Expoauto (EA-01 to EA-08).
 */
export function generateInitialStands(): StandRecord[] {
  const stands: StandRecord[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');

  // Exact stand assignments from the official Salón de Exposiciones planimetry:
  // Bloque principal (Sector Rosado 01–08):
  // - Stands 01 y 02: BISA
  // - Stands 03 y 04: Agrollano
  // - Stands 05 y 06: WOW (Wao)
  // - Stands 07 y 08: Helados La Cascada
  // Islas inferiores (Lado de La Cascada / Sector Turquesa 09–20):
  // - Stands 13, 14, 15 y 16: Banco Sofitasa
  // - Stand 17: Agro Insumos del Táchira
  // - Stand 12: Aldefrio (Al de Frío)
  // - Stand 18: Agrinova
  // - Stand 11: AgroMarket (El suyo / Presentador Digital)
  // - Stand 20: Tecnoagua (Tecno Agua)
  // - Stand 09: Inarvet / Narbhed (Por confirmar -> estado reservado)
  const confirmedExhibitorsByStandCode: Record<string, string> = {
    '01': 'org-bisa',
    '02': 'org-bisa',
    '03': 'org-agrollano',
    '04': 'org-agrollano',
    '05': 'org-wow',
    '06': 'org-wow',
    '07': 'org-helados-la-cascada',
    '08': 'org-helados-la-cascada',
    '11': 'org-agromarket',
    '12': 'org-aldefrio',
    '13': 'org-sofitasa',
    '14': 'org-sofitasa',
    '15': 'org-sofitasa',
    '16': 'org-sofitasa',
    '17': 'org-agro-insumos-tachira',
    '18': 'org-agrinova',
    '20': 'org-tecno-agua',
  };

  // Stands pre-assigned as "Por confirmar" (Reservado)
  const pendingExhibitorsByStandCode: Record<string, { exhibitorId: string; holdUntil: string }> = {
    '09': {
      exhibitorId: 'org-inarvet',
      holdUntil: '2026-11-23T23:59:59.000Z',
    },
  };

  // ---------------------------------------------------------------------------
  // A. SALÓN DE EXPOSICIONES: 41 STANDS (Codes "01" through "41")
  // Coordinate system: x from 0 to 38.0 m (left to right), z from 0 to 21.5 m (top to bottom)
  // ---------------------------------------------------------------------------

  // 1. Bottom Wall Row: Stands 01 to 08 (Left to Right, Rosado 2.5m x 3.0m = 7.50 m², $480)
  for (let i = 1; i <= 8; i++) {
    const code = pad(i);
    const x = (i - 1) * 2.5; // x from 0.0 to 17.5 (total span 20.0m, ends at x=20.0)
    const sponsorId = confirmedExhibitorsByStandCode[code] ?? null;
    stands.push({
      id: `stand-${code}`,
      code,
      zone_id: 'zone-exposicion',
      x,
      z: 18.5, // bottom wall z = 18.5 to 21.5 (depth 3.0m)
      width: 2.5,
      depth: 3.0,
      area_m2: 7.5,
      rotation: 0,
      facing: '-z', // faces up toward the main entrance aisle
      type: 'rosado',
      price_usd: 480,
      location_label: 'Pared inferior de entrada · Sector Rosado (Salón de Exposiciones)',
      status: sponsorId ? 'vendido' : 'disponible',
      hold_until: null,
      exhibitor_id: sponsorId,
    });
  }

  // Helper to push a 3-column row of Turquesa stands (2.5m x 2.0m = 5.00 m², $400)
  const addIslandRow = (
    nums: number[],
    startX: number,
    z: number,
    facing: StandFacing,
    locationLabel: string
  ) => {
    nums.forEach((num, idx) => {
      const code = pad(num);
      const x = startX + idx * 2.5;
      const sponsorId = confirmedExhibitorsByStandCode[code] ?? null;
      const pendingInfo = pendingExhibitorsByStandCode[code] ?? null;
      stands.push({
        id: `stand-${code}`,
        code,
        zone_id: 'zone-exposicion',
        x,
        z,
        width: 2.5,
        depth: 2.0,
        area_m2: 5.0,
        rotation: facing === '+z' ? Math.PI : 0,
        facing,
        type: 'turquesa',
        price_usd: 400,
        location_label: locationLabel,
        status: sponsorId ? 'vendido' : pendingInfo ? 'reservado' : 'disponible',
        hold_until: pendingInfo ? pendingInfo.holdUntil : null,
        exhibitor_id: sponsorId ?? (pendingInfo ? pendingInfo.exhibitorId : null),
      });
    });
  };

  // 2. Bottom-Left Island (6 stands: bottom row 14, 13, 12; top row 15, 16, 17; x = 3.0 to 10.5m)
  addIslandRow([14, 13, 12], 3.0, 12.5, '+z', 'Isla Sur-Oeste · Fila inferior (Stands 12–14)');
  addIslandRow([15, 16, 17], 3.0, 10.5, '-z', 'Isla Sur-Oeste · Fila superior (Stands 15–17)');

  // 3. Bottom-Right Island (6 stands: bottom row 11, 10, 09; top row 18, 19, 20; x = 14.5 to 22.0m)
  addIslandRow([11, 10, 9], 14.5, 12.5, '+z', 'Isla Sur-Este · Fila inferior (Stands 09–11)');
  addIslandRow([18, 19, 20], 14.5, 10.5, '-z', 'Isla Sur-Este · Fila superior (Stands 18–20)');

  // 4. Top-Left Island (6 stands: bottom row 26, 25, 24; top row 27, 28, 29; x = 3.0 to 10.5m)
  addIslandRow([26, 25, 24], 3.0, 6.5, '+z', 'Isla Nor-Oeste · Fila inferior (Stands 24–26)');
  addIslandRow([27, 28, 29], 3.0, 4.5, '-z', 'Isla Nor-Oeste · Fila superior (Stands 27–29)');

  // 5. Top-Right Island (6 stands: bottom row 23, 22, 21; top row 30, 31, 32; x = 14.5 to 22.0m)
  addIslandRow([23, 22, 21], 14.5, 6.5, '+z', 'Isla Nor-Este · Fila inferior (Stands 21–23)');
  addIslandRow([30, 31, 32], 14.5, 4.5, '-z', 'Isla Nor-Este · Fila superior (Stands 30–32)');

  // 6. Top Wall Row: 9 Turquesa stands 41 down to 33 (Left to Right: 41, 40, 39, 38, 37, 36, 35, 34, 33)
  const topWallRow = [41, 40, 39, 38, 37, 36, 35, 34, 33];
  topWallRow.forEach((num, idx) => {
    const code = pad(num);
    const x = idx * 2.5; // x from 0.0 to 20.0 (total span 22.5m)
    stands.push({
      id: `stand-${code}`,
      code,
      zone_id: 'zone-exposicion',
      x,
      z: 0.0, // z from 0.0 to 2.0 along top wall
      width: 2.5,
      depth: 2.0,
      area_m2: 5.0,
      rotation: Math.PI,
      facing: '+z', // faces down toward top aisle
      type: 'turquesa',
      price_usd: 400,
      location_label: 'Pared superior norte (Stands 33–41 · Salón de Exposiciones)',
      status: 'disponible',
      hold_until: null,
      exhibitor_id: null,
    });
  });

  // ---------------------------------------------------------------------------
  // B. ÁREA FESTIVAL AUTOMOTRIZ - EXPOAUTO: 8 ZONAS (Codes "EA-01" through "EA-08")
  // ---------------------------------------------------------------------------
  const expoautoSpecs: Array<{
    num: number;
    type: StandType;
    area_m2: number;
    price_usd: number;
    x: number;
    z: number;
    width: number;
    depth: number;
    location_label: string;
  }> = [
    {
      num: 1,
      type: 'expoauto_170',
      area_m2: 170,
      price_usd: 2100,
      x: 52,
      z: 16,
      width: 14,
      depth: 12,
      location_label: 'Expoauto Zona 1 · Derecha de Entrada Principal (170 m²)',
    },
    {
      num: 2,
      type: 'expoauto_100',
      area_m2: 100,
      price_usd: 1600,
      x: 27,
      z: 18,
      width: 9,
      depth: 10,
      location_label: 'Expoauto Zona 2 · Frente a Vía Llano Los Zambranos (100 m²)',
    },
    {
      num: 3,
      type: 'expoauto_100',
      area_m2: 100,
      price_usd: 1600,
      x: 18,
      z: 18,
      width: 9,
      depth: 10,
      location_label: 'Expoauto Zona 3 · Frente a Vía Llano Los Zambranos (100 m²)',
    },
    {
      num: 4,
      type: 'expoauto_100',
      area_m2: 100,
      price_usd: 1600,
      x: 9,
      z: 18,
      width: 9,
      depth: 10,
      location_label: 'Expoauto Zona 4 · Frente a Vía Llano Los Zambranos (100 m²)',
    },
    {
      num: 5,
      type: 'expoauto_100',
      area_m2: 100,
      price_usd: 1600,
      x: 0,
      z: 18,
      width: 9,
      depth: 10,
      location_label: 'Expoauto Zona 5 · Extremo izquierdo frontal (100 m²)',
    },
    {
      num: 6,
      type: 'expoauto_110',
      area_m2: 110,
      price_usd: 1750,
      x: 0,
      z: 6,
      width: 12,
      depth: 9,
      location_label: 'Expoauto Zona 6 · Perímetro superior izquierdo (110 m²)',
    },
    {
      num: 7,
      type: 'expoauto_140',
      area_m2: 140,
      price_usd: 1950,
      x: 12,
      z: 4,
      width: 11,
      depth: 11,
      location_label: 'Expoauto Zona 7 · Perímetro superior central (140 m²)',
    },
    {
      num: 8,
      type: 'expoauto_170',
      area_m2: 170,
      price_usd: 2100,
      x: 23,
      z: 2,
      width: 11,
      depth: 13,
      location_label: 'Expoauto Zona 8 · Junto al Salón de Conferencias (170 m²)',
    },
  ];

  expoautoSpecs.forEach((sp) => {
    const code = `EA-0${sp.num}`;
    stands.push({
      id: `stand-ea-0${sp.num}`,
      code,
      zone_id: 'zone-automotriz',
      x: sp.x,
      z: sp.z,
      width: sp.width,
      depth: sp.depth,
      area_m2: sp.area_m2,
      rotation: 0,
      facing: '+z',
      type: sp.type,
      price_usd: sp.price_usd,
      location_label: sp.location_label,
      status: 'disponible',
      hold_until: null,
      exhibitor_id: null,
    });
  });

  // Sort stands so 01..51 come in numerical order followed by EA-01..EA-08
  return stands.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

/**
 * View `stands_public` logic:
 * Hides price_usd unless show_prices is true, and returns the effective status
 * (a "reservado" stand whose hold_until has passed reads as "disponible").
 */
export function getEffectiveStandStatus(stand: StandRecord, nowMs: number = Date.now()): StandStatus {
  if (stand.status === 'reservado' && stand.hold_until) {
    const holdTime = new Date(stand.hold_until).getTime();
    if (!Number.isNaN(holdTime) && holdTime <= nowMs) {
      return 'disponible';
    }
  }
  return stand.status;
}
