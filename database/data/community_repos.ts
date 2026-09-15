import type { RepoSeed } from '#database/data/types'

/**
 * The repositories of the catalog that no distribution ships: the community and vendor repositories
 * a release installs from. They are stored once per base URL and linked to every release they
 * serve, which the `distros` selectors name, and the releases of one distribution family install
 * from the same repository, so an entry may list several of them.
 *
 * `source` states who publishes the repository, and an entry keeps the configuration file and the
 * installation script its publisher documents, when it documents one.
 */
export const communityRepos: RepoSeed[] = [
  {
    name: 'VLC for openSUSE Tumbleweed',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://download.videolan.org/SuSE/Tumbleweed/',
    syncIntervalDays: 1,
    distros: [{ name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' }],
    configContent: `[SuSE]
name=VideoLAN repo (Tumbleweed)
type=rpm-md
baseurl=http://download.videolan.org/SuSE/Tumbleweed/
gpgcheck=1
gpgkey=http://download.videolan.org/SuSE/Tumbleweed/repodata/repomd.xml.key
enabled=1
`,
    configUrl: 'https://download.videolan.org/SuSE/Tumbleweed/SuSE.repo',
    installScript:
      'pkexec zypper addrepo -y https://download.videolan.org/SuSE/Tumbleweed/SuSE.repo',
  },
  {
    name: 'VLC for openSUSE Leap 16.0',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://download.videolan.org/SuSE/16.0/',
    syncIntervalDays: 1,
    distros: [{ name: 'openSUSE Leap', version: '16.0', arch: 'x86_64' }],
    configContent: `[SuSE]
name=VideoLAN repo (16.0)
type=rpm-md
baseurl=http://download.videolan.org/SuSE/16.0/
gpgcheck=1
gpgkey=http://download.videolan.org/SuSE/16.0/repodata/repomd.xml.key
enabled=1
`,
    configUrl: 'https://download.videolan.org/SuSE/16.0/SuSE.repo',
    installScript: 'pkexec zypper addrepo -y https://download.videolan.org/SuSE/16.0/SuSE.repo',
  },
  {
    name: 'RPM Fusion for Fedora 42 - Free',
    type: 'rpm',
    source: 'community',
    baseUrl: 'http://download1.rpmfusion.org/free/fedora/releases/42/Everything/x86_64/os/',
    syncIntervalDays: null,
    distros: [{ name: 'Fedora Linux', version: '42', arch: 'x86_64' }],
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
      'pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-42.noarch.rpm',
  },
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
    name: 'NVIDIA CUDA for Ubuntu 24.04 (x86_64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'elementary OS', version: '8', arch: 'x86_64' },
      { name: 'Linux Mint', version: '22', arch: 'x86_64' },
      { name: 'Pop!_OS', version: '24.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '24.04', arch: 'x86_64' },
    ],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64 ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for Ubuntu 24.04 (aarch64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'Ubuntu', version: '24.04', arch: 'aarch64' }],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/sbsa ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/sbsa/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for Ubuntu 26.04 (x86_64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2604/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'Ubuntu', version: '26.04', arch: 'x86_64' }],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2604/x86_64 ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2604/x86_64/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for Ubuntu 26.04 (aarch64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2604/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'Ubuntu', version: '26.04', arch: 'aarch64' }],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2604/sbsa ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2604/sbsa/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for Debian 12 (x86_64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/debian12/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'Debian', version: '12', arch: 'x86_64' },
      { name: 'MX Linux', version: '23', arch: 'x86_64' },
    ],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/debian12/x86_64 ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/debian12/x86_64/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for Debian 12 (aarch64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/debian12/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'Debian', version: '12', arch: 'aarch64' }],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/debian12/sbsa ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/debian12/sbsa/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for Debian 13 (x86_64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/debian13/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'Debian', version: '13', arch: 'x86_64' }],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/debian13/x86_64 ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/debian13/x86_64/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for Debian 13 (aarch64)',
    type: 'deb',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/debian13/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'Debian', version: '13', arch: 'aarch64' }],
    configContent: `deb [signed-by=/usr/share/keyrings/cuda-archive-keyring.gpg] https://developer.download.nvidia.com/compute/cuda/repos/debian13/sbsa ./
`,
    installScript:
      'curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/debian13/sbsa/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb && sudo dpkg -i /tmp/cuda-keyring.deb',
  },
  {
    name: 'NVIDIA CUDA for RHEL 8 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'AlmaLinux', version: '8', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'x86_64' },
      { name: 'Rocky Linux', version: '8', arch: 'x86_64' },
    ],
    configContent: `[cuda-rhel8-x86_64]
name=cuda-rhel8-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64/cuda-rhel8.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64/cuda-rhel8.repo',
  },
  {
    name: 'NVIDIA CUDA for RHEL 8 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/sbsa',
    syncIntervalDays: 7,
    distros: [
      { name: 'AlmaLinux', version: '8', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'aarch64' },
      { name: 'Rocky Linux', version: '8', arch: 'aarch64' },
    ],
    configContent: `[cuda-rhel8-sbsa]
