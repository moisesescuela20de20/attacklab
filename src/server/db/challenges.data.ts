// Los 4 retos iniciales de la SPEC. Las banderas NO están acá: se derivan del secreto de la instalación.
export interface ChallengeSeed {
  id: string;
  title: string;
  category: "sql-injection" | "xss" | "passwords" | "access-control";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  mission: string;
  explanation: string;
  hints: { text: string; penalty: number }[];
}

export const CHALLENGES: ChallengeSeed[] = [
  {
    id: "sqli-login", title: "Inyección SQL en un login falso", category: "sql-injection", difficulty: "easy", points: 100,
    mission: "El panel de administración de la empresa ficticia “PixelShop” tiene un login. No conocés la contraseña del usuario admin. Lográ entrar como administrador para obtener la bandera.",
    explanation: "El login armaba la consulta SQL pegando lo que escribe el usuario. Una comilla cierra el texto y permite agregar condiciones como OR '1'='1', que siempre es verdadera. Se corrige con consultas parametrizadas: el valor viaja separado del SQL y nunca se interpreta como código.",
    hints: [
      { text: "Probá escribir una comilla simple (') en el usuario y mirá qué consulta se ejecuta.", penalty: 30 },
      { text: "¿Qué pasa si agregás una condición que siempre sea verdadera y comentás el resto con -- ?", penalty: 25 },
    ],
  },
  {
    id: "xss-search", title: "XSS reflejado en un buscador", category: "xss", difficulty: "medium", points: 150,
    mission: "El buscador de “PixelShop” muestra en la página lo que escribiste. Lográ que tu búsqueda se ejecute como código en el navegador.",
    explanation: "La página insertaba el texto de búsqueda en el HTML sin escaparlo, así que una etiqueta <script> o un atributo como onerror se ejecutaban. Se corrige escapando la salida (convertir < en &lt;, etc.) y con una política de seguridad de contenido (CSP).",
    hints: [
      { text: "Buscá algo con etiquetas HTML, por ejemplo <b>hola</b>, y mirá cómo se muestra.", penalty: 40 },
      { text: "Una imagen con una dirección que no existe dispara el atributo onerror.", penalty: 30 },
    ],
  },
  {
    id: "weak-password", title: "Contraseña débil", category: "passwords", difficulty: "easy", points: 80,
    mission: "El usuario admin del foro ficticio “GamerTalk” eligió una contraseña muy común. Adiviná cuál es para entrar y obtener la bandera.",
    explanation: "La cuenta usaba una de las contraseñas más usadas del mundo y el login no limitaba los intentos. Se corrige con políticas de contraseña (largo y frases), bloqueo tras varios intentos fallidos y autenticación en dos pasos.",
    hints: [
      { text: "Las listas de contraseñas más usadas se publican todos los años. Empezá por ahí.", penalty: 20 },
      { text: "Es un animal mitológico que escupe fuego.", penalty: 30 },
    ],
  },
  {
    id: "idor-profile", title: "Control de acceso roto en perfiles", category: "access-control", difficulty: "medium", points: 120,
    mission: "En la red social ficticia “ChatUp” podés ver tu perfil. El administrador guarda una nota privada en el suyo. Encontrá la forma de leerla.",
    explanation: "El servidor devolvía cualquier perfil según el número de la dirección, sin verificar que fuera el del usuario que lo pide (IDOR: referencia directa insegura a objetos). Se corrige validando en el servidor que el usuario tenga permiso sobre ese recurso.",
    hints: [
      { text: "Mirá el número de perfil que se usa para pedir tus datos.", penalty: 30 },
      { text: "Los administradores suelen ser los primeros usuarios creados.", penalty: 30 },
    ],
  },
];
