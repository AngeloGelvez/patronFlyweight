import { Accion, Resultado } from '../resultado';
import { EstadoPedido } from './estado-pedido';

/** Estado final: el dinero ya se devolvió. */
export class Reembolsado extends EstadoPedido {
  readonly id = 'reembolsado';
  readonly nombre = 'Reembolsado';
  readonly descripcion = 'Se devolvió el dinero.';

  protected override rechazar(_accion: Accion): Resultado {
    return { ok: false, mensaje: 'El pedido ya fue reembolsado: no admite más cambios.' };
  }
}
