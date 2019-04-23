import React from 'react'
import { Header, List, Button, Icon } from 'semantic-ui-react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'

const IndexPage = props => (
    <MainLayout
        headerText="poltak.github.io"
        subHeaderText="A site about me"
        title="poltak.github.io"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <Header as="h2">What is this site?</Header>
        <p>This site is an online space for myself to:</p>
        <List bulleted>
            <List.Item>
                occasionally write about things I find interesting
            </List.Item>
            <List.Item>keep an online version of my resume updated</List.Item>
            <List.Item>
                talk a little bit about myself (for those who are interested)
            </List.Item>
            <List.Item>
                play around with static site technologies, when I have spare
                time
            </List.Item>
        </List>
        <Header as="h2">Technologies used</Header>
        <p>
            This site was created with the assistance of the following
            technologies:
        </p>
        <List bulleted>
            <List.Item>
                <a href="https://pages.github.com">GitHub Pages</a> - free
                hosting and version control
            </List.Item>
            <List.Item>
                <a href="https://www.gatsbyjs.org/">GatsbyJS</a> - allows me to
                write my site in React and handles the static site build process
            </List.Item>
            <List.Item>
                <a href="https://react.semantic-ui.com/">Semantic UI React</a> -
                very nice UI framework with React integration
            </List.Item>
        </List>
        <Header as="h2">Open source</Header>
        <p>
            The source code for this site can be found in my site’s{' '}
            <a href="https://github.com/poltak/poltak.github.io">GitHub repo</a>
            .
        </p>
        <p>
            Feel free to criticize my code, send PRs, etc. I'm still learning
            everyday, and always open to suggestions.
        </p>

        <Button
            icon
            color="blue"
            labelPosition="left"
            href="https://github.com/poltak/poltak.github.io/issues/new"
            target="_blank"
        >
            <Icon name="discussions" /> Leave me feedback
        </Button>
    </MainLayout>
)

export default IndexPage

export const query = graphql`
    query {
        file(relativePath: { eq: "bien.jpg" }) {
            ...HeaderImageFragment
        }
    }
`
