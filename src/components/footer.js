import React from 'react'

const Footer = ({ children, ...props }) => (
    <footer {...props}>
        <p>{children}</p>
    </footer>
)

export default Footer
