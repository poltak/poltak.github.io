import React from 'react'

import { Header, Footer, Nav } from '../components'
import styles from './main.module.css'

const MainLayout = ({
    headerText,
    subHeaderText,
    backgroundImgSrc,
    children,
    calcYear = () => new Date().getFullYear(),
}) => (
    <div className={styles.main}>
        <Nav />
        <Header subText={subHeaderText} imgSrc={backgroundImgSrc}>
            {headerText}
        </Header>

        {children}

        <Footer>
            This website's content are ©{calcYear()} Jonathan Poltak Samosir
        </Footer>
    </div>
)

export default MainLayout
