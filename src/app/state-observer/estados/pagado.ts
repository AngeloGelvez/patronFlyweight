import { DIAS_MINIMOS_REEMBOLSO } from '../catalogo';
import type { Pedido } from '../pedido';
import { Accion, Resultado } from '../resultado';
import { EstadoPedido } from './estado-pedido';
import { Reembolsado } from './reembolsado';

/** Pagado y con entradas emitidas. El reembolso depende de cuánto falta para el partido. */
export class Pagado extends EstadoPedido {
  readonly id = 'pagado';
  readonly nombre = 'Pagado';
  readonly descripcion = 'Entradas emitidas y enviadas al correo.';

  override reembolsar(pedido: Pedido): Resultado {
    if (pedido.diasParaElPartido < DIAS_MINIMOS_REEMBOLSO) {
      return {
        ok: false,
        mensaje: `Solo se reembolsa con ${DIAS_MINIMOS_REEMBOLSO} días o más de antelación (faltan ${pedido.diasParaElPartido}).`,
      };
    }
    pedido.cambiarEstado(new Reembolsado(), `Se devolvieron ${pedido.total} €.`);
    return { ok: true, mensaje: `Reembolso de ${pedido.total} € en camino.` };
  }

  protected override rechazar(accion: Accion): Resultado {
    if (accion === 'añadir entradas' || accion === 'quitar entradas') {
      return { ok: false, mensaje: 'El pedido ya está pagado: no se pueden cambiar las entradas.' };
    }
    if (accion === 'cancelar') {
      return { ok: false, mensaje: 'Un pedido pagado no se cancela: pide un reembolso.' };
    }
    return super.rechazar(accion);
  }
}
