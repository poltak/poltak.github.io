import React from "react"

const Header = ({ children, ...props }) => (
    <header {...props}>
        <h1>{children}</h1>
    </header>
)

export default Header
