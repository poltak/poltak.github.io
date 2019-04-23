import React from 'react'
import { graphql } from 'gatsby'
import { Header, List } from 'semantic-ui-react'

import MainLayout, { imageSelector } from '../layouts/main'
import { ContactCard } from '../components/contact-card-container'

const CVPage = props => (
    <MainLayout
        headerText="Curriculum vitae"
        subHeaderText="Want more detail?"
        title="Curriculum vitae"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <ContactCard centered />

        <Header as="h1">Technologies Experience</Header>
        <Header as="h2">Frameworks/Platforms:</Header>
        <List horizontal relaxed>
            <List.Item>WebExtensions API</List.Item>
            <List.Item>IndexedDB</List.Item>
            <List.Item>Chrome</List.Item>
            <List.Item>Firefox</List.Item>
        </List>

        <Header as="h1">Work Experience</Header>
        <List bulleted>
            <List.Item>
                <a href="https://www.prezly.com/">Prezly</a> : frontend
                developer (July 2016 - October 2016)
            </List.Item>
            <List.List>
                <List.Item>
                    Full-time remote work with Belgian story management startup,
                    Prezly
                </List.Item>
                <List.Item>
                    Worked solely on frontend in a small team of programmers
                </List.Item>
                <List.Item>
                    Left after a few great months to follow decision to focus on
                    own ventures
                </List.Item>
                <List.Item>
                    Technologies worked with: React Redux Webpack Draft.js Sass
                </List.Item>
            </List.List>
            <List.Item>
                <a href="http://youngpilots.vn/">YoungPilots.vn</a> : lead
                full-stack developer (June 2015 - June 2016)
            </List.Item>
            <List.List>
                <List.Item>
                    Web development shop based out of Hanoi, Vietnam
                </List.Item>
                <List.Item>
                    Technologies worked with: GraphQL + Apollo React Postgres
                    TypeScript Node Express Sequelize
                </List.Item>
            </List.List>
        </List>

        <Header as="h1">Personal Project Involvement</Header>
        <List bulleted>
            <List.Item>
                <a href="https://www.brightsparqe.org/">Bright Sparqe</a> :
                Website for the Bright Sparqe charity based in Melbourne,
                Australia.
            </List.Item>
        </List>
    </MainLayout>
)

export default CVPage

export const query = graphql`
    query {
        file(relativePath: { eq: "canhdong.jpg" }) {
            ...HeaderImageFragment
        }
    }
`
