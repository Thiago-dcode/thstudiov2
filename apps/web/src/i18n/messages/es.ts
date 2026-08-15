import type { Messages } from "./en";

const messages = {
  seo: {
    organizationDescription:
      "A11STUDIO es la plataforma de portafolios donde los artistas son descubiertos: muestra tu trabajo y conecta con clientes, coleccionistas y colaboradores.",
    defaultTitle: "A11STUDIO — Donde los artistas son descubiertos",
    defaultDescription:
      "Muestra tu trabajo, hazte descubrir y conecta con clientes, coleccionistas y colaboradores. A11STUDIO es la plataforma de portafolios diseñada exclusivamente para artistas.",
  },
  landing: {
    metadata: {
      title: "A11STUDIO — Donde los artistas son descubiertos",
      description:
        "La plataforma de portafolios para artistas. Muestra tu trabajo, haz que clientes y coleccionistas te descubran y deja que la IA optimice tu SEO automáticamente.",
    },
    hero: {
      titlePrefix: "Deja que tu",
      titleAccentWords: ["arte", "visión", "talento", "pasión", "voz"],
      titleConnector: "se",
      titleDiscoverWords: [
        "comparta",
        "note",
        "revele",
        "encuentre",
        "descubra",
      ],
      subtitle: "Sube tu mejor arte. Del resto nos encargamos nosotros.",
      primaryCtaLoggedIn: "Acceder a Atelier",
      primaryCtaLoggedOut: "Empieza gratis ahora",
      secondaryCta: "Encuentra artistas",
      waitList: {
        hook: "Únete a la lista de espera para obtener acceso anticipado a la app.",
        label: "Únete a la lista de espera para artistas",
        placeholder: "Introduce tu correo electrónico",
        button: "Unirme a la lista",
        buttonPending: "Uniéndote...",
        hint: "Únete a la lista de espera y sé uno de los primeros en entrar a A11STUDIO.",
        hintTooltip:
          "Únete a la lista de espera y forma parte de los primeros usuarios con acceso anticipado, que recibirán beneficios exclusivos. La lista es limitada: una vez alcanzado el cupo máximo, se cerrará. <learnMore>Cómo funciona</learnMore>",
        successToast: "Ya estás en la lista de espera. Te avisaremos pronto.",
        successTitle: "Solo falta un paso más: confirma tu correo.",
        successMessage:
          "Te enviamos un correo de confirmación. Ábrelo y haz clic en el enlace para asegurar tu acceso anticipado.",
        successReserveMessage: "Reservaremos tu correo después de validarlo.",
        alreadyExists:
          "{email} ya está en la lista de espera. Revisa tu correo. Si esto no es correcto, <supportLink>contacta con soporte</supportLink>.",
      },
      disclaimer: "Gratis para empezar · No se requiere tarjeta",
      scrollToNextSection: "Ir a la siguiente sección",
      disciplinesAria: "Disciplinas bienvenidas",
      disciplines: {
        photography: "Fotografía",
        illustration: "Ilustración",
        painting: "Pintura",
        sculpture: "Escultura",
        tattoo: "Tatuaje",
        design: "Diseño",
        fashion: "Moda",
        animation: "Animación",
        digitalArt: "Arte digital",
        architecture: "Arquitectura",
        film: "Cine",
      },
    },
    valuePillars: {
      header: {
        badge: "Por qué A11STUDIO",
        title: "Creado por un artista para artistas",
        description:
          "Un espacio profesional para tu obra, con la inteligencia necesaria para hacer crecer tu carrera y la simplicidad para no frenarte.",
      },
      cta: "Trae tu arte",
      scrollToNextSection: "Ir a la siguiente sección",
      items: [
        {
          title: "Solo arte",
          description:
            "Un lugar solo para el {arte}. Sin ruido, sin distracciones.",
        },
        {
          title: "Inteligencia",
          description:
            "La {IA} se encarga de lo técnico y aburrido. Tú te enfocas en crear.",
        },
        {
          title: "Foco",
          description:
            "Tu único trabajo es compartir lo {mejor} de tu obra. Del resto nos encargamos nosotros.",
        },
        {
          title: "Comunidad",
          description:
            "Una comunidad basada en el buen {gusto}, no en las tendencias. Gente que valora el oficio sobre el ruido.",
        },
        {
          title: "Calidad",
          description:
            "Valoramos la {calidad} sobre la cantidad: tómate tu tiempo para subir tu mejor arte.",
        },
        {
          title: "Clientes",
          description:
            "Conectamos las necesidades de los clientes con los {artistas} adecuados. Rápido, directo y de confianza.",
        },
        {
          title: "Sin algoritmos",
          description:
            "El buen trabajo {habla} por sí solo. Sin feeds, sin juegos, sin perseguir el engagement.",
        },
        {
          title: "Propiedad",
          description:
            "Un hogar para tu obra que te {pertenece}. Permanente, no alquilado a una plataforma.",
        },
        {
          title: "Simplicidad",
          description:
            "Tan fácil de {actualizar} como una publicación en redes. Sin código, sin configuración.",
        },
        {
          title: "Oficio",
          description:
            "Hecho para priorizar la {calidad}, siempre. El gran arte merece una gran presentación.",
        },
        {
          title: "Descubrimiento",
          description:
            "Que te encuentren los clientes que importan. Visibilidad ganada por {talento}, no por algoritmos.",
        },
        {
          title: "Tiempo",
          description:
            "Menos tiempo configurando, más tiempo {creando}. Cada minuto ahorrado vuelve a tu arte.",
        },
        {
          title: "Credibilidad",
          description:
            "Una presencia profesional, sin el lío técnico. Genera confianza desde la primera {visita}.",
        },
        {
          title: "Elegancia",
          description:
            "Un espacio minimalista donde tu arte es el {protagonista}. Nada compite por la atención.",
        },
        {
          title: "Confianza",
          description:
            "Una forma rápida y fiable de encontrar {talento} real. Sin conjeturas, sin horas perdidas.",
        },
      ],
    },
    socialProof: {
      highlights: [
        "Calidad de web profesional, facilidad de red social",
        "La IA escribe tus biografías, etiquetas y posicionamiento",
        "Los clientes te descubren y te contactan directamente",
      ],
      cta: "Empieza gratis ahora",
    },
    featureCategories: {
      header: {
        badge: "Explorar",
        title: "Categorías destacadas",
        description:
          "Descubre artistas por disciplina: cada ruta te lleva a resultados seleccionados con criterio.",
      },
      card: {
        browse: "Ver",
        ariaBrowseArtistsIn: "Explorar artistas en",
      },
    },
    featuredArtists: {
      header: {
        badge: "Descubrir",
        title: "Artistas con quienes puedes conectar hoy mismo",
        description:
          "Cada portafolio es una línea directa entre artista y cliente. Explora, descubre e inicia una conversación.",
      },
      browseAll: "Ver todos los artistas",
    },
    featuredPortfolio: {
      header: {
        badge: "Portafolio destacado",
        title: "Inspírate con este portafolio",
        description:
          "Un portafolio real en A11STUDIO — curado, pulido y listo para compartir.",
      },
      by: "Un portafolio de",
      viewProfile: "Ver el perfil de @{username}",
      exploreMore: "Inspírate",
      scrollToNextSection: "Ir a la siguiente sección",
    },
    cta: {
      badge: "Hazte descubrir",
      title: "Menos tiempo configurando. Más tiempo creando.",
      description:
        "A11STUDIO se encarga del SEO, los metadatos y el posicionamiento. Tú subes tu mejor arte — del resto nos encargamos nosotros.",
      button: "Crear mi portafolio",
      waitListButton: "Trae tu arte",
    },
    howItWorks: {
      badge: "Cómo funciona",
      title: "Desde la subida hasta tu primer cliente",
      description:
        "Un portafolio que construye tu carrera, no solo muestra tu trabajo.",
      steps: {
        organize: {
          title: "Organiza y personaliza",
          description:
            "Sube tu trabajo y organízalo en un portafolio impactante. Personaliza el diseño como si editaras una publicación en redes — sin código, sin fricción.",
        },
        ai: {
          title: "La IA te posiciona",
          description:
            "La IA genera tu biografía, descripciones y etiquetas. Optimiza tu portafolio para buscadores, de modo que las personas adecuadas te encuentren.",
        },
        connect: {
          title: "Los clientes conectan",
          description:
            "Coleccionistas, agencias y colaboradores descubren tu portafolio y te contactan directamente. Relaciones reales, sin intermediarios.",
        },
      },
    },
  },
  faqs: {
    title: "Preguntas frecuentes",
    stillHaveQuestions:
      "¿Aún tienes preguntas? Estamos aquí para <link>ayudar</link>",
    viewAll: "Ver todas las preguntas",
    items: [
      {
        id: "what-is-a11studio",
        question: "¿Qué es A11STUDIO?",
        answer:
          "A11STUDIO combina lo mejor de un sitio web de portafolio profesional con la simplicidad y la cercanía de las redes sociales. Los sitios web tradicionales te dan control total sobre cómo presentas tu trabajo, mientras que las redes sociales hacen que publicar sea muy fácil. En lugar de obligarte a elegir, A11STUDIO te ofrece ambos: un hogar profesional y pulido para tu arte, tan fácil de actualizar como publicar una historia. Conoce más <a href='/about'>sobre nuestra misión</a>.",
      },
      {
        id: "what-is-a-portfolio",
        question: "¿Qué es un portafolio?",
        answer:
          "Un portafolio es tu selección destacada: una muestra cuidada de tu mejor trabajo dentro de una disciplina o estilo. Por ejemplo, un portafolio de “Fotografía de bodas” presentaría las mejores imágenes de todas las bodas que has cubierto. Es lo que los clientes ven para evaluar tu talento y decidir contratarte.",
      },
      {
        id: "what-is-a-collection",
        question: "¿Qué es una colección?",
        answer:
          "Una colección agrupa un proyecto o evento específico; por ejemplo, “Boda de María y Juan 2024” reuniría todas las fotos entregadas de esa sesión. Mientras que un <a href='#what-is-a-portfolio'>portafolio</a> es tu selección de lo mejor a lo largo de muchos proyectos, una colección es la forma de organizar el trabajo de un solo encargo, sesión o cuerpo de obra.",
      },
      {
        id: "create-account",
        question: "¿Cómo puedo crear una cuenta?",
        answer:
          "Empezar toma solo un minuto. Ve a la <a href='/auth/register'>página de registro</a>, crea tu cuenta gratuita y configura tu perfil. Puedes construir tu primer portafolio en minutos, sin necesidad de programar, alojar ni tener conocimientos de diseño web. Si los registros están cerrados temporalmente, puedes <a href='#wait-list-how-it-works'>unirte a la lista de espera</a> y te avisaremos en cuanto se libere tu lugar.",
      },
      {
        id: "wait-list-how-it-works",
        question: "¿Cómo funciona la lista de espera?",
        answer:
          "Cuando el registro está cerrado, la lista de espera es la forma de obtener acceso anticipado a A11STUDIO. Este es el flujo:<ul><li><strong>Únete con tu correo.</strong> Introduce tu dirección en el formulario de la lista. Te enviaremos un correo de confirmación de inmediato.</li><li><strong>Confirma tu correo.</strong> Abre el mensaje y haz clic en el enlace. Tu lugar solo se reserva después de validar — hasta entonces no bloqueamos una posición para ti.</li><li><strong>Consigue tu lugar en la fila.</strong> Tu posición se asigna al confirmar, en el orden en que las personas validan. Quienes confirman antes desbloquean mejores beneficios de acceso anticipado.</li><li><strong>Espera tu invitación.</strong> Cuando sea tu turno, te enviamos un enlace personal de registro. Tienes <strong>7 días</strong> para crear tu cuenta antes de que expire la invitación; también enviamos recordatorios antes del plazo.</li><li><strong>Regístrate y canjea.</strong> Usa el enlace para crear tu cuenta. Tu beneficio de la lista (meses gratis en nuestro plan superior) queda listo para canjear después de unirte.</li></ul><p><strong>Condiciones</strong></p><ul><li>Los cupos son limitados. Cuando alcanzamos la capacidad, la lista de espera se cierra.</li><li>La confirmación del correo es obligatoria. Los correos sin confirmar no mantienen una posición.</li><li>Los beneficios dependen de tu posición validada: los primeros 50 miembros confirmados son <strong>miembros fundadores</strong> (6 meses gratis); los que confirman después son <strong>miembros de acceso anticipado</strong> (3 meses gratis).</li><li>Cada invitación es de un solo uso para el correo de la lista y caduca a los 7 días si no se usa.</li><li>Si ya estás confirmado en la lista, enviar el mismo correo otra vez no crea una entrada nueva — revisa tu bandeja de entrada, o <a href='/support'>contacta con soporte</a> si algo no cuadra.</li></ul>",
      },
      {
        id: "why-ai",
        question: "¿Por qué A11STUDIO usa IA?",
        answer:
          "Para que puedas concentrarte en lo que mejor haces: crear arte. Todo lo técnico ocurre detrás de escena: nuestra IA escribe <strong>títulos, descripciones y etiquetas optimizados para SEO</strong>, categoriza tus medios automáticamente y genera texto alternativo para que los motores de búsqueda y los asistentes de IA puedan encontrarte. Nunca tienes que aprender SEO ni marketing: solo <a href='#position-profile'>sube tus mejores piezas y completa tu perfil</a>, y deja que la audiencia correcta las descubra.",
      },
      {
        id: "what-is-seo",
        question: "¿Qué es el SEO?",
        answer:
          "El SEO (optimización para motores de búsqueda) es lo que ayuda a que tu trabajo aparezca cuando alguien busca en Google —o le pregunta a un asistente de IA como ChatGPT— por un artista como tú. Normalmente requiere conocimientos técnicos reales, pero <strong>A11STUDIO lo hace por ti automáticamente</strong>, escribiendo títulos, descripciones, etiquetas y texto alternativo optimizados detrás de escena para que las personas correctas encuentren tu portafolio. Tu parte es simplemente <a href='#position-profile'>posicionar bien tu perfil</a> — luego mira <a href='#why-ai'>cómo lo hace nuestra IA</a>.",
      },
      {
        id: "position-profile",
        question: "¿Cómo puedo posicionar mi perfil?",
        answer:
          "A11STUDIO ya hace por ti la parte difícil: <strong>el SEO, la indexación en buscadores y la optimización ocurren automáticamente</strong>, y nuestra IA escribe los títulos, descripciones, etiquetas y texto alternativo detrás de escena. Tu único trabajo es darle material real y rico con el que trabajar. Cuanto más completo y específico sea tu perfil, más probable será que los clientes correctos —y asistentes de IA como ChatGPT o las respuestas de IA de Google— muestren tu trabajo. Así puedes posicionarte bien:<ul><li><strong>Completa tu perfil y tu ubicación.</strong> Añade tu nombre, profesión y ciudad — la ubicación impulsa el descubrimiento local, para que los clientes que buscan un artista cerca de ellos te encuentren.</li><li><strong>Mantén tu perfil enfocado en una disciplina — o en unas pocas que vayan juntas.</strong> Posicionarse es tanto lo que dejas fuera como lo que pones. Un perfil construido en torno a un solo oficio —o a un puñado de oficios vecinos, como la fotografía y el cine— se lee como el de un especialista: los clientes saben exactamente para qué contratarte, y los buscadores y los asistentes de IA se forman una idea clara de aquello por lo que se te conoce. Si te repartes entre campos sin relación —tatuador, cineasta y fotógrafo con dron en el mismo perfil— esa idea se difumina: cada señal se diluye y no destacas en nada en concreto. Si de verdad trabajas en disciplinas lejanas, encabeza con aquella por la que más quieres que te contraten y deja el resto para otro perfil.</li><li><strong>Elige las categorías que corresponden a tu oficio.</strong> Selecciona tus disciplinas y estilos con honestidad; así es como los clientes filtran los resultados y como los buscadores entienden lo que haces.</li><li><strong>Sube tu mejor trabajo con títulos y descripciones reales.</strong> Dale a cada pieza un título claro y específico y una breve descripción — la IA los enriquece, pero necesita detalle genuino (tema, estilo, lugar) sobre el que construir.</li><li><strong>Añade un banner y miniaturas cuidadas.</strong> Son lo primero que ven los visitantes — y las tarjetas para compartir en redes; una imagen pulida hace que la gente se quede.</li><li><strong>Completa tus servicios.</strong> Indica qué ofreces y los detalles que un cliente necesita para contratarte — los servicios apuntan a búsquedas de alta intención, listas para comprar.</li><li><strong>Escribe tu página Acerca de.</strong> Tu historia y experiencia generan la confianza que convierte a un visitante en cliente.</li><li><strong>Organiza tus portafolios y colecciones.</strong> Mantén ordenados tus <a href='#what-is-a-portfolio'>portafolios</a> con lo mejor y tus <a href='#what-is-a-collection'>colecciones</a> por proyecto para que los visitantes entiendan al instante tu trabajo.</li></ul>Haz esto y A11STUDIO se encarga de todo lo técnico a partir de ahí — nunca tienes que aprender SEO. ¿Aún con dudas? <a href='/support'>Escríbenos</a>.",
      },
      {
        id: "get-clients",
        question: "¿Cómo puedo conseguir clientes?",
        answer:
          "A11STUDIO está hecho para conectar a los artistas con las personas que valoran su trabajo. La mejor forma de atraer clientes es <strong>completar tu perfil, mostrar tus portafolios más fuertes y añadir servicios claros</strong> para que quienes están listos para contratar vean exactamente lo que ofreces. Mantén todo organizado para que los visitantes entiendan al instante tu trabajo. La plataforma se encarga del descubrimiento —SEO e indexación— para que los clientes (y los asistentes de IA) que buscan tu tipo de trabajo te encuentren. Asegúrate de que tu <a href='#position-profile'>perfil esté bien posicionado</a> para lograr el mayor alcance.",
      },
      {
        id: "upload-videos",
        question: "¿Puedo subir videos?",
        answer:
          "Todavía no: por ahora A11STUDIO admite imágenes y está diseñado para mostrarlas de forma hermosa. El soporte de video está en nuestra hoja de ruta para una versión futura, de modo que cineastas, animadores y artistas de motion también podrán presentar su trabajo aquí. ¿Quieres que te avisemos cuando esté disponible? <a href='/support'>Contáctanos</a>.",
      },
      {
        id: "is-free",
        question: "¿A11STUDIO es gratis?",
        answer:
          "Sí. A11STUDIO ofrece un plan gratuito que te permite crear tu perfil, construir portafolios y empezar a mostrar tu trabajo de inmediato. Los planes premium desbloquean funciones adicionales, como herramientas impulsadas por IA, más almacenamiento y personalización avanzada, pero puedes empezar gratis y mejorar solo si lo necesitas.",
      },
    ],
    page: {
      metadata: {
        title: "Preguntas frecuentes — A11STUDIO",
        description:
          "Respuestas a las preguntas más comunes sobre A11STUDIO — qué es, portafolios, crear una cuenta, la lista de espera, IA, posicionar tu perfil y precios.",
      },
      hero: {
        label: "Preguntas frecuentes",
        title: "Preguntas frecuentes",
        lead: "Todo lo que necesitas saber sobre A11STUDIO: qué es, cómo empezar, la lista de espera y cómo ayuda a que las personas correctas descubran tu trabajo.",
      },
      navLabel: "En esta página",
    },
  },
  about: {
    metadata: {
      title: "Acerca de — A11STUDIO",
      description:
        "Conoce A11STUDIO — la plataforma de portafolios que combina sitios web profesionales con la facilidad de las redes sociales, creada por un artista para artistas.",
    },
    hero: {
      label: "Acerca de",
      title: "La plataforma de portafolios creada para artistas",
      lead: "A11STUDIO une el acabado de un portafolio profesional con la simplicidad de las redes sociales — para que nunca tengas que elegir entre uno u otro.",
    },
    what: {
      title: "¿Qué es A11STUDIO?",
      paragraphs: [
        "Los sitios web tradicionales dan a los artistas control total sobre cómo presentan su obra. Las redes sociales hacen que publicar sea sencillo y ayudan a construir comunidad. A11STUDIO nació para unir estos dos mundos.",
        "En lugar de obligar a los artistas a elegir entre un portafolio hermoso o una plataforma fácil de usar, A11STUDIO ofrece ambos. Eliminamos las barreras técnicas — puedes crear un portafolio profesional en minutos mientras la plataforma se encarga del SEO, la optimización y el mantenimiento.",
      ],
    },
    bridge: {
      title: "Lo mejor de ambos mundos",
      websiteLabel: "Lo que ofrece un sitio web tradicional",
      websiteItems: [
        "Una presencia online profesional",
        "Un portafolio que refuerza tu marca personal",
        "Proyectos y galerías organizados",
        "Mayor visibilidad en buscadores",
        "Un hogar permanente para tu arte",
      ],
      socialLabel: "Lo que ofrecen las redes sociales",
      socialItems: [
        "Publicación de contenido muy sencilla",
        "Creación rápida de perfil sin programar",
        "Configuración técnica mínima",
        "Actualizaciones dinámicas de contenido",
        "Una comunidad alrededor de tu obra",
      ],
      closing:
        "Los sitios web son potentes, pero suelen exigir conocimientos técnicos, SEO, hosting y mantenimiento continuo. Muchos artistas solo quieren crear — no pasar horas aprendiendo tecnología. A11STUDIO cierra esa brecha.",
    },
    mission: {
      title: "Nuestra misión",
      statement:
        "Ayudar a los artistas a dedicar menos tiempo a la tecnología y más a crear arte con significado.",
      body: "Los artistas no deberían preocuparse por SEO, indexación, optimización web, programación ni configuraciones complejas. Tu única responsabilidad es crear y compartir tu mejor trabajo. A11STUDIO se encarga del resto.",
    },
    vision: {
      title: "Nuestra visión",
      paragraphs: [
        "Creemos que los artistas merecen una plataforma diseñada en torno a sus necesidades — no a los algoritmos. Con demasiada frecuencia, obras increíbles quedan enterradas bajo feeds interminables, tendencias y métricas de engagement.",
        "Aquí, la obra siempre es la protagonista. Cada decisión de diseño, cada función y cada sección tiene un solo objetivo: mostrar el arte de la mejor manera posible.",
      ],
    },
    values: {
      title: "Nuestros valores",
      items: [
        {
          title: "Creado por un artista, para artistas",
          description:
            "A11STUDIO no fue creado por una empresa que intenta entrar en la industria creativa. Fue construido por alguien que entiende las frustraciones de ser artista. Cada función existe porque resuelve un problema real.",
        },
        {
          title: "El arte primero",
          description:
            "La plataforma no está diseñada para maximizar el tiempo en pantalla, sino la presentación de tu obra. La interfaz se mantiene limpia, elegante y sin distracciones para que los visitantes se concentren en lo que importa: tu arte.",
        },
        {
          title: "La tecnología debe desaparecer",
          description:
            "La tecnología debe empoderar a los artistas — no abrumarlos. SEO, desarrollo web, optimización de rendimiento y mantenimiento ocurren entre bastidores.",
        },
        {
          title: "El tiempo es valioso",
          description:
            "Los artistas deberían invertir su tiempo creando, no configurando sitios web. A11STUDIO automatiza todo lo posible para que cada minuto ahorrado sea un minuto más dedicado al arte.",
        },
        {
          title: "Conectar artistas y clientes",
          description:
            "Un portafolio debe hacer más que mostrar obra — debe crear oportunidades. A11STUDIO ayuda a los artistas a presentarse profesionalmente y facilita que los clientes descubran gran talento.",
        },
      ],
    },
    why: {
      title: "Por qué existe A11STUDIO",
      intro:
        "Las redes sociales actuales premian la publicación constante más que los portafolios con significado. Muchos artistas sienten presión por crear contenido para algoritmos en lugar de arte que realmente aman. Los sitios web tradicionales resuelven eso, pero introducen otro problema: son difíciles de construir y mantener.",
      items: [
        "La profesionalidad de un sitio web personal",
        "La simplicidad de las redes sociales",
        "La visibilidad del SEO",
        "La facilidad de publicar contenido",
        "Una experiencia hermosa diseñada específicamente para artistas",
      ],
    },
    who: {
      title: "Para quién es",
      intro: "A11STUDIO es para artistas que:",
      items: [
        "Quieren un portafolio online hermoso",
        "Valoran su tiempo",
        "No quieren aprender desarrollo web",
        "Quieren ser descubiertos por clientes",
        "Les importa la presentación y la calidad",
        "Prefieren crear arte en lugar de gestionar tecnología",
      ],
      closing:
        "Ya seas fotógrafo, cineasta, ilustrador, pintor, diseñador, escultor u otro profesional creativo, A11STUDIO ayuda a que tu obra destaque.",
    },
    philosophy: {
      title: "Cómo decidimos",
      question: "¿Esto ayuda a los artistas a mostrar mejor su obra?",
      answer:
        "Si la respuesta es sí, pertenece aquí. Si no, no. La plataforma existe para servir a los artistas — no al revés.",
    },
    creator: {
      title: "Sobre el creador",
      paragraphs: [
        "Hola, soy Thiago. Soy ingeniero de software, pero antes que nada, soy artista. La fotografía y el cine siempre han sido mis mayores pasiones.",
        "Después de años creando contenido para redes sociales, sentí que hacía trabajo para algoritmos y no para mí. El burnout me llevó a alejarme del arte — y eventualmente hacia la programación, donde descubrí una nueva forma de construir cosas que ayudan a las personas.",
        "La idea de una plataforma para fotógrafos y artistas no me abandonó. En el verano de 2025, empecé A11STUDIO — combinando arte, diseño, fotografía, cine y programación en un solo producto.",
        "A11STUDIO no es solo otro proyecto. Es la plataforma que siempre deseé que existiera cuando era un artista intentando compartir mi obra con el mundo.",
      ],
    },
    cta: {
      title: "¿Listo para mostrar tu obra?",
      description:
        "Crea un portafolio profesional en minutos. Gratis para empezar — no se requiere tarjeta.",
      button: "Empezar",
    },
  },
  language: "Idioma",
  error: {
    title: "Algo salió mal",
    description:
      "Tuvimos un error inesperado. Inténtalo de nuevo o vuelve al inicio.",
    tryAgain: "Intentar de nuevo",
    backToHome: "Volver al inicio",
  },
  siteHeader: {
    openNavigation: "Abrir navegación",
    closeNavigation: "Cerrar navegación",
    navigation: "Navegación",
  },
  waitListDialog: {
    title: "El registro está cerrado por ahora",
    description:
      "Únete a la lista de espera y sé uno de los primeros en entrar a A11STUDIO.",
  },
  footer: {
    tagline: "La plataforma de portafolios creada para artistas.",
    cta: {
      getStarted: "Empezar",
    },
    legal: {
      heading: "Legal",
      privacy: "Política de privacidad",
      terms: "Términos de servicio",
      cookies: "Política de cookies",
    },
    discover: {
      heading: "Descubrir",
      artists: "Explorar artistas",
      portfolios: "Explorar portafolios",
    },
    contact: {
      heading: "Contacto",
      about: "Acerca de",
      faqs: "Preguntas frecuentes",
      support: "Soporte",
    },
    home: "Inicio de A11STUDIO",
    social: {
      heading: "Redes",
      instagram: "A11STUDIO en Instagram",
      linkedin: "A11STUDIO en LinkedIn",
    },
    copyright: "© {year} A11STUDIO. Todos los derechos reservados.",
  },
  search: {
    pagination: {
      previous: "Anterior",
      next: "Siguiente",
      previousAria: "Ir a la página anterior de resultados",
      nextAria: "Ir a la página siguiente de resultados",
    },
    segments: {
      artists: "Artistas",
      portfolios: "Portafolios",
      ariaLabel: "Tipo de búsqueda",
    },
    headerArtistSearch: {
      placeholder: "Buscar artistas…",
      ariaLabel: "Buscar artistas",
      registrationClosedToast:
        "La búsqueda de artistas no está disponible mientras el registro esté cerrado. Únete a la lista de espera para obtener acceso anticipado.",
    },
    page: {
      description:
        "Explora artistas en A11STUDIO. Descubre portafolios profesionales, servicios creativos y artistas visuales listos para colaborar.",
      title: "Artistas — A11STUDIO",
      errorHeading: "No pudimos cargar {segment}",
      errorMessage:
        "Algo salió mal durante la búsqueda. Inténtalo de nuevo en un momento.",
      searchingFor: "Buscando {segment}",
      results: {
        foundArtists:
          "{count, number} {count, plural, one {artista encontrado} other {artistas encontrados}}{suffix}",
        foundPortfolios:
          "{count, number} {count, plural, one {portafolio encontrado} other {portafolios encontrados}}{suffix}",
        forQuery: ' para "{query}"',
      },
      empty: {
        heading: "No se encontraron {segment}{suffix}",
        output:
          "Tus filtros no coinciden con ningún {segment}. Prueba a ampliar tu búsqueda{end}",
        lookNear: " o busca {segment} cerca de ti.",
      },
    },
    filters: {
      activeFilters: "Filtros activos",
      clearAll: "Limpiar todo",
      searchAria: "Buscar {segment}",
      searchPlaceholder: "Buscar {segment} por nombre, estilo o categoría…",
      searchButton: "Buscar",
      removeFilter: "Quitar filtro {label}",
      categoryFallback: "Categoría #{id}",
      badge: {
        search: "Búsqueda: {value}",
        geoLocation: "Mi ubicación",
        country: "País: {value}",
        state: "Estado: {value}",
        city: "Ciudad: {value}",
      },
    },
    nearMe: {
      gettingLocation: "Obteniendo ubicación…",
      nearMe: "Cerca de mí · {radius} km",
      searchClose: "Buscar cerca de mí",
      locationDenied:
        "Activa la ubicación en la configuración del navegador e inténtalo de nuevo.",
      locationUnavailable:
        "No pudimos obtener tu ubicación. Inténtalo de nuevo.",
    },
    primaryFilters: {
      categories: "Categorías",
      location: "Ubicación",
      categoriesAndLocation: "Categorías y ubicación",
      ariaLabel: "Filtros de categorías y ubicación",
      useMyLocation: "Usar mi ubicación",
    },
    locationFilter: {
      ariaLabel: "Filtros de ubicación",
      country: "País",
      state: "Estado / región",
      city: "Ciudad",
    },
    combobox: {
      placeholder: "Buscar…",
      groupLabel: "Categorías",
      selectedLabel: "Categorías seleccionadas",
      remove: "Quitar {label}",
      maxReached: "Límite alcanzado: quita una para añadir otra.",
      typeFilterLabel: "Filtrar por tipo",
      types: {
        DISCIPLINE: "Disciplinas",
        ART_STYLE: "Estilos de arte",
        TAGS: "Etiquetas",
      },
      empty: {
        pending: "",
        noMatches: "No hay coincidencias.",
        noItems: "—",
        searchingCategories: "Escribe para buscar categorías.",
      },
    },
    artistCard: {
      openProfile: "Abrir perfil: {name}, @{username}",
      specialtiesTitle: "Especialidades",
      locationDetailsTitle: "Detalles de ubicación en el perfil",
      noLocationTitle: "Ubicación no disponible",
      viewAction: "Ver",
    },
  },
  support: {
    metadata: {
      title: "Soporte — A11STUDIO",
      description:
        "Contacta con el soporte de A11STUDIO para resolver dudas sobre tu cuenta, facturación, planes o cualquier problema técnico. Cuéntanos qué ocurre y te responderemos por correo.",
    },
    contactLabel: "Contactar con soporte",
    title: "¿Necesitas ayuda? Envíanos un mensaje.",
    description:
      "Cuéntanos qué ocurre y elige el tema más adecuado para que podamos dirigir tu solicitud más rápido. Nuestro equipo responderá al correo que proporciones.",
    formContainer: {
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@correo.com",
      subjectLabel: "Asunto",
      messageLabel: "Mensaje",
      messagePlaceholder: "Cuéntanos cómo podemos ayudarte...",
      submitButton: "Enviar a soporte",
      successToast: "Tu mensaje se envió a soporte.",
    },
    unavailable: {
      heading: "Soporte no disponible temporalmente",
      description:
        "No pudimos cargar el formulario de soporte en este momento. Inténtalo de nuevo en unos minutos.",
    },
    subjects: [
      { value: "General question", label: "Pregunta general" },
      { value: "Technical issue", label: "Problema técnico" },
      { value: "Billing and plans", label: "Facturación y planes" },
      { value: "Account access", label: "Acceso a la cuenta" },
      { value: "Feature request", label: "Solicitud de función" },
      { value: "Partnership", label: "Colaboración" },
    ],
  },
  waitListValidate: {
    metadata: {
      title: "Validar correo — A11STUDIO",
      description:
        "Valida tu dirección de correo electrónico para confirmar tu lugar en la lista de espera.",
    },
    page: {
      label: "Lista de espera",
      title: "Correo confirmado.",
      description:
        "Tu lugar en la lista de espera está reservado. No tienes que hacer nada más — te escribiremos en cuanto sea tu turno.",
      status: "Acceso anticipado, antes de abrir al público.",
      benefit: {
        label: "Tu beneficio",
        tiers: {
          VIP: "Miembro fundador",
          EARLY_USER: "Miembro de acceso anticipado",
          FOUNDER: "Fundador",
        },
        line: "{tier} — {months} meses gratis.",
      },
    },
  },
  subscriptionCallback: {
    success: {
      title: "Activación completada.",
      subtitle: "Tu suscripción ya está activa.",
    },
    failed: {
      title: "Activación incompleta.",
      subtitle:
        "No pudimos activar tu suscripción. Por favor, inténtalo de nuevo.",
    },
    tryAgain: "Intentar de nuevo",
    continue: "Continuar",
    skipForNow: "Omitir por ahora",
    cancel: "Cancelar",
  },
  benefitSubscriptionDialog: {
    trigger: "Canjear beneficio",
    title: "Canjea tu beneficio",
    description:
      "Como <name>{label}</name>, disfruta de <free>{months, plural, one {# mes gratis} other {# meses gratis}}</free> en el plan {planName}.",
    noPayment:
      "No se requieren datos de pago. Tu <access>acceso gratuito de {months, plural, one {# mes} other {# meses}}</access> se activa al instante.",
    plan: "Plan",
    billingCycle: "Ciclo de facturación",
    freePeriod: "Periodo gratuito",
    freeMonths: "{months, plural, one {# mes} other {# meses}}",
    subscribe: "Suscribirse",
    activatingTitle: "Activando tu beneficio",
    activatingSubtitle: "Configurando tu suscripción…",
    errorTitle: "Algo salió mal",
    billingTypes: {
      MONTHLY: "Mensual",
      QUARTERLY: "Trimestral",
      YEARLY: "Anual",
      LIFETIME: "De por vida",
    },
    benefitTypes: {
      EARLY_USER: "Usuario anticipado",
      VIP: "VIP",
      FOUNDER: "Fundador",
    },
  },
  legal: {
    lastUpdated: "Última actualización — {date}",
    terms: {
      metadata: {
        title: "Términos del servicio — A11STUDIO",
        description:
          "Términos y condiciones de uso de la plataforma de portafolios A11STUDIO — cuentas, planes de suscripción, propiedad del contenido, uso aceptable y moderación.",
      },
      updatedAt: "2026-03-16",
      heading: "Términos del servicio",
      intro:
        "Estos términos regulan el uso de la plataforma A11STUDIO. Al crear una cuenta o utilizar nuestros servicios, aceptas quedar vinculado por ellos.",
      acceptance: {
        title: "1. Aceptación de los términos",
        body: 'Al acceder o utilizar A11STUDIO ("la Plataforma"), aceptas estos Términos del servicio. Si no estás de acuerdo, no debes usar la Plataforma. Podemos actualizar estos términos en cualquier momento: seguir usándola tras un cambio implica su aceptación.',
      },
      account: {
        title: "2. Registro de cuenta",
        body: "Para usar la Plataforma debes crear una cuenta indicando una dirección de correo válida, un nombre de usuario único y una contraseña. Eres responsable de mantener la confidencialidad de tus credenciales.",
        verified: "Debes verificar tu correo antes de obtener acceso completo.",
        twoFa:
          "Puede requerirse la autenticación en dos pasos (2FA) al iniciar sesión como seguridad adicional.",
        username:
          "Los cambios de nombre de usuario son limitados. Un uso excesivo puede restringirse.",
        age: "Debes tener al menos 16 años para crear una cuenta.",
      },
      plans: {
        title: "3. Planes de suscripción",
        body: "A11STUDIO ofrece planes gratuitos y de pago. Cada plan define límites de almacenamiento, subidas de archivos, portafolios, proyectos, clientes, servicios y créditos de IA.",
        billing:
          "Los planes de pago se facturan mediante <strong>Stripe</strong> o <strong>PayPal</strong> de forma recurrente (mensual o anual).",
        autoRenew:
          "Las suscripciones se renuevan automáticamente salvo que se cancelen antes de la siguiente fecha de facturación.",
        manage:
          "Puedes gestionar o cancelar tu suscripción desde los ajustes de tu cuenta en cualquier momento.",
        promos:
          "Las ofertas promocionales y los descuentos pueden aplicarse a determinados precios y están sujetos a sus propias condiciones.",
      },
      ownership: {
        title: "4. Propiedad del contenido",
        body1:
          "Conservas la plena propiedad del contenido que subas a la Plataforma, incluidas imágenes, archivos multimedia, descripciones de portafolios e información de perfil. Al subir contenido, concedes a A11STUDIO una licencia limitada, no exclusiva y mundial para mostrar, distribuir y procesar técnicamente tu contenido con el único fin de operar la Plataforma y prestar el servicio.",
        body2:
          "Esta licencia termina cuando eliminas tu contenido o tu cuenta. Por requisitos técnicos, pueden persistir brevemente copias en caché o archivadas tras la eliminación.",
      },
      acceptableUse: {
        title: "5. Uso aceptable",
        body: "Te comprometes a no subir, publicar ni transmitir contenido que:",
        law: "Infrinja cualquier ley o normativa aplicable",
        ip: "Vulnere derechos de propiedad intelectual de terceros",
        harmful:
          "Contenga material ilegal, dañino, amenazante o discriminatorio",
        fraud: "Sea fraudulento, engañoso o induzca a error",
        malware: "Contenga malware, virus o código dañino",
        body2:
          "Todo el material subido está sujeto a <strong>moderación automática de contenido</strong>. El contenido que incumpla nuestras políticas puede bloquearse automáticamente. Eres el único responsable del contenido que subas a la Plataforma: A11STUDIO no asume responsabilidad alguna por material dañino, ilegal o prohibido subido por los usuarios.",
      },
      moderation: {
        title: "6. Moderación y sanciones de cuenta",
        body: "A11STUDIO aplica un sistema de moderación basado en sanciones para preservar la integridad de la plataforma:",
        strikes:
          "Las infracciones de las políticas generan <strong>sanciones en la cuenta</strong>. Acumular sanciones puede conllevar la suspensión temporal o el bloqueo permanente.",
        temporary:
          "Los bloqueos temporales tienen una fecha de inicio y de fin definidas. Durante el bloqueo, tu cuenta y tu perfil público quedan inaccesibles.",
        permanent:
          "Los bloqueos permanentes se aplican en casos graves o reiterados. Siempre se indicará el motivo.",
      },
      illegal: {
        title: "7. Contenido ilegal y autoridades",
        body1:
          "A11STUDIO mantiene una <strong>política de tolerancia cero</strong> con el contenido ilegal, incluido —sin limitarse a ello— el material de abuso sexual infantil (CSAM), el contenido que muestre la explotación o el abuso de menores y cualquier otro material que constituya un delito según la ley aplicable.",
        body2:
          "Si se detecta dicho contenido —ya sea por moderación automática o revisión manual— nos reservamos el derecho a cerrar de forma inmediata y permanente la cuenta infractora, conservar las pruebas pertinentes y <strong>denunciar el hecho ante las autoridades competentes</strong>, incluidas, entre otras, la policía local, agencias nacionales y organizaciones internacionales como NCMEC o Interpol.",
        body3:
          "El usuario que sube el contenido asume toda la responsabilidad legal por cualquier material ilegal que introduzca en la Plataforma.",
      },
      limits: {
        title: "8. Limitaciones del servicio",
        body: "Cada plan de suscripción tiene límites definidos:",
        storage:
          "<strong>Almacenamiento</strong> — tamaño total máximo de archivos y límites de subida diarios",
        content:
          "<strong>Contenido</strong> — número máximo de portafolios, proyectos, clientes y servicios",
        aiCredits:
          "<strong>Créditos de IA</strong> — créditos limitados por ciclo de facturación para las funciones con IA (generación de SEO, sugerencias de contenido), que se reinician periódicamente",
        compression:
          "<strong>Compresión de archivos</strong> — su disponibilidad depende del nivel de tu plan",
        body2:
          "Superar estos límites puede restringir ciertas funciones hasta que mejores tu plan o comience el siguiente ciclo de facturación.",
      },
      ip: {
        title: "9. Propiedad intelectual",
        body1:
          "La plataforma A11STUDIO —incluidos su diseño, código, marca y funcionalidades— es propiedad intelectual de A11STUDIO. No puedes copiar, modificar, distribuir ni aplicar ingeniería inversa a ninguna parte de la Plataforma.",
        body2:
          "El contenido generado por los usuarios sigue siendo propiedad de su creador, según se describe en la sección 4.",
      },
      termination: {
        title: "10. Cancelación",
        body1:
          "Puedes eliminar tu cuenta en cualquier momento desde los ajustes. Al hacerlo, tus datos personales, archivos y contenido se eliminarán según se describe en nuestra <doc>Política de privacidad</doc>.",
        body2:
          "Nos reservamos el derecho a suspender o cerrar las cuentas que incumplan estos términos, abusen de la plataforma o realicen actividades fraudulentas.",
      },
      warranties: {
        title: "11. Exención de garantías",
        body: 'La Plataforma se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas, incluidas —sin limitación— las de comerciabilidad, idoneidad para un fin concreto o no infracción. No garantizamos un servicio ininterrumpido ni libre de errores.',
      },
      liability: {
        title: "12. Limitación de responsabilidad",
        body: "En la máxima medida permitida por la ley, A11STUDIO no será responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso de la Plataforma, incluida la pérdida de datos, ingresos o beneficios.",
      },
      law: {
        title: "13. Legislación aplicable",
        body: "Estos términos se rigen e interpretan conforme a la legislación aplicable. Cualquier disputa derivada de estos términos o del uso de la Plataforma se resolverá ante los tribunales competentes de la jurisdicción en la que A11STUDIO esté establecida.",
      },
      contact: {
        title: "14. Contacto",
        body: "Si tienes preguntas sobre estos términos, escríbenos a <email/>.",
      },
    },
    privacy: {
      metadata: {
        title: "Política de privacidad — A11STUDIO",
        description:
          "Cómo A11STUDIO recopila, usa, almacena y protege tus datos personales: qué recogemos, con quién lo compartimos, cuánto tiempo lo conservamos y qué derechos tienes.",
      },
      updatedAt: "2026-03-16",
      heading: "Política de privacidad",
      intro:
        "Esta política describe cómo A11STUDIO recopila, utiliza, almacena y protege tu información cuando usas nuestra plataforma. Nos comprometemos con la transparencia y con la protección de tus datos.",
      controller: {
        title: "1. Responsable del tratamiento",
        body: 'A11STUDIO ("nosotros") es el responsable del tratamiento de tus datos personales. Para cualquier consulta sobre privacidad, escríbenos a <email/>.',
      },
      collect: {
        title: "2. Información que recopilamos",
        body: "Recopilamos distintas categorías de información según cómo uses la plataforma:",
        account:
          "<strong>Datos de la cuenta</strong> — la información básica de perfil que facilitas al registrarte y configurar tu cuenta, como tu nombre, tu correo y cualquier contenido opcional que decidas añadir",
        location:
          "<strong>Datos de ubicación</strong> — si decides añadir una dirección a tu perfil, guardamos la información necesaria para mostrar tu ubicación públicamente",
        content:
          "<strong>Contenido que creas</strong> — archivos multimedia, portafolios, servicios, proyectos y cualquier descripción o metadato asociado que aportes en la plataforma",
        business:
          "<strong>Datos de negocio</strong> — si usas las funciones de gestión de clientes y proyectos, guardamos la información de contacto y de proyecto que introduzcas",
        messages:
          "<strong>Mensajes</strong> — cuando un visitante contacta con un artista a través de la plataforma, recopilamos la información incluida en el formulario de contacto",
        security:
          "<strong>Datos de seguridad</strong> — información técnica sobre la actividad de inicio de sesión y la identificación del dispositivo, usada para proteger tu cuenta",
      },
      payments: {
        title: "3. Datos de pago",
        body: "Los pagos de las suscripciones los procesan íntegramente proveedores externos. Solo guardamos las referencias necesarias para gestionar tu suscripción y tu historial de facturación. <strong>No</strong> almacenamos números de tarjeta, datos bancarios ni otras credenciales de pago en bruto: los gestiona el procesador de pagos conforme a sus propias políticas de privacidad.",
      },
      ai: {
        title: "4. Procesamiento con IA",
        body: "A11STUDIO utiliza inteligencia artificial para funciones como las sugerencias de contenido y la moderación automática. Registramos el uso para gestionar tu asignación de créditos de IA. El procesamiento lo realizan proveedores externos y solo se envían los datos mínimos necesarios.",
      },
      usage: {
        title: "5. Cómo usamos tus datos",
        operating: "Prestar y operar la plataforma de portafolios",
        auth: "Autenticar tu identidad y proteger tu cuenta",
        billing: "Procesar los pagos de suscripción y gestionar la facturación",
        aiFeatures: "Ofrecer las funciones asistidas por IA",
        moderation:
          "Aplicar las políticas de contenido mediante moderación automática",
        emails: "Enviar correos transaccionales y notificaciones",
        publicProfile: "Mostrar tu perfil público de artista y tu contenido",
        contactForm:
          "Entregar los mensajes del formulario de contacto entre visitantes y artistas",
      },
      sharing: {
        title: "6. Cesión de datos",
        body: "No vendemos tus datos personales. Solo los compartimos con los siguientes servicios externos en la medida necesaria para operar la plataforma:",
        payments:
          "<strong>Stripe y PayPal</strong> — para el procesamiento de pagos y la gestión de suscripciones",
        ai: "<strong>Proveedores de IA / LLM</strong> — para la generación de contenido y la moderación de archivos",
        email:
          "<strong>Proveedor de correo</strong> — para los correos transaccionales (verificación, recuperación de contraseña, notificaciones)",
      },
      retention: {
        title: "7. Conservación de los datos",
        body: "Conservamos tus datos personales mientras tu cuenta esté activa. Los registros de seguridad se conservan para proteger la cuenta, y los registros de pago durante el tiempo que exija la normativa aplicable. Cuando eliminas tu cuenta, borramos tus datos personales y el contenido asociado en un plazo razonable, salvo cuando la ley obligue a conservarlos.",
      },
      rights: {
        title: "8. Tus derechos",
        body: "Según tu jurisdicción, puedes tener los siguientes derechos sobre tus datos personales:",
        access:
          "<strong>Acceso</strong> — solicitar una copia de los datos que tenemos sobre ti",
        rectification:
          "<strong>Rectificación</strong> — corregir datos inexactos o incompletos",
        erasure:
          "<strong>Supresión</strong> — solicitar la eliminación de tus datos personales",
        portability:
          "<strong>Portabilidad</strong> — recibir tus datos en un formato estructurado y legible por máquina",
        restriction:
          "<strong>Limitación</strong> — pedir que restrinjamos el tratamiento de tus datos",
        objection:
          "<strong>Oposición</strong> — oponerte al tratamiento basado en intereses legítimos",
        body2:
          "Para ejercer cualquiera de estos derechos, escríbenos a <email/>.",
      },
      security: {
        title: "9. Seguridad",
        body: "Aplicamos medidas de seguridad estándar del sector para proteger tus datos, incluidos el cifrado, la autenticación segura y los controles de acceso. Aunque ningún sistema es totalmente inmune a las brechas, tomamos medidas razonables para salvaguardar tu información.",
      },
      cookies: {
        title: "10. Cookies",
        body: "Usamos cookies para el funcionamiento esencial de la plataforma. Encontrarás todos los detalles en nuestra <doc>Política de cookies</doc>.",
      },
      changes: {
        title: "11. Cambios en esta política",
        body: "Podemos actualizar esta política de vez en cuando. Los cambios se publicarán en esta página con una fecha de revisión actualizada. Seguir usando la plataforma tras un cambio implica la aceptación de la política revisada.",
      },
      contact: {
        title: "12. Contacto",
        body: "Si tienes preguntas o dudas sobre esta política de privacidad o sobre tus datos personales, escríbenos a <email/>.",
      },
    },
    cookies: {
      metadata: {
        title: "Política de cookies — A11STUDIO",
        description:
          "Cómo usa A11STUDIO las cookies y tecnologías similares. Solo utilizamos cookies propias necesarias para que la plataforma funcione: ninguna de publicidad ni de seguimiento.",
      },
      updatedAt: "2026-03-16",
      heading: "Política de cookies",
      intro:
        "Esta política explica qué cookies utiliza la plataforma A11STUDIO, por qué las usamos y cómo afectan a tu experiencia. Solo usamos cookies necesarias para que la plataforma funcione.",
      what: {
        title: "1. Qué son las cookies",
        body: "Las cookies son pequeños archivos de texto que tu navegador guarda en tu dispositivo. Permiten que la plataforma recuerde tu sesión, tus preferencias y tu estado de seguridad entre páginas. A11STUDIO solo usa <strong>cookies propias y HTTP-only</strong>: no usamos cookies de publicidad ni de seguimiento.",
      },
      essential: {
        title: "2. Cookies esenciales",
        body: "Estas cookies son estrictamente necesarias para que la plataforma funcione. No pueden desactivarse sin romper funciones básicas. Las cookies esenciales gestionan:",
        auth: "<strong>Autenticación</strong> — mantener tu sesión iniciada y gestionarla de forma segura entre páginas",
        security:
          "<strong>Seguridad</strong> — dar soporte a los pasos de verificación de la cuenta, como la autenticación en dos pasos",
        preferences:
          "<strong>Preferencias</strong> — recordar el idioma que has elegido para mostrar el contenido en el idioma correcto",
        body2:
          "Estas cookies son de corta duración y caducan automáticamente cuando dejan de ser necesarias, normalmente en una sola sesión o en unos pocos días.",
      },
      functional: {
        title: "3. Cookies funcionales",
        body: "Estas cookies mejoran tu experiencia recordando las decisiones que has tomado. Solo se establecen en respuesta a acciones que realizas en la plataforma.",
        sessions:
          "<strong>Sesiones prolongadas</strong> — mantener tu sesión iniciada más tiempo para que no tengas que entrar una y otra vez",
        checkout:
          "<strong>Estado del pago</strong> — mantener temporalmente el contexto durante los procesos de suscripción o pago",
        recovery:
          "<strong>Recuperación de cuenta</strong> — conservar el estado durante el proceso de restablecimiento de contraseña",
        body2:
          "Estas cookies son temporales y caducan poco después de completarse la acción correspondiente.",
      },
      thirdParty: {
        title: "4. Cookies de terceros",
        body: "Cuando interactúas con los proveedores de pago durante el proceso de compra, <strong>Stripe</strong> y <strong>PayPal</strong> pueden instalar sus propias cookies en tu dispositivo. Se rigen por las políticas de cookies y privacidad de cada proveedor:",
        stripe: "Política de privacidad de Stripe",
        paypal: "Política de privacidad de PayPal",
      },
      notUsed: {
        title: "5. Lo que no usamos",
        body: "A11STUDIO <strong>no</strong> utiliza:",
        analytics: "Cookies de analítica o seguimiento",
        advertising: "Cookies de publicidad o retargeting",
        pixels: "Píxeles de seguimiento de redes sociales",
        crossSite: "Tecnologías de seguimiento entre sitios",
      },
      managing: {
        title: "6. Gestionar las cookies",
        body: "Puedes gestionar o eliminar las cookies desde los ajustes de tu navegador. Desactivar las cookies esenciales te impedirá iniciar sesión y usar las funciones que requieren autenticación. Para más información sobre cómo gestionarlas, consulta la documentación de tu navegador.",
      },
      privacyRelation: {
        title: "7. Relación con la política de privacidad",
        body: "Esta Política de cookies forma parte de nuestra <doc>Política de privacidad</doc>. Consúltala para conocer en detalle cómo recopilamos, usamos y protegemos tus datos personales más allá de las cookies.",
      },
      contact: {
        title: "8. Contacto",
        body: "Si tienes preguntas sobre nuestro uso de cookies, escríbenos a <email/>.",
      },
    },
  },
  auth: {
    login: {
      metadata: {
        title: "Iniciar sesión",
        description:
          "Inicia sesión en tu cuenta de A11STUDIO para gestionar tus portafolios, colecciones y servicios, y llegar a los clientes que buscan tu trabajo.",
      },
      title: "Hola de nuevo",
      subtitle: "Inicia sesión para acceder a tu cuenta",
      problemWithLogin: "¿Problemas para iniciar sesión?",
      agreePrefix: "Al iniciar sesión, aceptas nuestros",
      termsOfService: "Términos de servicio",
      and: "y",
      privacyPolicy: "Política de privacidad",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "Introduce tu contraseña",
      submit: "Iniciar sesión",
    },
    register: {
      metadata: {
        title: "Crea tu cuenta",
        description:
          "Únete gratis a A11STUDIO y crea un portafolio profesional que te dé a conocer entre los clientes, coleccionistas y colaboradores que buscan artistas.",
      },
      title: "Crea tu cuenta",
      subtitle: "Y empieza a construir el portafolio de tus sueños",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      usernameLabel: "Nombre de usuario",
      usernamePlaceholder: "usuario",
      passwordLabel: "Contraseña *",
      passwordPlaceholder: "Introduce tu contraseña",
      submit: "Registrarse",
    },
    twoFa: {
      metadata: {
        title: "Verifica tu identidad",
        description:
          "Introduce el código de verificación que te hemos enviado para terminar de iniciar sesión en tu cuenta de A11STUDIO de forma segura.",
      },
      titleValidateEmail: "Valida tu correo",
      titleDeviceVerification: "Verificación del dispositivo",
      codeSentTo: "Hemos enviado un código de verificación a",
      havingTrouble: "¿Tienes problemas?",
      backToLogin: "Volver al inicio de sesión",
      codePlaceholder: "Introduce el código de 6 dígitos",
    },
    passwordRecovery: {
      metadata: {
        title: "Recupera tu contraseña",
        description:
          "Restablece la contraseña de tu cuenta de A11STUDIO. Introduce tu correo y te enviaremos un enlace de recuperación seguro.",
      },
      metadataSent: {
        title: "Revisa tu correo",
        description:
          "Te hemos enviado un enlace de recuperación a tu correo. Ábrelo para elegir una nueva contraseña para tu cuenta de A11STUDIO.",
      },
      metadataReset: {
        title: "Establece una nueva contraseña",
        description:
          "Elige una contraseña nueva y segura para tu cuenta de A11STUDIO y vuelve a iniciar sesión.",
      },
      metadataDone: {
        title: "Contraseña actualizada",
        description:
          "Tu contraseña de A11STUDIO se ha cambiado. Ya puedes iniciar sesión con la nueva.",
      },
      title: "Recuperación de contraseña",
      subtitle: "Introduce tu correo y te enviaremos un enlace de recuperación",
      rememberPassword: "¿Recuerdas tu contraseña?",
      needHelp: "¿Necesitas ayuda?",
      contactSupport: "Contactar con soporte",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@correo.com",
      submit: "Enviar",
      checkEmailTitle: "Revisa tu correo",
      checkEmailSubtitle:
        "Hemos enviado un enlace de recuperación de contraseña a tu correo electrónico",
      didntReceiveEmail: "¿No recibiste el correo?",
      rememberPasswordShort: "¿Recuerdas la contraseña?",
      tryAgain: "Intentar de nuevo",
      tryAgainIn: "Inténtalo de nuevo en",
      setNewPasswordTitle: "Establecer nueva contraseña",
      setNewPasswordSubtitle: "Elige una contraseña segura para tu cuenta",
      changedYourMind: "¿Cambiaste de opinión?",
      backToSignIn: "Volver a iniciar sesión",
      newPasswordLabel: "Nueva contraseña",
      newPasswordPlaceholder: "Introduce tu nueva contraseña",
      resetSubmit: "Restablecer contraseña",
      successTitle: "Contraseña actualizada con éxito",
      successSubtitle:
        "Tu contraseña ha sido cambiada. Ya puedes iniciar sesión con tu nueva contraseña.",
      continueToSignIn: "Continuar para iniciar sesión",
    },
    expiresIn: {
      remaining:
        "Te quedan {minutes, plural, =0 {} one {# minuto} other {# minutos}}{minutes, plural, =0 {} other { y }}{seconds, plural, one {# segundo} other {# segundos}}",
    },
  },
  getStarted: {
    metadata: {
      title: "Configura tu perfil",
      description:
        "Termina de configurar tu perfil de A11STUDIO — añade tus datos, tu foto y tus categorías para que los clientes adecuados puedan encontrarte.",
    },
    stepOf: "Paso {current} de {total}",
    steps: {
      profile: {
        title: "Completa tu perfil",
        subtitle: "Cuéntanos un poco sobre ti para empezar",
      },
      photo: {
        title: "Selecciona tu foto de perfil",
        subtitle: "Esta será tu imagen ante posibles clientes",
      },
      categories: {
        title: "Selecciona categorías",
        subtitle:
          "Elegir pocas categorías (se recomiendan 1–3) mejora tu visibilidad.",
      },
      location: {
        title: "Añade tu ubicación",
        subtitle: "Ayuda a los clientes a descubrir tu perfil por ubicación",
      },
      plan: {
        title: "Elige tu plan",
        subtitle: "Selecciona el plan perfecto para tu camino creativo",
      },
    },
    actions: {
      continue: "Continuar",
      finish: "Finalizar",
      continueWithoutBenefits: "Continuar sin beneficios",
      tryAgainLater: "Intentar más tarde",
      stepBack: "Volver atrás",
      somethingWentWrong: "Algo salió mal",
    },
  },
  plans: {
    card: {
      popular: "Popular",
      bestValue: "Mejor valor",
      getStarted: "Empezar",
      goPlan: "Ir a {planName}",
    },
    price: {
      free: "Gratis",
      from: "desde",
      perMonth: "/mes",
    },
    features: {
      unlimited: "Ilimitado",
      ofMediaStorage: "de almacenamiento de contenido",
      projects: "Proyectos",
      portfolios: "Portafolios",
      services: "Servicios",
      clients: "Clientes",
      mediaCompression: "Compresión de contenido",
      mediaCompressionTooltip:
        "Elige el nivel de compresión preferido al subir fotos. Equilibra la calidad de imagen y el tamaño del archivo para optimizar tu almacenamiento y los tiempos de carga.",
      aiCredits: "Créditos de IA",
      aiCreditsTooltip:
        "Aprovecha la IA para automatizar tareas repetitivas. Genera automáticamente títulos, descripciones y etiquetas para tu contenido basándote en el análisis, ahorrándote tiempo y esfuerzo.",
    },
    portal: {
      loading: "Cargando…",
      manageSubscription: "Gestionar tu suscripción",
    },
  },
  changeSubscriptionDialog: {
    processing: "Procesando...",
    errorTitle: "Algo salió mal",
    thisPlanIncludes: "Este plan incluye:",
    billingCycle: "Ciclo de facturación",
    total: "Total",
    perMonth: "/mes",
    billed: "facturado {billingType}",
    paymentMethod: "Método de pago",
    completePayment: "Completar pago",
    trustPaymentAlt: "pago seguro",
  },
  userBenefitModal: {
    title: "Tienes un regalo esperándote",
    description:
      "Como <name>{label}</name>, obtienes <free>{months, plural, one {# mes gratis} other {# meses gratis}}</free>.",
    claimBelow: "Canjéalo justo abajo. Te guiaremos para obtener el beneficio.",
    claimAfterSetup:
      "Cuando termines la configuración de bienvenida te guiaremos para obtener el beneficio.",
    claimNow: "Canjear ahora",
    maybeLater: "Quizá más tarde",
    gotItThanks: "Entendido, gracias.",
  },
  userAccountBanned: {
    title: "Cuenta suspendida",
    description: "Tu cuenta ha sido suspendida por incumplir las políticas.",
    restrictionsLiftedOn: "Las restricciones se levantarán el {date}.",
    contactSupport: "Contacta con soporte si crees que es un error.",
    logout: "Cerrar sesión",
  },
  emailPreferences: {
    metadata: {
      title: "Preferencias de correo — A11STUDIO",
      description:
        "Actualiza los tipos de correos que quieres recibir de A11STUDIO.",
    },
    page: {
      eyebrow: "Preferencias de correo",
      title: "Gestiona las preferencias de tu bandeja de entrada",
      subtitle:
        "Elige las actualizaciones que quieres conservar y respetaremos tu elección.",
    },
    form: {
      toastUpdated: "Preferencias actualizadas",
      managingFor: "Gestionando preferencias de",
      marketingLabel: "Correos de marketing",
      marketingDescription:
        "Novedades del producto, lanzamientos y actualizaciones ocasionales.",
      notificationsLabel: "Notificaciones",
      notificationsDescription:
        "Alertas de la cuenta y avisos relevantes de la plataforma.",
      waitlistLabel: "Actualizaciones de la lista de espera",
      waitlistDescription:
        "Actualizaciones sobre el progreso de la lista de espera y cambios de acceso.",
      save: "Guardar preferencias",
    },
  },
  webHeader: {
    accessProfile: "Perfil público",
    goToAtelier: "Ir a Atelier",
    signIn: "Iniciar sesión",
    openAtelier: "Abrir Atelier",
    tagline: "La plataforma de portafolios creada para artistas.",
  },
  editUser: {
    banner: {
      alt: "Banner",
      editTitle: "Editar banner",
      preview: "Vista previa del banner:",
      previewAlt: "Vista previa del banner",
      change: "Cambiar imagen del banner",
      remove: "Quitar banner",
    },
    avatar: {
      editTitle: "Editar avatar",
      preview: "Vista previa del perfil:",
      previewAlt: "Vista previa del perfil",
      alt: "Avatar del usuario",
    },
    profile: {
      editTitle: "Editar perfil",
      professionFallback: "Título profesional",
      biographyFallback: "Biografía breve",
      firstName: {
        label: "Nombre",
        placeholder: "Leonardo",
      },
      lastName: {
        label: "Apellido",
        placeholder: "Piero da Vinci",
      },
      profession: {
        label: "Profesión",
        placeholder: "Polímata renacentista y soñador profesional",
      },
      shortBio: {
        label: "Biografía breve sobre ti",
        placeholder:
          "Dibujo máquinas voladoras en el desayuno y disecciono la curiosidad para vivir...",
      },
    },
    address: {
      editTitle: "Editar dirección",
      noAddress: "Sin dirección registrada",
      updateDescription:
        "Actualiza tu información de dirección a continuación.",
      warningDescription:
        "Advertencia: actualizar tu dirección podría afectar a tu descubrimiento y visibilidad en los resultados de búsqueda. Actualízala solo si realmente lo necesitas.",
    },
    categories: {
      title: "Categorías",
      editTitle: "Editar categorías",
    },
    contact: {
      title: "Contacto y enlaces",
      editTitle: "Editar contacto y enlaces",
      description:
        "Añade un teléfono y enlaces sociales para que los clientes puedan contactarte. Todos los campos son opcionales: deja uno vacío para eliminarlo.",
      empty: "Aún no hay datos de contacto.",
      phone: {
        label: "Teléfono",
        placeholder: "+34 684 317 619",
        hint: "Incluye el prefijo del país, p. ej. +34. De 9 a 15 dígitos.",
      },
      instagram: {
        label: "Instagram",
        placeholder: "tuusuario",
        hint: "Usuario o URL oficial de Instagram (instagram.com/…).",
      },
      facebook: {
        label: "Facebook",
        placeholder: "tupagina",
        hint: "Usuario/página o URL oficial de Facebook (facebook.com/…).",
      },
      youtube: {
        label: "YouTube",
        placeholder: "tucanal",
        hint: "Identificador o URL oficial de YouTube (youtube.com/…).",
      },
      website: {
        label: "Sitio web",
        placeholder: "https://tuestudio.com",
      },
    },
    update: "Actualizar",
  },
  addressForm: {
    label: "Dirección",
    searchPlaceholder: "Busca tu dirección…",
    searching: "Buscando ubicaciones…",
    noLocations: "No se encontraron ubicaciones.",
    minCharsHint: "Escribe al menos 3 caracteres para buscar.",
    saving: "Guardando dirección…",
  },
  userCategories: {
    title: "Categorías",
    visibilityHint:
      "Elegir pocas categorías (se recomiendan 1–3) mejora tu visibilidad.",
  },
  artists: {
    shareProfile: "Compartir perfil",
    breadcrumb: {
      goBack: "Volver",
    },
    header: {
      atelier: "Atelier",
      contact: "Contacto",
      menu: "Menú",
      nav: {
        portfolios: "Portafolios",
        collections: "Colecciones",
        services: "Servicios",
        about: "Acerca de",
      },
    },
    contactDialog: {
      contactButton: "Contacto",
      contactTitle: "Contactar a {name}",
      contactTitleFallback: "Contacto",
      description: "Envía un mensaje directamente a este artista.",
      selfContact: "No puedes contactarte a ti mismo.",
      form: {
        nameLabel: "Nombre",
        namePlaceholder: "Tu nombre",
        emailLabel: "Correo electrónico",
        emailPlaceholder: "tu@correo.com",
        subjectLabel: "Asunto",
        subjectPlaceholder: "Consulta por encargo",
        messageLabel: "Mensaje",
        messagePlaceholder: "Cuéntale al artista sobre tu proyecto...",
        submit: "Enviar mensaje",
      },
      successToast: "Mensaje enviado con éxito.",
    },
    sections: {
      portfolios: "Portafolios",
      collections: "Colecciones",
      services: "Servicios",
      viewAll: "Ver todo",
      viewAllPortfolios: "Ver todos los portafolios",
      viewAllCollections: "Ver todas las colecciones",
      viewAllServices: "Ver todos los servicios",
      emptyState: {
        title: "{name} aún no ha publicado ningún trabajo.",
        subtitle:
          "Vuelve pronto o ponte en contacto para iniciar una conversación.",
        cta: "Ponte en contacto",
      },
    },
    notFound: {
      heading: "Artista no encontrado",
      description:
        "El perfil que buscas no existe o pudo haber sido eliminado.",
      backHome: "Volver al inicio",
    },
    resourceNotFound: {
      heading: "Recurso no encontrado",
      backToProfile: "Volver al perfil",
      portfolio:
        "El portafolio que buscas no existe o pudo haber sido eliminado.",
      collection:
        "La colección que buscas no existe o pudo haber sido eliminada.",
      service: "El servicio que buscas no existe o pudo haber sido eliminado.",
      media: "El contenido que buscas no existe o pudo haber sido eliminado.",
    },
    profile: {
      getInTouch: "Ponte en contacto",
      aboutHeading: "Acerca de {name}",
      connect: "Conectar",
      phoneLabel: "Llamar a {name}",
      websiteLabel: "Visitar el sitio web de {name}",
      instagramLabel: "{name} en Instagram",
      facebookLabel: "{name} en Facebook",
      youtubeLabel: "{name} en YouTube",
      summaryProfessionLocation:
        "{name}, {profession} con base en {location}, muestra sus portafolios, colecciones y servicios en A11STUDIO.",
      summaryProfession:
        "{name}, {profession}, muestra sus portafolios, colecciones y servicios en A11STUDIO.",
      summaryLocation:
        "{name}, con base en {location}, muestra sus portafolios, colecciones y servicios en A11STUDIO.",
      summaryFallback:
        "{name} muestra sus portafolios, colecciones y servicios en A11STUDIO.",
      metaIncomplete:
        "Este perfil de artista aún se está configurando en A11STUDIO.",
    },
    editAria: {
      editPortfolio: "Editar portafolio",
      editCollection: "Editar colección",
      editService: "Editar servicio",
      editMedia: "Editar contenido",
      editAboutPage: "Editar página Acerca de",
    },
    portfolios: {
      pageTitle: "Portafolios",
      metaDescription:
        "Explora los portafolios de {name} en A11STUDIO: colecciones seleccionadas de sus mejores trabajos.",
      empty: "Aún no hay portafolios.",
      galleryEmpty: "Este portafolio está vacío por ahora.",
    },
    collections: {
      pageTitle: "Colecciones",
      metaDescription:
        "Explora las colecciones de {name} en A11STUDIO: conjuntos seleccionados de su trabajo.",
      empty: "Aún no hay colecciones.",
      galleryEmpty: "Esta colección está vacía por ahora.",
    },
    services: {
      pageTitle: "Servicios",
      metaDescription:
        "Descubre los servicios que ofrece {name} en A11STUDIO y ponte en contacto para colaborar.",
      empty: "Aún no hay servicios.",
      whatsIncluded: "Qué incluye",
      terms: "Términos",
      relatedPortfolio: "Portafolio relacionado",
    },
    about: {
      pageTitle: "Sobre mí",
      metaDescription:
        "Conoce mejor a {name} en A11STUDIO — su historia, su trayectoria y cómo ponerte en contacto.",
      notShared: "Este artista aún no ha compartido su historia.",
      heading: "Acerca de",
      getInTouch: "Ponte en contacto",
    },
    media: {
      altFallback: "Obra de {name} en A11STUDIO",
      untitled: "Sin título",
      editAria: "Editar contenido",
    },
    fullscreen: {
      enter: "Ver en pantalla completa",
      exit: "Salir de pantalla completa",
    },
    gallery: {
      altFallback: "Obra en A11STUDIO",
      open: "Abrir",
      openAria: "Abrir la página completa de la obra",
      share: "Compartir",
      shared: "Compartido",
      copied: "Copiado",
      shareAria: "Compartir esta obra",
    },
  },
  validation: {
    required: "{field} es obligatorio",
    invalid: "{field} no es válido",
    tooLong: "{field} es demasiado largo",
    minLength: "{field} debe tener al menos {min} caracteres",
    maxLength: "{field} debe tener como máximo {max} caracteres",
    email: {
      invalid: "Correo electrónico no válido",
    },
    avatarUrlInvalid: "URL de avatar no válida",
    fallbackUrlInvalid: "URL de respaldo no válida",
    thumbnailRequired: "La miniatura es obligatoria",
    maxCategories: "Los portafolios pueden tener hasta {max} categorías",
    maxPortfolioItems: "Los portafolios pueden tener hasta {max} elementos",
    minCollectionMedia: "Se requiere al menos un elemento multimedia",
    maxCollectionMedia: "Las colecciones pueden tener hasta {max} archivos",
    file: {
      tooLarge: "{field} debe pesar menos de {mb}MB",
      invalidType: "{field} debe ser una imagen (JPEG, PNG o WebP)",
    },
    aboutPage: {
      titleType: "El título debe ser una cadena de texto válida",
      titleMin: "El título debe tener al menos 5 caracteres",
      titleMax: "El título debe tener menos de 255 caracteres",
      descriptionRequired:
        "La descripción es obligatoria y debe ser una cadena de texto válida",
      descriptionType: "La descripción debe ser una cadena de texto válida",
      descriptionMin: "La descripción debe tener al menos 20 caracteres",
      descriptionMax: "La descripción debe tener menos de 1000 caracteres",
      userIdRequired:
        "El ID de usuario es obligatorio y debe ser un número válido",
      userIdPositive: "El ID de usuario debe ser un número positivo",
    },
    auth: {
      invalidEmail: "Correo electrónico no válido",
      invalidPassword: "Contraseña no válida",
      invalidUsername: "Nombre de usuario no válido",
      usernameAllowedChars:
        "El nombre de usuario solo puede contener letras, números, guiones bajos y guiones",
      invalidCode: "Código no válido",
      codeLength: "El código debe tener {length} dígitos",
      invalidFallbackUrl: "URL de respaldo no válida",
    },
    subscription: {
      urlMustBeAppOrigin: "La URL debe pertenecer al dominio de la app",
    },
    service: {
      featureTitleRequired: "El título de la característica es obligatorio",
      termTitleRequired: "El título del término es obligatorio",
    },
    emailPreference: {
      tokenRequired: "Falta el token",
    },
    user: {
      usernameAlphanumeric:
        "El nombre de usuario debe ser alfanumérico y sin espacios",
      passwordMustContainNumber:
        "La contraseña debe contener al menos un número",
      passwordNoSpaces: "La contraseña no puede contener espacios",
    },
    phone: {
      invalid:
        "Introduce un teléfono válido, p. ej. +34684317619 o 684317619 (9–15 dígitos).",
    },
    url: {
      instagram:
        "Introduce un usuario de Instagram o una URL oficial, p. ej. tuusuario o https://instagram.com/tuusuario",
      facebook:
        "Introduce un usuario/página de Facebook o una URL oficial, p. ej. tupagina o https://facebook.com/tupagina",
      youtube:
        "Introduce un identificador de YouTube o una URL oficial, p. ej. tucanal o https://youtube.com/@tucanal",
      website: "Introduce una URL válida que empiece por https://",
    },
  },
  fields: {
    title: "Título",
    name: "Nombre",
    surname: "Apellido",
    subject: "Asunto",
    message: "Mensaje",
    artistId: "ID del artista",
    username: "Nombre de usuario",
    password: "Contraseña",
    profession: "Profesión",
    biography: "Biografía",
    shortBiography: "Biografía breve",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    thumbnail: "Miniatura",
    avatar: "Avatar",
    banner: "Banner",
    photo: "Foto",
    file: "Archivo",
    userId: "ID de usuario",
    mediaId: "ID de archivo",
    phoneNumber: "Teléfono",
    instagramLink: "Enlace de Instagram",
    facebookLink: "Enlace de Facebook",
    youtubeLink: "Enlace de YouTube",
    websiteLink: "Enlace del sitio web",
  },
  portfolios: {
    toastCreated: "Portafolio creado con éxito",
    toastUpdated: "Portafolio actualizado con éxito",
  },
  atelier: {
    common: {
      viewPublicPage: "Ver página pública",
      cancel: "Cancelar",
      save: "Guardar",
      update: "Actualizar",
      create: "Crear",
      close: "Cerrar",
      add: "Añadir",
      loading: "Cargando...",
      loadMore: "Cargar más",
      blocked: "Bloqueado",
      editingCollection: "Editando colección",
      creatingCollection: "Creando colección",
      editingPortfolio: "Editando portafolio",
      creatingPortfolio: "Creando portafolio",
      editingService: "Editando servicio",
      creatingService: "Creando servicio",
      planLimitReached: "Límite del plan alcanzado",
      planLimitDescription:
        "Has usado <strong>{count}</strong> de <strong>{limit}</strong> {label} permitidos en tu plan actual. Actualiza tu plan para crear más, o gestiona tus {label} existentes.",
      goBack: "Volver",
      upgradePlan: "Mejorar plan",
      planLimitToast:
        "Has alcanzado el límite de tu plan para {label} ({count}/{limit}). Mejora tu plan para crear más.",
      logout: "Cerrar sesión",
      logoutConfirmTitle: "Cerrar sesión",
      logoutConfirmDescription:
        "¿Seguro que quieres cerrar sesión? Tendrás que iniciar sesión de nuevo para acceder a tu cuenta.",
      completeProfileTitle: "Completa tu perfil",
      completeProfileDescription:
        "Ya casi está. Completa la configuración de tu perfil para desbloquear todas las funciones y tener la mejor experiencia.",
      continueSettingUp: "Continuar configuración",
      skipForNow: "Omitir por ahora",
      setupGuide: {
        title: "Guía de configuración",
        progress: "{percent}% completado",
        shrink: "Minimizar guía de configuración",
        expand: "Expandir guía de configuración",
        close: "Cerrar guía de configuración",
        steps: {
          fullName: "Añade tu nombre y apellido",
          profession: "Añade tu profesión",
          avatar: "Sube un avatar",
          location: "Añade tu dirección",
          categories: "Añade una categoría",
          portfolio: "Crea tu primer portafolio",
          aboutPage: "Configura tu página sobre mí",
        },
      },
      metrics: {
        noDataAvailable: "No hay datos disponibles",
        media: "Contenido",
        storage: "Almacenamiento",
        clients: "Clientes",
        portfolios: "Portafolios",
        collections: "Colecciones",
        projects: "Proyectos",
        services: "Servicios",
        aiCredits: "Créditos de IA",
        planSuffix: "Plan",
      },
      submit: {
        updateCollectionTitle: "Actualizar colección",
        saveCollectionTitle: "Guardar colección",
        updateCollectionDescription:
          "Tus cambios se guardarán y se aplicarán a tu colección en vivo.",
        createCollectionDescription:
          "Tu colección se creará y se guardará en tu cuenta.",
        updatePortfolioTitle: "Actualizar portafolio",
        savePortfolioTitle: "Guardar portafolio",
        updatePortfolioDescription:
          "Tus cambios se guardarán y se aplicarán a tu portafolio en vivo.",
        createPortfolioDescription:
          "Tu portafolio se creará y se guardará en tu cuenta.",
        updateServiceLabel: "Actualizar servicio",
        createServiceLabel: "Crear servicio",
        updateServiceTitle: "Actualizar servicio",
        createServiceTitle: "Crear servicio",
        updateServiceDescription:
          "Tus cambios se guardarán y se aplicarán a tu servicio en vivo.",
        createServiceDescription:
          "Tu servicio se creará y se guardará en tu cuenta.",
      },
    },
    portfolios: {
      pageTitle: "Portafolios",
      pageInfo:
        "Los portafolios representan categorías amplias de tu trabajo, como 'Fotografía de viajes' o 'Fotografía de bodas'. Están diseñados para mostrar tus mejores piezas a los clientes y pueden incluir tanto contenido individual como colecciones.",
      createButtonLabel: "Crear portafolio",
      emptyStateDescription:
        "Aún no has creado portafolios. Empieza agrupando tu trabajo.",
      loadError: "Algo salió mal",
      createTitle: "Crear un portafolio",
      editTitlePrefix: "Editar: {title}",
      blockedBadge: "Bloqueado",
      deletePortfolio: {
        ariaLabel: "Eliminar portafolio",
        title: "Eliminar portafolio",
        description:
          "<strong>{title}</strong> se eliminará permanentemente. Esta acción no se puede deshacer.",
        cancel: "Cancelar",
        delete: "Eliminar",
        successToast: "Portafolio eliminado",
      },
      form: {
        blockedNotice:
          "Este portafolio ha sido bloqueado. Puedes revisarlo aquí, pero no se puede editar hasta que se levante el bloqueo.",
        back: "Atrás",
        next: "Siguiente",
        stepOf: "Paso {current} de {total}",
        thumbnailHint:
          "Añade una imagen de miniatura para tu portafolio (obligatorio)",
        thumbnailAlt: "Vista previa de la miniatura",
        titleLabel: "Título",
        titlePlaceholder: "Mi portafolio",
        titleInfo:
          "Tu título se convierte en la dirección web de este portafolio. Elige algo claro y específico: puedes cambiarle el nombre más adelante, pero la dirección seguirá siendo la misma.",
        titleAddressHint:
          "Elige con cuidado: tu título se convierte en el enlace que la gente usará para encontrar este portafolio, y ese enlace no cambiará si luego lo renombras.",
        permalinkLabel: "Enlace:",
        permalinkFrozenNote:
          "se definió al crear este portafolio y no cambia aunque modifiques el título",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Describe tu portafolio...",
        categoriesLabel: "Categorías",
        categoriesCountHint:
          "{count} / {max} categorías · Opcional. Selecciona categorías que describan este portafolio.",
        categoriesVisibilityHint:
          "Elegir pocas categorías (se recomiendan 1–3) mejora tu visibilidad.",
        disciplinesLabel: "Disciplinas",
        artStylesLabel: "Estilos artísticos",
        disciplinesCountHint: "{count} / {max} disciplinas",
        artStylesCountHint: "{count} / {max} estilos artísticos",
        showOnProfile: "Mostrar en la página de perfil",
        showOnProfileInfo:
          "Cuando está activado, este portafolio se destaca en tu perfil público de artista para que los visitantes lo encuentren más fácilmente. Puedes destacar hasta {limit} portafolios en tu página de perfil.",
        highlightLimitReached:
          "Has alcanzado el límite de {limit} portafolios destacados en tu página de perfil.",
        active: "Activo",
        activeInfo:
          "Cuando está desactivado, este portafolio se oculta de tu perfil público de artista y de los listados. Aún puedes editarlo en Atelier.",
      },
      items: {
        noItems: "Aún no se han añadido contenidos ni colecciones",
        itemsCountLabel: "{count} / {limit} elementos",
        dragToReorder: "· Arrastra para reordenar",
        countInfo:
          "Este conteo incluye cada contenido que añadas directamente, más cada elemento dentro de cualquier colección que añadas. Por ejemplo, una colección con 10 imágenes cuenta como 10 elementos del límite de {limit}.",
        removeItem: "Eliminar {label}",
        untitled: "Sin título",
      },
      layout: {
        label: "Diseño",
        info: "El diseño se adapta al tamaño de pantalla del visitante.",
        columnsInfo:
          "Para el diseño en columnas, el número que elijas es el máximo usado en pantallas grandes. Los dispositivos más pequeños muestran menos columnas — hasta {mobile} en móvil y {tablet} en tablet — así que, aunque elijas {max} columnas, en un teléfono solo se mostrarán {mobile}.",
        ariaGroup: "Diseño del portafolio",
        previewAria: "Previsualizar diseño",
        editSettingsAria: "Editar ajustes de diseño",
        previewTitle: "Vista previa del diseño",
        previewDescription:
          "Una vista previa de tus elementos seleccionados usando el diseño {layoutName}. El resultado se adapta al tamaño de pantalla del visitante.",
        previewEmpty: "Añade elementos para previsualizar el diseño.",
        settingsTitle: "Ajustes de diseño",
        settingsDescription:
          "Elige cuántas columnas mostrar en pantallas grandes. Los dispositivos más pequeños usan menos automáticamente.",
        columns: "Columnas",
        selectedFallback: "seleccionado",
      },
    },
    services: {
      pageTitle: "Servicios",
      pageInfo:
        "Los servicios son las ofertas que brindas a tus clientes, como 'Fotografía de bodas' o 'Diseño web'.",
      createButtonLabel: "Crear servicio",
      emptyStateDescription:
        "Aún no has creado servicios. Empieza añadiendo lo que ofreces a tus clientes.",
      loadError: "Algo salió mal",
      createTitle: "Crear un servicio",
      editTitlePrefix: "Editar: {title}",
      toastCreated: "Servicio creado con éxito",
      toastUpdated: "Servicio actualizado con éxito",
      form: {
        blockedNotice:
          "Este servicio ha sido bloqueado. Puedes revisarlo aquí, pero no se puede editar hasta que se levante el bloqueo.",
        titleLabel: "Título",
        titlePlaceholder: "Fotografía de retrato",
        titleInfo:
          "Tu título se convierte en la dirección web de este servicio. Elige algo claro y específico: puedes cambiarle el nombre más adelante, pero la dirección seguirá siendo la misma.",
        titleAddressHint:
          "Elige con cuidado: tu título se convierte en el enlace que la gente usará para encontrar este servicio, y ese enlace no cambiará si luego lo renombras.",
        permalinkLabel: "Enlace:",
        permalinkFrozenNote:
          "se definió al crear este servicio y no cambia aunque modifiques el título",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Describe tu servicio...",
        priceLabel: "Precio",
        priceInfo: "El precio es opcional; déjalo en 0.",
        showPrice: "Mostrar precio",
        active: "Activo",
        showOnProfile: "Mostrar en la página de perfil",
        showOnProfileInfo:
          "Cuando está activado, este servicio se destaca en tu perfil público de artista para que los visitantes lo encuentren más fácilmente. Puedes destacar hasta {limit} servicios en tu página de perfil.",
        highlightLimitReached:
          "Has alcanzado el límite de {limit} servicios destacados en tu página de perfil.",
        thumbnailLabel: "Miniatura",
        thumbnailAlt: "Vista previa de la miniatura",
        featuresLabel: "Qué incluye",
        featuresPlaceholder: "ej. sesión de 2 horas",
        termsLabel: "Términos",
        termsPlaceholder: "ej. depósito del 50% requerido",
        portfolioLinkLabel: "Vincular a un portafolio (opcional)",
        portfolioSelectPlaceholder: "Selecciona un portafolio...",
        portfolioLinkInfo:
          "Vincula un portafolio para que los clientes vean fotos relacionadas con este servicio.",
      },
    },
    collections: {
      pageTitle: "Colecciones",
      pageInfo:
        "Las colecciones son conjuntos simples de contenido relacionado, agrupados por un evento o tema específico, como 'La boda de Juan' o 'Marruecos 2026'.",
      createButtonLabel: "Crear colección",
      emptyStateDescription:
        "Aún no has creado colecciones. Empieza añadiendo un conjunto de contenido relacionado.",
      loadError: "Algo salió mal",
      createTitle: "Crear una colección",
      editTitlePrefix: "Editar: {title}",
      toastCreated: "Colección creada con éxito",
      toastUpdated: "Colección actualizada con éxito",
      drawer: {
        addCollection: "Añadir colección",
        title: "Añadir colección",
        refreshAria: "Actualizar colecciones",
        hint: "Haz clic para añadir a tu portafolio · {count} disponibles",
        alreadyAdded: "Ya añadida",
        addToPortfolio: "Añadir al portafolio",
        itemCount: "{count, plural, one {# elemento} other {# elementos}}",
        emptyTitle: "Aún no hay colecciones",
        emptySubtitle: "Crea tu primera colección para empezar",
        itemsSelected:
          "{count, plural, one {# elemento seleccionado} other {# elementos seleccionados}}",
      },
      deleteCollection: {
        ariaLabel: "Eliminar colección",
        title: "Eliminar colección",
        description:
          "<strong>{title}</strong> se eliminará permanentemente. Esta acción no se puede deshacer.",
        cancel: "Cancelar",
        delete: "Eliminar",
        successToast: "Colección eliminada",
      },
      form: {
        blockedNotice:
          "Esta colección ha sido bloqueada. Puedes revisarla aquí, pero no se puede editar hasta que se levante el bloqueo.",
        titleLabel: "Título",
        titlePlaceholder: "Mi colección",
        titleInfo:
          "Tu título se convierte en la dirección web de esta colección. Elige algo claro y específico: puedes cambiarle el nombre más adelante, pero la dirección seguirá siendo la misma.",
        titleAddressHint:
          "Elige con cuidado: tu título se convierte en el enlace que la gente usará para encontrar esta colección, y ese enlace no cambiará si luego la renombras.",
        permalinkLabel: "Enlace:",
        permalinkFrozenNote:
          "se definió al crear esta colección y no cambia aunque modifiques el título",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Describe tu colección...",
        showOnProfile: "Mostrar en la página de perfil",
        showOnProfileInfo:
          "Cuando está activado, esta colección se destaca en tu perfil público de artista para que los visitantes la encuentren más fácilmente. Puedes destacar hasta {limit} colecciones en tu página de perfil.",
        highlightLimitReached:
          "Has alcanzado el límite de {limit} colecciones destacadas en tu página de perfil.",
        active: "Activo",
        activeInfo:
          "Cuando está desactivado, esta colección se oculta de tu perfil público de artista y de los listados. Aún puedes editarla en Atelier.",
      },
      media: {
        sectionLabel: "Contenido",
        dragToReorder: "· Arrastra para reordenar",
        countInfo:
          "Cada elemento multimedia que añadas a esta colección cuenta para este límite. Puedes incluir hasta {limit} elementos en total.",
        countLabel: "{count} / {limit} contenidos",
        noMedia: "Aún no se ha añadido contenido",
        removeMedia: "Eliminar {label}",
        mediaFallback: "contenido",
        untitled: "Sin título",
      },
    },
    media: {
      pageTitle: "Contenido",
      tabs: {
        overallInfo: "Información general",
        seo: "SEO",
      },
      upload: {
        maxFilesError:
          "Se permite un máximo de {max} archivos. Puedes añadir {remaining} más.",
        globalCompression: "Compresión global",
        compressionTooltipTitle: "Nivel de compresión",
        compressionTooltipBody:
          "Controla el equilibrio entre la calidad de imagen y el tamaño de archivo. Una compresión menor (VERY_LOW, LOW) conserva más detalle pero genera archivos más grandes. Una compresión mayor (HIGH, VERY_HIGH) reduce el tamaño pero puede reducir ligeramente la calidad.",
        compressionTooltipHint:
          "Este ajuste se aplica a todos los archivos subidos. Puedes ajustar archivos individuales con los controles de abajo.",
        allFiles: "Todos los archivos",
        upgradeRequired: "Mejora tu plan para acceder a esta función.",
        aiSeoGeneration: "Generar metadatos",
        aiSeoBadge: "Metadatos IA",
        aiSeoTooltipBody:
          "El SEO (optimización para motores de búsqueda) ayuda a que tu trabajo se encuentre en Google y Google Imágenes. Usamos IA para analizar la imagen y generar un título, una descripción, un texto alternativo y un nombre de archivo artísticos y ricos en palabras clave, y para etiquetarla automáticamente con las categorías correspondientes.",
        aiSeoCreditsHint:
          "Cuesta 1 crédito de IA por imagen. <remaining>Te quedan {count} {count, plural, one {crédito} other {créditos}}.</remaining>",
        creditsLabel: "{count} {count, plural, one {crédito} other {créditos}}",
        creditsUsageSummary:
          "{used} {used, plural, one {crédito} other {créditos}} usados · quedan {remaining}",
        noCreditsTitle: "Sin créditos de IA:",
        noCreditsBody:
          "Has usado todos tus créditos de IA. Mejora tu plan o espera al próximo reinicio.",
        filesCount: "{count}/{max} archivos",
        maxReached: "Límite alcanzado",
        compressionLabel: "Compresión",
        upgradeToAdjust: "Mejora tu plan para ajustar",
        previewAlt: "Vista previa {index}",
        createNewMedia: "Crear nuevo contenido",
        uploadUpToImages: "Sube hasta {max} imágenes (JPEG, PNG, WebP)",
        uploadButton: "Subir",
        close: "Cerrar",
        createMedia: "Crear contenido",
        addMedia: "Añadir contenido",
        storageFullTitle: "Almacenamiento lleno: {used} / {limit} GB usados",
        uploadInProgress: "Subida en curso...",
      },
      card: {
        deleteFailed: "No se pudo eliminar el contenido",
        titleLabel: "Título",
        titlePlaceholder: "Introduce el título",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Introduce la descripción",
        seoTitleLabel: "Título SEO",
        seoTitlePlaceholder: "Introduce el título SEO",
        seoTitleInfo:
          "El título que aparece en los resultados de búsqueda y en las pestañas del navegador. Mejora la visibilidad en buscadores.",
        seoDescriptionLabel: "Descripción SEO",
        seoDescriptionPlaceholder: "Introduce la descripción SEO",
        seoDescriptionInfo:
          "Un breve resumen que aparece en los resultados de búsqueda. Ayuda a los usuarios a entender de qué trata la imagen antes de hacer clic.",
        altTextLabel: "Texto alternativo",
        altTextPlaceholder: "Introduce el texto alternativo para accesibilidad",
        altTextInfo:
          "Una descripción textual de la imagen para lectores de pantalla y cuando las imágenes no cargan. Mejora la accesibilidad y el SEO.",
        filenameLabel: "Nombre de archivo",
        filenamePlaceholder: "Introduce el nombre de archivo",
        filenameInfo:
          "Nombre de archivo SEO definido automáticamente al subir o al generar metadatos con IA. No se puede editar.",
        lastUpdated: "Última actualización",
        noPreview: "Sin vista previa",
        altFallback: "Contenido de {username}",
        untitled: "Sin título",
        editMedia: "Editar contenido",
        mediaPreview: "Vista previa del contenido",
        generateSeo: "Generar metadatos",
        noCreditsAvailable:
          "No hay créditos de IA disponibles. Necesitas al menos 1 crédito para generar metadatos. Mejora tu plan o espera a que se reinicien los créditos.",
        generateSeoTooltip:
          "El SEO (optimización para motores de búsqueda) ayuda a que tu trabajo se encuentre en Google y Google Imágenes. Usamos IA para analizar la imagen y generar un título, una descripción, un texto alternativo y un nombre de archivo artísticos y ricos en palabras clave, y para etiquetarla automáticamente con las categorías correspondientes.",
        noCreditsSuffix: " (Sin créditos)",
        delete: "Eliminar",
        deleteConfirm: "¿Seguro que quieres eliminar este contenido?",
        cancel: "Cancelar",
        discardTitle: "¿Descartar cambios?",
        discardBody:
          "¿Seguro que quieres cancelar? Se perderán todos los cambios sin guardar.",
        keepEditing: "Seguir editando",
        discardChanges: "Descartar cambios",
        saveChanges: "Guardar cambios",
        edit: "Editar",
        close: "Cerrar",
      },
      grid: {
        generateSeoCount: "Generar metadatos ({count})",
        generateSeoTitle: "Generar metadatos con IA",
        generateSeoDescription:
          "¿Generar metadatos con IA para {count} {count, plural, one {contenido seleccionado} other {contenidos seleccionados}}?",
        creditsAvailable: "Créditos disponibles:",
        creditsNeeded: "Créditos necesarios:",
        overAiLimit:
          "Límite: selecciona hasta {max} elementos (quita {excess}).",
        insufficientCredits:
          "Créditos insuficientes. Necesitas {needed} créditos más.",
        cancel: "Cancelar",
        selectMedia: "Seleccionar contenido",
        cancelSelection: "Cancelar selección",
        noMediaFiltered:
          "No se encontró contenido. Prueba otra combinación de filtros.",
        noMediaEmpty:
          "Aún no has subido contenido. Empieza añadiendo tu primera imagen.",
        updateItems:
          "Actualizar {count} {count, plural, one {elemento} other {elementos}}",
        confirmUpdatesTitle: "Confirmar actualizaciones",
        confirmUpdatesDescription:
          "¿Seguro que quieres actualizar {count} {count, plural, one {contenido} other {contenidos}}? Esta acción guardará todos los cambios pendientes.",
        updateAll: "Actualizar todo",
      },
      search: {
        placeholder: "Buscar contenido…",
        all: "Todos",
      },
      drawer: {
        addMedia: "Añadir contenido",
        title: "Añadir contenido",
        refreshAria: "Actualizar contenido",
        filterAll: "Todos",
        hint: "Haz clic para añadir a tu portafolio · {count} disponibles",
        hintMax: "· hasta {max} elementos",
        alreadyAdded: "Ya añadido",
        addToPortfolio: "Añadir al portafolio",
        emptyTitle: "Aún no hay contenido",
        emptySubtitle: "Sube tu primera imagen para empezar",
        itemsSelected:
          "{count, plural, one {# elemento seleccionado} other {# elementos seleccionados}}",
        itemsSelectedWithMax:
          "{count} / {max} {count, plural, one {elemento seleccionado} other {elementos seleccionados}}",
      },
      uploadStatus: {
        uploadComplete: "Subida completa",
        uploadingFiles: "Subiendo archivos",
        remaining: "{count} restantes",
        success: "con éxito",
        failed: "con error",
        allComplete: "Todo completo",
        queued: "En cola...",
        uploading: "Subiendo...",
        updating: "Actualizando...",
        generatingSeo: "Generando metadatos...",
        deleting: "Eliminando...",
        uploaded: "Subido",
        updated: "Actualizado",
        seoGenerated: "Metadatos generados",
        deleted: "Eliminado",
        failedFallback: "Fallido",
        preparingUpload: "Preparando subida...",
        previewAlt: "Vista previa",
        noPreview: "Sin vista previa",
        unknownFile: "Archivo desconocido",
      },
    },
    home: {
      pageTitle: "Panel",
    },
    nav: {
      dashboard: "Panel",
      home: "Inicio",
      media: "Contenido",
      collections: "Colecciones",
      portfolios: "Portafolios",
      services: "Servicios",
      about: "Sobre mí",
      settings: "Ajustes",
      closeMenuAria: "Cerrar menú",
    },
    topNav: {
      openMenuAria: "Abrir menú",
      expandSidebarAria: "Expandir barra lateral",
      collapseSidebarAria: "Contraer barra lateral",
      upgrade: "Mejorar plan",
      viewProfile: "Ver perfil",
    },
    about: {
      pageTitle: "Página Sobre mí",
      pageInfo:
        "Comparte tu trayectoria, tu recorrido artístico y todo lo que te gustaría que tu audiencia supiera sobre ti.",
      emptyStateDescription:
        "Aún no has creado una página Sobre mí. Comparte tu trayectoria y tu recorrido artístico.",
      form: {
        createButton: "Crear página Sobre mí",
        editButton: "Editar página Sobre mí",
        createTitle: "Crear página Sobre mí",
        updateTitle: "Actualizar página Sobre mí",
        titleLabel: "Título",
        titlePlaceholder: "La historia detrás del lienzo",
        descriptionLabel: "Descripción",
        descriptionPlaceholder:
          "Comparte tu recorrido como artista. ¿Qué te inspira? ¿Qué impulsa tu visión creativa? Deja que los visitantes conecten con la persona detrás del arte...",
        createSubmit: "Crear",
        updateSubmit: "Actualizar",
        photoPreview: "Vista previa de la foto:",
        photoPreviewAlt: "Vista previa de la foto",
        choosePhotoHint:
          "Elige una foto (preferiblemente tuya) para mostrar en tu página Sobre mí.",
        photoAlt: "Foto de la página Sobre mí",
      },
    },
    settings: {
      pageTitle: "Ajustes",
      account: {
        heading: "Cuenta",
        usernameInfo:
          "Tu nombre de usuario aparece en tu URL pública. Elige algo corto y memorable — no podrás cambiarlo con frecuencia.",
        usernameLabel: "Nombre de usuario",
        emailLabel: "Correo electrónico",
      },
      language: {
        heading: "Idioma",
        description: "Elige el idioma de tu panel",
      },
      security: {
        heading: "Seguridad",
        passwordLabel: "Contraseña",
        passwordDescription: "Actualiza la contraseña de tu cuenta",
      },
      subscription: {
        heading: "Suscripción",
        trial: "Prueba",
        freeTrialEnds: "La prueba gratuita termina el {date}",
        renews: "Se renueva el {date}",
        cancels: "Se cancela el {date}",
        onFreePlan: "Estás en el plan gratuito",
        upgrade: "Mejorar plan",
        change: "Cambiar",
        freePlanName: "Gratis",
      },
      changePlan: {
        pageTitle: "Cambiar plan",
        backToSettings: "Volver a Ajustes",
        alreadyOnBest: "Ya tienes el plan más completo.",
        currentPlanIs:
          "Tu plan actual es <strong>{planName}</strong> — no hay ningún plan superior al que cambiar por ahora.",
        currentPlanFallback: "tu plan actual",
        goBackToSettings: "Volver a Ajustes",
        cancel: "Cancelar",
      },
      changePassword: {
        triggerLabel: "Cambiar contraseña",
        title: "Cambiar contraseña",
        description: "Introduce tu contraseña actual y elige una nueva.",
        monthlyLimitReached: "Límite mensual alcanzado",
        usedAllChanges:
          "Has usado los {max} cambios de contraseña permitidos para este periodo.",
        availableAgainOn: "Disponible de nuevo el <strong>{date}</strong>.",
        currentPasswordLabel: "Contraseña actual",
        newPasswordLabel: "Nueva contraseña",
        newPasswordInfo: "8–20 caracteres, al menos un número, sin espacios",
        remainingChanges:
          "{remaining} de {max} {remaining, plural, one {cambio} other {cambios}} restantes este mes",
        resetsOn: " · se reinicia el {date}",
        submit: "Actualizar contraseña",
        successToast: "Contraseña actualizada con éxito.",
      },
      changeUsername: {
        title: "Cambiar nombre de usuario",
        description: "Elige un nuevo nombre de usuario para tu cuenta.",
        monthlyLimitReached: "Límite mensual alcanzado",
        usedAllChanges:
          "Has usado los {max} cambios de nombre de usuario permitidos para este periodo.",
        availableAgainOn: "Disponible de nuevo el <strong>{date}</strong>.",
        newUsernameLabel: "Nuevo nombre de usuario",
        newUsernameInfo: "3–20 caracteres, solo letras y números",
        remainingChanges:
          "{remaining} de {max} {remaining, plural, one {cambio} other {cambios}} restantes este mes",
        resetsOn: " · se reinicia el {date}",
        submit: "Actualizar nombre de usuario",
        successToast: "Nombre de usuario actualizado con éxito.",
      },
    },
  },
  actions: {
    unauthorized: "No autorizado",
    titleAlreadyExists: "Ya tienes uno con este título. Prueba con otro.",
    genericError: "Algo salió mal. Inténtalo de nuevo más tarde.",
    formDataRequired: "Se requieren los datos del formulario",
    passwordRecoveryCooldown:
      "Debes esperar 1 minuto y 30 segundos antes de volver a intentarlo",
    noFieldsToUpdate: "No hay campos para actualizar",
    invalidMediaId: "ID de archivo no válido",
    unexpectedError: "Ocurrió un error inesperado",
    userIdAndMediaIdRequired: "Se requieren user_id y media_id",
  },
} satisfies Messages;

export default messages;
