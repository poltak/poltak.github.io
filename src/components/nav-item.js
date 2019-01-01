import React from 'react'
import { Link } from 'gatsby'

const NavItem = ({ name, link }) => (
    <li>
        <Link to={link}>{name}</Link>
    </li>
)

export default NavItem
