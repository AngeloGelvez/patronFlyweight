import type { Entrada } from '../entrada';
import { Accion, Resultado } from '../resultado';

export type EstadoId = 'disponible' | 'reservada' | 'pagada' | 'usada';

/**
 * ESTADO (interfaz común). Declara una operación por cada acción que puede
 * pedirse a la entrada. Cada estado concreto implementa SOLO las que tienen
 * sentido para él; las demás se rechazan con el mensaje por defecto.
 *
 * Los estados reciben el contexto (`Entrada`) como parámetro: así no guardan
 * datos de la entrada y pueden ser objetos únicos y compartidos.
 */
export abstract class EstadoEntrada {
  abstract readonly id: EstadoId;
  abstract readonly nombre: string;
  abstract readonly descripcion: string;

  reservar(_entrada: Entrada): Resultado {
    return this.rechazar('reservar');
  }
  pagar(_entrada: Entrada): Resultado {
    return this.rechazar('pagar');
  }
  cancelar(_entrada: Entrada): Resultado {
    return this.rechazar('cancelar');
  }
  entrar(_entrada: Entrada): Resultado {
    return this.rechazar('entrar');
  }

  /** Mensaje por defecto: la acción no se puede hacer en este estado. */
  protected rechazar(accion: Accion): Resultado {
    return { ok: false, mensaje: `No se puede ${accion} una entrada ${this.nombre.toLowerCase()}.` };
  }
}
