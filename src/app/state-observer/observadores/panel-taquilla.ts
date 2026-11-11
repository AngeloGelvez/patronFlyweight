import { computed, signal } from '@angular/core';
import { EstadoPedidoId } from '../estados/estado-pedido';
import { EventoPedido, Observador } from '../observador';

const VACIO: Record<EstadoPedidoId, number> = {
  carrito: 0,
  pendiente: 0,
  pagado: 0,
  cancelado: 0,
  reembolsado: 0,
};

/**
 * OBSERVADOR 2: el panel de la taquilla. Observa TODOS los pedidos a la vez y
 * mantiene cifras globales sin preguntarle nada a ningún pedido.
 */
export class PanelTaquilla implements Observador {
  readonly nombre = 'Panel de taquilla';
  readonly pedidosPorEstado = signal<Record<EstadoPedidoId, number>>({ ...VACIO });

  /** Importe de cada pedido hoy cobrado (se quita si se reembolsa). */
  private readonly cobrado = signal<ReadonlyMap<number, { total: number; entradas: number }>>(new Map());

  readonly ingresos = computed(() => [...this.cobrado().values()].reduce((s, p) => s + p.total, 0));
  readonly entradasVendidas = computed(() => [...this.cobrado().values()].reduce((s, p) => s + p.entradas, 0));

  actualizar(e: EventoPedido): void {
    if (e.tipo === 'pedido-creado') {
      this.mover(null, e.a);
    } else if (e.tipo === 'estado-cambiado') {
      this.mover(e.de, e.a);
      if (e.a === 'pagado') this.cambiarCobro(e.pedidoId, { total: e.total, entradas: e.entradas });
      if (e.a === 'reembolsado') this.cambiarCobro(e.pedidoId, null);
    }
  }

  private mover(de: EstadoPedidoId | null, a: EstadoPedidoId): void {
    this.pedidosPorEstado.update((actual) => {
      const nuevo = { ...actual };
      // Si el panel se activó tarde, puede no haber visto nacer el pedido: no baja de cero.
      if (de) nuevo[de] = Math.max(0, nuevo[de] - 1);
      nuevo[a]++;
      return nuevo;
    });
  }

  private cambiarCobro(id: number, datos: { total: number; entradas: number } | null): void {
    this.cobrado.update((actual) => {
      const copia = new Map(actual);
      if (datos) copia.set(id, datos);
      else copia.delete(id);
      return copia;
    });
  }
}
