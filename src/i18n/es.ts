import type {Strings} from './en';

// Neutral (Latin American–leaning) Spanish.
export const es: Strings = {
  common: {
    cancel: 'Cancelar',
    close: 'Cerrar',
    delete: 'Eliminar',
    loading: 'Cargando…',
    tryAgain: 'Reintentar',
  },

  login: {
    title: 'Inicia sesión en Culpeos',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Iniciar sesión',
    invalidCredentials: 'Correo electrónico o contraseña incorrectos.',
    accountUnconfirmed:
      'Confirma tu correo electrónico antes de iniciar sesión.',
    rateLimited: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
    failed: 'No se pudo iniciar sesión. Vuelve a intentarlo.',
    securityWarning:
      'Detectamos actividad inusual en tu cuenta. Vuelve a iniciar sesión.',
  },

  account: {
    menu: 'Menú de la cuenta',
    closeMenu: 'Cerrar el menú de la cuenta',
    logOut: 'Cerrar sesión',
  },

  map: {
    recenter: 'Centrar el mapa en tu ubicación',
    clearLabelFilter: (label: string) => `Quitar el filtro ${label}`,
  },

  filters: {
    open: 'Filtros',
    openWithCount: (count: number) =>
      count === 1 ? 'Filtros, 1 activo' : `Filtros, ${count} activos`,
    title: 'Filtros',
    close: 'Cerrar los filtros',
    clearAll: 'Quitar todos',
    clearFilter: (name: string) => `Quitar el filtro ${name}`,
    text: 'Texto',
    searchPlaceholder: 'Nombre, descripción o etiqueta',
    labels: 'Etiquetas',
    noLabels: 'Aquí aparecen las etiquetas de los elementos que has cargado.',
    trips: 'Viajes',
    notInTrip: 'Sin viaje',
    sharing: 'Compartir',
    private: 'Privados',
    shared: 'Compartidos',
    noTrips: 'Aún no hay viajes.',
    all: 'Todos',
    schedule: 'Programación',
    scheduled: 'Programados',
    unscheduled: 'Sin programar',
    progress: 'Progreso',
    toDo: 'Pendientes',
    done: 'Hechos',
    deleted: 'Solo eliminados',
  },

  search: {
    open: 'Buscar',
    close: 'Cerrar la búsqueda',
    placeholder: 'Buscar elementos, viajes, lugares',
    clear: 'Borrar la búsqueda',
    elements: 'Elementos',
    trips: 'Viajes',
    places: 'Lugares',
    tripBadge: 'Viaje',
    noResults: 'Sin resultados',
    goToElement: (name: string) => `Ir al elemento ${name}`,
    filterToTrip: (name: string) => `Filtrar el mapa por el viaje ${name}`,
    goToPlace: (name: string) => `Ir al lugar ${name}`,
  },

  preview: {
    open: 'Abrir detalles',
    openFor: (name: string) => `Abrir los detalles de ${name}`,
    close: 'Cerrar la vista previa',
  },

  detail: {
    close: 'Cerrar detalles',
    edit: 'Editar',
    editElement: 'Editar elemento',
    completed: '✓ Completado',
    viewPhoto: 'Ver la foto en pantalla completa',
    viewPhotoWith: (description: string) =>
      `Ver la foto en pantalla completa: ${description}`,
    about: 'Información',
    link: 'Enlace',
    openLink: (uri: string) => `Abrir el enlace ${uri}`,
    schedule: 'Horario',
    booking: 'Reserva',
    lookUp: (title: string, value: string) =>
      `Consultar ${title.toLowerCase()} ${value}`,
    labels: 'Etiquetas',
    filterByLabel: (label: string) =>
      `Filtrar el mapa por la etiqueta ${label}`,
    openInMaps: (address: string) => `Abrir ${address} en una app de mapas`,
  },

  edit: {
    title: 'Editar elemento',
    cancel: 'Cancelar la edición',
    save: 'Guardar',
    saveChanges: 'Guardar cambios',
    name: 'Nombre',
    icon: 'Ícono',
    chooseIcon: 'Elegir ícono',
    url: 'URL',
    invalidUrl: 'Ingresa una URL válida.',
    completed: 'Completado',
    photos: 'Fotos',
    addPhoto: 'Agregar foto',
    removePhoto: 'Quitar foto',
    description: 'Descripción',
    trips: 'Viajes',
    chooseTrips: 'Elegir viajes',
    addToTrips: 'Agregar a viajes',
    closeTripPicker: 'Cerrar el selector de viajes',
    noTrips: 'No hay viajes disponibles.',
    labels: 'Etiquetas',
    addLabelPlaceholder: 'Agregar una etiqueta',
    addLabel: 'Agregar etiqueta',
    add: 'Agregar',
    removeLabel: (label: string) => `Quitar la etiqueta ${label}`,
    deleteElement: 'Eliminar elemento',
    deleteConfirm: (name: string) =>
      `¿Eliminar «${name}» de forma permanente? Esta acción no se puede deshacer.`,
    addPhotoFailed: 'No se pudo agregar la foto. Vuelve a intentarlo.',
    saveFailed: 'No se pudieron guardar los cambios. Vuelve a intentarlo.',
    deleteFailed: 'No se pudo eliminar el elemento. Vuelve a intentarlo.',
  },

  share: {
    cancel: 'Cancelar la importación',
    failedTitle: 'No se pudo guardar',
    failedBody:
      'No pudimos importar lo que compartiste. Revisa tu conexión y vuelve a intentarlo.',
    saving: 'Guardando el enlace compartido…',
  },

  photo: {
    photo: 'Foto',
    close: 'Cerrar la foto',
  },

  booking: {
    number: 'Número',
    departureLocation: 'Origen',
    arrivalLocation: 'Destino',
    reservation: 'Reserva',
    seat: 'Asiento',
    paymentDetails: 'Pago',
    address: 'Dirección',
    flight: 'Vuelo',
    train: 'Tren',
    bus: 'Autobús',
    ferry: 'Ferry',
    flightStatusQuery: (number: string) => `estado del vuelo ${number}`,
  },

  schedule: {
    months: [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sept',
      'oct',
      'nov',
      'dic',
    ],
    // `14 mar` / `14 mar 2026`
    date: (day: number, month: string, year?: number) =>
      year === undefined ? `${day} ${month}` : `${day} ${month} ${year}`,
    // 24-hour clock: `9:00`, `14:30`
    time: (hours: number, minutes: number) =>
      `${hours}:${String(minutes).padStart(2, '0')}`,
    at: (time: string, date: string) => `${time}, ${date}`,
    // "hasta la 1:00" but "hasta las 2:00"
    until: (time: string, date: string, hours: number) =>
      `Hasta ${hours === 1 ? 'la' : 'las'} ${time}, ${date}`,
    timeRange: (start: string, end: string, date: string) =>
      `${start} – ${end}, ${date}`,
    range: (from: string, to: string) => `${from} – ${to}`,
  },
};
