import {
  asignarLocalidad,
  GEOMETRIA_ESTADIO,
  SECCIONES_POR_TRIBUNA,
  Segmento,
  segmentosDelAnillo,
} from '../data/estadio.generator';
import { LocalidadId, LOCALIDADES } from '../data/localidades.db';
import { crearAleatorio } from '../data/seeded-random';
import { ZonaId, ZONAS } from '../data/zonas.db';
import { crearLienzo, Lienzo } from './icono-silla';

/**
 * Vista previa de la cancha desde una zona del estadio.
 *
 * Se dibuja en 3D (proyección en perspectiva) sin imágenes externas: cancha,
 * líneas, arcos, graderías con el color de cada localidad, público, muro y
 * reflectores. Es costosa de generar, por eso conviene crear una sola por
 * zona y reutilizarla.
 */

export const ANCHO_VISTA = 800;
export const ALTO_VISTA = 450;

type Punto3 = readonly [number, number, number];
type Contexto2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const G = GEOMETRIA_ESTADIO;

const CAMPO_VISION_GRADOS = 72;
const PLANO_CERCANO = 2;

const FILAS_GRADERIA = 16;
const CORTES_POR_SECCION = 6;
const ALTURA_PRIMERA_FILA = 15;
const PENDIENTE_GRADERIA = 0.65;
const ALTURA_OJOS = 9;
const ALTO_MURO = 45;
const PERSONAS_POR_CELDA = 3;

/** Escala de la cancha: 600 unidades del plano equivalen a 105 metros. */
const UNIDADES_POR_METRO = 600 / 105;

const COLOR_PASILLO = '#cbd5e1';
const COLOR_MURO = '#d5dde7';
const COLORES_PUBLICO = ['#1e293b', '#f8fafc', '#dc2626', '#1d4ed8', '#facc15', '#64748b'];

const COLOR_LOCALIDAD = new Map<LocalidadId, string>(LOCALIDADES.map((l) => [l.id, l.color]));

export function renderizarVistaCancha(zonaId: ZonaId): Lienzo {
  const lienzo = crearLienzo(ANCHO_VISTA, ALTO_VISTA);
  const ctx = lienzo.getContext('2d') as Contexto2D | null;
  if (!ctx) {
    throw new Error('El navegador no permitió crear el contexto 2D de la vista previa.');
  }

  const zona = ZONAS[zonaId];
  const alturaCamara = alturaGraderia(distanciaAlEje(zona.camara.x, zona.camara.y)) + ALTURA_OJOS;
  const camara = new Camara(
    enMundo(zona.camara.x, zona.camara.y, alturaCamara),
    enMundo(G.centroX, G.centroY, 0),
  );
  // Misma semilla por zona: la vista siempre sale idéntica.
  const aleatorio = crearAleatorio(zonaId.length * 7919 + zonaId.charCodeAt(0));

  dibujarCielo(ctx);
  dibujarTerreno(ctx, camara);
  dibujarCancha(ctx, camara);
  dibujarGraderias(ctx, camara, aleatorio);
  dibujarReflectores(ctx, camara);
  dibujarVineta(ctx);

  return lienzo;
}

// ---------------------------------------------------------------------------
// Cámara y proyección
// ---------------------------------------------------------------------------

/**
 * Convierte coordenadas del plano (x a la derecha, y hacia abajo) a un sistema
 * 3D de mano derecha con z hacia arriba.
 */
function enMundo(x: number, y: number, z: number): Punto3 {
  return [x, -y, z];
}

class Camara {
  private readonly derecha: Punto3;
  private readonly arriba: Punto3;
  private readonly frente: Punto3;
  private readonly focal = ANCHO_VISTA / 2 / Math.tan((CAMPO_VISION_GRADOS * Math.PI) / 360);

  constructor(
    readonly posicion: Punto3,
    objetivo: Punto3,
  ) {
    this.frente = normalizar(restar(objetivo, posicion));
    this.derecha = normalizar(cruz(this.frente, [0, 0, 1]));
    this.arriba = cruz(this.derecha, this.frente);
  }

  /** Punto en coordenadas de la cámara: [derecha, arriba, profundidad]. */
  aCamara(p: Punto3): Punto3 {
    const d = restar(p, this.posicion);
    return [escalar(d, this.derecha), escalar(d, this.arriba), escalar(d, this.frente)];
  }

  proyectar(c: Punto3): readonly [number, number] {
    return [
      ANCHO_VISTA / 2 + (this.focal * c[0]) / c[2],
      ALTO_VISTA / 2 - (this.focal * c[1]) / c[2],
    ];
  }

