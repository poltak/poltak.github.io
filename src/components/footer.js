import React from 'react'
import { Container } from 'semantic-ui-react'

import styles from './footer.module.css'

const Footer = ({ children, ...props }) => (
    <footer className={styles.footer} {...props}>
        <Container text>
            <p>{children}</p>
        </Container>
    </footer>
)

export default Footer
