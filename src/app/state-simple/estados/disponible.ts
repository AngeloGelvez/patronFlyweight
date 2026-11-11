import type { Entrada } from '../entrada';
import { Resultado } from '../resultado';
import { EstadoEntrada } from './estado-entrada';
import { Reservada } from './reservada';

/** Nadie la ha tomado: lo único posible es reservarla. */
export class Disponible extends EstadoEntrada {
  readonly id = 'disponible';
  readonly nombre = 'Disponible';
  readonly descripcion = 'Nadie la ha tomado todavía.';

  override reservar(entrada: Entrada): Resultado {
    entrada.cambiarEstado(new Reservada());
    return { ok: true, mensaje: 'Entrada reservada. Tienes que pagarla para quedártela.' };
  }
}
