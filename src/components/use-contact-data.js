import { useStaticQuery, graphql } from 'gatsby'

export const useContactData = () => {
    const data = useStaticQuery(graphql`
        query SiteContactQuery {
            site {
                siteMetadata {
                    linkedIn
                    twitter
                    github
                    email
                    name
                }
            }
        }
    `)

    return data.site.siteMetadata
}
