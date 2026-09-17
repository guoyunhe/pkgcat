import type { CategorySeed } from '#database/data/types'

/**
 * Category registry of the freedesktop.org menu specification, which the seeder writes into the
 * catalog and which `node ace category:names` reads as the set of categories the frontend names:
 *
 * - Main categories: https://specifications.freedesktop.org/menu/latest/category-registry.html
 * - Additional categories:
 *   https://specifications.freedesktop.org/menu/latest/additional-category-registry.html
 * - Reserved categories:
 *   https://specifications.freedesktop.org/menu/latest/reserved-category-registry.html
 *
 * Each entry names the case-sensitive `code` AppStream components use (`<category>Game</category>`)
 * and the `parent` category code, which is `null` for a top level category.
 *
 * Parents follow the "Related Categories" column of the additional registry: the first main
 * category of that column becomes the parent and, for the toolkit categories, the first related
 * additional category does. Categories without related categories are top level. Audio and video
 * related categories are grouped below `AudioVideo` instead of below its `Audio`/`Video` children.
 *
 * The list is ordered parents first, so a consumer can resolve a parent by code.
 */
export const categories: CategorySeed[] = [
  // Main categories
  { code: 'AudioVideo', parent: null },
  { code: 'Audio', parent: 'AudioVideo' },
  { code: 'Video', parent: 'AudioVideo' },
  { code: 'Development', parent: null },
  { code: 'Education', parent: null },
  {
    code: 'HealthFitness',
    parent: null,
  },
  { code: 'Game', parent: null },
  { code: 'Graphics', parent: null },
  { code: 'Network', parent: null },
  { code: 'Office', parent: null },
  { code: 'Science', parent: null },
  { code: 'Settings', parent: null },
  { code: 'System', parent: null },
  { code: 'Utility', parent: null },

  // Toolkit categories without a main category, listed before the categories that relate to them
  { code: 'GTK', parent: null },
  { code: 'Qt', parent: null },

  // Additional categories
  { code: 'Building', parent: 'Development' },
  { code: 'Debugger', parent: 'Development' },
  { code: 'IDE', parent: 'Development' },
  {
    code: 'GUIDesigner',
    parent: 'Development',
  },
  { code: 'Profiling', parent: 'Development' },
  {
    code: 'RevisionControl',
    parent: 'Development',
  },
  {
    code: 'Translation',
    parent: 'Development',
  },
  { code: 'Calendar', parent: 'Office' },
  {
    code: 'ContactManagement',
    parent: 'Office',
  },
  { code: 'Database', parent: 'Office' },
  { code: 'Dictionary', parent: 'Office' },
  { code: 'Chart', parent: 'Office' },
  { code: 'Email', parent: 'Office' },
  { code: 'Finance', parent: 'Office' },
  { code: 'FlowChart', parent: 'Office' },
  { code: 'PDA', parent: 'Office' },
  {
    code: 'ProjectManagement',
    parent: 'Office',
  },
  { code: 'Presentation', parent: 'Office' },
  { code: 'Spreadsheet', parent: 'Office' },
  {
    code: 'WordProcessor',
    parent: 'Office',
  },
  { code: '2DGraphics', parent: 'Graphics' },
  {
    code: 'VectorGraphics',
    parent: 'Graphics',
  },
  {
    code: 'RasterGraphics',
    parent: 'Graphics',
  },
  { code: '3DGraphics', parent: 'Graphics' },
  { code: 'Scanning', parent: 'Graphics' },
  { code: 'OCR', parent: 'Graphics' },
  { code: 'Photography', parent: 'Graphics' },
  { code: 'Publishing', parent: 'Graphics' },
  { code: 'Viewer', parent: 'Graphics' },
  { code: 'TextTools', parent: 'Utility' },
  {
    code: 'DesktopSettings',
    parent: 'Settings',
  },
  {
    code: 'HardwareSettings',
    parent: 'Settings',
  },
  { code: 'Printing', parent: 'Settings' },
  {
    code: 'PackageManager',
    parent: 'Settings',
  },
  { code: 'Dialup', parent: 'Network' },
  {
    code: 'InstantMessaging',
    parent: 'Network',
  },
  { code: 'Chat', parent: 'Network' },
  {
    code: 'IRCClient',
    parent: 'Network',
  },
  { code: 'Feed', parent: 'Network' },
  {
    code: 'FileTransfer',
    parent: 'Network',
  },
  { code: 'HamRadio', parent: 'Network' },
  { code: 'News', parent: 'Network' },
  { code: 'P2P', parent: 'Network' },
  {
    code: 'RemoteAccess',
    parent: 'Network',
  },
  { code: 'Telephony', parent: 'Network' },
  {
    code: 'TelephonyTools',
    parent: 'Utility',
  },
  {
    code: 'VideoConference',
    parent: 'Network',
  },
  {
    code: 'WebBrowser',
    parent: 'Network',
  },
  {
    code: 'WebDevelopment',
    parent: 'Network',
  },
  { code: 'Midi', parent: 'AudioVideo' },
  { code: 'Mixer', parent: 'AudioVideo' },
  { code: 'Sequencer', parent: 'AudioVideo' },
  { code: 'Tuner', parent: 'AudioVideo' },
  { code: 'TV', parent: 'AudioVideo' },
  {
    code: 'AudioVideoEditing',
    parent: 'AudioVideo',
  },
  { code: 'Player', parent: 'AudioVideo' },
  { code: 'Recorder', parent: 'AudioVideo' },
  {
    code: 'DiscBurning',
    parent: 'AudioVideo',
  },
  { code: 'ActionGame', parent: 'Game' },
  {
    code: 'AdventureGame',
    parent: 'Game',
  },
  { code: 'ArcadeGame', parent: 'Game' },
  { code: 'BoardGame', parent: 'Game' },
  { code: 'BlocksGame', parent: 'Game' },
  { code: 'CardGame', parent: 'Game' },
  { code: 'KidsGame', parent: 'Game' },
  { code: 'LogicGame', parent: 'Game' },
  { code: 'RolePlaying', parent: 'Game' },
  { code: 'Shooter', parent: 'Game' },
  { code: 'Simulation', parent: 'Game' },
  { code: 'SportsGame', parent: 'Game' },
  { code: 'StrategyGame', parent: 'Game' },
  {
    code: 'LauncherStore',
    parent: 'Game',
  },
  { code: 'GameTool', parent: 'Game' },
  { code: 'Exercise', parent: 'HealthFitness' },
  { code: 'Medication', parent: 'HealthFitness' },
  { code: 'Mindfulness', parent: 'HealthFitness' },
  { code: 'Nutrition', parent: 'HealthFitness' },
  {
    code: 'CareProvider',
    parent: 'HealthFitness',
  },
  { code: 'Sleep', parent: 'HealthFitness' },
  { code: 'Art', parent: 'Education' },
  { code: 'Construction', parent: 'Education' },
  { code: 'Music', parent: 'AudioVideo' },
  { code: 'Languages', parent: 'Education' },
  {
    code: 'ArtificialIntelligence',
    parent: 'Education',
  },
  { code: 'Astronomy', parent: 'Education' },
  { code: 'Biology', parent: 'Education' },
  { code: 'Chemistry', parent: 'Education' },
  {
    code: 'ComputerScience',
    parent: 'Education',
  },
  {
    code: 'DataVisualization',
    parent: 'Education',
  },
  { code: 'Economy', parent: 'Education' },
  { code: 'Electricity', parent: 'Education' },
  { code: 'Geography', parent: 'Education' },
  { code: 'Geology', parent: 'Education' },
  { code: 'Geoscience', parent: 'Education' },
  { code: 'History', parent: 'Education' },
  { code: 'Humanities', parent: 'Education' },
  {
    code: 'ImageProcessing',
    parent: 'Education',
  },
  { code: 'Literature', parent: 'Education' },
  { code: 'Maps', parent: 'Education' },
  { code: 'Math', parent: 'Education' },
  {
    code: 'NumericalAnalysis',
    parent: 'Education',
  },
  {
    code: 'MedicalSoftware',
    parent: 'Education',
  },
  { code: 'Physics', parent: 'Education' },
  { code: 'Robotics', parent: 'Education' },
  {
    code: 'Spirituality',
    parent: 'Education',
  },
  { code: 'Sports', parent: 'Education' },
  {
    code: 'ParallelComputing',
    parent: 'Education',
  },
  { code: 'Amusement', parent: null },
  { code: 'Archiving', parent: 'Utility' },
  { code: 'Compression', parent: 'Utility' },
  { code: 'Electronics', parent: null },
  { code: 'Emulator', parent: 'System' },
  { code: 'Engineering', parent: null },
  { code: 'FileTools', parent: 'Utility' },
  {
    code: 'FileManager',
    parent: 'System',
  },
  {
    code: 'TerminalEmulator',
    parent: 'System',
  },
  { code: 'Filesystem', parent: 'System' },
  { code: 'Monitor', parent: 'System' },
  { code: 'Security', parent: 'Settings' },
  {
    code: 'Accessibility',
    parent: 'Settings',
  },
  { code: 'Calculator', parent: 'Utility' },
  { code: 'Clock', parent: 'Utility' },
  {
    code: 'TextEditor',
    parent: 'Utility',
  },
  { code: 'Documentation', parent: null },
  { code: 'Adult', parent: null },
  { code: 'Core', parent: null },
  { code: 'KDE', parent: 'Qt' },
  { code: 'COSMIC', parent: null },
  { code: 'GNOME', parent: 'GTK' },
  { code: 'LXQt', parent: 'Qt' },
  { code: 'XFCE', parent: 'GTK' },
  { code: 'DDE', parent: 'Qt' },
  { code: 'Motif', parent: null },
  { code: 'Java', parent: null },
  { code: 'ConsoleOnly', parent: null },

  // Reserved categories
  {
    code: 'Screensaver',
    parent: null,
  },
  { code: 'TrayIcon', parent: null },
  { code: 'Applet', parent: null },
  { code: 'Shell', parent: null },
]
