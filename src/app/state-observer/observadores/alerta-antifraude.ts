import { signal } from '@angular/core';
import { EventoPedido, Observador } from '../observador';

/** OBSERVADOR 4: vigila los pagos rechazados y levanta una alerta si parecen sospechosos. */
export class AlertaAntifraude implements Observador {
  readonly nombre = 'Alerta antifraude';
  readonly alertas = signal<readonly string[]>([]);

  actualizar(e: EventoPedido): void {
    if (e.tipo === 'pago-rechazado' && e.pagosRechazados === 2) {
      this.avisar(`⚠ Pedido #${e.pedidoId}: 2 pagos rechazados seguidos. Revisar.`);
    }
    if (e.tipo === 'estado-cambiado' && e.a === 'cancelado' && e.pagosRechazados >= 3) {
      this.avisar(`🚫 Pedido #${e.pedidoId}: bloqueado por 3 pagos rechazados.`);
    }
  }

  private avisar(texto: string): void {
    this.alertas.update((a) => [texto, ...a]);
  }
}
