import React from "react"

import { Header, Footer, Nav } from '../components'
import styles from './main.module.css'

const MainLayout = ({ headerText, children }) => (
  <div className={styles.main}>
      <Header>
        {headerText}
        <Nav />
      </Header>

      {children}

      <Footer>
        This website's content are © 2019 Jonathan Poltak Samosir
      </Footer>
  </div>
)

export default MainLayout
