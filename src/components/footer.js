import React from 'react'
import { Container, Divider } from 'semantic-ui-react'

import styles from './footer.module.css'

const Footer = ({ children, ...props }) => (
    <footer className={styles.footer} {...props}>
        <Divider />
        <Container text textAlign="right">
            <p>{children}</p>
        </Container>
    </footer>
)

export default Footer
