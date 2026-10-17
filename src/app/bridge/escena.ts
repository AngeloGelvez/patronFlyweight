import { EstadioGenerado, generarEstadio, SillaRegistro } from '../core/data/estadio.generator';
import { EVENTO } from '../core/data/evento.db';
import { LocalidadRegistro, obtenerLocalidad } from '../core/data/localidades.db';
import { ZonaRegistro, ZONAS } from '../core/data/zonas.db';
import { nombreLocalidadYZona } from '../shared/etiquetas';
import { DatosEntrada } from './vistas/entrada-imprimible';

/**
 * Aforo de esta demostración.
 *
 * Bridge no es un patrón de optimización, así que aquí no hace falta un
 * estadio enorme: con 500 asientos el plano se dibuja al instante en los tres
 * motores y el foco queda en el patrón.
 */
export const ASIENTOS_DEMO = 500;

export interface Escena {
  readonly plano: EstadioGenerado;
  readonly asiento: SillaRegistro;
  readonly localidad: LocalidadRegistro;
  readonly zona: ZonaRegistro;
  readonly entrada: DatosEntrada;
}

/** Prepara de una vez todo lo que necesitan las tres vistas. */
export function crearEscena(cantidad: number = ASIENTOS_DEMO): Escena {
  const plano = generarEstadio(cantidad);
  const asiento = elegirAsiento(plano.sillas);
  const localidad = obtenerLocalidad(asiento.localidadId);
  const zona = ZONAS[asiento.zona];

  return {
    plano,
    asiento,
    localidad,
    zona,
    entrada: {
      partido: `${EVENTO.local.nombre} vs ${EVENTO.visitante.nombre}`,
      competicion: EVENTO.competicion,
      fecha: formatearFecha(EVENTO.fecha),
      ubicacion: nombreLocalidadYZona(localidad.nombre, zona.nombre),
      color: localidad.color,
      puerta: zona.puerta,
      seccion: asiento.seccion,
      fila: asiento.fila,
      asiento: asiento.numero,
      precio: formatearPrecio(localidad.precio),
      codigo: generarCodigo(asiento.id),
    },
  };
}

/** Prefiere un asiento libre para que la entrada tenga sentido. */
function elegirAsiento(sillas: readonly SillaRegistro[]): SillaRegistro {
  return sillas.find((s) => s.estado === 'DISPONIBLE') ?? sillas[0];
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
}

function formatearPrecio(euros: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(euros);
}

/** Código fijo para un mismo asiento, para que la entrada no cambie sola. */
function generarCodigo(semilla: string): string {
  let hash = 2166136261;
  for (const caracter of semilla) {
    hash = Math.imul(hash ^ caracter.charCodeAt(0), 16777619);
  }
  return `MET-${(hash >>> 0).toString(36).toUpperCase().padStart(7, '0')}`;
}
