import { EstadioGenerado, EstadoSilla } from '../../core/data/estadio.generator';
import { LocalidadId, LOCALIDADES } from '../../core/data/localidades.db';
import { Dibujante } from '../dibujante';
import { VistaDelEstadio } from './vista-del-estadio';

const COLOR_LOCALIDAD = new Map<LocalidadId, string>(LOCALIDADES.map((l) => [l.id, l.color]));

/** Los asientos ocupados se dibujan más apagados. */
const OPACIDAD: Record<EstadoSilla, number> = {
  DISPONIBLE: 1,
  RESERVADA: 0.5,
  VENDIDA: 0.2,
};

/** Texto alternativo de cada asiento, que aprovechan los motores SVG y texto. */
const ETIQUETA_ESTADO: Record<EstadoSilla, string> = {
  DISPONIBLE: 'asiento libre',
  RESERVADA: 'asiento reservado',
  VENDIDA: 'asiento vendido',
};

const ETIQUETAS_ZONA: readonly { readonly texto: string; readonly x: number; readonly y: number }[] = [
  { texto: 'LATERAL ESTE', x: 900, y: 140 },
  { texto: 'LATERAL OESTE', x: 900, y: 860 },
  { texto: 'FONDO NORTE', x: 215, y: 500 },
  { texto: 'FONDO SUR', x: 1585, y: 500 },
];

/**
 * ABSTRACCIÓN REFINADA · El plano del estadio con todos sus asientos.
 *
 * Solo sabe de asientos y colores: para pintar usa las figuras básicas del
 * dibujante, sin enterarse de si acabarán en píxeles, en SVG o en texto.
 */
export class MapaDeAsientos extends VistaDelEstadio {
  readonly titulo = 'Mapa de asientos';
  readonly descripcion = 'El plano del estadio con cada asiento coloreado según su localidad.';
  readonly ancho: number;
  readonly alto: number;

  constructor(
    dibujante: Dibujante,
    private readonly plano: EstadioGenerado,
  ) {
    super(dibujante);
    this.ancho = plano.ancho;
    this.alto = plano.alto;
  }

  protected dibujarContenido(): void {
    const { cancha, sillas, separacionSillas } = this.plano;

    this.dibujante.rectangulo(0, 0, this.ancho, this.alto, {
      relleno: '#ffffff',
      etiqueta: 'fondo del plano',
    });

    // Terreno de juego.
    this.dibujante.rectangulo(cancha.x, cancha.y, cancha.ancho, cancha.alto, {
      relleno: '#3f8f46',
      radio: 10,
      etiqueta: 'césped',
    });

    const centroX = cancha.x + cancha.ancho / 2;
    const centroY = cancha.y + cancha.alto / 2;
    const blanco = { borde: '#ffffff', grosor: 3 } as const;

    this.dibujante.linea(centroX, cancha.y + 16, centroX, cancha.y + cancha.alto - 16, {
      ...blanco,
      etiqueta: 'línea de medio campo',
    });
    this.dibujante.circulo(centroX, centroY, 58, { ...blanco, etiqueta: 'círculo central' });

    // Áreas de portería, una a cada lado.
    const altoArea = cancha.alto * 0.46;
    const anchoArea = cancha.ancho * 0.15;
    for (const lado of [0, 1]) {
      const x = lado === 0 ? cancha.x + 16 : cancha.x + cancha.ancho - 16 - anchoArea;
      this.dibujante.rectangulo(x, centroY - altoArea / 2, anchoArea, altoArea, {
        ...blanco,
        etiqueta: 'área de portería',
      });
    }

    // Un rectángulo por asiento: aquí está casi todo el dibujo.
    const lado = separacionSillas * 0.78;
    for (const silla of sillas) {
      this.dibujante.rectangulo(silla.x - lado / 2, silla.y - lado / 2, lado, lado, {
        relleno: COLOR_LOCALIDAD.get(silla.localidadId) ?? '#94a3b8',
        radio: lado * 0.28,
        opacidad: OPACIDAD[silla.estado],
        etiqueta: ETIQUETA_ESTADO[silla.estado],
      });
    }

    for (const zona of ETIQUETAS_ZONA) {
      this.dibujante.texto(zona.x, zona.y, zona.texto, {
        tamano: 26,
        negrita: true,
        color: '#0f172a',
        alineacion: 'centro',
      });
    }
  }
}
