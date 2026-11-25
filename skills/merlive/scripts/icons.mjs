// Why: an author who writes "fa:fa-truck Shipped" meant a truck. Merlive fetches nothing, so it cannot ask
// Font Awesome for one, and Font Awesome's drawings are its own. These are Merlive's: plain line icons of the
// things flowcharts point at, drawn to sit beside 13px words in a box. Pure: a name in, a drawing out.

// What an icon is held to, named once. The tests check every drawing against these.
export const iconMeasure = {
  grid: 16, // px a side: the height of a line of words in a box, so an icon and its label share one line
  stroke: 1.5, // px, with round ends and corners: the weight of a box's own edge, so an icon belongs to its box
  least: 9.5, // the least an icon reaches across or down, so none looks small beside its neighbours
  offCentre: 1, // how far the middle of a drawing may sit from the middle of the grid before it looks pushed aside
};

/** A circle, as two half turns, so every drawing is one path. */
const ring = (/** @type {number} */ cx, /** @type {number} */ cy, /** @type {number} */ r) => {
  const n = (/** @type {number} */ v) => Math.round(v * 10) / 10;
  return `M${n(cx - r)} ${cy}A${r} ${r} 0 1 0 ${n(cx + r)} ${cy}A${r} ${r} 0 1 0 ${n(cx - r)} ${cy}`;
};
/** A box, from its top left corner. Its corners are rounded by the stroke, like every other corner here. */
const box = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h) => {
  const n = (/** @type {number} */ v) => Math.round(v * 10) / 10;
  return `M${x} ${y}H${n(x + w)}V${n(y + h)}H${x}Z`;
};
/** A dot: a stroke too short to see as a line, which its round ends make a spot. */
const dot = (/** @type {number} */ x, /** @type {number} */ y) => `M${x} ${y}V${Math.round((y + 0.1) * 10) / 10}`;

