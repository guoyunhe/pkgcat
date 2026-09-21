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
    name: 'RPM Fusion for Fedora 43 - Free',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/free/fedora/releases/43/Everything/x86_64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '43', arch: 'x86_64' }],
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
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-43.noarch.rpm',
  },
  {
    name: 'RPM Fusion for Fedora 44 - Free',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/free/fedora/releases/44/Everything/x86_64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '44', arch: 'x86_64' }],
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
    installScript:
      'pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-44.noarch.rpm',
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
]
