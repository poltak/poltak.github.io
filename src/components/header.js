import React from 'react'
import Img from 'gatsby-image'
import { Header } from 'semantic-ui-react'

import styles from './header.module.css'

export default ({ children, subText, imgSrc, ...props }) => (
    <header className={styles.container} {...props}>
        <Img className={styles.img} fixed={imgSrc} />
        <Header as="h1" className={styles.headerText}>
            {children}
        </Header>
        {subText && (
            <>
                <Header as="h2" className={styles.subText}>
                    {subText}
                </Header>
            </>
        )}
    </header>
)
