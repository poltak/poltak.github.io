module.exports = {
    siteMetadata: {
        url: 'https://poltak.github.io',
        title: 'poltak.github.io',
        twitter: 'poltak_',
        ogImgPath: '/favicon.ico',
        pages: [
            {
                name: 'poltak.github.io',
                href: '/',
                icon: 'home',
                header: true,
            },
            {
                name: 'About Me',
                href: '/about',
                icon: 'info circle',
            },
            {
                name: 'Curriculum Vitae',
                href: '/cv',
                icon: 'book',
            },
            {
                name: 'Blog Posts',
                href: '/blog',
                icon: 'bullhorn',
            },
            {
                name: 'Contact',
                href: '/contact',
                icon: 'phone',
            },
        ],
    },
    plugins: [
        'gatsby-plugin-react-helmet',
        {
            resolve: `gatsby-plugin-typography`,
            options: {
                pathToConfigModule: `src/utils/typography.js`,
            },
        },
    ],
}
