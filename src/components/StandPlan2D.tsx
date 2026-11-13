import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  Slash,
  Search,
  Map as MapIcon,
  List,
  X,
  MessageSquare,
  Truck,
  FileText,
  Ruler,
  Box,
} from 'lucide-react';
import {
  VENUE_DIMENSIONS,
  STAND_TYPE_META,
  STAND_STATUS_META,
  StandType,
  StandStatus,
} from '../config/venue';
import { PublicStandView } from '../data/store';
import { buildWhatsAppBookingLink } from '../utils/passUtils';

const LazyMaquette3DCanvas = React.lazy(() => import('./Maquette3DCanvas'));

interface StandPlan2DProps {
  stands: PublicStandView[];
  selectedStandCode: string | null;
  onSelectStand: (code: string | null) => void;
  whatsappPrimary: string;
  onRequestStandModal: (standCode?: string) => void;
  force3DTrigger?: number;
}

export const StatusIcon: React.FC<{ status: StandStatus; className?: string }> = ({
  status,
  className = 'h-3.5 w-3.5',
}) => {
  switch (status) {
    case 'disponible':
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case 'reservado':
      return <Clock className={className} aria-hidden="true" />;
    case 'vendido':
      return <Lock className={className} aria-hidden="true" />;
    case 'bloqueado':
      return <Slash className={className} aria-hidden="true" />;
  }
};

