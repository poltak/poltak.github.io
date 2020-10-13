import 'semantic-ui-css/semantic.min.css'
import React from 'react'
import propTypes from 'prop-types'
import loadScript from 'simple-load-script'
import { Container } from 'semantic-ui-react'

import { scripts } from '../static/external'
import { Header, Footer, Nav, Head } from '../components'
import styles from './main.module.css'
import { graphql } from 'gatsby'

class MainLayout extends React.Component {
    static propTypes = {
        backgroundImgSrc: propTypes.object.isRequired,
        title: propTypes.string.isRequired,
        headerText: propTypes.string.isRequired,
        subHeaderText: propTypes.string.isRequired,
        location: propTypes.object,
        calcYear: propTypes.func,
        extScripts: propTypes.arrayOf(propTypes.string),
    }

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
                    <div className={styles.container}>
                        <Nav {...this.props} />
                        <Header
                            subText={this.props.subHeaderText}
                            imgSrc={this.props.backgroundImgSrc}
                        >
                            {this.props.headerText}
                        </Header>

                        <Container
                            className={styles.contentContainer}
                            text
                            textAlign="justified"
                        >
                            {this.props.children}
                        </Container>
                    </div>

                    <Footer>I hope you enjoyed my website!</Footer>
                </div>
            </>
        )
    }
}

export default MainLayout

export const headerImageFragment = graphql`
    fragment HeaderImageFragment on File {
        childImageSharp {
            fixed(width: 900, height: 500) {
                ...GatsbyImageSharpFixed
            }
        }
    }
`

export const imageSelector = data => data.file.childImageSharp.fixed
