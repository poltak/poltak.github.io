import React from 'react'
import { StaticQuery, graphql } from 'gatsby'

import NavItem from './nav-item'
import styles from './nav.module.css'

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
                <ul className={styles.pageLinks}>
                    {data.site.siteMetadata.pages.map(page => (
                        <NavItem {...page} />
                    ))}
                </ul>
            </nav>
        )}
    />
)

export default Nav
