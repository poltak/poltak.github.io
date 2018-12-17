import React from "react"
import { StaticQuery, graphql } from 'gatsby'

import NavItem from './nav-item'

const Nav = ({ pages }) => (
    <StaticQuery
        query={graphql`
            query SiteTitleQuery {
                site {
                    siteMetadata {
                        pages {
                            name
                            link
                        }
                    }
                }
            }
        `}
        render={data => (
            <nav>
                <ul>
                    {data.site.siteMetadata.pages
                        .map(page => <NavItem {...page} />)}
                </ul>
            </nav>
        )}
    />
)

export default Nav
