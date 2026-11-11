import type { EstadoPedidoId } from './estados/estado-pedido';

export type TipoEvento =
  | 'pedido-creado'
  | 'entrada-añadida'
  | 'entrada-quitada'
  | 'estado-cambiado'
  | 'pago-rechazado';

/**
 * Lo que el pedido le cuenta a quien lo observe. Es una "foto" con los datos
 * ya copiados: los observadores no necesitan conocer la clase `Pedido`.
 */
export interface EventoPedido {
  readonly tipo: TipoEvento;
  readonly pedidoId: number;
  readonly de: EstadoPedidoId | null;
  readonly a: EstadoPedidoId;
  readonly detalle: string;
  readonly entradas: number;
  /** Importe total en euros. */
  readonly total: number;
  readonly pagosRechazados: number;
  readonly momento: Date;
}

/** OBSERVADOR: cualquier cosa que quiera enterarse de lo que le pasa a un pedido. */
export interface Observador {
  readonly nombre: string;
  actualizar(evento: EventoPedido): void;
}

/** SUJETO: mantiene la lista de suscriptores y les avisa. */
export class Sujeto {
  private readonly observadores = new Set<Observador>();

  /** Devuelve una función para darse de baja. */
  suscribir(observador: Observador): () => void {
    this.observadores.add(observador);
    return () => this.observadores.delete(observador);
  }

  protected notificar(evento: EventoPedido): void {
    for (const observador of this.observadores) observador.actualizar(evento);
  }
}
