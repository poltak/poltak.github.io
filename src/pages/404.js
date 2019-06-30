import React from 'react'
import { Header } from 'semantic-ui-react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'

const BlogPage = props => (
    <MainLayout backgroundImgSrc={imageSelector(props.data)} {...props}>
        <Header as="h2" textAlign="center">
            Page <code>{props.location.pathname}</code> not found...
        </Header>
    </MainLayout>
)

export default BlogPage

export const query = graphql`
    query {
        file(relativePath: { eq: "cachep.jpg" }) {
            ...HeaderImageFragment
        }
    }
`
