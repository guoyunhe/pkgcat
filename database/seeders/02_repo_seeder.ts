import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'
import Repo from '#models/repo'

/** One release a repository serves, named the way the catalog stores it. */
type DistroSelector = {
  name: string
  version: string | null
  arch: string
}

/**
 * Repository of the catalog that is not shipped by a distribution itself. A repository is stored
 * once per base URL and linked to every release it serves, so a vendor repository a whole
 * distribution family installs from is one entry with several releases behind it.
 */
type CommunityRepo = {
  name: string
  type: string
  source: string
  baseUrl: string
  distros: DistroSelector[]
  configContent: string
  configUrl?: string
  installScript?: string
  syncIntervalDays: number | null
}

/** One release of a repository: every architecture of a release is an entry of its own. */
function release(name: string, version: string | null, arch: string): DistroSelector {
  return { name, version, arch }
}

/** The same release under several names, which is what a vendor repository serving a family needs. */
function releases(names: string[], version: string, arch: string): DistroSelector[] {
  return names.map((name) => release(name, version, arch))
}

/** Interval of the repositories whose content keeps changing: their publisher updates them in place. */
const updateSyncIntervalDays = 7

/**
 * NVIDIA publishes its CUDA repository per distribution and architecture under
 * `developer.download.nvidia.com/compute/cuda/repos`. One platform directory serves a whole
 * distribution family: `rhel9` is the repository the RHEL 9 rebuilds install from as well, and
 * `ubuntu2404` the one every Ubuntu 24.04 derivative installs from, which is exactly the binary
 * compatibility the catalog records between those releases.
 *
 * Arm is the one exception that has to be stated: next to the server repository (`sbsa`, Server
 * Base System Architecture) NVIDIA publishes a second, JetPack-sized one for the same architecture
 * — `rhel9/aarch64` carries 184 packages against `rhel9/sbsa`'s 7285, `ubuntu2404/arm64` 391
 * against `ubuntu2404/sbsa`'s 6336 — so an aarch64 release is served by the server one.
 */
const nvidiaBaseUrl = 'https://developer.download.nvidia.com/compute/cuda/repos'

/** Directory NVIDIA publishes an architecture under. */
function nvidiaDirectory(arch: string) {
  return arch === 'aarch64' ? 'sbsa' : arch
}

/**
 * Key the metadata of a platform is signed with, as the `.repo` file that platform ships names it.
 * It changed over time and differs between the platforms, so it is stated rather than assumed.
 */
const nvidiaGpgKeys: Record<string, string> = {
  rhel8: 'D42D0685.pub',
  rhel9: 'D42D0685.pub',
  rhel10: 'CDF6BA43.pub',
  fedora42: 'D42D0685.pub',
  fedora43: '1940C73E.pub',
  fedora44: '73CD9B30.pub',
  sles15: 'D42D0685.pub',
  sles16: 'D42D0685.pub',
  suse16: '3A8B5622.pub',
}

/**
 * A CUDA deb repository. They are flat repositories — the index sits next to the packages, with no
 * `dists/` tree — which apt spells with a `.` suite, and the keyring package the install script
 * installs is what puts the signing key where the source line expects it.
 */
