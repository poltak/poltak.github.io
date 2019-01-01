module.exports = {
    siteMetadata: {
        title: 'poltak.github.io',
        pages: [
            {
                name: 'poltak.github.io',
                link: '/',
                icon: 'home',
            },
            {
                name: 'About Me',
                link: '/about',
                icon: 'info-circle',
            },
            {
                name: 'Curriculum Vitae',
                link: '/cv',
                icon: 'book',
            },
            {
                name: 'Blog Posts',
                link: '/blog',
                icon: 'bullhorn',
            },
            {
                name: 'Contact',
                link: '/contact',
                icon: 'phone',
            },
        ],
    },
    plugins: [
        {
            resolve: `gatsby-plugin-typography`,
            options: {
                pathToConfigModule: `src/utils/typography.js`,
            },
        },
    ],
}
