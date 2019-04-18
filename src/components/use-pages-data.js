import { useStaticQuery, graphql } from 'gatsby'

export const usePagesData = () => {
    const data = useStaticQuery(graphql`
        query SiteTitleQuery {
            site {
                siteMetadata {
                    pages {
                        name
                        href
                        icon
                        header
                    }
                }
            }
        }
    `)

    return data.site.siteMetadata.pages
}
