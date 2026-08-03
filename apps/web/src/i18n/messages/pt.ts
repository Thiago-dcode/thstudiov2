import type { Messages } from "./en";

const messages = {
  seo: {
    organizationDescription:
      "A11STUDIO é a plataforma de portfólios onde os artistas são descobertos — mostre seu trabalho e conecte-se com clientes, colecionadores e colaboradores.",
    defaultTitle: "A11STUDIO — Onde os Artistas são Descobertos",
    defaultDescription:
      "Mostre o seu trabalho, seja descoberto e conecte-se com clientes, colecionadores e colaboradores. A11STUDIO é a plataforma de portfólios feita exclusivamente para artistas.",
  },
  landing: {
    metadata: {
      title: "A11STUDIO — Onde os artistas são descobertos",
      description:
        "A plataforma de portfólios para artistas. Mostre seu trabalho, seja descoberto por clientes e colecionadores e deixe a IA cuidar do seu SEO automaticamente.",
    },
    hero: {
      titlePrefix: "Deixe que sua",
      titleAccentWords: ["arte", "visão", "criação", "paixão", "voz"],
      titleConnector: "se",
      titleDiscoverWords: [
        "compartilhe",
        "note",
        "revele",
        "encontre",
        "descubra",
      ],
      subtitle: "Basta enviar sua arte. Nós cuidamos do resto.",
      primaryCtaLoggedIn: "Acessar o Atelier",
      primaryCtaLoggedOut: "Comece grátis agora",
      secondaryCta: "Encontrar artistas",
      waitList: {
        hook: "Entre na lista de espera para ter acesso antecipado ao app.",
        label: "Entre na lista de espera para artistas",
        placeholder: "Digite seu endereço de e-mail",
        button: "Entrar na lista",
        buttonPending: "Entrando...",
        hint: "Entre na lista de espera e seja um dos primeiros a entrar na A11STUDIO.",
        hintTooltip:
          "Entre na lista de espera e faça parte dos primeiros usuários com acesso antecipado, que receberão benefícios exclusivos. A lista é limitada: assim que atingirmos o número máximo de vagas, ela será fechada.",
        successToast:
          "Você está na lista de espera. Vamos te manter informado.",
        successTitle: "Falta só mais um passo: confirme seu e-mail.",
        successMessage:
          "Enviamos um e-mail de confirmação. Abra-o e clique no link para garantir sua vaga de acesso antecipado.",
        successReserveMessage:
          "Vamos reservar seu e-mail assim que você o validar.",
        alreadyExists:
          "{email} já está na lista de espera. Confira seu e-mail. Se isso parece errado, <supportLink>fale com o suporte</supportLink>.",
      },
      disclaimer: "Grátis para começar · Sem cartão de crédito",
      scrollToNextSection: "Rolar para a próxima seção",
      disciplinesAria: "Disciplinas bem-vindas",
      disciplines: {
        photography: "Fotografia",
        illustration: "Ilustração",
        painting: "Pintura",
        sculpture: "Escultura",
        tattoo: "Tatuagem",
        design: "Design",
        fashion: "Moda",
        animation: "Animação",
        digitalArt: "Arte digital",
        architecture: "Arquitetura",
        film: "Cinema",
      },
    },
    valuePillars: {
      header: {
        badge: "Por que A11STUDIO",
        title: "Feito por um artista para artistas",
        description:
          "Um espaço profissional para o seu trabalho — com a inteligência para impulsionar sua carreira e a simplicidade para nunca te atrasar.",
      },
      cta: "Traga sua arte",
      scrollToNextSection: "Rolar para a próxima seção",
      items: [
        {
          title: "Só arte",
          description: "Um espaço só para a {arte}. Sem ruído, sem distrações.",
        },
        {
          title: "Inteligência",
          description:
            "A {IA} cuida da parte técnica e chata. Você foca em criar.",
        },
        {
          title: "Foco",
          description:
            "Seu único trabalho é compartilhar o seu {melhor}. Do resto cuidamos nós.",
        },
        {
          title: "Comunidade",
          description:
            "Uma comunidade construída sobre bom {gosto}, não sobre tendências. Gente que valoriza o ofício, não o ruído.",
        },
        {
          title: "Qualidade",
          description:
            "Valorizamos a {qualidade} acima da quantidade, leve o tempo que precisar para enviar sua melhor arte.",
        },
        {
          title: "Clientes",
          description:
            "Conectamos as necessidades dos clientes aos {artistas} certos. Rápido, direto e confiável.",
        },
        {
          title: "Sem algoritmos",
          description:
            "Um bom trabalho {fala} por si só. Sem feeds, sem jogos, sem correr atrás de engajamento.",
        },
        {
          title: "Propriedade",
          description:
            "Um lar para o seu trabalho que {pertence} a você. Permanente, não alugado de uma plataforma.",
        },
        {
          title: "Simplicidade",
          description:
            "Tão fácil de {atualizar} quanto um post. Sem código, sem configuração.",
        },
        {
          title: "Ofício",
          description:
            "Feito para priorizar a {qualidade}, sempre. Uma grande obra merece uma grande apresentação.",
        },
        {
          title: "Descoberta",
          description:
            "Seja encontrado pelos clientes que importam. Visibilidade conquistada pelo {talento}, não por algoritmos.",
        },
        {
          title: "Tempo",
          description:
            "Menos tempo configurando, mais tempo {criando}. Cada minuto economizado volta para a sua arte.",
        },
        {
          title: "Credibilidade",
          description:
            "Uma presença profissional, sem a dor de cabeça técnica. Confiança conquistada desde a primeira {visita}.",
        },
        {
          title: "Elegância",
          description:
            "Um espaço minimalista onde a sua arte é a {protagonista}. Nada disputa a atenção.",
        },
        {
          title: "Confiança",
          description:
            "Uma forma rápida e confiável de encontrar {talento} de verdade. Sem apostas, sem horas perdidas.",
        },
      ],
    },
    socialProof: {
      highlights: [
        "Qualidade de site profissional, facilidade de rede social",
        "A IA escreve suas bios, tags e posicionamento",
        "Clientes te descobrem e falam com você diretamente",
      ],
      cta: "Comece grátis agora",
    },
    featureCategories: {
      header: {
        badge: "Explorar",
        title: "Categorias em destaque",
        description:
          "Descubra artistas por disciplina — cada caminho leva a resultados selecionados com critério.",
      },
      card: {
        browse: "Ver",
        ariaBrowseArtistsIn: "Ver artistas em",
      },
    },
    featuredArtists: {
      header: {
        badge: "Descobrir",
        title: "Artistas com quem você pode se conectar hoje",
        description:
          "Todo portfólio é uma linha direta entre artista e cliente. Explore, descubra e comece uma conversa.",
      },
      browseAll: "Ver todos os artistas",
    },
    featuredPortfolio: {
      header: {
        badge: "Destaque de portfólio",
        title: "Inspire-se com este portfólio",
        description:
          "Um portfólio real na A11STUDIO — com curadoria, polido e pronto para compartilhar.",
      },
      by: "Um portfólio de",
      viewProfile: "Ver o perfil de @{username}",
      exploreMore: "Inspire-se",
      scrollToNextSection: "Rolar para a próxima seção",
    },
    cta: {
      badge: "Quando você quiser",
      title: "Seu próximo cliente já está procurando alguém como você",
      description:
        "Crie um portfólio à altura do seu trabalho, em minutos. Cuidamos da tecnologia para você ficar com o ofício. Grátis para começar, sem cartão.",
      button: "Criar seu portfólio",
      waitListButton: "Traga sua arte",
    },
    howItWorks: {
      badge: "Como funciona",
      title: "Do upload ao seu primeiro cliente",
      description:
        "Um portfólio que constrói sua carreira, não só exibe seu trabalho.",
      steps: {
        organize: {
          title: "Organize e personalize",
          description:
            "Envie seu trabalho e organize-o em um portfólio impressionante. Personalize o layout como quem edita um post — sem código, sem fricção.",
        },
        ai: {
          title: "A IA te posiciona",
          description:
            "A IA gera sua bio, descrições e tags. Ela otimiza seu portfólio para mecanismos de busca para que as pessoas certas te encontrem.",
        },
        connect: {
          title: "Clientes se conectam",
          description:
            "Colecionadores, agências e colaboradores descobrem seu portfólio e entram em contato diretamente. Relacionamentos reais, sem intermediários.",
        },
      },
    },
  },
  faqs: {
    title: "Perguntas frequentes",
    stillHaveQuestions:
      "Ainda tem dúvidas? Estamos aqui para <link>ajudar</link>",
    viewAll: "Ver todas as perguntas",
    items: [
      {
        id: "what-is-a11studio",
        question: "O que é a A11STUDIO?",
        answer:
          "A A11STUDIO combina as melhores partes de um site de portfólio profissional com a simplicidade e a proximidade das redes sociais. Os sites tradicionais te dão controle total sobre como apresenta seu trabalho, enquanto as redes sociais tornam a publicação muito fácil. Em vez de te obrigar a escolher, a A11STUDIO oferece os dois: um lar profissional e polido para a sua arte, tão fácil de atualizar quanto postar um story. Saiba mais <a href='/about'>sobre nossa missão</a>.",
      },
      {
        id: "what-is-a-portfolio",
        question: "O que é um portfólio?",
        answer:
          "Um portfólio é sua seleção de destaque — uma vitrine cuidada do seu melhor trabalho dentro de uma disciplina ou estilo. Por exemplo, um portfólio de “Fotografia de Casamento” traria as fotos mais fortes de todos os casamentos que você já fotografou. É o que os clientes veem para avaliar sua habilidade e decidir te contratar.",
      },
      {
        id: "what-is-a-collection",
        question: "O que é uma coleção?",
        answer:
          "Uma coleção é um projeto ou evento específico agrupado — por exemplo, “Casamento de Maria e João 2024” reuniria todas as fotos entregues daquele ensaio. Enquanto um <a href='#what-is-a-portfolio'>portfólio</a> é a sua seleção do melhor ao longo de vários projetos, uma coleção é a forma de organizar o trabalho de um único job, sessão ou conjunto de obras.",
      },
      {
        id: "create-account",
        question: "Como posso criar uma conta?",
        answer:
          "Começar leva só um minuto. Acesse a <a href='/auth/register'>página de cadastro</a>, crie sua conta gratuita e configure seu perfil. Você monta seu primeiro portfólio em minutos — sem precisar programar, hospedar ou ter habilidades de web design. Se os cadastros estiverem temporariamente fechados, você pode entrar na lista de espera e avisaremos assim que sua vaga abrir.",
      },
      {
        id: "why-ai",
        question: "Por que a A11STUDIO usa IA?",
        answer:
          "Para que você possa focar no que faz de melhor — criar arte. Tudo o que é técnico acontece nos bastidores: nossa IA escreve <strong>títulos, descrições e tags otimizados para SEO</strong>, categoriza suas mídias automaticamente e gera texto alternativo para que buscadores e assistentes de IA te encontrem. Você nunca precisa aprender SEO ou marketing — só <a href='#position-profile'>suba suas melhores peças e complete seu perfil</a>, e deixe o público certo as descobrir.",
      },
      {
        id: "what-is-seo",
        question: "O que é SEO?",
        answer:
          "SEO (otimização para mecanismos de busca) é o que ajuda seu trabalho a aparecer quando alguém pesquisa no Google — ou pergunta a um assistente de IA como o ChatGPT — por um artista como você. Normalmente exige conhecimento técnico real, mas a <strong>A11STUDIO faz isso por você automaticamente</strong>, escrevendo títulos, descrições, tags e texto alternativo otimizados nos bastidores para que as pessoas certas encontrem seu portfólio. Sua parte é simplesmente <a href='#position-profile'>posicionar bem o seu perfil</a> — depois veja <a href='#why-ai'>como a nossa IA faz o resto</a>.",
      },
      {
        id: "position-profile",
        question: "Como posso posicionar meu perfil?",
        answer:
          "A A11STUDIO já faz a parte difícil por você — <strong>SEO, indexação nos buscadores e otimização acontecem automaticamente</strong>, e nossa IA escreve os títulos, descrições, tags e texto alternativo nos bastidores. Seu único trabalho é dar a ela material real e rico para trabalhar. Quanto mais completo e específico o seu perfil, mais provável que os clientes certos — e assistentes de IA como o ChatGPT ou as respostas de IA do Google — mostrem o seu trabalho. Veja como se posicionar bem:<ul><li><strong>Complete seu perfil e sua localização.</strong> Adicione seu nome, profissão e cidade — a localização impulsiona a descoberta local, para que clientes que procuram um artista por perto te encontrem.</li><li><strong>Escolha as categorias que combinam com o seu trabalho.</strong> Selecione suas disciplinas e estilos com honestidade; é assim que os clientes filtram e que os buscadores entendem o que você faz.</li><li><strong>Suba suas melhores peças com títulos e descrições reais.</strong> Dê a cada peça um título claro e específico e uma breve descrição — a IA as enriquece, mas precisa de detalhe genuíno (tema, estilo, lugar) para construir.</li><li><strong>Adicione um banner e miniaturas caprichadas.</strong> São a primeira coisa que os visitantes — e os cartões de compartilhamento nas redes — veem; uma imagem polida faz as pessoas ficarem.</li><li><strong>Preencha seus serviços.</strong> Liste o que você oferece e os detalhes que um cliente precisa para te contratar — os serviços miram buscas de alta intenção, prontas para comprar.</li><li><strong>Escreva sua página Sobre.</strong> Sua história e experiência criam a confiança que transforma um visitante em cliente.</li><li><strong>Organize seus portfólios e coleções.</strong> Mantenha seus <a href='#what-is-a-portfolio'>portfólios</a> com o melhor e suas <a href='#what-is-a-collection'>coleções</a> por projeto organizados para que os visitantes entendam na hora o seu trabalho.</li></ul>Faça isso e a A11STUDIO cuida de tudo o que é técnico por cima — você nunca precisa aprender SEO. Ainda em dúvida? <a href='/support'>Fale com a gente</a>.",
      },
      {
        id: "get-clients",
        question: "Como posso conseguir clientes?",
        answer:
          "A A11STUDIO foi feita para conectar artistas às pessoas que valorizam o seu trabalho. A melhor forma de atrair clientes é <strong>completar seu perfil, mostrar seus portfólios mais fortes e adicionar serviços claros</strong> para que quem está pronto para contratar veja exatamente o que você oferece. Mantenha tudo organizado para que os visitantes entendam na hora o seu trabalho. A plataforma cuida da descoberta — SEO e indexação — para que os clientes (e os assistentes de IA) que procuram o seu tipo de trabalho te encontrem. Garanta que seu <a href='#position-profile'>perfil esteja bem posicionado</a> para ter o maior alcance.",
      },
      {
        id: "upload-videos",
        question: "Posso subir vídeos?",
        answer:
          "Ainda não — por enquanto a A11STUDIO suporta imagens e foi projetada para exibi-las lindamente. O suporte a vídeo está no nosso roadmap para uma versão futura, para que cineastas, animadores e artistas do movimento também possam apresentar seu trabalho aqui. Quer ser avisado quando chegar? <a href='/support'>Entre em contato</a>.",
      },
      {
        id: "is-free",
        question: "A A11STUDIO é gratuita?",
        answer:
          "Sim. A A11STUDIO oferece um plano gratuito que permite criar seu perfil, montar portfólios e começar a mostrar seu trabalho imediatamente. Os planos premium desbloqueiam recursos extras, como ferramentas com IA, mais armazenamento e personalização avançada — mas você pode começar de graça e fazer upgrade só se precisar.",
      },
    ],
    page: {
      metadata: {
        title: "Perguntas frequentes — A11STUDIO",
        description:
          "Respostas às perguntas mais comuns sobre a A11STUDIO — o que é, portfólios, criar uma conta, IA, posicionar seu perfil e preços.",
      },
      hero: {
        label: "Perguntas frequentes",
        title: "Perguntas frequentes",
        lead: "Tudo o que você precisa saber sobre a A11STUDIO — o que é, como começar e como ela ajuda as pessoas certas a descobrirem seu trabalho.",
      },
      navLabel: "Nesta página",
    },
  },
  about: {
    metadata: {
      title: "Sobre — A11STUDIO",
      description:
        "Conheça a A11STUDIO — a plataforma de portfólios que combina sites profissionais com a facilidade das redes sociais, feita por um artista para artistas.",
    },
    hero: {
      label: "Sobre",
      title: "A plataforma de portfólios feita para artistas",
      lead: "A A11STUDIO reúne o acabamento de um site de portfólio profissional com a simplicidade das redes sociais — para você nunca ter que escolher entre os dois.",
    },
    what: {
      title: "O que é a A11STUDIO?",
      paragraphs: [
        "Sites tradicionais dão aos artistas controle total sobre como apresentam seu trabalho. As redes sociais tornam a publicação sem esforço e ajudam a construir comunidade. A A11STUDIO nasceu para unir esses dois mundos.",
        "Em vez de forçar artistas a escolher entre um portfólio bonito ou uma plataforma fácil de usar, a A11STUDIO oferece os dois. Removemos as barreiras técnicas — você constrói um portfólio profissional em minutos enquanto a plataforma cuida do SEO, otimização e manutenção nos bastidores.",
      ],
    },
    bridge: {
      title: "O melhor dos dois mundos",
      websiteLabel: "O que um site tradicional oferece",
      websiteItems: [
        "Uma presença online profissional",
        "Um portfólio que fortalece sua marca pessoal",
        "Projetos e galerias organizados",
        "Melhor visibilidade em buscadores",
        "Um lar permanente para sua arte, que você possui",
      ],
      socialLabel: "O que as redes sociais oferecem",
      socialItems: [
        "Publicação de conteúdo extremamente fácil",
        "Criação rápida de perfil sem precisar programar",
        "Configuração técnica mínima",
        "Atualizações dinâmicas de conteúdo",
        "Uma comunidade em torno do seu trabalho",
      ],
      closing:
        "Sites são poderosos, mas geralmente exigem conhecimento técnico, SEO, hospedagem e manutenção contínua. Muitos artistas só querem criar arte — não passar horas aprendendo tecnologia. A A11STUDIO fecha essa lacuna.",
    },
    mission: {
      title: "Nossa missão",
      statement:
        "Ajudar artistas a gastar menos tempo lidando com tecnologia e mais tempo criando arte com significado.",
      body: "Artistas não deveriam se preocupar com SEO, indexação de busca, otimização de site, código ou configurações complexas. Sua única tarefa é criar e compartilhar seu melhor trabalho. A A11STUDIO cuida de todo o resto.",
    },
    vision: {
      title: "Nossa visão",
      paragraphs: [
        "Acreditamos que artistas merecem uma plataforma pensada para suas necessidades — não para algoritmos. Com frequência demais, obras incríveis ficam enterradas sob feeds intermináveis, tendências e métricas de engajamento.",
        "Aqui, a obra é sempre a protagonista. Cada decisão de design, cada funcionalidade e cada seção é construída com um objetivo: mostrar a arte da melhor forma possível.",
      ],
    },
    values: {
      title: "Nossos valores",
      items: [
        {
          title: "Feito por um artista, para artistas",
          description:
            "A A11STUDIO não foi criada por uma empresa tentando entrar na indústria criativa. Foi construída por alguém que entende as frustrações de ser artista. Cada funcionalidade existe porque resolve um problema real.",
        },
        {
          title: "A arte vem primeiro",
          description:
            "A plataforma não é projetada para maximizar tempo de tela. É projetada para maximizar a apresentação do seu trabalho. A interface se mantém limpa, elegante e livre de distrações para que os visitantes foquem no que importa: sua arte.",
        },
        {
          title: "A tecnologia deve desaparecer",
          description:
            "A tecnologia deve empoderar artistas — não sobrecarregá-los. SEO, desenvolvimento web, otimização de performance e manutenção do site acontecem todos nos bastidores.",
        },
        {
          title: "Tempo é valioso",
          description:
            "Artistas deveriam investir seu tempo criando, não configurando sites. A A11STUDIO automatiza o máximo possível para que cada minuto economizado vire mais um minuto fazendo arte.",
        },
        {
          title: "Conectando artistas e clientes",
          description:
            "Um portfólio deve fazer mais do que exibir trabalho — deve criar oportunidades. A A11STUDIO ajuda artistas a se apresentarem profissionalmente enquanto facilita que clientes descubram grandes talentos.",
        },
      ],
    },
    why: {
      title: "Por que a A11STUDIO existe",
      intro:
        "As redes sociais modernas recompensam a postagem constante em vez de portfólios com significado. Artistas frequentemente se sentem pressionados a criar conteúdo para algoritmos em vez de arte que realmente amam. Sites tradicionais resolvem esse problema, mas trazem outro: são difíceis de construir e manter.",
      items: [
        "O profissionalismo de um site pessoal",
        "A simplicidade das redes sociais",
        "A descoberta do SEO",
        "A facilidade de publicar conteúdo",
        "Uma experiência bonita, desenhada especificamente para artistas",
      ],
    },
    who: {
      title: "Para quem é",
      intro: "A A11STUDIO é para artistas que:",
      items: [
        "Querem um portfólio online bonito",
        "Valorizam seu tempo",
        "Não querem aprender desenvolvimento web",
        "Querem ser descobertos por clientes",
        "Se importam com apresentação e qualidade",
        "Preferem criar arte em vez de gerenciar tecnologia",
      ],
      closing:
        "Seja você fotógrafo, cineasta, ilustrador, pintor, designer, escultor, ou qualquer outro profissional criativo, a A11STUDIO ajuda seu trabalho a se destacar.",
    },
    philosophy: {
      title: "Como decidimos",
      question: "Isso ajuda artistas a mostrar melhor o próprio trabalho?",
      answer:
        "Se a resposta for sim, faz parte. Se não, não faz. A plataforma existe para servir artistas — não o contrário.",
    },
    creator: {
      title: "Sobre o criador",
      paragraphs: [
        "Oi, eu sou o Thiago. Sou engenheiro de software, mas antes de tudo, sou artista. Fotografia e cinema sempre foram minhas maiores paixões.",
        "Depois de anos criando conteúdo para redes sociais, senti que estava trabalhando para algoritmos em vez de para mim mesmo. O burnout me fez me afastar da arte por completo — e, eventualmente, me levou à programação, onde descobri uma nova forma de construir coisas que ajudam as pessoas.",
        "A ideia de uma plataforma para fotógrafos e artistas nunca me deixou. No verão de 2025, comecei a A11STUDIO — combinando arte, design, fotografia, cinema e programação em um único produto.",
        "A A11STUDIO não é só mais um projeto. É a plataforma que eu sempre quis que existisse quando era um artista tentando compartilhar meu trabalho com o mundo.",
      ],
    },
    cta: {
      title: "Pronto para mostrar seu trabalho?",
      description:
        "Crie um portfólio profissional em minutos. Grátis para começar — sem necessidade de cartão de crédito.",
      button: "Começar",
    },
  },
  language: "Idioma",
  error: {
    title: "Algo deu errado",
    description:
      "Encontramos um erro inesperado. Tente novamente ou volte para o início.",
    tryAgain: "Tentar novamente",
    backToHome: "Voltar para o início",
  },
  siteHeader: {
    openNavigation: "Abrir navegação",
    closeNavigation: "Fechar navegação",
    navigation: "Navegação",
  },
  waitListDialog: {
    title: "As inscrições estão fechadas no momento",
    description:
      "Entre na lista de espera e seja um dos primeiros a entrar na A11STUDIO.",
  },
  footer: {
    tagline: "A plataforma de portfólios feita para artistas.",
    cta: {
      getStarted: "Começar",
    },
    legal: {
      heading: "Legal",
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      cookies: "Política de Cookies",
    },
    contact: {
      heading: "Contato",
      about: "Sobre",
      faqs: "Perguntas frequentes",
      support: "Suporte",
    },
    social: {
      heading: "Redes sociais",
      instagram: "A11STUDIO no Instagram",
      linkedin: "A11STUDIO no LinkedIn",
    },
    copyright: "© {year} A11STUDIO. Todos os direitos reservados.",
  },
  search: {
    segments: {
      artists: "Artistas",
      portfolios: "Portfólios",
      ariaLabel: "Tipo de busca",
    },
    headerArtistSearch: {
      placeholder: "Buscar artistas…",
      ariaLabel: "Buscar artistas",
      registrationClosedToast:
        "A busca de artistas está indisponível enquanto o cadastro está fechado. Entre na lista de espera para ter acesso antecipado.",
    },
    page: {
      description:
        "Explore artistas na A11STUDIO. Descubra portfólios, serviços e profissionais criativos.",
      title: "Artistas — A11STUDIO",
      errorHeading: "Não conseguimos carregar {segment}",
      errorMessage:
        "Algo deu errado durante a busca. Tente novamente em instantes.",
      searchingFor: "Buscando {segment}",
      results: {
        foundArtists:
          "{count, number} {count, plural, one {artista encontrado} other {artistas encontrados}}{suffix}",
        foundPortfolios:
          "{count, number} {count, plural, one {portfólio encontrado} other {portfólios encontrados}}{suffix}",
        forQuery: ' para "{query}"',
      },
      empty: {
        heading: "Nenhum {segment} encontrado{suffix}",
        output:
          "Seus filtros não corresponderam a nenhum {segment}. Tente ampliar sua busca{end}",
        lookNear: " ou procure {segment} perto de você.",
      },
    },
    filters: {
      activeFilters: "Filtros ativos",
      clearAll: "Limpar tudo",
      searchAria: "Buscar {segment}",
      searchPlaceholder: "Buscar {segment} por nome, estilo, categoria…",
      searchButton: "Buscar",
      removeFilter: "Remover filtro {label}",
      categoryFallback: "Categoria #{id}",
      badge: {
        search: "Busca: {value}",
        geoLocation: "Minha localização",
        country: "País: {value}",
        state: "Estado: {value}",
        city: "Cidade: {value}",
      },
    },
    nearMe: {
      gettingLocation: "Obtendo localização…",
      nearMe: "Perto de mim · {radius} km",
      searchClose: "Buscar perto de mim",
      locationDenied:
        "Ative a localização nas configurações do navegador e tente novamente.",
      locationUnavailable:
        "Não conseguimos obter sua localização. Tente novamente.",
    },
    primaryFilters: {
      categories: "Categorias",
      location: "Localização",
      categoriesAndLocation: "Categorias e localização",
      ariaLabel: "Filtros de categorias e localização",
      useMyLocation: "Usar minha localização",
    },
    locationFilter: {
      ariaLabel: "Filtros de localização",
      country: "País",
      state: "Estado / região",
      city: "Cidade",
    },
    combobox: {
      placeholder: "Buscar…",
      empty: {
        pending: "",
        noMatches: "Nenhuma correspondência.",
        noItems: "—",
        searchingCategories: "Digite para buscar categorias.",
      },
    },
    artistCard: {
      openProfile: "Abrir perfil: {name}, @{username}",
      specialtiesTitle: "Especialidades",
      locationDetailsTitle: "Detalhes de localização no perfil",
      noLocationTitle: "Localização não informada",
      viewAction: "Ver",
    },
  },
  support: {
    contactLabel: "Contatar suporte",
    title: "Precisa de ajuda? Envie uma mensagem.",
    description:
      "Conte o que está acontecendo e escolha o melhor assunto para agilizarmos seu atendimento. Nossa equipe responderá ao e-mail que você fornecer.",
    formContainer: {
      nameLabel: "Nome",
      namePlaceholder: "Seu nome",
      emailLabel: "E-mail",
      emailPlaceholder: "seu@email.com",
      subjectLabel: "Assunto",
      messageLabel: "Mensagem",
      messagePlaceholder: "Conte como podemos ajudar...",
      submitButton: "Enviar ao suporte",
      successToast: "Sua mensagem foi enviada ao suporte.",
    },
    unavailable: {
      heading: "Suporte temporariamente indisponível",
      description:
        "Não conseguimos carregar o formulário de suporte agora. Tente novamente em instantes.",
    },
    subjects: [
      { value: "General question", label: "Dúvida geral" },
      { value: "Technical issue", label: "Problema técnico" },
      { value: "Billing and plans", label: "Cobrança e planos" },
      { value: "Account access", label: "Acesso à conta" },
      { value: "Feature request", label: "Sugestão de funcionalidade" },
      { value: "Partnership", label: "Parceria" },
    ],
  },
  waitListValidate: {
    metadata: {
      title: "Validar E-mail - A11STUDIO",
      description:
        "Valide seu endereço de e-mail para confirmar sua vaga na lista de espera.",
    },
    page: {
      label: "Lista de espera",
      title: "E-mail confirmado.",
      description:
        "Seu lugar na lista de espera está reservado. Não há mais nada a fazer — vamos te avisar assim que for a sua vez.",
      status: "Acesso antecipado, antes de abrirmos ao público.",
      benefit: {
        label: "Seu benefício",
        tiers: {
          VIP: "Membro fundador",
          EARLY_USER: "Membro de acesso antecipado",
          FOUNDER: "Fundador",
        },
        line: "{tier} — {months} meses grátis.",
      },
    },
  },
  subscriptionCallback: {
    success: {
      title: "Ativação concluída.",
      subtitle: "Sua assinatura já está ativa.",
    },
    failed: {
      title: "Ativação incompleta.",
      subtitle:
        "Não conseguimos ativar sua assinatura. Por favor, tente novamente.",
    },
    tryAgain: "Tentar novamente",
    continue: "Continuar",
    skipForNow: "Pular por agora",
    cancel: "Cancelar",
  },
  benefitSubscriptionDialog: {
    trigger: "Resgatar benefício",
    title: "Resgate seu benefício",
    description:
      "Como <name>{label}</name>, aproveite <free>{months, plural, one {# mês grátis} other {# meses grátis}}</free> no plano {planName}.",
    noPayment:
      "Nenhum dado de pagamento necessário. Seu <access>acesso gratuito de {months, plural, one {# mês} other {# meses}}</access> é ativado instantaneamente.",
    plan: "Plano",
    billingCycle: "Ciclo de cobrança",
    freePeriod: "Período gratuito",
    freeMonths: "{months, plural, one {# mês} other {# meses}}",
    subscribe: "Assinar",
    activatingTitle: "Ativando seu benefício",
    activatingSubtitle: "Configurando sua assinatura…",
    errorTitle: "Algo deu errado",
    billingTypes: {
      MONTHLY: "Mensal",
      QUARTERLY: "Trimestral",
      YEARLY: "Anual",
      LIFETIME: "Vitalício",
    },
    benefitTypes: {
      EARLY_USER: "Usuário antecipado",
      VIP: "VIP",
      FOUNDER: "Fundador",
    },
  },
  auth: {
    login: {
      title: "Olá de novo",
      subtitle: "Entre para ter acesso à sua conta",
      problemWithLogin: "Problema para entrar?",
      agreePrefix: "Ao entrar, você concorda com nossos",
      termsOfService: "Termos de Serviço",
      and: "e",
      privacyPolicy: "Política de Privacidade",
      emailLabel: "Endereço de e-mail",
      emailPlaceholder: "voce@exemplo.com",
      passwordLabel: "Senha",
      passwordPlaceholder: "Digite sua senha",
      submit: "Entrar",
    },
    register: {
      title: "Crie sua conta",
      subtitle: "E comece a construir o portfólio dos seus sonhos",
      alreadyHaveAccount: "Já tem uma conta?",
      emailLabel: "Endereço de e-mail",
      emailPlaceholder: "voce@exemplo.com",
      usernameLabel: "Nome de usuário",
      usernamePlaceholder: "nomeusuario",
      passwordLabel: "Senha *",
      passwordPlaceholder: "Digite sua senha",
      submit: "Cadastrar",
    },
    twoFa: {
      titleValidateEmail: "Valide seu e-mail",
      titleDeviceVerification: "Verificação do dispositivo",
      codeSentTo: "Enviamos um código de verificação para",
      havingTrouble: "Está com dificuldades?",
      backToLogin: "Voltar ao login",
      codePlaceholder: "Digite o código de 6 dígitos",
    },
    passwordRecovery: {
      title: "Recuperação de senha",
      subtitle: "Digite seu e-mail e enviaremos um link de recuperação",
      rememberPassword: "Lembra da sua senha?",
      needHelp: "Precisa de ajuda?",
      contactSupport: "Contatar suporte",
      emailLabel: "Endereço de e-mail",
      emailPlaceholder: "seu@email.com",
      submit: "Enviar",
      checkEmailTitle: "Confira seu e-mail",
      checkEmailSubtitle:
        "Enviamos um link de recuperação de senha para o seu endereço de e-mail",
      didntReceiveEmail: "Não recebeu o e-mail?",
      rememberPasswordShort: "Lembra da senha?",
      tryAgain: "Tentar novamente",
      tryAgainIn: "Tente novamente em",
      setNewPasswordTitle: "Definir nova senha",
      setNewPasswordSubtitle: "Escolha uma senha forte para a sua conta",
      changedYourMind: "Mudou de ideia?",
      backToSignIn: "Voltar para entrar",
      newPasswordLabel: "Nova senha",
      newPasswordPlaceholder: "Digite sua nova senha",
      resetSubmit: "Redefinir senha",
      successTitle: "Senha atualizada com sucesso",
      successSubtitle:
        "Sua senha foi alterada. Agora você pode entrar com a nova senha.",
      continueToSignIn: "Continuar para entrar",
    },
    expiresIn: {
      remaining:
        "Você tem {minutes, plural, =0 {} one {# minuto} other {# minutos}}{minutes, plural, =0 {} other { e }}{seconds, plural, one {# segundo} other {# segundos}} restantes",
    },
  },
  getStarted: {
    stepOf: "Etapa {current} de {total}",
    steps: {
      profile: {
        title: "Complete seu perfil",
        subtitle: "Conte um pouco sobre você para começar",
      },
      photo: {
        title: "Selecione sua foto de perfil",
        subtitle: "Esta será a sua imagem para potenciais clientes",
      },
      categories: {
        title: "Selecione até 5 categorias",
        subtitle: "Essas categorias ajudarão seu perfil a ser descoberto",
      },
      location: {
        title: "Adicione sua localização",
        subtitle: "Ajude clientes a descobrirem seu perfil pela localização",
      },
      plan: {
        title: "Escolha seu plano",
        subtitle: "Selecione o plano ideal para a sua jornada criativa",
      },
    },
    actions: {
      continue: "Continuar",
      finish: "Concluir",
      continueWithoutBenefits: "Continuar sem benefícios",
      tryAgainLater: "Tentar novamente mais tarde",
      stepBack: "Voltar",
      somethingWentWrong: "Algo deu errado",
    },
  },
  plans: {
    card: {
      popular: "Popular",
      bestValue: "Melhor custo-benefício",
      getStarted: "Começar",
      goPlan: "Ir para {planName}",
    },
    price: {
      free: "Grátis",
      from: "a partir de",
      perMonth: "/mês",
    },
    features: {
      unlimited: "Ilimitado",
      ofMediaStorage: "de armazenamento de mídia",
      projects: "Projetos",
      portfolios: "Portfólios",
      services: "Serviços",
      clients: "Clientes",
      mediaCompression: "Compressão de mídia",
      mediaCompressionTooltip:
        "Escolha o nível de compressão preferido ao enviar fotos. Equilibre qualidade de imagem e tamanho do arquivo para otimizar armazenamento e tempo de carregamento.",
      aiCredits: "Créditos de IA",
      aiCreditsTooltip:
        "Use a IA para automatizar tarefas repetitivas. Gere automaticamente títulos, descrições e tags para suas mídias com base na análise de conteúdo, economizando tempo e esforço.",
    },
    portal: {
      loading: "Carregando…",
      manageSubscription: "Gerenciar sua assinatura",
    },
  },
  changeSubscriptionDialog: {
    processing: "Processando...",
    errorTitle: "Algo deu errado",
    thisPlanIncludes: "Este plano inclui:",
    billingCycle: "Ciclo de cobrança",
    total: "Total",
    perMonth: "/mês",
    billed: "cobrado {billingType}",
    paymentMethod: "Método de pagamento",
    completePayment: "Concluir pagamento",
    trustPaymentAlt: "pagamento seguro",
  },
  userBenefitModal: {
    title: "Você tem um presente esperando",
    description:
      "Como <name>{label}</name> você ganha <free>{months, plural, one {# mês grátis} other {# meses grátis}}</free>.",
    claimBelow: "Resgate logo abaixo. Vamos te guiar para obter o benefício",
    claimAfterSetup:
      "Assim que você concluir a configuração de boas-vindas, vamos te guiar para obter o benefício.",
    claimNow: "Resgatar agora",
    maybeLater: "Talvez depois",
    gotItThanks: "Entendi, obrigado.",
  },
  userAccountBanned: {
    title: "Conta suspensa",
    description: "Sua conta foi suspensa devido a violações das políticas.",
    restrictionsLiftedOn: "As restrições serão removidas em {date}.",
    contactSupport: "Fale com o suporte se achar que isso é um engano",
    logout: "Sair",
  },
  emailPreferences: {
    metadata: {
      title: "Preferências de e-mail - A11STUDIO",
      description:
        "Atualize os tipos de e-mail que você deseja receber da A11STUDIO.",
    },
    page: {
      eyebrow: "Preferências de e-mail",
      title: "Gerencie as preferências da sua caixa de entrada",
      subtitle:
        "Escolha as atualizações que deseja manter, e nós respeitaremos sua escolha.",
    },
    form: {
      toastUpdated: "Preferências atualizadas",
      managingFor: "Gerenciando preferências de",
      marketingLabel: "E-mails de marketing",
      marketingDescription:
        "Novidades do produto, lançamentos e atualizações ocasionais.",
      notificationsLabel: "Notificações",
      notificationsDescription:
        "Alertas da conta e avisos relevantes da plataforma.",
      waitlistLabel: "Atualizações da lista de espera",
      waitlistDescription:
        "Atualizações sobre o progresso da lista de espera e mudanças de acesso.",
      save: "Salvar preferências",
    },
  },
  webHeader: {
    accessProfile: "Acessar perfil",
    goToAtelier: "Ir para o Atelier",
    signIn: "Entrar",
    openAtelier: "Abrir Atelier",
    tagline: "A plataforma de portfólios feita para artistas.",
  },
  editUser: {
    banner: {
      alt: "Banner",
      editTitle: "Editar banner",
      preview: "Prévia do banner:",
      previewAlt: "Prévia do banner",
    },
    avatar: {
      editTitle: "Editar avatar",
      preview: "Prévia do perfil:",
      previewAlt: "Prévia do perfil",
      alt: "Avatar do usuário",
    },
    profile: {
      editTitle: "Editar perfil",
      professionFallback: "Título profissional",
      biographyFallback: "Biografia curta",
      firstName: {
        label: "Nome",
        placeholder: "Leonardo",
      },
      lastName: {
        label: "Sobrenome",
        placeholder: "Piero da Vinci",
      },
      profession: {
        label: "Profissão",
        placeholder: "Polímata renascentista e sonhador profissional",
      },
      shortBio: {
        label: "Biografia curta sobre você",
        placeholder:
          "Esboço máquinas voadoras no café da manhã e disseco a curiosidade para viver...",
      },
    },
    address: {
      editTitle: "Editar endereço",
      noAddress: "Nenhum endereço definido",
      updateDescription: "Atualize suas informações de endereço abaixo.",
      warningDescription:
        "Atenção: atualizar seu endereço pode afetar sua descoberta e visibilidade nos resultados de busca. Atualize apenas se realmente precisar",
    },
    categories: {
      title: "Categorias",
      editTitle: "Editar categorias",
    },
    contact: {
      title: "Contato e links",
      editTitle: "Editar contato e links",
      description:
        "Adicione um telefone e links sociais para que os clientes possam falar com você. Todos os campos são opcionais — deixe um vazio para removê-lo.",
      empty: "Ainda não há dados de contato.",
      phone: {
        label: "Telefone",
        placeholder: "+34 684 317 619",
        hint: "Inclua o código do país, ex.: +34. De 9 a 15 dígitos.",
      },
      instagram: {
        label: "Instagram",
        placeholder: "https://instagram.com/seuusuario",
      },
      facebook: {
        label: "Facebook",
        placeholder: "https://facebook.com/suapagina",
      },
      youtube: {
        label: "YouTube",
        placeholder: "https://youtube.com/@seucanal",
      },
      website: {
        label: "Site",
        placeholder: "https://seuestudio.com",
      },
    },
    update: "Atualizar",
  },
  addressForm: {
    label: "Endereço",
    searchPlaceholder: "Busque seu endereço…",
    searching: "Buscando localizações…",
    noLocations: "Nenhuma localização encontrada.",
    minCharsHint: "Digite pelo menos 3 caracteres para buscar.",
    saving: "Salvando endereço…",
  },
  userCategories: {
    searchLabel: "Buscar uma categoria",
    searchPlaceholder: "design...",
    clickHint: "Clique nas categorias que você quiser",
    noResults: "Nenhum resultado",
    loadMore: "mais",
    disciplinesTitle: "Disciplinas",
    artStylesTitle: "Estilos artísticos",
    visibilityHint:
      "Escolher poucas categorias (recomendamos 1–3) melhora a sua visibilidade.",
  },
  artists: {
    shareProfile: "Compartilhar perfil",
    breadcrumb: {
      goBack: "Voltar",
    },
    header: {
      atelier: "Atelier",
      contact: "Contato",
      menu: "Menu",
      nav: {
        portfolios: "Portfólios",
        collections: "Coleções",
        services: "Serviços",
        about: "Sobre",
      },
    },
    contactDialog: {
      contactButton: "Contato",
      contactTitle: "Contatar {name}",
      contactTitleFallback: "Contato",
      description: "Envie uma mensagem diretamente para este artista.",
      selfContact: "Você não pode contatar a si mesmo.",
      form: {
        nameLabel: "Nome",
        namePlaceholder: "Seu nome",
        emailLabel: "E-mail",
        emailPlaceholder: "seu@email.com",
        subjectLabel: "Assunto",
        subjectPlaceholder: "Pedido de encomenda",
        messageLabel: "Mensagem",
        messagePlaceholder: "Conte ao artista sobre seu projeto...",
        submit: "Enviar mensagem",
      },
      successToast: "Mensagem enviada com sucesso.",
    },
    sections: {
      portfolios: "Portfólios",
      collections: "Coleções",
      services: "Serviços",
      viewAll: "Ver tudo",
      viewAllPortfolios: "Ver todos os portfólios",
      viewAllCollections: "Ver todas as coleções",
      viewAllServices: "Ver todos os serviços",
      emptyState: {
        title: "{name} ainda não publicou nenhum trabalho.",
        subtitle:
          "Volte em breve, ou entre em contato para começar uma conversa.",
        cta: "Entrar em contato",
      },
    },
    notFound: {
      heading: "Artista não encontrado",
      description:
        "O perfil que você procura não existe ou pode ter sido removido.",
      backHome: "Voltar ao início",
    },
    resourceNotFound: {
      heading: "Recurso não encontrado",
      backToProfile: "Voltar ao perfil",
      portfolio:
        "O portfólio que você procura não existe ou pode ter sido removido.",
      collection:
        "A coleção que você procura não existe ou pode ter sido removida.",
      service:
        "O serviço que você procura não existe ou pode ter sido removido.",
      media: "A mídia que você procura não existe ou pode ter sido removida.",
    },
    profile: {
      getInTouch: "Entrar em contato",
      aboutHeading: "Sobre {name}",
      connect: "Conectar",
      phoneLabel: "Ligar para {name}",
      websiteLabel: "Visitar o site de {name}",
      instagramLabel: "{name} no Instagram",
      facebookLabel: "{name} no Facebook",
      youtubeLabel: "{name} no YouTube",
      summaryProfessionLocation:
        "{name}, {profession} com base em {location}, apresenta seus portfólios, coleções e serviços na A11STUDIO.",
      summaryProfession:
        "{name}, {profession}, apresenta seus portfólios, coleções e serviços na A11STUDIO.",
      summaryLocation:
        "{name}, com base em {location}, apresenta seus portfólios, coleções e serviços na A11STUDIO.",
      summaryFallback:
        "{name} apresenta seus portfólios, coleções e serviços na A11STUDIO.",
    },
    editAria: {
      editPortfolio: "Editar portfólio",
      editCollection: "Editar coleção",
      editService: "Editar serviço",
      editMedia: "Editar mídia",
      editAboutPage: "Editar página Sobre",
    },
    portfolios: {
      pageTitle: "Portfólios",
      metaDescription:
        "Explore os portfólios de {name} no A11STUDIO — coleções selecionadas dos seus melhores trabalhos.",
      empty: "Ainda não há portfólios.",
      galleryEmpty: "Este portfólio está vazio no momento.",
    },
    collections: {
      pageTitle: "Coleções",
      metaDescription:
        "Explore as coleções de {name} no A11STUDIO — conjuntos selecionados do seu trabalho.",
      empty: "Ainda não há coleções.",
      galleryEmpty: "Esta coleção está vazia no momento.",
    },
    services: {
      pageTitle: "Serviços",
      metaDescription:
        "Conheça os serviços oferecidos por {name} no A11STUDIO e entre em contato para colaborar.",
      empty: "Ainda não há serviços.",
      whatsIncluded: "O que está incluído",
      terms: "Termos",
      relatedPortfolio: "Portfólio relacionado",
    },
    about: {
      notShared: "Este artista ainda não compartilhou sua história.",
      heading: "Sobre",
      getInTouch: "Entrar em contato",
    },
    media: {
      untitled: "Sem título",
      editAria: "Editar mídia",
    },
    fullscreen: {
      enter: "Ver em tela cheia",
      exit: "Sair da tela cheia",
    },
  },
  validation: {
    required: "{field} é obrigatório",
    invalid: "{field} inválido",
    tooLong: "{field} é muito longo",
    minLength: "{field} deve ter pelo menos {min} caracteres",
    maxLength: "{field} deve ter no máximo {max} caracteres",
    email: {
      invalid: "E-mail inválido",
    },
    slug: {
      tooShort: "O slug deve ter pelo menos 3 caracteres",
      invalidFormat:
        "O slug deve conter apenas letras minúsculas, números e hífens",
    },
    avatarUrlInvalid: "URL de avatar inválida",
    fallbackUrlInvalid: "URL de retorno inválida",
    thumbnailRequired: "A miniatura é obrigatória",
    maxCategories: "Portfólios podem ter até {max} categorias",
    maxPortfolioItems: "Portfólios podem ter até {max} itens",
    minCollectionMedia: "É necessário pelo menos um item de mídia",
    maxCollectionMedia: "Coleções podem ter até {max} mídias",
    file: {
      tooLarge: "{field} deve ter menos de {mb}MB",
      invalidType: "{field} deve ser uma imagem (JPEG, PNG ou WebP)",
    },
    aboutPage: {
      titleType: "O título deve ser um texto válido",
      titleMin: "O título deve ter pelo menos 5 caracteres",
      titleMax: "O título deve ter menos de 255 caracteres",
      descriptionRequired:
        "A descrição é obrigatória e deve ser um texto válido",
      descriptionType: "A descrição deve ser um texto válido",
      descriptionMin: "A descrição deve ter pelo menos 20 caracteres",
      descriptionMax: "A descrição deve ter menos de 1000 caracteres",
      userIdRequired:
        "O ID do usuário é obrigatório e deve ser um número válido",
      userIdPositive: "O ID do usuário deve ser um número positivo",
    },
    auth: {
      invalidEmail: "E-mail inválido",
      invalidPassword: "Senha inválida",
      invalidUsername: "Nome de usuário inválido",
      usernameAllowedChars:
        "O nome de usuário só pode conter letras, números, sublinhados e hífens",
      invalidCode: "Código inválido",
      codeLength: "O código deve ter {length} dígitos",
      invalidFallbackUrl: "URL de retorno inválida",
    },
    subscription: {
      urlMustBeAppOrigin: "A URL deve pertencer ao domínio do app",
    },
    service: {
      featureTitleRequired: "O título do recurso é obrigatório",
      termTitleRequired: "O título do termo é obrigatório",
    },
    emailPreference: {
      tokenRequired: "Token ausente",
    },
    user: {
      usernameAlphanumeric:
        "O nome de usuário deve ser alfanumérico e sem espaços",
      passwordMustContainNumber: "A senha deve conter pelo menos um número",
      passwordNoSpaces: "A senha não pode conter espaços",
    },
    phone: {
      invalid:
        "Insira um telefone válido, ex.: +34684317619 ou 684317619 (9–15 dígitos).",
    },
    url: {
      instagram:
        "Insira uma URL do Instagram válida, ex.: https://instagram.com/seuusuario",
      facebook:
        "Insira uma URL do Facebook válida, ex.: https://facebook.com/suapagina",
      youtube:
        "Insira uma URL do YouTube válida, ex.: https://youtube.com/@seucanal",
      website: "Insira uma URL válida começando com https://",
    },
  },
  fields: {
    title: "Título",
    name: "Nome",
    surname: "Sobrenome",
    subject: "Assunto",
    message: "Mensagem",
    artistId: "ID do artista",
    username: "Nome de usuário",
    password: "Senha",
    profession: "Profissão",
    biography: "Biografia",
    shortBiography: "Biografia curta",
    currentPassword: "Senha atual",
    newPassword: "Senha",
    thumbnail: "Miniatura",
    avatar: "Avatar",
    banner: "Banner",
    photo: "Foto",
    file: "Arquivo",
    userId: "ID do usuário",
    mediaId: "ID da mídia",
    phoneNumber: "Telefone",
    instagramLink: "Link do Instagram",
    facebookLink: "Link do Facebook",
    youtubeLink: "Link do YouTube",
    websiteLink: "Link do site",
  },
  portfolios: {
    toastCreated: "Portfólio criado com sucesso",
    toastUpdated: "Portfólio atualizado com sucesso",
  },
  atelier: {
    common: {
      viewPublicPage: "Ver página pública",
      cancel: "Cancelar",
      save: "Salvar",
      update: "Atualizar",
      create: "Criar",
      close: "Fechar",
      add: "Adicionar",
      loading: "Carregando...",
      loadMore: "Carregar mais",
      blocked: "Bloqueado",
      editingCollection: "Editando coleção",
      creatingCollection: "Criando coleção",
      editingPortfolio: "Editando portfólio",
      creatingPortfolio: "Criando portfólio",
      editingService: "Editando serviço",
      creatingService: "Criando serviço",
      planLimitReached: "Limite do plano atingido",
      planLimitDescription:
        "Você usou <strong>{count}</strong> de <strong>{limit}</strong> {label} permitidos no seu plano atual. Faça upgrade do seu plano para criar mais, ou gerencie seus {label} existentes.",
      goBack: "Voltar",
      upgradePlan: "Fazer upgrade do plano",
      planLimitToast:
        "Você atingiu o limite do seu plano para {label} ({count}/{limit}). Faça upgrade do seu plano para criar mais.",
      logout: "Sair",
      logoutConfirmTitle: "Sair",
      logoutConfirmDescription:
        "Tem certeza de que deseja sair? Você precisará fazer login novamente para acessar sua conta.",
      completeProfileTitle: "Complete seu perfil",
      completeProfileDescription:
        "Está quase lá. Complete a configuração do seu perfil para desbloquear todos os recursos e ter a melhor experiência.",
      continueSettingUp: "Continuar configuração",
      skipForNow: "Pular por agora",
      metrics: {
        noDataAvailable: "Nenhum dado disponível",
        media: "Mídia",
        storage: "Armazenamento",
        clients: "Clientes",
        portfolios: "Portfólios",
        collections: "Coleções",
        projects: "Projetos",
        services: "Serviços",
        aiCredits: "Créditos de IA",
        planSuffix: "Plano",
      },
      submit: {
        updateCollectionTitle: "Atualizar coleção",
        saveCollectionTitle: "Salvar coleção",
        updateCollectionDescription:
          "Suas alterações serão salvas e aplicadas à sua coleção ativa.",
        createCollectionDescription:
          "Sua coleção será criada e salva na sua conta.",
        updatePortfolioTitle: "Atualizar portfólio",
        savePortfolioTitle: "Salvar portfólio",
        updatePortfolioDescription:
          "Suas alterações serão salvas e aplicadas ao seu portfólio ativo.",
        createPortfolioDescription:
          "Seu portfólio será criado e salvo na sua conta.",
        updateServiceLabel: "Atualizar serviço",
        createServiceLabel: "Criar serviço",
        updateServiceTitle: "Atualizar serviço",
        createServiceTitle: "Criar serviço",
        updateServiceDescription:
          "Suas alterações serão salvas e aplicadas ao seu serviço ativo.",
        createServiceDescription:
          "Seu serviço será criado e salvo na sua conta.",
      },
    },
    portfolios: {
      pageTitle: "Portfólios",
      pageInfo:
        "Portfólios representam categorias amplas do seu trabalho, como 'Fotografia de Viagem' ou 'Fotografia de Casamento'. Eles são feitos para mostrar suas melhores peças aos clientes e podem incluir tanto mídias individuais quanto coleções.",
      createButtonLabel: "Criar portfólio",
      emptyStateDescription:
        "Ainda não há portfólios criados. Comece agrupando seu trabalho.",
      loadError: "Algo deu errado",
      createTitle: "Criar um portfólio",
      editTitlePrefix: "Editar: {title}",
      blockedBadge: "Bloqueado",
      deletePortfolio: {
        ariaLabel: "Excluir portfólio",
        title: "Excluir portfólio",
        description:
          "<strong>{title}</strong> será excluído permanentemente. Isso não pode ser desfeito.",
        cancel: "Cancelar",
        delete: "Excluir",
        successToast: "Portfólio excluído",
      },
      form: {
        blockedNotice:
          "Este portfólio foi bloqueado. Você pode revisá-lo aqui, mas não pode editá-lo até que o bloqueio seja removido.",
        back: "Voltar",
        next: "Próximo",
        stepOf: "Etapa {current} de {total}",
        thumbnailHint:
          "Adicione uma imagem de miniatura para o seu portfólio (obrigatório)",
        thumbnailAlt: "Prévia da miniatura",
        titleLabel: "Título",
        titlePlaceholder: "Meu portfólio",
        slugLabel: "Slug",
        slugPlaceholder: "meu-portfolio",
        slugInfo:
          "Um slug é uma versão do seu título compatível com URL (ex.: 'meu-portfolio-incrivel'). Deve ser único, pois é usado na URL do portfólio para identificá-lo e facilitar sua localização.",
        slugChecking: "Verificando disponibilidade...",
        slugAvailable: "✓ Este slug está disponível",
        slugTaken: "✗ Este slug já está em uso",
        slugInvalidFormat: "✗ Formato de slug inválido. Exemplo: meu-portfolio",
        slugChangeWarning:
          "É melhor não alterar o slug depois de definido — alterá-lo muda o seu link público, então os links existentes para esta página podem parar de funcionar.",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Descreva seu portfólio...",
        categoriesLabel: "Categorias",
        categoriesCountHint:
          "{count} / {max} categorias · Opcional. Selecione categorias que descrevam este portfólio.",
        categoriesVisibilityHint:
          "Escolher poucas categorias (recomendamos 1–3) melhora a sua visibilidade.",
        disciplinesLabel: "Disciplinas",
        artStylesLabel: "Estilos artísticos",
        disciplinesCountHint: "{count} / {max} disciplinas",
        artStylesCountHint: "{count} / {max} estilos artísticos",
        showOnProfile: "Mostrar na página de perfil",
        showOnProfileInfo:
          "Quando ativado, este portfólio é destacado no seu perfil público de artista para que os visitantes o encontrem mais facilmente. Você pode destacar até {limit} portfólios na sua página de perfil.",
        highlightLimitReached:
          "Você atingiu o limite de {limit} portfólios destacados na sua página de perfil.",
        active: "Ativo",
        activeInfo:
          "Quando desativado, este portfólio fica oculto do seu perfil público de artista e das listagens. Você ainda pode editá-lo no atelier.",
      },
      items: {
        noItems: "Nenhuma mídia ou coleção adicionada ainda",
        itemsCountLabel: "{count} / {limit} itens",
        dragToReorder: "· Arraste para reordenar",
        countInfo:
          "Esta contagem inclui cada mídia que você adiciona diretamente, mais cada item de mídia dentro de qualquer coleção que você adicionar. Por exemplo, uma coleção com 10 imagens conta como 10 itens do limite de {limit}.",
        removeItem: "Remover {label}",
        untitled: "Sem título",
      },
      layout: {
        label: "Layout",
        info: "O layout se adapta ao tamanho da tela do visitante.",
        columnsInfo:
          "Para o layout em colunas, o número escolhido é o máximo usado em telas grandes. Dispositivos menores mostram menos colunas — até {mobile} no celular e {tablet} no tablet — então uma escolha de {max} colunas ainda mostra apenas {mobile} em um celular.",
        ariaGroup: "Layout do portfólio",
        previewAria: "Pré-visualizar layout",
        editSettingsAria: "Editar configurações de layout",
        previewTitle: "Pré-visualização do layout",
        previewDescription:
          "Uma prévia dos seus itens selecionados usando o layout {layoutName}. O resultado se adapta ao tamanho da tela do visitante.",
        previewEmpty: "Adicione itens para pré-visualizar o layout.",
        settingsTitle: "Configurações de layout",
        settingsDescription:
          "Escolha quantas colunas mostrar em telas grandes. Dispositivos menores usam menos automaticamente.",
        columns: "Colunas",
        selectedFallback: "selecionado",
      },
    },
    services: {
      pageTitle: "Serviços",
      pageInfo:
        "Serviços são as ofertas que você fornece aos seus clientes, como 'Fotografia de Casamento' ou 'Design Web'.",
      createButtonLabel: "Criar serviço",
      emptyStateDescription:
        "Ainda não há serviços criados. Comece adicionando o que você oferece aos clientes.",
      loadError: "Algo deu errado",
      createTitle: "Criar um serviço",
      editTitlePrefix: "Editar: {title}",
      toastCreated: "Serviço criado com sucesso",
      toastUpdated: "Serviço atualizado com sucesso",
      form: {
        blockedNotice:
          "Este serviço foi bloqueado. Você pode revisá-lo aqui, mas não pode editá-lo até que o bloqueio seja removido.",
        slugChecking: "Verificando disponibilidade...",
        slugAvailable: "✓ Este slug está disponível",
        slugTaken: "✗ Este slug já está em uso",
        titleLabel: "Título",
        titlePlaceholder: "Fotografia de retrato",
        slugLabel: "Slug",
        slugPlaceholder: "fotografia-de-retrato",
        slugInfo:
          "Identificador compatível com URL. Apenas letras minúsculas, números e hífens.",
        slugInvalidFormat:
          "✗ Formato de slug inválido. Exemplo: fotografia-de-retrato",
        slugChangeWarning:
          "É melhor não alterar o slug depois de definido — alterá-lo muda o seu link público, então os links existentes para esta página podem parar de funcionar.",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Descreva seu serviço...",
        priceLabel: "Preço",
        priceInfo: "O preço é opcional, deixe em 0.",
        showPrice: "Mostrar preço",
        active: "Ativo",
        showOnProfile: "Mostrar na página de perfil",
        showOnProfileInfo:
          "Quando ativado, este serviço é destacado no seu perfil público de artista para que os visitantes o encontrem mais facilmente. Você pode destacar até {limit} serviços na sua página de perfil.",
        highlightLimitReached:
          "Você atingiu o limite de {limit} serviços destacados na sua página de perfil.",
        thumbnailLabel: "Miniatura",
        thumbnailAlt: "Prévia da miniatura",
        featuresLabel: "Recursos",
        featuresPlaceholder: "ex. sessão de 2 horas",
        termsLabel: "Termos",
        termsPlaceholder: "ex. depósito de 50% necessário",
        portfolioLinkLabel: "Vincular a um portfólio (Opcional)",
        portfolioSelectPlaceholder: "Selecione um portfólio...",
        portfolioLinkInfo:
          "Vincule um portfólio para que os clientes vejam fotos relacionadas a este serviço.",
      },
    },
    collections: {
      pageTitle: "Coleções",
      pageInfo:
        "Coleções são conjuntos simples de mídia relacionada, agrupados por um evento ou tema específico, como 'O Casamento do João' ou 'Marrocos 2026'.",
      createButtonLabel: "Criar coleção",
      emptyStateDescription:
        "Ainda não há coleções criadas. Comece adicionando um conjunto de mídia relacionada.",
      loadError: "Algo deu errado",
      createTitle: "Criar uma coleção",
      editTitlePrefix: "Editar: {title}",
      toastCreated: "Coleção criada com sucesso",
      toastUpdated: "Coleção atualizada com sucesso",
      drawer: {
        addCollection: "Adicionar coleção",
        title: "Adicionar coleção",
        refreshAria: "Atualizar coleções",
        hint: "Clique para adicionar ao seu portfólio · {count} disponíveis",
        alreadyAdded: "Já adicionada",
        addToPortfolio: "Adicionar ao portfólio",
        itemCount: "{count, plural, one {# item} other {# itens}}",
        emptyTitle: "Ainda não há coleções",
        emptySubtitle: "Crie sua primeira coleção para começar",
        itemsSelected:
          "{count, plural, one {# item selecionado} other {# itens selecionados}}",
      },
      deleteCollection: {
        ariaLabel: "Excluir coleção",
        title: "Excluir coleção",
        description:
          "<strong>{title}</strong> será excluída permanentemente. Isso não pode ser desfeito.",
        cancel: "Cancelar",
        delete: "Excluir",
        successToast: "Coleção excluída",
      },
      form: {
        blockedNotice:
          "Esta coleção foi bloqueada. Você pode revisá-la aqui, mas não pode editá-la até que o bloqueio seja removido.",
        titleLabel: "Título",
        titlePlaceholder: "Minha coleção",
        slugLabel: "Slug",
        slugPlaceholder: "minha-colecao",
        slugInfo:
          "Um slug é uma versão do seu título compatível com URL (ex.: 'minha-colecao-incrivel'). Deve ser único, pois é usado na URL da coleção.",
        slugChecking: "Verificando disponibilidade...",
        slugAvailable: "✓ Este slug está disponível",
        slugTaken: "✗ Este slug já está em uso",
        slugInvalidFormat: "✗ Formato de slug inválido. Exemplo: minha-colecao",
        slugChangeWarning:
          "É melhor não alterar o slug depois de definido — alterá-lo muda o seu link público, então os links existentes para esta página podem parar de funcionar.",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Descreva sua coleção...",
        showOnProfile: "Mostrar na página de perfil",
        showOnProfileInfo:
          "Quando ativado, esta coleção é destacada no seu perfil público de artista para que os visitantes a encontrem mais facilmente. Você pode destacar até {limit} coleções na sua página de perfil.",
        highlightLimitReached:
          "Você atingiu o limite de {limit} coleções destacadas na sua página de perfil.",
        active: "Ativo",
        activeInfo:
          "Quando desativado, esta coleção fica oculta do seu perfil público de artista e das listagens. Você ainda pode editá-la no atelier.",
      },
      media: {
        sectionLabel: "Mídia",
        dragToReorder: "· Arraste para reordenar",
        countInfo:
          "Cada item de mídia que você adiciona a esta coleção conta para este limite. Você pode incluir até {limit} itens no total.",
        countLabel: "{count} / {limit} mídias",
        noMedia: "Nenhuma mídia adicionada ainda",
        removeMedia: "Remover {label}",
        mediaFallback: "mídia",
        untitled: "Sem título",
      },
    },
    media: {
      pageTitle: "Mídia",
      tabs: {
        overallInfo: "Informações gerais",
        seo: "SEO",
      },
      upload: {
        maxFilesError:
          "É permitido um máximo de {max} arquivos. Você pode adicionar mais {remaining}.",
        globalCompression: "Compressão global",
        compressionTooltipTitle: "Nível de compressão",
        compressionTooltipBody:
          "Controla o equilíbrio entre qualidade de imagem e tamanho do arquivo. Compressão menor (VERY_LOW, LOW) preserva mais detalhes, mas cria arquivos maiores. Compressão maior (HIGH, VERY_HIGH) reduz o tamanho, mas pode reduzir levemente a qualidade.",
        compressionTooltipHint:
          "Essa configuração se aplica a todos os arquivos enviados. Você pode ajustar arquivos individuais usando os controles abaixo.",
        allFiles: "Todos os arquivos",
        upgradeRequired: "Upgrade necessário:",
        upgradeRequiredBody:
          "O controle de compressão não está disponível no seu plano atual. Faça upgrade para acessar este recurso.",
        aiSeoGeneration: "Gerar metadados",
        aiSeoTooltipBody:
          "O SEO (otimização para mecanismos de busca) ajuda seu trabalho a ser encontrado no Google e no Google Imagens. Usa IA para analisar a imagem e gerar um título, uma descrição, um texto alternativo e um nome de arquivo artísticos e ricos em palavras-chave, e a marca automaticamente com as categorias correspondentes.",
        aiSeoCreditsHint:
          "Custa 1 crédito de IA por imagem. Você tem {count} {count, plural, one {crédito} other {créditos}} restantes.",
        creditsLabel: "{count} {count, plural, one {crédito} other {créditos}}",
        noCreditsTitle: "Sem créditos de IA:",
        noCreditsBody:
          "Você usou todos os seus créditos de IA. Faça upgrade do seu plano ou aguarde a próxima renovação.",
        filesCount: "{count}/{max} arquivos",
        maxReached: "Limite atingido",
        compressionLabel: "Compressão",
        upgradeToAdjust: "Faça upgrade do plano para ajustar",
        previewAlt: "Prévia {index}",
        createNewMedia: "Criar nova mídia",
        uploadUpToImages: "Envie até {max} imagens (JPEG, PNG, WebP)",
        uploadButton: "Enviar",
        close: "Fechar",
        createMedia: "Criar mídia",
        addMedia: "Adicionar mídia",
        storageFullTitle: "Armazenamento cheio: {used} / {limit} GB utilizados",
        uploadInProgress: "Envio em andamento...",
      },
      card: {
        deleteFailed: "Falha ao excluir a mídia",
        titleLabel: "Título",
        titlePlaceholder: "Digite o título",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Digite a descrição",
        seoTitleLabel: "Título SEO",
        seoTitlePlaceholder: "Digite o título SEO",
        seoTitleInfo:
          "O título que aparece nos resultados de busca e nas abas do navegador. Ajuda a melhorar a visibilidade nas buscas.",
        seoDescriptionLabel: "Descrição SEO",
        seoDescriptionPlaceholder: "Digite a descrição SEO",
        seoDescriptionInfo:
          "Um breve resumo que aparece nos resultados de busca. Ajuda os usuários a entender do que se trata a imagem antes de clicar.",
        altTextLabel: "Texto alternativo",
        altTextPlaceholder: "Digite o texto alternativo para acessibilidade",
        altTextInfo:
          "Uma descrição textual da imagem para leitores de tela e quando as imagens não carregam. Melhora a acessibilidade e o SEO.",
        filenameLabel: "Nome do arquivo",
        filenamePlaceholder: "Digite o nome do arquivo",
        filenameInfo:
          "Nome de arquivo SEO definido automaticamente no upload ou ao gerar metadados com IA. Não é editável.",
        lastUpdated: "Última atualização",
        noPreview: "Sem prévia",
        altFallback: "Mídia de {username}",
        untitled: "Sem título",
        editMedia: "Editar mídia",
        mediaPreview: "Prévia da mídia",
        generateSeo: "Gerar metadados",
        noCreditsAvailable:
          "Nenhum crédito de IA disponível. Você precisa de pelo menos 1 crédito para gerar metadados. Faça upgrade do seu plano ou aguarde a renovação dos créditos.",
        generateSeoTooltip:
          "O SEO (otimização para mecanismos de busca) ajuda seu trabalho a ser encontrado no Google e no Google Imagens. Usa IA para analisar a imagem e gerar um título, uma descrição, um texto alternativo e um nome de arquivo artísticos e ricos em palavras-chave, e a marca automaticamente com as categorias correspondentes.",
        noCreditsSuffix: " (Sem créditos)",
        delete: "Excluir",
        deleteConfirm: "Tem certeza de que deseja excluir esta mídia?",
        cancel: "Cancelar",
        discardTitle: "Descartar alterações?",
        discardBody:
          "Tem certeza de que deseja cancelar? Todas as alterações não salvas serão perdidas.",
        keepEditing: "Continuar editando",
        discardChanges: "Descartar alterações",
        saveChanges: "Salvar alterações",
        edit: "Editar",
        close: "Fechar",
      },
      grid: {
        generateSeoCount: "Gerar metadados ({count})",
        generateSeoTitle: "Gerar metadados com IA",
        generateSeoDescription:
          "Gerar metadados com IA para {count} {count, plural, one {mídia selecionada} other {mídias selecionadas}}?",
        creditsAvailable: "Créditos disponíveis:",
        creditsNeeded: "Créditos necessários:",
        overAiLimit: "Limite: selecione até {max} itens (remova {excess}).",
        insufficientCredits:
          "Créditos insuficientes. Você precisa de mais {needed} créditos.",
        cancel: "Cancelar",
        selectMedia: "Selecionar mídia",
        cancelSelection: "Cancelar seleção",
        noMediaFiltered:
          "Nenhuma mídia encontrada, tente outra combinação de filtros",
        noMediaEmpty:
          "Nenhuma mídia enviada ainda. Comece adicionando sua primeira imagem.",
        updateItems:
          "Atualizar {count} {count, plural, one {item} other {itens}}",
        confirmUpdatesTitle: "Confirmar atualizações",
        confirmUpdatesDescription:
          "Tem certeza de que deseja atualizar {count} {count, plural, one {mídia} other {mídias}}? Esta ação salvará todas as alterações pendentes.",
        updateAll: "Atualizar tudo",
      },
      search: {
        placeholder: "Buscar mídia…",
        all: "Todos",
      },
      drawer: {
        addMedia: "Adicionar mídia",
        title: "Adicionar mídia",
        refreshAria: "Atualizar mídia",
        filterAll: "Todos",
        hint: "Clique para adicionar ao seu portfólio · {count} disponíveis",
        hintMax: "· até {max} itens",
        alreadyAdded: "Já adicionada",
        addToPortfolio: "Adicionar ao portfólio",
        emptyTitle: "Ainda não há mídia",
        emptySubtitle: "Envie sua primeira imagem para começar",
        itemsSelected:
          "{count, plural, one {# item selecionado} other {# itens selecionados}}",
        itemsSelectedWithMax:
          "{count} / {max} {count, plural, one {item} other {itens}} selecionados",
      },
      uploadStatus: {
        uploadComplete: "Envio concluído",
        uploadingFiles: "Enviando arquivos",
        remaining: "{count} restantes",
        success: "sucesso",
        failed: "falhou",
        allComplete: "Tudo concluído",
        queued: "Na fila...",
        uploading: "Enviando...",
        updating: "Atualizando...",
        generatingSeo: "Gerando SEO...",
        deleting: "Excluindo...",
        uploaded: "Enviado",
        updated: "Atualizado",
        seoGenerated: "SEO gerado",
        deleted: "Excluído",
        failedFallback: "Falhou",
        preparingUpload: "Preparando envio...",
        previewAlt: "Prévia",
        noPreview: "Sem prévia",
        unknownFile: "Arquivo desconhecido",
      },
    },
    home: {
      pageTitle: "Painel",
    },
    nav: {
      dashboard: "Painel",
      home: "Início",
      media: "Mídia",
      collections: "Coleções",
      portfolios: "Portfólios",
      services: "Serviços",
      about: "Sobre",
      settings: "Configurações",
      closeMenuAria: "Fechar menu",
    },
    topNav: {
      openMenuAria: "Abrir menu",
      expandSidebarAria: "Expandir barra lateral",
      collapseSidebarAria: "Recolher barra lateral",
      upgrade: "Fazer upgrade",
      viewProfile: "Ver perfil",
    },
    about: {
      pageTitle: "Página Sobre",
      pageInfo:
        "Compartilhe sua trajetória, sua jornada artística e tudo mais que você gostaria que seu público soubesse sobre você.",
      emptyStateDescription:
        "Ainda não há uma página Sobre criada. Compartilhe sua trajetória e sua jornada artística.",
      form: {
        createButton: "Criar página Sobre",
        editButton: "Editar página Sobre",
        createTitle: "Criar página Sobre",
        updateTitle: "Atualizar página Sobre",
        titleLabel: "Título",
        titlePlaceholder: "A história por trás da tela",
        descriptionLabel: "Descrição",
        descriptionPlaceholder:
          "Compartilhe sua jornada como artista. O que te inspira? O que impulsiona sua visão criativa? Deixe os visitantes se conectarem com a pessoa por trás da arte...",
        createSubmit: "Criar",
        updateSubmit: "Atualizar",
        photoPreview: "Prévia da foto:",
        photoPreviewAlt: "Prévia da foto",
        choosePhotoHint:
          "Escolha uma foto (preferencialmente sua) para exibir na sua página Sobre.",
        photoAlt: "Foto da página Sobre",
      },
    },
    settings: {
      pageTitle: "Configurações",
      account: {
        heading: "Conta",
        usernameInfo:
          "Seu nome de usuário aparece na sua URL pública. Escolha algo curto e memorável — você não poderá alterá-lo com frequência.",
        usernameLabel: "Nome de usuário",
        emailLabel: "E-mail",
      },
      language: {
        heading: "Idioma",
        description: "Escolha o idioma do seu painel",
      },
      security: {
        heading: "Segurança",
        passwordLabel: "Senha",
        passwordDescription: "Atualize a senha da sua conta",
      },
      subscription: {
        heading: "Assinatura",
        trial: "Teste",
        freeTrialEnds: "O período de teste termina em {date}",
        renews: "Renova em {date}",
        cancels: "Cancela em {date}",
        onFreePlan: "Você está no plano gratuito",
        upgrade: "Fazer upgrade",
        change: "Alterar",
        freePlanName: "Gratuito",
      },
      changePlan: {
        pageTitle: "Alterar plano",
        backToSettings: "Voltar às Configurações",
        alreadyOnBest: "Você já está no plano mais completo.",
        currentPlanIs:
          "Seu plano atual é <strong>{planName}</strong> — não há nada superior para fazer upgrade agora.",
        currentPlanFallback: "seu plano atual",
        goBackToSettings: "Voltar às Configurações",
        cancel: "Cancelar",
      },
      changePassword: {
        triggerLabel: "Alterar senha",
        title: "Alterar senha",
        description: "Digite sua senha atual e escolha uma nova.",
        monthlyLimitReached: "Limite mensal atingido",
        usedAllChanges:
          "Você usou todas as {max} alterações de senha permitidas para este período.",
        availableAgainOn: "Disponível novamente em <strong>{date}</strong>.",
        currentPasswordLabel: "Senha atual",
        newPasswordLabel: "Nova senha",
        newPasswordInfo: "8–20 caracteres, pelo menos um número, sem espaços",
        remainingChanges:
          "{remaining} de {max} {remaining, plural, one {alteração} other {alterações}} restantes este mês",
        resetsOn: " · renova em {date}",
        submit: "Atualizar senha",
        successToast: "Senha atualizada com sucesso.",
      },
      changeUsername: {
        title: "Alterar nome de usuário",
        description: "Escolha um novo nome de usuário para sua conta.",
        monthlyLimitReached: "Limite mensal atingido",
        usedAllChanges:
          "Você usou todas as {max} alterações de nome de usuário permitidas para este período.",
        availableAgainOn: "Disponível novamente em <strong>{date}</strong>.",
        newUsernameLabel: "Novo nome de usuário",
        newUsernameInfo: "3–20 caracteres, apenas letras e números",
        remainingChanges:
          "{remaining} de {max} {remaining, plural, one {alteração} other {alterações}} restantes este mês",
        resetsOn: " · renova em {date}",
        submit: "Atualizar nome de usuário",
        successToast: "Nome de usuário atualizado com sucesso.",
      },
    },
  },
  actions: {
    unauthorized: "Não autorizado",
    slugAlreadyExists: "O slug já existe",
    genericError: "Algo deu errado. Tente novamente mais tarde.",
    formDataRequired: "Os dados do formulário são obrigatórios",
    passwordRecoveryCooldown:
      "Você precisa esperar 1 minuto e 30 segundos antes de tentar novamente",
    noFieldsToUpdate: "Nenhum campo para atualizar",
    invalidMediaId: "ID de mídia inválido",
    unexpectedError: "Ocorreu um erro inesperado",
    userIdAndMediaIdRequired: "user_id e media_id são obrigatórios",
  },
} satisfies Messages;

export default messages;
