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
 * Every entry is `[code, English name, Chinese name, parent code]`, where `parent` is `null` for a
 * top level category. `code` is the case-sensitive identifier AppStream components use
 * (`<category>Game</category>`), while the names are the localized labels the UI shows.
 *
 * Parents follow the "Related Categories" column of the additional registry: the first main
 * category of that column becomes the parent and, for the toolkit categories, the first related
 * additional category does. Categories without related categories are top level. Audio and video
 * related categories are grouped below `AudioVideo` instead of below its `Audio`/`Video` children.
 *
 * The list is ordered parents first, so `run` can resolve them by code.
 */
const categories: Array<[code: string, en: string, zh: string, parent: string | null]> = [
  // Main categories
  ['AudioVideo', 'Audio & Video', '影音', null],
  ['Audio', 'Audio', '音频', 'AudioVideo'],
  ['Video', 'Video', '视频', 'AudioVideo'],
  ['Development', 'Development', '开发', null],
  ['Education', 'Education', '教育', null],
  ['HealthFitness', 'Health & Fitness', '健康与健身', null],
  ['Game', 'Games', '游戏', null],
  ['Graphics', 'Graphics', '图形', null],
  ['Network', 'Network', '网络', null],
  ['Office', 'Office', '办公', null],
  ['Science', 'Science', '科学', null],
  ['Settings', 'Settings', '设置', null],
  ['System', 'System', '系统', null],
  ['Utility', 'Utilities', '工具', null],

  // Toolkit categories without a main category, listed before the categories that relate to them
  ['GTK', 'GTK', 'GTK', null],
  ['Qt', 'Qt', 'Qt', null],

  // Additional categories
  ['Building', 'Building', '构建工具', 'Development'],
  ['Debugger', 'Debugger', '调试器', 'Development'],
  ['IDE', 'IDE', '集成开发环境', 'Development'],
  ['GUIDesigner', 'GUI Designer', '界面设计器', 'Development'],
  ['Profiling', 'Profiling', '性能分析', 'Development'],
  ['RevisionControl', 'Revision Control', '版本控制', 'Development'],
  ['Translation', 'Translation', '翻译工具', 'Development'],
  ['Calendar', 'Calendar', '日历', 'Office'],
  ['ContactManagement', 'Contact Management', '联系人管理', 'Office'],
  ['Database', 'Database', '数据库', 'Office'],
  ['Dictionary', 'Dictionary', '词典', 'Office'],
  ['Chart', 'Chart', '图表', 'Office'],
  ['Email', 'Email', '电子邮件', 'Office'],
  ['Finance', 'Finance', '财务', 'Office'],
  ['FlowChart', 'Flow Chart', '流程图', 'Office'],
  ['PDA', 'PDA', 'PDA', 'Office'],
  ['ProjectManagement', 'Project Management', '项目管理', 'Office'],
  ['Presentation', 'Presentation', '演示文稿', 'Office'],
  ['Spreadsheet', 'Spreadsheet', '电子表格', 'Office'],
  ['WordProcessor', 'Word Processor', '文字处理', 'Office'],
  ['2DGraphics', '2D Graphics', '二维图形', 'Graphics'],
  ['VectorGraphics', 'Vector Graphics', '矢量图形', 'Graphics'],
  ['RasterGraphics', 'Raster Graphics', '位图图形', 'Graphics'],
  ['3DGraphics', '3D Graphics', '三维图形', 'Graphics'],
  ['Scanning', 'Scanning', '扫描', 'Graphics'],
  ['OCR', 'OCR', '光学字符识别', 'Graphics'],
  ['Photography', 'Photography', '摄影', 'Graphics'],
  ['Publishing', 'Publishing', '桌面出版', 'Graphics'],
  ['Viewer', 'Viewer', '查看器', 'Graphics'],
  ['TextTools', 'Text Tools', '文本工具', 'Utility'],
  ['DesktopSettings', 'Desktop Settings', '桌面设置', 'Settings'],
  ['HardwareSettings', 'Hardware Settings', '硬件设置', 'Settings'],
  ['Printing', 'Printing', '打印', 'Settings'],
  ['PackageManager', 'Package Manager', '软件包管理器', 'Settings'],
  ['Dialup', 'Dial-up', '拨号', 'Network'],
  ['InstantMessaging', 'Instant Messaging', '即时通讯', 'Network'],
  ['Chat', 'Chat', '聊天', 'Network'],
  ['IRCClient', 'IRC Client', 'IRC 客户端', 'Network'],
  ['Feed', 'Feed', '订阅源', 'Network'],
  ['FileTransfer', 'File Transfer', '文件传输', 'Network'],
  ['HamRadio', 'Ham Radio', '业余无线电', 'Network'],
  ['News', 'News', '新闻', 'Network'],
  ['P2P', 'P2P', '点对点', 'Network'],
  ['RemoteAccess', 'Remote Access', '远程访问', 'Network'],
  ['Telephony', 'Telephony', '电话', 'Network'],
  ['TelephonyTools', 'Telephony Tools', '电话工具', 'Utility'],
  ['VideoConference', 'Video Conferencing', '视频会议', 'Network'],
  ['WebBrowser', 'Web Browser', '网页浏览器', 'Network'],
  ['WebDevelopment', 'Web Development', 'Web 开发', 'Network'],
  ['Midi', 'MIDI', 'MIDI', 'AudioVideo'],
  ['Mixer', 'Mixer', '混音器', 'AudioVideo'],
  ['Sequencer', 'Sequencer', '音序器', 'AudioVideo'],
  ['Tuner', 'Tuner', '调音器', 'AudioVideo'],
  ['TV', 'TV', '电视', 'AudioVideo'],
  ['AudioVideoEditing', 'Audio/Video Editing', '音视频编辑', 'AudioVideo'],
  ['Player', 'Player', '播放器', 'AudioVideo'],
  ['Recorder', 'Recorder', '录制器', 'AudioVideo'],
  ['DiscBurning', 'Disc Burning', '光盘刻录', 'AudioVideo'],
  ['ActionGame', 'Action Game', '动作游戏', 'Game'],
  ['AdventureGame', 'Adventure Game', '冒险游戏', 'Game'],
  ['ArcadeGame', 'Arcade Game', '街机游戏', 'Game'],
  ['BoardGame', 'Board Game', '桌面游戏', 'Game'],
  ['BlocksGame', 'Blocks Game', '方块游戏', 'Game'],
  ['CardGame', 'Card Game', '纸牌游戏', 'Game'],
  ['KidsGame', 'Kids Game', '儿童游戏', 'Game'],
  ['LogicGame', 'Logic Game', '益智游戏', 'Game'],
  ['RolePlaying', 'Role Playing', '角色扮演', 'Game'],
  ['Shooter', 'Shooter', '射击游戏', 'Game'],
  ['Simulation', 'Simulation', '模拟', 'Game'],
  ['SportsGame', 'Sports Game', '体育游戏', 'Game'],
  ['StrategyGame', 'Strategy Game', '策略游戏', 'Game'],
  ['LauncherStore', 'Game Launcher & Store', '游戏启动器与商店', 'Game'],
  ['GameTool', 'Game Tool', '游戏工具', 'Game'],
  ['Exercise', 'Exercise', '锻炼', 'HealthFitness'],
  ['Medication', 'Medication', '用药', 'HealthFitness'],
  ['Mindfulness', 'Mindfulness', '正念', 'HealthFitness'],
  ['Nutrition', 'Nutrition', '营养', 'HealthFitness'],
  ['CareProvider', 'Care Provider', '医疗服务', 'HealthFitness'],
  ['Sleep', 'Sleep', '睡眠', 'HealthFitness'],
  ['Art', 'Art', '艺术', 'Education'],
  ['Construction', 'Construction', '建筑', 'Education'],
  ['Music', 'Music', '音乐', 'AudioVideo'],
  ['Languages', 'Languages', '语言', 'Education'],
  ['ArtificialIntelligence', 'Artificial Intelligence', '人工智能', 'Education'],
  ['Astronomy', 'Astronomy', '天文学', 'Education'],
  ['Biology', 'Biology', '生物学', 'Education'],
  ['Chemistry', 'Chemistry', '化学', 'Education'],
  ['ComputerScience', 'Computer Science', '计算机科学', 'Education'],
  ['DataVisualization', 'Data Visualization', '数据可视化', 'Education'],
  ['Economy', 'Economics', '经济学', 'Education'],
  ['Electricity', 'Electricity', '电学', 'Education'],
  ['Geography', 'Geography', '地理学', 'Education'],
  ['Geology', 'Geology', '地质学', 'Education'],
  ['Geoscience', 'Geoscience', '地球科学', 'Education'],
  ['History', 'History', '历史学', 'Education'],
  ['Humanities', 'Humanities', '人文学科', 'Education'],
  ['ImageProcessing', 'Image Processing', '图像处理', 'Education'],
  ['Literature', 'Literature', '文学', 'Education'],
  ['Maps', 'Maps', '地图', 'Education'],
  ['Math', 'Math', '数学', 'Education'],
  ['NumericalAnalysis', 'Numerical Analysis', '数值分析', 'Education'],
  ['MedicalSoftware', 'Medical Software', '医学软件', 'Education'],
  ['Physics', 'Physics', '物理学', 'Education'],
  ['Robotics', 'Robotics', '机器人学', 'Education'],
  ['Spirituality', 'Spirituality', '宗教与灵修', 'Education'],
  ['Sports', 'Sports', '体育', 'Education'],
  ['ParallelComputing', 'Parallel Computing', '并行计算', 'Education'],
  ['Amusement', 'Amusement', '娱乐', null],
  ['Archiving', 'Archiving', '归档', 'Utility'],
  ['Compression', 'Compression', '压缩', 'Utility'],
  ['Electronics', 'Electronics', '电子学', null],
  ['Emulator', 'Emulator', '模拟器', 'System'],
  ['Engineering', 'Engineering', '工程', null],
  ['FileTools', 'File Tools', '文件工具', 'Utility'],
  ['FileManager', 'File Manager', '文件管理器', 'System'],
  ['TerminalEmulator', 'Terminal Emulator', '终端模拟器', 'System'],
  ['Filesystem', 'File System', '文件系统', 'System'],
  ['Monitor', 'Monitor', '系统监视器', 'System'],
  ['Security', 'Security', '安全', 'Settings'],
  ['Accessibility', 'Accessibility', '无障碍', 'Settings'],
  ['Calculator', 'Calculator', '计算器', 'Utility'],
  ['Clock', 'Clock', '时钟', 'Utility'],
  ['TextEditor', 'Text Editor', '文本编辑器', 'Utility'],
  ['Documentation', 'Documentation', '文档', null],
  ['Adult', 'Adult', '成人内容', null],
  ['Core', 'Core', '核心组件', null],
  ['KDE', 'KDE', 'KDE', 'Qt'],
  ['COSMIC', 'COSMIC', 'COSMIC', null],
  ['GNOME', 'GNOME', 'GNOME', 'GTK'],
  ['LXQt', 'LXQt', 'LXQt', 'Qt'],
  ['XFCE', 'XFCE', 'XFCE', 'GTK'],
  ['DDE', 'DDE', 'DDE', 'Qt'],
  ['Motif', 'Motif', 'Motif', null],
  ['Java', 'Java', 'Java', null],
  ['ConsoleOnly', 'Console Only', '仅命令行', null],

  // Reserved categories
  ['Screensaver', 'Screensaver', '屏幕保护程序', null],
  ['TrayIcon', 'Tray Icon', '托盘图标', null],
  ['Applet', 'Applet', '小程序', null],
  ['Shell', 'Shell', 'Shell', null],
]

export default class CategorySeeder extends BaseSeeder {
  async run() {
    // Entries are ordered parents first, so a parent is always created before its children
    const byCode = new Map<string, Category>()

    for (const [code, en, zh, parent] of categories) {
      const parentCategory = parent ? byCode.get(parent) : null
      if (parent && !parentCategory) {
        throw new Error(`Category seeder: unknown parent "${parent}" of "${code}"`)
      }

      const category = await Category.updateOrCreate(
        { code },
        { parentId: parentCategory?.id ?? null },
      )
      await replaceCategoryTranslations(category, { en, zh })
      byCode.set(code, category)
    }
  }
}
