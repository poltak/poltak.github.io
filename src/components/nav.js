import React from 'react'
import { Menu } from 'semantic-ui-react'

import { usePagesData } from './use-pages-data'
import NavItem from './nav-item'
import styles from './nav.module.css'

const Nav = props => {
    const pages = usePagesData()

    return (
        <Menu
            pointing
            secondary
            stackable
            fluid
            widths={pages.length}
            className={styles.nav}
        >
            {pages.map((page, i) => (
                <NavItem key={i} {...props} {...page} />
            ))}
        </Menu>
    )
}

export default Nav
