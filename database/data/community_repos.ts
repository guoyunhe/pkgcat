import { debDistros, rpmDistros } from '#database/data/repo_distros'
import type { RepoSeed } from '#database/data/types'

/**
 * The repositories of the catalog that a community project publishes: the ones a release installs
 * from, which no distribution ships. They are stored once per base URL and linked to every release
 * their `distros` selectors name, so a repository a whole family of releases installs from is one
 * entry with several entries behind it. Every entry states `source: 'community'`, and it keeps the
 * configuration file and the installation script its publisher documents, when it documents one.
 */
export const communityRepos: RepoSeed[] = [
  {
    // RPM Fusion publishes one directory per architecture, so a release that installs from it is
    // served by one entry per architecture. The repository file it ships carries the sections of
    // the release directory — the free and the nonfree one of a release sit under the same
    // `Everything/<arch>` layout — and the release package is built for `noarch` and writes that
    // file on either architecture, so the entries of a release document the same install script
    name: 'RPM Fusion for Fedora 43 - Free (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/free/fedora/releases/43/Everything/x86_64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '43', arch: 'x86_64' }],
    configContent: `[rpmfusion-free]
name=RPM Fusion for Fedora $releasever - Free
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-$releasever&arch=$basearch
enabled=1
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
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-43.noarch.rpm',
  },
  {
    name: 'RPM Fusion for Fedora 43 - Free (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/free/fedora/releases/43/Everything/aarch64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '43', arch: 'aarch64' }],
    configContent: `[rpmfusion-free]
name=RPM Fusion for Fedora $releasever - Free
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-$releasever&arch=$basearch
enabled=1
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
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-43.noarch.rpm',
  },
  {
    // The packages RPM Fusion may not redistribute come from a repository of its own, published
    // next to the free one of the release
    name: 'RPM Fusion for Fedora 43 - Nonfree (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/nonfree/fedora/releases/43/Everything/x86_64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '43', arch: 'x86_64' }],
    configContent: `[rpmfusion-nonfree]
name=RPM Fusion for Fedora $releasever - Nonfree
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-$releasever&arch=$basearch
enabled=1
enabled_metadata=1
metadata_expire=14d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-debuginfo]
name=RPM Fusion for Fedora $releasever - Nonfree - Debug
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/debug/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-debug-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-source]
name=RPM Fusion for Fedora $releasever - Nonfree - Source
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/source/SRPMS/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-source-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever
`,
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-43.noarch.rpm',
  },
  {
    name: 'RPM Fusion for Fedora 43 - Nonfree (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/nonfree/fedora/releases/43/Everything/aarch64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '43', arch: 'aarch64' }],
    configContent: `[rpmfusion-nonfree]
name=RPM Fusion for Fedora $releasever - Nonfree
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-$releasever&arch=$basearch
enabled=1
enabled_metadata=1
metadata_expire=14d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-debuginfo]
name=RPM Fusion for Fedora $releasever - Nonfree - Debug
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/debug/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-debug-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-source]
name=RPM Fusion for Fedora $releasever - Nonfree - Source
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/source/SRPMS/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-source-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever
`,
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-43.noarch.rpm',
  },
  {
    name: 'RPM Fusion for Fedora 44 - Free (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/free/fedora/releases/44/Everything/x86_64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '44', arch: 'x86_64' }],
    configContent: `[rpmfusion-free]
name=RPM Fusion for Fedora $releasever - Free
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-$releasever&arch=$basearch
enabled=1
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
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-44.noarch.rpm',
  },
  {
    name: 'RPM Fusion for Fedora 44 - Free (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/free/fedora/releases/44/Everything/aarch64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '44', arch: 'aarch64' }],
    configContent: `[rpmfusion-free]
name=RPM Fusion for Fedora $releasever - Free
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-$releasever&arch=$basearch
enabled=1
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
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-44.noarch.rpm',
  },
  {
    name: 'RPM Fusion for Fedora 44 - Nonfree (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/nonfree/fedora/releases/44/Everything/x86_64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '44', arch: 'x86_64' }],
    configContent: `[rpmfusion-nonfree]
name=RPM Fusion for Fedora $releasever - Nonfree
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-$releasever&arch=$basearch
enabled=1
enabled_metadata=1
metadata_expire=14d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-debuginfo]
name=RPM Fusion for Fedora $releasever - Nonfree - Debug
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/debug/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-debug-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-source]
name=RPM Fusion for Fedora $releasever - Nonfree - Source
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/source/SRPMS/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-source-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever
`,
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-44.noarch.rpm',
  },
  {
    name: 'RPM Fusion for Fedora 44 - Nonfree (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/nonfree/fedora/releases/44/Everything/aarch64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '44', arch: 'aarch64' }],
    configContent: `[rpmfusion-nonfree]
name=RPM Fusion for Fedora $releasever - Nonfree
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-$releasever&arch=$basearch
enabled=1
enabled_metadata=1
metadata_expire=14d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-debuginfo]
name=RPM Fusion for Fedora $releasever - Nonfree - Debug
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/$basearch/debug/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-debug-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever

[rpmfusion-nonfree-source]
name=RPM Fusion for Fedora $releasever - Nonfree - Source
#baseurl=http://download1.rpmfusion.org/nonfree/fedora/releases/$releasever/Everything/source/SRPMS/
metalink=https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-source-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-nonfree-fedora-$releasever
`,
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-44.noarch.rpm',
  },
  {
    name: 'Packman for openSUSE Tumbleweed',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Tumbleweed/',
    syncIntervalDays: 7,
    distros: [
      { name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'aarch64' },
    ],
    configContent: `[packman]
name=Packman repository (openSUSE_Tumbleweed)
baseurl=https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Tumbleweed/
enabled=1
autorefresh=1
type=rpm-md
priority=90
gpgcheck=1
gpgkey=https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Tumbleweed/repodata/repomd.xml.key
`,
    installScript:
      'sudo zypper addrepo -cfp 90 https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Tumbleweed/ packman',
  },
  {
    name: 'Packman for openSUSE Leap 16.0',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Leap_16.0/',
    syncIntervalDays: 7,
    distros: [
      { name: 'openSUSE Leap', version: '16.0', arch: 'x86_64' },
      { name: 'openSUSE Leap', version: '16.0', arch: 'aarch64' },
    ],
    configContent: `[packman]
name=Packman repository (openSUSE_Leap_16.0)
baseurl=https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Leap_16.0/
enabled=1
autorefresh=1
type=rpm-md
priority=90
gpgcheck=1
gpgkey=https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Leap_16.0/repodata/repomd.xml.key
`,
    installScript:
      'sudo zypper addrepo -cfp 90 https://ftp.gwdg.de/pub/linux/misc/packman/suse/openSUSE_Leap_16.0/ packman',
  },
  {
    name: 'Packman for SUSE Linux Enterprise 15',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://ftp.gwdg.de/pub/linux/misc/packman/suse/SLE_15/',
    syncIntervalDays: 7,
    distros: [{ name: 'SUSE Linux Enterprise', version: '15.7', arch: 'x86_64' }],
    configContent: `[packman]
name=Packman repository (SLE_15)
baseurl=https://ftp.gwdg.de/pub/linux/misc/packman/suse/SLE_15/
enabled=1
autorefresh=1
type=rpm-md
priority=90
gpgcheck=1
gpgkey=https://ftp.gwdg.de/pub/linux/misc/packman/suse/SLE_15/repodata/repomd.xml.key
`,
    installScript:
      'sudo zypper addrepo -cfp 90 https://ftp.gwdg.de/pub/linux/misc/packman/suse/SLE_15/ packman',
  },
  {
    // Teams for Linux is the unofficial client of the project of the same name, which publishes one
    // flat rpm repository (the x86_64, the aarch64 and the armv7l packages sit in one tree, so one
    // row serves both architectures of the catalog) and one apt repository whose suite is `stable`.
    // opi records the rpm one, and the repository file of it names no key: the project documents it
    // as a separate download
    name: 'Teams for Linux for Fedora, RHEL and SUSE',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://repo.teamsforlinux.de/rpm/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64', 'aarch64']),
    configContent: `[teams-for-linux]
name=Repo for the unofficial Teams for Linux package
baseurl=https://repo.teamsforlinux.de/rpm/
enabled=1
gpgcheck=1
`,
    configUrl: 'https://repo.teamsforlinux.de/rpm/teams-for-linux.repo',
    installScript:
      'curl -1sLf -o /tmp/teams-for-linux.asc https://repo.teamsforlinux.de/teams-for-linux.asc && sudo rpm --import /tmp/teams-for-linux.asc && sudo curl -1sLf -o /etc/yum.repos.d/teams-for-linux.repo https://repo.teamsforlinux.de/rpm/teams-for-linux.repo',
  },
  {
    name: 'Teams for Linux for Debian and Ubuntu',
    type: 'deb',
    source: 'community',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/teams-for-linux.asc] https://repo.teamsforlinux.de/debian/ stable main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/teams-for-linux.asc] https://repo.teamsforlinux.de/debian/ stable main',
    installScript: 'curl -fsSL https://repo.teamsforlinux.de/install.sh | sudo bash',
  },
  {
    // VSCodium is built by the community project that maintains this repository rather than by
    // Microsoft, and one rpm tree carries the x86_64 and the aarch64 package of it. The project
    // writes the same repository file for the Fedora family and for the SUSE one
    name: 'VSCodium for Fedora, RHEL and SUSE',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://paulcarroty.gitlab.io/vscodium-deb-rpm-repo/rpms/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64', 'aarch64']),
    configContent: `[gitlab.com_paulcarroty_vscodium_repo]
name=gitlab.com_paulcarroty_vscodium_repo
baseurl=https://paulcarroty.gitlab.io/vscodium-deb-rpm-repo/rpms/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://gitlab.com/paulcarroty/vscodium-deb-rpm-repo/raw/master/pub.gpg
metadata_expire=1h
`,
    installScript:
      'sudo rpm --import https://gitlab.com/paulcarroty/vscodium-deb-rpm-repo/raw/master/pub.gpg && sudo curl -1sLf -o /etc/yum.repos.d/vscodium.repo https://gitlab.com/paulcarroty/vscodium-deb-rpm-repo/raw/master/rpms/vscodium.repo',
  },
  {
    // The apt repository of the same project names its suite after the project (`vscodium`) and
    // carries the amd64 and the arm64 package in its `main` component
    name: 'VSCodium for Debian and Ubuntu',
    type: 'deb',
    source: 'community',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/vscodium-archive-keyring.asc] https://paulcarroty.gitlab.io/vscodium-deb-rpm-repo/debs vscodium main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/vscodium-archive-keyring.asc] https://paulcarroty.gitlab.io/vscodium-deb-rpm-repo/debs vscodium main',
    installScript:
      'sudo wget https://gitlab.com/paulcarroty/vscodium-deb-rpm-repo/raw/master/pub.gpg -O /usr/share/keyrings/vscodium-archive-keyring.asc && echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/vscodium-archive-keyring.asc] https://paulcarroty.gitlab.io/vscodium-deb-rpm-repo/debs vscodium main" | sudo tee /etc/apt/sources.list.d/vscodium.list',
  },
]
