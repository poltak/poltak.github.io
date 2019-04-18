import React from 'react'
import { StaticQuery, graphql } from 'gatsby'
import { Menu } from 'semantic-ui-react'

import NavItem from './nav-item'

const Nav = ({ pages }) => (
    <StaticQuery
        query={graphql`
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
        `}
        render={data => {
            const { pages } = data.site.siteMetadata

            return (
                <Menu stackable fluid widths={pages.length}>
                    {pages.map((page, i) => (
                        <NavItem key={i} {...page} />
                    ))}
                </Menu>
            )
        }}
    />
)

export default Nav