export const StandPlan2D: React.FC<StandPlan2DProps> = ({
  stands,
  selectedStandCode,
  onSelectStand,
  whatsappPrimary,
  onRequestStandModal,
  force3DTrigger = 0,
}) => {
  const [activePlanTab, setActivePlanTab] = useState<
    'maqueta3d' | 'salon' | 'expoauto' | 'laminas' | 'list'
  >(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('vista=3d')) {
      return 'maqueta3d';
    }
    return 'salon';
  });
  const [statusFilter, setStatusFilter] = useState<StandStatus | 'todos'>('todos');
  const [typeFilter, setTypeFilter] = useState<StandType | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (force3DTrigger > 0) {
      setActivePlanTab('maqueta3d');
    }
  }, [force3DTrigger]);

  const salonStands = useMemo(
    () => stands.filter((s) => s.zone_id === 'zone-exposicion'),
    [stands]
  );

  const filteredStands = useMemo(() => {
    return stands.filter((s) => {
      if (statusFilter !== 'todos' && s.effective_status !== statusFilter) return false;
      if (typeFilter !== 'todos' && s.type !== typeFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = s.code.toLowerCase().includes(q);
        const matchLoc = s.location_label.toLowerCase().includes(q);
        const matchExh = s.exhibitor?.name.toLowerCase().includes(q) ?? false;
        const matchSector = s.exhibitor?.sector.toLowerCase().includes(q) ?? false;
        if (!matchCode && !matchLoc && !matchExh && !matchSector) return false;
      }
      return true;
    });
  }, [stands, statusFilter, typeFilter, searchQuery]);

  const filteredSet = useMemo(() => new Set(filteredStands.map((s) => s.code)), [filteredStands]);

  const selectedStand = useMemo(
    () => stands.find((s) => s.code.toUpperCase() === selectedStandCode?.toUpperCase()) || null,
    [stands, selectedStandCode]
  );

  // SVG scale for Salón de Exposiciones: 1 meter = 22 units (38m * 22 = 836, 21.5m * 22 = 473)
  const SCALE = 22;
  const SVG_W = VENUE_DIMENSIONS.HALL_W * SCALE; // 836
  const SVG_H = VENUE_DIMENSIONS.HALL_L * SCALE; // 473

  const statusCounts = useMemo(() => {
    return stands.reduce<Record<StandStatus, number>>(
      (acc, s) => {
        acc[s.effective_status] = (acc[s.effective_status] || 0) + 1;
        return acc;
      },
      { disponible: 0, reservado: 0, vendido: 0, bloqueado: 0 }
    );
  }, [stands]);

  // 7 Round tables coordinates in meters inside the networking lounge (x from 26.2 to 29.5, z from 3.5 to 16.5)
  const roundTablesCoords = [
    { id: 1, x: 26.4, z: 6.2 },
    { id: 2, x: 26.4, z: 9.8 },
    { id: 3, x: 26.4, z: 13.4 },
    { id: 4, x: 29.1, z: 4.5 },
    { id: 5, x: 29.1, z: 8.1 },
    { id: 6, x: 29.1, z: 11.7 },
    { id: 7, x: 29.1, z: 15.3 },
  ];

  // Structural wall pillars along the bottom row (matching the grey squares in PABELLON_AGROALIENTARIO page 5)
  const bottomPillarsX = [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 31.5];

  return (
    <div className="rounded-[12px] border border-[#1F2421]/15 bg-white p-4 sm:p-6 shadow-sm">
      {/* Top bar: Title + Mode Tabs */}
      <div className="flex flex-col gap-4 border-b border-[#1F2421]/10 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-display-wide text-scale-20 sm:text-scale-25 text-[#1F2421]">
              Maqueta 3D y Planimetría · El Casino Militar de La Grita
            </span>
            <span className="rounded-[4px] bg-[#1E7A34]/15 px-2.5 py-0.5 text-scale-14 font-semibold text-[#0F3D22]">
              41 Stands Salón + 8 Zonas Expoauto
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#1E7A34]/30 bg-[#EAF5EC] px-2.5 py-0.5 text-[12px] font-bold text-[#0F3D22]">
              <span className="h-2 w-2 rounded-full bg-[#1E7A34]" aria-hidden="true" />
              Tiempo real activo
            </span>
          </div>
          <p className="mt-1 text-scale-14 text-[#1F2421]/80">
            Planimetría oficial actualizada del Salón de Exposiciones a Tasa BCV€: 8 Stands Rosados de{' '}
            <strong>2,5 × 3,0 m = 7,50 m² ($480)</strong> (01 al 08), 33 Stands Turquesa de{' '}
            <strong>2,5 × 2,0 m = 5,00 m² ($400)</strong> (09 al 41) y 8 Zonas de Expoauto de{' '}
            <strong>100 m² ($1.600) a 170 m² ($2.100)</strong>.
          </p>
        </div>

        {/* 5 View Switcher Tabs (3D Maquette + 2D Salon + 2D Expoauto + PDFs + List) */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          <button
            type="button"
            onClick={() => setActivePlanTab('maqueta3d')}
            aria-pressed={activePlanTab === 'maqueta3d'}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-[4px] px-3.5 py-2 text-scale-14 font-bold transition-colors whitespace-nowrap ${
              activePlanTab === 'maqueta3d'
                ? 'bg-[#0F3D22] text-[#F4C20D] shadow-sm'
                : 'border-2 border-[#0F3D22] bg-[#EEF2EF] text-[#0F3D22] hover:bg-[#0F3D22] hover:text-[#F4C20D]'
            }`}
          >
            <Box className="h-4 w-4" aria-hidden="true" />
            Maqueta 3D Interactiva
          </button>

          <button
            type="button"
            onClick={() => setActivePlanTab('salon')}
            aria-pressed={activePlanTab === 'salon'}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-[4px] px-3.5 py-2 text-scale-14 font-semibold transition-colors whitespace-nowrap ${
              activePlanTab === 'salon'
                ? 'bg-[#1E7A34] text-white'
                : 'border border-[#1F2421]/20 bg-[#EEF2EF] text-[#1F2421] hover:bg-[#1F2421]/10'
            }`}
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            Plano 2D Salón (41)
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePlanTab('expoauto');
              if (!selectedStandCode?.startsWith('EA-')) {
                onSelectStand('EA-01');
              }
            }}
            aria-pressed={activePlanTab === 'expoauto'}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-[4px] px-3.5 py-2 text-scale-14 font-semibold transition-colors whitespace-nowrap ${
              activePlanTab === 'expoauto'
                ? 'bg-[#1F4E9C] text-white'
                : 'border border-[#1F2421]/20 bg-[#EEF2EF] text-[#1F2421] hover:bg-[#1F2421]/10'
            }`}
          >
            <Truck className="h-4 w-4" aria-hidden="true" />
            Plano Expoauto (8 Zonas)
          </button>

          <button
            type="button"
            onClick={() => setActivePlanTab('laminas')}
            aria-pressed={activePlanTab === 'laminas'}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-[4px] px-3.5 py-2 text-scale-14 font-semibold transition-colors whitespace-nowrap ${
              activePlanTab === 'laminas'
                ? 'bg-[#0F3D22] text-[#F4C20D]'
                : 'border border-[#1F2421]/20 bg-[#EEF2EF] text-[#1F2421] hover:bg-[#1F2421]/10'
            }`}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Láminas y Fotos PDF
          </button>

          <button
            type="button"
            onClick={() => setActivePlanTab('list')}
            aria-pressed={activePlanTab === 'list'}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-[4px] px-3.5 py-2 text-scale-14 font-semibold transition-colors whitespace-nowrap ${
              activePlanTab === 'list'
                ? 'bg-[#1E7A34] text-white'
                : 'border border-[#1F2421]/20 bg-[#EEF2EF] text-[#1F2421] hover:bg-[#1F2421]/10'
            }`}
          >
            <List className="h-4 w-4" aria-hidden="true" />
            Lista ({filteredStands.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <label htmlFor="stand-search" className="sr-only">
            Buscar stand por número, marca o zona
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F2421]/60"
              aria-hidden="true"
            />
            <input
              id="stand-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar stand o marca (ej. 01, Bisa, Sofitasa, Agrollano, AgroMarket)..."
              className="w-full min-h-[44px] rounded-[4px] border border-[#1F2421]/25 bg-[#EEF2EF]/60 pl-9 pr-3 py-2 text-scale-14 text-[#1F2421] placeholder:text-[#1F2421]/60 focus:border-[#1F4E9C] focus:bg-white"
            />
          </div>
        </div>

        <div className="md:col-span-4">
          <label htmlFor="stand-status-filter" className="sr-only">
            Filtrar por estado de disponibilidad
          </label>
          <select
            id="stand-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StandStatus | 'todos')}
            className="w-full min-h-[44px] rounded-[4px] border border-[#1F2421]/25 bg-[#EEF2EF]/60 px-3 py-2 text-scale-14 text-[#1F2421] focus:border-[#1F4E9C] focus:bg-white"
          >
            <option value="todos">Todos los estados ({stands.length} espacios)</option>
            <option value="disponible">Disponible ({statusCounts.disponible})</option>
            <option value="reservado">Reservado / Por confirmar ({statusCounts.reservado})</option>
            <option value="vendido">Vendido / Confirmado ({statusCounts.vendido})</option>
            <option value="bloqueado">Bloqueado ({statusCounts.bloqueado})</option>
          </select>
        </div>

        <div className="md:col-span-4">
          <label htmlFor="stand-type-filter" className="sr-only">
            Filtrar por tipo y medida oficial
          </label>
          <select
            id="stand-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as StandType | 'todos')}
            className="w-full min-h-[44px] rounded-[4px] border border-[#1F2421]/25 bg-[#EEF2EF]/60 px-3 py-2 text-scale-14 text-[#1F2421] focus:border-[#1F4E9C] focus:bg-white"
          >
            <option value="todos">Todas las medidas y tarifas (Tasa BCV)</option>
            <option value="rosado">Salón Rosado: 2,5 × 3 m = 7,50 m² · $480 (8 stands: 01–08)</option>
            <option value="turquesa">Salón Turquesa: 2,5 × 2 m = 5,00 m² · $400 (33 stands: 09–41)</option>
            <option value="expoauto_100">Expoauto Verde: 100 m² · $1.600 (Zonas 2, 3, 4 y 5)</option>
            <option value="expoauto_110">Expoauto Rosado: 110 m² · $1.750 (Zona 6)</option>
            <option value="expoauto_140">Expoauto Naranja: 140 m² · $1.950 (Zona 7)</option>
            <option value="expoauto_170">Expoauto Celeste: 170 m² · $2.100 (Zonas 1 y 8)</option>
          </select>
        </div>
      </div>

      {/* Main layout: Interactive Plan on Left (8 cols), Selected Stand Inspector & Legend on Right (4 cols) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {activePlanTab === 'maqueta3d' && (
            <Suspense
              fallback={
                <div className="flex h-[520px] w-full flex-col items-center justify-center rounded-[12px] border border-[#1F2421]/20 bg-[#0F3D22] p-6 text-center text-[#EEF2EF]">
                  <Box className="h-10 w-10 text-[#F4C20D]" aria-hidden="true" />
                  <p className="mt-3 font-display-wide text-scale-20">
                    Cargando Maqueta 3D Interactiva del Casino Militar...
                  </p>
                  <p className="mt-1 text-scale-14 text-[#EEF2EF]/80">
                    Inicializando geometría a escala real (38,0 × 21,5 m) e instancias 3D.
                  </p>
                </div>
              }
            >
              <LazyMaquette3DCanvas
                stands={stands}
                filteredCodes={filteredSet}
                selectedStandCode={selectedStandCode}
                onSelectStand={onSelectStand}
              />
            </Suspense>
          )}

          {activePlanTab === 'salon' && (
            <div className="rounded-[12px] border border-[#1F2421]/15 bg-[#EEF2EF] p-3 sm:p-4">
              {/* Top Pricing Header Strip matching the official Planimetría del Salón de Exposiciones */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#1F2421]/15 bg-white px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-8 rounded-[3px] border border-[#1F2421]/40 bg-[#F5B7B8] shrink-0" />
                    <div className="text-[13px] leading-tight">
                      <span className="font-bold text-[#1F2421]">2,5 × 3 = 7,50 m²</span>
                      <span className="ml-1.5 font-display-wide text-[#0F3D22]">480 $</span>
                      <span className="block text-[11px] text-[#1F2421]/70">Bloque Principal: Stands 01 al 08</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-6 w-8 rounded-[3px] border border-[#1F2421]/40 bg-[#4DA1A9] shrink-0" />
                    <div className="text-[13px] leading-tight">
                      <span className="font-bold text-[#1F2421]">2,5 × 2 = 5,00 m²</span>
                      <span className="ml-1.5 font-display-wide text-[#0F3D22]">400 $</span>
                      <span className="block text-[11px] text-[#1F2421]/70">4 Islas centrales (09–32) y Pared norte (33–41)</span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#0F3D22]/25 bg-[#EEF2EF] px-2.5 py-1 text-[12px] font-bold text-[#0F3D22]">
                  <span>BCV</span>
                  <span>· Tasa BCV€</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <svg
                  viewBox={`-115 -24 ${SVG_W + 205} ${SVG_H + 54}`}
                  className="mx-auto w-full min-w-[660px] h-auto select-none"
                  role="img"
                  aria-label="Planimetría oficial del Salón de Exposiciones del Casino Militar de La Grita con 41 stands del 01 al 41, marcas asignadas, 7 mesas y área de Conferencias"
                >
                  {/* Outer Architectural Frame */}
                  <rect
                    x={-10}
                    y={-10}
                    width={SVG_W + 20}
                    height={SVG_H + 20}
                    fill="#E5E9EC"
                    stroke="#1F2421"
                    strokeWidth={2}
                  />

                  {/* Main Hall Floor (38.0m x 21.5m) */}
                  <rect
                    x={0}
                    y={0}
                    width={SVG_W}
                    height={SVG_H}
                    fill="#EAE7E2"
                    stroke="#2B2E1E"
                    strokeWidth={4}
                  />

                  {/* Dimension Callout Top */}
                  <text
                    x={11.5 * SCALE}
                    y={-13}
                    textAnchor="middle"
                    fill="#0F3D22"
                    fontSize="11"
                    fontWeight="700"
                  >
                    ◄──── SALÓN DE EXPOSICIONES: 41 STANDS (01 AL 41) · ISLAS Y BLOQUE PRINCIPAL ────►
                  </text>
                  <text
                    x={31.5 * SCALE}
                    y={-13}
                    textAnchor="middle"
                    fill="#0F3D22"
                    fontSize="11"
                    fontWeight="700"
                  >
                    ◄── MESAS Y CONFERENCIAS: 13,00 m ──►
                  </text>

                  {/* Left Entrance / Exit Opening (between Stand 14 and Stand 01, z = 15.0m to 18.2m) */}
                  <rect
                    x={-8}
                    y={15.0 * SCALE}
                    width={16}
                    height={3.2 * SCALE}
                    fill="#EAE7E2"
                  />
                  {/* Double Entry/Exit Arrows matching the official planimetry */}
                  <g transform={`translate(-98, ${15.4 * SCALE})`}>
                    <polygon points="0,10 24,0 24,6 68,6 68,14 24,14 24,20" fill="#1F2421" />
                    <polygon points="68,34 44,24 44,30 0,30 0,38 44,38 44,44" fill="#1F2421" />
                    <text x="76" y="15" fill="#1F2421" fontSize="15" fontWeight="800">
                      SALIDA
                    </text>
                    <text x="76" y="38" fill="#1F2421" fontSize="15" fontWeight="800">
                      ENTRADA
                    </text>
                  </g>

                  {/* Right Side: CONFERENCIAS Stage (x = 31.5m to 38.0m, z = 0 to 18.5m) */}
                  <g>
                    <rect
                      x={31.5 * SCALE}
                      y={0.2 * SCALE}
                      width={6.3 * SCALE}
                      height={18.3 * SCALE}
                      fill="#F3DBD3"
                      stroke="#1F2421"
                      strokeWidth={1.5}
                    />
                    <line
                      x1={31.8 * SCALE}
                      y1={0.2 * SCALE}
                      x2={31.8 * SCALE}
                      y2={18.5 * SCALE}
                      stroke="#1F2421"
                      strokeWidth={1}
                    />
                    <rect
                      x={37.2 * SCALE}
                      y={6.2 * SCALE}
                      width={4}
                      height={6.8 * SCALE}
                      fill="#FFFFFF"
                      stroke="#1F2421"
                      strokeWidth={1.2}
                    />
                    <text
                      x={34.6 * SCALE}
                      y={9.8 * SCALE}
                      textAnchor="middle"
                      fill="#1F2421"
                      fontSize="14.5"
                      fontWeight="800"
                    >
                      CONFERENCIAS
                    </text>
                    <text
                      x={34.6 * SCALE}
                      y={11.0 * SCALE}
                      textAnchor="middle"
                      fill="#1F2421"
                      fillOpacity={0.7}
                      fontSize="10"
                      fontWeight="700"
                    >
                      (6,5 × 18,5 m = 120 m²)
                    </text>

                    {/* Bottom-right stairs below Conferencias */}
                    <rect
                      x={34.8 * SCALE}
                      y={18.5 * SCALE}
                      width={3.0 * SCALE}
                      height={2.9 * SCALE}
                      fill="#F3DBD3"
                      stroke="#1F2421"
                      strokeWidth={1.2}
                    />
                    <line x1={35.2 * SCALE} y1={18.5 * SCALE} x2={35.2 * SCALE} y2={21.4 * SCALE} stroke="#1F2421" strokeWidth={1} />
                    <line x1={35.6 * SCALE} y1={18.5 * SCALE} x2={35.6 * SCALE} y2={21.4 * SCALE} stroke="#1F2421" strokeWidth={1} />

                    {/* Emergency Exits on the Right Wall (Top-Right and Bottom-Right) */}
                    <g transform={`translate(${SVG_W + 14}, ${1.2 * SCALE})`}>
                      <polygon points="0,6 42,6 42,0 56,10 42,20 42,14 0,14" fill="#1F2421" />
                      <text
                        x="28"
                        y="75"
                        textAnchor="middle"
                        fill="#1F2421"
                        fontSize="12"
                        fontWeight="800"
                        transform="rotate(-90, 28, 75)"
                      >
                        SALIDA
                      </text>
                      <text
                        x="43"
                        y="75"
                        textAnchor="middle"
                        fill="#1F2421"
                        fontSize="12"
                        fontWeight="800"
                        transform="rotate(-90, 43, 75)"
                      >
                        EMERGENCIA
                      </text>
                    </g>

                    <g transform={`translate(${SVG_W + 14}, ${18.6 * SCALE})`}>
                      <polygon points="0,14 42,14 42,8 56,18 42,28 42,22 0,22" fill="#1F2421" />
                      <text
                        x="28"
                        y="-28"
                        textAnchor="middle"
                        fill="#1F2421"
                        fontSize="12"
                        fontWeight="800"
                        transform="rotate(-90, 28, -28)"
                      >
                        SALIDA
                      </text>
                      <text
                        x="43"
                        y="-28"
                        textAnchor="middle"
                        fill="#1F2421"
                        fontSize="12"
                        fontWeight="800"
                        transform="rotate(-90, 43, -28)"
                      >
                        EMERGENCIA
                      </text>
                    </g>
                  </g>

                  {/* 7 Round Tables with 6 Chairs each in the Networking Lounge */}
                  {roundTablesCoords.map((tb) => {
                    const cx = tb.x * SCALE;
                    const cy = tb.z * SCALE;
                    const rTable = 0.82 * SCALE;
                    return (
                      <g key={`table-${tb.id}`}>
                        {[0, 60, 120, 180, 240, 300].map((deg) => {
                          const rad = (deg * Math.PI) / 180;
                          const chX = cx + Math.cos(rad) * (rTable + 5);
                          const chY = cy + Math.sin(rad) * (rTable + 5);
                          return (
                            <circle
                              key={deg}
                              cx={chX}
                              cy={chY}
                              r={4.5}
                              fill="#545B57"
                              stroke="#FFFFFF"
                              strokeWidth={1}
                            />
                          );
                        })}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={rTable}
                          fill="#FFFFFF"
                          stroke="#9AA59F"
                          strokeWidth={1.5}
                        />
                        <circle cx={cx} cy={cy} r={4} fill="#3B6E28" />
                      </g>
                    );
                  })}

                  {/* Render all 41 Interior Stands (01 to 41) */}
                  {salonStands.map((stand) => {
                    const sx = stand.x * SCALE;
                    const sy = stand.z * SCALE;
                    const sw = stand.width * SCALE;
                    const sh = stand.depth * SCALE;
                    const isSelected = selectedStand?.code === stand.code;
                    const isVisible = filteredSet.has(stand.code);
                    const typeMeta = STAND_TYPE_META[stand.type];
                    const statusMeta = STAND_STATUS_META[stand.effective_status];

                    const isSold = stand.effective_status === 'vendido';
                    const isReserved = stand.effective_status === 'reservado';
                    const isBlocked = stand.effective_status === 'bloqueado';

                    // Match the exact official planimetry colors (Rosado #F5CBCB and Turquesa #4DA1A9)
                    // while highlighting dynamically confirmed stands that don't have a multi-stand graphic overlay
                    const hasCustomGraphicOverlay = [
                      '01', '02', '03', '04', '05', '06', '07', '08',
                      '09', '11', '12', '13', '14', '15', '16', '17', '18', '20',
                    ].includes(stand.code);

                    const cellFill = hasCustomGraphicOverlay
                      ? stand.type === 'rosado'
                        ? '#F5C6C7'
                        : '#4DA1A9'
                      : isSold
                      ? '#1F4E9C'
                      : isReserved
                      ? '#D9822B'
                      : isBlocked
                      ? '#8A918D'
                      : typeMeta.color;

                    return (
                      <g
                        key={stand.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Stand ${stand.code}, ${typeMeta.dimensionsLabel}, precio $${stand.price_usd}, estado ${statusMeta.label}${stand.exhibitor ? `, asignado a ${stand.exhibitor.name}` : ''}`}
                        onClick={() => onSelectStand(stand.code)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectStand(stand.code);
                          }
                        }}
                        className="cursor-pointer transition-opacity"
                        opacity={isVisible ? 1 : 0.25}
                      >
                        <rect
                          x={sx}
                          y={sy}
                          width={sw}
                          height={sh}
                          fill={cellFill}
                          fillOpacity={isSelected ? 1 : 0.96}
                          stroke={isSelected ? '#0F3D22' : '#2C3531'}
                          strokeWidth={isSelected ? 3.2 : 1.0}
                        />

                        {/* If the stand is NOT one of the custom graphic overlay cells, render standard centered number & status */}
                        {!hasCustomGraphicOverlay && (
                          <>
                            <text
                              x={sx + sw / 2}
                              y={sy + sh / 2 - 4}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSold || isReserved || isBlocked ? '#FFFFFF' : '#1F2421'}
                              fontSize="13.5"
                              fontWeight="800"
                            >
                              {stand.code}
                            </text>
                            <text
                              x={sx + sw / 2}
                              y={sy + sh / 2 + 11}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSold ? '#F4C20D' : isReserved ? '#FFF8EB' : '#0F3D22'}
                              fontSize="9"
                              fontWeight="800"
                            >
                              {isSold
                                ? '■ VEND'
                                : isReserved
                                ? '◷ 48H'
                                : `✓ $${stand.price_usd ?? typeMeta.priceUsd}`}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* =====================================================================
                      EXACT BRAND LOGO OVERLAYS MATCHING THE OFFICIAL PLANIMETRY IMAGE
                      (Pointer-events: none so clicking any stand cell underneath selects it!)
                     ===================================================================== */}
                  <g style={{ pointerEvents: 'none' }}>
                    {/* 1. Stands 01 & 02: BISA · Biotecnología y Sostenibilidad Avanzada */}
                    <text x={0.45 * SCALE} y={19.3 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">01</text>
                    <text x={4.15 * SCALE} y={19.3 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">02</text>
                    <rect
                      x={0.85 * SCALE}
                      y={18.85 * SCALE}
                      width={3.3 * SCALE}
                      height={2.45 * SCALE}
                      rx={4}
                      fill="#FFFFFF"
                      stroke="#1E7A34"
                      strokeWidth={1.2}
                    />
                    <image
                      href="/assets/aistudio/WhatsApp_Image_2026-11-08_at_5.49.41_PM_b52197a9.jpeg"
                      x={0.95 * SCALE}
                      y={18.92 * SCALE}
                      width={3.1 * SCALE}
                      height={2.3 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 2. Stands 03 & 04: Agrollano · El aliado del productor */}
                    <text x={5.45 * SCALE} y={19.25 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">03</text>
                    <text x={8.95 * SCALE} y={19.25 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">04</text>
                    <rect
                      x={5.35 * SCALE}
                      y={19.45 * SCALE}
                      width={4.3 * SCALE}
                      height={1.45 * SCALE}
                      rx={4}
                      fill="#FFFFFF"
                      stroke="#1E7A34"
                      strokeWidth={1}
                    />
                    <image
                      href="/assets/sponsors/logo-agrollano.png"
                      x={5.45 * SCALE}
                      y={19.5 * SCALE}
                      width={4.1 * SCALE}
                      height={1.35 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 3. Stands 05 & 06: WOW (Wao) */}
                    <text x={10.45 * SCALE} y={19.25 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">05</text>
                    <text x={13.95 * SCALE} y={19.25 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">06</text>
                    <image
                      href="/assets/sponsors/logo-wow.svg"
                      x={10.65 * SCALE}
                      y={19.35 * SCALE}
                      width={3.7 * SCALE}
                      height={1.85 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 4. Stands 07 & 08: Helados La Cascada */}
                    <text x={15.45 * SCALE} y={19.25 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">07</text>
                    <text x={18.95 * SCALE} y={19.25 * SCALE} fill="#1F2421" fontSize="13" fontWeight="900">08</text>
                    <image
                      href="/assets/sponsors/logo-helados-la-cascada.png"
                      x={15.35 * SCALE}
                      y={19.15 * SCALE}
                      width={4.3 * SCALE}
                      height={2.15 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 5. Bottom-Left Island: Stands 13, 14, 15, 16 -> BANCO SOFITASA */}
                    <text x={3.35 * SCALE} y={11.05 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">15</text>
                    <text x={5.85 * SCALE} y={11.05 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">16</text>
                    <text x={3.35 * SCALE} y={14.35 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">14</text>
                    <text x={5.85 * SCALE} y={14.35 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">13</text>
                    <rect
                      x={4.05 * SCALE}
                      y={11.2 * SCALE}
                      width={2.9 * SCALE}
                      height={2.6 * SCALE}
                      rx={4}
                      fill="#FFFFFF"
                      stroke="#1F4E9C"
                      strokeWidth={1.3}
                    />
                    <image
                      href="/assets/aistudio/foto_perfil_bancosofitasa_96c1e6f0.jpg"
                      x={4.4 * SCALE}
                      y={11.3 * SCALE}
                      width={2.2 * SCALE}
                      height={1.85 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />
                    <text
                      x={5.5 * SCALE}
                      y={13.55 * SCALE}
                      textAnchor="middle"
                      fill="#1F4E9C"
                      fontSize="7.5"
                      fontWeight="900"
                    >
                      BANCO SOFITASA
                    </text>

                    {/* 6. Stand 17: Agro Insumos del Táchira */}
                    <text x={8.35 * SCALE} y={11.05 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">17</text>
                    <rect
                      x={8.2 * SCALE}
                      y={11.15 * SCALE}
                      width={2.1 * SCALE}
                      height={1.2 * SCALE}
                      rx={3}
                      fill="#FFFFFF"
                    />
                    <image
                      href="/assets/sponsors/logo-agroinsumos-tachira.svg"
                      x={8.22 * SCALE}
                      y={11.17 * SCALE}
                      width={2.06 * SCALE}
                      height={1.16 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 7. Stand 12: ALDEFRIO */}
                    <text x={8.35 * SCALE} y={14.35 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">12</text>
                    <image
                      href="/assets/sponsors/logo-aldefrio.svg"
                      x={8.2 * SCALE}
                      y={12.62 * SCALE}
                      width={2.1 * SCALE}
                      height={1.35 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 8. Stand 18: AGRINOVA */}
                    <text x={14.85 * SCALE} y={11.05 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">18</text>
                    <rect
                      x={14.7 * SCALE}
                      y={11.18 * SCALE}
                      width={2.1 * SCALE}
                      height={1.15 * SCALE}
                      rx={3}
                      fill="#FFFFFF"
                    />
                    <image
                      href="/assets/sponsors/logo-agrinova.png"
                      x={14.75 * SCALE}
                      y={11.22 * SCALE}
                      width={2.0 * SCALE}
                      height={1.07 * SCALE}
                      preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 9. Stand 11: AgroMarket (El suyo / tu stand) */}
                    <text x={14.85 * SCALE} y={13.1 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">11</text>
                    <rect
                      x={15.1 * SCALE}
                      y={12.7 * SCALE}
                      width={1.65 * SCALE}
                      height={1.6 * SCALE}
                      rx={4}
                      fill="#FFFFFF"
                      stroke="#1E7A34"
                      strokeWidth={1.2}
                    />
                    <rect
                      x={15.25 * SCALE}
                      y={12.82 * SCALE}
                      width={1.35 * SCALE}
                      height={1.15 * SCALE}
                      rx={3}
                      fill="#1E7A34"
                    />
                    <text
                      x={15.92 * SCALE}
                      y={13.55 * SCALE}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="900"
                    >
                      🌿
                    </text>
                    <text
                      x={15.92 * SCALE}
                      y={14.2 * SCALE}
                      textAnchor="middle"
                      fill="#0F3D22"
                      fontSize="6.2"
                      fontWeight="900"
                    >
                      AGROMARKET
                    </text>

                    {/* 10. Stand 20: TECNO AGUA */}
                    <text x={19.85 * SCALE} y={11.05 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">20</text>
                    <text
                      x={20.75 * SCALE}
                      y={11.65 * SCALE}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="900"
                    >
                      TECNO
                    </text>
                    <text
                      x={20.75 * SCALE}
                      y={12.18 * SCALE}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="900"
                    >
                      AGUA
                    </text>

                    {/* 11. Stand 09: NARBHED / INARVET (Por confirmar) */}
                    <text x={19.85 * SCALE} y={13.1 * SCALE} fill="#1F2421" fontSize="11.5" fontWeight="900">09</text>
                    <text
                      x={20.75 * SCALE}
                      y={13.85 * SCALE}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.8"
                      fontWeight="800"
                    >
                      NARBHED
                    </text>
                    <text
                      x={20.75 * SCALE}
                      y={14.3 * SCALE}
                      textAnchor="middle"
                      fill="#FFF8EB"
                      fontSize="6.8"
                      fontWeight="800"
                    >
                      (INARVET)
                    </text>
                  </g>

                  {/* Structural Wall Pillars along line z=18.5m (matching the grey square pillars in the planimetry) */}
                  {bottomPillarsX.map((px, idx) => (
                    <rect
                      key={`pillar-${idx}`}
                      x={px * SCALE - 5}
                      y={18.5 * SCALE - 2}
                      width={10}
                      height={10}
                      fill="#5A5D58"
                      stroke="#1F2421"
                      strokeWidth={0.8}
                    />
                  ))}

                  {/* Bottom Dimension Callout */}
                  <text
                    x={19.0 * SCALE}
                    y={SVG_H + 22}
                    textAnchor="middle"
                    fill="#1F2421"
                    fontSize="11.5"
                    fontWeight="700"
                  >
                    ◄──── BLOQUE PRINCIPAL (STANDS 01 AL 08): BISA (01–02) · AGROLLANO (03–04) · WOW (05–06) · LA CASCADA (07–08) ────►
                  </text>
                </svg>
              </div>

              {/* Structured Summary of Current Stand Assignments (Bloque Principal & Lado de La Cascada) */}
              <div className="mt-4 rounded-[10px] border border-[#0F3D22]/20 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2421]/10 pb-2.5">
                  <h4 className="font-display-wide text-scale-16 text-[#0F3D22]">
                    Asignación Actual de Stands en Planimetría (Haz clic para inspeccionar)
                  </h4>
                  <span className="rounded-[4px] bg-[#1E7A34]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                    17 módulos confirmados · 1 por confirmar · 23 libres en Salón
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Column 1: Bloque Principal */}
                  <div className="rounded-[8px] border border-[#F5B7B8] bg-[#F5B7B8]/15 p-3.5">
                    <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#8C2D32]">
                      Bloque Principal · Sector Rosado (Entrada)
                    </p>
                    <ul className="mt-2.5 space-y-2 text-scale-14">
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('01')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-2 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stands 01 y 02: BISA</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            15,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('03')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-2 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stands 03 y 04: Agrollano</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            15,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('05')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-2 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stands 05 y 06: WOW (Wao)</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            15,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('07')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-2 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stands 07 y 08: Helados La Cascada</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            15,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: Lado de La Cascada & Islas Inferiores */}
                  <div className="rounded-[8px] border border-[#4DA1A9]/40 bg-[#4DA1A9]/10 p-3.5">
                    <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#0F3D22]">
                      Lado de La Cascada e Islas Centrales Inferiores
                    </p>
                    <ul className="mt-2.5 space-y-1.5 text-scale-14">
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('13')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-1.5 text-left shadow-xs hover:border-[#1F4E9C] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stands 13, 14, 15 y 16: Banco Sofitasa</span>
                          <span className="rounded-[4px] bg-[#1F4E9C]/15 px-2 py-0.5 text-[11px] font-bold text-[#1F4E9C]">
                            20,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('17')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-1.5 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stand 17: Agro Insumos del Táchira</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            5,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('12')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-1.5 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stand 12: Aldefrio (Al de Frío)</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            5,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('18')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-1.5 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stand 18: Agrinova</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            5,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('11')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-1.5 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#0F3D22]">• Stand 11: AgroMarket (Tu stand / Presentador)</span>
                          <span className="rounded-[4px] bg-[#F4C20D]/30 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            5,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('20')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-white px-3 py-1.5 text-left shadow-xs hover:border-[#0F3D22] border border-transparent transition-colors"
                        >
                          <span className="font-bold text-[#1F2421]">• Stand 20: Tecnoagua (Tecno Agua)</span>
                          <span className="rounded-[4px] bg-[#1E7A34]/15 px-2 py-0.5 text-[11px] font-bold text-[#0F3D22]">
                            5,0 m² · Confirmado
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => onSelectStand('09')}
                          className="flex w-full items-center justify-between rounded-[6px] bg-[#FDF6E7] px-3 py-1.5 text-left shadow-xs border border-[#E8A317]/40 hover:border-[#E8A317] transition-colors"
                        >
                          <span className="font-bold text-[#9A5512]">• Stand 09: Inarvet / Narbhed</span>
                          <span className="rounded-[4px] bg-[#E8A317]/25 px-2 py-0.5 text-[11px] font-bold text-[#9A5512]">
                            Por confirmar
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlanTab === 'expoauto' && (
            <div className="rounded-[12px] border border-[#1F2421]/15 bg-[#EEF2EF] p-3 sm:p-4">
              {/* Top Pricing Legend matching Page 5 of PARTICIPACIÓN EXPOAUTO.pdf */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#1F2421]/15 bg-white px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-3 text-[12px] font-bold text-[#1F2421]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-4 w-5 rounded-[2px] border border-[#1F2421]/40 bg-[#CBE8CC]" />
                    100 m² = 1.600 $ (Zonas 2, 3, 4, 5)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-4 w-5 rounded-[2px] border border-[#1F2421]/40 bg-[#F8CECC]" />
                    110 m² = 1.750 $ (Zona 6)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-4 w-5 rounded-[2px] border border-[#1F2421]/40 bg-[#F7A464]" />
                    140 m² = 1.950 $ (Zona 7)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-4 w-5 rounded-[2px] border border-[#1F2421]/40 bg-[#84CEF2]" />
                    170 m² = 2.100 $ (Zonas 1 y 8)
                  </span>
                </div>
                <span className="rounded-[4px] bg-[#1F4E9C] px-2.5 py-1 text-[11px] font-bold text-white">
                  Tasa BCV · 990 m² netos
                </span>
              </div>

              {/* Exact SVG of Planimetría e Inversión por Espacio - Expoauto La Grita 2026 */}
              <div className="overflow-x-auto">
                <svg
                  viewBox="0 0 820 460"
                  className="mx-auto w-full min-w-[600px] h-auto select-none rounded-[8px] bg-white border border-[#1F2421]/10"
                  role="img"
                  aria-label="Planimetría oficial de las 8 zonas de Expoauto La Grita 2026 frente a la Calle Vía Llano Los Zambranos y el Salón de Conferencias"
                >
                  {/* Salón de Conferencias y Área de Rueda de Negocios (Yellow building block on top-right) */}
                  <rect
                    x="415"
                    y="35"
                    width="225"
                    height="205"
                    fill="#FDE488"
                    stroke="#1F2421"
                    strokeWidth="1.5"
                  />
                  <text x="527" y="102" textAnchor="middle" fill="#1F4E9C" fontSize="15" fontWeight="800">
                    SALÓN DE
                  </text>
                  <text x="527" y="122" textAnchor="middle" fill="#1F4E9C" fontSize="15" fontWeight="800">
                    CONFERENCIAS
                  </text>
                  <text x="527" y="160" textAnchor="middle" fill="#1F4E9C" fontSize="14" fontWeight="800">
                    ÁREA DE RUEDA
                  </text>
                  <text x="527" y="178" textAnchor="middle" fill="#1F4E9C" fontSize="14" fontWeight="800">
                    DE NEGOCIOS
                  </text>
                  <text x="527" y="196" textAnchor="middle" fill="#1F2421" fontSize="11" fontWeight="700">
                    (22,0 × 18,0 m = 396 m²)
                  </text>

                  {/* Porch / Entrance to Salón de Conferencias */}
                  <rect
                    x="500"
                    y="240"
                    width="58"
                    height="42"
                    fill="#FDE488"
                    stroke="#1F2421"
                    strokeWidth="1.2"
                  />
                  <text x="529" y="218" textAnchor="middle" fill="#1F2421" fontSize="13" fontWeight="800">
                    ENTRADA
                  </text>
                  <text x="529" y="232" textAnchor="middle" fill="#1F2421" fontSize="13" fontWeight="800">
                    SALIDA
                  </text>

                  {/* Internal Driveway / Circulation Courtyard */}
                  <polygon
                    points="20,240 415,240 415,282 640,282 640,395 20,395"
                    fill="#E5E8EB"
                    stroke="#1F2421"
                    strokeWidth="1.2"
                  />

                  {/* Interactive 8 Expoauto Zones */}
                  {[
                    {
                      code: 'EA-06',
                      num: '6',
                      area: '110 m²',
                      price: '$1.750',
                      color: '#F8CECC',
                      points: '20,200 185,142 185,240 20,240',
                      tx: 102,
                      ty: 205,
                    },
                    {
                      code: 'EA-07',
                      num: '7',
                      area: '140 m²',
                      price: '$1.950',
                      color: '#F7A464',
                      points: '185,142 302,98 302,240 185,240',
                      tx: 243,
                      ty: 192,
                    },
                    {
                      code: 'EA-08',
                      num: '8',
                      area: '170 m²',
                      price: '$2.100',
                      color: '#84CEF2',
                      points: '302,98 415,98 415,240 302,240',
                      tx: 358,
                      ty: 185,
                    },
                    {
                      code: 'EA-05',
                      num: '5',
                      area: '100 m²',
                      price: '$1.600',
                      color: '#CBE8CC',
                      points: '20,298 118,298 118,395 20,395',
                      tx: 69,
                      ty: 352,
                    },
                    {
                      code: 'EA-04',
                      num: '4',
                      area: '100 m²',
                      price: '$1.600',
                      color: '#CBE8CC',
                      points: '118,298 216,298 216,395 118,395',
                      tx: 167,
                      ty: 352,
                    },
                    {
                      code: 'EA-03',
                      num: '3',
                      area: '100 m²',
                      price: '$1.600',
                      color: '#CBE8CC',
                      points: '216,298 314,298 314,395 216,395',
                      tx: 265,
                      ty: 352,
                    },
                    {
                      code: 'EA-02',
                      num: '2',
                      area: '100 m²',
                      price: '$1.600',
                      color: '#CBE8CC',
                      points: '314,308 442,308 442,395 314,395',
                      tx: 378,
                      ty: 355,
                    },
                    {
                      code: 'EA-01',
                      num: '1',
                      area: '170 m²',
                      price: '$2.100',
                      color: '#84CEF2',
                      points: '640,240 795,240 795,395 640,395',
                      tx: 717,
                      ty: 322,
                    },
                  ].map((z) => {
                    const isSelected = selectedStand?.code === z.code;
                    return (
                      <g
                        key={z.code}
                        role="button"
                        tabIndex={0}
                        aria-label={`Zona Expoauto ${z.num} (${z.code}), superficie ${z.area}, inversión ${z.price}`}
                        onClick={() => onSelectStand(z.code)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectStand(z.code);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <polygon
                          points={z.points}
                          fill={z.color}
                          stroke={isSelected ? '#0F3D22' : '#1F2421'}
                          strokeWidth={isSelected ? 3.5 : 1.3}
                        />
                        <text
                          x={z.tx}
                          y={z.ty - 6}
                          textAnchor="middle"
                          fill="#1F2421"
                          fontSize="24"
                          fontWeight="900"
                        >
                          {z.num}
                        </text>
                        <text
                          x={z.tx}
                          y={z.ty + 14}
                          textAnchor="middle"
                          fill="#0F3D22"
                          fontSize="11.5"
                          fontWeight="800"
                        >
                          {z.area} · {z.price}
                        </text>
                      </g>
                    );
                  })}

                  {/* Main Street Entrance Gate (ENTRADA / SALIDA) */}
                  <text x="528" y="325" textAnchor="middle" fill="#1F2421" fontSize="15" fontWeight="800">
                    ENTRADA
                  </text>
                  <text x="528" y="342" textAnchor="middle" fill="#1F2421" fontSize="15" fontWeight="800">
                    SALIDA
                  </text>
                  <rect x="442" y="384" width="150" height="10" fill="#1F2421" />

                  {/* Bottom Street Strip: CALLE VIA LLANO LOS ZAMBRANOS */}
                  <rect x="0" y="395" width="820" height="44" fill="#C2C8CC" />
                  <text x="275" y="423" textAnchor="middle" fill="#1F2421" fontSize="15" fontWeight="800">
                    CALLE VÍA LLANO LOS ZAMBRANOS
                  </text>
                </svg>
              </div>
            </div>
          )}

          {activePlanTab === 'laminas' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[12px] border border-[#1F2421]/20 bg-white">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-11-13_at_3.39.49_PM_f3867c62.jpeg"
                  alt="Planimetría oficial actualizada del Salón de Exposiciones con los 41 stands numerados del 01 al 41"
                  className="w-full h-auto block"
                />
                <div className="border-t border-[#1F2421]/10 p-3.5">
                  <p className="font-display-wide text-scale-16 text-[#1F2421]">
                    Lámina Oficial: Planimetría del Salón de Exposiciones (41 Stands)
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#1F2421]/75">
                    Distribución oficial de los 8 stands rosados (01–08), las 4 islas centrales (09–32), la fila norte (33–41), las 7 mesas y CONFERENCIAS.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[12px] border border-[#1F2421]/20 bg-white">
                <img
                  src="/assets/extracted/expoauto_page_5.jpg"
                  alt="Lámina oficial de Planimetría e Inversión por Espacio de Expoauto La Grita 2026"
                  className="w-full h-auto block"
                />
                <div className="border-t border-[#1F2421]/10 p-3.5">
                  <p className="font-display-wide text-scale-16 text-[#1F2421]">
                    Lámina Oficial: Planimetría Expoauto (8 Zonas)
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#1F2421]/75">
                    Áreas de 100 m² ($1.600), 110 m² ($1.750), 140 m² ($1.950) y 170 m² ($2.100) a Tasa BCV.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[12px] border border-[#1F2421]/20 bg-white sm:col-span-2">
                <img
                  src="/assets/extracted/pabellon_page_4.jpg"
                  alt="Plano General del Casino Militar de La Grita en el documento oficial de Cenexpo"
                  className="w-full h-auto block"
                />
                <div className="border-t border-[#1F2421]/10 p-3.5">
                  <p className="font-display-wide text-scale-16 text-[#1F2421]">
                    Lámina Oficial: Plano General del Recinto (Casino Militar de La Grita)
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#1F2421]/75">
                    Vista general exterior e integración de Entrada Casino Militar, Área Festival Automotriz, Salón de Conferencias y Salón de Exposición.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activePlanTab === 'list' && (
            <div className="max-h-[620px] overflow-y-auto rounded-[12px] border border-[#1F2421]/15 bg-[#EEF2EF]/50">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0F3D22] text-[#EEF2EF] text-scale-14">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Código</th>
                    <th className="py-3 px-4 font-semibold">Medidas y Área</th>
                    <th className="py-3 px-4 font-semibold">Inversión (BCV)</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    <th className="py-3 px-4 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2421]/10 bg-white text-scale-14">
                  {filteredStands.map((stand) => {
                    const typeMeta = STAND_TYPE_META[stand.type];
                    const statusMeta = STAND_STATUS_META[stand.effective_status];
                    const isSelected = selectedStand?.code === stand.code;
                    return (
                      <tr
                        key={stand.id}
                        onClick={() => onSelectStand(stand.code)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#1E7A34]/10' : 'hover:bg-[#EEF2EF]/60'
                        }`}
                      >
                        <td className="py-3 px-4 font-display-wide tabular-nums text-[#1F2421]">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-[2px] border border-[#1F2421]/30 shrink-0"
                              style={{ backgroundColor: typeMeta.color }}
                              aria-hidden="true"
                            />
                            {stand.code.startsWith('EA-') ? `Zona ${stand.code}` : `Stand ${stand.code}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums font-medium text-[#1F2421]">
                          {typeMeta.dimensionsLabel}
                        </td>
                        <td className="py-3 px-4 font-display-wide tabular-nums text-[#0F3D22]">
                          ${stand.price_usd ?? typeMeta.priceUsd}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 font-semibold"
                            style={{ color: statusMeta.color }}
                          >
                            <StatusIcon status={stand.effective_status} />
                            <span>{statusMeta.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStand(stand.code);
                            }}
                            className="text-[#1F4E9C] font-semibold underline hover:text-[#0F3D22]"
                          >
                            Ver ficha
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Selected Stand Inspector + Real Interior Photo + Official Summary */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Selected Stand Inspector */}
          <div
            aria-live="polite"
            className="rounded-[12px] border border-[#1F2421]/20 bg-[#EEF2EF] p-5"
          >
            {selectedStand ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-scale-14 font-medium text-[#1F2421]/70">
                      Ficha oficial del espacio
                    </span>
                    <h3 className="font-display-wide text-scale-31 text-[#1F2421] tabular-nums">
                      {selectedStand.code.startsWith('EA-')
                        ? `Zona ${selectedStand.code}`
                        : `Stand ${selectedStand.code}`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectStand(null)}
                    aria-label="Cerrar ficha del stand"
                    className="rounded-[4px] p-2 text-[#1F2421]/70 hover:bg-[#1F2421]/10 hover:text-[#1F2421]"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Status with icon + label */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-scale-14 font-semibold"
                    style={{
                      backgroundColor: STAND_STATUS_META[selectedStand.effective_status].bgTint,
                      borderColor: STAND_STATUS_META[selectedStand.effective_status].borderTint,
                      color: STAND_STATUS_META[selectedStand.effective_status].color,
                    }}
                  >
                    <StatusIcon status={selectedStand.effective_status} />
                    <span>{STAND_STATUS_META[selectedStand.effective_status].label}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-scale-14 font-semibold text-[#1F2421]">
                    <span
                      className="h-4 w-4 rounded-[2px] border border-[#1F2421]/40"
                      style={{ backgroundColor: STAND_TYPE_META[selectedStand.type].color }}
                      aria-hidden="true"
                    />
                    <span>{STAND_TYPE_META[selectedStand.type].shortLabel}</span>
                  </div>
                </div>

                <dl className="mt-4 space-y-2 border-t border-[#1F2421]/10 pt-3 text-scale-14">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#1F2421]/70">Medidas exactas:</dt>
                    <dd className="font-bold tabular-nums text-[#1F2421]">
                      {STAND_TYPE_META[selectedStand.type].dimensionsLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#1F2421]/70">Inversión oficial (BCV):</dt>
                    <dd className="font-display-wide text-scale-20 tabular-nums text-[#0F3D22]">
                      ${selectedStand.price_usd ?? STAND_TYPE_META[selectedStand.type].priceUsd} USD
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#1F2421]/70">Sector:</dt>
                    <dd className="font-medium text-right text-[#1F2421]">
                      {selectedStand.location_label}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#1F2421]/70">Expositor asignado:</dt>
                    <dd className="font-medium text-[#1F2421]">
                      {selectedStand.exhibitor ? selectedStand.exhibitor.name : 'Espacio libre'}
                    </dd>
                  </div>
                </dl>

                {selectedStand.effective_status === 'disponible' && (
                  <div className="mt-5 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => onRequestStandModal(selectedStand.code)}
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[4px] bg-[#1E7A34] px-4 py-2.5 text-scale-14 font-semibold text-white hover:bg-[#0F3D22] transition-colors"
                    >
                      Quiero reservar {selectedStand.code.startsWith('EA-') ? selectedStand.code : `el stand ${selectedStand.code}`}
                    </button>
                    <a
                      href={buildWhatsAppBookingLink(
                        whatsappPrimary,
                        `Hola equipo de Cenexpo, estoy viendo la planimetría oficial del Casino Militar y quiero reservar el espacio ${selectedStand.code} (${STAND_TYPE_META[selectedStand.type].dimensionsLabel}, inversión $${selectedStand.price_usd ?? STAND_TYPE_META[selectedStand.type].priceUsd} a Tasa BCV).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[4px] border border-[#1F4E9C] bg-white px-4 py-2 text-scale-14 font-semibold text-[#1F4E9C] hover:bg-[#1F4E9C] hover:text-white transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                      Reservar {selectedStand.code} por WhatsApp
                    </a>
                  </div>
                )}

                {selectedStand.effective_status === 'reservado' && (
                  <div className="mt-5 rounded-[8px] border border-[#D9822B] bg-[#FDF3E8] p-3.5 text-scale-14 text-[#9A5512]">
                    <p className="flex items-center gap-1.5 font-bold">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Bloqueo temporal activo por 48 horas
                    </p>
                    <p className="mt-1 text-[13px] text-[#1F2421]/85">
                      Este espacio tiene una solicitud en proceso de confirmación ante Cenexpo C.A.
                      {selectedStand.hold_until && (
                        <>
                          {' '}
                          Vence el{' '}
                          <strong className="tabular-nums">
                            {new Date(selectedStand.hold_until).toLocaleString('es-VE', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </strong>
                          .
                        </>
                      )}
                    </p>
                  </div>
                )}

                {selectedStand.effective_status === 'vendido' && (
                  <div className="mt-5 rounded-[8px] border border-[#1F4E9C] bg-[#EDF3FB] p-3.5 text-scale-14 text-[#1F4E9C]">
                    <p className="flex items-center gap-1.5 font-bold">
                      <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Espacio vendido y confirmado
                    </p>
                    {selectedStand.exhibitor?.logo_url && (
                      <div className="mt-2.5 flex items-center justify-center rounded-[6px] border border-[#1F4E9C]/20 bg-white p-2.5">
                        <img
                          src={selectedStand.exhibitor.logo_url}
                          alt={`Logo oficial de ${selectedStand.exhibitor.name}`}
                          className="max-h-20 w-auto object-contain"
                        />
                      </div>
                    )}
                    <p className="mt-2 text-[13px] text-[#1F2421]/90">
                      Asignado oficialmente a{' '}
                      <strong>
                        {selectedStand.exhibitor
                          ? selectedStand.exhibitor.name
                          : 'expositor confirmado por Cenexpo C.A.'}
                      </strong>
                      .
                    </p>
                    {selectedStand.exhibitor?.description && (
                      <p className="mt-1 text-[12px] text-[#1F2421]/80">
                        {selectedStand.exhibitor.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-display-wide text-scale-20 text-[#1F2421]">
                  Selecciona un stand o zona
                </h3>
                <p className="mt-2 text-scale-14 text-[#1F2421]/80">
                  Haz clic en cualquiera de los 41 stands del Salón de Exposiciones (01 al 41) o en las 8 zonas de Expoauto (EA-01 a EA-08) para ver sus medidas exactas en m², la marca asignada y su costo a Tasa BCV.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectStand('01')}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-[4px] border border-[#1F4E9C] bg-white px-3.5 py-1.5 text-scale-14 font-semibold text-[#1F4E9C] hover:bg-[#1F4E9C] hover:text-white transition-colors"
                  >
                    Ver Stand 01 · BISA (7,50 m² · $480)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectStand('13')}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-[4px] border border-[#1F4E9C] bg-white px-3.5 py-1.5 text-scale-14 font-semibold text-[#1F4E9C] hover:bg-[#1F4E9C] hover:text-white transition-colors"
                  >
                    Ver Stand 13 · Sofitasa (5,00 m² · $400)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectStand('24')}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-[4px] border border-[#1E7A34] bg-white px-3.5 py-1.5 text-scale-14 font-semibold text-[#1E7A34] hover:bg-[#1E7A34] hover:text-white transition-colors"
                  >
                    Ver Stand 24 Libre (5,00 m² · $400)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real Interior Photo of the Exhibition Hall from the PDF */}
          <div className="overflow-hidden rounded-[12px] border border-[#1F2421]/15 bg-white">
            <img
              src="/assets/extracted/casino-interior-real.jpg"
              alt="Fotografía real del Salón de Exposiciones del Casino Militar de La Grita"
              className="w-full h-44 object-cover block"
            />
            <div className="p-4">
              <h4 className="font-display-wide text-scale-16 text-[#1F2421]">
                Fotografía real del Salón de Exposiciones
              </h4>
              <p className="mt-1 text-[13px] text-[#1F2421]/75">
                Nave techada del Casino Militar de La Grita donde se instalan los 41 stands comerciales (01–41), las 7 mesas redondas de negocios y el área de CONFERENCIAS al fondo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Exact Dimensions Table of the Entire Casino Militar Maquette */}
      <div className="mt-8 rounded-[12px] border-2 border-[#0F3D22]/20 bg-[#EEF2EF] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2421]/15 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-[#1E7A34]" aria-hidden="true" />
            <h3 className="font-display-wide text-scale-20 text-[#1F2421]">
              Cuadro de Medidas Exactas de Toda la Maqueta (El Casino Militar)
            </h3>
          </div>
          <span className="text-scale-14 font-semibold text-[#0F3D22]">
            Fuente: Planimetría Oficial Cenexpo C.A. (Tasa BCV)
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[8px] border border-[#1F2421]/15 bg-white">
          <table className="w-full text-left border-collapse text-scale-14">
            <thead className="bg-[#0F3D22] text-[#EEF2EF]">
              <tr>
                <th className="py-3 px-4 font-semibold">Espacio / Sector de la Maqueta</th>
                <th className="py-3 px-4 font-semibold">Numeración Oficial</th>
                <th className="py-3 px-4 font-semibold">Dimensiones Exactas (Frente × Fondo)</th>
                <th className="py-3 px-4 font-semibold">Superficie Unitaria / Total</th>
                <th className="py-3 px-4 font-semibold text-right">Inversión (Tasa BCV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2421]/10">
              <tr className="bg-[#F5B7B8]/20">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Stands Tipo Rosado · Bloque Principal (Pared Entrada)
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  8 stands: 01 al 08
                </td>
                <td className="py-3 px-4 tabular-nums">
                  2,50 m × 3,00 m (Fila total: 20,00 m × 3,00 m)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  7,50 m² c/u (60,00 m² total)
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $480 c/u
                </td>
              </tr>
              <tr className="bg-[#1995A2]/10">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Stands Tipo Turquesa · 2 Islas Centrales Inferiores (Lado de La Cascada)
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  12 stands: 09–11, 18–20 y 12–17
                </td>
                <td className="py-3 px-4 tabular-nums">
                  2,50 m × 2,00 m (2 Islas 3×2 de 7,50 m × 4,00 m c/u)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  5,00 m² c/u (60,00 m² total)
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $400 c/u
                </td>
              </tr>
              <tr className="bg-[#1995A2]/10">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Stands Tipo Turquesa · 2 Islas Centrales Superiores
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  12 stands: 21–23, 30–32 y 24–29
                </td>
                <td className="py-3 px-4 tabular-nums">
                  2,50 m × 2,00 m (2 Islas 3×2 de 7,50 m × 4,00 m c/u)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  5,00 m² c/u (60,00 m² total)
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $400 c/u
                </td>
              </tr>
              <tr className="bg-[#1995A2]/10">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Stands Tipo Turquesa · Fila Pared Superior Norte
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  9 stands: 33 al 41
                </td>
                <td className="py-3 px-4 tabular-nums">
                  2,50 m × 2,00 m (Fila total: 22,50 m × 2,00 m)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  5,00 m² c/u (45,00 m² total)
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $400 c/u
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Zona de Mesas + Área CONFERENCIAS (Salón)
                </td>
                <td className="py-3 px-4 font-mono text-[#1F2421]">
                  7 mesas (42 sillas) + Tarima
                </td>
                <td className="py-3 px-4 tabular-nums">
                  Mesas: 6,50 × 18,00 m · Tarima: 6,50 × 18,50 m
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  117 m² + 120,25 m² (Nave total: 38 × 21,5 m = 817 m²)
                </td>
                <td className="py-3 px-4 text-right font-medium text-[#1F2421]/75">
                  Área común B2B
                </td>
              </tr>
              <tr className="bg-[#FDE488]/30">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Salón de Conferencias y Rueda de Negocios
                </td>
                <td className="py-3 px-4 font-mono text-[#1F2421]">
                  Edificio Principal (3 niveles)
                </td>
                <td className="py-3 px-4 tabular-nums">
                  22,00 m × 18,00 m (+ Marquesina 6,0 × 5,0 m)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  396,00 m² de planta baja
                </td>
                <td className="py-3 px-4 text-right font-medium text-[#1F2421]/75">
                  Ponencias y Rueda
                </td>
              </tr>
              <tr className="bg-[#CBE8CC]/35">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Expoauto · Zonas Frontales Verde Claro
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  4 zonas: Zonas 2, 3, 4 y 5
                </td>
                <td className="py-3 px-4 tabular-nums">
                  10,00 m × 10,00 m c/u (Frente total: 40,00 m)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  100,00 m² c/u (400,00 m² total)
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $1.600 c/u
                </td>
              </tr>
              <tr className="bg-[#F8CECC]/35">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Expoauto · Zona Superior Izquierda Rosada
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  1 zona: Zona 6
                </td>
                <td className="py-3 px-4 tabular-nums">
                  10,00 m × 11,00 m promedio (tramo diagonal)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  110,00 m²
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $1.750
                </td>
              </tr>
              <tr className="bg-[#F7A464]/30">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Expoauto · Zona Superior Central Naranja
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  1 zona: Zona 7
                </td>
                <td className="py-3 px-4 tabular-nums">
                  10,00 m × 14,00 m promedio (tramo diagonal)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  140,00 m²
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $1.950
                </td>
              </tr>
              <tr className="bg-[#84CEF2]/35">
                <td className="py-3 px-4 font-semibold text-[#1F2421]">
                  Expoauto · Zonas Amplias Celestes
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#0F3D22]">
                  2 zonas: Zonas 1 y 8
                </td>
                <td className="py-3 px-4 tabular-nums">
                  10,00 m × 17,00 m c/u (Junto al edificio principal)
                </td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  170,00 m² c/u (340,00 m² total)
                </td>
                <td className="py-3 px-4 text-right font-display-wide text-[#0F3D22]">
                  $2.100 c/u
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
