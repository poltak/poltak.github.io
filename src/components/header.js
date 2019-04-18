import React from 'react'
import { Header, Divider } from 'semantic-ui-react'

import styles from './header.module.css'

const HeaderComp = ({ children, subText, imgSrc, ...props }) => (
    <header
        className={styles.container}
        style={{ backgroundImage: imgSrc }}
        {...props}
    >
        <Header as="h1" className={styles.headerText}>
            {children}
        </Header>
        {subText && (
            <>
                <Divider className={styles.divider} />
                <Header as="h2" className={styles.subText}>
                    {subText}
                </Header>
            </>
        )}
    </header>
)

export { HeaderComp as Header }
