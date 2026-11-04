// English strings: the source of truth for every translation. `Strings` is
// derived from this object, so another language that misses a key (or gets a
// function's parameters wrong) fails to type-check.

export const en = {
  common: {
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    loading: 'Loading…',
    tryAgain: 'Try again',
  },

  login: {
    title: 'Sign in to Culpeos',
    email: 'Email',
    password: 'Password',
    submit: 'Log in',
    invalidCredentials: 'Invalid email or password.',
    accountUnconfirmed: 'Please confirm your email address before logging in.',
    rateLimited: 'Too many attempts. Please wait a minute and try again.',
    failed: 'Login failed. Please try again.',
    securityWarning:
      'We detected unusual activity on your account. Please log in again.',
  },

  account: {
    menu: 'Account menu',
    closeMenu: 'Close account menu',
    logOut: 'Log out',
  },

  map: {
    recenter: 'Recenter map on your location',
    clearLabelFilter: (label: string) => `Clear ${label} filter`,
  },

  filters: {
    open: 'Filters',
    openWithCount: (count: number) =>
      count === 1 ? 'Filters, 1 active' : `Filters, ${count} active`,
    title: 'Filters',
    close: 'Close filters',
    clearAll: 'Clear all',
    clearFilter: (name: string) => `Clear ${name} filter`,
    text: 'Text',
    searchPlaceholder: 'Name, description or label',
    labels: 'Labels',
    noLabels: 'Labels on the elements you have loaded show up here.',
    trips: 'Trips',
    notInTrip: 'Not in a trip',
    sharing: 'Sharing',
    private: 'Private',
    shared: 'Shared',
    noTrips: 'No trips yet.',
    all: 'All',
    schedule: 'Schedule',
    scheduled: 'Scheduled',
    unscheduled: 'Unscheduled',
    progress: 'Progress',
    toDo: 'To do',
    done: 'Done',
    deleted: 'Deleted only',
  },

  search: {
    open: 'Search',
    close: 'Close search',
    placeholder: 'Search elements, trips, places',
    clear: 'Clear search',
    elements: 'Elements',
    trips: 'Trips',
    places: 'Places',
    tripBadge: 'Trip',
    noResults: 'No results',
    goToElement: (name: string) => `Go to element ${name}`,
    filterToTrip: (name: string) => `Filter map to trip ${name}`,
    goToPlace: (name: string) => `Go to place ${name}`,
  },

  preview: {
    open: 'Open details',
    openFor: (name: string) => `Open details for ${name}`,
    close: 'Close preview',
  },

  detail: {
    close: 'Close details',
    edit: 'Edit',
    editElement: 'Edit element',
    completed: '✓ Completed',
    viewPhoto: 'View photo full screen',
    viewPhotoWith: (description: string) =>
      `View photo full screen: ${description}`,
    about: 'About',
    link: 'Link',
    openLink: (uri: string) => `Open link ${uri}`,
    schedule: 'Schedule',
    booking: 'Booking',
    lookUp: (title: string, value: string) =>
      `Look up ${title.toLowerCase()} ${value}`,
    labels: 'Labels',
    filterByLabel: (label: string) => `Filter map by label ${label}`,
    openInMaps: (address: string) => `Open ${address} in a map app`,
  },

  edit: {
    title: 'Edit element',
    cancel: 'Cancel editing',
    save: 'Save',
    saveChanges: 'Save changes',
    name: 'Name',
    icon: 'Icon',
    chooseIcon: 'Choose icon',
    url: 'URL',
    invalidUrl: 'Enter a valid URL.',
    completed: 'Completed',
    photos: 'Photos',
    description: 'Description',
    location: 'Location',
    searchLocation: 'Search for a place',
    search: 'Search',
    chooseLocation: (name: string) => `Use ${name} as the location`,
    removeLocation: 'Remove location',
    locationSearchFailed: 'Could not search places. Please try again.',
    trips: 'Trips',
    chooseTrips: 'Choose trips',
    addToTrips: 'Add to trips',
    closeTripPicker: 'Close trip picker',
    noTrips: 'No trips available.',
    labels: 'Labels',
    addLabelPlaceholder: 'Add a label',
    addLabel: 'Add label',
    add: 'Add',
    removeLabel: (label: string) => `Remove label ${label}`,
    deleteElement: 'Delete element',
    deleteConfirm: (name: string) =>
      `Permanently delete "${name}"? This can't be undone.`,
    addPhotoFailed: 'Could not add photo. Please try again.',
    saveFailed: 'Could not save changes. Please try again.',
    deleteFailed: 'Could not delete element. Please try again.',
  },

  create: {
    open: 'Add',
    close: 'Close add menu',
    newElement: 'New element',
    newTrip: 'New trip',
    title: 'New element',
    cancel: 'Cancel new element',
    create: 'Create',
    saveFailed: 'Could not create element. Please try again.',
  },

  createTrip: {
    title: 'New trip',
    cancel: 'Cancel new trip',
    create: 'Create trip',
    saveFailed: 'Could not create trip. Please try again.',
  },

  share: {
    cancel: 'Cancel import',
    failedTitle: "Couldn't save that",
    failedBody:
      "We couldn't import what you shared. Check your connection and try again.",
    saving: 'Saving shared link…',
  },

  photo: {
    photo: 'Photo',
    close: 'Close photo',
  },

  photos: {
    addPhoto: 'Add photo',
    closePicker: 'Close photo picker',
    fromDevice: 'Upload from this device',
    fromDeviceMultiple: 'Upload from this device (up to 10)',
    orSearch: 'Or search',
    searchPlaceholder: 'Search photos',
    search: 'Search',
    searchFailed: 'Search failed. Please try again.',
    noResults: 'No photos found.',
    chooseResult: (description: string) => `Choose photo: ${description}`,
    position: (index: number, count: number) => `Photo ${index} of ${count}`,
    selectToEdit: 'Select to reorder or edit alt text',
    altText: 'Alt text',
    altTextPlaceholder: 'Describe the photo',
    altTextFromSource: 'Comes from the photo’s source and can’t be changed.',
    altTextFailed: 'Saved, but some alt text could not be updated.',
    moveEarlier: 'Move earlier',
    moveLater: 'Move later',
    remove: 'Remove photo',
    removeAt: (position: string) => `Remove ${position}`,
  },

  booking: {
    number: 'Number',
    departureLocation: 'From',
    arrivalLocation: 'To',
    reservation: 'Reservation',
    seat: 'Seat',
    paymentDetails: 'Payment',
    address: 'Address',
    flight: 'Flight',
    train: 'Train',
    bus: 'Bus',
    ferry: 'Ferry',
    flightStatusQuery: (number: string) => `${number} flight status`,
  },

  // Pieces formatSchedule assembles. Times arrive as 24-hour clock values.
  schedule: {
    months: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    // `Mar 14` / `Mar 14, 2026`
    date: (day: number, month: string, year?: number) =>
      year === undefined ? `${month} ${day}` : `${month} ${day}, ${year}`,
    // `2:30 PM`; a whole hour drops the minutes -> `2 PM`
    time: (hours: number, minutes: number) => {
      const meridiem = hours < 12 ? 'AM' : 'PM';
      const hour = hours % 12 || 12;
      return minutes === 0
        ? `${hour} ${meridiem}`
        : `${hour}:${String(minutes).padStart(2, '0')} ${meridiem}`;
    },
    at: (time: string, date: string) => `${time}, ${date}`,
    until: (time: string, date: string, _hours: number) =>
      `Until ${time}, ${date}`,
    timeRange: (start: string, end: string, date: string) =>
      `${start} to ${end}, ${date}`,
    range: (from: string, to: string) => `${from} to ${to}`,
  },
};

export type Strings = typeof en;
