import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Category from '#models/category'
import { replaceCategoryTranslations } from '#services/category_translations'

/**
 * Category registry of the freedesktop.org menu specification:
 *
 * - Main categories: https://specifications.freedesktop.org/menu/latest/category-registry.html
 * - Additional categories:
 *   https://specifications.freedesktop.org/menu/latest/additional-category-registry.html
 * - Reserved categories:
 *   https://specifications.freedesktop.org/menu/latest/reserved-category-registry.html
 *
 * Each entry names the case-sensitive `code` AppStream components use
 * (`<category>Game</category>`), the localized labels the UI shows — English, Simplified Chinese
 * (`zh-CN`) and Traditional Chinese (`zh-TW`) — and the `parent` category code, which is `null` for
 * a top level category.
 *
 * Parents follow the "Related Categories" column of the additional registry: the first main
 * category of that column becomes the parent and, for the toolkit categories, the first related
 * additional category does. Categories without related categories are top level. Audio and video
 * related categories are grouped below `AudioVideo` instead of below its `Audio`/`Video` children.
 *
 * The list is ordered parents first, so `run` can resolve them by code.
 */

/** One entry of the registry: the AppStream code, its localized names and its parent category. */
type CategorySeed = {
  code: string
  en: string
  zhCN: string
  zhTW: string
  parent: string | null
}

