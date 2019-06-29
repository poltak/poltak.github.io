import React from 'react'
import { Header } from 'semantic-ui-react'

import styles from './coming-soon.module.css'

export const ComingSoon = ({
    Component = Header,
    children = 'Coming soon...',
}) => <Component className={styles.mainText}>{children}</Component>
