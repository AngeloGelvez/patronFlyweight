import { signal } from '@angular/core';
import { EventoPedido, Observador } from '../observador';

export interface LineaRegistro {
  readonly hora: string;
  readonly texto: string;
}

/** OBSERVADOR 3: anota todo lo que ocurre, en orden, para poder auditarlo después. */
export class RegistroAuditoria implements Observador {
  readonly nombre = 'Registro de auditoría';
  readonly lineas = signal<readonly LineaRegistro[]>([]);

  actualizar(e: EventoPedido): void {
    const hora = e.momento.toLocaleTimeString('es-ES');
    const cambio = e.tipo === 'estado-cambiado' ? `${e.de} → ${e.a}. ` : '';
    this.lineas.update((l) => [{ hora, texto: `Pedido #${e.pedidoId} · ${cambio}${e.detalle}` }, ...l]);
  }
}
