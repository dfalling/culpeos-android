import type {Strings} from './en';

// Brazilian Portuguese, used for every `pt` locale.
export const pt: Strings = {
  common: {
    cancel: 'Cancelar',
    close: 'Fechar',
    delete: 'Excluir',
    loading: 'Carregando…',
    tryAgain: 'Tentar novamente',
  },

  login: {
    title: 'Entre no Culpeos',
    email: 'E-mail',
    password: 'Senha',
    submit: 'Entrar',
    invalidCredentials: 'E-mail ou senha inválidos.',
    accountUnconfirmed: 'Confirme seu endereço de e-mail antes de entrar.',
    rateLimited: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
    failed: 'Não foi possível entrar. Tente novamente.',
    securityWarning:
      'Detectamos uma atividade incomum na sua conta. Entre novamente.',
  },

  account: {
    menu: 'Menu da conta',
    closeMenu: 'Fechar o menu da conta',
    logOut: 'Sair',
  },

  map: {
    recenter: 'Centralizar o mapa na sua localização',
    clearTripFilter: 'Remover o filtro de viagem',
    clearLabelFilter: (label: string) => `Remover o filtro ${label}`,
  },

  search: {
    open: 'Pesquisar',
    close: 'Fechar a pesquisa',
    placeholder: 'Pesquisar elementos, viagens, lugares',
    clear: 'Limpar a pesquisa',
    elements: 'Elementos',
    trips: 'Viagens',
    places: 'Lugares',
    tripBadge: 'Viagem',
    noResults: 'Nenhum resultado',
    goToElement: (name: string) => `Ir para o elemento ${name}`,
    filterToTrip: (name: string) => `Filtrar o mapa pela viagem ${name}`,
    goToPlace: (name: string) => `Ir para o lugar ${name}`,
  },

  preview: {
    open: 'Abrir detalhes',
    openFor: (name: string) => `Abrir os detalhes de ${name}`,
    close: 'Fechar a pré-visualização',
  },

  detail: {
    close: 'Fechar detalhes',
    edit: 'Editar',
    editElement: 'Editar elemento',
    completed: '✓ Concluído',
    viewPhoto: 'Ver a foto em tela cheia',
    viewPhotoWith: (description: string) =>
      `Ver a foto em tela cheia: ${description}`,
    about: 'Sobre',
    link: 'Link',
    openLink: (uri: string) => `Abrir o link ${uri}`,
    schedule: 'Horário',
    booking: 'Reserva',
    lookUp: (title: string, value: string) =>
      `Consultar ${title.toLowerCase()} ${value}`,
    labels: 'Etiquetas',
    filterByLabel: (label: string) => `Filtrar o mapa pela etiqueta ${label}`,
    openInMaps: (address: string) => `Abrir ${address} em um app de mapas`,
  },

  edit: {
    title: 'Editar elemento',
    cancel: 'Cancelar a edição',
    save: 'Salvar',
    saveChanges: 'Salvar alterações',
    name: 'Nome',
    icon: 'Ícone',
    chooseIcon: 'Escolher ícone',
    url: 'URL',
    invalidUrl: 'Insira uma URL válida.',
    completed: 'Concluído',
    photos: 'Fotos',
    addPhoto: 'Adicionar foto',
    removePhoto: 'Remover foto',
    description: 'Descrição',
    trips: 'Viagens',
    chooseTrips: 'Escolher viagens',
    addToTrips: 'Adicionar a viagens',
    closeTripPicker: 'Fechar o seletor de viagens',
    noTrips: 'Nenhuma viagem disponível.',
    labels: 'Etiquetas',
    addLabelPlaceholder: 'Adicionar uma etiqueta',
    addLabel: 'Adicionar etiqueta',
    add: 'Adicionar',
    removeLabel: (label: string) => `Remover a etiqueta ${label}`,
    deleteElement: 'Excluir elemento',
    deleteConfirm: (name: string) =>
      `Excluir “${name}” permanentemente? Essa ação não pode ser desfeita.`,
    addPhotoFailed: 'Não foi possível adicionar a foto. Tente novamente.',
    saveFailed: 'Não foi possível salvar as alterações. Tente novamente.',
    deleteFailed: 'Não foi possível excluir o elemento. Tente novamente.',
  },

  share: {
    cancel: 'Cancelar a importação',
    failedTitle: 'Não foi possível salvar',
    failedBody:
      'Não conseguimos importar o que você compartilhou. Verifique sua conexão e tente novamente.',
    saving: 'Salvando o link compartilhado…',
  },

  photo: {
    photo: 'Foto',
    close: 'Fechar a foto',
  },

  booking: {
    number: 'Número',
    departureLocation: 'Origem',
    arrivalLocation: 'Destino',
    reservation: 'Reserva',
    seat: 'Assento',
    paymentDetails: 'Pagamento',
    address: 'Endereço',
    flight: 'Voo',
    train: 'Trem',
    bus: 'Ônibus',
    ferry: 'Balsa',
    flightStatusQuery: (number: string) => `status do voo ${number}`,
  },

  schedule: {
    months: [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ],
    // `14 mar` / `14 mar 2026`
    date: (day: number, month: string, year?: number) =>
      year === undefined ? `${day} ${month}` : `${day} ${month} ${year}`,
    // 24-hour clock: `09:00`, `14:30`
    time: (hours: number, minutes: number) =>
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    at: (time: string, date: string) => `${time}, ${date}`,
    until: (time: string, date: string, _hours: number) =>
      `Até ${time}, ${date}`,
    timeRange: (start: string, end: string, date: string) =>
      `${start} – ${end}, ${date}`,
    range: (from: string, to: string) => `${from} – ${to}`,
  },
};
