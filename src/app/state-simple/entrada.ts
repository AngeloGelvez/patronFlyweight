import { Disponible } from './estados/disponible';
import { EstadoEntrada } from './estados/estado-entrada';
import { Accion, Resultado } from './resultado';

export interface DatosEntrada {
  readonly zona: string;
  readonly fila: number;
  readonly asiento: number;
  /** Precio en euros. */
  readonly precio: number;
}

/**
 * CONTEXTO. Es el objeto que usa el resto del programa. Guarda sus datos y una
 * referencia a su estado actual, y le DELEGA todas las acciones: no tiene un
 * solo `if` que pregunte "¿en qué estado estoy?".
 */
export class Entrada {
  private estado: EstadoEntrada = new Disponible();
  private readonly _historial: string[] = [];

  constructor(readonly datos: DatosEntrada) {}

  get estadoActual(): EstadoEntrada {
    return this.estado;
  }

  get historial(): readonly string[] {
    return this._historial;
  }

  // --- Acciones públicas: todas se delegan al estado actual -------------------
  reservar(): Resultado {
    return this.registrar('reservar', this.estado.reservar(this));
  }
  pagar(): Resultado {
    return this.registrar('pagar', this.estado.pagar(this));
  }
  cancelar(): Resultado {
    return this.registrar('cancelar', this.estado.cancelar(this));
  }
  entrar(): Resultado {
    return this.registrar('entrar', this.estado.entrar(this));
  }

  /** Lo llaman los estados para pasar la entrada al siguiente estado. */
  cambiarEstado(nuevo: EstadoEntrada): void {
    this.estado = nuevo;
  }

  private registrar(accion: Accion, resultado: Resultado): Resultado {
    this._historial.push(`${accion} → ${resultado.ok ? '✔' : '✖'} ${resultado.mensaje}`);
    return resultado;
  }
}