// Each drawing is strokes only, no fill, so it takes the colour of the words beside it. They are drawn by hand
// on the grid: what each is made of is said beside it, because nobody can read a path.
/** @type {Record<string, string>} */
export const icons = {
  // people
  user: `${ring(8, 5.2, 2.7)}M2.8 14C2.8 11.3 5 9.9 8 9.9C11 9.9 13.2 11.3 13.2 14`, // a head and shoulders
  users: `${ring(6, 5.6, 2.4)}M1.5 13.8C1.5 11.4 3.4 10.1 6 10.1C8.6 10.1 10.5 11.4 10.5 13.8M10.6 3.4A2.4 2.4 0 0 1 10.6 7.8M12 10.4C13.6 10.8 14.5 12 14.5 13.8`, // one in front, one behind
  robot: `${box(3, 5, 10, 8.5)}M8 5V2.6${dot(8, 2.2)}M6 8.4V9.6M10 8.4V9.6M6.2 11.5H9.8M1.5 8.2V10.8M14.5 8.2V10.8`, // a head with an aerial, eyes, a mouth and ears

  // where things are kept and run
  database: `M3 4.4A5 2 0 1 0 13 4.4A5 2 0 1 0 3 4.4M3 4.4V11.6A5 2 0 0 0 13 11.6V4.4M3 8A5 2 0 0 0 13 8`, // a drum with one band
  server: `${box(2.5, 2.5, 11, 4.7)}${box(2.5, 8.8, 11, 4.7)}${dot(5.2, 4.8)}${dot(5.2, 11.1)}`, // two units, each with a light
  cloud: `M4.9 12.5H11.4A3 3 0 0 0 12 6.6A4 4 0 0 0 4.4 7.2A2.7 2.7 0 0 0 4.9 12.5Z`, // three bumps on a flat base
  folder: `M2 3.5H6.3L7.8 5.5H14V12.5H2Z`, // a tab and a pocket
  file: `M3.5 1.5H9.5L12.5 4.5V14.5H3.5ZM9.5 1.5V4.5H12.5M6 8.5H10M6 11.2H10`, // a sheet with a turned corner and two lines
  box: `M8 1.8L13.8 4.8V11.2L8 14.2L2.2 11.2V4.8ZM2.2 4.8L8 7.8L13.8 4.8M8 7.8V14.2`, // a parcel, seen from a corner
  book: `M8 4.5C8 3.7 7.3 3 6.5 3H2.5V12.3H6.5C7.3 12.3 8 12.7 8 13.5ZM8 4.5C8 3.7 8.7 3 9.5 3H13.5V12.3H9.5C8.7 12.3 8 12.7 8 13.5`, // open at the middle
  table: `${box(2, 3, 12, 10)}M2 6.4H14M2 9.7H14M6.2 6.4V13`, // rows under a heading, and one column line
  list: `${dot(2.6, 4)}${dot(2.6, 8)}${dot(2.6, 12)}M5.5 4H13.5M5.5 8H13.5M5.5 12H13.5`, // three points and their lines
  building: `${box(3.5, 2, 9, 12)}M6.5 4.6V5.4M9.5 4.6V5.4M6.5 7.6V8.4M9.5 7.6V8.4M8 14V11.2`, // a block, its windows and its door
  home: `M2 8L8 2.5L14 8M4 6.6V13.5H12V6.6M6.8 13.5V10H9.2V13.5`, // a roof, walls and a door
  globe: `${ring(8, 8, 6)}M8 2A2.6 6 0 1 0 8 14A2.6 6 0 1 0 8 2M2 8H14`, // a ball with one line round it and one over it
  sitemap: `${box(6, 2, 4, 3.2)}${box(2, 10.8, 4.4, 3.2)}${box(9.6, 10.8, 4.4, 3.2)}M8 5.2V8M4.2 10.8V8H11.8V10.8`, // one box over two

  // machines
  laptop: `${box(3, 3, 10, 7.5)}M1.5 13H14.5`, // a screen on its base
  mobile: `${box(4.5, 1.5, 7, 13)}M7.3 12H8.7`, // a handset and its button
  phone: `M4 2.5H6L7 5.5L5.5 6.8C6.3 8.7 7.3 9.7 9.2 10.5L10.5 9L13.5 10V12C13.5 13 12.8 13.5 12 13.5C7 13.5 2.5 9 2.5 4C2.5 3.2 3 2.5 4 2.5Z`, // a receiver, its two ends turned up
  print: `M4.5 5.5V2H11.5V5.5M4.5 11.5H2V5.5H14V11.5H11.5${box(4.5, 9, 7, 5)}`, // paper in, a body, paper out
  camera: `M2 5H5L6 3.2H10L11 5H14V13H2Z${ring(8, 8.9, 2.4)}`, // a body with a hump and a lens
  chip: `${box(4, 4, 8, 8)}M6 4V2M10 4V2M6 12V14M10 12V14M4 6H2M4 10H2M12 6H14M12 10H14`, // a square with two legs a side
  truck: `M1.5 3.8H9.5V10.6H1.5ZM9.5 6.2H12.4L14.5 8.6V10.6H9.5${ring(4.6, 12.3, 1.6)}${ring(11.6, 12.3, 1.6)}`, // a load, a cab and two wheels under them
  cart: `M1.5 2.5H3.5L5.5 10.5H12.5L14 5H4.2${ring(6.2, 13.2, 1)}${ring(11.8, 13.2, 1)}`, // a basket on a handle, and two wheels

  // settings and tools
  gear: `M6.4 3.7L6.7 1.8L9.3 1.8L9.6 3.7L10.9 4.4L12.7 3.8L14 6.1L12.5 7.3L12.5 8.7L14 9.9L12.7 12.2L10.9 11.6L9.6 12.3L9.3 14.2L6.7 14.2L6.4 12.3L5.1 11.6L3.3 12.2L2 9.9L3.5 8.7L3.5 7.3L2 6.1L3.3 3.8L5.1 4.4Z${ring(8, 8, 1.8)}`, // six teeth round a wheel, and its hole
  wrench: `M7.7 6.6A3.4 3.4 0 0 1 11.8 2L11.4 4.6L14 4.2A3.4 3.4 0 0 1 9.4 8.3L4.2 13.4A1.2 1.2 0 0 1 2.6 11.8Z`, // an open jaw on a handle
  filter: `M2 3H14L9.5 8.5V13.5L6.5 12V8.5Z`, // a funnel
  pen: `M2.5 13.5L3.2 10.3L10.8 2.7L13.3 5.2L5.7 12.8ZM9.2 4.3L11.7 6.8`, // a pencil on its point
  trash: `M2.5 4H13.5M6 4V2.5H10V4M4 4L4.7 13.5H11.3L12 4M6.8 6.6V11M9.2 6.6V11`, // a bin with its lid on
  key: `${ring(5.2, 10.8, 2.7)}M7.1 8.9L13.5 2.5M11 5L12.8 6.8M9.2 6.8L10.5 8.1`, // a bow, a shank and two teeth
  lock: `${box(3.5, 7, 9, 6.5)}M5.5 7V5A2.5 2.5 0 0 1 10.5 5V7${dot(8, 10.2)}`, // a body, a shackle and a keyhole
  shield: `M8 1.8L13.5 4V8C13.5 11 11 13.3 8 14.5C5 13.3 2.5 11 2.5 8V4Z`, // a badge that comes to a point
  link: `M5.2 13.4L8.3 10.3A1.9 1.9 0 0 0 5.7 7.7L2.6 10.8A1.9 1.9 0 0 0 5.2 13.4ZM10.3 8.3L13.4 5.2A1.9 1.9 0 0 0 10.8 2.6L7.7 5.7A1.9 1.9 0 0 0 10.3 8.3Z`, // two links of a chain, one through the other
  tag: `M2.5 2.5H8L14 8.5L8.5 14L2.5 8Z${dot(5.4, 5.4)}`, // a label with its hole
  flag: `M3.5 2V14.5M3.5 3H12.5L10.5 6L12.5 9H3.5`, // a pole and a swallow-tailed flag
  lightbulb: `M6 10.5A4.3 4.3 0 1 1 10 10.5V12H6ZM6.8 14H9.2`, // a bulb and its cap

  // messages
  envelope: `${box(2, 3.5, 12, 9)}M2.3 3.9L8 8.7L13.7 3.9`, // a letter and its flap
  comment: `M2.5 3H13.5V10.5H7.5L4.5 13.5V10.5H2.5Z`, // a speech bubble
  bell: `M3.5 11.5L4.5 10V7A3.5 3.5 0 0 1 11.5 7V10L12.5 11.5ZM6.8 13.6H9.2M8 2.2V3.5`, // a bell, its clapper and its crown
  send: `M14 2L2 7L6.5 9.5L9 14ZM14 2L6.5 9.5`, // a paper dart

  // time
  clock: `${ring(8, 8, 6)}M8 4.5V8L10.5 9.5`, // a face and two hands
  calendar: `${box(2.5, 3.5, 11, 10.5)}M2.5 6.6H13.5M5.5 2V4.6M10.5 2V4.6`, // a page, its heading and two rings
  spinner: `M8 2V4.6M8 11.4V14M2 8H4.6M11.4 8H14M3.8 3.8L5.6 5.6M10.4 10.4L12.2 12.2M3.8 12.2L5.6 10.4M10.4 5.6L12.2 3.8`, // eight strokes round a middle
  refresh: `M13.4 9A5.5 5.5 0 1 1 12.5 4.9M12.7 1.7V4.9H9.5`, // most of a circle, and an arrowhead

  // yes, no and watch out
  check: `M3 8.5L6.5 12L13 4.5`, // a tick
  xmark: `M3.2 3.2L12.8 12.8M12.8 3.2L3.2 12.8`, // a cross
  plus: `M8 3V13M3 8H13`,
  minus: `M3 8H13`,
  ban: `${ring(8, 8, 6)}M3.8 3.8L12.2 12.2`, // a circle struck through
  warning: `M8 2L14.5 13.5H1.5ZM8 6.5V9.6${dot(8, 11.5)}`, // a triangle with an exclamation mark
  question: `${ring(8, 8, 6)}M6.1 6.4A1.9 1.9 0 1 1 8 8.3V9.3${dot(8, 11.3)}`, // a question mark in a circle
  info: `${ring(8, 8, 6)}M8 7.5V11.5${dot(8, 4.8)}`, // an i in a circle
  bug: `M8 4.5A3 4.5 0 1 0 8 13.5A3 4.5 0 1 0 8 4.5M5.2 7L2.5 5.5M5 9.5H2M5.3 12L2.8 13.5M10.8 7L13.5 5.5M11 9.5H14M10.7 12L13.2 13.5M6.8 4.8L5.5 2.5M9.2 4.8L10.5 2.5`, // a body, six legs and two feelers
  bolt: `M9 1.5L3.5 9H8L7 14.5L12.5 7H8Z`, // a flash of lightning
  eye: `M1.5 8C3.5 4.5 5.8 3.5 8 3.5C10.2 3.5 12.5 4.5 14.5 8C12.5 11.5 10.2 12.5 8 12.5C5.8 12.5 3.5 11.5 1.5 8Z${ring(8, 8, 2)}`, // two lids and a pupil
  search: `${ring(7, 7, 4.2)}M10.2 10.2L14 14`, // a glass and its handle
  star: `M8 2.5L9.5 6.4L13.7 6.7L10.5 9.3L11.5 13.4L8 11.1L4.5 13.4L5.5 9.3L2.3 6.7L6.5 6.4Z`, // five points
  heart: `M8 13.5C3 10 2 7.5 2 5.7A3.1 3.1 0 0 1 8 4.7A3.1 3.1 0 0 1 14 5.7C14 7.5 13 10 8 13.5Z`,

  // money and numbers
  money: `${box(1.5, 4, 13, 8)}${ring(8, 8, 2)}${dot(4, 8)}${dot(12, 8)}`, // a banknote, whatever the currency
  'credit-card': `${box(1.5, 3.5, 13, 9)}M1.5 6.6H14.5M4 10H7`, // a card, its stripe and its name
  chart: `M2.5 2.5V13.5H13.5M5.5 11V8M8.5 11V5M11.5 11V9.5`, // two axes and three bars
  code: `M5 5L2 8L5 11M11 5L14 8L11 11M9.2 3.5L6.8 12.5`, // two angle brackets and a slash
  image: `${box(2, 3, 12, 10)}${ring(5.6, 6.3, 1.1)}M2 11.6L6 8.2L8.8 10.8L10.8 9.2L14 12`, // a frame, a sun and two hills

  // which way
  play: `M4.5 2.5L13 8L4.5 13.5Z`,
  stop: box(3, 3, 10, 10),
  pause: `M5.5 3V13M10.5 3V13`,
  download: `M8 2V10M4.5 6.5L8 10L11.5 6.5M2.5 11V13.5H13.5V11`, // an arrow down into a tray
  upload: `M8 10V2M4.5 5.5L8 2L11.5 5.5M2.5 11V13.5H13.5V11`, // an arrow up out of a tray
  'arrow-right': `M2.5 8H13.5M9.5 4L13.5 8L9.5 12`,
  'arrow-left': `M13.5 8H2.5M6.5 4L2.5 8L6.5 12`,
  'arrow-up': `M8 13.5V2.5M4 6.5L8 2.5L12 6.5`,
  'arrow-down': `M8 2.5V13.5M4 9.5L8 13.5L12 9.5`,
};

