import { MAX_PAGOS_RECHAZADOS } from '../catalogo';
import type { Pedido } from '../pedido';
import { Accion, Resultado } from '../resultado';
import { Cancelado } from './cancelado';
import { EstadoPedido } from './estado-pedido';
import { Pagado } from './pagado';

/** Entradas apartadas esperando el pago. Un pago rechazado NO cambia de estado… hasta el tercero. */
export class PendienteDePago extends EstadoPedido {
  readonly id = 'pendiente';
  readonly nombre = 'Pendiente de pago';
  readonly descripcion = 'Las entradas están apartadas mientras se paga.';

  override pagar(pedido: Pedido): Resultado {
    pedido.cambiarEstado(new Pagado(), `Pago de ${pedido.total} € aceptado.`);
    return { ok: true, mensaje: 'Pago aceptado. Entradas emitidas.' };
  }

  override rechazarPago(pedido: Pedido): Resultado {
    const intentos = pedido.registrarPagoRechazado();
    if (intentos >= MAX_PAGOS_RECHAZADOS) {
      pedido.cambiarEstado(new Cancelado(), `${intentos} pagos rechazados seguidos.`);
      return { ok: false, mensaje: 'Tercer pago rechazado: el pedido se canceló.' };
    }
    return {
      ok: false,
      mensaje: `Pago rechazado (${intentos} de ${MAX_PAGOS_RECHAZADOS}). Prueba con otra tarjeta.`,
    };
  }

  override expirar(pedido: Pedido): Resultado {
    pedido.cambiarEstado(new Cancelado(), 'Se acabó el tiempo de la reserva.');
    return { ok: true, mensaje: 'La reserva expiró y las entradas se liberaron.' };
  }

  override cancelar(pedido: Pedido): Resultado {
    pedido.cambiarEstado(new Cancelado(), 'El cliente canceló antes de pagar.');
    return { ok: true, mensaje: 'Pedido cancelado. Las entradas se liberaron.' };
  }

  protected override rechazar(accion: Accion): Resultado {
    if (accion === 'añadir entradas' || accion === 'quitar entradas') {
      return { ok: false, mensaje: 'El pedido ya está confirmado: no se pueden cambiar las entradas.' };
    }
    return super.rechazar(accion);
  }
}
