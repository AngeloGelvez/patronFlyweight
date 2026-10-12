import { Pipe, PipeTransform } from '@angular/core';

const LOCALE = 'es-CO';

function numero(valor: number, decimales: number): string {
  return valor.toLocaleString(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/** 0,4 ms · 85 ms · 12,3 s */
@Pipe({ name: 'duracion' })
export class DuracionPipe implements PipeTransform {
  transform(ms: number | null | undefined): string {
    if (ms == null) return '—';
    if (ms < 10) return `${numero(ms, 1)} ms`;
    if (ms < 1_000) return `${numero(ms, 0)} ms`;
    return `${numero(ms / 1_000, 1)} s`;
  }
}

/** 0,9 MB · 12,4 MB · 683 MB */
@Pipe({ name: 'megabytes' })
export class MegabytesPipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (bytes == null) return '—';
    const mb = bytes / 1_048_576;
    return `${numero(mb, mb >= 100 ? 0 : 1)} MB`;
  }
}

/** 3,4× · 12× · 740× */
@Pipe({ name: 'veces' })
export class VecesPipe implements PipeTransform {
  transform(veces: number | null | undefined): string {
    if (veces == null) return '—';
    return `${numero(veces, veces >= 10 ? 0 : 1)}×`;
  }
}