const categories: CategorySeed[] = [
  // Main categories
  { code: 'AudioVideo', en: 'Audio & Video', zhCN: '影音', zhTW: '影音', parent: null },
  { code: 'Audio', en: 'Audio', zhCN: '音频', zhTW: '音訊', parent: 'AudioVideo' },
  { code: 'Video', en: 'Video', zhCN: '视频', zhTW: '視訊', parent: 'AudioVideo' },
  { code: 'Development', en: 'Development', zhCN: '开发', zhTW: '開發', parent: null },
  { code: 'Education', en: 'Education', zhCN: '教育', zhTW: '教育', parent: null },
  {
    code: 'HealthFitness',
    en: 'Health & Fitness',
    zhCN: '健康与健身',
    zhTW: '健康與健身',
    parent: null,
  },
  { code: 'Game', en: 'Games', zhCN: '游戏', zhTW: '遊戲', parent: null },
  { code: 'Graphics', en: 'Graphics', zhCN: '图形', zhTW: '圖形', parent: null },
  { code: 'Network', en: 'Network', zhCN: '网络', zhTW: '網路', parent: null },
  { code: 'Office', en: 'Office', zhCN: '办公', zhTW: '辦公', parent: null },
  { code: 'Science', en: 'Science', zhCN: '科学', zhTW: '科學', parent: null },
  { code: 'Settings', en: 'Settings', zhCN: '设置', zhTW: '設定', parent: null },
  { code: 'System', en: 'System', zhCN: '系统', zhTW: '系統', parent: null },
  { code: 'Utility', en: 'Utilities', zhCN: '工具', zhTW: '工具', parent: null },

  // Toolkit categories without a main category, listed before the categories that relate to them
  { code: 'GTK', en: 'GTK', zhCN: 'GTK', zhTW: 'GTK', parent: null },
  { code: 'Qt', en: 'Qt', zhCN: 'Qt', zhTW: 'Qt', parent: null },

  // Additional categories
  { code: 'Building', en: 'Building', zhCN: '构建工具', zhTW: '建置工具', parent: 'Development' },
  { code: 'Debugger', en: 'Debugger', zhCN: '调试器', zhTW: '除錯器', parent: 'Development' },
  { code: 'IDE', en: 'IDE', zhCN: '集成开发环境', zhTW: '整合開發環境', parent: 'Development' },
  {
    code: 'GUIDesigner',
    en: 'GUI Designer',
    zhCN: '界面设计器',
    zhTW: '介面設計工具',
    parent: 'Development',
  },
  { code: 'Profiling', en: 'Profiling', zhCN: '性能分析', zhTW: '效能分析', parent: 'Development' },
  {
    code: 'RevisionControl',
    en: 'Revision Control',
    zhCN: '版本控制',
    zhTW: '版本控制',
    parent: 'Development',
  },
  {
    code: 'Translation',
    en: 'Translation',
    zhCN: '翻译工具',
    zhTW: '翻譯工具',
    parent: 'Development',
  },
  { code: 'Calendar', en: 'Calendar', zhCN: '日历', zhTW: '行事曆', parent: 'Office' },
  {
    code: 'ContactManagement',
    en: 'Contact Management',
    zhCN: '联系人管理',
    zhTW: '聯絡人管理',
    parent: 'Office',
  },
  { code: 'Database', en: 'Database', zhCN: '数据库', zhTW: '資料庫', parent: 'Office' },
  { code: 'Dictionary', en: 'Dictionary', zhCN: '词典', zhTW: '辭典', parent: 'Office' },
  { code: 'Chart', en: 'Chart', zhCN: '图表', zhTW: '圖表', parent: 'Office' },
  { code: 'Email', en: 'Email', zhCN: '电子邮件', zhTW: '電子郵件', parent: 'Office' },
  { code: 'Finance', en: 'Finance', zhCN: '财务', zhTW: '財務', parent: 'Office' },
  { code: 'FlowChart', en: 'Flow Chart', zhCN: '流程图', zhTW: '流程圖', parent: 'Office' },
  { code: 'PDA', en: 'PDA', zhCN: 'PDA', zhTW: 'PDA', parent: 'Office' },
  {
    code: 'ProjectManagement',
    en: 'Project Management',
    zhCN: '项目管理',
    zhTW: '專案管理',
    parent: 'Office',
  },
  { code: 'Presentation', en: 'Presentation', zhCN: '演示文稿', zhTW: '簡報', parent: 'Office' },
  { code: 'Spreadsheet', en: 'Spreadsheet', zhCN: '电子表格', zhTW: '試算表', parent: 'Office' },
  {
    code: 'WordProcessor',
    en: 'Word Processor',
    zhCN: '文字处理',
    zhTW: '文書處理',
    parent: 'Office',
  },
  { code: '2DGraphics', en: '2D Graphics', zhCN: '二维图形', zhTW: '二維圖形', parent: 'Graphics' },
  {
    code: 'VectorGraphics',
    en: 'Vector Graphics',
    zhCN: '矢量图形',
    zhTW: '向量圖形',
    parent: 'Graphics',
  },
  {
    code: 'RasterGraphics',
    en: 'Raster Graphics',
    zhCN: '位图图形',
    zhTW: '點陣圖形',
    parent: 'Graphics',
  },
  { code: '3DGraphics', en: '3D Graphics', zhCN: '三维图形', zhTW: '三維圖形', parent: 'Graphics' },
  { code: 'Scanning', en: 'Scanning', zhCN: '扫描', zhTW: '掃描', parent: 'Graphics' },
  { code: 'OCR', en: 'OCR', zhCN: '光学字符识别', zhTW: '光學字元辨識', parent: 'Graphics' },
  { code: 'Photography', en: 'Photography', zhCN: '摄影', zhTW: '攝影', parent: 'Graphics' },
  { code: 'Publishing', en: 'Publishing', zhCN: '桌面出版', zhTW: '桌面出版', parent: 'Graphics' },
  { code: 'Viewer', en: 'Viewer', zhCN: '查看器', zhTW: '檢視器', parent: 'Graphics' },
  { code: 'TextTools', en: 'Text Tools', zhCN: '文本工具', zhTW: '文字工具', parent: 'Utility' },
  {
    code: 'DesktopSettings',
    en: 'Desktop Settings',
    zhCN: '桌面设置',
    zhTW: '桌面設定',
    parent: 'Settings',
  },
  {
    code: 'HardwareSettings',
    en: 'Hardware Settings',
    zhCN: '硬件设置',
    zhTW: '硬體設定',
    parent: 'Settings',
  },
  { code: 'Printing', en: 'Printing', zhCN: '打印', zhTW: '列印', parent: 'Settings' },
  {
    code: 'PackageManager',
    en: 'Package Manager',
    zhCN: '软件包管理器',
    zhTW: '套件管理員',
    parent: 'Settings',
  },
  { code: 'Dialup', en: 'Dial-up', zhCN: '拨号', zhTW: '撥號', parent: 'Network' },
  {
    code: 'InstantMessaging',
    en: 'Instant Messaging',
    zhCN: '即时通讯',
    zhTW: '即時通訊',
    parent: 'Network',
  },
  { code: 'Chat', en: 'Chat', zhCN: '聊天', zhTW: '聊天', parent: 'Network' },
  {
    code: 'IRCClient',
    en: 'IRC Client',
    zhCN: 'IRC 客户端',
    zhTW: 'IRC 用戶端',
    parent: 'Network',
  },
  { code: 'Feed', en: 'Feed', zhCN: '订阅源', zhTW: '訂閱來源', parent: 'Network' },
  {
    code: 'FileTransfer',
    en: 'File Transfer',
    zhCN: '文件传输',
    zhTW: '檔案傳輸',
    parent: 'Network',
  },
  { code: 'HamRadio', en: 'Ham Radio', zhCN: '业余无线电', zhTW: '業餘無線電', parent: 'Network' },
  { code: 'News', en: 'News', zhCN: '新闻', zhTW: '新聞', parent: 'Network' },
  { code: 'P2P', en: 'P2P', zhCN: '点对点', zhTW: '點對點', parent: 'Network' },
  {
    code: 'RemoteAccess',
    en: 'Remote Access',
    zhCN: '远程访问',
    zhTW: '遠端存取',
    parent: 'Network',
  },
  { code: 'Telephony', en: 'Telephony', zhCN: '电话', zhTW: '電話', parent: 'Network' },
  {
    code: 'TelephonyTools',
    en: 'Telephony Tools',
    zhCN: '电话工具',
    zhTW: '電話工具',
    parent: 'Utility',
  },
  {
    code: 'VideoConference',
    en: 'Video Conferencing',
    zhCN: '视频会议',
    zhTW: '視訊會議',
    parent: 'Network',
  },
  {
    code: 'WebBrowser',
    en: 'Web Browser',
    zhCN: '网页浏览器',
    zhTW: '網頁瀏覽器',
    parent: 'Network',
  },
  {
    code: 'WebDevelopment',
    en: 'Web Development',
    zhCN: 'Web 开发',
    zhTW: 'Web 開發',
    parent: 'Network',
  },
  { code: 'Midi', en: 'MIDI', zhCN: 'MIDI', zhTW: 'MIDI', parent: 'AudioVideo' },
  { code: 'Mixer', en: 'Mixer', zhCN: '混音器', zhTW: '混音器', parent: 'AudioVideo' },
  { code: 'Sequencer', en: 'Sequencer', zhCN: '音序器', zhTW: '音序器', parent: 'AudioVideo' },
  { code: 'Tuner', en: 'Tuner', zhCN: '调音器', zhTW: '調音器', parent: 'AudioVideo' },
  { code: 'TV', en: 'TV', zhCN: '电视', zhTW: '電視', parent: 'AudioVideo' },
  {
    code: 'AudioVideoEditing',
    en: 'Audio/Video Editing',
    zhCN: '音视频编辑',
    zhTW: '影音編輯',
    parent: 'AudioVideo',
  },
  { code: 'Player', en: 'Player', zhCN: '播放器', zhTW: '播放器', parent: 'AudioVideo' },
  { code: 'Recorder', en: 'Recorder', zhCN: '录制器', zhTW: '錄製器', parent: 'AudioVideo' },
  {
    code: 'DiscBurning',
    en: 'Disc Burning',
    zhCN: '光盘刻录',
    zhTW: '光碟燒錄',
    parent: 'AudioVideo',
  },
  { code: 'ActionGame', en: 'Action Game', zhCN: '动作游戏', zhTW: '動作遊戲', parent: 'Game' },
  {
    code: 'AdventureGame',
    en: 'Adventure Game',
    zhCN: '冒险游戏',
    zhTW: '冒險遊戲',
    parent: 'Game',
  },
  { code: 'ArcadeGame', en: 'Arcade Game', zhCN: '街机游戏', zhTW: '街機遊戲', parent: 'Game' },
  { code: 'BoardGame', en: 'Board Game', zhCN: '桌面游戏', zhTW: '圖版遊戲', parent: 'Game' },
  { code: 'BlocksGame', en: 'Blocks Game', zhCN: '方块游戏', zhTW: '方塊遊戲', parent: 'Game' },
  { code: 'CardGame', en: 'Card Game', zhCN: '纸牌游戏', zhTW: '紙牌遊戲', parent: 'Game' },
  { code: 'KidsGame', en: 'Kids Game', zhCN: '儿童游戏', zhTW: '兒童遊戲', parent: 'Game' },
  { code: 'LogicGame', en: 'Logic Game', zhCN: '益智游戏', zhTW: '益智遊戲', parent: 'Game' },
  { code: 'RolePlaying', en: 'Role Playing', zhCN: '角色扮演', zhTW: '角色扮演', parent: 'Game' },
  { code: 'Shooter', en: 'Shooter', zhCN: '射击游戏', zhTW: '射擊遊戲', parent: 'Game' },
  { code: 'Simulation', en: 'Simulation', zhCN: '模拟', zhTW: '模擬', parent: 'Game' },
  { code: 'SportsGame', en: 'Sports Game', zhCN: '体育游戏', zhTW: '體育遊戲', parent: 'Game' },
  { code: 'StrategyGame', en: 'Strategy Game', zhCN: '策略游戏', zhTW: '策略遊戲', parent: 'Game' },
  {
    code: 'LauncherStore',
    en: 'Game Launcher & Store',
    zhCN: '游戏启动器与商店',
    zhTW: '遊戲啟動器與商店',
    parent: 'Game',
  },
  { code: 'GameTool', en: 'Game Tool', zhCN: '游戏工具', zhTW: '遊戲工具', parent: 'Game' },
  { code: 'Exercise', en: 'Exercise', zhCN: '锻炼', zhTW: '運動', parent: 'HealthFitness' },
  { code: 'Medication', en: 'Medication', zhCN: '用药', zhTW: '用藥', parent: 'HealthFitness' },
  { code: 'Mindfulness', en: 'Mindfulness', zhCN: '正念', zhTW: '正念', parent: 'HealthFitness' },
  { code: 'Nutrition', en: 'Nutrition', zhCN: '营养', zhTW: '營養', parent: 'HealthFitness' },
  {
    code: 'CareProvider',
    en: 'Care Provider',
    zhCN: '医疗服务',
    zhTW: '醫療服務',
    parent: 'HealthFitness',
  },
  { code: 'Sleep', en: 'Sleep', zhCN: '睡眠', zhTW: '睡眠', parent: 'HealthFitness' },
  { code: 'Art', en: 'Art', zhCN: '艺术', zhTW: '藝術', parent: 'Education' },
  { code: 'Construction', en: 'Construction', zhCN: '建筑', zhTW: '建築', parent: 'Education' },
  { code: 'Music', en: 'Music', zhCN: '音乐', zhTW: '音樂', parent: 'AudioVideo' },
  { code: 'Languages', en: 'Languages', zhCN: '语言', zhTW: '語言', parent: 'Education' },
  {
    code: 'ArtificialIntelligence',
    en: 'Artificial Intelligence',
    zhCN: '人工智能',
    zhTW: '人工智慧',
    parent: 'Education',
  },
  { code: 'Astronomy', en: 'Astronomy', zhCN: '天文学', zhTW: '天文學', parent: 'Education' },
  { code: 'Biology', en: 'Biology', zhCN: '生物学', zhTW: '生物學', parent: 'Education' },
  { code: 'Chemistry', en: 'Chemistry', zhCN: '化学', zhTW: '化學', parent: 'Education' },
  {
    code: 'ComputerScience',
    en: 'Computer Science',
    zhCN: '计算机科学',
    zhTW: '資訊科學',
    parent: 'Education',
  },
  {
    code: 'DataVisualization',
    en: 'Data Visualization',
    zhCN: '数据可视化',
    zhTW: '資料視覺化',
    parent: 'Education',
  },
  { code: 'Economy', en: 'Economics', zhCN: '经济学', zhTW: '經濟學', parent: 'Education' },
  { code: 'Electricity', en: 'Electricity', zhCN: '电学', zhTW: '電學', parent: 'Education' },
  { code: 'Geography', en: 'Geography', zhCN: '地理学', zhTW: '地理學', parent: 'Education' },
  { code: 'Geology', en: 'Geology', zhCN: '地质学', zhTW: '地質學', parent: 'Education' },
  { code: 'Geoscience', en: 'Geoscience', zhCN: '地球科学', zhTW: '地球科學', parent: 'Education' },
  { code: 'History', en: 'History', zhCN: '历史学', zhTW: '歷史學', parent: 'Education' },
  { code: 'Humanities', en: 'Humanities', zhCN: '人文学科', zhTW: '人文學科', parent: 'Education' },
  {
    code: 'ImageProcessing',
    en: 'Image Processing',
    zhCN: '图像处理',
    zhTW: '影像處理',
    parent: 'Education',
  },
  { code: 'Literature', en: 'Literature', zhCN: '文学', zhTW: '文學', parent: 'Education' },
  { code: 'Maps', en: 'Maps', zhCN: '地图', zhTW: '地圖', parent: 'Education' },
  { code: 'Math', en: 'Math', zhCN: '数学', zhTW: '數學', parent: 'Education' },
  {
    code: 'NumericalAnalysis',
    en: 'Numerical Analysis',
    zhCN: '数值分析',
    zhTW: '數值分析',
    parent: 'Education',
  },
  {
    code: 'MedicalSoftware',
    en: 'Medical Software',
    zhCN: '医学软件',
    zhTW: '醫學軟體',
    parent: 'Education',
  },
  { code: 'Physics', en: 'Physics', zhCN: '物理学', zhTW: '物理學', parent: 'Education' },
  { code: 'Robotics', en: 'Robotics', zhCN: '机器人学', zhTW: '機器人學', parent: 'Education' },
  {
    code: 'Spirituality',
    en: 'Spirituality',
    zhCN: '宗教与灵修',
    zhTW: '宗教與靈修',
    parent: 'Education',
  },
  { code: 'Sports', en: 'Sports', zhCN: '体育', zhTW: '體育', parent: 'Education' },
  {
    code: 'ParallelComputing',
    en: 'Parallel Computing',
    zhCN: '并行计算',
    zhTW: '平行運算',
    parent: 'Education',
  },
  { code: 'Amusement', en: 'Amusement', zhCN: '娱乐', zhTW: '娛樂', parent: null },
  { code: 'Archiving', en: 'Archiving', zhCN: '归档', zhTW: '封存', parent: 'Utility' },
  { code: 'Compression', en: 'Compression', zhCN: '压缩', zhTW: '壓縮', parent: 'Utility' },
  { code: 'Electronics', en: 'Electronics', zhCN: '电子学', zhTW: '電子學', parent: null },
  { code: 'Emulator', en: 'Emulator', zhCN: '模拟器', zhTW: '模擬器', parent: 'System' },
  { code: 'Engineering', en: 'Engineering', zhCN: '工程', zhTW: '工程', parent: null },
  { code: 'FileTools', en: 'File Tools', zhCN: '文件工具', zhTW: '檔案工具', parent: 'Utility' },
  {
    code: 'FileManager',
    en: 'File Manager',
    zhCN: '文件管理器',
    zhTW: '檔案管理員',
    parent: 'System',
  },
  {
    code: 'TerminalEmulator',
    en: 'Terminal Emulator',
    zhCN: '终端模拟器',
    zhTW: '終端機模擬器',
    parent: 'System',
  },
  { code: 'Filesystem', en: 'File System', zhCN: '文件系统', zhTW: '檔案系統', parent: 'System' },
  { code: 'Monitor', en: 'Monitor', zhCN: '系统监视器', zhTW: '系統監視器', parent: 'System' },
  { code: 'Security', en: 'Security', zhCN: '安全', zhTW: '安全', parent: 'Settings' },
  {
    code: 'Accessibility',
    en: 'Accessibility',
    zhCN: '无障碍',
    zhTW: '無障礙',
    parent: 'Settings',
  },
  { code: 'Calculator', en: 'Calculator', zhCN: '计算器', zhTW: '計算機', parent: 'Utility' },
  { code: 'Clock', en: 'Clock', zhCN: '时钟', zhTW: '時鐘', parent: 'Utility' },
  {
    code: 'TextEditor',
    en: 'Text Editor',
    zhCN: '文本编辑器',
    zhTW: '文字編輯器',
    parent: 'Utility',
  },
  { code: 'Documentation', en: 'Documentation', zhCN: '文档', zhTW: '說明文件', parent: null },
  { code: 'Adult', en: 'Adult', zhCN: '成人内容', zhTW: '成人內容', parent: null },
  { code: 'Core', en: 'Core', zhCN: '核心组件', zhTW: '核心組件', parent: null },
  { code: 'KDE', en: 'KDE', zhCN: 'KDE', zhTW: 'KDE', parent: 'Qt' },
  { code: 'COSMIC', en: 'COSMIC', zhCN: 'COSMIC', zhTW: 'COSMIC', parent: null },
  { code: 'GNOME', en: 'GNOME', zhCN: 'GNOME', zhTW: 'GNOME', parent: 'GTK' },
  { code: 'LXQt', en: 'LXQt', zhCN: 'LXQt', zhTW: 'LXQt', parent: 'Qt' },
  { code: 'XFCE', en: 'XFCE', zhCN: 'XFCE', zhTW: 'XFCE', parent: 'GTK' },
  { code: 'DDE', en: 'DDE', zhCN: 'DDE', zhTW: 'DDE', parent: 'Qt' },
  { code: 'Motif', en: 'Motif', zhCN: 'Motif', zhTW: 'Motif', parent: null },
  { code: 'Java', en: 'Java', zhCN: 'Java', zhTW: 'Java', parent: null },
  { code: 'ConsoleOnly', en: 'Console Only', zhCN: '仅命令行', zhTW: '僅命令列', parent: null },

  // Reserved categories
  {
    code: 'Screensaver',
    en: 'Screensaver',
    zhCN: '屏幕保护程序',
    zhTW: '螢幕保護程式',
    parent: null,
  },
  { code: 'TrayIcon', en: 'Tray Icon', zhCN: '托盘图标', zhTW: '系統匣圖示', parent: null },
  { code: 'Applet', en: 'Applet', zhCN: '小程序', zhTW: '小程式', parent: null },
  { code: 'Shell', en: 'Shell', zhCN: 'Shell', zhTW: 'Shell', parent: null },
]

export default class CategorySeeder extends BaseSeeder {
  async run() {
    // Entries are ordered parents first, so a parent is always created before its children
    const byCode = new Map<string, Category>()

    for (const { code, en, zhCN, zhTW, parent } of categories) {
      const parentCategory = parent ? byCode.get(parent) : null
      if (parent && !parentCategory) {
        throw new Error(`Category seeder: unknown parent "${parent}" of "${code}"`)
      }

      const category = await Category.updateOrCreate(
        { code },
        { parentId: parentCategory?.id ?? null },
      )
      await replaceCategoryTranslations(category, { en, 'zh-CN': zhCN, 'zh-TW': zhTW })
      byCode.set(code, category)
    }
  }
}
