import React from "react"

import Separator from './separator'
import styles from './header.module.css'

const Header = ({ children, subText, imgSrc, ...props }) => (
    <header
      className={styles.container}
      style={{ backgroundImage: imgSrc }}
      {...props}
    >
        <h1 className={styles.headerText}>
            {children}
        </h1>
        {subText && (
            <React.Fragment>
                <Separator className={styles.separator} />
                <h2 className={styles.subText}>
                    {subText}
                </h2>
            </React.Fragment>
        )}
    </header>
)

export default Header
