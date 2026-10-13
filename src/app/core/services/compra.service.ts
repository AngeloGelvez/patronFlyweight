import { computed, Injectable, signal } from '@angular/core';
import { DetalleSilla } from '../models/mapa-de-sillas';

export type PasoCompra = 'silla' | 'datos' | 'pago' | 'boleta';

export const PASOS_COMPRA: readonly { readonly id: PasoCompra; readonly nombre: string }[] = [
  { id: 'silla', nombre: 'Elige tu asiento' },
  { id: 'datos', nombre: 'Tus datos' },
  { id: 'pago', nombre: 'Pago' },
  { id: 'boleta', nombre: 'Tu entrada' },
];

export type TipoDocumento = 'DNI' | 'NIE' | 'PASAPORTE';
export type MetodoPago = 'TARJETA' | 'BIZUM' | 'PAYPAL';

export interface DatosAsistente {
  readonly nombre: string;
  readonly tipoDocumento: TipoDocumento;
  readonly documento: string;
  readonly correo: string;
  readonly celular: string;
}

interface EstadoCompra {
  readonly paso: PasoCompra;
  /** Aforo del mapa en el que se eligió el asiento (cambia los ids de los asientos). */
  readonly aforo: number | null;
  readonly silla: DetalleSilla | null;
  readonly asistente: DatosAsistente | null;
  readonly metodoPago: MetodoPago | null;
  readonly codigo: string | null;
  readonly fechaCompra: string | null;
}

const CLAVE_ALMACENAMIENTO = 'flyweight.compra';
const PORCENTAJE_SERVICIO = 0.1;

const COMPRA_VACIA: EstadoCompra = {
  paso: 'silla',
  aforo: null,
  silla: null,
  asistente: null,
  metodoPago: null,
  codigo: null,
  fechaCompra: null,
};

/**
 * Estado del proceso de compra de una entrada. Es igual en las dos versiones:
 * el patrón solo cambia cómo se guardan los asientos del mapa.
 *
 * Se guarda en `sessionStorage` para no perder el avance al cambiar de
 * versión (ese cambio recarga la página). Nada sale del navegador.
 */
@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly estado = signal<EstadoCompra>(leerAlmacenada());

  readonly paso = computed(() => this.estado().paso);
  readonly silla = computed(() => this.estado().silla);
  readonly asistente = computed(() => this.estado().asistente);
  readonly metodoPago = computed(() => this.estado().metodoPago);
  readonly codigo = computed(() => this.estado().codigo);
  readonly fechaCompra = computed(() => this.estado().fechaCompra);

  readonly precio = computed(() => this.silla()?.localidad.precio ?? 0);
  /** Gastos de gestión, redondeados a céntimos. */
  readonly cargoServicio = computed(() => Math.round(this.precio() * PORCENTAJE_SERVICIO * 100) / 100);
  readonly total = computed(() => this.precio() + this.cargoServicio());

  /**
   * Si el mapa se cargó con otro aforo, el asiento elegido ya no existe en él.
   * Una entrada ya comprada se conserva.
   */
  sincronizarAforo(aforo: number): void {
    const { paso, aforo: aforoCompra } = this.estado();
    if (paso !== 'boleta' && aforoCompra !== null && aforoCompra !== aforo) {
      this.actualizar(() => COMPRA_VACIA);
    }
  }

  elegirSilla(silla: DetalleSilla, aforo: number): void {
    this.actualizar((e) => ({ ...e, silla, aforo, paso: 'datos' }));
  }

  guardarDatos(asistente: DatosAsistente): void {
    this.actualizar((e) => ({ ...e, asistente, paso: 'pago' }));
  }

  /** Simula el pago: no se cobra nada ni se piden datos de pago. */
  pagar(metodoPago: MetodoPago): void {
    const silla = this.estado().silla;
    if (!silla) return;

    this.actualizar((e) => ({
      ...e,
      metodoPago,
      codigo: generarCodigo(silla.id),
      fechaCompra: new Date().toISOString(),
      paso: 'boleta',
    }));
  }

  irA(paso: PasoCompra): void {
    this.actualizar((e) => ({ ...e, paso }));
  }

  reiniciar(): void {
    this.actualizar(() => COMPRA_VACIA);
  }

  private actualizar(cambio: (actual: EstadoCompra) => EstadoCompra): void {
    this.estado.update(cambio);
    try {
      sessionStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(this.estado()));
    } catch {
      // Sin almacenamiento, la compra se pierde al recargar.
    }
  }
}

/** Código de la entrada, por ejemplo "MET-7K2Q9XA". */
function generarCodigo(semilla: string): string {
  let hash = 2166136261;
  for (const caracter of `${semilla}-${Date.now()}`) {
    hash = Math.imul(hash ^ caracter.charCodeAt(0), 16777619);
  }
  return `MET-${(hash >>> 0).toString(36).toUpperCase().padStart(7, '0')}`;
}

function leerAlmacenada(): EstadoCompra {
  try {
    const texto = sessionStorage.getItem(CLAVE_ALMACENAMIENTO);
    return texto ? { ...COMPRA_VACIA, ...(JSON.parse(texto) as Partial<EstadoCompra>) } : COMPRA_VACIA;
  } catch {
    return COMPRA_VACIA;
  }
}
