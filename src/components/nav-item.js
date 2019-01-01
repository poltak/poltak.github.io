import React from 'react'
import { Link } from 'gatsby'

import FAIcon from './fa-icon'

const NavItem = ({ name, link, icon }) => (
    <li>
        <Link to={link}>
            <FAIcon name={icon} /> {name}
        </Link>
    </li>
)

export default NavItem
