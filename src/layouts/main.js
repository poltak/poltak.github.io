import React from 'react'
import loadScript from 'simple-load-script'

import { Header, Footer, Nav } from '../components'
import styles from './main.module.css'

class MainLayout extends React.Component {
    static defaultProps = {
        extScripts: [
            'https://use.fontawesome.com/releases/v5.6.3/js/solid.js',
            'https://use.fontawesome.com/releases/v5.6.3/js/fontawesome.js',
        ],
    }

    state = {
        scriptsLoaded: false,
        scriptsError: null,
    }

    async componentDidMount() {
        const scriptLoadPs = this.props.extScripts.map(src =>
            loadScript(src, { inBody: true }),
        )

        try {
            await Promise.all(scriptLoadPs)
            this.setState(state => ({ scriptsLoaded: true }))
        } catch (err) {
            this.setState(state => ({ scriptsLoaded: true, scriptsError: err }))
        }
    }

    render() {
        const {
            headerText,
            subHeaderText,
            backgroundImgSrc,
            children,
            calcYear = () => new Date().getFullYear(),
        } = this.props

        return (
            <div className={styles.main}>
                <Nav />
                <Header subText={subHeaderText} imgSrc={backgroundImgSrc}>
                    {headerText}
                </Header>

                {children}

                <Footer>
                    This website's content are ©{calcYear()} Jonathan Poltak
                    Samosir
                </Footer>
            </div>
        )
    }
}

export default MainLayout
