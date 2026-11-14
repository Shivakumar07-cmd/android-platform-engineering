// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Android Platform Engineering',
  tagline: 'Deep dives into Android Frameworks, System Architecture, Kernel, HAL and Device Bring-up',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://shivakumar07-cmd.github.io',
  baseUrl: '/android-platform-engineering/',
  trailingSlash: false,

  organizationName: 'Shivakumar07-cmd',
  projectName: 'android-platform-engineering',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/Shivakumar07-cmd/android-platform-engineering/edit/main/',
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          postsPerPage: 'ALL',
          blogSidebarCount: 'ALL',
          // Posts with `pinned: true` in front matter come first.
          processBlogPosts: async ({blogPosts}) => {
            const pinned = blogPosts.filter((p) => p.metadata.frontMatter.pinned);
            const rest = blogPosts.filter((p) => !p.metadata.frontMatter.pinned);
            return [...pinned, ...rest];
          },
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
            'https://github.com/Shivakumar07-cmd/android-platform-engineering/edit/main/',
          onInlineTags: 'ignore',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Android Platform Engineering',
        logo: {
          alt: 'Android Platform Engineering logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {to: '/about', label: 'About', position: 'left'},
          {
            href: 'https://www.linkedin.com/in/siva-kumar-s-d-a13952182',
            label: 'LinkedIn',
            position: 'right',
          },
          {
            href: 'https://github.com/Shivakumar07-cmd',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Content',
            items: [
              {label: 'Docs', to: '/docs/intro'},
              {label: 'Blog', to: '/blog'},
              {label: 'About', to: '/about'},
            ],
          },
          {
            title: 'Connect',
            items: [
              {label: 'GitHub', href: 'https://github.com/Shivakumar07-cmd'},
              {label: 'LinkedIn', href: 'https://www.linkedin.com/in/siva-kumar-s-d-a13952182'},
              {
                label: 'Site source',
                href: 'https://github.com/Shivakumar07-cmd/android-platform-engineering',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Shivakumar. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['java', 'kotlin', 'bash', 'diff', 'c', 'cpp', 'makefile'],
      },
    }),
};

export default config;