// The other names a thing goes by: Font Awesome's across its versions 4, 5 and 6, and the plain words people
// reach for. Each leads to a drawing above. A name ending "-o", "-alt", "-circle" or "-square" is tried without
// that ending too, so not every such form is listed.
/** @type {Record<string, string>} */
export const aliases = {
  // people
  'user-alt': 'user', 'user-large': 'user', person: 'user', 'circle-user': 'user', 'id-badge': 'user', 'user-tie': 'user', 'user-check': 'user', 'user-plus': 'user', 'user-cog': 'user', 'user-gear': 'user',
  group: 'users', 'user-friends': 'users', 'user-group': 'users', 'people-group': 'users', team: 'users',
  android: 'robot', bot: 'robot',
  // where things are kept and run
  db: 'database', storage: 'database', hdd: 'database', 'hard-drive': 'database',
  servers: 'server', 'network-wired': 'sitemap', 'diagram-project': 'sitemap', 'project-diagram': 'sitemap',
  'cloud-upload': 'cloud', 'cloud-download': 'cloud', 'cloud-arrow-up': 'cloud', 'cloud-arrow-down': 'cloud',
  'folder-open': 'folder', directory: 'folder',
  'file-lines': 'file', 'file-text': 'file', document: 'file', 'file-pdf': 'file', 'file-code': 'file', 'file-invoice': 'file', 'file-contract': 'file', 'file-export': 'file', 'file-import': 'file', 'file-csv': 'file', 'file-excel': 'file', 'file-word': 'file', clipboard: 'file', 'clipboard-list': 'file', 'clipboard-check': 'file', receipt: 'file', copy: 'file', 'sticky-note': 'file', 'note-sticky': 'file',
  cube: 'box', cubes: 'box', archive: 'box', 'box-archive': 'box', 'box-open': 'box', package: 'box', parcel: 'box', boxes: 'box', 'boxes-stacked': 'box', inbox: 'box', warehouse: 'building',
  'book-open': 'book', 'address-book': 'book', bookmark: 'book', docs: 'book',
  'table-cells': 'table', th: 'table', 'th-large': 'table', grid: 'table', 'table-list': 'table',
  'list-ul': 'list', 'list-ol': 'list', 'list-alt': 'list', 'list-check': 'list', tasks: 'list', bars: 'list', 'th-list': 'list', 'align-justify': 'list',
  office: 'building', bank: 'building', university: 'building', landmark: 'building', 'building-columns': 'building', hospital: 'building', industry: 'building', store: 'building', shop: 'building', city: 'building',
  house: 'home', 'house-user': 'home', 'home-alt': 'home', 'home-lg': 'home',
  world: 'globe', earth: 'globe', 'earth-americas': 'globe', 'earth-europe': 'globe', 'globe-americas': 'globe', 'globe-europe': 'globe', internet: 'globe', language: 'globe',
  // machines
  desktop: 'laptop', computer: 'laptop', display: 'laptop', tv: 'laptop', 'laptop-code': 'laptop',
  'mobile-screen': 'mobile', 'mobile-phone': 'mobile', 'mobile-button': 'mobile', 'mobile-screen-button': 'mobile', smartphone: 'mobile', tablet: 'mobile', 'tablet-alt': 'mobile',
  'phone-alt': 'phone', 'phone-flip': 'phone', 'phone-volume': 'phone', headset: 'phone', call: 'phone',
  printer: 'print',
  'camera-retro': 'camera', video: 'camera', photo: 'image', picture: 'image', 'picture-o': 'image', images: 'image', 'file-image': 'image',
  microchip: 'chip', memory: 'chip', cpu: 'chip',
  'truck-fast': 'truck', 'shipping-fast': 'truck', 'truck-moving': 'truck', shipping: 'truck', delivery: 'truck', lorry: 'truck', van: 'truck', 'truck-loading': 'truck', 'truck-ramp-box': 'truck',
  'shopping-cart': 'cart', 'cart-shopping': 'cart', 'cart-plus': 'cart', 'cart-arrow-down': 'cart', basket: 'cart', 'shopping-basket': 'cart', 'basket-shopping': 'cart', 'shopping-bag': 'cart', 'bag-shopping': 'cart',
  // settings and tools
  cog: 'gear', cogs: 'gear', gears: 'gear', settings: 'gear', sliders: 'gear', 'sliders-h': 'gear',
  tools: 'wrench', 'screwdriver-wrench': 'wrench', toolbox: 'wrench', hammer: 'wrench', screwdriver: 'wrench',
  funnel: 'filter',
  pencil: 'pen', 'pencil-alt': 'pen', edit: 'pen', 'pen-to-square': 'pen', 'pencil-square': 'pen', 'pen-alt': 'pen', 'pen-nib': 'pen', 'pen-fancy': 'pen', signature: 'pen', write: 'pen',
  'trash-can': 'trash', delete: 'trash', bin: 'trash', dumpster: 'trash',
  password: 'key',
  'lock-open': 'lock', unlock: 'lock', 'unlock-alt': 'lock', secure: 'lock',
  'shield-alt': 'shield', 'shield-halved': 'shield', 'user-shield': 'shield', security: 'shield', 'shield-check': 'shield',
  chain: 'link', 'link-slash': 'link', unlink: 'link', 'external-link': 'link', 'up-right-from-square': 'link', 'arrow-up-right-from-square': 'link', paperclip: 'link',
  tags: 'tag', label: 'tag', ticket: 'tag', 'ticket-alt': 'tag',
  'flag-checkered': 'flag',
  idea: 'lightbulb', bulb: 'lightbulb',
  // messages
  mail: 'envelope', email: 'envelope', 'envelope-open': 'envelope', 'envelope-open-text': 'envelope', at: 'envelope',
  comments: 'comment', 'comment-dots': 'comment', 'comment-alt': 'comment', message: 'comment', chat: 'comment', sms: 'comment', 'commenting': 'comment',
  'bell-slash': 'bell', notification: 'bell', alert: 'bell', 'concierge-bell': 'bell', 'bell-concierge': 'bell',
  'paper-plane': 'send', share: 'send', 'share-alt': 'send', 'share-nodes': 'send', reply: 'send',
  // time
  time: 'clock', 'clock-four': 'clock', history: 'clock', stopwatch: 'clock', hourglass: 'clock', 'hourglass-half': 'clock', 'hourglass-start': 'clock', 'hourglass-end': 'clock', 'business-time': 'clock', 'user-clock': 'clock',
  'calendar-alt': 'calendar', 'calendar-days': 'calendar', 'calendar-check': 'calendar', 'calendar-day': 'calendar', 'calendar-week': 'calendar', date: 'calendar', schedule: 'calendar',
  'circle-notch': 'spinner', loading: 'spinner',
  sync: 'refresh', 'sync-alt': 'refresh', rotate: 'refresh', 'arrows-rotate': 'refresh', redo: 'refresh', 'redo-alt': 'refresh', 'rotate-right': 'refresh', undo: 'refresh', 'rotate-left': 'refresh', retweet: 'refresh', repeat: 'refresh', recycle: 'refresh', reload: 'refresh', 'arrow-rotate-right': 'refresh', 'arrow-rotate-left': 'refresh',
  // yes, no and watch out
  'check-double': 'check', 'check-to-slot': 'check', tick: 'check', ok: 'check', done: 'check', 'thumbs-up': 'check',
  times: 'xmark', close: 'xmark', remove: 'xmark', x: 'xmark', cancel: 'xmark', 'window-close': 'xmark', 'rectangle-xmark': 'xmark', 'thumbs-down': 'xmark',
  add: 'plus',
  subtract: 'minus',
  'circle-stop': 'stop', block: 'ban', forbidden: 'ban', 'do-not-enter': 'ban',
  'exclamation-triangle': 'warning', 'triangle-exclamation': 'warning', exclamation: 'warning', caution: 'warning', danger: 'warning', error: 'warning',
  'question-circle': 'question', help: 'question',
  'info-circle': 'info', information: 'info',
  bugs: 'bug', 'bug-slash': 'bug', spider: 'bug',
  flash: 'bolt', 'bolt-lightning': 'bolt', lightning: 'bolt', zap: 'bolt', power: 'bolt', 'power-off': 'bolt', plug: 'bolt',
  'eye-slash': 'eye', view: 'eye', watch: 'eye', glasses: 'eye', binoculars: 'eye',
  'magnifying-glass': 'search', 'search-plus': 'search', 'search-minus': 'search', 'magnifying-glass-plus': 'search', 'magnifying-glass-minus': 'search', find: 'search', zoom: 'search',
  'star-half': 'star', 'star-half-alt': 'star', favourite: 'star', favorite: 'star', award: 'star', trophy: 'star', medal: 'star', certificate: 'star',
  hearts: 'heart', heartbeat: 'heart', 'heart-pulse': 'heart', like: 'heart',
  // money and numbers
  'money-bill': 'money', 'money-bill-alt': 'money', 'money-bill-wave': 'money', 'money-bill-1': 'money', 'money-check': 'money', 'money-check-alt': 'money', coins: 'money', dollar: 'money', 'dollar-sign': 'money', usd: 'money', euro: 'money', 'euro-sign': 'money', gbp: 'money', 'pound-sign': 'money', 'sterling-sign': 'money', cash: 'money', payment: 'money', 'hand-holding-usd': 'money', 'hand-holding-dollar': 'money', 'sack-dollar': 'money', wallet: 'money', 'cash-register': 'money', 'file-invoice-dollar': 'money',
  card: 'credit-card', 'credit-card-alt': 'credit-card', 'id-card': 'credit-card', 'address-card': 'credit-card',
  'chart-bar': 'chart', 'bar-chart': 'chart', 'chart-line': 'chart', 'line-chart': 'chart', 'chart-simple': 'chart', 'chart-column': 'chart', 'chart-area': 'chart', 'area-chart': 'chart', 'chart-pie': 'chart', 'pie-chart': 'chart', analytics: 'chart', stats: 'chart', signal: 'chart', 'tachometer-alt': 'chart', 'gauge': 'chart', dashboard: 'chart',
  terminal: 'code', 'code-branch': 'code', brackets: 'code', api: 'code',
  // which way
  'play-circle': 'play', 'circle-play': 'play', start: 'play', run: 'play', 'forward': 'play',
  'stop-circle': 'stop', square: 'stop',
  'pause-circle': 'pause', 'circle-pause': 'pause',
  'arrow-down-to-line': 'download', save: 'download', 'floppy-disk': 'download', 'file-download': 'download', 'file-arrow-down': 'download', import: 'download',
  'arrow-up-from-line': 'upload', 'file-upload': 'upload', 'file-arrow-up': 'upload', export: 'upload',
  'long-arrow-right': 'arrow-right', 'arrow-right-long': 'arrow-right', 'long-arrow-alt-right': 'arrow-right', 'chevron-right': 'arrow-right', 'angle-right': 'arrow-right', 'caret-right': 'arrow-right', next: 'arrow-right', 'sign-in': 'arrow-right', 'sign-in-alt': 'arrow-right', 'right-to-bracket': 'arrow-right', 'arrow-right-to-bracket': 'arrow-right', 'sign-out': 'arrow-right', 'sign-out-alt': 'arrow-right', 'right-from-bracket': 'arrow-right', 'arrow-right-from-bracket': 'arrow-right',
  'long-arrow-left': 'arrow-left', 'arrow-left-long': 'arrow-left', 'long-arrow-alt-left': 'arrow-left', 'chevron-left': 'arrow-left', 'angle-left': 'arrow-left', 'caret-left': 'arrow-left', back: 'arrow-left', previous: 'arrow-left',
  'long-arrow-up': 'arrow-up', 'arrow-up-long': 'arrow-up', 'long-arrow-alt-up': 'arrow-up', 'chevron-up': 'arrow-up', 'angle-up': 'arrow-up', 'caret-up': 'arrow-up',
  'long-arrow-down': 'arrow-down', 'arrow-down-long': 'arrow-down', 'long-arrow-alt-down': 'arrow-down', 'chevron-down': 'arrow-down', 'angle-down': 'arrow-down', 'caret-down': 'arrow-down',
};

