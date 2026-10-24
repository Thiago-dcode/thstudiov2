import type { Messages } from "./en";

const messages = {
  seo: {
    founderRole: "Fundador — fotógrafo, cineasta e engenheiro de software",
    homePageName: "A11STUDIO — Portfólios para fotógrafos",
    organizationDescription:
      "A11STUDIO é a plataforma de portfólios para fotógrafos — mostre seu trabalho num portfólio profissional e seja encontrado e contratado por clientes.",
    defaultTitle: "A11STUDIO — Onde os fotógrafos são descobertos",
    defaultDescription:
      "Mostre sua fotografia num portfólio profissional, apareça no Google e deixe os clientes falarem direto com você. A plataforma de portfólios para fotógrafos.",
  },
  landing: {
    scrollToNextSection: "Rolar para a próxima seção",
    metadata: {
      title: "A11STUDIO — Plataforma de portfólios para fotógrafos",
      description:
        "Crie um portfólio de fotografia profissional e conquiste clientes: você envia suas fotos, nós cuidamos do SEO, da hospedagem e da parte técnica. Grátis.",
    },
    hero: {
      srTitle: "A11STUDIO — a plataforma de portfólios para fotógrafos.",
      definition:
        "A11STUDIO é onde fotógrafos mostram seu trabalho — e onde os clientes vêm para encontrá-los e contratá-los.",
      titlePrefix: "Deixe que sua",
      titleAccentWords: ["fotografia", "visão", "criação", "arte", "história"],
      titleConnector: "se",
      titleDiscoverWords: [
        "compartilhe",
        "note",
        "revele",
        "encontre",
        "descubra",
      ],
      subtitle:
        "Para fotógrafos que não querem ser influenciadores. Traga suas fotos, nós cuidamos do resto.",
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
        dialog: {
          title: "O cadastro está fechado por enquanto",
          description:
            "A A11STUDIO está em acesso antecipado e as vagas são limitadas. Entre na lista de espera e enviaremos um convite pessoal por e-mail assim que sua vaga abrir. É grátis e leva alguns segundos.",
          stepsTitle: "O que acontece depois",
          steps: [
            {
              title: "Digite seu e-mail.",
              description: "Enviamos uma mensagem de confirmação na hora.",
            },
            {
              title: "Confirme seu e-mail.",
              description:
                "Clique no link dessa mensagem. Seu lugar na fila só é reservado depois da confirmação.",
            },
            {
              title: "Receba seu convite.",
              description:
                "Quando chegar a sua vez, enviamos por e-mail um link pessoal para criar sua conta. Quanto antes você confirmar, melhores serão seus benefícios de acesso antecipado.",
            },
          ],
          learnMore: "Leia o FAQ completo da lista de espera",
        },
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
            "Chega de {esgotamento} por algoritmo. Sem feeds, sem jogos, sem correr atrás de engajamento.",
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
            "Toda a sua energia vai para a sua {arte}, não para as redes sociais.",
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
    disciplines: {
      heading: "Para criativos",
      items: {
        photographers: {
          title: "Portfólio de fotografia grátis para fotógrafos",
          description:
            "Portfólios por especialidade, coleções para cada ensaio e serviços que seus clientes podem contratar.",
          cta: "Veja como funciona",
        },
      },
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
      title: "Seja <strike>influenciador</strike> artista.",
      description:
        "Chega de esgotamento por algoritmo. Sua energia é para a sua arte, não para as redes sociais — a A11STUDIO cuida do SEO e do posicionamento para que encontrem o seu trabalho.",
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
  forDiscipline: {
    photographers: {
      metadata: {
        title: "Portfólio online para fotógrafos, grátis",
        description:
          "Crie grátis seu portfólio de fotografia profissional. Organize seu trabalho por especialidade, entregue cada ensaio em coleções e receba clientes diretamente.",
      },
      hero: {
        label: "Para fotógrafos",
        title: "Um portfólio online para fotógrafos que traz clientes",
        lead: "Mostre seu melhor trabalho por especialidade, organize cada ensaio e deixe os clientes falarem com você diretamente. A A11STUDIO escreve os textos para buscadores por você, para que suas fotos possam ser encontradas no Google.",
        seeExamples: "Ver portfólios reais",
      },
      examples: {
        badge: "Exemplos",
        title: "Exemplos de portfólio de fotografia",
        description:
          "Portfólios reais criados por fotógrafos na A11STUDIO. O seu vai ficar e funcionar do mesmo jeito.",
        viewAll: "Ver todos os portfólios",
      },
      specialties: {
        badge: "Especialidades",
        title: "Um portfólio para cada tipo de fotografia",
        description:
          "Clientes contratam especialistas. Crie um portfólio para cada tipo de trabalho pelo qual você quer ser contratado.",
        items: [
          { slug: "portrait-photography", label: "Retrato" },
          { slug: "wedding-event-photography", label: "Casamentos" },
          { slug: "fashion-editorial-photography", label: "Moda e editorial" },
          {
            slug: "product-commercial-photography",
            label: "Produto e publicidade",
          },
          { slug: "aerial-drone-photography", label: "Aérea e drone" },
          {
            slug: "documentary-street-photography",
            label: "Documental e de rua",
          },
          {
            slug: "architecture-real-estate-photography",
            label: "Arquitetura e imóveis",
          },
          {
            slug: "landscape-nature-photography",
            label: "Paisagem e natureza",
          },
          { slug: "pet-photography", label: "Pets" },
          { slug: "event-photography", label: "Eventos" },
          { slug: "automotive-photography", label: "Automotiva" },
        ],
      },
      features: {
        badge: "Por que A11STUDIO",
        title: "Feito para o jeito que o fotógrafo trabalha",
        description:
          "Tudo o que você precisa para ser encontrado e contratado, sem criar um site.",
        items: [
          {
            title: "Portfólios por especialidade",
            description:
              "Reúna suas melhores imagens em uma seleção para cada tipo de trabalho — casamentos, retratos, produto — e os clientes veem exatamente o que você faz.",
          },
          {
            title: "Coleções para cada ensaio",
            description:
              "Agrupe as fotos de um ensaio, cliente ou viagem em uma coleção, separada dos seus portfólios.",
          },
          {
            title: "Serviços que podem ser contratados",
            description:
              "Mostre o que você oferece, o que está incluído e, se quiser, o preço: o que o cliente precisa saber antes de entrar em contato.",
          },
          {
            title: "Contato direto, sem intermediários",
            description:
              "Os clientes escrevem para você direto da sua página. Sem plataformas no meio.",
          },
          {
            title: "Pronto para buscadores",
            description:
              "A IA escreve títulos, descrições, tags e textos alternativos para suas fotos, e suas páginas públicas ficam disponíveis para os buscadores.",
          },
          {
            title: "Encontrado onde você trabalha",
            description:
              "Adicione sua cidade para que quem procura um fotógrafo por perto encontre você.",
          },
        ],
      },
      guide: {
        badge: "Guia",
        title: "Como criar um portfólio de fotografia que traz clientes",
        description: "Cinco passos que importam mais do que qualquer template.",
        steps: [
          {
            title: "Uma especialidade por portfólio",
            description:
              "Quem procura fotógrafo de casamento quer ver casamentos. Dedique cada portfólio a um tipo de trabalho para que ele pareça o de um especialista.",
          },
          {
            title: "Seja rigoroso na seleção",
            description:
              "Mostre de 15 a 30 das suas melhores imagens, não tudo o que você fotografou. Uma foto fraca diminui a impressão do conjunto inteiro.",
          },
          {
            title: "Comece e termine forte",
            description:
              "Abra com sua melhor imagem e feche com outra de destaque. Varie enquadramentos e momentos para que o conjunto conte uma história.",
          },
          {
            title: "Descreva seu trabalho",
            description:
              "Dê a cada foto um título claro com o tema, o lugar e o estilo. Isso ajuda os clientes a entendê-la e os buscadores a encontrá-la.",
          },
          {
            title: "Facilite a sua contratação",
            description:
              "Adicione seus serviços, sua cidade e uma bio curta, e coloque o link do seu portfólio na bio do Instagram e na assinatura de e-mail.",
          },
        ],
      },
      freePlan: {
        badge: "Preços",
        title: "Comece grátis",
        description:
          "O plano gratuito inclui tudo o que você precisa para publicar um portfólio profissional.",
        portfolios: "Portfólios",
        collections: "Coleções",
        services: "Serviços",
        storage: "Armazenamento",
        aiCredits: "Créditos de IA",
        unlimited: "Ilimitado",
        upgradeNote:
          "Precisa de mais espaço? Os planos pagos adicionam mais portfólios, armazenamento e créditos de IA quando você quiser.",
      },
      faq: {
        badge: "Perguntas",
        title: "O que os fotógrafos perguntam",
        description: "Respostas rápidas antes de começar.",
        items: [
          {
            question: "A A11STUDIO é grátis para fotógrafos?",
            answer:
              "Sim. O plano gratuito permite publicar seu perfil, portfólios, coleções e serviços sem custo. Os planos pagos só adicionam mais espaço e créditos de IA.",
          },
          {
            question: "Preciso de um site próprio ou saber design?",
            answer:
              "Não. Seu portfólio fica em a11studio.com/artists/seu-usuario e você o monta enviando e organizando suas fotos, sem código, hospedagem ou templates.",
          },
          {
            question: "Qual a diferença para postar no Instagram?",
            answer:
              "O Instagram mostra suas últimas publicações em um único feed. A A11STUDIO organiza seu melhor trabalho por especialidade, adiciona seus serviços e um formulário de contato, e faz cada página poder ser encontrada no Google. Muitos fotógrafos usam os dois: o Instagram para postar e a A11STUDIO como link na bio.",
          },
          {
            question: "Os clientes vão me encontrar no Google?",
            answer:
              "A A11STUDIO cuida da parte técnica: títulos, descrições e textos alternativos otimizados, e suas páginas públicas disponíveis para os buscadores. Ninguém pode garantir uma posição, mas um perfil completo, com sua cidade e fotos bem descritas, dá a você a melhor chance.",
          },
          {
            question: "Em quais idiomas a A11STUDIO está disponível?",
            answer: "Inglês, espanhol e português.",
          },
        ],
        more: "Mais respostas nas <link>perguntas frequentes</link>.",
      },
      cta: {
        title: "Seu trabalho merece ser encontrado",
        description: "Crie hoje seu portfólio de fotografia. Começar é grátis.",
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
          "Quando o cadastro está fechado, a lista de espera é o caminho para ter acesso antecipado à A11STUDIO. Este é o fluxo:<ul><li><strong>Entre com seu e-mail.</strong> Digite seu endereço no formulário da lista. Enviaremos um e-mail de confirmação na hora.</li><li><strong>Confirme seu e-mail.</strong> Abra a mensagem e clique no link. Sua vaga só é reservada depois da validação — até lá não travamos uma posição para você.</li><li><strong>Garanta seu lugar na fila.</strong> Sua posição é atribuída ao confirmar, na ordem em que as pessoas validam. Confirme cedo para receber o convite antes.</li><li><strong>Aguarde o convite.</strong> Quando for a sua vez, enviamos um link pessoal de cadastro. Você tem <strong>7 dias</strong> para criar a conta antes de o convite expirar; também enviamos lembretes antes do prazo.</li><li><strong>Cadastre-se e resgate.</strong> Use o link para criar sua conta. Seu benefício da lista (meses grátis no nosso plano superior) fica pronto para resgatar depois de entrar.</li></ul><p><strong>Condições</strong></p><ul><li>As vagas são limitadas. Ao atingirmos a capacidade, a lista de espera fecha.</li><li>A confirmação do e-mail é obrigatória. E-mails não confirmados não mantêm uma posição.</li><li>Todos que se cadastram pela lista de espera recebem o mesmo benefício: <strong>3 meses grátis</strong>.</li><li>Cada convite é de uso único para o e-mail da lista e expira em 7 dias se não for usado.</li><li>Se você já está confirmado na lista, enviar o mesmo e-mail de novo não cria uma nova entrada — confira sua caixa de entrada, ou <a href='/support'>fale com o suporte</a> se algo parecer errado.</li></ul>",
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
      title: "Sobre a A11STUDIO — Feito por um artista, para artistas",
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
        "Feita primeiro para fotógrafos — casamento, retrato, marca, viagem ou qualquer outra especialidade. Outros criativos também são bem-vindos, e a A11STUDIO ajuda seu trabalho a se destacar.",
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
  formPrivacyNotice: {
    report:
      "Usamos estes dados apenas para tratar a sua denúncia e, se deixar um email, comunicar-lhe o resultado. Mais informações na nossa <privacy>Política de privacidade</privacy>.",
    register:
      "Usamos seus dados para criar e gerenciar sua conta e seu portfólio. Seus direitos e como tratamos seus dados: <privacy>Política de privacidade</privacy>.",
    acceptTerms:
      "Aceito os <terms>Termos de serviço</terms> e confirmo que tenho pelo menos 16 anos.",
    acceptTermsRequired: "Aceite os Termos de serviço para criar sua conta.",
    waitList:
      "Só usamos seu email para gerenciar seu lugar na lista de espera e enviar seu convite. Mais informações na nossa <privacy>Política de privacidade</privacy>.",
    support:
      "Usamos estes dados apenas para responder à sua solicitação. Mais informações na nossa <privacy>Política de privacidade</privacy>.",
    artistContact:
      "Seu nome, email e mensagem são enviados a este artista para que ele possa responder. Mais informações na nossa <privacy>Política de privacidade</privacy>.",
  },
  report: {
    metadata: {
      title: "Denunciar conteúdo — A11STUDIO",
      description:
        "Denuncie conteúdo da A11STUDIO que considere ilegal ou contrário aos nossos Termos de serviço. Analisamos cada aviso e comunicamos o resultado.",
    },
    label: "Denunciar conteúdo",
    title: "Denunciar conteúdo",
    description:
      "Se acha que algo publicado na A11STUDIO é ilegal ou viola os nossos Termos de serviço, diga-nos aqui. Analisamos cada aviso, agimos quando se justifica e enviamos a nossa decisão por email se nos deixar um endereço.",
    emergency:
      "Se alguém estiver em perigo imediato, contacte primeiro os serviços de emergência (112).",
    form: {
      urlLabel: "Link para o conteúdo",
      reasonLabel: "Qual é o problema?",
      reasonPlaceholder: "Escolha um motivo",
      reasons: {
        ILLEGAL_CONTENT: "Conteúdo ilegal",
        CHILD_SAFETY: "Abuso ou exploração sexual de menores",
        INTELLECTUAL_PROPERTY: "Violação de direitos de autor ou de marca",
        HATE_OR_VIOLENCE: "Discurso de ódio, ameaças ou violência",
        PRIVACY: "Dados pessoais ou violação da privacidade",
        FRAUD_OR_SCAM: "Fraude ou burla",
        OTHER: "Outro motivo",
      },
      explanationLabel: "Porque é ilegal ou contra as regras?",
      explanationPlaceholder:
        "Explique qual é o problema e, se puder, que lei ou direito é violado.",
      nameLabel: "O seu nome (opcional)",
      emailLabel: "O seu email (opcional)",
      emailInfo:
        "Só é usado para confirmar que recebemos a denúncia e comunicar a nossa decisão.",
      goodFaith:
        "Confirmo que a informação desta denúncia é exata e completa, tanto quanto sei, e que denuncio de boa-fé.",
      submit: "Enviar denúncia",
      success: {
        title: "Obrigado. Recebemos a sua denúncia.",
        body: "A sua referência é #{id}. Vamos analisá-la e, se deixou um email, comunicaremos a nossa decisão.",
      },
      errors: {
        url: "Cole o link completo da página, começando por https://.",
        reason: "Escolha um motivo.",
        explanation: "Explique o problema em pelo menos 20 caracteres.",
        goodFaith: "Confirme que a denúncia é exata e feita de boa-fé.",
        notOurSite: "O link tem de ser de uma página da A11STUDIO.",
        tooMany:
          "Demasiadas denúncias em pouco tempo. Aguarde um minuto e tente novamente.",
      },
    },
  },
  cookieConsent: {
    title: "Cookies",
    lead: "Ajude-nos a melhorar a A11STUDIO.",
    body: "Com a sua permissão, usamos cookies de analytics de terceiros (Google Analytics) para contar as visitas de forma agregada e ver o que funciona. Sem anúncios, sem venda de dados, e você pode mudar de ideia quando quiser.",
    learnMore: "Política de cookies",
    accept: "Aceitar",
    reject: "Recusar",
  },
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
      report: "Denunciar conteúdo",
      notice: "Aviso legal",
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      cookies: "Política de Cookies",
      cookieSettings: "Configurações de cookies",
    },
    discover: {
      heading: "Descobrir",
      artists: "Explorar artistas",
      portfolios: "Explorar portfólios",
      forPhotographers: "Para fotógrafos",
    },
    contact: {
      heading: "Contato",
      about: "Sobre",
      faqs: "Perguntas frequentes",
      support: "Suporte",
    },
    home: "Início do A11STUDIO",
    social: {
      youtube: "A11STUDIO no YouTube",
      pinterest: "A11STUDIO no Pinterest",
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
      titleArtists:
        "Encontre fotógrafos — Por especialidade e local | A11STUDIO",
      descriptionArtists:
        "Encontre e contate fotógrafos por especialidade, estilo e localização. Explore portfólios reais na A11STUDIO e fale direto com o fotógrafo.",
      titlePortfolios:
        "Portfólios de fotografia — Casamento, retrato e mais | A11STUDIO",
      descriptionPortfolios:
        "Explore portfólios de fotografia selecionados na A11STUDIO e encontre o fotógrafo ideal para o seu projeto.",
      headingArtists: "Descubra artistas",
      headingPortfolios: "Explore portfólios",
      introArtists:
        "Fotógrafos e outros criativos: explore por especialidade, estilo e localização e fale diretamente com eles.",
      introPortfolios:
        "Trabalhos selecionados de artistas da A11STUDIO: cada portfólio reúne o melhor de um artista em uma disciplina ou estilo.",
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
        TECHNIQUE: "Técnicas",
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
      showcase: {
        title: "Inspire-se:",
        cta: "Ver uma página de artista",
      },
      benefit: {
        label: "Você ganhou:",
        tiers: {
          VIP: "Membro fundador",
          EARLY_USER: "Membro de acesso antecipado",
          FOUNDER: "Fundador",
        },
        line: "{months} meses grátis",
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
    notice: {
      metadata: {
        title: "Aviso legal — A11STUDIO",
        description:
          "Quem está por trás da A11STUDIO: identificação do titular, dados de contato e as informações legais exigidas pela lei espanhola (LSSI-CE).",
      },
      updatedAt: "2026-10-14",
      heading: "Aviso legal",
      intro:
        "Em cumprimento do artigo 10 da Lei espanhola 34/2002, de Serviços da Sociedade da Informação e de Comércio Eletrónico (LSSI-CE), estes são os dados de quem gere este site.",
      owner: {
        title: "1. Titular do site",
        body: "O site a11studio.com e a plataforma A11STUDIO são geridos por:",
        name: "<strong>Titular:</strong> {value}",
        taxId: "<strong>NIF/CIF:</strong> {value}",
        address: "<strong>Endereço:</strong> {value}",
        email: "<strong>Email:</strong> <email/>",
        registry: "<strong>Dados de registo:</strong> {value}",
      },
      purpose: {
        title: "2. Objeto",
        body: "A A11STUDIO é uma plataforma online onde artistas criam e publicam os seus portfólios, e onde os visitantes podem descobrir o seu trabalho e contactá-los.",
      },
      conditions: {
        title: "3. Condições de uso",
        body: "O uso do site implica a aceitação deste aviso. A criação de uma conta e o uso da plataforma regem-se pelos nossos <doc>Termos de serviço</doc>.",
      },
      ip: {
        title: "4. Propriedade intelectual",
        body: "O design, o código, a marca e os textos do site pertencem ao seu titular. As obras publicadas pelos artistas pertencem aos seus autores e não podem ser reproduzidas sem a sua autorização.",
      },
      privacy: {
        title: "5. Proteção de dados",
        body: "Como tratamos os dados pessoais, e como exercer os seus direitos, está explicado na nossa <doc>Política de privacidade</doc>.",
      },
      law: {
        title: "6. Lei aplicável",
        body: "Este aviso rege-se pela lei espanhola. Se é consumidor, mantém a proteção das leis imperativas do seu país de residência e pode reclamar nos tribunais do seu domicílio.",
      },
      contact: {
        title: "7. Pontos de contacto (Regulamento dos Serviços Digitais)",
        body: "Ponto de contacto único para utilizadores e para as autoridades dos Estados-Membros, a Comissão Europeia e o Comité Europeu dos Serviços Digitais (arts. 11.º e 12.º do Regulamento dos Serviços Digitais): <email/>. Respondemos em português, espanhol e inglês. Para denunciar um conteúdo que considere ilegal, use o nosso <doc>formulário de denúncia</doc>.",
      },
    },
    terms: {
      metadata: {
        title: "Termos de serviço — A11STUDIO",
        description:
          "Termos e condições de uso da plataforma de portfólios A11STUDIO — contas, planos de assinatura, propriedade do conteúdo, uso aceitável e moderação.",
      },
      updatedAt: "2026-10-14",
      heading: "Termos de serviço",
      intro:
        "Estes termos regem o uso da plataforma A11STUDIO. Ao criar uma conta ou utilizar nossos serviços, você concorda em ficar vinculado a eles.",
      acceptance: {
        title: "1. Aceitação dos termos",
        body: 'Ao acessar ou utilizar o A11STUDIO ("a Plataforma"), você concorda com estes Termos de serviço. Se não concordar, não deve usar a Plataforma. Se fizermos alterações importantes, avisaremos por email ou no aplicativo pelo menos 30 dias antes de elas entrarem em vigor. Se não concordar, pode encerrar sua conta antes dessa data.',
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
        withdrawal:
          "<strong>Direito de arrependimento (consumidores da UE)</strong> — você pode desistir de uma assinatura paga nos 14 dias seguintes à compra, sem indicar motivo, escrevendo para <email/>. Reembolsamos o valor pago, descontada a parte proporcional do serviço já utilizado, em até 14 dias.",
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
          "Você pode excluir sua conta a qualquer momento nas configurações. Seu perfil é ocultado imediatamente e, 15 dias depois, sua conta, seus dados pessoais, arquivos e conteúdo são excluídos permanentemente conforme descrito na nossa <doc>Política de privacidade</doc>. Até lá, você pode entrar e reabri-la; enviamos um email 2 dias antes da exclusão. Você também pode desativar sua conta, o que a oculta de todos sem apagar nada, e reativá-la quando quiser.",
        body2:
          "Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, abusem da plataforma ou pratiquem atividades fraudulentas.",
      },
      warranties: {
        title: "11. Isenção de garantias",
        body: 'Trabalhamos para que a Plataforma esteja disponível e funcione bem, mas não garantimos um serviço ininterrupto ou livre de erros. Na medida permitida por lei, a Plataforma é fornecida "no estado em que se encontra". Nada nestes termos limita seus direitos legais como consumidor, incluindo a garantia legal de que o serviço corresponde ao que foi acordado.',
      },
      liability: {
        title: "12. Limitação de responsabilidade",
        body: "Na medida permitida por lei, o A11STUDIO não responde por danos indiretos ou consequenciais decorrentes do uso da Plataforma, como perda de receita ou lucros. Isso não limita nossa responsabilidade por dolo ou culpa grave, por morte ou danos pessoais, nem qualquer responsabilidade que a lei não permita limitar, e não afeta seus direitos obrigatórios como consumidor.",
      },
      law: {
        title: "13. Legislação aplicável",
        body: "Estes termos são regidos pela lei espanhola. Se você é consumidor, mantém também a proteção das leis obrigatórias do seu país de residência e pode reclamar nos tribunais do seu domicílio. Também pode recorrer à autoridade de defesa do consumidor do seu país.",
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
      updatedAt: "2026-10-14",
      heading: "Política de privacidade",
      intro:
        "Esta política descreve como o A11STUDIO coleta, usa, armazena e protege suas informações quando você utiliza nossa plataforma. Temos compromisso com a transparência e com a proteção dos seus dados.",
      controller: {
        title: "1. Controlador de dados",
        body: 'O A11STUDIO ("nós") é o controlador responsável pelos seus dados pessoais. Nossa identificação completa e endereço estão no <notice>Aviso legal</notice>. Para qualquer questão sobre privacidade, escreva para <email/>.',
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
        automated:
          "Cada arquivo é verificado automaticamente antes de ser publicado. O conteúdo que viola nossas regras é bloqueado e pode somar uma advertência à sua conta, e advertências repetidas levam a uma suspensão temporária ou definitiva. Você pode pedir que uma pessoa revise qualquer uma dessas decisões escrevendo para <email/>.",
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
        analytics:
          "Medir como a plataforma é usada por meio de estatísticas agregadas (somente com seu consentimento)",
        bases:
          "<strong>Bases legais:</strong> tratamos os dados da sua conta, portfólio, faturamento e contato para executar o contrato com você (art. 6.1.b RGPD); as faturas para cumprir a legislação fiscal (art. 6.1.c); os registros de segurança, a prevenção de fraudes, a moderação automática e os emails do serviço com base no nosso interesse legítimo em uma plataforma segura e funcional (art. 6.1.f); e o analytics somente com seu consentimento (art. 6.1.a).",
      },
      sharing: {
        title: "6. Compartilhamento de dados",
        body: "Não vendemos seus dados pessoais. Compartilhamos dados apenas com os seguintes serviços externos, na medida necessária para operar a plataforma:",
        payments:
          "<strong>Stripe e PayPal</strong> — para o processamento de pagamentos e a gestão de assinaturas",
        ai: "<strong>OpenAI</strong> — para geração de conteúdo e moderação de mídia",
        email:
          "<strong>Resend</strong> — para os e-mails transacionais (verificação, recuperação de senha, notificações)",
        hosting:
          "<strong>Provedores de hospedagem e armazenamento em nuvem</strong> — para operar a plataforma e guardar seus arquivos",
        transfers:
          "Alguns destes provedores (OpenAI, Resend, Google) estão nos Estados Unidos. Essas transferências se baseiam no Quadro de Privacidade de Dados UE-EUA ou nas Cláusulas Contratuais-Tipo da Comissão Europeia.",
        analytics:
          "<strong>Google Analytics (Google Ireland Limited)</strong> — para estatísticas de uso agregadas, somente se você aceitar os cookies de analytics. A base legal é o seu consentimento, que pode ser retirado a qualquer momento em “Configurações de cookies” no rodapé",
      },
      retention: {
        title: "7. Retenção de dados",
        body: "Mantemos seus dados pessoais enquanto sua conta estiver ativa. Os registros de segurança são mantidos por até 30 dias, e as faturas e registros de pagamento pelos prazos exigidos pela legislação fiscal e comercial (até 6 anos). As mensagens dos formulários de contato são mantidas até o destinatário apagá-las ou sua conta ser excluída, e as denúncias de conteúdo pelo tempo necessário para tratá-las e responder a eventuais reclamações. Quando você exclui sua conta, ela é ocultada imediatamente e excluída permanentemente 15 dias depois (o prazo permite que você mude de ideia), junto com seus arquivos e o conteúdo associado, exceto os registros de pagamento que a lei nos obriga a manter. Uma conta desativada mantém seus dados, ocultos ao público, até você reativá-la ou excluí-la.",
      },
      rights: {
        title: "8. Seus direitos",
        body: "Você tem os seguintes direitos sobre seus dados pessoais:",
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
        withdraw:
          "<strong>Retirar o consentimento</strong> — quando o tratamento se baseia no seu consentimento (cookies de analytics), você pode retirá-lo a qualquer momento",
        body2:
          "Para exercer qualquer um desses direitos, escreva para <email/>. Respondemos em até um mês. Você também pode excluir sua conta em Configurações.",
        complaint:
          "Se acha que não tratamos seus dados corretamente, pode apresentar uma reclamação à Agência Espanhola de Proteção de Dados (AEPD, www.aepd.es) ou à autoridade do seu país.",
      },
      security: {
        title: "9. Segurança",
        body: "Adotamos medidas de segurança padrão do setor para proteger seus dados, incluindo criptografia, autenticação segura e controles de acesso. Embora nenhum sistema seja totalmente imune a violações, tomamos medidas razoáveis para resguardar suas informações.",
      },
      cookies: {
        title: "10. Cookies",
        body: "Usamos cookies para o funcionamento essencial da plataforma e, somente se você aceitar, para analytics. Todos os detalhes estão na nossa <doc>Política de cookies</doc>.",
      },
      changes: {
        title: "11. Alterações nesta política",
        body: "Podemos atualizar esta política periodicamente. As alterações são publicadas nesta página com uma data de revisão atualizada, e avisaremos sobre alterações importantes por email ou no aplicativo antes de entrarem em vigor.",
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
          "Como o A11STUDIO usa cookies e tecnologias semelhantes. Cookies essenciais próprios, mais cookies de analytics opcionais que só são definidos se você os aceitar — nenhum de publicidade.",
      },
      updatedAt: "2026-10-13",
      heading: "Política de cookies",
      intro:
        "Esta política explica quais cookies a plataforma A11STUDIO utiliza, por que os usamos e como eles afetam sua experiência. Usamos os cookies necessários para o funcionamento da plataforma e cookies de analytics somente com o seu consentimento.",
      what: {
        title: "1. O que são cookies",
        body: "Cookies são pequenos arquivos de texto que seu navegador guarda no seu dispositivo. Eles permitem que a plataforma lembre sua sessão, suas preferências e seu estado de segurança entre as páginas. Nossos cookies essenciais são <strong>próprios e HTTP-only</strong>. Não usamos cookies de publicidade e só definimos cookies de analytics depois que você os aceita.",
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
      analytics: {
        title: "5. Cookies de analytics (opcionais)",
        body: "Somente com o seu consentimento, usamos o <strong>Google Analytics 4</strong> para entender como os visitantes usam a plataforma (páginas visitadas, origem do tráfego, ações-chave como o cadastro) e poder melhorá-la. Esses cookies não são definidos, e os scripts do Google não são carregados, até que você escolha Aceitar no banner de cookies.",
        ga: "<strong>_ga</strong> — distingue os visitantes para gerar estatísticas agregadas. Expira em 2 anos.",
        gaSession:
          "<strong>_ga_XXXXXXXXXX</strong> — mantém o estado da sua sessão atual. Expira em 2 anos.",
        provider:
          "O provedor é a Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irlanda). Os dados podem ser transferidos para a Google LLC nos Estados Unidos com base no Quadro de Privacidade de Dados UE-EUA. Desativamos os recursos de publicidade do Google, portanto nenhum cookie de publicidade é definido.",
        withdraw:
          "A base legal é o seu consentimento. Você pode retirá-lo a qualquer momento escolhendo “Configurações de cookies” no rodapé e selecionando Rejeitar: os cookies de analytics são excluídos e nenhum outro dado é enviado.",
      },
      notUsed: {
        title: "6. O que não usamos",
        body: "O A11STUDIO <strong>não</strong> utiliza:",
        analytics: "Cookies de analytics sem o seu consentimento prévio",
        advertising: "Cookies de publicidade ou retargeting",
        pixels: "Pixels de rastreamento de redes sociais",
        crossSite: "Tecnologias de rastreamento entre sites",
      },
      managing: {
        title: "7. Gerenciar cookies",
        body: "Você pode alterar ou retirar sua escolha sobre analytics a qualquer momento em “Configurações de cookies” no rodapé. Você também pode gerenciar ou excluir cookies nas configurações do seu navegador. Desativar os cookies essenciais impedirá que você entre e use os recursos autenticados da plataforma. Para mais informações sobre como gerenciá-los, consulte a documentação do seu navegador.",
      },
      privacyRelation: {
        title: "8. Relação com a política de privacidade",
        body: "Esta Política de cookies faz parte da nossa <doc>Política de privacidade</doc>. Consulte-a para saber em detalhe como coletamos, usamos e protegemos seus dados pessoais além dos cookies.",
      },
      contact: {
        title: "9. Contato",
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
      didntGetCode: "Não recebeu?",
      resend: "Enviar um novo código",
      resendIn: "Enviar um novo código em {seconds}s",
      newCodeSent: "Enviamos um novo código. Só o mais recente funciona.",
      codeExpired: "Este código expirou. Envie um novo para você.",
      checkSpam:
        "Pode levar um minuto para chegar. Verifique também a pasta de spam.",
      sessionExpired:
        "Sua sessão de verificação terminou. Faça login novamente.",
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
      skipStep: "Pular esta etapa",
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
  pendingDeletion: {
    title: "Sua conta será excluída em {date}",
    description:
      "Você pediu para excluir sua conta. Depois dessa data, suas mídias, portfólios e perfil desaparecem para sempre.",
    invisible: "Até lá, sua conta fica invisível para as outras pessoas.",
    reopen: "Reabrir minha conta",
    logout: "Sair",
    reopenedToast: "Bem-vindo de volta. Sua conta voltou a ser pública.",
    tooLate: "Sua conta já está sendo excluída e não pode mais ser reaberta.",
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
    accessProfile: "Perfil público",
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
    upload: {
      uploading: "Enviando… {percent}%",
      processing: "Otimizando e verificando sua imagem…",
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
  locationSearch: {
    searching: "Buscando localizações…",
    noLocations: "Nenhuma localização encontrada.",
    minCharsHint: "Digite pelo menos 3 caracteres para buscar.",
  },
  addressForm: {
    label: "Endereço",
    searchPlaceholder: "Busque seu endereço…",
    saving: "Salvando endereço…",
    confirm: "Salvar endereço",
  },
  userCategories: {
    title: "Categorias",
    visibilityHint:
      "Escolher poucas categorias (recomendamos 1–3) melhora a sua visibilidade.",
  },
  artists: {
    hiddenNotice: {
      title: "Só você pode ver esta página.",
      body: 'Sua conta está desativada, então os visitantes veem "página não encontrada".',
      cta: "Reativar em Configurações",
    },
    shareProfile: "Compartilhar perfil",
    invite: {
      madeWith: "Feito com",
      label: "Portfólio feito com a11studio",
      endTitle: "Seu trabalho merece uma página como esta.",
      cta: "Crie seu portfólio",
      ctaWaitlist: "Traga sua arte",
      contactTitle: "Você também cria?",
    },
    breadcrumb: {
      goBack: "Voltar",
    },
    header: {
      atelier: "Atelier",
      createYours: "Crie o seu",
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
      sent: {
        title: "Mensagem enviada",
        body: "{name} vai responder por e-mail.",
        bodyFallback: "Você receberá a resposta por e-mail.",
        close: "Fechar",
      },
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
      generic:
        "A página que você procura não existe ou pode ter sido removida.",
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
      metaTitleLocation: "{name} — {profession} em {location}",
      bannerAlt: "Capa de {name}",
      avatarAlt: "Retrato de {name}",
      bannerRegion: "Capa do perfil",
      bioRegion: "Sobre",
      connect: "Conectar",
      emailLabel: "Enviar e-mail para {name}",
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
      metaDescriptionDetailed:
        "Portfólios de {name}, {profession} em {location}: o melhor do seu trabalho na A11STUDIO.",
      listTitle: "Portfólios de {name}",
      fromCollection: "{title} (Coleção: {collection})",
      pageTitle: "Portfólios",
      metaDescription:
        "Explore os portfólios de {name} na A11STUDIO — coleções selecionadas dos seus melhores trabalhos.",
      empty: "Ainda não há portfólios.",
      galleryEmpty: "Este portfólio está vazio no momento.",
    },
    collections: {
      metaDescriptionDetailed:
        "Coleções de {name}, {profession} em {location}: projetos, viagens e séries na A11STUDIO.",
      listTitle: "Coleções de {name}",
      pageTitle: "Coleções",
      metaDescription:
        "Explore as coleções de {name} na A11STUDIO — conjuntos selecionados do seu trabalho.",
      empty: "Ainda não há coleções.",
      galleryEmpty: "Esta coleção está vazia no momento.",
    },
    services: {
      metaDescriptionDetailed:
        "Serviços de {name}, {profession} em {location}. Veja o que está incluído e entre em contato na A11STUDIO.",
      listTitle: "Serviços de {name}",
      pageTitle: "Serviços",
      metaDescription:
        "Conheça os serviços oferecidos por {name} na A11STUDIO e entre em contato para colaborar.",
      empty: "Ainda não há serviços.",
      whatsIncluded: "O que está incluído",
      terms: "Termos",
      relatedPortfolio: "Portfólio relacionado",
    },
    about: {
      metaTitleNamed: "{title} — {name}",
      metaTitleDefault: "Sobre {name}",
      photoAlt: "Retrato de {name}",
      pageTitle: "Sobre",
      metaDescription:
        "Conheça melhor {name} no A11STUDIO — sua história, sua trajetória e como entrar em contato.",
      notShared: "Este artista ainda não compartilhou sua história.",
      heading: "Sobre",
      getInTouch: "Entrar em contato",
    },
    media: {
      titleFallback: "Obra de {name}",
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
    avatarUrlInvalid: "URL de avatar inválida",
    fallbackUrlInvalid: "URL de retorno inválida",
    thumbnailRequired: "A miniatura é obrigatória",
    maxCategories: "Portfólios podem ter até {max} categorias",
    maxPortfolioItems: "Portfólios podem ter até {max} itens",
    minCollectionMedia: "É necessário pelo menos um item de mídia",
    maxCollectionMedia: "Coleções podem ter até {max} mídias",
    file: {
      tooLarge: "{field} deve ter menos de {mb}MB",
      invalidType:
        "{field} deve ser uma imagem (JPEG, PNG, WebP, GIF) ou um vídeo (MP4, MOV, MPEG)",
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
    description: "Descrição",
    seoAlt: "Texto alternativo SEO",
    seoTitle: "Título SEO",
    seoDescription: "Descrição SEO",
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
      viewOnline: "Ver online",
      cancel: "Cancelar",
      save: "Salvar",
      update: "Atualizar",
      create: "Criar",
      close: "Fechar",
      add: "Adicionar",
      loading: "Carregando...",
      expandMedia: "Ver em tamanho real",
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
      setupGuide: {
        title: "Guia de configuração",
        progress: "{percent}% concluído",
        shrink: "Minimizar guia de configuração",
        expand: "Expandir guia de configuração",
        close: "Fechar guia de configuração",
        steps: {
          fullName: "Adicione seu nome e sobrenome",
          profession: "Adicione sua profissão",
          avatar: "Envie um avatar",
          location: "Adicione seu endereço",
          categories: "Adicione uma categoria",
          portfolio: "Crie seu primeiro portfólio",
          media: "Envie sua primeira mídia",
          aboutPage: "Configure sua página sobre",
        },
      },
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
        titleInfo:
          "Seu título vira o endereço deste portfólio na web. Escolha algo claro e específico: você pode renomeá-lo depois, mas o endereço continuará o mesmo.",
        titleAddressHint:
          "Escolha com cuidado: seu título vira o link que as pessoas usam para encontrar este portfólio, e esse link não muda se você renomeá-lo depois.",
        permalinkLabel: "Link:",
        permalinkFrozenNote:
          "definido quando você criou este portfólio, e continua o mesmo mesmo que você altere o título",
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
        active: "Público",
        activeInfo:
          "Se desmarcar, este portfólio fica oculto do seu perfil de artista e das listagens. Você ainda pode editá-lo no Atelier.",
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
        previewAria: "Pré-visualizar e ajustar layout",
        previewTitle: "Pré-visualização do layout",
        previewDescription:
          "Uma prévia dos seus itens selecionados usando o layout {layoutName}. O resultado se adapta ao tamanho da tela do visitante.",
        previewEmpty: "Adicione itens para pré-visualizar o layout.",
        recommendationLabel: "Recomendado para",
        recommendations: {
          MASONRY:
            "Formatos muito diferentes. Obras verticais, horizontais e quadradas convivem perto da forma real.",
          UNIFORM:
            "Uma visão minimalista. Cada obra ocupa a mesma célula, calma e equilibrada.",
          COLUMN_BASE:
            "Vídeo e seleções pequenas. Você controla o número de colunas, então poucas obras ou clipes ganham o espaço de que precisam.",
        },
        layoutGroup: "Layout",
        itemsGroup: "Itens",
        columns: "Colunas",
        showTitles: "Mostrar títulos",
        showTitlesHint:
          "Cada obra mostra o título acima da imagem, em até duas linhas.",
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
        titleLabel: "Título",
        titlePlaceholder: "Fotografia de retrato",
        titleInfo:
          "Seu título vira o endereço deste serviço na web. Escolha algo claro e específico: você pode renomeá-lo depois, mas o endereço continuará o mesmo.",
        titleAddressHint:
          "Escolha com cuidado: seu título vira o link que as pessoas usam para encontrar este serviço, e esse link não muda se você renomeá-lo depois.",
        permalinkLabel: "Link:",
        permalinkFrozenNote:
          "definido quando você criou este serviço, e continua o mesmo mesmo que você altere o título",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Descreva seu serviço...",
        priceLabel: "Preço",
        priceInfo: "O preço é opcional; deixe em 0.",
        showPrice: "Mostrar preço",
        active: "Público",
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
        hint: "Toque para adicionar · {count} disponíveis",
        removeFromSelection: "Remover",
        selectedHeading: "Selecionados",
        selectedHint: "Use × para remover",
        availableHeading: "Disponíveis",
        allSelected: "Tudo o que foi carregado já está selecionado",
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
        titleInfo:
          "Seu título vira o endereço desta coleção na web. Escolha algo claro e específico: você pode renomeá-la depois, mas o endereço continuará o mesmo.",
        titleAddressHint:
          "Escolha com cuidado: seu título vira o link que as pessoas usam para encontrar esta coleção, e esse link não muda se você renomeá-la depois.",
        permalinkLabel: "Link:",
        permalinkFrozenNote:
          "definido quando você criou esta coleção, e continua o mesmo mesmo que você altere o título",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Descreva sua coleção...",
        showOnProfile: "Mostrar na página de perfil",
        showOnProfileInfo:
          "Quando ativado, esta coleção é destacada no seu perfil público de artista para que os visitantes a encontrem mais facilmente. Você pode destacar até {limit} coleções na sua página de perfil.",
        highlightLimitReached:
          "Você atingiu o limite de {limit} coleções destacadas na sua página de perfil.",
        active: "Público",
        activeInfo:
          "Se desmarcar, esta coleção fica oculta do seu perfil de artista e das listagens. Você ainda pode editá-la no Atelier.",
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
        globalCompression: "Compressão",
        compressionTooltipTitle: "Nível de compressão",
        compressionTooltipBody:
          "Controla o equilíbrio entre qualidade e tamanho do arquivo. Compressão menor (VERY_LOW, LOW) preserva mais detalhes, mas cria arquivos maiores. Compressão maior (HIGH, VERY_HIGH) reduz o tamanho, mas pode reduzir levemente a qualidade. Vídeos já comprimidos são guardados como estão.",
        compressionTooltipHint:
          "Vale para todos os arquivos. Abra um arquivo para alterar só ele.",
        compressionSmallFileHint:
          "Se sua foto já está comprimida ou é pequena (menos de 5 MB), recomendamos escolher compressão normal ou menor.",
        allFiles: "Todos os arquivos",
        upgradeRequired: "Faça upgrade para acessar este recurso.",
        aiSeoGeneration: "Gerar metadados com IA",
        aiSeoHint:
          "A IA escreve um título, uma descrição e categorias que ajudam as pessoas a encontrarem sua obra no Google.",
        aiSeoBadge: "Os metadados serão gerados com IA",
        aiSeoTooltipBody:
          "A IA olha sua imagem ou vídeo e escreve um título, uma descrição e uma breve descrição da imagem que ajudam as pessoas a encontrarem sua obra, em português, inglês e espanhol. Nunca altera o título e a descrição que você escreveu. Se você não escolher nenhuma categoria, a IA escolhe por você. Se escolher, a IA mantém as suas e só adiciona algumas palavras-chave extras.",
        aiSeoCreditsHint:
          "Custa {imageCost} {imageCost, plural, one {crédito} other {créditos}} de IA por imagem/GIF, {videoCost} por vídeo. <remaining>Você tem {count} {count, plural, one {crédito} other {créditos}} restantes.</remaining>",
        creditsLabel: "{count} {count, plural, one {crédito} other {créditos}}",
        creditsUsageSummary:
          "{used} {used, plural, one {crédito} other {créditos}} usados · restam {remaining}",
        noCreditsTitle: "Sem créditos de IA:",
        noCreditsBody:
          "Você usou todos os seus créditos de IA. Faça upgrade do seu plano ou aguarde a próxima renovação.",
        filesCount: "{count}/{max} arquivos",
        maxReached: "Limite atingido",
        dropzoneTitle: "Clique para enviar",
        dropzoneHint: "ou arraste e solte",
        dropzoneAddMore: "Adicionar mais arquivos",
        dropzoneRemaining:
          "{remaining} {remaining, plural, one {espaço} other {espaços}} restantes",
        compressionLabel: "Compressão",
        upgradeToAdjust: "Faça upgrade do plano para ajustar",
        previewAlt: "Prévia {index}",
        settingsTitle: "Ajustes de envio (afeta todos)",
        settingsAiOn:
          "Ativado · {used} {used, plural, one {crédito} other {créditos}}",
        settingsAiOff: "Desativado",
        cardDetailsHint: "Editar",
        openDetailsAria: "Editar {name}",
        removeAria: "Remover {name}",
        detailsSubtitle: "As alterações aqui valem apenas para este arquivo.",
        coverTitle: "Capa",
        coverHint:
          "Arraste para escolher o quadro exibido na sua galeria e ao compartilhar.",
        coverSliderLabel: "Quadro da capa",
        coverVideoLabel: "Quadro do vídeo usado como capa",
        coverUnsupported:
          "Este navegador não consegue pré-visualizar este vídeo, então a capa será um quadro do primeiro segundo.",
        detailsDone: "Concluído",
        notEnoughCreditsForFile: "Créditos insuficientes para este arquivo",
        gridHint: "Clique em um arquivo para editá-lo antes de enviar.",
        fileSizeLabel: "Tamanho",
        fileTypeLabel: "Tipo",
        typeImage: "Imagem",
        typeVideo: "Vídeo",
        aiCostForFile:
          "Usa {count} {count, plural, one {crédito} other {créditos}}",
        aboutTitle: "Sobre esta obra",
        aboutHint:
          "Opcional — aparece com sua obra e a IA lê para escrever metadados melhores.",
        titleLabel: "Título",
        titlePlaceholder: "ex.: Pôr do sol em Lisboa",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "O que mostra e a história por trás",
        locationLabel: "Localização",
        locationPlaceholder: "Busque uma cidade ou lugar…",
        locationHint:
          "Onde foi feita ou fotografada. Ajuda as pessoas a encontrar sua obra pelo lugar.",
        settingsLocationSome: "{count}/{total} arquivos",
        globalLocationLabel: "Localização para todos os arquivos",
        globalLocationHint: "Define o mesmo lugar em todos os arquivos.",
        globalLocationPerFileHint:
          "Um arquivo é de outro lugar? Clique nele na lista para definir a localização dele.",
        globalLocationMixed:
          "Seus arquivos têm localizações diferentes. Escolher uma aqui substitui todas.",
        globalLocationClear: "Remover a localização de todos os arquivos",
        categoriesLabel: "Categorias",
        categoriesHint:
          "Até 5: o que é, seu estilo ou como foi feita (ângulo, enquadramento…). Ajuda as pessoas a encontrarem sua obra.",
        categoriesAiWillChoose:
          "Nenhuma categoria escolhida — a IA vai escolher para este arquivo.",
        settingsCategoriesSome: "{count}/{total} arquivos",
        globalCategoriesLabel: "Categorias para todos os arquivos",
        globalCategoriesHint:
          "Define as mesmas categorias (até 5) em todos os arquivos.",
        globalCategoriesAiHint:
          "Se você não escolher nenhuma, a IA define por você quando “Gerar metadados com IA” estiver ativado.",
        globalCategoriesPerFileHint:
          "Um arquivo precisa de outras categorias? Clique nele na lista para definir as dele.",
        globalCategoriesMixed:
          "Seus arquivos têm categorias diferentes. Escolher aqui substitui todas.",
        globalCategoriesClear: "Remover as categorias de todos os arquivos",
        aiNotesTip:
          "Dica: dê primeiro um título, uma descrição e uma localização a cada arquivo. A IA os lê, então o que ela escreve fica mais preciso. Clique em um arquivo para adicioná-los.",
        duplicateSummary:
          "{count, plural, one {# arquivo tem} other {# arquivos têm}} o mesmo nome e tamanho de outro arquivo deste envio — verifique se há duplicados.",
        duplicateCardHint:
          "Possível duplicado: outro arquivo deste envio tem o mesmo nome e tamanho.",
        duplicateDialogHint:
          "Outro arquivo deste envio tem o mesmo nome e tamanho. Se for a mesma imagem, remova um deles.",
        createNewMedia: "Criar nova mídia",
        uploadUpToImages:
          "Envie até {max} ficheiros: imagens (JPEG, PNG, WebP, GIF) ou vídeos (MP4, MOV, MPEG)",
        uploadButton:
          "Enviar {count, plural, one {# ficheiro} other {# ficheiros}}",
        uploadingInBackground:
          "{count, plural, one {# a enviar} other {# a enviar}}",
        close: "Fechar",
        createMedia: "Criar mídia",
        upload: "Subir mídia",
        storageFullTitle: "Armazenamento cheio: {used} / {limit} GB utilizados",
        uploadInProgress: "Envio em andamento...",
      },
      card: {
        deleteFailed: "Falha ao excluir a mídia",
        titleLabel: "Título",
        titlePlaceholder: "Digite o título",
        descriptionLabel: "Descrição",
        descriptionPlaceholder: "Digite a descrição",
        locationLabel: "Localização",
        locationPlaceholder: "Busque uma cidade ou lugar…",
        locationInfo:
          "Onde foi feita ou fotografada. A IA usa isso ao escrever os metadados.",
        categoriesLabel: "Categorias",
        categoriesInfo:
          "Até 5 categorias que descrevem esta obra: o que é, seu estilo artístico ou a técnica usada (ângulo, enquadramento, profundidade…). Ajudam a encontrá-la nas buscas e nos filtros.",
        categoriesRegenerateHint:
          "Você alterou as categorias. Depois de salvar, recomendamos gerar os metadados novamente para que o título, a descrição e as palavras-chave correspondam a elas.",
        categoriesAiHint:
          "Sem categoria — a IA vai escolher na próxima vez que você gerar metadados.",
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
        metadataGeneratedLabel: "Metadados gerados",
        activeLabel: "Pública",
        activeInfo:
          "A mídia pública aparece na sua página e em todos os portfólios e coleções em que está. Desmarque para ocultá-la em todos os lugares sem excluí-la — você pode marcá-la de novo quando quiser.",
        visibilityLabel: "Pública",
        visibilityActive: "Sim",
        visibilityInactive: "Não",
        typeLabel: "Tipo",
        compressionLabel: "Compressão",
        sizeLabel: "Tamanho",
        urlLabel: "URL",
        copyUrl: "Copiar URL",
        urlCopied: "URL copiada",
        urlCopyFailed: "Não foi possível copiar a URL",
        coverLabel: "Capa",
        coverChange: "Alterar capa",
        coverTitle: "Escolha uma capa",
        coverHint:
          "Arraste para escolher o quadro exibido na sua galeria e ao compartilhar.",
        coverSliderLabel: "Quadro da capa",
        coverVideoLabel: "Quadro do vídeo usado como capa",
        coverUnsupported:
          "Este navegador não consegue reproduzir este vídeo, então a capa não pode ser alterada aqui.",
        coverSave: "Usar este quadro",
        coverPending: "Atualizando capa…",
        coverUpdated: "Capa atualizada",
        coverRejected:
          "Esse quadro não pode ser usado como capa. A capa anterior foi mantida.",
        coverChangeFailed: "Não foi possível alterar a capa. Tente novamente.",
        noPreview: "Sem prévia",
        altFallback: "Mídia de {username}",
        untitled: "Sem título",
        editMedia: "Editar mídia",
        mediaPreview: "Prévia da mídia",
        viewPublicPage: "Ver página pública",
        generateSeo: "Gerar metadados",
        noCreditsAvailable:
          "Nenhum crédito de IA disponível. Você precisa de pelo menos {imageCost} crédito para gerar metadados de uma imagem/GIF, ou {videoCost} para um vídeo. Faça upgrade do seu plano ou aguarde a renovação dos créditos.",
        generateSeoTooltip:
          "Ajuda seu trabalho a ser encontrado no Google e no Google Imagens. A IA olha a imagem ou o vídeo e escreve um título, uma descrição, uma descrição da imagem e um nome de arquivo. Se você não definiu categorias, ela também as escolhe; se definiu, mantém as suas e só adiciona algumas palavras-chave extras.",
        noCreditsSuffix: " (Sem créditos)",
        delete: "Excluir",
        deleteTitle: "Excluir esta mídia?",
        deleteConfirm: "Isso não pode ser desfeito.",
        deleteWarningMetadata:
          "Todos os metadados gerados — títulos, descrições, textos de SEO e tags — serão perdidos permanentemente.",
        deleteWarningUsage:
          "Se esta mídia fizer parte de um portfólio ou coleção, ela desaparecerá de lá.",
        cancel: "Cancelar",
        discardTitle: "Descartar alterações?",
        discardBody:
          "Tem certeza de que deseja cancelar? Todas as alterações não salvas serão perdidas.",
        keepEditing: "Continuar editando",
        discardChanges: "Descartar alterações",
        saveChanges: "Salvar alterações",
        edit: "Editar",
        close: "Fechar",
        failed: "Falhou",
        failedAria: "Esta mídia falhou ao processar",
      },
      grid: {
        processingTitle: "Processando",
        processingHint:
          "Estamos otimizando seus novos envios. Cada um entra na sua biblioteca quando estiver pronto — você pode sair desta página.",
        processingItem: "Processando…",
        generateSeoCount: "Gerar metadados ({count})",
        generateSeoTitle: "Gerar metadados com IA",
        generateSeoDescription:
          "Gerar metadados com IA para {count} {count, plural, one {mídia selecionada} other {mídias selecionadas}}?",
        creditsAvailable: "Créditos disponíveis:",
        creditsNeeded: "Créditos necessários:",
        overAiLimit: "Limite: selecione até {max} itens (remova {excess}).",
        insufficientCredits:
          "Créditos insuficientes. Você precisa de mais {needed} créditos.",
        deleteCount: "Excluir ({count})",
        deleteTitle: "Excluir as mídias selecionadas?",
        deleteDescription:
          "{count, plural, one {# mídia selecionada será excluída} other {# mídias selecionadas serão excluídas}} permanentemente.",
        deleteInUse:
          "{count, plural, one {# mídia pertence} other {# mídias pertencem}} a portfólios ou coleções ({portfolios} em portfólios, {collections} em coleções). {count, plural, one {Ela vai desaparecer} other {Elas vão desaparecer}} de lá.",
        deleteIrreversible:
          "Esta ação não pode ser desfeita. Todos os metadados gerados serão perdidos permanentemente.",
        overDeleteLimit: "Limite: selecione até {max} itens (remova {excess}).",
        deleteConfirm: "Excluir {count}",
        deleting: "Excluindo…",
        deleteFailed: "Não foi possível excluir as mídias",
        deletePartialFailed:
          "Não foi possível excluir {failed} de {total} mídias.",
        deleteSuccess:
          "{count, plural, one {# mídia excluída} other {# mídias excluídas}}.",
        updateLocationCount: "Definir localização ({count})",
        updateLocationTitle: "Definir localização",
        updateLocationDescription:
          "Salvar um lugar em {count} {count, plural, one {mídia selecionada} other {mídias selecionadas}}.",
        updateLocationHint: "É onde a obra foi feita.",
        overLocationLimit:
          "Limite: selecione até {max} itens (remova {excess}).",
        locationPlaceholder: "Busque uma cidade ou lugar…",
        updateCategoriesCount: "Definir categorias ({count})",
        updateCategoriesTitle: "Definir categorias",
        updateCategoriesDescription:
          "Aplicar as mesmas categorias a {count} {count, plural, one {mídia selecionada} other {mídias selecionadas}}.",
        updateCategoriesReplaceLabel: "Substituir as categorias atuais",
        updateCategoriesMergeHint:
          "Desativado: elas são adicionadas ao lado das categorias que cada item já tem. Nenhum item passa de {max}, então quando ele está cheio o restante é ignorado.",
        updateCategoriesReplaceHint:
          "Ativado: as categorias atuais de cada item são removidas, inclusive as adicionadas pela IA, e só estas ficam. Recomendamos gerar os metadados novamente depois.",
        updateCategoriesOverCap:
          "{count, plural, one {# item passaria} other {# itens passariam}} de {max} categorias. Só as que couberem serão adicionadas.",
        updateCategoriesMergeConfirm: "Adicionar categorias",
        updateCategoriesReplaceConfirm: "Substituir categorias",
        overCategoriesLimit:
          "Limite: selecione até {max} itens (remova {excess}).",
        cancel: "Cancelar",
        selectMedia: "Selecionar mídia",
        actions: "Ações",
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
        clearSearch: "Limpar busca",
        clearFilters: "Limpar filtros",
        shapeGroupLabel: "Formato",
        typeGroupLabel: "Tipo",
        sortLabel: "Ordenar por",
        allShapes: "Todos os formatos",
        allTypes: "Todos os tipos",
        shape: {
          SQUARE: "Quadrado",
          LANDSCAPE: "Paisagem",
          PORTRAIT: "Retrato",
        },
        sort: {
          created_at_desc: "Enviadas recentemente",
          created_at_asc: "Enviadas há mais tempo",
          seo_generated_at_desc: "Metadados gerados: mais recentes",
          seo_generated_at_asc: "Metadados gerados: mais antigos",
        },
      },
      status: {
        seoComplete: "SEO completo",
        seoCompleteBody:
          "Título SEO, descrição e texto alternativo estão definidos.",
        seoIncomplete: "SEO incompleto",
        seoIncompleteBody:
          "Falta: {fields}. Gere com IA ou adicione você mesmo.",
        locationSet: "Localização definida",
        locationMissing: "Sem localização",
        locationMissingBody:
          "Informar onde a obra foi feita ajuda as pessoas a encontrá-la.",
        active: "Pública",
        activeBody:
          "Visível na sua página pública e em todos os lugares onde você a colocou.",
        inactive: "Não pública",
        inactiveBody:
          "Oculta da página pública, dos portfólios e das coleções.",
        inCollections: "Em {count, plural, one {# coleção} other {# coleções}}",
        inCollectionsBody: "Ocultar esta mídia também a oculta nelas.",
        inPortfolios:
          "Em {count, plural, one {# portfólio} other {# portfólios}}",
        inPortfoliosBody:
          "Inclui os portfólios que a exibem diretamente ou por meio de uma de suas coleções.",
      },
      mediaType: {
        IMAGE: "Foto",
        GIF: "GIF",
        VIDEO: "Vídeo",
      },
      compressionLevel: {
        VERY_LOW: "Muito baixa",
        LOW: "Baixa",
        NORMAL: "Normal",
        HIGH: "Alta",
        VERY_HIGH: "Muito alta",
      },
      drawer: {
        title: "Adicionar mídia",
        refreshAria: "Atualizar mídia",
        filterAll: "Todos",
        hint: "Toque para adicionar · {count} disponíveis",
        hintMax: "· até {max} itens",
        removeFromSelection: "Remover",
        selectedHeading: "Selecionados",
        selectedHint: "Use × para remover",
        availableHeading: "Disponíveis",
        allSelected: "Tudo o que foi carregado já está selecionado",
        addToPortfolio: "Adicionar ao portfólio",
        emptyTitle: "Ainda não há mídia",
        emptySubtitle: "Envie sua primeira imagem para começar",
        itemsSelected:
          "{count, plural, one {# item selecionado} other {# itens selecionados}}",
        itemsSelectedWithMax:
          "{count} / {max} {count, plural, one {item selecionado} other {itens selecionados}}",
        failedAria: "Esta mídia falhou ao processar",
      },
      uploadStatus: {
        uploadComplete: "Envio concluído",
        uploadingFiles: "Enviando arquivos",
        remaining: "{count} restantes",
        success: "com sucesso",
        failed: "com erro",
        allComplete: "Tudo concluído",
        queued: "Na fila...",
        uploadingPercent: "Enviando... {percent}%",
        doNotCloseWarning: "Mantenha esta pagina aberta ate o envio terminar",
        processingNotify: "Arquivo enviado, avisaremos quando estiver pronto",
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
        requestFailed: "Falha na solicitação",
        minimize: "Minimizar",
        hide: "Ocultar status do envio",
        expand: "Expandir",
        requestFailedCount:
          "{count, plural, one {# item não pôde ser enviado} other {# itens não puderam ser enviados}}",
      },
    },
    contacts: {
      pageTitle: "Contatos",
      pageInfo:
        "Mensagens que as pessoas enviaram pelo seu formulário de contato. Selecione uma para ler o e-mail completo.",
      emptyState: "Ninguém entrou em contato com você ainda.",
      emptyStateFiltered: "Nenhum contato corresponde a esta busca.",
      openAria: "Abrir a mensagem “{subject}”",
      table: {
        name: "Nome",
        email: "E-mail",
        subject: "Assunto",
        receivedAt: "Recebido",
      },
      filters: {
        searchPlaceholder: "Buscar contatos…",
        clearSearchAria: "Limpar busca",
        orderByAria: "Ordenar por",
        sortAsc: "Ordenado do mais antigo para o mais recente",
        sortDesc: "Ordenado do mais recente para o mais antigo",
        orderByOptions: {
          created_at: "Data de recebimento",
          updated_at: "Última atualização",
          contact_name: "Nome",
          contact_email: "E-mail",
          subject: "Assunto",
        },
      },
      dialog: {
        description: "Recebido em {date}",
        from: "De",
        email: "E-mail",
        message: "Mensagem",
      },
    },
    notifications: {
      pageTitle: "Notificações",
      pageInfo:
        "Tudo o que aconteceu na sua conta. Selecione uma para ver os detalhes.",
      emptyState: "Você ainda não tem notificações.",
      emptyStateFiltered: "Nenhuma notificação corresponde a estes filtros.",
      openAria: "Abrir a notificação {type}",
      referenceValue: "n.º {id}",
      types: {
        NEW_CONTACT: "Nova mensagem de contato",
        CREATE_UPDATE_MEDIA: "Mídia criada ou atualizada",
        GENERATE_MEDIA_METADATA: "Metadados de mídia gerados",
        FAILED_GENERATE_MEDIA_METADATA: "Falha ao gerar metadados da mídia",
        DELETE_MEDIA: "Mídia excluída",
      },
      status: {
        read: "Lida",
        unread: "Não lida",
      },
      table: {
        type: "Notificação",
        status: "Status",
        reference: "Referência",
        updatedAt: "Atualizada",
      },
      filters: {
        allTypes: "Todas as notificações",
        typeAria: "Filtrar por tipo de notificação",
        unreadOnly: "Apenas não lidas",
        orderByAria: "Ordenar por",
        sortAsc: "Ordenado do mais antigo para o mais recente",
        sortDesc: "Ordenado do mais recente para o mais antigo",
        orderByOptions: {
          created_at: "Data de criação",
          updated_at: "Última atualização",
          read_at: "Data de leitura",
          type: "Tipo de notificação",
        },
      },
      dialog: {
        description: "Última atualização em {date}",
        status: "Status",
        readAt: "Lida em {date}",
        reference: "Referência",
        updatedAt: "Última atualização",
      },
      card: {
        unavailable: "Este item não está mais disponível.",
        contactFrom: "De {name}",
        subject: "Assunto",
        name: "Nome",
        email: "E-mail",
        title: "Título",
        publicId: "ID do arquivo",
        untitledMedia: "Arquivo sem título",
        deletedMedia: "Esta mídia foi excluída",
        thumbnailAlt: "Pré-visualização de {title}",
        noThumbnail: "Sem pré-visualização disponível",
        seoTitle: "Título gerado",
        seoDescription: "Descrição gerada",
        viewMedia: "Ver nos arquivos",
        failedFallback: "Falhou sem motivo informado.",
        mediaTypeLabel: "Tipo",
        mediaType: {
          IMAGE: "Foto",
          GIF: "GIF",
          VIDEO: "Vídeo",
        },
        statusWithType: "{status} · {type}",
        status: {
          UPLOADING: "Enviando…",
          UPDATING: "Atualizando…",
          GENERATING_METADATA: "Gerando metadados…",
          COMPLETED: "Pronta",
          FAILED: "Falha no processamento",
        },
      },
    },
    home: {
      shareKitTitle: "Coloque seu portfólio na sua bio",
      shareKitDescription:
        "Adicione este link à bio do Instagram, ao seu site e à assinatura de e-mail. Cada link ajuda clientes a encontrarem seu trabalho e seu perfil a ranquear.",
      shareKitLinkLabel: "O link do seu portfólio",
      shareKitSnippetLabel: "Para o seu site (HTML)",
      shareKitBadgeText: "Portfólio na A11STUDIO",
      shareKitCopy: "Copiar",
      shareKitCopied: "Copiado",
      pageTitle: "Painel",
    },
    nav: {
      dashboard: "Painel",
      home: "Início",
      media: "Mídia",
      collections: "Coleções",
      portfolios: "Portfólios",
      services: "Serviços",
      misc: "Diversos",
      contacts: "Contatos",
      notifications: "Notificações",
      about: "Sobre",
      settings: "Configurações",
      closeMenuAria: "Fechar menu",
    },
    topNav: {
      accountDeactivated: "Conta desativada",
      accountDeactivatedHint:
        "Seu perfil está oculto para todos. Reative-o em Configurações.",
      openMenuAria: "Abrir menu",
      expandSidebarAria: "Expandir barra lateral",
      collapseSidebarAria: "Recolher barra lateral",
      notificationsAria: "Notificações",
      notificationsTitle: "Notificações",
      notificationsEmpty: "Ainda não há notificações.",
      notificationsEmptyHint:
        "Aqui aparecerão os envios, as gerações com IA e as novas mensagens.",
      notificationsUnreadAria:
        "Notificações, {count, plural, one {# não lida} other {# não lidas}}",
      notificationsViewAll: "Ver todas",
      notificationsMarkAllRead: "Marcar todas como lidas",
      notificationsMarkAllReadTitle: "Marcar as notificações como lidas?",
      notificationsMarkAllReadBody:
        "Serão marcadas como lidas {count, plural, one {# notificação não lida} other {# notificações não lidas}} desta lista. O que chegar depois continuará não lido.",
      notificationsMarkAllReadConfirm: "Marcar como lidas",
      notificationsMarkAllReadCancel: "Cancelar",
      upgrade: "Fazer upgrade",
      viewProfile: "Perfil público",
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
      dangerZone: {
        heading: "Zona de perigo",
        deactivate: {
          label: "Desativar conta",
          labelDescription:
            "Oculte seu perfil e seu trabalho de todos. Nada é excluído.",
          inactiveLabel: "Sua conta está desativada",
          inactiveDescription:
            "Seu perfil e seu trabalho estão ocultos para todos até você reativá-la.",
          trigger: "Desativar",
          title: "Desativar sua conta?",
          description:
            "Seu perfil, portfólios e mídias ficarão invisíveis para todos, e ninguém poderá entrar em contato com você. Nada é excluído: você pode continuar trabalhando no seu atelier e reativar sua conta quando quiser em Configurações.",
          cancel: "Cancelar",
          submit: "Desativar conta",
          reactivate: "Reativar",
          deactivatedToast: "Sua conta está desativada e oculta para todos.",
          reactivatedToast: "Sua conta voltou a ser pública.",
        },
        delete: {
          label: "Excluir conta",
          labelDescription:
            "Exclua sua conta e todo o seu trabalho permanentemente em {days} dias.",
          trigger: "Excluir",
          title: "Excluir sua conta?",
          description:
            "Sua conta será excluída permanentemente em {days} dias.",
          whatHidden:
            "A partir de agora, seu perfil fica invisível para todos.",
          whatDeleted:
            "Depois disso, suas mídias, portfólios, coleções, serviços e dados de perfil são apagados para sempre.",
          whatReopen:
            "Mudou de ideia? Entre em até {days} dias e reabra sua conta. Também enviaremos um email 2 dias antes.",
          cancelSubscriptionLabel: "Cancelar também minha assinatura agora",
          cancelSubscriptionOn:
            "Seu plano não será renovado. Você o mantém até o fim do período já pago.",
          cancelSubscriptionOff:
            "Sua assinatura continua como está e é cancelada no dia em que sua conta for excluída.",
          passwordLabel: "Confirme com sua senha",
          passwordRequired: "Digite sua senha para confirmar.",
          wrongPassword: "A senha não está correta.",
          alreadyRequested: "Sua conta já está programada para ser excluída.",
          tooManyAttempts:
            "Muitas tentativas. Aguarde um minuto e tente novamente.",
          submit: "Excluir minha conta",
        },
      },
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
          "{remaining} de {max} {max, plural, one {alteração restante} other {alterações restantes}} este mês",
        resetsOn: " · renova em {date}",
        submit: "Atualizar senha",
        successToast: "Senha atualizada com sucesso.",
      },
      changeUsername: {
        title: "Alterar nome de usuário",
        description:
          "Escolha um novo nome de usuário para sua conta. O atual fica reservado para você por {days} dias e os links para ele continuam funcionando.",
        monthlyLimitReached: "Limite mensal atingido",
        usedAllChanges:
          "Você usou todas as {max} alterações de nome de usuário permitidas para este período.",
        availableAgainOn: "Disponível novamente em <strong>{date}</strong>.",
        newUsernameLabel: "Novo nome de usuário",
        newUsernameInfo: "3–20 caracteres, apenas letras e números",
        remainingChanges:
          "{remaining} de {max} {max, plural, one {alteração restante} other {alterações restantes}} este mês",
        resetsOn: " · renova em {date}",
        submit: "Atualizar nome de usuário",
        successToast: "Nome de usuário atualizado com sucesso.",
      },
    },
  },
  actions: {
    unauthorized: "Não autorizado",
    titleAlreadyExists: "Você já tem um com este título. Tente outro.",
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
