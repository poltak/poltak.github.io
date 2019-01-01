import React from "react"
import cx from 'classnames'

import styles from './separator.module.css'

const Separator = ({ className = '' }) => (
    <hr className={cx([styles.separator, className])} />
)

export default Separator
