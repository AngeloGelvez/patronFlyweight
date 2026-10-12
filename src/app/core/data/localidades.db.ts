/**
 * "Tabla" de localidades del estadio.
 *
 * Cada localidad agrupa miles de sillas que comparten exactamente la misma
 * información: precio, color, beneficios y términos y condiciones. Ese es el
 * estado intrínseco que el patrón Flyweight va a compartir.
 */
export type LocalidadId =
  | 'VIP'
  | 'PALCO'
  | 'PREFERENCIAL'
  | 'OCCIDENTAL'
  | 'ORIENTAL'
  | 'GENERAL';

export interface LocalidadRegistro {
  readonly id: LocalidadId;
  readonly nombre: string;
  readonly descripcion: string;
  /** Precio en pesos colombianos (COP). */
  readonly precio: number;
  /** Color con el que se pinta la silla en el mapa. */
  readonly color: string;
  readonly beneficios: readonly string[];
  /** Texto legal largo (~2 KB) que el usuario acepta al comprar. */
  readonly terminosYCondiciones: string;
}

/** Cláusulas que aplican a todas las localidades. */
const TERMINOS_GENERALES: readonly string[] = [
  '1. La boleta es un título al portador que otorga el derecho a ingresar a un único evento, en la fecha, hora y silla indicadas. No es válida para eventos reprogramados en una sede distinta salvo comunicación oficial del organizador.',
  '2. El ingreso se realiza exclusivamente con el código QR digital asociado a la compra. Cada código se valida una sola vez; las capturas de pantalla, copias o reventas no autorizadas pueden ser anuladas sin derecho a reembolso.',
  '3. Las puertas del estadio se abren tres (3) horas antes del inicio del evento. El organizador no garantiza el ingreso de los asistentes que lleguen después de iniciado el primer tiempo.',
  '4. Está prohibido el ingreso de armas, objetos cortopunzantes, pólvora, bengalas, bebidas alcohólicas, sustancias psicoactivas, sombrillas, cascos, cadenas y elementos que puedan usarse como proyectiles.',
  '5. Todo asistente está sujeto a requisa por parte del personal de logística y de la Policía Nacional. Negarse a la requisa implica la pérdida del derecho de ingreso sin reembolso del valor pagado.',
  '6. El asistente autoriza el uso de su imagen captada durante el evento en transmisiones de televisión, plataformas digitales y material promocional del organizador, sin que ello genere contraprestación alguna.',
  '7. Las boletas no tienen cambio ni devolución, salvo en caso de cancelación definitiva del evento. En ese caso se reembolsará el valor de la boleta, sin incluir el cargo por servicio, dentro de los treinta (30) días hábiles siguientes.',
  '8. Los menores de catorce (14) años deben ingresar acompañados por un adulto responsable y contar con su propia boleta. No se permite el ingreso de menores de cinco (5) años por razones de seguridad.',
  '9. El asistente debe ocupar únicamente la silla asignada en su boleta. El personal de logística podrá reubicar o retirar a quien ocupe una silla diferente o permanezca en escaleras y vías de evacuación.',
  '10. El comportamiento violento, discriminatorio o que ponga en riesgo la seguridad de los demás asistentes dará lugar al retiro inmediato del estadio y a las sanciones previstas en la Ley 1270 de 2009 y sus decretos reglamentarios.',
];

/** Arma el texto legal completo con las cláusulas propias de cada localidad. */
function terminos(...clausulasPropias: string[]): string {
  return [...TERMINOS_GENERALES, ...clausulasPropias].join('\n\n');
}

export const LOCALIDADES: readonly LocalidadRegistro[] = [
  {
    id: 'PALCO',
    nombre: 'Palco',
    descripcion:
      'Zona privada en la bandeja alta de occidental, con la mejor vista panorámica de la cancha.',
    precio: 1_200_000,
    color: '#d55181',
    beneficios: [
      'Ingreso por puerta exclusiva sin filas',
      'Servicio de catering y bebidas durante todo el evento',
      'Silla acolchada con brazos y portavasos',
      'Parqueadero cubierto incluido',
      'Kit de bienvenida con camiseta oficial',
    ],
    terminosYCondiciones: terminos(
      '11. El servicio de catering inicia dos (2) horas antes del evento y finaliza al terminar el segundo tiempo. Las bebidas alcohólicas solo se sirven a mayores de edad dentro del área del palco.',
      '12. El parqueadero incluido está sujeto a disponibilidad y se asigna por orden de llegada. El vehículo debe retirarse a más tardar una (1) hora después de finalizado el evento.',
    ),
  },
  {
    id: 'VIP',
    nombre: 'VIP',
    descripcion:
      'Primeras filas de occidental, en el centro de la cancha y a nivel del terreno de juego.',
    precio: 850_000,
    color: '#c98500',
    beneficios: [
      'Ingreso preferencial por puerta 1',
      'Acceso a la zona lounge con comidas y bebidas',
      'Silla acolchada numerada',
      'Kit de bienvenida con bufanda oficial',
    ],
    terminosYCondiciones: terminos(
      '11. El acceso a la zona lounge requiere la manilla entregada en la puerta 1. La manilla es personal e intransferible y su pérdida no da lugar a reposición.',
    ),
  },
  {
    id: 'PREFERENCIAL',
    nombre: 'Preferencial',
    descripcion:
      'Bandeja baja central de oriental, frente a las cámaras de televisión y a los bancos técnicos.',
    precio: 420_000,
    color: '#e66767',
    beneficios: [
      'Ingreso por puerta 5 con filas reducidas',
      'Silla numerada con espaldar',
      'Zona de comidas exclusiva de la tribuna',
    ],
    terminosYCondiciones: terminos(
      '11. La zona de comidas exclusiva funciona hasta el final del entretiempo. Los precios de los alimentos no están incluidos en el valor de la boleta.',
    ),
  },
  {
    id: 'OCCIDENTAL',
    nombre: 'Occidental',
    descripcion: 'Tribuna occidental lateral, con techo que protege de la lluvia y del sol.',
    precio: 280_000,
    color: '#3987e5',
    beneficios: ['Silla numerada', 'Tribuna cubierta', 'Pantalla gigante frente a la tribuna'],
    terminosYCondiciones: terminos(),
  },
  {
    id: 'ORIENTAL',
    nombre: 'Oriental',
    descripcion: 'Tribuna oriental lateral, con vista completa de la cancha desde el costado.',
    precio: 220_000,
    color: '#199e70',
    beneficios: ['Silla numerada', 'Vista lateral de toda la cancha'],
    terminosYCondiciones: terminos(),
  },
  {
    id: 'GENERAL',
    nombre: 'General',
    descripcion: 'Tribunas norte y sur, detrás de los arcos. El ambiente más animado del estadio.',
    precio: 95_000,
    color: '#d95926',
    beneficios: ['Silla numerada', 'Ambiente de barra detrás del arco'],
    terminosYCondiciones: terminos(
      '11. En las tribunas norte y sur solo se permite el ingreso de banderas sin astas y de instrumentos musicales previamente autorizados por el organizador.',
    ),
  },
];

/**
 * Simula una consulta a la base de datos: busca una localidad por su id.
 */
export function obtenerLocalidad(id: LocalidadId): LocalidadRegistro {
  const localidad = LOCALIDADES.find((l) => l.id === id);
  if (!localidad) {
    throw new Error(`La localidad "${id}" no existe en la base de datos.`);
  }
  return localidad;
}
