import { LocalidadId } from './localidades.db';
import { crearAleatorio } from './seeded-random';

/**
 * "Tabla" de sillas del estadio.
 *
 * En lugar de escribir a mano 100.000 registros, se generan con una semilla
 * fija: la misma cantidad y la misma semilla producen siempre las mismas
 * sillas, en las mismas posiciones y con el mismo estado.
 */

export type Tribuna = 'ORIENTAL' | 'SUR' | 'OCCIDENTAL' | 'NORTE';
export type EstadoSilla = 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA';

export interface SillaRegistro {
  /** Identificador legible, por ejemplo "OCC-102-F3-N12". */
  readonly id: string;
  readonly tribuna: Tribuna;
  /** Código de la sección, por ejemplo "OCC-102" (bandeja 1, sección 2). */
  readonly seccion: string;
  /** Fila dentro de la bandeja, contando desde la cancha. */
  readonly fila: number;
  /** Número de la silla dentro de su fila y sección. */
  readonly numero: number;
  /** Posición del centro de la silla, en coordenadas del plano del estadio. */
  readonly x: number;
  readonly y: number;
  readonly estado: EstadoSilla;
  readonly localidadId: LocalidadId;
}

export interface Rectangulo {
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
}

export interface EstadioGenerado {
  /** Tamaño del plano completo; el canvas lo escala para que quepa. */
  readonly ancho: number;
  readonly alto: number;
  readonly cancha: Rectangulo;
  /** Distancia entre los centros de dos sillas vecinas. */
  readonly separacionSillas: number;
  readonly sillas: readonly SillaRegistro[];
}

export const CANTIDADES_DISPONIBLES = [10_000, 25_000, 50_000, 100_000] as const;
export const SEMILLA_POR_DEFECTO = 2026;

/**
 * Geometría del plano. Las graderías tienen forma de "estadio" (rectángulo
 * con extremos semicirculares): tramos rectos para oriental y occidental, y
 * semicírculos para norte y sur.
 */
export const GEOMETRIA_ESTADIO = {
  ancho: 1800,
  alto: 1000,
  centroX: 900,
  centroY: 500,
  /** Largo de los tramos rectos (oriental y occidental). */
  largoRecto: 600,
  /** Distancia del eje del estadio a la primera fila. */
  radioInterno: 230,
  /** Distancia del eje del estadio al borde exterior de la última fila. */
  radioExterno: 470,
  /** Fracción de la gradería donde termina la bandeja baja y está el pasillo. */
  inicioBandejaAlta: 0.45,
  cancha: { x: 590, y: 300, ancho: 620, alto: 400 },
} as const;

const SECCIONES_POR_TRIBUNA = 4;

const PREFIJO_TRIBUNA: Record<Tribuna, string> = {
  ORIENTAL: 'ORI',
  SUR: 'SUR',
  OCCIDENTAL: 'OCC',
  NORTE: 'NOR',
};

/** Probabilidades de estado de cada silla. */
const PROBABILIDAD_VENDIDA = 0.38;
const PROBABILIDAD_RESERVADA = 0.07;

interface Anillo {
  readonly radio: number;
  /** 1 = bandeja baja, 2 = bandeja alta. */
  readonly bandeja: 1 | 2;
  readonly fila: number;
}

interface Posicion {
  readonly tribuna: Tribuna;
  readonly indiceSeccion: number;
  readonly numero: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Genera `cantidad` sillas repartidas por todo el estadio.
 *
 * La separación entre sillas se ajusta según la cantidad, de modo que siempre
 * se llena el estadio completo: con 10.000 sillas se ven grandes y con
 * 100.000 se ven como puntos pequeños.
 */
export function generarEstadio(
  cantidad: number,
  semilla: number = SEMILLA_POR_DEFECTO,
): EstadioGenerado {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error(`La cantidad de sillas debe ser un entero positivo (recibido: ${cantidad}).`);
  }

  const aleatorio = crearAleatorio(semilla);
  const separacion = calcularSeparacion(cantidad);
  const sillas: SillaRegistro[] = [];

