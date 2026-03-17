// Versículos para orar según la categoría de la petición
// IDs en formato API.Bible

export const VERSICULOS_POR_CATEGORIA: Record<string, string[]> = {
  salud: [
    'JER.17.14',  // Sáname, oh Jehová, y seré sano
    'PSA.103.2',  // Bendice a Jehová... él sana todas tus dolencias
    'EXO.15.26',  // Yo soy Jehová tu sanador
    'MAT.8.17',   // Él tomó nuestras enfermedades
    'JAS.5.15',   // La oración de fe salvará al enfermo
  ],
  familia: [
    'JOS.24.15',  // Yo y mi casa serviremos a Jehová
    'PSA.127.3',  // Los hijos son herencia de Jehová
    'EPH.6.1',    // Hijos, obedeced a vuestros padres
    'COL.3.13',   // Soportaos unos a otros y perdonaos
    'PRO.22.6',   // Instruye al niño en su camino
  ],
  trabajo: [
    'COL.3.23',   // Todo lo que hagáis, hacedlo de corazón
    'PRO.16.3',   // Encomienda tus obras al Señor
    'PHP.4.19',   // Mi Dios suplirá todo lo que os falta
    'DEU.8.18',   // Él te da el poder para hacer las riquezas
    'PSA.90.17',  // Confirma la obra de nuestras manos
  ],
  fe: [
    'HEB.11.1',   // Es pues la fe la certeza de lo que se espera
    'ROM.10.17',  // La fe viene por el oír la palabra de Dios
    'MAT.17.20',  // Si tuviereis fe como un grano de mostaza
    'MAR.9.23',   // Al que cree todo le es posible
    'ROM.8.28',   // A los que aman a Dios todas las cosas ayudan
  ],
  otro: [
    'PHP.4.6',    // Por nada estéis afanosos
    '1PE.5.7',    // Echando toda vuestra ansiedad sobre él
    'MAT.11.28',  // Venid a mí todos los que estáis trabajados
    'PSA.46.1',   // Dios es nuestro amparo y fortaleza
    'ISA.41.10',  // No temas porque yo estoy contigo
  ],
}

export function getVersiculoIntercesion(categoria: string | null): string {
  const lista = VERSICULOS_POR_CATEGORIA[categoria || 'otro'] || VERSICULOS_POR_CATEGORIA.otro
  return lista[Math.floor(Math.random() * lista.length)]
}
