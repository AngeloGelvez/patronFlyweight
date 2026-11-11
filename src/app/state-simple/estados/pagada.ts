import type { Entrada } from '../entrada';
import { Accion, Resultado } from '../resultado';
import { EstadoEntrada } from './estado-entrada';
import { Usada } from './usada';

/** Pagada: ya solo sirve para entrar al estadio. No admite devoluciones. */
export class Pagada extends EstadoEntrada {
  readonly id = 'pagada';
  readonly nombre = 'Pagada';
  readonly descripcion = 'Pagada y lista para entrar con el QR.';

  override entrar(entrada: Entrada): Resultado {
    entrada.cambiarEstado(new Usada());
    return { ok: true, mensaje: 'Código QR válido. ¡Disfruta del partido!' };
  }

  protected override rechazar(accion: Accion): Resultado {
    if (accion === 'cancelar') {
      return { ok: false, mensaje: 'Las entradas pagadas no admiten devoluciones.' };
    }
    if (accion === 'reservar') return { ok: false, mensaje: 'Esta entrada ya es tuya: está pagada.' };
    if (accion === 'pagar') return { ok: false, mensaje: 'Esta entrada ya está pagada.' };
    return super.rechazar(accion);
  }
}
