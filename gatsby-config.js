module.exports = {
    siteMetadata: {
        title: 'poltak.github.io',
        pages: [
            {
                name: 'poltak.github.io',
                link: '/',
            },
            {
                name: 'About Me',
                link: '/about',
            },
            {
                name: 'Curriculum Vitae',
                link: '/cv',
            },
            {
                name: 'Blog Posts',
                link: '/blog',
            },
            {
                name: 'Contact',
                link: '/contact',
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
