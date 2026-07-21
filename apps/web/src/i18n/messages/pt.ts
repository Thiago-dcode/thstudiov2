import type { Messages } from "./en";

const messages = {
  landing: {
    hero: {
      titlePrefix: "Deixe sua",
      titleAccent: "arte",
      titleSuffix: "ser descoberta.",
      subtitle:
        "Tenha um site profissional com a mesma facilidade de atualizar suas redes sociais.",
      primaryCtaLoggedIn: "Acessar o Atelier",
      primaryCtaLoggedOut: "Comece grátis agora",
      secondaryCta: "Encontrar artistas",
      waitList: {
        hook: "Entre na lista de espera para ter acesso antecipado ao app.",
        label: "Entre na lista de espera para artistas",
        placeholder: "Digite seu endereço de e-mail",
        button: "Entrar na lista",
        buttonPending: "Entrando...",
        hint: "Entre na lista de espera, ganhe acesso antecipado e benefícios",
        hintTooltip:
          "As vagas antecipadas são limitadas e preenchidas na ordem em que os artistas entram.",
        successToast:
          "Você está na lista de espera. Vamos te manter informado.",
        successTitle: "Falta só mais um passo: confirme seu e-mail.",
        successMessage:
          "Enviamos um e-mail de confirmação. Abra-o e clique no link para garantir sua vaga de acesso antecipado.",
        successReserveMessage:
          "Vamos reservar seu e-mail assim que você o validar.",
        alreadyExists:
          '{email} já está na lista de espera. Confira seu e-mail. Se isso parece errado, <supportLink>fale com o suporte</supportLink>.',
      },
      disclaimer: "Grátis para começar · Sem cartão de crédito",
      scrollToNextSection: "Rolar para a próxima seção",
    },
    valuePillars: {
      header: {
        badge: "Por que A11STUDIO",
        title: "Feito por um artista para artistas",
        description:
          "Um espaço profissional para o seu trabalho — com a inteligência para impulsionar sua carreira e a simplicidade para nunca te atrasar.",
      },
      items: [
        {
          title: "Seu site. Fácil como uma rede social.",
          description:
            "Parece e funciona como um site personalizado — mas você reorganiza, atualiza e publica tão rápido quanto postar um story. Organize toda sua obra com beleza, sem tocar em uma linha de código.",
        },
        {
          title: "A IA faz o trabalho pesado",
          description:
            "Deu branco na hora de escrever sua bio? Deixe a IA gerar. Precisa de descrições, tags ou SEO? A IA escreve, otimiza e posiciona seu portfólio para que o público certo te encontre — não o contrário.",
        },
        {
          title: "Feito para conexões reais",
          description:
            "Isso não é um feed que esconde seu trabalho. Clientes, colecionadores e colaboradores chegam ao seu portfólio e falam com você diretamente. Uma plataforma pensada para a relação entre artista e cliente.",
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
      by: "Criado por",
      viewProfile: "Ver o perfil de @{username}",
      exploreMore: "Inspire-se",
    },
    cta: {
      badge: "Pronto para começar?",
      title: "Seu próximo cliente está procurando por alguém como você",
      description:
        "Crie um portfólio impressionante em minutos, deixe a IA cuidar do resto e comece a ser descoberto. Grátis para começar — sem cartão, sem pegadinha.",
      button: "Criar seu portfólio",
      waitListButton: "Entrar na lista de espera",
    },
  },
  faqs: {
    title: "Perguntas frequentes",
    stillHaveQuestions: "Ainda tem dúvidas? Estamos aqui para <link>ajudar</link>",
    items: [
      {
        question: "O que é a A11STUDIO?",
        answer:
          "A A11STUDIO é uma plataforma de portfólios feita para artistas visuais que fica entre um site profissional e a facilidade das redes sociais. Você tem um site polido e com cara personalizada — mas atualizá-lo é tão simples quanto postar um story. Sem código, sem habilidades de web design, só arrastar, soltar e publicar.",
      },
      {
        question: "O que é um portfólio?",
        answer:
          'Um portfólio é sua seleção de destaque — uma vitrine cuidada do seu melhor trabalho dentro de uma disciplina ou estilo. Por exemplo, um portfólio de "Fotografia de Casamento" traria as fotos mais fortes de todos os casamentos que você já fotografou. É o que os clientes veem para avaliar sua habilidade e te contratar.',
      },
      {
        question: "O que é uma coleção?",
        answer:
          'Uma coleção é um projeto ou evento específico agrupado. Por exemplo, "Casamento de Maria e João 2024" seria uma coleção com todas as fotos entregues daquele ensaio. É como você organiza trabalhos individuais, sessões ou conjuntos de obras.',
      },
      {
        question: "Qual é a diferença entre um portfólio e uma coleção?",
        answer:
          'Um portfólio é o seu melhor de si — uma vitrine que abrange vários projetos para demonstrar sua expertise em uma disciplina (ex.: "Fotografia de Casamento"). Uma coleção é um único projeto ou evento (ex.: "Casamento de Maria e João 2024"). Pense no portfólio como o que te contrata e na coleção como a forma de organizar cada trabalho.',
      },
      {
        question: "Por que a A11STUDIO usa IA?",
        answer:
          "Para que você possa focar no que faz de melhor — criar arte. A IA cuida de tudo o resto nos bastidores: gera títulos, descrições e tags otimizados para SEO, categoriza suas mídias automaticamente e escreve texto alternativo para que buscadores e assistentes de IA te encontrem. Você nunca precisa aprender sobre SEO ou marketing — só suba suas melhores peças e a IA garante que o público certo as descubra.",
      },
      {
        question: "Posso usar a A11STUDIO de graça?",
        answer:
          "Sim! A A11STUDIO oferece um plano gratuito que permite criar seu perfil, montar portfólios e começar a mostrar seu trabalho imediatamente. Os planos premium desbloqueiam recursos adicionais, como ferramentas com IA, mais armazenamento e opções avançadas de personalização.",
      },
    ],
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
      support: "Suporte",
    },
    copyright: "© {year} A11STUDIO. Todos os direitos reservados.",
  },
  search: {
    segments: {
      artists: "Artistas",
      portfolios: "Portfólios",
    },
    headerArtistSearch: {
      placeholder: "Buscar artistas…",
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
      ariaLabel: "Filtros de categorias e localização",
      useMyLocation: "Usar minha localização",
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
      title: "E-mail validado!",
      description:
        "Obrigado! Seu e-mail foi validado. Enviaremos seu convite assim que estiver pronto.",
      status: "Está tudo certo.",
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
      successToast: "Mensagem enviada com sucesso!",
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
        subtitle: "Volte em breve, ou entre em contato para começar uma conversa.",
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
      media:
        "A mídia que você procura não existe ou pode ter sido removida.",
    },
    profile: {
      getInTouch: "Entrar em contato",
      aboutHeading: "Sobre {name}",
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
      empty: "Ainda não há portfólios.",
      galleryEmpty: "Este portfólio está vazio no momento.",
    },
    collections: {
      pageTitle: "Coleções",
      empty: "Ainda não há coleções.",
      galleryEmpty: "Esta coleção está vazia no momento.",
    },
    services: {
      pageTitle: "Serviços",
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
      userIdRequired: "O ID do usuário é obrigatório e deve ser um número válido",
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
        "Está quase lá! Complete a configuração do seu perfil para desbloquear todos os recursos e ter a melhor experiência.",
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
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Descreva seu portfólio...",
        categoriesLabel: "Categorias",
        categoriesCountHint:
          "{count} / {max} categorias · Opcional. Selecione categorias que descrevam este portfólio.",
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
        aiSeoGeneration: "Geração de SEO com IA",
        aiSeoTooltipBody:
          "Gera automaticamente título, descrição, texto alternativo e nome de arquivo SEO para cada imagem usando análise de visão por IA.",
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
        uploadButton: "Enviar!",
        close: "Fechar",
        createMedia: "Criar mídia",
        addMedia: "Adicionar mídia",
        storageFullTitle:
          "Armazenamento cheio: {used} / {limit} GB utilizados",
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
          "O nome do arquivo usado para fins de SEO. Pode ser editado para melhorar a visibilidade nas buscas.",
        lastUpdated: "Última atualização",
        noPreview: "Sem prévia",
        altFallback: "Mídia de {username}",
        untitled: "Sem título",
        editMedia: "Editar mídia",
        mediaPreview: "Prévia da mídia",
        generateSeo: "Gerar SEO",
        noCreditsAvailable:
          "Nenhum crédito de IA disponível. Você precisa de pelo menos 1 crédito para gerar metadados SEO. Faça upgrade do seu plano ou aguarde a renovação dos créditos.",
        generateSeoTooltip:
          "Gera automaticamente os campos SEO com IA. Analisa o conteúdo da sua imagem e gera títulos, descrições, textos alternativos e nomes de arquivo otimizados para melhor visibilidade em buscas.",
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
        generateSeoCount: "Gerar SEO ({count})",
        generateSeoTitle: "Gerar SEO com IA",
        generateSeoDescription:
          "Gerar metadados SEO com IA para {count} {count, plural, one {mídia selecionada} other {mídias selecionadas}}?",
        creditsAvailable: "Créditos disponíveis:",
        creditsNeeded: "Créditos necessários:",
        overAiLimit:
          "Limite: selecione até {max} itens (remova {excess}).",
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
    },
    home: {
      pageTitle: "Painel",
    },
    about: {
      pageTitle: "Página Sobre",
      pageInfo:
        "Compartilhe sua trajetória, sua jornada artística e tudo mais que você gostaria que seu público soubesse sobre você.",
      emptyStateDescription:
        "Ainda não há uma página Sobre criada. Compartilhe sua trajetória e sua jornada artística.",
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
        successToast: "Senha atualizada com sucesso!",
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
        successToast: "Nome de usuário atualizado com sucesso!",
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