  for (const anillo of construirAnillos(separacion)) {
    const faltantes = cantidad - sillas.length;
    if (faltantes <= 0) break;

    let posiciones = posicionesDelAnillo(anillo, separacion);

    // La última fila casi nunca se llena completa: se toman sillas repartidas
    // a lo largo de todo el anillo para que el estadio se vea simétrico.
    if (posiciones.length > faltantes) {
      posiciones = tomarRepartidas(posiciones, faltantes);
    }

    for (const posicion of posiciones) {
      sillas.push(crearSilla(posicion, anillo, aleatorio()));
    }
  }

  if (sillas.length !== cantidad) {
    throw new Error(`No caben ${cantidad} sillas en el estadio (se generaron ${sillas.length}).`);
  }

  return {
    ancho: GEOMETRIA_ESTADIO.ancho,
    alto: GEOMETRIA_ESTADIO.alto,
    cancha: GEOMETRIA_ESTADIO.cancha,
    separacionSillas: separacion,
    sillas,
  };
}

/**
 * Busca, con búsqueda binaria, la mayor separación entre sillas con la que
 * todavía caben `cantidad` sillas en la gradería.
 */
function calcularSeparacion(cantidad: number): number {
  let minima = 0.5;
  let maxima = 50;

  for (let i = 0; i < 40; i++) {
    const media = (minima + maxima) / 2;
    if (capacidad(media) >= cantidad) {
      minima = media;
    } else {
      maxima = media;
    }
  }

  return minima;
}

function capacidad(separacion: number): number {
  let total = 0;
  for (const anillo of construirAnillos(separacion)) {
    for (const segmento of segmentosDelAnillo(anillo.radio)) {
      total += SECCIONES_POR_TRIBUNA * sillasPorSeccion(segmento.largo, separacion);
    }
  }
  return total;
}

/** Filas de la gradería, desde la cancha hacia afuera. */
function construirAnillos(separacion: number): Anillo[] {
  const { radioInterno, radioExterno, inicioBandejaAlta } = GEOMETRIA_ESTADIO;
  const radioPasillo = radioInterno + (radioExterno - radioInterno) * inicioBandejaAlta;
  const anillos: Anillo[] = [];

  let radio = radioInterno + separacion / 2;
  let bandeja: 1 | 2 = 1;
  let fila = 1;

  while (radio <= radioExterno - separacion / 2) {
    if (bandeja === 1 && radio >= radioPasillo) {
      // Pasillo que separa la bandeja baja de la alta.
      bandeja = 2;
      fila = 1;
      radio += separacion * 1.5;
      continue;
    }

    anillos.push({ radio, bandeja, fila });
    radio += separacion;
    fila++;
  }

  return anillos;
}

interface Segmento {
  readonly tribuna: Tribuna;
  readonly largo: number;
  /** Convierte una distancia recorrida sobre el segmento en un punto (x, y). */
  readonly punto: (distancia: number) => { x: number; y: number };
}

/**
 * Los cuatro segmentos de una fila, recorridos en sentido horario empezando
 * por la esquina superior izquierda. En el plano, la tribuna oriental está
 * arriba, la sur a la derecha, la occidental abajo y la norte a la izquierda.
 */
function segmentosDelAnillo(radio: number): Segmento[] {
  const { centroX, centroY, largoRecto } = GEOMETRIA_ESTADIO;
  const izquierda = centroX - largoRecto / 2;
  const derecha = centroX + largoRecto / 2;
  const semicirculo = Math.PI * radio;

  return [
    {
      tribuna: 'ORIENTAL',
      largo: largoRecto,
      punto: (d) => ({ x: izquierda + d, y: centroY - radio }),
    },
    {
      tribuna: 'SUR',
      largo: semicirculo,
      punto: (d) => {
        const angulo = -Math.PI / 2 + d / radio;
        return { x: derecha + radio * Math.cos(angulo), y: centroY + radio * Math.sin(angulo) };
      },
    },
    {
      tribuna: 'OCCIDENTAL',
      largo: largoRecto,
      punto: (d) => ({ x: derecha - d, y: centroY + radio }),
    },
    {
      tribuna: 'NORTE',
      largo: semicirculo,
      punto: (d) => {
        const angulo = Math.PI / 2 + d / radio;
        return { x: izquierda + radio * Math.cos(angulo), y: centroY + radio * Math.sin(angulo) };
      },
    },
  ];
}

