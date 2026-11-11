import type { Entrada } from '../entrada';
import { Accion, Resultado } from '../resultado';
import { Disponible } from './disponible';
import { EstadoEntrada } from './estado-entrada';
import { Pagada } from './pagada';

/** Apartada para una persona, pero sin pagar: puede pagarla o soltarla. */
export class Reservada extends EstadoEntrada {
  readonly id = 'reservada';
  readonly nombre = 'Reservada';
  readonly descripcion = 'Está apartada, pero falta pagarla.';

  override pagar(entrada: Entrada): Resultado {
    entrada.cambiarEstado(new Pagada());
    return { ok: true, mensaje: 'Pago recibido. Ya tienes tu entrada con su código QR.' };
  }

  override cancelar(entrada: Entrada): Resultado {
    entrada.cambiarEstado(new Disponible());
    return { ok: true, mensaje: 'Reserva cancelada. El asiento vuelve a estar disponible.' };
  }

  protected override rechazar(accion: Accion): Resultado {
    if (accion === 'reservar') return { ok: false, mensaje: 'Esta entrada ya está reservada.' };
    return super.rechazar(accion);
  }
}
