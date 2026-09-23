import {
  debDistros,
  debianDistros,
  elDistros,
  fedoraDistros,
  leapDistros,
  rpmDistros,
  suseDistros,
  tumbleweedDistros,
  ubuntuDistros,
} from '#database/data/repo_distros'
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
  {
    // Visual Studio Code for the Debian based releases comes from the apt repository Microsoft
    // publishes its Linux packages in, whose suite is `stable` and whose component is `main`. The
    // manual documents the source as a `deb822` file (`/etc/apt/sources.list.d/vscode.sources`)
    // that names the architectures `amd64,arm64,armhf` and the key under
    // `/usr/share/keyrings/microsoft.gpg`; the package installs it itself, for the one
    // architecture it is built for, and the classic form its postinst names
    // (`deb [arch=amd64] https://packages.microsoft.com/repos/code stable main`) is what this row
    // stores, the way the Chrome row stores the line of its own package. The suite publishes every
    // version it keeps of the stable, insiders and exploration channels of amd64, arm64 and armhf
    // (359 index entries for amd64, 360 for arm64), of which the catalog serves the two that a
    // release of its own states. It publishes no AppStream metadata: the `dep11` directory of the
    // suite is refused by the server (403) and its `Contents` index is not there (404), so the
    // synchronization reads no application out of it and its packages are linked to the
    // applications by name instead, the way the Brave and Chrome deb packages are linked
    name: 'Visual Studio Code for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/code stable main',
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
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/code stable main',
    installScript:
      'wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor -o /usr/share/keyrings/microsoft.gpg && echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list',
  },
  {
    // Visual Studio Code for the RPM based releases comes from the yum repository Microsoft
    // publishes its packages in, which keeps the packages of every architecture of every channel
    // in one flat directory (`Packages/`), so one row of this catalog serves both architectures
    // that a release states, the way the Opera rpm row does. The manual documents the repository
    // file of the yum family and the one of the SUSE family, which are the same file written to
    // `/etc/yum.repos.d/vscode.repo` and `/etc/zypp/repos.d/vscode.repo`, so this row carries it
    // once. Its `repomd.xml` names primary, file lists and other metadata but no AppStream catalog,
    // so the applications are read from the file lists instead, which name the metadata file of
    // every channel (`/usr/share/appdata/code.appdata.xml`, and the ones of the insiders, the
    // exploration and the `com.microsoft.VSCodeInsiders` IDs), the way the Chrome rpm row reads
    // them. The packages are built for RHEL 8 (`libc.so.6(GLIBC_2.28)`), which every release
    // linked here provides, and the repository publishes the armv7hl packages of the same channels
    // next to the x86_64 and aarch64 ones, which no release of this catalog installs
    name: 'Visual Studio Code for Fedora, RHEL and SUSE',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/yumrepos/vscode/',
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
    configContent: `[code]
name=Visual Studio Code
baseurl=https://packages.microsoft.com/yumrepos/vscode
enabled=1
autorefresh=1
type=rpm-md
gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft.asc
`,
    installScript:
      'sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc && echo -e "[code]\\nname=Visual Studio Code\\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\\nenabled=1\\nautorefresh=1\\ntype=rpm-md\\ngpgcheck=1\\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" | sudo tee /etc/yum.repos.d/vscode.repo > /dev/null',
  },
  {
    // opi installs the Google Antigravity IDE from this repository, which is the one the IDE
    // updates itself from: a Google Artifact Registry `yum` repository, whose single flat tree
    // carries the x86_64 and the aarch64 build of the one package it holds, and which Google
    // documents for no other distribution than the SUSE ones. Google publishes no Debian flavour
    // of it (the download page offers a tarball and the CLI ships an install script)
    name: 'Google Antigravity for Fedora, RHEL and SUSE',
    type: 'rpm',
    source: 'vendor',
    baseUrl:
      'https://us-central1-yum.pkg.dev/projects/antigravity-auto-updater-dev/antigravity-rpm/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64', 'aarch64']),
    configContent: `[antigravity]
name=Google Antigravity
baseurl=https://us-central1-yum.pkg.dev/projects/antigravity-auto-updater-dev/antigravity-rpm
enabled=1
gpgcheck=1
gpgkey=https://us-central1-yum.pkg.dev/doc/repo-signing-key.gpg
`,
  },
  {
    // AnyDesk publishes one flat rpm repository per architecture, which it documents as
    // `baseurl=https://rpm.anydesk.com/$basearch/`: the per-family directories of its download page
    // (`opensuse/`, `fedora/`, `centos/`, `rhel/`) carry copies of the same metadata, and the ones
    // of a family hold the x86_64 build alone, so this row and the aarch64 one are what both
    // architectures install from. opi records the openSUSE directory, which answers for the x86_64
    // architecture only
    name: 'AnyDesk for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.anydesk.com/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[anydesk]
name=AnyDesk
baseurl=https://rpm.anydesk.com/$basearch/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://keys.anydesk.com/repos/RPM-GPG-KEY
`,
  },
  {
    name: 'AnyDesk for Fedora, RHEL and SUSE (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.anydesk.com/aarch64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['aarch64']),
    configContent: `[anydesk]
name=AnyDesk
baseurl=https://rpm.anydesk.com/$basearch/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://keys.anydesk.com/repos/RPM-GPG-KEY
`,
  },
  {
    // AnyDesk generates one apt repository from the Debian packages of both architectures it builds
    // for, whose suite is `all` — the release of the distribution does not enter it — and whose
    // component is `main`. The steps are the ones of the how-to page of the repository
    name: 'AnyDesk for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [signed-by=/etc/apt/keyrings/keys.anydesk.com.asc] https://deb.anydesk.com all main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [signed-by=/etc/apt/keyrings/keys.anydesk.com.asc] https://deb.anydesk.com all main',
    configUrl: 'https://deb.anydesk.com/howto.html',
    installScript:
      'sudo install -m 0755 -d /etc/apt/keyrings && sudo curl -fsSL https://keys.anydesk.com/repos/DEB-GPG-KEY -o /etc/apt/keyrings/keys.anydesk.com.asc && sudo chmod a+r /etc/apt/keyrings/keys.anydesk.com.asc && echo "deb [signed-by=/etc/apt/keyrings/keys.anydesk.com.asc] https://deb.anydesk.com all main" | sudo tee /etc/apt/sources.list.d/anydesk-stable.list',
  },
  {
    // OpenAI publishes the desktop application of ChatGPT in one flat rpm repository per
    // architecture, and signs it with a key that is stored inside the package rather than
    // published, which is why opi ships it as a block of its own plugin and points the repository
    // file at the copy it installs under `/etc/pki/rpm-gpg`
    name: 'ChatGPT for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://persistent.oaistatic.com/codex-app-prod/linux/rpm/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[openai-chatgpt]
name=ChatGPT
baseurl=https://persistent.oaistatic.com/codex-app-prod/linux/rpm/$basearch
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-chatgpt.asc
`,
  },
  {
    name: 'ChatGPT for Fedora, RHEL and SUSE (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://persistent.oaistatic.com/codex-app-prod/linux/rpm/aarch64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['aarch64']),
    configContent: `[openai-chatgpt]
name=ChatGPT
baseurl=https://persistent.oaistatic.com/codex-app-prod/linux/rpm/$basearch
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-chatgpt.asc
`,
  },
  {
    // The apt repository of the same application, which opi does not record: one suite `stable`
    // with one component `main`, holding the amd64 and the arm64 build of the one package it
    // carries. Its key is published inside the packages as well, so no key is named here
    name: 'ChatGPT for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64] https://persistent.oaistatic.com/codex-app-prod/linux/deb stable main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [arch=amd64,arm64] https://persistent.oaistatic.com/codex-app-prod/linux/deb stable main',
  },
  {
    // Collabora publishes one snapshot directory per release of its office suite, and the directory
    // opi records (the 24.04 snapshot) has been withdrawn: the 26 one is the current snapshot,
    // whose `yum` tree holds the x86_64 and the noarch packages of the suite and no aarch64 build
    name: 'Collabora Office 26 Snapshot for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://www.collaboraoffice.com/downloads/Collabora-Office-26-Snapshot/Linux/yum/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[collabora-office]
name=Collabora Office 26 Snapshot
baseurl=https://www.collaboraoffice.com/downloads/Collabora-Office-26-Snapshot/Linux/yum
enabled=1
gpgcheck=1
gpgkey=https://www.collaboraoffice.com/downloads/Collabora-Office-26-Snapshot/Linux/yum/repodata/repomd.xml.key
`,
  },
  {
    // The Debian packages of the same snapshot sit in the `apt` directory next to the `yum` one,
    // which is a flat repository (no suite directories: the index is the `Packages` file of the
    // directory itself, published uncompressed) holding the amd64 and the `all` packages of the
    // suite. Only the snapshot directory of the release the row names is current
    name: 'Collabora Office 26 Snapshot for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64] https://www.collaboraoffice.com/downloads/Collabora-Office-26-Snapshot/Linux/apt/ ./',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64']),
    configContent:
      'deb [arch=amd64] https://www.collaboraoffice.com/downloads/Collabora-Office-26-Snapshot/Linux/apt/ ./',
  },
  {
    // HashiCorp publishes its whole product line (Vagrant, Terraform, Consul, Nomad, Vault, …) in
    // one repository per family, release and architecture, which opi reaches through the
    // `AmazonLinux` one that this catalog holds no release of. The repository file the vendor
    // documents is written with `$releasever` and `$basearch`, so each directory the catalog stores
    // is one release of one architecture, and the x86_64 directory is the one that also carries the
    // packages of every other architecture the product builds for (aarch64, armv7hl and i386 among
    // them). The disabled `[hashicorp-test]` section is the one the file ships with
    name: 'HashiCorp for Red Hat Enterprise Linux 8 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/RHEL/8/x86_64/stable/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64'], ['8']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo',
    installScript:
      'wget -O- https://rpm.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && wget -O- https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo | sudo tee /etc/yum.repos.d/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Red Hat Enterprise Linux 8 (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/RHEL/8/aarch64/stable/',
    syncIntervalDays: 7,
    distros: elDistros(['aarch64'], ['8']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Red Hat Enterprise Linux 9 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/RHEL/9/x86_64/stable/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64'], ['9']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Red Hat Enterprise Linux 9 (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/RHEL/9/aarch64/stable/',
    syncIntervalDays: 7,
    distros: elDistros(['aarch64'], ['9']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Red Hat Enterprise Linux 10 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/RHEL/10/x86_64/stable/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64'], ['10']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Red Hat Enterprise Linux 10 (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/RHEL/10/aarch64/stable/',
    syncIntervalDays: 7,
    distros: elDistros(['aarch64'], ['10']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/RHEL/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Fedora Linux 43 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/fedora/43/x86_64/stable/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64'], ['43']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/fedora/hashicorp.repo',
    installScript:
      'wget -O- https://rpm.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && wget -O- https://rpm.releases.hashicorp.com/fedora/hashicorp.repo | sudo tee /etc/yum.repos.d/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Fedora Linux 43 (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/fedora/43/aarch64/stable/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['aarch64'], ['43']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/fedora/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Fedora Linux 44 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/fedora/44/x86_64/stable/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64'], ['44']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/fedora/hashicorp.repo',
  },
  {
    name: 'HashiCorp for Fedora Linux 44 (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://rpm.releases.hashicorp.com/fedora/44/aarch64/stable/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['aarch64'], ['44']),
    configContent: `[hashicorp]
name=Hashicorp Stable - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg

[hashicorp-test]
name=Hashicorp Test - $basearch
baseurl=https://rpm.releases.hashicorp.com/fedora/$releasever/$basearch/test
enabled=0
gpgcheck=1
gpgkey=https://rpm.releases.hashicorp.com/gpg
`,
    configUrl: 'https://rpm.releases.hashicorp.com/fedora/hashicorp.repo',
  },
  {
    // The apt repository of the same product line holds one suite per release of Ubuntu and Debian
    // — the code name of the release is the suite — whose `main` component carries the stable
    // packages and whose `test` one the pre-releases
    name: 'HashiCorp for Ubuntu 22.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com jammy main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['22.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com jammy main',
    configUrl: 'https://apt.releases.hashicorp.com/gpg',
    installScript:
      'wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com jammy main" | sudo tee /etc/apt/sources.list.d/hashicorp.list',
  },
  {
    name: 'HashiCorp for Ubuntu 24.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com noble main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['24.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com noble main',
  },
  {
    name: 'HashiCorp for Ubuntu 26.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com resolute main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['26.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com resolute main',
  },
  {
    name: 'HashiCorp for Debian 12',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com bookworm main',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64', 'aarch64'], ['12']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com bookworm main',
  },
  {
    name: 'HashiCorp for Debian 13',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com trixie main',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64', 'aarch64'], ['13']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com trixie main',
  },
  {
    // Jami publishes one flat repository per family and release — the name of the directory is the
    // family and the release it serves — and every one of them carries the x86_64 packages alone.
    // The Tumbleweed directory opi records has not been rebuilt since 2021 (the project moved to
    // the per-release directories), which is why this row is only read when a synchronization is
    // forced
    name: 'Jami for openSUSE Tumbleweed (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://dl.jami.net/nightly/opensuse-tumbleweed/',
    syncIntervalDays: null,
    distros: tumbleweedDistros(['x86_64']),
    configContent: `[jami]
name=opensuse-tumbleweed - $basearch - jami
baseurl=https://dl.jami.net/nightly/opensuse-tumbleweed
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://dl.jami.net/jami.pub.key
enabled=1
`,
  },
  {
    name: 'Jami for openSUSE Leap 16.0 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://dl.jami.net/nightly/opensuse-leap_16.0/',
    syncIntervalDays: 7,
    distros: leapDistros(['x86_64']),
    configContent: `[jami]
name=opensuse-leap $releasever - $basearch - jami
baseurl=https://dl.jami.net/nightly/opensuse-leap_$releasever
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://dl.jami.net/jami.pub.key
enabled=1
`,
    configUrl: 'https://dl.jami.net/nightly/opensuse-leap_16.0/jami-nightly.repo',
  },
  {
    name: 'Jami for Fedora Linux 43 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://dl.jami.net/nightly/fedora_43/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64'], ['43']),
    configContent: `[jami]
name=fedora $releasever - $basearch - jami
baseurl=https://dl.jami.net/nightly/fedora_$releasever
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://dl.jami.net/jami.pub.key
enabled=1
`,
    configUrl: 'https://dl.jami.net/nightly/fedora_43/jami-nightly.repo',
  },
  {
    name: 'Jami for Fedora Linux 44 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://dl.jami.net/nightly/fedora_44/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64'], ['44']),
    configContent: `[jami]
name=fedora $releasever - $basearch - jami
baseurl=https://dl.jami.net/nightly/fedora_$releasever
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://dl.jami.net/jami.pub.key
enabled=1
`,
    configUrl: 'https://dl.jami.net/nightly/fedora_44/jami-nightly.repo',
  },
  {
    name: 'Jami for Red Hat Enterprise Linux 9 (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://dl.jami.net/nightly/rhel_9/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64'], ['9']),
    configContent: `[jami]
name=rhel $releasever - $basearch - jami
baseurl=https://dl.jami.net/nightly/rhel_9
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://dl.jami.net/jami.pub.key
enabled=1
`,
  },
  {
    // The Debian packages sit in aptly generated repositories of their own, whose suite is named
    // `jami` — the legacy `ring` suite is still published next to it — and whose `main` component
    // carries the amd64 packages alone (the index of the other architectures is empty). No apt line
    // is documented by the project, so the one stored here is the shape of the repository
    name: 'Jami for Ubuntu 22.04 (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/ubuntu_22.04/ jami main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64'], ['22.04']),
    configContent:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/ubuntu_22.04/ jami main',
  },
  {
    name: 'Jami for Ubuntu 24.04 (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/ubuntu_24.04/ jami main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64'], ['24.04']),
    configContent:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/ubuntu_24.04/ jami main',
  },
  {
    name: 'Jami for Ubuntu 26.04 (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/ubuntu_26.04/ jami main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64'], ['26.04']),
    configContent:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/ubuntu_26.04/ jami main',
  },
  {
    name: 'Jami for Debian 12 (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/debian_12/ jami main',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64'], ['12']),
    configContent:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/debian_12/ jami main',
  },
  {
    name: 'Jami for Debian 13 (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/debian_13/ jami main',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64'], ['13']),
    configContent:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/jami-archive-keyring.gpg] https://dl.jami.net/nightly/debian_13/ jami main',
  },
  {
    // The LibreWolf project serves both of its repositories from one host, and its own `.repo` file
    // names `https://repo.librewolf.net` as the base URL, which opi reaches through the
    // `rpm.librewolf.net` name of the same tree. One repository carries the x86_64 and the aarch64
    // package of the browser, so one row serves both architectures
    name: 'LibreWolf for Fedora, RHEL and SUSE',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.librewolf.net/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64', 'aarch64']),
    configContent: `[librewolf]
name=LibreWolf Software Repository
baseurl=https://repo.librewolf.net
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://repo.librewolf.net/pubkey.gpg
enabled=1
`,
    configUrl: 'https://repo.librewolf.net/librewolf.repo',
  },
  {
    // The suite of the apt repository is the project name (`librewolf`), not the release of the
    // distribution, and its `main` component holds the amd64 and the arm64 packages
    name: 'LibreWolf for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/librewolf.gpg] https://repo.librewolf.net/ librewolf main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/librewolf.gpg] https://repo.librewolf.net/ librewolf main',
    installScript:
      'sudo apt update && sudo apt install extrepo -y && sudo extrepo enable librewolf && sudo extrepo update librewolf && sudo apt update',
  },
  {
    // MEGA publishes one directory per release of every family it serves — the name of the directory
    // is the family and the release — whose metadata covers the x86_64 and the aarch64 packages of
    // the desktop client, the command line client and the file manager extensions. opi records the
    // Tumbleweed directory
    name: 'MEGAsync for openSUSE Tumbleweed',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://mega.nz/linux/repo/openSUSE_Tumbleweed/',
    syncIntervalDays: 7,
    distros: tumbleweedDistros(['x86_64', 'aarch64']),
    configContent: `[megasync]
name=MEGAsync
type=rpm-md
baseurl=https://mega.nz/linux/repo/openSUSE_Tumbleweed/
enabled=1
gpgcheck=1
gpgkey=https://mega.nz/linux/repo/openSUSE_Tumbleweed/repodata/repomd.xml.key
`,
  },
  {
    name: 'MEGAsync for openSUSE Leap 16.0',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://mega.nz/linux/repo/openSUSE_Leap_16.0/',
    syncIntervalDays: 7,
    distros: leapDistros(['x86_64', 'aarch64']),
    configContent: `[megasync]
name=MEGAsync
type=rpm-md
baseurl=https://mega.nz/linux/repo/openSUSE_Leap_16.0/
enabled=1
gpgcheck=1
gpgkey=https://mega.nz/linux/repo/openSUSE_Leap_16.0/repodata/repomd.xml.key
`,
  },
  {
    name: 'MEGAsync for Fedora Linux 43',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://mega.nz/linux/repo/Fedora_43/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64', 'aarch64'], ['43']),
    configContent: `[megasync]
name=MEGAsync
type=rpm-md
baseurl=https://mega.nz/linux/repo/Fedora_43/
enabled=1
gpgcheck=1
gpgkey=https://mega.nz/linux/repo/Fedora_43/repodata/repomd.xml.key
`,
  },
  {
    name: 'MEGAsync for Fedora Linux 44',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://mega.nz/linux/repo/Fedora_44/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64', 'aarch64'], ['44']),
    configContent: `[megasync]
name=MEGAsync
type=rpm-md
baseurl=https://mega.nz/linux/repo/Fedora_44/
enabled=1
gpgcheck=1
gpgkey=https://mega.nz/linux/repo/Fedora_44/repodata/repomd.xml.key
`,
  },
  {
    // MEGA serves the Enterprise Linux family from directories named after the rebuild, so the row
    // of a stream is the one the release the catalog holds installs from (MEGA publishes no
    // `RHEL_<version>` directory)
    name: 'MEGAsync for CentOS Stream 9',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://mega.nz/linux/repo/CentOS_Stream_9/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64', 'aarch64'], ['9']),
    configContent: `[megasync]
name=MEGAsync
type=rpm-md
baseurl=https://mega.nz/linux/repo/CentOS_Stream_9/
enabled=1
gpgcheck=1
gpgkey=https://mega.nz/linux/repo/CentOS_Stream_9/repodata/repomd.xml.key
`,
  },
  {
    name: 'MEGAsync for CentOS Stream 10',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://mega.nz/linux/repo/CentOS_Stream_10/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64', 'aarch64'], ['10']),
    configContent: `[megasync]
name=MEGAsync
type=rpm-md
baseurl=https://mega.nz/linux/repo/CentOS_Stream_10/
enabled=1
gpgcheck=1
gpgkey=https://mega.nz/linux/repo/CentOS_Stream_10/repodata/repomd.xml.key
`,
  },
  {
    // The Debian packages are served from a flat directory per release of the family — its index is
    // the `Packages` file of the directory itself, whose suite apt is told as `./` — and carry the
    // amd64 and the arm64 build of the client. The key is the one of every MEGA repository
    name: 'MEGAsync for Ubuntu 22.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/xUbuntu_22.04/ ./',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['22.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/xUbuntu_22.04/ ./',
  },
  {
    name: 'MEGAsync for Ubuntu 24.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/xUbuntu_24.04/ ./',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['24.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/xUbuntu_24.04/ ./',
    installScript:
      'sudo mkdir -p /etc/apt/keyrings && curl -fsSL https://mega.nz/keys/MEGA_signing.key | gpg --dearmor | sudo tee /etc/apt/keyrings/meganz-archive-keyring.gpg > /dev/null && echo "deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/xUbuntu_24.04/ ./" | sudo tee /etc/apt/sources.list.d/megaio.list',
  },
  {
    name: 'MEGAsync for Ubuntu 26.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/xUbuntu_26.04/ ./',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['26.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/xUbuntu_26.04/ ./',
  },
  {
    name: 'MEGAsync for Debian 12',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/Debian_12/ ./',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64', 'aarch64'], ['12']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/Debian_12/ ./',
  },
  {
    name: 'MEGAsync for Debian 13',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/Debian_13/ ./',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64', 'aarch64'], ['13']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/meganz-archive-keyring.gpg] https://mega.nz/linux/repo/Debian_13/ ./',
  },
  {
    // Microsoft publishes its package feed once per distribution and release — the repository file
    // is the one `https://packages.microsoft.com/config/<distribution>/<release>/prod.repo` holds —
    // and every tree carries the packages of all the architectures it builds for. opi installs .NET
    // from the openSUSE 15 tree, and the key a tree is signed with is the one named in its own
    // repository file (the 2025 one is the key of the newer releases)
    name: '.NET for SUSE Linux Enterprise 15',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/opensuse/15/prod/',
    syncIntervalDays: 7,
    distros: suseDistros(['x86_64', 'aarch64'], ['15.7']),
    configContent: `[packages-microsoft-com-prod]
name=Microsoft Production
baseurl=https://packages.microsoft.com/opensuse/15/prod/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft.asc
sslverify=1
`,
    configUrl: 'https://packages.microsoft.com/config/opensuse/15/prod.repo',
    installScript:
      'sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc && sudo curl -sSL -o /etc/yum.repos.d/microsoft-prod.repo https://packages.microsoft.com/config/opensuse/15/prod.repo',
  },
  {
    name: '.NET for openSUSE Leap 16 and SUSE Linux Enterprise 16',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/opensuse/16/prod/',
    syncIntervalDays: 7,
    distros: suseDistros(['x86_64', 'aarch64'], ['16.0']),
    configContent: `[packages-microsoft-com-prod]
name=Microsoft Production
baseurl=https://packages.microsoft.com/opensuse/16/prod/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft-2025.asc
sslverify=1
`,
    configUrl: 'https://packages.microsoft.com/config/opensuse/16/prod.repo',
    installScript:
      'sudo rpm --import https://packages.microsoft.com/keys/microsoft-2025.asc && sudo curl -sSL -o /etc/yum.repos.d/microsoft-prod.repo https://packages.microsoft.com/config/opensuse/16/prod.repo',
  },
  {
    name: '.NET for Fedora Linux 43',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/fedora/43/prod/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64', 'aarch64'], ['43']),
    configContent: `[packages-microsoft-com-prod]
name=Microsoft Production
baseurl=https://packages.microsoft.com/fedora/43/prod/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft-2025.asc
sslverify=1
`,
    configUrl: 'https://packages.microsoft.com/config/fedora/43/prod.repo',
  },
  {
    name: '.NET for Fedora Linux 44',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/fedora/44/prod/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64', 'aarch64'], ['44']),
    configContent: `[packages-microsoft-com-prod]
name=Microsoft Production
baseurl=https://packages.microsoft.com/fedora/44/prod/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft-2025.asc
sslverify=1
`,
    configUrl: 'https://packages.microsoft.com/config/fedora/44/prod.repo',
  },
  {
    name: '.NET for Red Hat Enterprise Linux 8',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/rhel/8.0/prod/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64', 'aarch64'], ['8']),
    configContent: `[packages-microsoft-com-prod]
name=packages-microsoft-com-prod
baseurl=https://packages.microsoft.com/rhel/8.0/prod/
enabled=1
gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft.asc
`,
    configUrl: 'https://packages.microsoft.com/config/rhel/8.0/prod.repo',
  },
  {
    name: '.NET for Red Hat Enterprise Linux 9',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/rhel/9.0/prod/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64', 'aarch64'], ['9']),
    configContent: `[packages-microsoft-com-prod]
name=Microsoft Production
baseurl=https://packages.microsoft.com/rhel/9.0/prod/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft.asc
sslverify=1
`,
    configUrl: 'https://packages.microsoft.com/config/rhel/9.0/prod.repo',
  },
  {
    name: '.NET for Red Hat Enterprise Linux 10',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/rhel/10/prod/',
    syncIntervalDays: 7,
    distros: elDistros(['x86_64', 'aarch64'], ['10']),
    configContent: `[packages-microsoft-com-prod]
name=Microsoft Production
baseurl=https://packages.microsoft.com/rhel/10/prod/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft-2025.asc
sslverify=1
`,
    configUrl: 'https://packages.microsoft.com/config/rhel/10/prod.repo',
  },
  {
    // The Debian suite of the feed is named after the release of the distribution, and the apt line
    // stored here is the one `https://packages.microsoft.com/config/<distribution>/<release>/prod.list`
    // holds, verbatim (`armhf` is left out of the ones that name the key only, and no release of the
    // catalog is published for it)
    name: '.NET for Ubuntu 22.04',
    type: 'deb',
    source: 'vendor',
    baseUrl: 'deb [arch=amd64,arm64] https://packages.microsoft.com/ubuntu/22.04/prod jammy main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['22.04']),
    configContent:
      'deb [arch=amd64,arm64] https://packages.microsoft.com/ubuntu/22.04/prod jammy main',
    configUrl: 'https://packages.microsoft.com/config/ubuntu/22.04/prod.list',
    installScript:
      'curl -sSL -O https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb && sudo dpkg -i packages-microsoft-prod.deb && rm packages-microsoft-prod.deb && sudo apt-get update',
  },
  {
    name: '.NET for Ubuntu 24.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/ubuntu/24.04/prod noble main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['24.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/ubuntu/24.04/prod noble main',
    configUrl: 'https://packages.microsoft.com/config/ubuntu/24.04/prod.list',
  },
  {
    name: '.NET for Ubuntu 26.04',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/ubuntu/26.04/prod resolute main',
    syncIntervalDays: 7,
    distros: ubuntuDistros(['x86_64', 'aarch64'], ['26.04']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/ubuntu/26.04/prod resolute main',
    configUrl: 'https://packages.microsoft.com/config/ubuntu/26.04/prod.list',
  },
  {
    name: '.NET for Debian 12',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64', 'aarch64'], ['12']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main',
    configUrl: 'https://packages.microsoft.com/config/debian/12/prod.list',
    installScript:
      'curl -sSL -O https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb && sudo dpkg -i packages-microsoft-prod.deb && rm packages-microsoft-prod.deb && sudo apt-get update',
  },
  {
    name: '.NET for Debian 13',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/13/prod trixie main',
    syncIntervalDays: 7,
    distros: debianDistros(['x86_64', 'aarch64'], ['13']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/13/prod trixie main',
    configUrl: 'https://packages.microsoft.com/config/debian/13/prod.list',
  },
  {
    // The one rpm repository of Microsoft Edge is flat and carries the x86_64 packages of the three
    // channels, which no other architecture of it is built for; the repository file the vendor
    // documents turns the signature checks off and names the key of the repository itself
    name: 'Microsoft Edge for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packages.microsoft.com/yumrepos/edge/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[edge-yum]
name=edge-yum
baseurl=https://packages.microsoft.com/yumrepos/edge/
repo_gpgcheck=0
gpgcheck=0
enabled=1
gpgkey=https://packages.microsoft.com/yumrepos/edge/repodata/repomd.xml.key
`,
    configUrl: 'https://packages.microsoft.com/yumrepos/edge/config.repo',
  },
  {
    // The apt repository of Edge publishes the amd64 packages alone (its arm64 index is empty),
    // which is what the architecture of the line states
    name: 'Microsoft Edge for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64']),
    configContent:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main',
    installScript:
      'curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && sudo install -D -o root -g root -m 644 microsoft.gpg /usr/share/keyrings/microsoft.gpg && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main" | sudo tee /etc/apt/sources.list.d/microsoft-edge.list',
  },
  {
    // The vendor supports the repository on Fedora and on the Debian based releases only (its
    // documentation names Ubuntu, Debian and Fedora), and the rpm tree publishes the x86_64 and the
    // aarch64 build of the VPN client and of the browser, the stable browser of the arm64
    // architecture left out. opi records the same repository, whose base URL is the `$basearch` one
    name: 'Mullvad for Fedora Linux (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repository.mullvad.net/rpm/stable/x86_64/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['x86_64']),
    configContent: `[mullvad-stable]
name=Mullvad VPN
baseurl=https://repository.mullvad.net/rpm/stable/$basearch
type=rpm
enabled=1
gpgcheck=1
gpgkey=https://repository.mullvad.net/rpm/mullvad-keyring.asc
`,
    configUrl: 'https://repository.mullvad.net/rpm/stable/mullvad.repo',
    installScript:
      'sudo dnf config-manager addrepo --from-repofile=https://repository.mullvad.net/rpm/stable/mullvad.repo',
  },
  {
    name: 'Mullvad for Fedora Linux (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repository.mullvad.net/rpm/stable/aarch64/',
    syncIntervalDays: 7,
    distros: fedoraDistros(['aarch64']),
    configContent: `[mullvad-stable]
name=Mullvad VPN
baseurl=https://repository.mullvad.net/rpm/stable/$basearch
type=rpm
enabled=1
gpgcheck=1
gpgkey=https://repository.mullvad.net/rpm/mullvad-keyring.asc
`,
    configUrl: 'https://repository.mullvad.net/rpm/stable/mullvad.repo',
  },
  {
    // The apt repository of the vendor publishes its one suite as `stable` and its packages in the
    // `main` component, for the amd64 and the arm64 architecture
    name: 'Mullvad for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mullvad-keyring.asc] https://repository.mullvad.net/deb/stable stable main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mullvad-keyring.asc] https://repository.mullvad.net/deb/stable stable main',
    installScript:
      'sudo curl -fsSLo /usr/share/keyrings/mullvad-keyring.asc https://repository.mullvad.net/deb/mullvad-keyring.asc && echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mullvad-keyring.asc] https://repository.mullvad.net/deb/stable stable main" | sudo tee /etc/apt/sources.list.d/mullvad.list',
  },
  {
    // Plex serves both of its repositories from `repo.plex.tv` since 1.43, and the rpm one is flat:
    // it holds one package for the x86_64 and one for the i686 architecture, and no aarch64 build
    name: 'Plex Media Server for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.plex.tv/rpm/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[PlexTv]
name=Plex.tv
baseurl=https://repo.plex.tv/rpm/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://downloads.plex.tv/plex-keys/PlexSign.v2.key
`,
    installScript: 'curl -LsSf https://repo.plex.tv/scripts/setupRepo.sh | sudo bash',
  },
  {
    // The apt repository of the same server publishes the suite `public` with the component `main`,
    // holding the amd64, the arm64, the armhf and the i386 build of it
    name: 'Plex Media Server for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [signed-by=/etc/apt/keyrings/plexmediaserver.v2.gpg] https://repo.plex.tv/deb/ public main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [signed-by=/etc/apt/keyrings/plexmediaserver.v2.gpg] https://repo.plex.tv/deb/ public main',
    installScript:
      'curl -L https://downloads.plex.tv/plex-keys/PlexSign.v2.key | sudo gpg --yes --dearmor -o /etc/apt/keyrings/plexmediaserver.v2.gpg && echo "deb [signed-by=/etc/apt/keyrings/plexmediaserver.v2.gpg] https://repo.plex.tv/deb/ public main" | sudo tee /etc/apt/sources.list.d/plex.list',
  },
  {
    // Resilio publishes one flat rpm repository per architecture, whose package carries no
    // distribution of its own, and one apt repository whose suite is named after the product and
    // whose `non-free` component holds the amd64 and the arm64 build. opi records the rpm one
    name: 'Resilio Sync for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://linux-packages.resilio.com/resilio-sync/rpm/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[resilio-sync]
name=Resilio Sync
baseurl=https://linux-packages.resilio.com/resilio-sync/rpm/$basearch
enabled=1
gpgcheck=1
gpgkey=https://linux-packages.resilio.com/resilio-sync/key.asc
`,
  },
  {
    name: 'Resilio Sync for Fedora, RHEL and SUSE (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://linux-packages.resilio.com/resilio-sync/rpm/aarch64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['aarch64']),
    configContent: `[resilio-sync]
name=Resilio Sync
baseurl=https://linux-packages.resilio.com/resilio-sync/rpm/$basearch
enabled=1
gpgcheck=1
gpgkey=https://linux-packages.resilio.com/resilio-sync/key.asc
`,
  },
  {
    name: 'Resilio Sync for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl: 'deb https://linux-packages.resilio.com/resilio-sync/deb resilio-sync non-free',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent: 'deb https://linux-packages.resilio.com/resilio-sync/deb resilio-sync non-free',
  },
  {
    // Slack publishes its rpm packages into one `packagecloud` repository, which serves the tree
    // named after Fedora 21 — the OBS-style base tree `packagecloud` generates — for the x86_64
    // architecture alone; the trees of the newer releases and of the Enterprise Linux family answer
    // with an empty index. opi records the same directory
    name: 'Slack for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://packagecloud.io/slacktechnologies/slack/fedora/21/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[slack]
name=slack
baseurl=https://packagecloud.io/slacktechnologies/slack/fedora/21/$basearch
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packagecloud.io/slacktechnologies/slack/gpgkey
`,
    installScript:
      'curl -s https://packagecloud.io/install/repositories/slacktechnologies/slack/script.rpm.sh | sudo bash',
  },
  {
    // The Debian tree of the same repository is named after Debian 8 and still carries the amd64
    // package of the current client; the other architectures answer with an empty index
    name: 'Slack for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl: 'deb https://packagecloud.io/slacktechnologies/slack/debian/ jessie main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64']),
    configContent: 'deb https://packagecloud.io/slacktechnologies/slack/debian/ jessie main',
    installScript:
      'curl -s https://packagecloud.io/install/repositories/slacktechnologies/slack/script.deb.sh | sudo bash',
  },
  {
    // SoftMaker publishes one flat rpm repository, which carries the x86_64 packages of FreeOffice
    // and of the paid office suite alone (its builds are 64-bit x86_64 only), and one apt
    // repository whose `non-free` component of the suite `stable` holds the amd64 ones. The key opi
    // records (`/repo/linux-repo-public.key`) is gone: the vendor installs a key per format now
    name: 'SoftMaker Office for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://shop.softmaker.com/repo/rpm',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[softmaker]
name=SoftMaker Software GmbH
baseurl=https://shop.softmaker.com/repo/rpm
enabled=1
gpgcheck=1
gpgkey=https://shop.softmaker.com/repo/rpm/softmaker-repo.asc
`,
    configUrl: 'https://shop.softmaker.com/repo/softmaker.repo',
    installScript:
      'sudo rpm --import https://shop.softmaker.com/repo/rpm/softmaker-repo.asc && sudo curl -sSL -o /etc/yum.repos.d/softmaker.repo https://shop.softmaker.com/repo/softmaker.repo',
  },
  {
    name: 'SoftMaker Office for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/softmaker.gpg] https://shop.softmaker.com/repo/apt stable non-free',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64']),
    configContent:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/softmaker.gpg] https://shop.softmaker.com/repo/apt stable non-free',
  },
  {
    // Sublime HQ publishes one rpm repository per architecture, whose repository file names the
    // x86_64 directory, and a flat apt repository — the index is the `Packages` file of the
    // `apt/stable` directory, whose suite apt is told as `./` — which carries the amd64, the arm64
    // and the i386 package of the editor. opi records the x86_64 rpm directory
    name: 'Sublime Text for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://download.sublimetext.com/rpm/stable/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[sublime-text]
name=Sublime Text - x86_64 - stable
baseurl=https://download.sublimetext.com/rpm/stable/x86_64
enabled=1
gpgcheck=1
gpgkey=https://download.sublimetext.com/sublimehq-pub.gpg
`,
    configUrl: 'https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo',
    installScript:
      'sudo rpm -v --import https://download.sublimetext.com/sublimehq-rpm-pub.gpg && sudo curl -sSL -o /etc/yum.repos.d/sublime-text.repo https://download.sublimetext.com/rpm/stable/x86_64/sublime-text.repo',
  },
  {
    name: 'Sublime Text for Fedora, RHEL and SUSE (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://download.sublimetext.com/rpm/stable/aarch64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['aarch64']),
    configContent: `[sublime-text]
name=Sublime Text - aarch64 - stable
baseurl=https://download.sublimetext.com/rpm/stable/aarch64
enabled=1
gpgcheck=1
gpgkey=https://download.sublimetext.com/sublimehq-pub.gpg
`,
    configUrl: 'https://download.sublimetext.com/rpm/stable/aarch64/sublime-text.repo',
  },
  {
    name: 'Sublime Text for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/sublimehq-pub.asc] https://download.sublimetext.com/apt/stable/ ./',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/sublimehq-pub.asc] https://download.sublimetext.com/apt/stable/ ./',
    installScript:
      'wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo tee /etc/apt/keyrings/sublimehq-pub.asc > /dev/null && echo "deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/sublimehq-pub.asc] https://download.sublimetext.com/apt/stable/ ./" | sudo tee /etc/apt/sources.list.d/sublime-text.list',
  },
  {
    // TeamViewer publishes one rpm tree per architecture and the x86_64 one only (the aarch64 build
    // of the client is offered as a package on its download page, not in a repository), and its apt
    // repository holds the amd64, the arm64 and the i386 package of it. opi records the x86_64 tree
    name: 'TeamViewer for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://linux.teamviewer.com/yum/stable/main/binary-x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[teamviewer]
name=TeamViewer - $basearch
baseurl=https://linux.teamviewer.com/yum/stable/main/binary-$basearch/
enabled=1
gpgcheck=1
gpgkey=https://linux.teamviewer.com/pubkey/currentkey.asc
`,
  },
  {
    name: 'TeamViewer for Debian and Ubuntu',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [signed-by=/etc/apt/keyrings/teamviewer-keyring.gpg] https://linux.teamviewer.com/deb stable main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64', 'aarch64']),
    configContent:
      'deb [signed-by=/etc/apt/keyrings/teamviewer-keyring.gpg] https://linux.teamviewer.com/deb stable main',
  },
  {
    // Vivaldi publishes one rpm repository per architecture and one apt repository, whose suite is
    // `stable` and whose `main` component holds the amd64 package of both channels (its arm64 index
    // is empty). The repository file the vendor documents exists for the Fedora family and for the
    // SUSE one, which differ in their `autorefresh`, `type` and `keeppackages` lines only, so the
    // one stored here is the Fedora file, the way the Opera row stores its yum one
    name: 'Vivaldi for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.vivaldi.com/archive/rpm/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[vivaldi]
name=vivaldi
enabled=1
baseurl=https://repo.vivaldi.com/archive/rpm/$basearch
gpgcheck=1
gpgkey=https://repo.vivaldi.com/archive/linux_signing_key.pub
`,
    configUrl: 'https://repo.vivaldi.com/archive/vivaldi-fedora.repo',
  },
  {
    name: 'Vivaldi for Fedora, RHEL and SUSE (aarch64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.vivaldi.com/archive/rpm/aarch64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['aarch64']),
    configContent: `[vivaldi]
name=vivaldi
enabled=1
baseurl=https://repo.vivaldi.com/archive/rpm/$basearch
gpgcheck=1
gpgkey=https://repo.vivaldi.com/archive/linux_signing_key.pub
`,
    configUrl: 'https://repo.vivaldi.com/archive/vivaldi-fedora.repo',
  },
  {
    name: 'Vivaldi for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/vivaldi.gpg] https://repo.vivaldi.com/archive/deb/ stable main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64']),
    configContent:
      'deb [arch=amd64 signed-by=/usr/share/keyrings/vivaldi.gpg] https://repo.vivaldi.com/archive/deb/ stable main',
  },
  {
    // Yandex publishes one rpm repository per channel, which carries the x86_64 packages of the
    // browser alone, and one apt repository per channel whose `main` component holds the amd64 and
    // the i386 package. opi records the two rpm directories, one per channel
    name: 'Yandex Browser for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.yandex.ru/yandex-browser/rpm/stable/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[yandex-browser]
name=yandex-browser
baseurl=https://repo.yandex.ru/yandex-browser/rpm/stable/$basearch/
enabled=1
gpgcheck=0
gpgkey=https://repo.yandex.ru/yandex-browser/YANDEX-BROWSER-KEY.GPG
`,
  },
  {
    name: 'Yandex Browser Beta for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.yandex.ru/yandex-browser/rpm/beta/x86_64/',
    syncIntervalDays: 7,
    distros: rpmDistros(['x86_64']),
    configContent: `[yandex-browser-beta]
name=yandex-browser-beta
baseurl=https://repo.yandex.ru/yandex-browser/rpm/beta/$basearch/
enabled=1
gpgcheck=0
gpgkey=https://repo.yandex.ru/yandex-browser/YANDEX-BROWSER-KEY.GPG
`,
  },
  {
    name: 'Yandex Browser for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/yandex-browser.gpg] https://repo.yandex.ru/yandex-browser/deb/ stable main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64']),
    configContent:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/yandex-browser.gpg] https://repo.yandex.ru/yandex-browser/deb/ stable main',
  },
  {
    name: 'Yandex Browser Beta for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/yandex-browser.gpg] https://repo.yandex.ru/yandex-browser/deb/ beta main',
    syncIntervalDays: 7,
    distros: debDistros(['x86_64']),
    configContent:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/yandex-browser.gpg] https://repo.yandex.ru/yandex-browser/deb/ beta main',
  },
  {
    // Yandex Disk is served from two repositories of the same host, which carry the amd64/x86_64
    // package of the client — and the i386 one of an older line — and which were last built in
    // 2022, so both rows are only read when a synchronization is forced
    name: 'Yandex Disk for Fedora, RHEL and SUSE (x86_64)',
    type: 'rpm',
    source: 'vendor',
    baseUrl: 'https://repo.yandex.ru/yandex-disk/rpm/stable/x86_64/',
    syncIntervalDays: null,
    distros: rpmDistros(['x86_64']),
    configContent: `[yandex-disk]
name=yandex-disk
baseurl=https://repo.yandex.ru/yandex-disk/rpm/stable/$basearch/
enabled=1
gpgcheck=0
gpgkey=https://repo.yandex.ru/yandex-disk/YANDEX-DISK-KEY.GPG
`,
  },
  {
    name: 'Yandex Disk for Debian and Ubuntu (amd64)',
    type: 'deb',
    source: 'vendor',
    baseUrl:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/yandex-disk.gpg] https://repo.yandex.ru/yandex-disk/deb/ stable main',
    syncIntervalDays: null,
    distros: debDistros(['x86_64']),
    configContent:
      'deb [arch=amd64 signed-by=/etc/apt/keyrings/yandex-disk.gpg] https://repo.yandex.ru/yandex-disk/deb/ stable main',
  },
]