/** Deja el espacio de una silla libre entre secciones para las escaleras. */
function sillasPorSeccion(largoSegmento: number, separacion: number): number {
  const largoSeccion = largoSegmento / SECCIONES_POR_TRIBUNA;
  return Math.max(0, Math.floor(largoSeccion / separacion) - 1);
}

function posicionesDelAnillo(anillo: Anillo, separacion: number): Posicion[] {
  const posiciones: Posicion[] = [];

  for (const segmento of segmentosDelAnillo(anillo.radio)) {
    const largoSeccion = segmento.largo / SECCIONES_POR_TRIBUNA;
    const porSeccion = sillasPorSeccion(segmento.largo, separacion);
    // Centra las sillas dentro de la sección.
    const margen = (largoSeccion - (porSeccion - 1) * separacion) / 2;

    for (let s = 0; s < SECCIONES_POR_TRIBUNA; s++) {
      for (let i = 0; i < porSeccion; i++) {
        const { x, y } = segmento.punto(s * largoSeccion + margen + i * separacion);
        posiciones.push({ tribuna: segmento.tribuna, indiceSeccion: s, numero: i + 1, x, y });
      }
    }
  }

  return posiciones;
}

function tomarRepartidas<T>(elementos: readonly T[], cantidad: number): T[] {
  const resultado: T[] = [];
  for (let i = 0; i < cantidad; i++) {
    resultado.push(elementos[Math.floor((i * elementos.length) / cantidad)]);
  }
  return resultado;
}

function crearSilla(posicion: Posicion, anillo: Anillo, azar: number): SillaRegistro {
  const seccion = `${PREFIJO_TRIBUNA[posicion.tribuna]}-${anillo.bandeja}0${posicion.indiceSeccion + 1}`;

  return {
    id: `${seccion}-F${anillo.fila}-N${posicion.numero}`,
    tribuna: posicion.tribuna,
    seccion,
    fila: anillo.fila,
    numero: posicion.numero,
    x: posicion.x,
    y: posicion.y,
    estado: elegirEstado(azar),
    localidadId: asignarLocalidad(posicion.tribuna, posicion.indiceSeccion, anillo.bandeja),
  };
}

function elegirEstado(azar: number): EstadoSilla {
  if (azar < PROBABILIDAD_VENDIDA) return 'VENDIDA';
  if (azar < PROBABILIDAD_VENDIDA + PROBABILIDAD_RESERVADA) return 'RESERVADA';
  return 'DISPONIBLE';
}

/**
 * Reparte las localidades como en un estadio real: VIP y palcos en el centro
 * de occidental, preferencial en el centro de oriental y general detrás de
 * los arcos. Las esquinas de norte y sur se venden con la tribuna lateral
 * más cercana.
 */
function asignarLocalidad(tribuna: Tribuna, indiceSeccion: number, bandeja: 1 | 2): LocalidadId {
  const esCentral = indiceSeccion === 1 || indiceSeccion === 2;

  switch (tribuna) {
    case 'OCCIDENTAL':
      if (esCentral) return bandeja === 1 ? 'VIP' : 'PALCO';
      return 'OCCIDENTAL';
    case 'ORIENTAL':
      return esCentral && bandeja === 1 ? 'PREFERENCIAL' : 'ORIENTAL';
    // Sur se recorre de arriba (oriental) hacia abajo (occidental).
    case 'SUR':
      if (esCentral) return 'GENERAL';
      return indiceSeccion === 0 ? 'ORIENTAL' : 'OCCIDENTAL';
    // Norte se recorre de abajo (occidental) hacia arriba (oriental).
    case 'NORTE':
      if (esCentral) return 'GENERAL';
      return indiceSeccion === 0 ? 'OCCIDENTAL' : 'ORIENTAL';
  }
}
