import React from 'react'
import { Helmet } from 'react-helmet'
import { graphql, StaticQuery } from 'gatsby'

const Head = ({ pathname, title }) => (
    <StaticQuery
        query={graphql`
            query SiteMetadata {
                site {
                    siteMetadata {
                        url
                        twitter
                        ogImgPath
                    }
                }
            }
        `}
        render={({
            site: {
                siteMetadata: { url, twitter, ogImgPath },
            },
        }) => (
            <Helmet defaultTitle={title} titleTemplate={`%s | ${title}`}>
                <html lang="en" />
                <link rel="canonical" href={`${url}${pathname}`} />
                <meta name="docsearch:version" content="2.0" />
                <meta
                    name="viewport"
                    content="width=device-width,initial-scale=1,shrink-to-fit=no,viewport-fit=cover"
                />

                <meta property="og:url" content={url} />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="en" />
                <meta property="og:site_name" content={title} />
                <meta property="og:image" content={`${url}${ogImgPath}`} />
                <meta property="og:image:width" content="512" />
                <meta property="og:image:height" content="512" />

                <meta name="twitter:card" content="summary" />
                <meta name="twitter:site" content={twitter} />
            </Helmet>
        )}
    />
)

export default Head
