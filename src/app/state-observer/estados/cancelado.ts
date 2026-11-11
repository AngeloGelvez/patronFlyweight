import { Accion, Resultado } from '../resultado';
import { EstadoPedido } from './estado-pedido';

/** Estado final: el pedido se abandonó, expiró o falló el pago. */
export class Cancelado extends EstadoPedido {
  readonly id = 'cancelado';
  readonly nombre = 'Cancelado';
  readonly descripcion = 'El pedido terminó sin pago.';

  protected override rechazar(_accion: Accion): Resultado {
    return { ok: false, mensaje: 'El pedido está cancelado: ya no admite cambios.' };
  }
}
