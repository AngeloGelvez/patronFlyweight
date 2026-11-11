import { Accion, Resultado } from '../resultado';
import { EstadoEntrada } from './estado-entrada';

/** Estado final: el QR ya se escaneó en el torno y no se puede volver a usar. */
export class Usada extends EstadoEntrada {
  readonly id = 'usada';
  readonly nombre = 'Usada';
  readonly descripcion = 'El QR ya se escaneó en el torno.';

  // No sobrescribe ninguna acción: todas se rechazan.
  protected override rechazar(accion: Accion): Resultado {
    if (accion === 'entrar') return { ok: false, mensaje: 'Este QR ya se usó: no puede entrar dos veces.' };
    return { ok: false, mensaje: 'La entrada ya se usó; no admite más cambios.' };
  }
}
