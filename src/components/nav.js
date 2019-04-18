import React from 'react'
import { Menu } from 'semantic-ui-react'

import { usePagesData } from './use-pages-data'
import NavItem from './nav-item'

const Nav = props => {
    const pages = usePagesData()

    return (
        <Menu stackable fluid widths={pages.length}>
            {pages.map((page, i) => (
                <NavItem key={i} {...props} {...page} />
            ))}
        </Menu>
    )
}

export default Nav
