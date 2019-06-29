const path = require('path')

module.exports = {
    siteMetadata: {
        url: 'https://poltak.github.io',
        email: 'jonathan.samosir@gmail.com',
        name: 'Jonathan Poltak Samosir',
        title: 'poltak.github.io',
        twitter: 'poltak_',
        github: 'poltak',
        linkedIn: 'jsamosir',
        ogImgPath: '/favicon.ico',
        pages: [
            {
                name: 'poltak.github.io',
                href: '/',
                icon: 'home',
                header: true,
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
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: path.join(__dirname, `src`, `img`),
            },
        },
        `gatsby-plugin-sharp`,
        `gatsby-transformer-sharp`,
    ],
}
