import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import { Menu } from 'semantic-ui-react'

import NavItem from './nav-item'

const Nav = props => {
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

    const { pages } = data.site.siteMetadata

    return (
        <Menu stackable fluid widths={pages.length}>
            {pages.map((page, i) => (
                <NavItem key={i} {...props} {...page} />
            ))}
        </Menu>
    )
}

export default Nav
