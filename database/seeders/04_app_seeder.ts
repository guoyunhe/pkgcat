import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { parseAppStreamComponent } from '@guoyunhe/appstream'
import xior, { isXiorError } from 'xior'

import App from '#models/app'
import Image from '#models/image'
import Pkg from '#models/pkg'
import { replaceTranslations } from '#services/app_translations'
import {
  appstreamHomepage,
  appstreamVersion,
  canonicalAppType,
} from '#services/repo_appstream_extractor'

const applications = [
  {
    appstreamUrl:
      'https://raw.githubusercontent.com/libretro/RetroArch/refs/heads/master/com.libretro.RetroArch.metainfo.xml',
    desktopUrl:
      'https://raw.githubusercontent.com/libretro/RetroArch/refs/heads/master/com.libretro.RetroArch.desktop',
    iconUrl:
      'https://raw.githubusercontent.com/libretro/RetroArch/refs/heads/master/media/com.libretro.RetroArch.svg',
    packages: [
      {
        arch: 'x86_64',
        downloadUrl: 'https://buildbot.libretro.com/stable/1.22.2/linux/x86_64/RetroArch.7z',
        version: '1.22.2',
      },
      {
        arch: 'x86_64',
        downloadUrl: 'https://buildbot.libretro.com/nightly/linux/x86_64/RetroArch.7z',
        version: 'nightly',
      },
    ],
  },
  {
    appstreamUrl:
      'https://raw.githubusercontent.com/keepassxreboot/keepassxc/develop/share/linux/org.keepassxc.KeePassXC.appdata.xml',
    iconUrl:
      'https://raw.githubusercontent.com/keepassxreboot/keepassxc/develop/share/branding/scalable/keepassxc.svg',
  },
  {
    appstreamUrl:
      'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/dev.eden_emu.eden.metainfo.xml',
    desktopUrl:
      'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/dev.eden_emu.eden.desktop',
    iconUrl:
      'https://git.eden-emu.dev/eden-emu/eden/raw/commit/20f9aa4cfecf6b17735e0c8d7faa21e5d9388cfd/dist/dev.eden_emu.eden.svg',
  },
]

const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

/** Metadata a wrapper application is created from, read from its AppStream MetaInfo file. */
function parseMetaInfo(xml: string) {
  const component = parseAppStreamComponent(xml)
  const name = component?.name ?? {}
  const summary = component?.summary ?? {}

  if (!component || !name.en || !summary.en) {
    throw new Error('AppStream XML must contain an id, English name, and English summary')
  }

  return {
    appstreamId: component.id,
    type: canonicalAppType(component.type),
    name,
    summary,
    version: appstreamVersion(component),
    license: component.projectLicense ?? null,
    homepage: appstreamHomepage(component),
  }
}

export default class AppSeeder extends BaseSeeder {
  async run() {
    for (const { appstreamUrl, desktopUrl, iconUrl, packages = [] } of applications) {
      const appstreamData = await this.download(appstreamUrl, 'AppStream XML')
      const appstreamContent = appstreamData.toString('utf8')
      const application = parseMetaInfo(appstreamContent)
      const desktopContent = desktopUrl ? await this.downloadDesktop(desktopUrl) : null

      const app = await App.updateOrCreate(
        { appstreamId: application.appstreamId },
        {
          appstreamId: application.appstreamId,
          type: application.type,
          version: application.version,
          license: application.license,
          homepage: application.homepage,
          appstreamUrl,
          appstreamContent,
          desktopUrl: desktopUrl ?? null,
          desktopContent,
        },
      )
      await replaceTranslations(app, application.name, application.summary)
      await this.updateIcon(app, iconUrl)
      await this.updatePackages(app, packages)
    }
  }

  private async updatePackages(
    app: App,
    packages: Array<{ arch: string; downloadUrl: string; version: string }>,
  ) {
    for (const pkg of packages) {
      const stored = await Pkg.updateOrCreate(
        { type: 'appimage', name: 'RetroArch', version: pkg.version, arch: pkg.arch },
        {
          ...pkg,
          type: 'appimage',
          name: 'RetroArch',
          release: null,
          repoId: null,
          checksum: null,
          checksumType: null,
          size: null,
          installCommand: '7z x RetroArch.7z && chmod +x RetroArch*.AppImage',
        },
      )
      await stored.related('apps').sync([app.id], true)
    }
  }

  private async downloadDesktop(desktopUrl: string) {
    const desktopContent = await this.download(desktopUrl, 'desktop file')
    return desktopContent.toString('utf8')
  }

  private async updateIcon(app: App, iconUrl: string) {
    const icon = app.iconId ? await Image.find(app.iconId) : null
    const options = {
      acceptedFormats: ['svg', 'png'] as const,
      minimumPngSize: 512,
    }
    const image = icon
      ? await Image.replaceFromUrl(icon, iconUrl, options)
      : await Image.createFromUrl(iconUrl, options)

    if (app.iconId !== image.id) {
      await app.merge({ iconId: image.id }).save()
    }
  }

  private download(url: string, resource: string) {
    return xior
      .get<ArrayBuffer>(url, { responseType: 'arraybuffer', headers: requestHeaders })
      .then((response) => Buffer.from(response.data))
      .catch((error: unknown) => {
        const status = isXiorError(error) ? error.response?.status : undefined
        throw new Error(`Unable to download ${resource}: ${url}${status ? ` (${status})` : ''}`, {
          cause: error,
        })
      })
  }
}