// Marks that belong to somebody. They are not drawn, however they are written: a company's mark is its own.
const brands = new Set(['github', 'gitlab', 'bitbucket', 'git', 'twitter', 'x-twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'google', 'apple', 'windows', 'microsoft', 'linux', 'ubuntu', 'aws', 'amazon', 'azure', 'docker', 'kubernetes', 'slack', 'discord', 'telegram', 'whatsapp', 'python', 'js', 'node', 'node-js', 'npm', 'react', 'angular', 'vuejs', 'java', 'php', 'rust', 'golang', 'stripe', 'paypal', 'cc-visa', 'cc-mastercard', 'cc-stripe', 'cc-paypal', 'bitcoin', 'btc', 'ethereum', 'chrome', 'firefox', 'safari', 'edge', 'wordpress', 'shopify', 'salesforce', 'hubspot', 'jira', 'confluence', 'atlassian', 'trello', 'figma', 'dropbox', 'spotify', 'reddit', 'tiktok', 'pinterest', 'medium', 'stack-overflow', 'openai', 'markdown']);

// How Font Awesome says which of its sets an icon is from, and how it says to turn, grow or fix one. None of it
// names the thing drawn, so it is read past. One set is all brands, and so is Iconify's "logos".
const brandSets = new Set(['fab', 'fa-brands', 'logos', 'simple-icons', 'devicon', 'skill-icons']);
const sets = new Set(['fa', 'fas', 'far', 'fal', 'fat', 'fad', 'fak', 'fass', 'fasr', 'fasl', 'fa-solid', 'fa-regular', 'fa-light', 'fa-thin', 'fa-duotone', 'fa-sharp', 'fa-classic', 'fa-kit', 'mdi', 'bi', 'lucide', 'tabler', 'heroicons', 'material-symbols', 'carbon', 'ph', 'ri', 'ion', 'feather']);
const manner = /^fa-(?:\d+x|[23]?xs|sm|lg|xl|2xl|fw|spin|spin-pulse|spin-reverse|pulse|beat|beat-fade|bounce|fade|flip|shake|border|inverse|li|ul|pull-(?:left|right)|rotate-(?:90|180|270|by)|flip-(?:horizontal|vertical|both)|stack(?:-[12]x)?)$/;
// Endings that say how a thing is dressed, not what it is: an outline, another cut of the same icon, a ring or
// a square round it. Tried one at a time, so "times-circle-o" is found as "times".
const dress = /-(?:o|alt|circle|square|solid|regular|outline|fill|line|duotone)$/;

/**
 * The drawing for what an author wrote where an icon goes: "fa:fa-truck", "fas:fa-user", "fa-solid fa-gear",
 * "truck". Nothing for a name with no drawing here, and nothing for a brand.
 * @param {string} written
 * @returns {{name:string,d:string}|null}
 */
export function iconFor(written) {
  const words = String(written ?? '').toLowerCase().split(/[\s:]+/).filter(Boolean);
  if (words.some((w) => brandSets.has(w))) return null;
  // What is left once the set and the manner are read past is the thing itself; the last such word names it.
  let name = words.filter((w) => !sets.has(w) && !manner.test(w)).pop()?.replace(/^fa-/, '') ?? '';
  for (;;) {
    if (!name || brands.has(name)) return null;
    const found = icons[name] ? name : aliases[name];
    if (found) return { name: found, d: icons[found] };
    if (!dress.test(name)) return null;
    name = name.replace(dress, '');
  }
}