function nvidiaDeb(
  platform: string,
  arch: string,
  label: string,
  distros: DistroSelector[],
): CommunityRepo {
  const baseUrl = `${nvidiaBaseUrl}/${platform}/${nvidiaDirectory(arch)}`

  return {
    name: `NVIDIA CUDA for ${label} (${arch})`,
    type: 'deb',
    source: 'community',
    baseUrl,
    distros,
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] ${baseUrl} ./
`,
    installScript: `curl -fsSL ${baseUrl}/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb`,
    syncIntervalDays: updateSyncIntervalDays,
  }
}

/** A CUDA rpm repository, with the configuration file NVIDIA ships inside it. */
function nvidiaRpm(
  platform: string,
  arch: string,
  label: string,
  distros: DistroSelector[],
): CommunityRepo {
  const baseUrl = `${nvidiaBaseUrl}/${platform}/${nvidiaDirectory(arch)}`
  const repository = `cuda-${platform}-${nvidiaDirectory(arch)}`
  const gpgKey = nvidiaGpgKeys[platform]

  if (!gpgKey) throw new Error(`Unknown NVIDIA platform: ${platform}`)

  return {
    name: `NVIDIA CUDA for ${label} (${arch})`,
    type: 'rpm',
    source: 'community',
    baseUrl,
    distros,
    configUrl: `${baseUrl}/cuda-${platform}.repo`,
    configContent: `[${repository}]
name=${repository}
baseurl=${baseUrl}
enabled=1
gpgcheck=1
gpgkey=${baseUrl}/${gpgKey}
`,
    installScript: `sudo dnf config-manager --add-repo ${baseUrl}/cuda-${platform}.repo`,
    syncIntervalDays: updateSyncIntervalDays,
  }
}

/** Releases the Enterprise Linux repository of NVIDIA serves: RHEL and the rebuilds of it. */
const rhel8Family = ['Red Hat Enterprise Linux', 'AlmaLinux', 'Rocky Linux']
const rhel9Family = [...rhel8Family, 'CentOS Stream']

const repos: CommunityRepo[] = [
  {
    name: 'VLC for openSUSE Tumbleweed',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://download.videolan.org/SuSE/Tumbleweed/',
    distros: [release('openSUSE Tumbleweed', null, 'x86_64')],
    configContent: `[SuSE]
name=VideoLAN repo (Tumbleweed)
type=rpm-md
baseurl=http://download.videolan.org/SuSE/Tumbleweed/
gpgcheck=1
gpgkey=http://download.videolan.org/SuSE/Tumbleweed/repodata/repomd.xml.key
enabled=1
`,
    configUrl: 'https://download.videolan.org/SuSE/Tumbleweed/SuSE.repo',
    installScript: `pkexec zypper addrepo -y https://download.videolan.org/SuSE/Tumbleweed/SuSE.repo`,
    syncIntervalDays: 1,
  },
  ...['42', '43', '44'].map((ver) => ({
    name: `RPM Fusion for Fedora ${ver} - Free`,
    type: 'rpm',
    source: 'community',
    distros: [release('Fedora Linux', ver, 'x86_64')],
    installScript: `pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-${ver}.noarch.rpm`,
    baseUrl: `http://download1.rpmfusion.org/free/fedora/releases/${ver}/Everything/x86_64/os/`,
    syncIntervalDays: null,
    configContent: `[rpmfusion-free]
name=RPM Fusion for Fedora $releasever - Free
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-$releasever&arch=$basearch
enabled=0
metadata_expire=14d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-free-fedora-$releasever

[rpmfusion-free-debuginfo]
name=RPM Fusion for Fedora $releasever - Free - Debug
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/debug/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-debug-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-free-fedora-$releasever

[rpmfusion-free-source]
name=RPM Fusion for Fedora $releasever - Free - Source
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/source/SRPMS/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-source-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-free-fedora-$releasever
`,
  })),
  // Ubuntu 24.04 is what NVIDIA calls `ubuntu2404`, and the derivatives of the release install from
  // the same repository: they are binary compatible with the release they build on.
  nvidiaDeb('ubuntu2404', 'x86_64', 'Ubuntu 24.04', [
    release('Ubuntu', '24.04', 'x86_64'),
    release('Linux Mint', '22', 'x86_64'),
    release('Pop!_OS', '24.04', 'x86_64'),
    release('elementary OS', '8', 'x86_64'),
  ]),
  nvidiaDeb('ubuntu2404', 'aarch64', 'Ubuntu 24.04', [release('Ubuntu', '24.04', 'aarch64')]),
  nvidiaDeb('ubuntu2604', 'x86_64', 'Ubuntu 26.04', [release('Ubuntu', '26.04', 'x86_64')]),
  nvidiaDeb('ubuntu2604', 'aarch64', 'Ubuntu 26.04', [release('Ubuntu', '26.04', 'aarch64')]),
  // MX Linux 23 rebuilds Debian 12, so it installs from the Debian 12 repository of NVIDIA.
  nvidiaDeb('debian12', 'x86_64', 'Debian 12', [
    release('Debian', '12', 'x86_64'),
    release('MX Linux', '23', 'x86_64'),
  ]),
  nvidiaDeb('debian12', 'aarch64', 'Debian 12', [release('Debian', '12', 'aarch64')]),
  nvidiaDeb('debian13', 'x86_64', 'Debian 13', [release('Debian', '13', 'x86_64')]),
  nvidiaDeb('debian13', 'aarch64', 'Debian 13', [release('Debian', '13', 'aarch64')]),
  // The Enterprise Linux repository. RHEL 8 is the release that also has an Arm and a POWER build,
  // so its POWER repository serves the two releases that publish one — Rocky Linux 8 keeps to the
  // desktop architectures — while RHEL 9 and 10 keep to those two.
  nvidiaRpm('rhel8', 'x86_64', 'RHEL 8', releases(rhel8Family, '8', 'x86_64')),
  nvidiaRpm('rhel8', 'aarch64', 'RHEL 8', releases(rhel8Family, '8', 'aarch64')),
  nvidiaRpm(
    'rhel8',
    'ppc64le',
    'RHEL 8',
    releases(['Red Hat Enterprise Linux', 'AlmaLinux'], '8', 'ppc64le'),
  ),
  nvidiaRpm('rhel9', 'x86_64', 'RHEL 9', releases(rhel9Family, '9', 'x86_64')),
  nvidiaRpm('rhel9', 'aarch64', 'RHEL 9', releases(rhel9Family, '9', 'aarch64')),
  nvidiaRpm('rhel10', 'x86_64', 'RHEL 10', releases(rhel9Family, '10', 'x86_64')),
  nvidiaRpm('rhel10', 'aarch64', 'RHEL 10', releases(rhel9Family, '10', 'aarch64')),
  // Fedora 44 has no Arm repository yet, so only its x86_64 release is served.
  nvidiaRpm('fedora42', 'x86_64', 'Fedora Linux 42', [release('Fedora Linux', '42', 'x86_64')]),
  nvidiaRpm('fedora42', 'aarch64', 'Fedora Linux 42', [release('Fedora Linux', '42', 'aarch64')]),
  nvidiaRpm('fedora43', 'x86_64', 'Fedora Linux 43', [release('Fedora Linux', '43', 'x86_64')]),
  nvidiaRpm('fedora43', 'aarch64', 'Fedora Linux 43', [release('Fedora Linux', '43', 'aarch64')]),
  nvidiaRpm('fedora44', 'x86_64', 'Fedora Linux 44', [release('Fedora Linux', '44', 'x86_64')]),
  // `sles16` is the repository of SUSE Linux Enterprise itself, `suse16` the one of openSUSE, which
  // Leap 16 continues.
  nvidiaRpm('sles15', 'x86_64', 'SUSE Linux Enterprise 15.7', [
    release('SUSE Linux Enterprise', '15.7', 'x86_64'),
  ]),
  nvidiaRpm('sles15', 'aarch64', 'SUSE Linux Enterprise 15.7', [
    release('SUSE Linux Enterprise', '15.7', 'aarch64'),
  ]),
  nvidiaRpm('sles16', 'x86_64', 'SUSE Linux Enterprise 16.0', [
    release('SUSE Linux Enterprise', '16.0', 'x86_64'),
  ]),
  nvidiaRpm('sles16', 'aarch64', 'SUSE Linux Enterprise 16.0', [
    release('SUSE Linux Enterprise', '16.0', 'aarch64'),
  ]),
  nvidiaRpm('suse16', 'x86_64', 'openSUSE Leap 16.0', [release('openSUSE Leap', '16.0', 'x86_64')]),
  nvidiaRpm('suse16', 'aarch64', 'openSUSE Leap 16.0', [
    release('openSUSE Leap', '16.0', 'aarch64'),
  ]),
]

/** Release a repository serves, which the seeders of the distributions have to have stored already. */
async function findDistro({ name, version, arch }: DistroSelector) {
  const query = Distro.query().where('name', name).where('arch', arch)
  if (version === null) {
    query.whereNull('version')
  } else {
    query.where('version', version)
  }

  const distro = await query.first()
  if (!distro) {
    throw new Error(`Unknown release: ${name} ${version ?? '(rolling)'} ${arch}`)
  }
  return distro
}

export default class RepoSeeder extends BaseSeeder {
  async run() {
    for (const repo of repos) {
      const { distros, ...attributes } = repo
      const record = await Repo.updateOrCreate({ name: repo.name }, attributes)
      // A repository is linked to every release it serves, and `sync` keeps that list exact: a
      // repository this seeder no longer links to a release is unlinked from it.
      const served = await Promise.all(distros.map((selector) => findDistro(selector)))
      await record.related('distros').sync(served.map((distro) => distro.id))
    }
  }
}
