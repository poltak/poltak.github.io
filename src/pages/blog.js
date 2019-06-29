import React from 'react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'
import { ComingSoon } from '../components/coming-soon'

const BlogPage = props => (
    <MainLayout
        headerText="Blog posts"
        subHeaderText="What do I write about?"
        title="Blog posts"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <ComingSoon />
    </MainLayout>
)

export default BlogPage

export const query = graphql`
    query {
        file(relativePath: { eq: "thap.jpg" }) {
            ...HeaderImageFragment
        }
    }
`
