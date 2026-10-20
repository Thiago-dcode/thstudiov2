import type { Messages } from "./en";

const messages = {
  seo: {
    founderRole: "Fundador — fotógrafo, cineasta e ingeniero de software",
    homePageName: "A11STUDIO — Descubre y contrata artistas",
    organizationDescription:
      "A11STUDIO es la plataforma de portafolios donde los artistas son descubiertos: muestra tu trabajo y conecta con clientes, coleccionistas y colaboradores.",
    defaultTitle: "A11STUDIO — Donde los artistas son descubiertos",
    defaultDescription:
      "Muestra tu trabajo, hazte descubrir y conecta con clientes, coleccionistas y colaboradores. A11STUDIO es la plataforma de portafolios diseñada exclusivamente para artistas.",
  },
  landing: {
    metadata: {
      title: "A11STUDIO — Descubre y contrata artistas | Portafolios",
      description:
        "Encuentra y contrata fotógrafos, ilustradores y cineastas, o crea tu portafolio profesional: tú subes tu arte, nosotros nos encargamos de la parte técnica.",
    },
    hero: {
      srTitle: "A11STUDIO — deja que tu arte sea descubierto.",
      definition:
        "A11STUDIO es donde fotógrafos, ilustradores, cineastas y diseñadores muestran su trabajo, y donde los clientes vienen a encontrarlos y contratarlos.",
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
      subtitle:
        "Para artistas que no quieren ser influencers. Trae tu arte, del resto nos encargamos nosotros.",
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
        dialog: {
          title: "El registro está cerrado por ahora",
          description:
            "A11STUDIO está en acceso anticipado y las plazas son limitadas. Únete a la lista de espera y te enviaremos una invitación personal en cuanto se abra tu plaza. Es gratis y solo toma unos segundos.",
          stepsTitle: "Qué pasa después",
          steps: [
            {
              title: "Introduce tu correo.",
              description: "Te enviamos un mensaje de confirmación enseguida.",
            },
            {
              title: "Confirma tu correo.",
              description:
                "Haz clic en el enlace de ese mensaje. Tu lugar en la fila solo se reserva después de confirmar.",
            },
            {
              title: "Recibe tu invitación.",
              description:
                "Cuando sea tu turno, te enviamos por correo un enlace personal para crear tu cuenta. Cuanto antes confirmes, mejores serán tus beneficios de acceso anticipado.",
            },
          ],
          learnMore: "Lee las preguntas frecuentes de la lista de espera",
        },
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
            "Se acabó el {agotamiento} por el algoritmo. Sin feeds, sin juegos, sin perseguir el engagement.",
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
            "Toda tu energía va a tu {arte}, no a las redes sociales.",
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
      title: "Sé <strike>influencer</strike> artista.",
      description:
        "Se acabó el agotamiento por el algoritmo. Tu energía es para tu arte, no para las redes sociales — A11STUDIO se encarga del SEO y el posicionamiento para que encuentren tu trabajo.",
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
  forDiscipline: {
    photographers: {
      metadata: {
        title: "Portafolio online para fotógrafos, gratis",
        description:
          "Crea gratis tu portafolio de fotografía profesional. Organiza tu trabajo por especialidad, entrega cada sesión en colecciones y recibe clientes directamente.",
      },
      hero: {
        label: "Para fotógrafos",
        title: "Un portafolio online para fotógrafos que te consigue clientes",
        lead: "Muestra tu mejor trabajo por especialidad, organiza cada sesión y deja que los clientes te escriban directamente. A11STUDIO redacta por ti los textos para buscadores, para que tus fotos se puedan encontrar en Google.",
        seeExamples: "Ver portafolios reales",
      },
      examples: {
        badge: "Ejemplos",
        title: "Ejemplos de portafolios de fotografía",
        description:
          "Portafolios reales creados por fotógrafos en A11STUDIO. El tuyo se verá y funcionará igual.",
        viewAll: "Ver todos los portafolios",
      },
      specialties: {
        badge: "Especialidades",
        title: "Un portafolio para cada tipo de fotografía",
        description:
          "Los clientes contratan a especialistas. Crea un portafolio para cada tipo de trabajo por el que quieras que te contraten.",
        items: [
          { slug: "portrait-photography", label: "Retrato" },
          { slug: "wedding-event-photography", label: "Bodas" },
          { slug: "fashion-editorial-photography", label: "Moda y editorial" },
          {
            slug: "product-commercial-photography",
            label: "Producto y publicidad",
          },
          { slug: "aerial-drone-photography", label: "Aérea y dron" },
          {
            slug: "documentary-street-photography",
            label: "Documental y calle",
          },
          {
            slug: "architecture-real-estate-photography",
            label: "Arquitectura e inmobiliaria",
          },
          {
            slug: "landscape-nature-photography",
            label: "Paisaje y naturaleza",
          },
          { slug: "pet-photography", label: "Mascotas" },
          { slug: "event-photography", label: "Eventos" },
          { slug: "automotive-photography", label: "Automoción" },
        ],
      },
      features: {
        badge: "Por qué A11STUDIO",
        title: "Pensado para cómo trabaja un fotógrafo",
        description:
          "Todo lo que necesitas para que te encuentren y te contraten, sin tener que crear una web.",
        items: [
          {
            title: "Portafolios por especialidad",
            description:
              "Reúne tus mejores imágenes en una selección para cada tipo de trabajo —bodas, retratos, producto— y los clientes verán exactamente lo que haces.",
          },
          {
            title: "Colecciones para cada sesión",
            description:
              "Agrupa las fotos de una sesión, un cliente o un viaje en una colección, separada de tus portafolios.",
          },
          {
            title: "Servicios que se pueden contratar",
            description:
              "Indica qué ofreces, qué incluye y, si quieres, el precio: lo que un cliente necesita saber antes de escribirte.",
          },
          {
            title: "Contacto directo, sin intermediarios",
            description:
              "Los clientes te escriben directamente desde tu página. Sin plataformas de por medio.",
          },
          {
            title: "Preparado para buscadores",
            description:
              "La IA escribe títulos, descripciones, etiquetas y textos alternativos para tus fotos, y tus páginas públicas quedan a disposición de los buscadores.",
          },
          {
            title: "Te encuentran donde trabajas",
            description:
              "Añade tu ciudad para que quien busque un fotógrafo cerca pueda encontrarte.",
          },
        ],
      },
      guide: {
        badge: "Guía",
        title: "Cómo crear un portafolio de fotografía que consiga clientes",
        description: "Cinco pasos que importan más que cualquier plantilla.",
        steps: [
          {
            title: "Una especialidad por portafolio",
            description:
              "Quien busca fotógrafo de bodas quiere ver bodas. Dedica cada portafolio a un solo tipo de trabajo para que se lea como el de un especialista.",
          },
          {
            title: "Selecciona sin piedad",
            description:
              "Muestra entre 15 y 30 de tus mejores imágenes, no todo lo que has disparado. Una foto floja rebaja la impresión de todo el conjunto.",
          },
          {
            title: "Empieza y termina fuerte",
            description:
              "Abre con tu mejor imagen y cierra con otra destacada. Varía encuadres y momentos para que el conjunto cuente una historia.",
          },
          {
            title: "Describe tu trabajo",
            description:
              "Pon a cada foto un título claro con el tema, el lugar y el estilo. Ayuda a los clientes a entenderla y a los buscadores a encontrarla.",
          },
          {
            title: "Ponles fácil contratarte",
            description:
              "Añade tus servicios, tu ciudad y una breve biografía, y pon el enlace a tu portafolio en la bio de Instagram y en tu firma de correo.",
          },
        ],
      },
      freePlan: {
        badge: "Precios",
        title: "Empieza gratis",
        description:
          "El plan gratuito incluye todo lo necesario para publicar un portafolio profesional.",
        portfolios: "Portafolios",
        collections: "Colecciones",
        services: "Servicios",
        storage: "Almacenamiento",
        aiCredits: "Créditos de IA",
        unlimited: "Ilimitado",
        upgradeNote:
          "¿Necesitas más espacio? Los planes de pago añaden más portafolios, almacenamiento y créditos de IA cuando lo necesites.",
      },
      faq: {
        badge: "Preguntas",
        title: "Lo que preguntan los fotógrafos",
        description: "Respuestas cortas antes de empezar.",
        items: [
          {
            question: "¿A11STUDIO es gratis para fotógrafos?",
            answer:
              "Sí. El plan gratuito te permite publicar tu perfil, portafolios, colecciones y servicios sin coste. Los planes de pago solo añaden más espacio y créditos de IA.",
          },
          {
            question: "¿Necesito mi propia web o saber diseño?",
            answer:
              "No. Tu portafolio vive en a11studio.com/artists/tu-usuario y lo creas subiendo y ordenando tus fotos, sin código, hosting ni plantillas.",
          },
          {
            question: "¿En qué se diferencia de publicar en Instagram?",
            answer:
              "Instagram muestra tus últimas publicaciones en un único feed. A11STUDIO ordena tu mejor trabajo por especialidad, añade tus servicios y un formulario de contacto, y hace que cada página se pueda encontrar en Google. Muchos fotógrafos usan los dos: Instagram para publicar y A11STUDIO como enlace en la bio.",
          },
          {
            question: "¿Me encontrarán los clientes en Google?",
            answer:
              "A11STUDIO se encarga de la parte técnica: títulos, descripciones y textos alternativos optimizados, y tus páginas públicas a disposición de los buscadores. Nadie puede garantizar una posición, pero un perfil completo, con tu ciudad y fotos bien descritas, te da la mejor oportunidad.",
          },
          {
            question: "¿En qué idiomas está disponible A11STUDIO?",
            answer: "En inglés, español y portugués.",
          },
        ],
        more: "Más respuestas en las <link>preguntas frecuentes</link>.",
      },
      cta: {
        title: "Tu trabajo merece que lo encuentren",
        description: "Crea hoy tu portafolio de fotografía. Empezar es gratis.",
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
          "Cuando el registro está cerrado, la lista de espera es la forma de obtener acceso anticipado a A11STUDIO. Este es el flujo:<ul><li><strong>Únete con tu correo.</strong> Introduce tu dirección en el formulario de la lista. Te enviaremos un correo de confirmación de inmediato.</li><li><strong>Confirma tu correo.</strong> Abre el mensaje y haz clic en el enlace. Tu lugar solo se reserva después de validar — hasta entonces no bloqueamos una posición para ti.</li><li><strong>Consigue tu lugar en la fila.</strong> Tu posición se asigna al confirmar, en el orden en que las personas validan. Confirma pronto para recibir tu invitación antes.</li><li><strong>Espera tu invitación.</strong> Cuando sea tu turno, te enviamos un enlace personal de registro. Tienes <strong>7 días</strong> para crear tu cuenta antes de que expire la invitación; también enviamos recordatorios antes del plazo.</li><li><strong>Regístrate y canjea.</strong> Usa el enlace para crear tu cuenta. Tu beneficio de la lista (meses gratis en nuestro plan superior) queda listo para canjear después de unirte.</li></ul><p><strong>Condiciones</strong></p><ul><li>Los cupos son limitados. Cuando alcanzamos la capacidad, la lista de espera se cierra.</li><li>La confirmación del correo es obligatoria. Los correos sin confirmar no mantienen una posición.</li><li>Todos los que se registran desde la lista de espera reciben el mismo beneficio: <strong>3 meses gratis</strong>.</li><li>Cada invitación es de un solo uso para el correo de la lista y caduca a los 7 días si no se usa.</li><li>Si ya estás confirmado en la lista, enviar el mismo correo otra vez no crea una entrada nueva — revisa tu bandeja de entrada, o <a href='/support'>contacta con soporte</a> si algo no cuadra.</li></ul>",
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
      title: "Sobre A11STUDIO — Hecho por un artista, para artistas",
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
  formPrivacyNotice: {
    report:
      "Usamos estos datos solo para gestionar tu denuncia y, si dejas un email, comunicarte el resultado. Más información en nuestra <privacy>Política de privacidad</privacy>.",
    register:
      "Usamos tus datos para crear y gestionar tu cuenta y tu portfolio. Tus derechos y cómo tratamos tus datos: <privacy>Política de privacidad</privacy>.",
    acceptTerms:
      "Acepto los <terms>Términos del servicio</terms> y confirmo que tengo al menos 16 años.",
    acceptTermsRequired:
      "Acepta los Términos del servicio para crear tu cuenta.",
    waitList:
      "Solo usamos tu email para gestionar tu plaza en la lista de espera y enviarte tu invitación. Más información en nuestra <privacy>Política de privacidad</privacy>.",
    support:
      "Usamos estos datos solo para responder a tu solicitud. Más información en nuestra <privacy>Política de privacidad</privacy>.",
    artistContact:
      "Tu nombre, email y mensaje se envían a este artista para que pueda responderte. Más información en nuestra <privacy>Política de privacidad</privacy>.",
  },
  report: {
    metadata: {
      title: "Denunciar contenido — A11STUDIO",
      description:
        "Denuncia contenido de A11STUDIO que consideres ilegal o contrario a nuestros Términos del servicio. Revisamos cada aviso y te comunicamos el resultado.",
    },
    label: "Denunciar contenido",
    title: "Denunciar contenido",
    description:
      "Si crees que algo publicado en A11STUDIO es ilegal o incumple nuestros Términos del servicio, cuéntanoslo aquí. Revisamos cada aviso, actuamos cuando está justificado y te enviamos nuestra decisión por email si nos dejas una dirección.",
    emergency:
      "Si alguien está en peligro inmediato, contacta primero con los servicios de emergencia (112).",
    form: {
      urlLabel: "Enlace al contenido",
      reasonLabel: "¿Qué problema tiene?",
      reasonPlaceholder: "Elige un motivo",
      reasons: {
        ILLEGAL_CONTENT: "Contenido ilegal",
        CHILD_SAFETY: "Abuso o explotación sexual infantil",
        INTELLECTUAL_PROPERTY: "Infracción de derechos de autor o de marca",
        HATE_OR_VIOLENCE: "Discurso de odio, amenazas o violencia",
        PRIVACY: "Datos personales o vulneración de la privacidad",
        FRAUD_OR_SCAM: "Fraude o estafa",
        OTHER: "Otro motivo",
      },
      explanationLabel: "¿Por qué es ilegal o incumple las normas?",
      explanationPlaceholder:
        "Explica cuál es el problema y, si puedes, qué ley o derecho vulnera.",
      nameLabel: "Tu nombre (opcional)",
      emailLabel: "Tu email (opcional)",
      emailInfo:
        "Solo lo usamos para confirmarte que hemos recibido la denuncia y comunicarte nuestra decisión.",
      goodFaith:
        "Confirmo que la información de esta denuncia es exacta y completa según mi leal saber y entender, y que denuncio de buena fe.",
      submit: "Enviar denuncia",
      success: {
        title: "Gracias. Hemos recibido tu denuncia.",
        body: "Tu referencia es #{id}. La revisaremos y, si nos has dejado un email, te comunicaremos nuestra decisión.",
      },
      errors: {
        url: "Pega el enlace completo a la página, empezando por https://.",
        reason: "Elige un motivo.",
        explanation: "Explica el problema en al menos 20 caracteres.",
        goodFaith: "Confirma que la denuncia es exacta y de buena fe.",
        notOurSite: "El enlace debe ser de una página de A11STUDIO.",
        tooMany:
          "Demasiadas denuncias en poco tiempo. Espera un minuto y vuelve a intentarlo.",
      },
    },
  },
  cookieConsent: {
    title: "Cookies",
    lead: "Ayúdanos a mejorar A11STUDIO.",
    body: "Si nos das tu permiso, usamos cookies de analítica de terceros (Google Analytics) para contar las visitas de forma agregada y ver qué funciona. Sin publicidad, sin vender datos, y puedes cambiar de opinión cuando quieras.",
    learnMore: "Política de cookies",
    accept: "Aceptar",
    reject: "Rechazar",
  },
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
      report: "Denunciar contenido",
      notice: "Aviso legal",
      privacy: "Política de privacidad",
      terms: "Términos de servicio",
      cookies: "Política de cookies",
      cookieSettings: "Configuración de cookies",
    },
    discover: {
      heading: "Descubrir",
      artists: "Explorar artistas",
      portfolios: "Explorar portafolios",
      forPhotographers: "Para fotógrafos",
    },
    contact: {
      heading: "Contacto",
      about: "Acerca de",
      faqs: "Preguntas frecuentes",
      support: "Soporte",
    },
    home: "Inicio de A11STUDIO",
    social: {
      youtube: "A11STUDIO en YouTube",
      pinterest: "A11STUDIO en Pinterest",
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
      titleArtists:
        "Descubre artistas — Fotógrafos, ilustradores y más | A11STUDIO",
      descriptionArtists:
        "Encuentra y contacta con fotógrafos, ilustradores, cineastas, diseñadores y otros artistas. Explora por disciplina, estilo y ubicación en A11STUDIO.",
      titlePortfolios:
        "Portafolios de artistas — Fotografía, ilustración, cine y diseño | A11STUDIO",
      descriptionPortfolios:
        "Explora portafolios seleccionados de fotógrafos, ilustradores, cineastas y diseñadores en A11STUDIO y encuentra al artista ideal para tu proyecto.",
      headingArtists: "Descubre artistas",
      headingPortfolios: "Explora portafolios",
      introArtists:
        "Fotógrafos, ilustradores, cineastas, diseñadores y más: explora por disciplina, estilo y ubicación, y contacta directamente con el artista.",
      introPortfolios:
        "Trabajos seleccionados de artistas de A11STUDIO: cada portafolio reúne lo mejor de un artista en una disciplina o estilo.",
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
        TECHNIQUE: "Técnicas",
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
      showcase: {
        title: "Inspírate:",
        cta: "Ver una página de artista",
      },
      benefit: {
        label: "Has conseguido:",
        tiers: {
          VIP: "Miembro fundador",
          EARLY_USER: "Miembro de acceso anticipado",
          FOUNDER: "Fundador",
        },
        line: "{months} meses gratis",
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
    notice: {
      metadata: {
        title: "Aviso legal — A11STUDIO",
        description:
          "Quién está detrás de A11STUDIO: identificación del titular, datos de contacto y la información legal exigida por la LSSI-CE.",
      },
      updatedAt: "2026-10-14",
      heading: "Aviso legal",
      intro:
        "En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), estos son los datos de quien gestiona este sitio web.",
      owner: {
        title: "1. Titular del sitio web",
        body: "El sitio web a11studio.com y la plataforma A11STUDIO son gestionados por:",
        name: "<strong>Titular:</strong> {value}",
        taxId: "<strong>NIF/CIF:</strong> {value}",
        address: "<strong>Domicilio:</strong> {value}",
        email: "<strong>Email:</strong> <email/>",
        registry: "<strong>Datos registrales:</strong> {value}",
      },
      purpose: {
        title: "2. Objeto",
        body: "A11STUDIO es una plataforma online en la que artistas crean y publican sus portfolios, y en la que los visitantes pueden descubrir su trabajo y contactar con ellos.",
      },
      conditions: {
        title: "3. Condiciones de uso",
        body: "El uso del sitio web implica la aceptación de este aviso. La creación de una cuenta y el uso de la plataforma se rigen por nuestros <doc>Términos del servicio</doc>.",
      },
      ip: {
        title: "4. Propiedad intelectual",
        body: "El diseño, el código, la marca y los textos del sitio web pertenecen a su titular. Las obras publicadas por los artistas pertenecen a sus autores y no pueden reproducirse sin su permiso.",
      },
      privacy: {
        title: "5. Protección de datos",
        body: "Cómo tratamos los datos personales, y cómo ejercer tus derechos, se explica en nuestra <doc>Política de privacidad</doc>.",
      },
      law: {
        title: "6. Legislación aplicable",
        body: "Este aviso se rige por la legislación española. Si eres consumidor, conservas la protección de las leyes imperativas de tu país de residencia y puedes reclamar ante los tribunales de tu domicilio.",
      },
      contact: {
        title: "7. Puntos de contacto (Reglamento de Servicios Digitales)",
        body: "Punto único de contacto para usuarios y para las autoridades de los Estados miembros, la Comisión Europea y la Junta Europea de Servicios Digitales (arts. 11 y 12 del Reglamento de Servicios Digitales): <email/>. Respondemos en español, inglés y portugués. Para denunciar un contenido que consideres ilegal, usa nuestro <doc>formulario de denuncia</doc>.",
      },
    },
    terms: {
      metadata: {
        title: "Términos del servicio — A11STUDIO",
        description:
          "Términos y condiciones de uso de la plataforma de portafolios A11STUDIO — cuentas, planes de suscripción, propiedad del contenido, uso aceptable y moderación.",
      },
      updatedAt: "2026-10-14",
      heading: "Términos del servicio",
      intro:
        "Estos términos regulan el uso de la plataforma A11STUDIO. Al crear una cuenta o utilizar nuestros servicios, aceptas quedar vinculado por ellos.",
      acceptance: {
        title: "1. Aceptación de los términos",
        body: 'Al acceder o utilizar A11STUDIO ("la Plataforma"), aceptas estos Términos del servicio. Si no estás de acuerdo, no debes usar la Plataforma. Si hacemos cambios importantes, te avisaremos por email o en la aplicación al menos 30 días antes de que se apliquen. Si no estás de acuerdo con ellos, puedes cerrar tu cuenta antes de esa fecha.',
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
        withdrawal:
          "<strong>Derecho de desistimiento (consumidores de la UE)</strong> — puedes desistir de una suscripción de pago en los 14 días siguientes a la compra sin dar ninguna razón, escribiendo a <email/>. Te devolvemos lo pagado, descontando la parte proporcional del servicio ya utilizado, en un plazo de 14 días.",
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
          "Puedes eliminar tu cuenta en cualquier momento desde los ajustes. Tu perfil se oculta de inmediato y, 15 días después, tu cuenta, tus datos personales, archivos y contenido se eliminan de forma permanente según se describe en nuestra <doc>Política de privacidad</doc>. Hasta entonces puedes iniciar sesión y reabrirla; te avisamos por email 2 días antes de la eliminación. También puedes desactivar tu cuenta, lo que la oculta a todo el mundo sin borrar nada, y reactivarla cuando quieras.",
        body2:
          "Nos reservamos el derecho a suspender o cerrar las cuentas que incumplan estos términos, abusen de la plataforma o realicen actividades fraudulentas.",
      },
      warranties: {
        title: "11. Exención de garantías",
        body: 'Trabajamos para que la Plataforma esté disponible y funcione bien, pero no garantizamos un servicio ininterrumpido ni libre de errores. En la medida en que lo permita la ley, la Plataforma se ofrece "tal cual". Nada de estos términos limita tus derechos legales como consumidor, incluida la garantía legal de que el servicio sea conforme con lo acordado.',
      },
      liability: {
        title: "12. Limitación de responsabilidad",
        body: "En la medida en que lo permita la ley, A11STUDIO no responde de daños indirectos o consecuenciales derivados del uso de la Plataforma, como la pérdida de ingresos o beneficios. Esto no limita nuestra responsabilidad por dolo o culpa grave, por muerte o daños personales, ni ninguna responsabilidad que la ley no permita limitar, y no afecta a tus derechos imperativos como consumidor.",
      },
      law: {
        title: "13. Legislación aplicable",
        body: "Estos términos se rigen por la legislación española. Si eres consumidor, conservas además la protección de las leyes imperativas de tu país de residencia y puedes reclamar ante los tribunales de tu domicilio. También puedes acudir a la autoridad de consumo de tu comunidad o país.",
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
      updatedAt: "2026-10-14",
      heading: "Política de privacidad",
      intro:
        "Esta política describe cómo A11STUDIO recopila, utiliza, almacena y protege tu información cuando usas nuestra plataforma. Nos comprometemos con la transparencia y con la protección de tus datos.",
      controller: {
        title: "1. Responsable del tratamiento",
        body: 'A11STUDIO ("nosotros") es el responsable del tratamiento de tus datos personales. Nuestros datos identificativos y domicilio completos están en el <notice>Aviso legal</notice>. Para cualquier consulta sobre privacidad, escríbenos a <email/>.',
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
        automated:
          "Cada archivo se revisa automáticamente antes de publicarse. El contenido que incumple nuestras normas se bloquea y puede sumar una falta a tu cuenta, y la acumulación de faltas conlleva una suspensión temporal o definitiva. Puedes pedir que una persona revise cualquiera de estas decisiones escribiendo a <email/>.",
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
        analytics:
          "Medir cómo se usa la plataforma mediante estadísticas agregadas (solo con tu consentimiento)",
        bases:
          "<strong>Bases legales:</strong> tratamos los datos de tu cuenta, portfolio, facturación y contacto para ejecutar el contrato contigo (art. 6.1.b RGPD); las facturas para cumplir la normativa fiscal (art. 6.1.c); los registros de seguridad, la prevención del fraude, la moderación automática y los emails del servicio por nuestro interés legítimo en una plataforma segura y que funcione (art. 6.1.f); y la analítica solo con tu consentimiento (art. 6.1.a).",
      },
      sharing: {
        title: "6. Cesión de datos",
        body: "No vendemos tus datos personales. Solo los compartimos con los siguientes servicios externos en la medida necesaria para operar la plataforma:",
        payments:
          "<strong>Stripe y PayPal</strong> — para el procesamiento de pagos y la gestión de suscripciones",
        ai: "<strong>OpenAI</strong> — para la generación de contenido y la moderación de archivos",
        email:
          "<strong>Resend</strong> — para los correos transaccionales (verificación, recuperación de contraseña, notificaciones)",
        hosting:
          "<strong>Proveedores de alojamiento y almacenamiento en la nube</strong> — para operar la plataforma y guardar tus archivos",
        transfers:
          "Algunos de estos proveedores (OpenAI, Resend, Google) están en Estados Unidos. Esas transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las Cláusulas Contractuales Tipo de la Comisión Europea.",
        analytics:
          "<strong>Google Analytics (Google Ireland Limited)</strong> — para estadísticas de uso agregadas, solo si aceptas las cookies de analítica. La base jurídica es tu consentimiento, que puedes retirar en cualquier momento desde «Configuración de cookies» en el pie de página",
      },
      retention: {
        title: "7. Conservación de los datos",
        body: "Conservamos tus datos personales mientras tu cuenta esté activa. Los registros de seguridad se conservan hasta 30 días, y las facturas y registros de pago durante los plazos que exige la normativa fiscal y mercantil (hasta 6 años). Los mensajes de los formularios de contacto se conservan hasta que el destinatario los borra o se elimina su cuenta, y las denuncias de contenido el tiempo necesario para tramitarlas y atender posibles reclamaciones. Cuando eliminas tu cuenta, se oculta de inmediato y se borra de forma permanente 15 días después (el plazo te permite cambiar de opinión), junto con tus archivos y el contenido asociado, salvo los registros de pago que la ley nos obliga a conservar. Una cuenta desactivada conserva sus datos, ocultos al público, hasta que la reactives o la elimines.",
      },
      rights: {
        title: "8. Tus derechos",
        body: "Tienes los siguientes derechos sobre tus datos personales:",
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
        withdraw:
          "<strong>Retirar el consentimiento</strong> — cuando el tratamiento se basa en tu consentimiento (cookies de analítica), puedes retirarlo en cualquier momento",
        body2:
          "Para ejercer cualquiera de estos derechos, escríbenos a <email/>. Respondemos en el plazo de un mes. También puedes eliminar tu cuenta tú mismo desde Ajustes.",
        complaint:
          "Si crees que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD, www.aepd.es) o la autoridad de tu país.",
      },
      security: {
        title: "9. Seguridad",
        body: "Aplicamos medidas de seguridad estándar del sector para proteger tus datos, incluidos el cifrado, la autenticación segura y los controles de acceso. Aunque ningún sistema es totalmente inmune a las brechas, tomamos medidas razonables para salvaguardar tu información.",
      },
      cookies: {
        title: "10. Cookies",
        body: "Usamos cookies para el funcionamiento esencial de la plataforma y, solo si las aceptas, para analítica. Encontrarás todos los detalles en nuestra <doc>Política de cookies</doc>.",
      },
      changes: {
        title: "11. Cambios en esta política",
        body: "Podemos actualizar esta política de vez en cuando. Los cambios se publican en esta página con una fecha de revisión actualizada, y te avisaremos de los cambios importantes por email o en la aplicación antes de que se apliquen.",
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
          "Cómo usa A11STUDIO las cookies y tecnologías similares. Cookies esenciales propias, más cookies de analítica opcionales que solo se instalan si las aceptas: ninguna de publicidad.",
      },
      updatedAt: "2026-10-13",
      heading: "Política de cookies",
      intro:
        "Esta política explica qué cookies utiliza la plataforma A11STUDIO, por qué las usamos y cómo afectan a tu experiencia. Usamos las cookies necesarias para que la plataforma funcione y cookies de analítica solo si das tu consentimiento.",
      what: {
        title: "1. Qué son las cookies",
        body: "Las cookies son pequeños archivos de texto que tu navegador guarda en tu dispositivo. Permiten que la plataforma recuerde tu sesión, tus preferencias y tu estado de seguridad entre páginas. Nuestras cookies esenciales son <strong>propias y HTTP-only</strong>. No usamos cookies de publicidad y solo instalamos cookies de analítica después de que las aceptes.",
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
      analytics: {
        title: "5. Cookies de analítica (opcionales)",
        body: "Solo con tu consentimiento, usamos <strong>Google Analytics 4</strong> para entender cómo usan la plataforma los visitantes (páginas vistas, origen del tráfico, acciones clave como registrarse) y poder mejorarla. Estas cookies no se instalan, y los scripts de Google no se cargan, hasta que eliges Aceptar en el banner de cookies.",
        ga: "<strong>_ga</strong> — distingue a los visitantes para generar estadísticas agregadas. Caduca a los 2 años.",
        gaSession:
          "<strong>_ga_XXXXXXXXXX</strong> — mantiene el estado de tu sesión actual. Caduca a los 2 años.",
        provider:
          "El proveedor es Google Ireland Limited (Gordon House, Barrow Street, Dublín 4, Irlanda). Los datos pueden transferirse a Google LLC en Estados Unidos al amparo del Marco de Privacidad de Datos UE-EE. UU. Hemos desactivado las funciones publicitarias de Google, por lo que no se instalan cookies de publicidad.",
        withdraw:
          "La base jurídica es tu consentimiento. Puedes retirarlo en cualquier momento eligiendo «Configuración de cookies» en el pie de página y seleccionando Rechazar: las cookies de analítica se eliminan y dejan de enviarse datos.",
      },
      notUsed: {
        title: "6. Lo que no usamos",
        body: "A11STUDIO <strong>no</strong> utiliza:",
        analytics: "Cookies de analítica sin tu consentimiento previo",
        advertising: "Cookies de publicidad o retargeting",
        pixels: "Píxeles de seguimiento de redes sociales",
        crossSite: "Tecnologías de seguimiento entre sitios",
      },
      managing: {
        title: "7. Gestionar las cookies",
        body: "Puedes cambiar o retirar tu elección sobre analítica en cualquier momento desde «Configuración de cookies» en el pie de página. También puedes gestionar o eliminar las cookies desde los ajustes de tu navegador. Desactivar las cookies esenciales te impedirá iniciar sesión y usar las funciones que requieren autenticación. Para más información sobre cómo gestionarlas, consulta la documentación de tu navegador.",
      },
      privacyRelation: {
        title: "8. Relación con la política de privacidad",
        body: "Esta Política de cookies forma parte de nuestra <doc>Política de privacidad</doc>. Consúltala para conocer en detalle cómo recopilamos, usamos y protegemos tus datos personales más allá de las cookies.",
      },
      contact: {
        title: "9. Contacto",
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
      didntGetCode: "¿No te ha llegado?",
      resend: "Enviar un código nuevo",
      resendIn: "Enviar un código nuevo en {seconds}s",
      newCodeSent: "Te hemos enviado un código nuevo. Solo funciona el último.",
      codeExpired: "Este código ha caducado. Envíate uno nuevo.",
      checkSpam:
        "Puede tardar un minuto en llegar. Revisa también la carpeta de spam.",
      sessionExpired:
        "Tu sesión de verificación ha terminado. Vuelve a iniciar sesión.",
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
      skipStep: "Omitir este paso",
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
  pendingDeletion: {
    title: "Tu cuenta se eliminará el {date}",
    description:
      "Nos pediste eliminar tu cuenta. Después de esa fecha, tu contenido multimedia, portfolios y perfil desaparecen para siempre.",
    invisible:
      "Hasta entonces, tu cuenta es invisible para el resto de personas.",
    reopen: "Reabrir mi cuenta",
    logout: "Cerrar sesión",
    reopenedToast: "Bienvenido de nuevo. Tu cuenta vuelve a ser pública.",
    tooLate: "Tu cuenta ya se está eliminando y no se puede reabrir.",
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
  locationSearch: {
    searching: "Buscando ubicaciones…",
    noLocations: "No se encontraron ubicaciones.",
    minCharsHint: "Escribe al menos 3 caracteres para buscar.",
  },
  addressForm: {
    label: "Dirección",
    searchPlaceholder: "Busca tu dirección…",
    saving: "Guardando dirección…",
    confirm: "Guardar dirección",
  },
  userCategories: {
    title: "Categorías",
    visibilityHint:
      "Elegir pocas categorías (se recomiendan 1–3) mejora tu visibilidad.",
  },
  artists: {
    hiddenNotice: {
      title: "Solo tú puedes ver esta página.",
      body: 'Tu cuenta está desactivada, así que los visitantes ven "página no encontrada".',
      cta: "Reactivar en Ajustes",
    },
    shareProfile: "Compartir perfil",
    invite: {
      madeWith: "Hecho con",
      label: "Portafolio hecho con a11studio",
      endTitle: "Tu obra merece una página como esta.",
      cta: "Crea tu portafolio",
      ctaWaitlist: "Trae tu arte",
      contactTitle: "¿Tú también creas?",
    },
    breadcrumb: {
      goBack: "Volver",
    },
    header: {
      atelier: "Atelier",
      createYours: "Crea el tuyo",
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
      sent: {
        title: "Mensaje enviado",
        body: "{name} te responderá por correo.",
        bodyFallback: "Recibirás la respuesta por correo.",
        close: "Cerrar",
      },
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
      generic: "La página que buscas no existe o puede haber sido eliminada.",
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
      metaTitleLocation: "{name} — {profession} en {location}",
      bannerAlt: "Portada de {name}",
      avatarAlt: "Retrato de {name}",
      bannerRegion: "Portada del perfil",
      bioRegion: "Sobre mí",
      connect: "Conectar",
      emailLabel: "Enviar un correo a {name}",
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
      metaDescriptionDetailed:
        "Portafolios de {name}, {profession} en {location}: lo mejor de su trabajo en A11STUDIO.",
      listTitle: "Portafolios de {name}",
      fromCollection: "{title} (Colección: {collection})",
      pageTitle: "Portafolios",
      metaDescription:
        "Explora los portafolios de {name} en A11STUDIO: colecciones seleccionadas de sus mejores trabajos.",
      empty: "Aún no hay portafolios.",
      galleryEmpty: "Este portafolio está vacío por ahora.",
    },
    collections: {
      metaDescriptionDetailed:
        "Colecciones de {name}, {profession} en {location}: proyectos, viajes y series en A11STUDIO.",
      listTitle: "Colecciones de {name}",
      pageTitle: "Colecciones",
      metaDescription:
        "Explora las colecciones de {name} en A11STUDIO: conjuntos seleccionados de su trabajo.",
      empty: "Aún no hay colecciones.",
      galleryEmpty: "Esta colección está vacía por ahora.",
    },
    services: {
      metaDescriptionDetailed:
        "Servicios de {name}, {profession} en {location}. Descubre qué incluye cada uno y contacta en A11STUDIO.",
      listTitle: "Servicios de {name}",
      pageTitle: "Servicios",
      metaDescription:
        "Descubre los servicios que ofrece {name} en A11STUDIO y ponte en contacto para colaborar.",
      empty: "Aún no hay servicios.",
      whatsIncluded: "Qué incluye",
      terms: "Términos",
      relatedPortfolio: "Portafolio relacionado",
    },
    about: {
      metaTitleNamed: "{title} — {name}",
      metaTitleDefault: "Sobre {name}",
      photoAlt: "Retrato de {name}",
      pageTitle: "Sobre mí",
      metaDescription:
        "Conoce mejor a {name} en A11STUDIO — su historia, su trayectoria y cómo ponerte en contacto.",
      notShared: "Este artista aún no ha compartido su historia.",
      heading: "Acerca de",
      getInTouch: "Ponte en contacto",
    },
    media: {
      titleFallback: "Obra de {name}",
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
      invalidType:
        "{field} debe ser una imagen (JPEG, PNG, WebP, GIF) o un vídeo (MP4, MOV, MPEG)",
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
    description: "Descripción",
    seoAlt: "Texto alternativo SEO",
    seoTitle: "Título SEO",
    seoDescription: "Descripción SEO",
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
      viewOnline: "Ver en línea",
      cancel: "Cancelar",
      save: "Guardar",
      update: "Actualizar",
      create: "Crear",
      close: "Cerrar",
      add: "Añadir",
      loading: "Cargando...",
      expandMedia: "Ver a tamaño completo",
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
          media: "Sube tu primer contenido",
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
        active: "Público",
        activeInfo:
          "Si lo desmarcas, este portafolio se oculta de tu perfil de artista y de los listados. Aún puedes editarlo en Atelier.",
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
        previewAria: "Previsualizar y ajustar diseño",
        previewTitle: "Vista previa del diseño",
        previewDescription:
          "Una vista previa de tus elementos seleccionados usando el diseño {layoutName}. El resultado se adapta al tamaño de pantalla del visitante.",
        previewEmpty: "Añade elementos para previsualizar el diseño.",
        recommendationLabel: "Recomendado para",
        recommendations: {
          MASONRY:
            "Formatos muy distintos. Las obras verticales, horizontales y cuadradas conviven cerca de su forma real.",
          UNIFORM:
            "Una vista minimalista. Cada obra ocupa la misma celda, serena y equilibrada.",
          COLUMN_BASE:
            "Vídeo y selecciones pequeñas. Tú decides el número de columnas, así pocas obras o clips tienen el espacio que necesitan.",
        },
        layoutGroup: "Diseño",
        itemsGroup: "Elementos",
        columns: "Columnas",
        showTitles: "Mostrar títulos",
        showTitlesHint:
          "Cada obra muestra su título sobre la imagen, en hasta dos líneas.",
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
        active: "Público",
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
        hint: "Toca para añadir · {count} disponibles",
        removeFromSelection: "Quitar",
        selectedHeading: "Seleccionados",
        selectedHint: "Usa × para quitar",
        availableHeading: "Disponibles",
        allSelected: "Todo lo cargado ya está seleccionado",
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
        active: "Público",
        activeInfo:
          "Si lo desmarcas, esta colección se oculta de tu perfil de artista y de los listados. Aún puedes editarla en Atelier.",
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
        globalCompression: "Compresión",
        compressionTooltipTitle: "Nivel de compresión",
        compressionTooltipBody:
          "Controla el equilibrio entre la calidad y el tamaño de archivo. Una compresión menor (VERY_LOW, LOW) conserva más detalle pero genera archivos más grandes. Una compresión mayor (HIGH, VERY_HIGH) reduce el tamaño pero puede reducir ligeramente la calidad. Los vídeos ya comprimidos se guardan tal cual.",
        compressionTooltipHint:
          "Se aplica a todos los archivos. Abre un archivo para cambiar solo ese.",
        compressionSmallFileHint:
          "Si tu foto ya está comprimida o es pequeña (menos de 5 MB), te recomendamos elegir una compresión normal o menor.",
        allFiles: "Todos los archivos",
        upgradeRequired: "Mejora tu plan para acceder a esta función.",
        aiSeoGeneration: "Generar metadatos con IA",
        aiSeoHint:
          "La IA escribe un título, una descripción y categorías que ayudan a que encuentren tu obra en Google.",
        aiSeoBadge: "Los metadatos se generarán con IA",
        aiSeoTooltipBody:
          "La IA mira tu imagen o vídeo y escribe un título, una descripción y una breve descripción de la imagen que ayudan a que encuentren tu obra, en español, inglés y portugués. Nunca cambia el título ni la descripción que escribiste. Si no eliges ninguna categoría, la IA las elige por ti. Si eliges, la IA respeta las tuyas y solo añade algunas palabras clave extra.",
        aiSeoCreditsHint:
          "Cuesta {imageCost} {imageCost, plural, one {crédito} other {créditos}} de IA por imagen/GIF, {videoCost} por video. <remaining>Te quedan {count} {count, plural, one {crédito} other {créditos}}.</remaining>",
        creditsLabel: "{count} {count, plural, one {crédito} other {créditos}}",
        creditsUsageSummary:
          "{used} {used, plural, one {crédito} other {créditos}} usados · quedan {remaining}",
        noCreditsTitle: "Sin créditos de IA:",
        noCreditsBody:
          "Has usado todos tus créditos de IA. Mejora tu plan o espera al próximo reinicio.",
        filesCount: "{count}/{max} archivos",
        maxReached: "Límite alcanzado",
        dropzoneTitle: "Haz clic para subir",
        dropzoneHint: "o arrastra y suelta",
        dropzoneAddMore: "Añadir más archivos",
        dropzoneRemaining:
          "{remaining} {remaining, plural, one {espacio} other {espacios}} disponibles",
        compressionLabel: "Compresión",
        upgradeToAdjust: "Mejora tu plan para ajustar",
        previewAlt: "Vista previa {index}",
        settingsTitle: "Ajustes de subida (afecta a todos)",
        settingsAiOn:
          "Activado · {used} {used, plural, one {crédito} other {créditos}}",
        settingsAiOff: "Desactivado",
        cardDetailsHint: "Editar",
        openDetailsAria: "Editar {name}",
        removeAria: "Quitar {name}",
        detailsSubtitle: "Los cambios aquí solo afectan a este archivo.",
        coverTitle: "Portada",
        coverHint:
          "Arrastra para elegir el fotograma que se verá en tu galería y al compartir.",
        coverSliderLabel: "Fotograma de portada",
        coverVideoLabel: "Fotograma del vídeo usado como portada",
        coverUnsupported:
          "Este navegador no puede previsualizar este vídeo, así que la portada será un fotograma de su primer segundo.",
        detailsDone: "Listo",
        notEnoughCreditsForFile:
          "No quedan créditos suficientes para este archivo",
        gridHint: "Haz clic en un archivo para editarlo antes de subirlo.",
        fileSizeLabel: "Tamaño",
        fileTypeLabel: "Tipo",
        typeImage: "Imagen",
        typeVideo: "Vídeo",
        aiCostForFile:
          "Usa {count} {count, plural, one {crédito} other {créditos}}",
        aboutTitle: "Sobre esta obra",
        aboutHint:
          "Opcional: se muestra con tu obra y la IA lo lee para escribir mejores metadatos.",
        titleLabel: "Título",
        titlePlaceholder: "p. ej. Atardecer sobre Lisboa",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Qué muestra y la historia detrás",
        locationLabel: "Ubicación",
        locationPlaceholder: "Busca una ciudad o lugar…",
        locationHint:
          "Dónde se hizo o se fotografió. Ayuda a que encuentren tu obra por lugar.",
        settingsLocationSome: "{count}/{total} archivos",
        globalLocationLabel: "Ubicación para todos los archivos",
        globalLocationHint: "Pone el mismo lugar en todos los archivos.",
        globalLocationPerFileHint:
          "¿Un archivo es de otro lugar? Haz clic en él en la lista para ponerle su propia ubicación.",
        globalLocationMixed:
          "Tus archivos tienen ubicaciones distintas. Si eliges una aquí, se reemplazan todas.",
        globalLocationClear: "Quitar la ubicación de todos los archivos",
        categoriesLabel: "Categorías",
        categoriesHint:
          "Hasta 5: qué es, su estilo o cómo está hecha (ángulo, encuadre…). Ayuda a que encuentren tu obra.",
        categoriesAiWillChoose:
          "Sin categoría elegida — la IA las elegirá para este archivo.",
        settingsCategoriesSome: "{count}/{total} archivos",
        globalCategoriesLabel: "Categorías para todos los archivos",
        globalCategoriesHint:
          "Pone las mismas categorías (hasta 5) en todos los archivos.",
        globalCategoriesAiHint:
          "Si no eliges ninguna, la IA las pondrá por ti cuando “Generar metadatos con IA” esté activado.",
        globalCategoriesPerFileHint:
          "¿Un archivo necesita otras categorías? Haz clic en él en la lista para ponerle las suyas.",
        globalCategoriesMixed:
          "Tus archivos tienen categorías distintas. Si eliges aquí, se reemplazan todas.",
        globalCategoriesClear: "Quitar las categorías de todos los archivos",
        aiNotesTip:
          "Consejo: pon primero un título, una descripción y una ubicación a cada archivo. La IA los lee, así lo que escribe es más preciso. Haz clic en un archivo para añadirlos.",
        duplicateSummary:
          "{count, plural, one {# archivo tiene} other {# archivos tienen}} el mismo nombre y tamaño que otro archivo de esta subida: revisa si hay duplicados.",
        duplicateCardHint:
          "Posible duplicado: otro archivo de esta subida tiene el mismo nombre y tamaño.",
        duplicateDialogHint:
          "Otro archivo de esta subida tiene el mismo nombre y tamaño. Si es la misma imagen, quita uno de los dos.",
        createNewMedia: "Crear nuevo contenido",
        uploadUpToImages:
          "Sube hasta {max} archivos: imágenes (JPEG, PNG, WebP, GIF) o vídeos (MP4, MOV, MPEG)",
        uploadButton:
          "Subir {count, plural, one {# archivo} other {# archivos}}",
        uploadingInBackground:
          "{count, plural, one {# subiendo} other {# subiendo}}",
        close: "Cerrar",
        createMedia: "Crear contenido",
        upload: "Subir contenido",
        storageFullTitle: "Almacenamiento lleno: {used} / {limit} GB usados",
        uploadInProgress: "Subida en curso...",
      },
      card: {
        deleteFailed: "No se pudo eliminar el contenido",
        titleLabel: "Título",
        titlePlaceholder: "Introduce el título",
        descriptionLabel: "Descripción",
        descriptionPlaceholder: "Introduce la descripción",
        locationLabel: "Ubicación",
        locationPlaceholder: "Busca una ciudad o lugar…",
        locationInfo:
          "Dónde se hizo o se fotografió. La IA lo usa al escribir los metadatos.",
        categoriesLabel: "Categorías",
        categoriesInfo:
          "Hasta 5 categorías que describen esta obra: qué es, su estilo artístico o la técnica usada (ángulo, encuadre, profundidad…). Ayudan a encontrarla en las búsquedas y los filtros.",
        categoriesRegenerateHint:
          "Cambiaste las categorías. Después de guardar, te recomendamos generar los metadatos de nuevo para que el título, la descripción y las palabras clave coincidan con ellas.",
        categoriesAiHint:
          "Sin categoría — la IA las elegirá la próxima vez que generes metadatos.",
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
        metadataGeneratedLabel: "Metadatos generados",
        activeLabel: "Público",
        activeInfo:
          "El contenido público aparece en su página y en todos los portafolios y colecciones donde está. Desmárcalo para ocultarlo en todas partes sin eliminarlo; puedes volver a marcarlo cuando quieras.",
        visibilityLabel: "Público",
        visibilityActive: "Sí",
        visibilityInactive: "No",
        typeLabel: "Tipo",
        compressionLabel: "Compresión",
        sizeLabel: "Tamaño",
        urlLabel: "URL",
        copyUrl: "Copiar URL",
        urlCopied: "URL copiada",
        urlCopyFailed: "No se pudo copiar la URL",
        coverLabel: "Portada",
        coverChange: "Cambiar portada",
        coverTitle: "Elige una portada",
        coverHint:
          "Arrastra para elegir el fotograma que se verá en tu galería y al compartir.",
        coverSliderLabel: "Fotograma de portada",
        coverVideoLabel: "Fotograma del vídeo usado como portada",
        coverUnsupported:
          "Este navegador no puede reproducir este vídeo, así que aquí no se puede cambiar la portada.",
        coverSave: "Usar este fotograma",
        coverPending: "Actualizando portada…",
        coverUpdated: "Portada actualizada",
        coverRejected:
          "Ese fotograma no se puede usar como portada. Se mantuvo la anterior.",
        coverChangeFailed: "No se pudo cambiar la portada. Inténtalo de nuevo.",
        noPreview: "Sin vista previa",
        altFallback: "Contenido de {username}",
        untitled: "Sin título",
        editMedia: "Editar contenido",
        mediaPreview: "Vista previa del contenido",
        viewPublicPage: "Ver página pública",
        generateSeo: "Generar metadatos",
        noCreditsAvailable:
          "No hay créditos de IA disponibles. Necesitas al menos {imageCost} crédito para generar metadatos de una imagen/GIF, o {videoCost} para un video. Mejora tu plan o espera a que se reinicien los créditos.",
        generateSeoTooltip:
          "Ayuda a que tu trabajo se encuentre en Google y Google Imágenes. La IA mira la imagen o el video y escribe un título, una descripción, una descripción de la imagen y un nombre de archivo. Si no has puesto categorías, también las elige; si las has puesto, respeta las tuyas y solo añade algunas palabras clave extra.",
        noCreditsSuffix: " (Sin créditos)",
        delete: "Eliminar",
        deleteTitle: "¿Eliminar este contenido?",
        deleteConfirm: "Esta acción no se puede deshacer.",
        deleteWarningMetadata:
          "Se perderán de forma permanente todos los metadatos generados: títulos, descripciones, textos SEO y etiquetas.",
        deleteWarningUsage:
          "Si este contenido forma parte de un portafolio o una colección, desaparecerá de ellos.",
        cancel: "Cancelar",
        discardTitle: "¿Descartar cambios?",
        discardBody:
          "¿Seguro que quieres cancelar? Se perderán todos los cambios sin guardar.",
        keepEditing: "Seguir editando",
        discardChanges: "Descartar cambios",
        saveChanges: "Guardar cambios",
        edit: "Editar",
        close: "Cerrar",
        failed: "Error",
        failedAria: "Este contenido no se pudo procesar",
      },
      grid: {
        processingTitle: "Procesando",
        processingHint:
          "Estamos optimizando tus nuevas subidas. Cada una se suma a tu biblioteca cuando esté lista — puedes salir de esta página.",
        processingItem: "Procesando…",
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
        deleteCount: "Eliminar ({count})",
        deleteTitle: "¿Eliminar los medios seleccionados?",
        deleteDescription:
          "Se {count, plural, one {eliminará # medio seleccionado} other {eliminarán # medios seleccionados}} de forma permanente.",
        deleteInUse:
          "{count, plural, one {# medio pertenece} other {# medios pertenecen}} a portafolios o colecciones ({portfolios} en portafolios, {collections} en colecciones). {count, plural, one {Desaparecerá} other {Desaparecerán}} de allí.",
        deleteIrreversible:
          "Esta acción no se puede deshacer. Todos los metadatos generados se perderán de forma permanente.",
        overDeleteLimit:
          "Límite: selecciona hasta {max} elementos (quita {excess}).",
        deleteConfirm: "Eliminar {count}",
        deleting: "Eliminando…",
        deleteFailed: "No se pudieron eliminar los medios",
        deletePartialFailed:
          "No se pudieron eliminar {failed} de {total} medios.",
        deleteSuccess:
          "{count, plural, one {# medio eliminado} other {# medios eliminados}}.",
        updateLocationCount: "Definir ubicación ({count})",
        updateLocationTitle: "Definir ubicación",
        updateLocationDescription:
          "Guardar un lugar en {count} {count, plural, one {contenido seleccionado} other {contenidos seleccionados}}.",
        updateLocationHint: "Es donde se hizo la obra.",
        overLocationLimit:
          "Límite: selecciona hasta {max} elementos (quita {excess}).",
        locationPlaceholder: "Busca una ciudad o lugar…",
        updateCategoriesCount: "Definir categorías ({count})",
        updateCategoriesTitle: "Definir categorías",
        updateCategoriesDescription:
          "Aplicar las mismas categorías a {count} {count, plural, one {contenido seleccionado} other {contenidos seleccionados}}.",
        updateCategoriesReplaceLabel: "Reemplazar las categorías actuales",
        updateCategoriesMergeHint:
          "Desactivado: se añaden junto a las categorías que cada elemento ya tiene. Ningún elemento supera {max}, así que cuando está completo el resto se omite.",
        updateCategoriesReplaceHint:
          "Activado: se eliminan las categorías actuales de cada elemento, incluidas las que añadió la IA, y solo se conservan estas. Te recomendamos volver a generar los metadatos después.",
        updateCategoriesOverCap:
          "{count, plural, one {# elemento superaría} other {# elementos superarían}} las {max} categorías. Solo se añadirán las que quepan.",
        updateCategoriesMergeConfirm: "Añadir categorías",
        updateCategoriesReplaceConfirm: "Reemplazar categorías",
        overCategoriesLimit:
          "Límite: selecciona hasta {max} elementos (quita {excess}).",
        cancel: "Cancelar",
        selectMedia: "Seleccionar contenido",
        actions: "Acciones",
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
        clearSearch: "Borrar búsqueda",
        clearFilters: "Borrar filtros",
        shapeGroupLabel: "Formato",
        typeGroupLabel: "Tipo",
        sortLabel: "Ordenar por",
        allShapes: "Todos los formatos",
        allTypes: "Todos los tipos",
        shape: {
          SQUARE: "Cuadrado",
          LANDSCAPE: "Horizontal",
          PORTRAIT: "Vertical",
        },
        sort: {
          created_at_desc: "Subidos recientemente",
          created_at_asc: "Subidos hace más tiempo",
          seo_generated_at_desc: "Metadatos generados: más recientes",
          seo_generated_at_asc: "Metadatos generados: más antiguos",
        },
      },
      status: {
        seoComplete: "SEO completo",
        seoCompleteBody:
          "El título SEO, la descripción y el texto alternativo están definidos.",
        seoIncomplete: "SEO incompleto",
        seoIncompleteBody: "Falta: {fields}. Genéralos con IA o añádelos tú.",
        locationSet: "Ubicación definida",
        locationMissing: "Sin ubicación",
        locationMissingBody:
          "Indicar dónde se hizo la obra ayuda a que la encuentren.",
        active: "Público",
        activeBody:
          "Visible en su página pública y en todos los lugares donde lo colocaste.",
        inactive: "No público",
        inactiveBody: "Oculto de su página pública, portafolios y colecciones.",
        inCollections:
          "En {count, plural, one {# colección} other {# colecciones}}",
        inCollectionsBody:
          "Si ocultas este contenido, también se oculta en ellas.",
        inPortfolios:
          "En {count, plural, one {# portafolio} other {# portafolios}}",
        inPortfoliosBody:
          "Incluye los portafolios que lo muestran directamente o a través de una de sus colecciones.",
      },
      mediaType: {
        IMAGE: "Foto",
        GIF: "GIF",
        VIDEO: "Vídeo",
      },
      compressionLevel: {
        VERY_LOW: "Muy baja",
        LOW: "Baja",
        NORMAL: "Normal",
        HIGH: "Alta",
        VERY_HIGH: "Muy alta",
      },
      drawer: {
        title: "Añadir contenido",
        refreshAria: "Actualizar contenido",
        filterAll: "Todos",
        hint: "Toca para añadir · {count} disponibles",
        hintMax: "· hasta {max} elementos",
        removeFromSelection: "Quitar",
        selectedHeading: "Seleccionados",
        selectedHint: "Usa × para quitar",
        availableHeading: "Disponibles",
        allSelected: "Todo lo cargado ya está seleccionado",
        addToPortfolio: "Añadir al portafolio",
        emptyTitle: "Aún no hay contenido",
        emptySubtitle: "Sube tu primera imagen para empezar",
        itemsSelected:
          "{count, plural, one {# elemento seleccionado} other {# elementos seleccionados}}",
        itemsSelectedWithMax:
          "{count} / {max} {count, plural, one {elemento seleccionado} other {elementos seleccionados}}",
        failedAria: "Este contenido no se pudo procesar",
      },
      uploadStatus: {
        uploadComplete: "Subida completa",
        uploadingFiles: "Subiendo archivos",
        remaining: "{count} restantes",
        success: "con éxito",
        failed: "con error",
        allComplete: "Todo completo",
        queued: "En cola...",
        uploadingPercent: "Subiendo... {percent}%",
        doNotCloseWarning:
          "Manten esta pagina abierta hasta que termine la subida",
        processingNotify: "Archivo subido, te avisaremos cuando este listo",
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
        requestFailed: "Error en la solicitud",
        minimize: "Minimizar",
        hide: "Ocultar estado de subida",
        expand: "Expandir",
        requestFailedCount:
          "{count, plural, one {# elemento no se pudo enviar} other {# elementos no se pudieron enviar}}",
      },
    },
    contacts: {
      pageTitle: "Contactos",
      pageInfo:
        "Mensajes que te enviaron desde tu formulario de contacto. Selecciona uno para leer el correo completo.",
      emptyState: "Todavía nadie te ha contactado.",
      emptyStateFiltered: "Ningún contacto coincide con esta búsqueda.",
      openAria: "Abrir el mensaje «{subject}»",
      table: {
        name: "Nombre",
        email: "Correo",
        subject: "Asunto",
        receivedAt: "Recibido",
      },
      filters: {
        searchPlaceholder: "Buscar contactos…",
        clearSearchAria: "Limpiar búsqueda",
        orderByAria: "Ordenar por",
        sortAsc: "Ordenado de más antiguo a más reciente",
        sortDesc: "Ordenado de más reciente a más antiguo",
        orderByOptions: {
          created_at: "Fecha de recepción",
          updated_at: "Última actualización",
          contact_name: "Nombre",
          contact_email: "Correo",
          subject: "Asunto",
        },
      },
      dialog: {
        description: "Recibido el {date}",
        from: "De",
        email: "Correo",
        message: "Mensaje",
      },
    },
    notifications: {
      pageTitle: "Notificaciones",
      pageInfo:
        "Todo lo que ha ocurrido en tu cuenta. Selecciona una para ver sus detalles.",
      emptyState: "Todavía no tienes notificaciones.",
      emptyStateFiltered: "Ninguna notificación coincide con estos filtros.",
      openAria: "Abrir la notificación {type}",
      referenceValue: "n.º {id}",
      types: {
        NEW_CONTACT: "Nuevo mensaje de contacto",
        CREATE_UPDATE_MEDIA: "Contenido creado o actualizado",
        GENERATE_MEDIA_METADATA: "Metadatos de contenido generados",
        FAILED_GENERATE_MEDIA_METADATA:
          "Error al generar metadatos del contenido",
        DELETE_MEDIA: "Contenido eliminado",
      },
      status: {
        read: "Leída",
        unread: "Sin leer",
      },
      table: {
        type: "Notificación",
        status: "Estado",
        reference: "Referencia",
        updatedAt: "Actualizada",
      },
      filters: {
        allTypes: "Todas las notificaciones",
        typeAria: "Filtrar por tipo de notificación",
        unreadOnly: "Solo sin leer",
        orderByAria: "Ordenar por",
        sortAsc: "Ordenado de más antiguo a más reciente",
        sortDesc: "Ordenado de más reciente a más antiguo",
        orderByOptions: {
          created_at: "Fecha de creación",
          updated_at: "Última actualización",
          read_at: "Fecha de lectura",
          type: "Tipo de notificación",
        },
      },
      dialog: {
        description: "Última actualización el {date}",
        status: "Estado",
        readAt: "Leída el {date}",
        reference: "Referencia",
        updatedAt: "Última actualización",
      },
      card: {
        unavailable: "Este elemento ya no está disponible.",
        contactFrom: "De {name}",
        subject: "Asunto",
        name: "Nombre",
        email: "Correo electrónico",
        title: "Título",
        publicId: "ID del archivo",
        untitledMedia: "Archivo sin título",
        deletedMedia: "Este contenido fue eliminado",
        thumbnailAlt: "Vista previa de {title}",
        noThumbnail: "Sin vista previa disponible",
        seoTitle: "Título generado",
        seoDescription: "Descripción generada",
        viewMedia: "Ver en archivos",
        failedFallback: "Falló sin motivo informado.",
        mediaTypeLabel: "Tipo",
        mediaType: {
          IMAGE: "Foto",
          GIF: "GIF",
          VIDEO: "Vídeo",
        },
        statusWithType: "{status} · {type}",
        status: {
          UPLOADING: "Subiendo…",
          UPDATING: "Actualizando…",
          GENERATING_METADATA: "Generando metadatos…",
          COMPLETED: "Lista",
          FAILED: "Error al procesar",
        },
      },
    },
    home: {
      shareKitTitle: "Pon tu portafolio en tu bio",
      shareKitDescription:
        "Añade este enlace a tu bio de Instagram, tu web y tu firma de correo. Cada enlace ayuda a que los clientes encuentren tu trabajo y a que tu perfil posicione.",
      shareKitLinkLabel: "El enlace de tu portafolio",
      shareKitSnippetLabel: "Para tu web (HTML)",
      shareKitBadgeText: "Portafolio en A11STUDIO",
      shareKitCopy: "Copiar",
      shareKitCopied: "Copiado",
      pageTitle: "Panel",
    },
    nav: {
      dashboard: "Panel",
      home: "Inicio",
      media: "Contenido",
      collections: "Colecciones",
      portfolios: "Portafolios",
      services: "Servicios",
      misc: "Varios",
      contacts: "Contactos",
      notifications: "Notificaciones",
      about: "Sobre mí",
      settings: "Ajustes",
      closeMenuAria: "Cerrar menú",
    },
    topNav: {
      accountDeactivated: "Cuenta desactivada",
      accountDeactivatedHint:
        "Tu perfil está oculto para todo el mundo. Reactívalo desde Ajustes.",
      openMenuAria: "Abrir menú",
      expandSidebarAria: "Expandir barra lateral",
      collapseSidebarAria: "Contraer barra lateral",
      notificationsAria: "Notificaciones",
      notificationsTitle: "Notificaciones",
      notificationsEmpty: "Aún no hay notificaciones.",
      notificationsEmptyHint:
        "Aquí aparecerán las subidas, las generaciones con IA y los mensajes nuevos.",
      notificationsUnreadAria:
        "Notificaciones, {count, plural, one {# sin leer} other {# sin leer}}",
      notificationsViewAll: "Ver todas",
      notificationsMarkAllRead: "Marcar todas como leídas",
      notificationsMarkAllReadTitle: "¿Marcar las notificaciones como leídas?",
      notificationsMarkAllReadBody:
        "Se marcarán como leídas {count, plural, one {# notificación sin leer} other {# notificaciones sin leer}} de esta lista. Lo que llegue después seguirá sin leer.",
      notificationsMarkAllReadConfirm: "Marcar como leídas",
      notificationsMarkAllReadCancel: "Cancelar",
      upgrade: "Mejorar plan",
      viewProfile: "Perfil público",
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
      dangerZone: {
        heading: "Zona de peligro",
        deactivate: {
          label: "Desactivar cuenta",
          labelDescription:
            "Oculta tu perfil y tu trabajo a todo el mundo. No se borra nada.",
          inactiveLabel: "Tu cuenta está desactivada",
          inactiveDescription:
            "Tu perfil y tu trabajo están ocultos para todo el mundo hasta que la reactives.",
          trigger: "Desactivar",
          title: "¿Desactivar tu cuenta?",
          description:
            "Tu perfil, portfolios y contenido multimedia serán invisibles para todo el mundo y nadie podrá contactarte. No se borra nada: puedes seguir trabajando en tu atelier y reactivar tu cuenta cuando quieras desde Ajustes.",
          cancel: "Cancelar",
          submit: "Desactivar cuenta",
          reactivate: "Reactivar",
          deactivatedToast:
            "Tu cuenta está desactivada y oculta para todo el mundo.",
          reactivatedToast: "Tu cuenta vuelve a ser pública.",
        },
        delete: {
          label: "Eliminar cuenta",
          labelDescription:
            "Elimina tu cuenta y todo tu trabajo de forma permanente en {days} días.",
          trigger: "Eliminar",
          title: "¿Eliminar tu cuenta?",
          description:
            "Tu cuenta se eliminará de forma permanente en {days} días.",
          whatHidden: "Desde ahora, tu perfil es invisible para todo el mundo.",
          whatDeleted:
            "Después, tu contenido multimedia, portfolios, colecciones, servicios y datos de perfil se borran para siempre.",
          whatReopen:
            "¿Cambias de opinión? Inicia sesión antes de {days} días y reabre tu cuenta. También te enviaremos un email 2 días antes.",
          cancelSubscriptionLabel: "Cancelar también mi suscripción ahora",
          cancelSubscriptionOn:
            "Tu plan no se volverá a renovar. Lo conservas hasta el final del periodo que ya pagaste.",
          cancelSubscriptionOff:
            "Tu suscripción sigue igual y se cancela el día en que se elimine tu cuenta.",
          passwordLabel: "Confirma con tu contraseña",
          passwordRequired: "Introduce tu contraseña para confirmar.",
          wrongPassword: "La contraseña no es correcta.",
          alreadyRequested: "Tu cuenta ya está programada para eliminarse.",
          tooManyAttempts:
            "Demasiados intentos. Espera un minuto y vuelve a probar.",
          submit: "Eliminar mi cuenta",
        },
      },
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