name=cuda-rhel8-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/rhel8/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/rhel8/sbsa/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/sbsa/cuda-rhel8.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel8/sbsa/cuda-rhel8.repo',
  },
  {
    name: 'NVIDIA CUDA for RHEL 8 (ppc64le)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/ppc64le',
    syncIntervalDays: 7,
    distros: [
      { name: 'AlmaLinux', version: '8', arch: 'ppc64le' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'ppc64le' },
    ],
    configContent: `[cuda-rhel8-ppc64le]
name=cuda-rhel8-ppc64le
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/rhel8/ppc64le
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/rhel8/ppc64le/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/ppc64le/cuda-rhel8.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel8/ppc64le/cuda-rhel8.repo',
  },
  {
    name: 'NVIDIA CUDA for RHEL 9 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'AlmaLinux', version: '9', arch: 'x86_64' },
      { name: 'CentOS Stream', version: '9', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'x86_64' },
      { name: 'Rocky Linux', version: '9', arch: 'x86_64' },
    ],
    configContent: `[cuda-rhel9-x86_64]
name=cuda-rhel9-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/cuda-rhel9.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/cuda-rhel9.repo',
  },
  {
    name: 'NVIDIA CUDA for RHEL 9 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel9/sbsa',
    syncIntervalDays: 7,
    distros: [
      { name: 'AlmaLinux', version: '9', arch: 'aarch64' },
      { name: 'CentOS Stream', version: '9', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'aarch64' },
      { name: 'Rocky Linux', version: '9', arch: 'aarch64' },
    ],
    configContent: `[cuda-rhel9-sbsa]
name=cuda-rhel9-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/rhel9/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/rhel9/sbsa/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/rhel9/sbsa/cuda-rhel9.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel9/sbsa/cuda-rhel9.repo',
  },
  {
    name: 'NVIDIA CUDA for RHEL 10 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel10/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'AlmaLinux', version: '10', arch: 'x86_64' },
      { name: 'CentOS Stream', version: '10', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'x86_64' },
      { name: 'Rocky Linux', version: '10', arch: 'x86_64' },
    ],
    configContent: `[cuda-rhel10-x86_64]
name=cuda-rhel10-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/rhel10/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/rhel10/x86_64/CDF6BA43.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/rhel10/x86_64/cuda-rhel10.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel10/x86_64/cuda-rhel10.repo',
  },
  {
    name: 'NVIDIA CUDA for RHEL 10 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel10/sbsa',
    syncIntervalDays: 7,
    distros: [
      { name: 'AlmaLinux', version: '10', arch: 'aarch64' },
      { name: 'CentOS Stream', version: '10', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'aarch64' },
      { name: 'Rocky Linux', version: '10', arch: 'aarch64' },
    ],
    configContent: `[cuda-rhel10-sbsa]
name=cuda-rhel10-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/rhel10/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/rhel10/sbsa/CDF6BA43.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/rhel10/sbsa/cuda-rhel10.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel10/sbsa/cuda-rhel10.repo',
  },
  {
    name: 'NVIDIA CUDA for Fedora Linux 42 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/fedora42/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'Fedora Linux', version: '42', arch: 'x86_64' }],
    configContent: `[cuda-fedora42-x86_64]
name=cuda-fedora42-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/fedora42/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/fedora42/x86_64/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/fedora42/x86_64/cuda-fedora42.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/fedora42/x86_64/cuda-fedora42.repo',
  },
  {
    name: 'NVIDIA CUDA for Fedora Linux 42 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/fedora42/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'Fedora Linux', version: '42', arch: 'aarch64' }],
    configContent: `[cuda-fedora42-sbsa]
name=cuda-fedora42-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/fedora42/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/fedora42/sbsa/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/fedora42/sbsa/cuda-fedora42.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/fedora42/sbsa/cuda-fedora42.repo',
  },
  {
    name: 'NVIDIA CUDA for Fedora Linux 43 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/fedora43/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'Fedora Linux', version: '43', arch: 'x86_64' }],
    configContent: `[cuda-fedora43-x86_64]
name=cuda-fedora43-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/fedora43/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/fedora43/x86_64/1940C73E.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/fedora43/x86_64/cuda-fedora43.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/fedora43/x86_64/cuda-fedora43.repo',
  },
  {
    name: 'NVIDIA CUDA for Fedora Linux 43 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/fedora43/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'Fedora Linux', version: '43', arch: 'aarch64' }],
    configContent: `[cuda-fedora43-sbsa]
name=cuda-fedora43-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/fedora43/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/fedora43/sbsa/1940C73E.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/fedora43/sbsa/cuda-fedora43.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/fedora43/sbsa/cuda-fedora43.repo',
  },
  {
    name: 'NVIDIA CUDA for Fedora Linux 44 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/fedora44/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'Fedora Linux', version: '44', arch: 'x86_64' }],
    configContent: `[cuda-fedora44-x86_64]
name=cuda-fedora44-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/fedora44/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/fedora44/x86_64/73CD9B30.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/fedora44/x86_64/cuda-fedora44.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/fedora44/x86_64/cuda-fedora44.repo',
  },
  {
    name: 'NVIDIA CUDA for SUSE Linux Enterprise 15 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/sles15/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'SUSE Linux Enterprise', version: '15.7', arch: 'x86_64' }],
    configContent: `[cuda-sles15-x86_64]
name=cuda-sles15-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/sles15/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/sles15/x86_64/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/sles15/x86_64/cuda-sles15.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/sles15/x86_64/cuda-sles15.repo',
  },
  {
    name: 'NVIDIA CUDA for SUSE Linux Enterprise 15 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/sles15/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'SUSE Linux Enterprise', version: '15.7', arch: 'aarch64' }],
    configContent: `[cuda-sles15-sbsa]
name=cuda-sles15-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/sles15/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/sles15/sbsa/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/sles15/sbsa/cuda-sles15.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/sles15/sbsa/cuda-sles15.repo',
  },
  {
    name: 'NVIDIA CUDA for SUSE Linux Enterprise 16 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/sles16/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'SUSE Linux Enterprise', version: '16.0', arch: 'x86_64' }],
    configContent: `[cuda-sles16-x86_64]
name=cuda-sles16-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/sles16/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/sles16/x86_64/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/sles16/x86_64/cuda-sles16.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/sles16/x86_64/cuda-sles16.repo',
  },
  {
    name: 'NVIDIA CUDA for SUSE Linux Enterprise 16 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/sles16/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'SUSE Linux Enterprise', version: '16.0', arch: 'aarch64' }],
    configContent: `[cuda-sles16-sbsa]
name=cuda-sles16-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/sles16/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/sles16/sbsa/D42D0685.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/sles16/sbsa/cuda-sles16.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/sles16/sbsa/cuda-sles16.repo',
  },
  {
    name: 'NVIDIA CUDA for openSUSE Leap 16 (x86_64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/suse16/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'openSUSE Leap', version: '16.0', arch: 'x86_64' }],
    configContent: `[cuda-suse16-x86_64]
name=cuda-suse16-x86_64
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/suse16/x86_64
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/suse16/x86_64/3A8B5622.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/suse16/x86_64/cuda-suse16.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/suse16/x86_64/cuda-suse16.repo',
  },
  {
    name: 'NVIDIA CUDA for openSUSE Leap 16 (aarch64)',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/suse16/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'openSUSE Leap', version: '16.0', arch: 'aarch64' }],
    configContent: `[cuda-suse16-sbsa]
name=cuda-suse16-sbsa
baseurl=https://developer.download.nvidia.com/compute/cuda/repos/suse16/sbsa
enabled=1
gpgcheck=1
gpgkey=https://developer.download.nvidia.com/compute/cuda/repos/suse16/sbsa/3A8B5622.pub
`,
    configUrl:
      'https://developer.download.nvidia.com/compute/cuda/repos/suse16/sbsa/cuda-suse16.repo',
    installScript:
      'sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/suse16/sbsa/cuda-suse16.repo',
  },
  {
    name: 'Zoom for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl: 'deb https://repo.zoom.us/repo/deb/release/ any main',
    syncIntervalDays: 7,
    distros: [
      { name: 'Debian', version: '12', arch: 'x86_64' },
      { name: 'Debian', version: '13', arch: 'x86_64' },
      { name: 'Ubuntu', version: '24.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '26.04', arch: 'x86_64' },
    ],
    configContent: 'deb https://repo.zoom.us/repo/deb/release/ any main',
  },
  {
    name: 'Zoom for Fedora and Red Hat Enterprise Linux',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.zoom.us/repo/rpm/release/',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'x86_64' },
      { name: 'CentOS Stream', version: '10', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '42', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '43', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '44', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'x86_64' },
    ],
    configContent: `[zoom-release]
name=zoom (release)
baseurl=https://repo.zoom.us/repo/rpm/release/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://zoom.us/linux/download/pubkey
skip_if_unavailable=True
`,
  },
  {
    name: 'Zoom for openSUSE and SUSE Linux Enterprise',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.zoom.us/repo/opensuse/release/',
    syncIntervalDays: 7,
    distros: [
      { name: 'openSUSE Leap', version: '16.0', arch: 'x86_64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' },
      { name: 'SUSE Linux Enterprise', version: '16.0', arch: 'x86_64' },
    ],
    configContent: `[zoom-release]
name=zoom (release)
baseurl=https://repo.zoom.us/repo/opensuse/release/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://zoom.us/linux/download/pubkey
skip_if_unavailable=True
`,
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
