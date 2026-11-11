import { signal } from '@angular/core';
import { EventoPedido, Observador } from '../observador';

export interface Correo {
  readonly pedidoId: number;
  readonly asunto: string;
  readonly cuerpo: string;
}

/** OBSERVADOR 1: le escribe un correo al cliente cada vez que su pedido cambia de estado. */
export class NotificadorCorreo implements Observador {
  readonly nombre = 'Correo al cliente';
  readonly correos = signal<readonly Correo[]>([]);

  actualizar(evento: EventoPedido): void {
    if (evento.tipo !== 'estado-cambiado') return;
    const correo = this.redactar(evento);
    if (correo) this.correos.update((lista) => [correo, ...lista]);
  }

  private redactar(e: EventoPedido): Correo | null {
    const n = `#${e.pedidoId}`;
    switch (e.a) {
      case 'pendiente':
        return { pedidoId: e.pedidoId, asunto: `Pedido ${n}: reserva confirmada`, cuerpo: `Apartamos tus ${e.entradas} entradas (${e.total} €). Págalas antes de que expire la reserva.` };
      case 'pagado':
        return { pedidoId: e.pedidoId, asunto: `Pedido ${n}: ¡tus entradas están listas!`, cuerpo: `Recibimos ${e.total} €. Tus ${e.entradas} entradas con QR van adjuntas.` };
      case 'cancelado':
        return { pedidoId: e.pedidoId, asunto: `Pedido ${n}: cancelado`, cuerpo: `${e.detalle} Las entradas se liberaron y no se te cobró nada.` };
      case 'reembolsado':
        return { pedidoId: e.pedidoId, asunto: `Pedido ${n}: reembolso`, cuerpo: `Te devolvemos ${e.total} €. Llegarán en unos días a tu medio de pago.` };
      default:
        return null;
    }
  }
}
