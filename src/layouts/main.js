import 'semantic-ui-css/semantic.min.css'
import React from 'react'
import loadScript from 'simple-load-script'
import { Container } from 'semantic-ui-react'

import { scripts } from '../static/external'
import { Header, Footer, Nav, Head } from '../components'
import styles from './main.module.css'

class MainLayout extends React.Component {
    static defaultProps = {
        calcYear: () => new Date().getFullYear(),
        extScripts: scripts,
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
        return (
            <>
                <Head
                    pathname={this.props.location.pathname}
                    title={this.props.title}
                />
                <div className={styles.main}>
                    <Nav />
                    <Header
                        subText={this.props.subHeaderText}
                        imgSrc={this.props.backgroundImgSrc}
                    >
                        {this.props.headerText}
                    </Header>

                    <Container
                        className={styles.mainContainer}
                        text
                        textAlign="justified"
                    >
                        {this.props.children}
                    </Container>

                    <Footer>
                        This website's content are ©{this.props.calcYear()}{' '}
                        Jonathan Poltak Samosir
                    </Footer>
                </div>
            </>
        )
    }
}

export default MainLayout