  /** Tamaño en píxeles de un objeto de `tamano` unidades a la profundidad dada. */
  tamanoEnPantalla(tamano: number, profundidad: number): number {
    return (this.focal * tamano) / profundidad;
  }
}

/** Recorta un polígono (en coordenadas de cámara) contra el plano cercano. */
function recortar(poligono: readonly Punto3[]): Punto3[] {
  const resultado: Punto3[] = [];

  for (let i = 0; i < poligono.length; i++) {
    const a = poligono[i];
    const b = poligono[(i + 1) % poligono.length];
    const aVisible = a[2] >= PLANO_CERCANO;
    const bVisible = b[2] >= PLANO_CERCANO;

    if (aVisible) resultado.push(a);
    if (aVisible !== bVisible) resultado.push(interpolarEnCercano(a, b));
  }

  return resultado;
}

function interpolarEnCercano(a: Punto3, b: Punto3): Punto3 {
  const t = (PLANO_CERCANO - a[2]) / (b[2] - a[2]);
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), PLANO_CERCANO];
}

function rellenar(ctx: Contexto2D, camara: Camara, puntos: readonly Punto3[], color: string): void {
  const visibles = recortar(puntos.map((p) => camara.aCamara(p)));
  if (visibles.length < 3) return;

  ctx.beginPath();
  visibles.forEach((c, i) => {
    const [x, y] = camara.proyectar(c);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Traza una línea quebrada en 3D, recortando cada tramo contra el plano cercano. */
function trazar(ctx: Contexto2D, camara: Camara, puntos: readonly Punto3[], cerrada = false): void {
  const enCamara = puntos.map((p) => camara.aCamara(p));
  const tramos = cerrada ? enCamara.length : enCamara.length - 1;

  ctx.beginPath();
  for (let i = 0; i < tramos; i++) {
    let a = enCamara[i];
    let b = enCamara[(i + 1) % enCamara.length];
    if (a[2] < PLANO_CERCANO && b[2] < PLANO_CERCANO) continue;
    if (a[2] < PLANO_CERCANO) a = interpolarEnCercano(a, b);
    if (b[2] < PLANO_CERCANO) b = interpolarEnCercano(b, a);

    const [x1, y1] = camara.proyectar(a);
    const [x2, y2] = camara.proyectar(b);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Escena
// ---------------------------------------------------------------------------

function dibujarCielo(ctx: Contexto2D): void {
  const cielo = ctx.createLinearGradient(0, 0, 0, ALTO_VISTA);
  cielo.addColorStop(0, '#8ec5ee');
  cielo.addColorStop(0.6, '#d9ecfa');
  cielo.addColorStop(1, '#eef6fc');
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ANCHO_VISTA, ALTO_VISTA);
}

/** Terreno entre la cancha y la primera fila. */
function dibujarTerreno(ctx: Contexto2D, camara: Camara): void {
  rellenar(ctx, camara, contornoEstadio(G.radioInterno, 0), '#5f8f4e');
}

function dibujarCancha(ctx: Contexto2D, camara: Camara): void {
  const { x, y, ancho, alto } = G.cancha;
  const franjas = 12;
  const anchoFranja = ancho / franjas;

  // Franjas de césped cortado.
  for (let i = 0; i < franjas; i++) {
    const x0 = x + i * anchoFranja;
    rellenar(
      ctx,
      camara,
      [enMundo(x0, y, 0), enMundo(x0 + anchoFranja, y, 0), enMundo(x0 + anchoFranja, y + alto, 0), enMundo(x0, y + alto, 0)],
      i % 2 === 0 ? '#4c9a45' : '#58a950',
    );
  }

  const m = UNIDADES_POR_METRO;
  const borde = 10;
  const izquierda = x + borde;
  const derecha = x + ancho - borde;
  const arriba = y + borde;
  const abajo = y + alto - borde;
  const centroX = x + ancho / 2;
  const centroY = y + alto / 2;
  const suelo = (px: number, py: number) => enMundo(px, py, 0);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  trazar(ctx, camara, [suelo(izquierda, arriba), suelo(derecha, arriba), suelo(derecha, abajo), suelo(izquierda, abajo)], true);
  trazar(ctx, camara, [suelo(centroX, arriba), suelo(centroX, abajo)]);
  trazar(ctx, camara, circulo(centroX, centroY, 9.15 * m), true);

  for (const lado of [1, -1] as const) {
    const linea = lado === 1 ? izquierda : derecha;
    const area = (profundo: number, anchoArea: number) => [
      suelo(linea, centroY - anchoArea / 2),
      suelo(linea + lado * profundo, centroY - anchoArea / 2),
      suelo(linea + lado * profundo, centroY + anchoArea / 2),
      suelo(linea, centroY + anchoArea / 2),
    ];
    trazar(ctx, camara, area(16.5 * m, 40.3 * m));
    trazar(ctx, camara, area(5.5 * m, 18.32 * m));

    // Arco: dos postes y el travesaño.
    const medioArco = (7.32 * m) / 2;
    const altoArco = 2.44 * m;
    ctx.lineWidth = 3;
    trazar(ctx, camara, [
      enMundo(linea, centroY - medioArco, 0),
      enMundo(linea, centroY - medioArco, altoArco),
      enMundo(linea, centroY + medioArco, altoArco),
      enMundo(linea, centroY + medioArco, 0),
    ]);
    ctx.lineWidth = 2;
  }
}

interface Celda {
  readonly puntos: readonly Punto3[];
  readonly color: string;
  readonly conPublico: boolean;
  readonly distancia: number;
}

/**
 * Graderías divididas en celdas (filas × cortes de cada sección). Se dibujan
 * de la más lejana a la más cercana para que las cercanas tapen a las lejanas.
 */
function dibujarGraderias(ctx: Contexto2D, camara: Camara, aleatorio: () => number): void {
  const celdas: Celda[] = [];
  const radioPasillo = G.radioInterno + (G.radioExterno - G.radioInterno) * G.inicioBandejaAlta;
  const cortes = SECCIONES_POR_TRIBUNA * CORTES_POR_SECCION;
  const radio = (k: number) => G.radioInterno + ((G.radioExterno - G.radioInterno) * k) / FILAS_GRADERIA;
  const punto = (segmento: Segmento, fraccion: number, r: number, z = alturaGraderia(r)) => {
    const { x, y } = segmento.punto(fraccion * segmento.largo);
    return enMundo(x, y, z);
  };

  for (let fila = 0; fila < FILAS_GRADERIA; fila++) {
    const r0 = radio(fila);
    const r1 = radio(fila + 1);
    const esPasillo = r0 <= radioPasillo && r1 > radioPasillo;
    const bandeja = (r0 + r1) / 2 < radioPasillo ? 1 : 2;
    const interior = segmentosDelAnillo(r0);
    const exterior = segmentosDelAnillo(r1);

    interior.forEach((segmento, s) => {
      for (let c = 0; c < cortes; c++) {
        const f0 = c / cortes;
        const f1 = (c + 1) / cortes;
        const seccion = Math.floor(c / CORTES_POR_SECCION);
        const base = COLOR_LOCALIDAD.get(asignarLocalidad(segmento.tribuna, seccion, bandeja)) ?? '#94a3b8';
        const puntos = [punto(segmento, f0, r0), punto(segmento, f1, r0), punto(exterior[s], f1, r1), punto(exterior[s], f0, r1)];

        celdas.push({
          puntos,
          color: esPasillo ? COLOR_PASILLO : mezclarConBlanco(base, fila % 2 === 0 ? 0.42 : 0.3),
          conPublico: !esPasillo,
          distancia: distancia2(camara.posicion, centro(puntos)),
        });
      }
    });
  }

  // Muro perimetral sobre la última fila.
  const zTope = alturaGraderia(G.radioExterno);
  for (const segmento of segmentosDelAnillo(G.radioExterno)) {
    for (let c = 0; c < cortes; c++) {
      const f0 = c / cortes;
      const f1 = (c + 1) / cortes;
      const puntos = [
        punto(segmento, f0, G.radioExterno, zTope),
        punto(segmento, f1, G.radioExterno, zTope),
        punto(segmento, f1, G.radioExterno, zTope + ALTO_MURO),
        punto(segmento, f0, G.radioExterno, zTope + ALTO_MURO),
      ];
      celdas.push({ puntos, color: COLOR_MURO, conPublico: false, distancia: distancia2(camara.posicion, centro(puntos)) });
    }
  }

  celdas.sort((a, b) => b.distancia - a.distancia);

  for (const celda of celdas) {
    rellenar(ctx, camara, celda.puntos, celda.color);
    if (celda.conPublico) dibujarPublico(ctx, camara, celda.puntos, aleatorio);
  }
}

/** Puntos de colores sobre una celda de gradería que simulan a los asistentes. */
function dibujarPublico(ctx: Contexto2D, camara: Camara, celda: readonly Punto3[], aleatorio: () => number): void {
  const [a, b, c, d] = celda;

  for (let i = 0; i < PERSONAS_POR_CELDA; i++) {
    const u = aleatorio();
    const v = aleatorio();
    const color = COLORES_PUBLICO[Math.floor(aleatorio() * COLORES_PUBLICO.length)];
    // Interpolación bilineal dentro de la celda.
    const p: Punto3 = [0, 1, 2].map(
      (k) => (1 - u) * (1 - v) * a[k] + u * (1 - v) * b[k] + u * v * c[k] + (1 - u) * v * d[k],
    ) as unknown as Punto3;
    const enCamara = camara.aCamara([p[0], p[1], p[2] + 4]);
    if (enCamara[2] < PLANO_CERCANO * 4) continue;

    const [x, y] = camara.proyectar(enCamara);
    const tamano = Math.min(5, Math.max(1, camara.tamanoEnPantalla(5, enCamara[2])));
    ctx.fillStyle = color;
    ctx.fillRect(x - tamano / 2, y - tamano, tamano, tamano);
  }
}

function dibujarReflectores(ctx: Contexto2D, camara: Camara): void {
  const base = alturaGraderia(G.radioExterno) + ALTO_MURO;
  const posiciones = [
    [G.centroX - 560, G.centroY - 380],
    [G.centroX + 560, G.centroY - 380],
    [G.centroX - 560, G.centroY + 380],
    [G.centroX + 560, G.centroY + 380],
  ];

  for (const [x, y] of posiciones) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    trazar(ctx, camara, [enMundo(x, y, base), enMundo(x, y, base + 110)]);

    const panel = 30;
    rellenar(
      ctx,
      camara,
      [
        enMundo(x - panel, y, base + 110),
        enMundo(x + panel, y, base + 110),
        enMundo(x + panel, y, base + 140),
        enMundo(x - panel, y, base + 140),
      ],
      '#f8fafc',
    );
  }
}

function dibujarVineta(ctx: Contexto2D): void {
  const vineta = ctx.createRadialGradient(
    ANCHO_VISTA / 2,
    ALTO_VISTA / 2,
    ALTO_VISTA * 0.45,
    ANCHO_VISTA / 2,
    ALTO_VISTA / 2,
    ANCHO_VISTA * 0.7,
  );
  vineta.addColorStop(0, 'rgba(15, 23, 42, 0)');
  vineta.addColorStop(1, 'rgba(15, 23, 42, 0.22)');
  ctx.fillStyle = vineta;
  ctx.fillRect(0, 0, ANCHO_VISTA, ALTO_VISTA);
}

// ---------------------------------------------------------------------------
// Geometría
// ---------------------------------------------------------------------------

/** Altura de la gradería a una distancia dada del eje del estadio. */
function alturaGraderia(radio: number): number {
  return ALTURA_PRIMERA_FILA + (radio - G.radioInterno) * PENDIENTE_GRADERIA;
}

/** Distancia de un punto del plano al eje del estadio (forma de estadio). */
function distanciaAlEje(x: number, y: number): number {
  const dx = Math.max(Math.abs(x - G.centroX) - G.largoRecto / 2, 0);
  return Math.hypot(dx, y - G.centroY);
}

function contornoEstadio(radio: number, z: number): Punto3[] {
  return segmentosDelAnillo(radio).flatMap((segmento) =>
    Array.from({ length: 24 }, (_, i) => {
      const { x, y } = segmento.punto((i / 24) * segmento.largo);
      return enMundo(x, y, z);
    }),
  );
}

function circulo(cx: number, cy: number, radio: number): Punto3[] {
  return Array.from({ length: 48 }, (_, i) => {
    const angulo = (i / 48) * Math.PI * 2;
    return enMundo(cx + radio * Math.cos(angulo), cy + radio * Math.sin(angulo), 0);
  });
}

function restar(a: Punto3, b: Punto3): Punto3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function escalar(a: Punto3, b: Punto3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cruz(a: Punto3, b: Punto3): Punto3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalizar(a: Punto3): Punto3 {
  const largo = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / largo, a[1] / largo, a[2] / largo];
}

function centro(puntos: readonly Punto3[]): Punto3 {
  const n = puntos.length;
  return [
    puntos.reduce((s, p) => s + p[0], 0) / n,
    puntos.reduce((s, p) => s + p[1], 0) / n,
    puntos.reduce((s, p) => s + p[2], 0) / n,
  ];
}

function distancia2(a: Punto3, b: Punto3): number {
  const d = restar(a, b);
  return escalar(d, d);
}

/** Aclara un color hexadecimal mezclándolo con blanco (0 = igual, 1 = blanco). */
function mezclarConBlanco(hex: string, cantidad: number): string {
  const valor = parseInt(hex.slice(1), 16);
  const canal = (desplazamiento: number) => {
    const c = (valor >> desplazamiento) & 0xff;
    return Math.round(c + (255 - c) * cantidad);
  };
  return `rgb(${canal(16)}, ${canal(8)}, ${canal(0)})`;
}
