import type { RepoSeed } from '#database/data/types'

/**
 * The repositories of the catalog that a vendor publishes: the ones a release installs from, which
 * no distribution ships. They are stored once per base URL and linked to every release their
 * `distros` selectors name, so a repository a whole family of releases installs from is one entry
 * with several entries behind it. Every entry states `source: 'vendor'`, and it keeps the
 * configuration file and the installation script its publisher documents, when it documents one.
 */
export const vendorRepos: RepoSeed[] = [
  {
    name: 'VLC for openSUSE Tumbleweed',
    type: 'rpm',
    source: 'vendor',
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
    source: 'vendor',
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
    name: 'NVIDIA CUDA for Ubuntu 24.04 (x86_64)',
    type: 'deb',
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'elementary OS', version: '8', arch: 'x86_64' },
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64',
    syncIntervalDays: 7,
    distros: [{ name: 'Red Hat Enterprise Linux', version: '8', arch: 'x86_64' }],
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
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/sbsa',
    syncIntervalDays: 7,
    distros: [{ name: 'Red Hat Enterprise Linux', version: '8', arch: 'aarch64' }],
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
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/ppc64le',
    syncIntervalDays: 7,
    distros: [{ name: 'Red Hat Enterprise Linux', version: '8', arch: 'ppc64le' }],
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
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'x86_64' },
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
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel9/sbsa',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'aarch64' },
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
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel10/x86_64',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '10', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'x86_64' },
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
    source: 'vendor',
    baseUrl: 'https://developer.download.nvidia.com/compute/cuda/repos/rhel10/sbsa',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '10', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'aarch64' },
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
    name: 'NVIDIA CUDA for Fedora Linux 43 (x86_64)',
    type: 'rpm',
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    source: 'vendor',
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
    // The suite of the repository is `release` and its component `main`, served from
    // `https://repo.zoom.us/repo/deb/dists/release/main/binary-amd64/Packages.gz`
    baseUrl: 'deb https://repo.zoom.us/repo/deb/ release main',
    syncIntervalDays: 7,
    distros: [
      { name: 'Debian', version: '12', arch: 'x86_64' },
      { name: 'Debian', version: '13', arch: 'x86_64' },
      { name: 'Ubuntu', version: '24.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '26.04', arch: 'x86_64' },
    ],
    configContent: 'deb https://repo.zoom.us/repo/deb/ release main',
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
    // Brave publishes one `aptly`-generated apt repository for the Debian-based releases (suite
    // `stable`, component `main`, architectures `amd64` and `arm64`) and one rpm repository per
    // architecture, whose directory is what `$basearch` stands for in the `.repo` file Brave ships
    name: 'Brave Browser for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com stable main',
    syncIntervalDays: 7,
    distros: [
      { name: 'Debian', version: '12', arch: 'x86_64' },
      { name: 'Debian', version: '12', arch: 'aarch64' },
      { name: 'Debian', version: '13', arch: 'x86_64' },
      { name: 'Debian', version: '13', arch: 'aarch64' },
      { name: 'Ubuntu', version: '22.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '22.04', arch: 'aarch64' },
      { name: 'Ubuntu', version: '24.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '24.04', arch: 'aarch64' },
      { name: 'Ubuntu', version: '26.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '26.04', arch: 'aarch64' },
    ],
    configContent: `deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com stable main`,
    configUrl: 'https://brave-browser-apt-release.s3.brave.com/brave-browser.sources',
    installScript:
      'sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg && sudo curl -fsSLo /etc/apt/sources.list.d/brave-browser-release.sources https://brave-browser-apt-release.s3.brave.com/brave-browser.sources',
  },
  {
    // The rpm builds of Brave are made for Fedora, the Enterprise Linux family and the SUSE ones,
    // which install them with `dnf config-manager --add-repo` and `zypper addrepo` on the same
    // `.repo` file, so one repository of this catalog serves all of them
    name: 'Brave Browser for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://brave-browser-rpm-release.s3.brave.com/x86_64/',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'x86_64' },
      { name: 'CentOS Stream', version: '10', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '43', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '44', arch: 'x86_64' },
      { name: 'openSUSE Leap', version: '16.0', arch: 'x86_64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'x86_64' },
      { name: 'SUSE Linux Enterprise', version: '15.7', arch: 'x86_64' },
      { name: 'SUSE Linux Enterprise', version: '16.0', arch: 'x86_64' },
    ],
    configContent: `[brave-browser]
name=Brave Browser
enabled=1
gpgcheck=1
gpgkey=https://brave-browser-rpm-release.s3.brave.com/brave-core.asc
baseurl=https://brave-browser-rpm-release.s3.brave.com/$basearch
`,
    configUrl: 'https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo',
  },
  {
    name: 'Brave Browser for Fedora, RHEL and SUSE (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://brave-browser-rpm-release.s3.brave.com/aarch64/',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'aarch64' },
      { name: 'CentOS Stream', version: '10', arch: 'aarch64' },
      { name: 'Fedora Linux', version: '43', arch: 'aarch64' },
      { name: 'Fedora Linux', version: '44', arch: 'aarch64' },
      { name: 'openSUSE Leap', version: '16.0', arch: 'aarch64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'aarch64' },
      { name: 'SUSE Linux Enterprise', version: '15.7', arch: 'aarch64' },
      { name: 'SUSE Linux Enterprise', version: '16.0', arch: 'aarch64' },
    ],
    configContent: `[brave-browser]
name=Brave Browser
enabled=1
gpgcheck=1
gpgkey=https://brave-browser-rpm-release.s3.brave.com/brave-core.asc
baseurl=https://brave-browser-rpm-release.s3.brave.com/$basearch
`,
    configUrl: 'https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo',
  },
  {
    // Opera documents one apt repository for the Debian based releases, whose lines are written to
    // `/etc/apt/sources.list.d/opera-archive.list` with a key of its own in
    // `/usr/share/keyrings/opera-browser.gpg`. The suite stays `stable` and the component is
    // `non-free`, whatever the release of the distribution (the manual warns against naming the
    // suite of a testing or unstable release instead), and the suite publishes amd64 and arm64
    // packages (its i386 index is empty)
    name: 'Opera for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [signed-by=/usr/share/keyrings/opera-browser.gpg] https://deb.opera.com/opera-stable/ stable non-free',
    syncIntervalDays: 7,
    distros: [
      { name: 'Debian', version: '12', arch: 'x86_64' },
      { name: 'Debian', version: '12', arch: 'aarch64' },
      { name: 'Debian', version: '13', arch: 'x86_64' },
      { name: 'Debian', version: '13', arch: 'aarch64' },
      { name: 'Ubuntu', version: '22.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '22.04', arch: 'aarch64' },
      { name: 'Ubuntu', version: '24.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '24.04', arch: 'aarch64' },
      { name: 'Ubuntu', version: '26.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '26.04', arch: 'aarch64' },
    ],
    configContent: `deb [signed-by=/usr/share/keyrings/opera-browser.gpg] https://deb.opera.com/opera-stable/ stable non-free`,
    installScript:
      'wget -qO- https://deb.opera.com/archive.key | gpg --dearmor | sudo dd of=/usr/share/keyrings/opera-browser.gpg && echo "deb [signed-by=/usr/share/keyrings/opera-browser.gpg] https://deb.opera.com/opera-stable/ stable non-free" | sudo dd of=/etc/apt/sources.list.d/opera-archive.list',
  },
  {
    // Opera publishes every rpm build of every channel (the stable, beta, developer and GX ones)
    // in one flat repository, where the x86_64 and aarch64 packages sit next to each other, so one
    // row of this catalog serves both architectures. The manual documents the repository file of
    // Fedora and the one of openSUSE, which differ in their `autorefresh` and `keeppackages` lines
    // only, so this row carries the one the manual writes for Fedora and no install script. The
    // packages link against `libc.so.6(GLIBC_2.25)`, which every release linked here provides
    name: 'Opera for Fedora, RHEL and SUSE',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.opera.com/rpm/',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'x86_64' },
      { name: 'CentOS Stream', version: '9', arch: 'aarch64' },
      { name: 'CentOS Stream', version: '10', arch: 'x86_64' },
      { name: 'CentOS Stream', version: '10', arch: 'aarch64' },
      { name: 'Fedora Linux', version: '43', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '43', arch: 'aarch64' },
      { name: 'Fedora Linux', version: '44', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '44', arch: 'aarch64' },
      { name: 'openSUSE Leap', version: '16.0', arch: 'x86_64' },
      { name: 'openSUSE Leap', version: '16.0', arch: 'aarch64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'aarch64' },
      { name: 'SUSE Linux Enterprise', version: '15.7', arch: 'x86_64' },
      { name: 'SUSE Linux Enterprise', version: '15.7', arch: 'aarch64' },
      { name: 'SUSE Linux Enterprise', version: '16.0', arch: 'x86_64' },
      { name: 'SUSE Linux Enterprise', version: '16.0', arch: 'aarch64' },
    ],
    configContent: `[opera]
name=Opera packages
type=rpm-md
baseurl=https://rpm.opera.com/rpm
gpgcheck=1
gpgkey=https://rpm.opera.com/rpmrepo.key
enabled=1
`,
  },
  {
    // Chrome for the Debian based releases comes from one apt repository whose suite is `stable`
    // and whose component is `main`, and which publishes the amd64 and the arm64 packages of every
    // channel. Its apt line is the one the packages Google ships write themselves: the
    // `google-chrome-repo` package writes it for the architecture it is built for (`[arch=amd64]`
    // in the amd64 build, `[arch=arm64]` in the arm64 one) and lays a `deb822` file naming the same
    // suite under `chrome-repo/deb/` next to it, so this row stands for both architectures, which
    // one URL serves. The key is the one of every Google Linux package. The repository publishes no
    // DEP-11 metadata and no `Contents` index (both answer 404), so the synchronization reads no
    // application out of it and its packages are linked to the applications by name instead, the
    // way the Brave deb packages are linked
    name: 'Google Chrome for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl: 'deb [arch=amd64,arm64] https://dl.google.com/linux/chrome/deb/ stable main',
    syncIntervalDays: 7,
    distros: [
      { name: 'Debian', version: '12', arch: 'x86_64' },
      { name: 'Debian', version: '12', arch: 'aarch64' },
      { name: 'Debian', version: '13', arch: 'x86_64' },
      { name: 'Debian', version: '13', arch: 'aarch64' },
      { name: 'Ubuntu', version: '22.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '22.04', arch: 'aarch64' },
      { name: 'Ubuntu', version: '24.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '24.04', arch: 'aarch64' },
      { name: 'Ubuntu', version: '26.04', arch: 'x86_64' },
      { name: 'Ubuntu', version: '26.04', arch: 'aarch64' },
    ],
    configContent: 'deb [arch=amd64,arm64] https://dl.google.com/linux/chrome/deb/ stable main',
    installScript:
      'wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo tee /etc/apt/trusted.gpg.d/google.asc >/dev/null && echo "deb [arch=amd64,arm64] https://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list',
  },
  {
    // Chrome publishes one flat rpm repository per architecture, and its rpm writes the repository
    // file on installation: the yum family gets `/etc/yum.repos.d/google-chrome.repo` and the SUSE
    // family `/etc/zypp/repos.d/google-chrome.repo`, which differ in their `autorefresh`, `type`
    // and `keeppackages` lines only, so this row carries the one the yum family gets, the way the
    // Opera row does. The repository publishes a file list, which names the metadata file of every
    // channel (`/usr/share/appdata/google-chrome.appdata.xml` and the ones of the beta, canary and
    // unstable channels), so the synchronization reads those applications out of the packages
    name: 'Google Chrome for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://dl.google.com/linux/chrome/rpm/stable/x86_64/',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'x86_64' },
      { name: 'CentOS Stream', version: '10', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '43', arch: 'x86_64' },
      { name: 'Fedora Linux', version: '44', arch: 'x86_64' },
      { name: 'openSUSE Leap', version: '16.0', arch: 'x86_64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'x86_64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'x86_64' },
      { name: 'SUSE Linux Enterprise', version: '15.7', arch: 'x86_64' },
      { name: 'SUSE Linux Enterprise', version: '16.0', arch: 'x86_64' },
    ],
    configContent: `[google-chrome]
name=google-chrome
baseurl=https://dl.google.com/linux/chrome/rpm/stable/x86_64
enabled=1
gpgcheck=1
gpgkey=https://dl.google.com/linux/linux_signing_key.pub
`,
  },
  {
    name: 'Google Chrome for Fedora, RHEL and SUSE (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://dl.google.com/linux/chrome/rpm/stable/aarch64/',
    syncIntervalDays: 7,
    distros: [
      { name: 'CentOS Stream', version: '9', arch: 'aarch64' },
      { name: 'CentOS Stream', version: '10', arch: 'aarch64' },
      { name: 'Fedora Linux', version: '43', arch: 'aarch64' },
      { name: 'Fedora Linux', version: '44', arch: 'aarch64' },
      { name: 'openSUSE Leap', version: '16.0', arch: 'aarch64' },
      { name: 'openSUSE Tumbleweed', version: null, arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '8', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '9', arch: 'aarch64' },
      { name: 'Red Hat Enterprise Linux', version: '10', arch: 'aarch64' },
      { name: 'SUSE Linux Enterprise', version: '15.7', arch: 'aarch64' },
      { name: 'SUSE Linux Enterprise', version: '16.0', arch: 'aarch64' },
    ],
    configContent: `[google-chrome]
name=google-chrome
baseurl=https://dl.google.com/linux/chrome/rpm/stable/aarch64
enabled=1
gpgcheck=1
gpgkey=https://dl.google.com/linux/linux_signing_key.pub
`,
  },
]
