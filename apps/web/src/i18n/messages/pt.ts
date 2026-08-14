import type { Messages } from "./en";

const messages = {
  seo: {
    organizationDescription:
      "A11STUDIO é a plataforma de portfólios onde os artistas são descobertos — mostre seu trabalho e conecte-se com clientes, colecionadores e colaboradores.",
    defaultTitle: "A11STUDIO — Onde os artistas são descobertos",
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
          "Entre na lista de espera e faça parte dos primeiros usuários com acesso antecipado, que receberão benefícios exclusivos. A lista é limitada: assim que atingirmos o número máximo de vagas, ela será fechada. <learnMore>Como funciona</learnMore>",
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
            "Seu único trabalho é compartilhar o seu {melhor}. Nós cuidamos do resto.",
        },
        {
          title: "Comunidade",
          description:
            "Uma comunidade construída sobre bom {gosto}, não sobre tendências. Gente que valoriza o ofício, não o ruído.",
        },
        {
          title: "Qualidade",
          description:
            "Valorizamos a {qualidade} acima da quantidade: leve o tempo que precisar para enviar sua melhor arte.",
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
      badge: "Seja descoberto",
      title: "Menos tempo na preparação. Mais tempo no ofício.",
      description:
        "A A11STUDIO cuida do SEO, dos metadados e do posicionamento. Você envia seu melhor trabalho — nós cuidamos do resto.",
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
            "A IA gera sua bio, descrições e tags. Ela otimiza seu portfólio para mecanismos de busca, de modo que as pessoas certas te encontrem.",
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
          "Uma coleção é um projeto ou evento específico agrupado — por exemplo, “Casamento de Maria e João 2024” reuniria todas as fotos entregues daquele ensaio. Enquanto um <a href='#what-is-a-portfolio'>portfólio</a> é a sua seleção do melhor ao longo de vários projetos, uma coleção é a forma de organizar as peças de um único trabalho, sessão ou conjunto de obras.",
      },
      {
        id: "create-account",
        question: "Como posso criar uma conta?",
        answer:
          "Começar leva só um minuto. Acesse a <a href='/auth/register'>página de cadastro</a>, crie sua conta gratuita e configure seu perfil. Você monta seu primeiro portfólio em minutos — sem precisar programar, hospedar ou ter habilidades de web design. Se os cadastros estiverem temporariamente fechados, você pode <a href='#wait-list-how-it-works'>entrar na lista de espera</a> e avisaremos assim que sua vaga abrir.",
      },
      {
        id: "wait-list-how-it-works",
        question: "Como funciona a lista de espera?",
        answer:
          "Quando o cadastro está fechado, a lista de espera é o caminho para ter acesso antecipado à A11STUDIO. Este é o fluxo:<ul><li><strong>Entre com seu e-mail.</strong> Digite seu endereço no formulário da lista. Enviaremos um e-mail de confirmação na hora.</li><li><strong>Confirme seu e-mail.</strong> Abra a mensagem e clique no link. Sua vaga só é reservada depois da validação — até lá não travamos uma posição para você.</li><li><strong>Garanta seu lugar na fila.</strong> Sua posição é atribuída ao confirmar, na ordem em que as pessoas validam. Quem confirma antes desbloqueia benefícios de acesso antecipado mais fortes.</li><li><strong>Aguarde o convite.</strong> Quando for a sua vez, enviamos um link pessoal de cadastro. Você tem <strong>7 dias</strong> para criar a conta antes de o convite expirar; também enviamos lembretes antes do prazo.</li><li><strong>Cadastre-se e resgate.</strong> Use o link para criar sua conta. Seu benefício da lista (meses grátis no nosso plano superior) fica pronto para resgatar depois de entrar.</li></ul><p><strong>Condições</strong></p><ul><li>As vagas são limitadas. Ao atingirmos a capacidade, a lista de espera fecha.</li><li>A confirmação do e-mail é obrigatória. E-mails não confirmados não mantêm uma posição.</li><li>Os benefícios dependem da sua posição validada: os primeiros 50 membros confirmados tornam-se <strong>membros fundadores</strong> (6 meses grátis); quem confirma depois torna-se <strong>membro de acesso antecipado</strong> (3 meses grátis).</li><li>Cada convite é de uso único para o e-mail da lista e expira em 7 dias se não for usado.</li><li>Se você já está confirmado na lista, enviar o mesmo e-mail de novo não cria uma nova entrada — confira sua caixa de entrada, ou <a href='/support'>fale com o suporte</a> se algo parecer errado.</li></ul>",
      },
      {
        id: "why-ai",
        question: "Por que a A11STUDIO usa IA?",
        answer:
          "Para que você possa focar no que faz de melhor — criar arte. Tudo o que é técnico acontece nos bastidores: nossa IA escreve <strong>títulos, descrições e tags otimizados para SEO</strong>, categoriza suas mídias automaticamente e gera texto alternativo para que buscadores e assistentes de IA te encontrem. Você nunca precisa aprender SEO ou marketing — só <a href='#position-profile'>suba suas melhores peças e complete seu perfil</a>, e deixe que o público certo as descubra.",
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
          "A A11STUDIO já faz a parte difícil por você — <strong>SEO, indexação nos buscadores e otimização acontecem automaticamente</strong>, e nossa IA escreve os títulos, descrições, tags e texto alternativo nos bastidores. Seu único trabalho é dar a ela material real e rico para trabalhar. Quanto mais completo e específico o seu perfil, mais provável que os clientes certos — e assistentes de IA como o ChatGPT ou as respostas de IA do Google — mostrem o seu trabalho. Veja como se posicionar bem:<ul><li><strong>Complete seu perfil e sua localização.</strong> Adicione seu nome, profissão e cidade — a localização impulsiona a descoberta local, para que clientes que procuram um artista por perto te encontrem.</li><li><strong>Mantenha seu perfil focado em uma disciplina — ou em algumas que combinem entre si.</strong> Posicionar-se é tanto o que você deixa de fora quanto o que você coloca. Um perfil construído em torno de um único ofício — ou de alguns próximos, como fotografia e cinema — se lê como o de um especialista: os clientes sabem exatamente para que te contratar, e os buscadores e assistentes de IA formam uma imagem clara daquilo pelo que você é conhecido. Se você se espalha por áreas sem relação — tatuador, cineasta e fotógrafo com drone no mesmo perfil — essa imagem se borra: cada sinal se dilui e você não se destaca em nada específico. Se você realmente trabalha em disciplinas distantes, comece por aquela pela qual mais quer ser contratado e deixe o resto para outro perfil.</li><li><strong>Escolha as categorias que combinam com o seu trabalho.</strong> Selecione suas disciplinas e estilos com honestidade; é assim que os clientes filtram e que os buscadores entendem o que você faz.</li><li><strong>Suba suas melhores peças com títulos e descrições reais.</strong> Dê a cada peça um título claro e específico e uma breve descrição — a IA as enriquece, mas precisa de detalhe genuíno (tema, estilo, lugar) para construir.</li><li><strong>Adicione um banner e miniaturas caprichadas.</strong> São a primeira coisa que os visitantes — e os cartões de compartilhamento nas redes — veem; uma imagem polida faz as pessoas ficarem.</li><li><strong>Preencha seus serviços.</strong> Liste o que você oferece e os detalhes que um cliente precisa para te contratar — os serviços miram buscas de alta intenção, prontas para comprar.</li><li><strong>Escreva sua página Sobre.</strong> Sua história e experiência criam a confiança que transforma um visitante em cliente.</li><li><strong>Organize seus portfólios e coleções.</strong> Mantenha seus <a href='#what-is-a-portfolio'>portfólios</a> com o melhor e suas <a href='#what-is-a-collection'>coleções</a> por projeto organizados para que os visitantes entendam na hora o seu trabalho.</li></ul>Faça isso e a A11STUDIO cuida de todo o resto técnico a partir daí — você nunca precisa aprender SEO. Ainda em dúvida? <a href='/support'>Fale com a gente</a>.",
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
          "Ainda não — por enquanto a A11STUDIO suporta imagens e foi projetada para exibi-las lindamente. O suporte a vídeo está no nosso roadmap para uma versão futura, para que cineastas, animadores e artistas de motion também possam apresentar seu trabalho aqui. Quer ser avisado quando chegar? <a href='/support'>Entre em contato</a>.",
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
          "Respostas às perguntas mais comuns sobre a A11STUDIO — o que é, portfólios, criar uma conta, a lista de espera, IA, posicionar seu perfil e preços.",
      },
      hero: {
        label: "Perguntas frequentes",
        title: "Perguntas frequentes",
        lead: "Tudo o que você precisa saber sobre a A11STUDIO — o que é, como começar, a lista de espera e como ela ajuda as pessoas certas a descobrirem seu trabalho.",
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
    discover: {
      heading: "Descobrir",
      artists: "Explorar artistas",
      portfolios: "Explorar portfólios",
    },
    contact: {
      heading: "Contato",
      about: "Sobre",
      faqs: "Perguntas frequentes",
      support: "Suporte",
    },
    home: "Início do A11STUDIO",
    social: {
      heading: "Redes sociais",
      instagram: "A11STUDIO no Instagram",
      linkedin: "A11STUDIO no LinkedIn",
    },
    copyright: "© {year} A11STUDIO. Todos os direitos reservados.",
  },
  search: {
    pagination: {
      previous: "Anterior",
      next: "Próxima",
      previousAria: "Ir para a página anterior de resultados",
      nextAria: "Ir para a próxima página de resultados",
    },
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
      groupLabel: "Categorias",
      selectedLabel: "Categorias selecionadas",
      remove: "Remover {label}",
      maxReached: "Limite atingido: remova uma para adicionar outra.",
      typeFilterLabel: "Filtrar por tipo",
      types: {
        DISCIPLINE: "Disciplinas",
        ART_STYLE: "Estilos de arte",
        TAGS: "Tags",
      },
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
    metadata: {
      title: "Suporte — A11STUDIO",
      description:
        "Fale com o suporte do A11STUDIO para resolver dúvidas sobre sua conta, cobrança, planos ou qualquer problema técnico. Conte o que está acontecendo e responderemos por e-mail.",
    },
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
      title: "Validar e-mail — A11STUDIO",
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
  legal: {
    lastUpdated: "Última atualização — {date}",
    terms: {
      metadata: {
        title: "Termos de serviço — A11STUDIO",
        description:
          "Termos e condições de uso da plataforma de portfólios A11STUDIO — contas, planos de assinatura, propriedade do conteúdo, uso aceitável e moderação.",
      },
      updatedAt: "2026-03-16",
      heading: "Termos de serviço",
      intro:
        "Estes termos regem o uso da plataforma A11STUDIO. Ao criar uma conta ou utilizar nossos serviços, você concorda em ficar vinculado a eles.",
      acceptance: {
        title: "1. Aceitação dos termos",
        body: 'Ao acessar ou utilizar o A11STUDIO ("a Plataforma"), você concorda com estes Termos de serviço. Se não concordar, não deve usar a Plataforma. Podemos atualizar estes termos a qualquer momento — continuar usando após alterações significa aceitá-las.',
      },
      account: {
        title: "2. Cadastro de conta",
        body: "Para usar a Plataforma, você deve criar uma conta informando um e-mail válido, um nome de usuário único e uma senha. Você é responsável por manter a confidencialidade das suas credenciais.",
        verified:
          "Seu e-mail precisa ser verificado antes da liberação do acesso completo.",
        twoFa:
          "A autenticação em duas etapas (2FA) pode ser exigida no login como segurança adicional.",
        username:
          "As alterações de nome de usuário são limitadas. Trocas excessivas podem ser restringidas.",
        age: "Você precisa ter pelo menos 16 anos para criar uma conta.",
      },
      plans: {
        title: "3. Planos de assinatura",
        body: "O A11STUDIO oferece planos gratuitos e pagos. Cada plano define limites de armazenamento, envio de arquivos, portfólios, projetos, clientes, serviços e créditos de IA.",
        billing:
          "Os planos pagos são cobrados via <strong>Stripe</strong> ou <strong>PayPal</strong> de forma recorrente (mensal ou anual).",
        autoRenew:
          "As assinaturas são renovadas automaticamente, a menos que sejam canceladas antes da próxima data de cobrança.",
        manage:
          "Você pode gerenciar ou cancelar sua assinatura nas configurações da conta a qualquer momento.",
        promos:
          "Ofertas promocionais e descontos podem se aplicar a determinados preços e estão sujeitos a condições próprias.",
      },
      ownership: {
        title: "4. Propriedade do conteúdo",
        body1:
          "Você mantém a propriedade integral de todo o conteúdo que enviar à Plataforma, incluindo imagens, arquivos de mídia, descrições de portfólio e informações de perfil. Ao enviar conteúdo, você concede ao A11STUDIO uma licença limitada, não exclusiva e mundial para exibir, distribuir e processar tecnicamente seu conteúdo com a única finalidade de operar a Plataforma e prestar o serviço.",
        body2:
          "Essa licença termina quando você exclui seu conteúdo ou sua conta. Por exigências técnicas, cópias em cache ou arquivadas podem persistir brevemente após a exclusão.",
      },
      acceptableUse: {
        title: "5. Uso aceitável",
        body: "Você concorda em não enviar, publicar ou transmitir conteúdo que:",
        law: "Viole qualquer lei ou regulamento aplicável",
        ip: "Infrinja direitos de propriedade intelectual de terceiros",
        harmful:
          "Contenha material ilegal, nocivo, ameaçador ou discriminatório",
        fraud: "Seja fraudulento, enganoso ou induza a erro",
        malware: "Contenha malware, vírus ou código malicioso",
        body2:
          "Todo o material enviado passa por <strong>moderação automática de conteúdo</strong>. Conteúdo que viole nossas políticas pode ser bloqueado automaticamente. Você é o único responsável pelo conteúdo que enviar à Plataforma — o A11STUDIO não assume responsabilidade por material nocivo, ilegal ou proibido enviado por usuários.",
      },
      moderation: {
        title: "6. Moderação e penalidades de conta",
        body: "O A11STUDIO aplica um sistema de moderação baseado em penalidades para preservar a integridade da plataforma:",
        strikes:
          "Violações das políticas geram <strong>penalidades na conta</strong>. O acúmulo de penalidades pode levar à suspensão temporária ou ao banimento permanente.",
        temporary:
          "Os banimentos temporários têm data de início e de término definidas. Durante o banimento, sua conta e seu perfil público ficam inacessíveis.",
        permanent:
          "Banimentos permanentes são aplicados em casos graves ou reincidentes. O motivo sempre será informado.",
      },
      illegal: {
        title: "7. Conteúdo ilegal e autoridades",
        body1:
          "O A11STUDIO mantém uma <strong>política de tolerância zero</strong> com conteúdo ilegal, incluindo — mas não se limitando a — material de abuso sexual infantil (CSAM), conteúdo que retrate a exploração ou o abuso de menores e qualquer outro material que constitua crime segundo a lei aplicável.",
        body2:
          "Se esse conteúdo for detectado — seja por moderação automática ou por revisão manual — reservamo-nos o direito de encerrar imediata e permanentemente a conta infratora, preservar as provas pertinentes e <strong>comunicar o caso às autoridades competentes</strong>, incluindo, entre outras, a polícia local, agências nacionais e organizações internacionais como NCMEC ou Interpol.",
        body3:
          "O usuário que enviou o conteúdo assume toda a responsabilidade legal por qualquer material ilegal que introduza na Plataforma.",
      },
      limits: {
        title: "8. Limitações do serviço",
        body: "Cada plano de assinatura tem limites definidos:",
        storage:
          "<strong>Armazenamento</strong> — tamanho total máximo de arquivos e limites diários de envio",
        content:
          "<strong>Conteúdo</strong> — número máximo de portfólios, projetos, clientes e serviços",
        aiCredits:
          "<strong>Créditos de IA</strong> — créditos limitados por ciclo de cobrança para os recursos com IA (geração de SEO, sugestões de conteúdo), renovados periodicamente",
        compression:
          "<strong>Compressão de mídia</strong> — a disponibilidade depende do nível do seu plano",
        body2:
          "Exceder esses limites pode restringir determinados recursos até que você faça upgrade do plano ou até o início do próximo ciclo de cobrança.",
      },
      ip: {
        title: "9. Propriedade intelectual",
        body1:
          "A plataforma A11STUDIO — incluindo seu design, código, marca e funcionalidades — é propriedade intelectual do A11STUDIO. Você não pode copiar, modificar, distribuir nem fazer engenharia reversa de qualquer parte da Plataforma.",
        body2:
          "O conteúdo gerado por usuários continua sendo propriedade de seu criador, conforme descrito na seção 4.",
      },
      termination: {
        title: "10. Encerramento",
        body1:
          "Você pode excluir sua conta a qualquer momento nas configurações. Após a exclusão, seus dados pessoais, arquivos e conteúdo serão removidos conforme descrito na nossa <doc>Política de privacidade</doc>.",
        body2:
          "Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, abusem da plataforma ou pratiquem atividades fraudulentas.",
      },
      warranties: {
        title: "11. Isenção de garantias",
        body: 'A Plataforma é fornecida "no estado em que se encontra" e "conforme disponível", sem garantias de qualquer natureza, expressas ou implícitas, incluindo — sem limitação — comerciabilidade, adequação a uma finalidade específica ou não violação. Não garantimos serviço ininterrupto ou livre de erros.',
      },
      liability: {
        title: "12. Limitação de responsabilidade",
        body: "Na máxima extensão permitida por lei, o A11STUDIO não será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso da Plataforma, incluindo perda de dados, receita ou lucros.",
      },
      law: {
        title: "13. Legislação aplicável",
        body: "Estes termos são regidos e interpretados de acordo com a legislação aplicável. Qualquer disputa decorrente destes termos ou do uso da Plataforma será resolvida nos tribunais competentes da jurisdição em que o A11STUDIO estiver estabelecido.",
      },
      contact: {
        title: "14. Contato",
        body: "Em caso de dúvidas sobre estes termos, escreva para <email/>.",
      },
    },
    privacy: {
      metadata: {
        title: "Política de privacidade — A11STUDIO",
        description:
          "Como o A11STUDIO coleta, usa, armazena e protege seus dados pessoais: o que coletamos, com quem compartilhamos, por quanto tempo guardamos e quais direitos você tem.",
      },
      updatedAt: "2026-03-16",
      heading: "Política de privacidade",
      intro:
        "Esta política descreve como o A11STUDIO coleta, usa, armazena e protege suas informações quando você utiliza nossa plataforma. Temos compromisso com a transparência e com a proteção dos seus dados.",
      controller: {
        title: "1. Controlador de dados",
        body: 'O A11STUDIO ("nós") é o controlador responsável pelos seus dados pessoais. Para qualquer questão sobre privacidade, escreva para <email/>.',
      },
      collect: {
        title: "2. Informações que coletamos",
        body: "Coletamos diferentes categorias de informação conforme o modo como você usa a plataforma:",
        account:
          "<strong>Dados da conta</strong> — as informações básicas de perfil que você fornece ao se cadastrar e configurar a conta, como nome, e-mail e qualquer conteúdo opcional que decida acrescentar",
        location:
          "<strong>Dados de localização</strong> — se você optar por adicionar um endereço ao seu perfil, armazenamos a informação necessária para exibir sua localização publicamente",
        content:
          "<strong>Conteúdo que você cria</strong> — arquivos de mídia, portfólios, serviços, projetos e quaisquer descrições ou metadados associados que você fornecer na plataforma",
        business:
          "<strong>Dados de negócio</strong> — se você usar os recursos de gestão de clientes e projetos, armazenamos as informações de contato e de projeto que inserir",
        messages:
          "<strong>Mensagens</strong> — quando visitantes entram em contato com um artista pela plataforma, coletamos as informações incluídas no formulário de contato",
        security:
          "<strong>Dados de segurança</strong> — informações técnicas sobre a atividade de login e a identificação do dispositivo, usadas para proteger sua conta",
      },
      payments: {
        title: "3. Dados de pagamento",
        body: "Os pagamentos das assinaturas são processados integralmente por provedores externos. Armazenamos apenas as referências necessárias para gerenciar sua assinatura e seu histórico de cobrança. <strong>Não</strong> armazenamos números de cartão, dados bancários nem outras credenciais de pagamento brutas — elas são tratadas pelo processador de pagamentos conforme as políticas de privacidade dele.",
      },
      ai: {
        title: "4. Processamento com IA",
        body: "O A11STUDIO usa inteligência artificial em recursos como sugestões de conteúdo e moderação automática. Registramos o uso para gerenciar sua alocação de créditos de IA. O processamento é feito por provedores externos e apenas o mínimo de dados necessário é enviado.",
      },
      usage: {
        title: "5. Como usamos seus dados",
        operating: "Fornecer e operar a plataforma de portfólios",
        auth: "Autenticar sua identidade e proteger sua conta",
        billing: "Processar os pagamentos de assinatura e gerenciar a cobrança",
        aiFeatures: "Oferecer os recursos assistidos por IA",
        moderation:
          "Aplicar as políticas de conteúdo por meio de moderação automática",
        emails: "Enviar e-mails transacionais e notificações",
        publicProfile: "Exibir seu perfil público de artista e seu conteúdo",
        contactForm:
          "Entregar as mensagens do formulário de contato entre visitantes e artistas",
      },
      sharing: {
        title: "6. Compartilhamento de dados",
        body: "Não vendemos seus dados pessoais. Compartilhamos dados apenas com os seguintes serviços externos, na medida necessária para operar a plataforma:",
        payments:
          "<strong>Stripe e PayPal</strong> — para o processamento de pagamentos e a gestão de assinaturas",
        ai: "<strong>Provedores de IA / LLM</strong> — para geração de conteúdo e moderação de mídia",
        email:
          "<strong>Provedor de e-mail</strong> — para os e-mails transacionais (verificação, recuperação de senha, notificações)",
      },
      retention: {
        title: "7. Retenção de dados",
        body: "Mantemos seus dados pessoais enquanto sua conta estiver ativa. Os registros de segurança são mantidos para proteção da conta, e os registros de pagamento pelo prazo exigido pela regulamentação aplicável. Quando você exclui sua conta, removemos seus dados pessoais e o conteúdo associado em um prazo razoável, salvo quando a lei exigir a retenção.",
      },
      rights: {
        title: "8. Seus direitos",
        body: "Dependendo da sua jurisdição, você pode ter os seguintes direitos sobre seus dados pessoais:",
        access:
          "<strong>Acesso</strong> — solicitar uma cópia dos dados que mantemos sobre você",
        rectification:
          "<strong>Retificação</strong> — corrigir dados incorretos ou incompletos",
        erasure:
          "<strong>Exclusão</strong> — solicitar a eliminação dos seus dados pessoais",
        portability:
          "<strong>Portabilidade</strong> — receber seus dados em formato estruturado e legível por máquina",
        restriction:
          "<strong>Limitação</strong> — pedir que restrinjamos o tratamento dos seus dados",
        objection:
          "<strong>Oposição</strong> — opor-se ao tratamento baseado em interesses legítimos",
        body2:
          "Para exercer qualquer um desses direitos, escreva para <email/>.",
      },
      security: {
        title: "9. Segurança",
        body: "Adotamos medidas de segurança padrão do setor para proteger seus dados, incluindo criptografia, autenticação segura e controles de acesso. Embora nenhum sistema seja totalmente imune a violações, tomamos medidas razoáveis para resguardar suas informações.",
      },
      cookies: {
        title: "10. Cookies",
        body: "Usamos cookies para o funcionamento essencial da plataforma. Todos os detalhes estão na nossa <doc>Política de cookies</doc>.",
      },
      changes: {
        title: "11. Alterações nesta política",
        body: "Podemos atualizar esta política periodicamente. As alterações serão publicadas nesta página com uma data de revisão atualizada. Continuar usando a plataforma após as alterações significa aceitar a política revisada.",
      },
      contact: {
        title: "12. Contato",
        body: "Em caso de dúvidas ou preocupações sobre esta política de privacidade ou sobre seus dados pessoais, escreva para <email/>.",
      },
    },
    cookies: {
      metadata: {
        title: "Política de cookies — A11STUDIO",
        description:
          "Como o A11STUDIO usa cookies e tecnologias semelhantes. Usamos apenas cookies próprios necessários para o funcionamento da plataforma — nenhum de publicidade ou rastreamento.",
      },
      updatedAt: "2026-03-16",
      heading: "Política de cookies",
      intro:
        "Esta política explica quais cookies a plataforma A11STUDIO utiliza, por que os usamos e como eles afetam sua experiência. Usamos apenas cookies necessários para o funcionamento da plataforma.",
      what: {
        title: "1. O que são cookies",
        body: "Cookies são pequenos arquivos de texto que seu navegador guarda no seu dispositivo. Eles permitem que a plataforma lembre sua sessão, suas preferências e seu estado de segurança entre as páginas. O A11STUDIO usa apenas <strong>cookies próprios e HTTP-only</strong> — não usamos cookies de publicidade nem de rastreamento.",
      },
      essential: {
        title: "2. Cookies essenciais",
        body: "Estes cookies são estritamente necessários para o funcionamento da plataforma. Não podem ser desativados sem quebrar funções básicas. Os cookies essenciais cuidam de:",
        auth: "<strong>Autenticação</strong> — manter você conectado e gerenciar sua sessão com segurança entre as páginas",
        security:
          "<strong>Segurança</strong> — dar suporte às etapas de verificação da conta, como a autenticação em duas etapas",
        preferences:
          "<strong>Preferências</strong> — lembrar o idioma escolhido para exibir o conteúdo no idioma correto",
        body2:
          "Estes cookies têm vida curta e expiram automaticamente quando deixam de ser necessários — normalmente em uma única sessão ou em poucos dias.",
      },
      functional: {
        title: "3. Cookies funcionais",
        body: "Estes cookies melhoram sua experiência lembrando escolhas que você fez. Eles só são definidos em resposta a ações que você realiza na plataforma.",
        sessions:
          "<strong>Sessões prolongadas</strong> — manter você conectado por mais tempo para não precisar entrar repetidamente",
        checkout:
          "<strong>Estado do checkout</strong> — manter temporariamente o contexto durante os fluxos de assinatura ou pagamento",
        recovery:
          "<strong>Recuperação de conta</strong> — preservar o estado durante o processo de redefinição de senha",
        body2:
          "Estes cookies são temporários e expiram logo após a conclusão da ação correspondente.",
      },
      thirdParty: {
        title: "4. Cookies de terceiros",
        body: "Quando você interage com os provedores de pagamento durante o checkout, <strong>Stripe</strong> e <strong>PayPal</strong> podem definir seus próprios cookies no seu dispositivo. Eles são regidos pelas políticas de cookies e privacidade de cada provedor:",
        stripe: "Política de privacidade da Stripe",
        paypal: "Política de privacidade do PayPal",
      },
      notUsed: {
        title: "5. O que não usamos",
        body: "O A11STUDIO <strong>não</strong> utiliza:",
        analytics: "Cookies de analytics ou rastreamento",
        advertising: "Cookies de publicidade ou retargeting",
        pixels: "Pixels de rastreamento de redes sociais",
        crossSite: "Tecnologias de rastreamento entre sites",
      },
      managing: {
        title: "6. Gerenciar cookies",
        body: "Você pode gerenciar ou excluir cookies nas configurações do seu navegador. Desativar os cookies essenciais impedirá que você entre e use os recursos autenticados da plataforma. Para mais informações sobre como gerenciá-los, consulte a documentação do seu navegador.",
      },
      privacyRelation: {
        title: "7. Relação com a política de privacidade",
        body: "Esta Política de cookies faz parte da nossa <doc>Política de privacidade</doc>. Consulte-a para saber em detalhe como coletamos, usamos e protegemos seus dados pessoais além dos cookies.",
      },
      contact: {
        title: "8. Contato",
        body: "Se tiver dúvidas sobre nosso uso de cookies, escreva para <email/>.",
      },
    },
  },
  auth: {
    login: {
      metadata: {
        title: "Entrar",
        description:
          "Entre na sua conta A11STUDIO para gerenciar seus portfólios, coleções e serviços, e alcançar os clientes que procuram o seu trabalho.",
      },
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
      metadata: {
        title: "Crie sua conta",
        description:
          "Junte-se gratuitamente ao A11STUDIO e crie um portfólio profissional que faça você ser descoberto pelos clientes, colecionadores e colaboradores que procuram artistas.",
      },
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
      metadata: {
        title: "Verifique sua identidade",
        description:
          "Digite o código de verificação que enviamos para concluir o acesso à sua conta A11STUDIO com segurança.",
      },
      titleValidateEmail: "Valide seu e-mail",
      titleDeviceVerification: "Verificação do dispositivo",
      codeSentTo: "Enviamos um código de verificação para",
      havingTrouble: "Está com dificuldades?",
      backToLogin: "Voltar ao login",
      codePlaceholder: "Digite o código de 6 dígitos",
    },
    passwordRecovery: {
      metadata: {
        title: "Recupere sua senha",
        description:
          "Redefina a senha da sua conta A11STUDIO. Digite seu e-mail e enviaremos um link de recuperação seguro.",
      },
      metadataSent: {
        title: "Confira seu e-mail",
        description:
          "Enviamos um link de recuperação para o seu e-mail. Acesse-o para escolher uma nova senha para sua conta A11STUDIO.",
      },
      metadataReset: {
        title: "Defina uma nova senha",
        description:
          "Escolha uma senha nova e forte para sua conta A11STUDIO e entre novamente.",
      },
      metadataDone: {
        title: "Senha atualizada",
        description:
          "Sua senha do A11STUDIO foi alterada. Agora você já pode entrar com a nova senha.",
      },
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
    metadata: {
      title: "Configure seu perfil",
      description:
        "Termine de configurar seu perfil no A11STUDIO — adicione seus dados, sua foto e suas categorias para que os clientes certos encontrem você.",
    },
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
        title: "Selecione categorias",
        subtitle:
          "Escolher poucas categorias (recomendamos 1–3) melhora a sua visibilidade.",
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
      "Como <name>{label}</name>, você ganha <free>{months, plural, one {# mês grátis} other {# meses grátis}}</free>.",
    claimBelow: "Resgate logo abaixo. Vamos te guiar para obter o benefício.",
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
    contactSupport: "Fale com o suporte se achar que isso é um engano.",
    logout: "Sair",
  },
  emailPreferences: {
    metadata: {
      title: "Preferências de e-mail — A11STUDIO",
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
      change: "Alterar imagem do banner",
      remove: "Remover banner",
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
          "Esboço máquinas voadoras no café da manhã e disseco a curiosidade para ganhar a vida...",
      },
    },
    address: {
      editTitle: "Editar endereço",
      noAddress: "Nenhum endereço definido",
      updateDescription: "Atualize suas informações de endereço abaixo.",
      warningDescription:
        "Atenção: atualizar seu endereço pode afetar sua descoberta e visibilidade nos resultados de busca. Atualize apenas se realmente precisar.",
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
        placeholder: "seuusuario",
        hint: "Usuário ou URL oficial do Instagram (instagram.com/…).",
      },
      facebook: {
        label: "Facebook",
        placeholder: "suapagina",
        hint: "Usuário/página ou URL oficial do Facebook (facebook.com/…).",
      },
      youtube: {
        label: "YouTube",
        placeholder: "seucanal",
        hint: "Identificador ou URL oficial do YouTube (youtube.com/…).",
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
    title: "Categorias",
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
          "Volte em breve ou entre em contato para começar uma conversa.",
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
      metaIncomplete:
        "Este perfil de artista ainda está sendo configurado na A11STUDIO.",
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
        "Explore os portfólios de {name} na A11STUDIO — coleções selecionadas dos seus melhores trabalhos.",
      empty: "Ainda não há portfólios.",
      galleryEmpty: "Este portfólio está vazio no momento.",
    },
    collections: {
      pageTitle: "Coleções",
      metaDescription:
        "Explore as coleções de {name} na A11STUDIO — conjuntos selecionados do seu trabalho.",
      empty: "Ainda não há coleções.",
      galleryEmpty: "Esta coleção está vazia no momento.",
    },
    services: {
      pageTitle: "Serviços",
      metaDescription:
        "Conheça os serviços oferecidos por {name} na A11STUDIO e entre em contato para colaborar.",
      empty: "Ainda não há serviços.",
      whatsIncluded: "O que está incluído",
      terms: "Termos",
      relatedPortfolio: "Portfólio relacionado",
    },
    about: {
      pageTitle: "Sobre",
      metaDescription:
        "Conheça melhor {name} no A11STUDIO — sua história, sua trajetória e como entrar em contato.",
      notShared: "Este artista ainda não compartilhou sua história.",
      heading: "Sobre",
      getInTouch: "Entrar em contato",
    },
    media: {
      altFallback: "Obra de {name} no A11STUDIO",
      untitled: "Sem título",
      editAria: "Editar mídia",
    },
    fullscreen: {
      enter: "Ver em tela cheia",
      exit: "Sair da tela cheia",
    },
    gallery: {
      altFallback: "Obra no A11STUDIO",
      open: "Abrir",
      openAria: "Abrir a página completa da obra",
      share: "Compartilhar",
      shared: "Compartilhado",
      copied: "Copiado",
      shareAria: "Compartilhar esta obra",
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
        "Insira um usuário do Instagram ou uma URL oficial, ex.: seuusuario ou https://instagram.com/seuusuario",
      facebook:
        "Insira um usuário/página do Facebook ou uma URL oficial, ex.: suapagina ou https://facebook.com/suapagina",
      youtube:
        "Insira um identificador do YouTube ou uma URL oficial, ex.: seucanal ou https://youtube.com/@seucanal",
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
    newPassword: "Nova senha",
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
          "Quando desativado, este portfólio fica oculto do seu perfil público de artista e das listagens. Você ainda pode editá-lo no Atelier.",
      },
      items: {
        noItems: "Nenhuma mídia ou coleção adicionada ainda",
        itemsCountLabel: "{count} / {limit} itens",
        dragToReorder: "· Arraste para reordenar",
        countInfo:
          "Esta contagem inclui cada mídia que você adicionar diretamente, mais cada item de mídia dentro de qualquer coleção que você adicionar. Por exemplo, uma coleção com 10 imagens conta como 10 itens do limite de {limit}.",
        removeItem: "Remover {label}",
        untitled: "Sem título",
      },
      layout: {
        label: "Layout",
        info: "O layout se adapta ao tamanho da tela do visitante.",
        columnsInfo:
          "Para o layout em colunas, o número escolhido é o máximo usado em telas grandes. Dispositivos menores mostram menos colunas — até {mobile} no celular e {tablet} no tablet — ou seja, mesmo que você escolha {max} colunas, no celular aparecem apenas {mobile}.",
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
        priceInfo: "O preço é opcional; deixe em 0.",
        showPrice: "Mostrar preço",
        active: "Ativo",
        showOnProfile: "Mostrar na página de perfil",
        showOnProfileInfo:
          "Quando ativado, este serviço é destacado no seu perfil público de artista para que os visitantes o encontrem mais facilmente. Você pode destacar até {limit} serviços na sua página de perfil.",
        highlightLimitReached:
          "Você atingiu o limite de {limit} serviços destacados na sua página de perfil.",
        thumbnailLabel: "Miniatura",
        thumbnailAlt: "Prévia da miniatura",
        featuresLabel: "O que está incluído",
        featuresPlaceholder: "ex. sessão de 2 horas",
        termsLabel: "Termos",
        termsPlaceholder: "ex. depósito de 50% necessário",
        portfolioLinkLabel: "Vincular a um portfólio (opcional)",
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
          "Quando desativado, esta coleção fica oculta do seu perfil público de artista e das listagens. Você ainda pode editá-la no Atelier.",
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
        upgradeRequired: "Faça upgrade para acessar este recurso.",
        aiSeoGeneration: "Gerar metadados",
        aiSeoBadge: "Metadados IA",
        aiSeoTooltipBody:
          "O SEO (otimização para mecanismos de busca) ajuda seu trabalho a ser encontrado no Google e no Google Imagens. Usamos IA para analisar a imagem e gerar um título, uma descrição, um texto alternativo e um nome de arquivo artísticos e ricos em palavras-chave, além de marcá-la automaticamente com as categorias correspondentes.",
        aiSeoCreditsHint:
          "Custa 1 crédito de IA por imagem. <remaining>Você tem {count} {count, plural, one {crédito} other {créditos}} restantes.</remaining>",
        creditsLabel: "{count} {count, plural, one {crédito} other {créditos}}",
        creditsUsageSummary:
          "{used} {used, plural, one {crédito} other {créditos}} usados · restam {remaining}",
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
          "O SEO (otimização para mecanismos de busca) ajuda seu trabalho a ser encontrado no Google e no Google Imagens. Usamos IA para analisar a imagem e gerar um título, uma descrição, um texto alternativo e um nome de arquivo artísticos e ricos em palavras-chave, além de marcá-la automaticamente com as categorias correspondentes.",
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
          "Nenhuma mídia encontrada. Tente outra combinação de filtros.",
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
          "{count} / {max} {count, plural, one {item selecionado} other {itens selecionados}}",
      },
      uploadStatus: {
        uploadComplete: "Envio concluído",
        uploadingFiles: "Enviando arquivos",
        remaining: "{count} restantes",
        success: "com sucesso",
        failed: "com erro",
        allComplete: "Tudo concluído",
        queued: "Na fila...",
        uploading: "Enviando...",
        updating: "Atualizando...",
        generatingSeo: "Gerando metadados...",
        deleting: "Excluindo...",
        uploaded: "Enviado",
        updated: "Atualizado",
        seoGenerated: "Metadados gerados",
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
          "Seu plano atual é <strong>{planName}</strong> — não há nenhum plano superior para o qual fazer upgrade agora.",
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
