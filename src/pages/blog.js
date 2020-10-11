import React from 'react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'
import { BlogPostLink, BlogPostList } from '../components/blog-post-link'

const shouldShowPost = post => !!post.node.frontmatter.date

const renderFilteredPostLinks = (
    { allMarkdownRemark: { edges } },
    filterPredicate,
) =>
    edges
        .filter(filterPredicate)
        .map(edge => (
            <BlogPostLink key={edge.node.id} {...edge.node.frontmatter} />
        ))

const BlogPage = props => (
    <MainLayout
        headerText="Blog posts"
        subHeaderText="What do I write about?"
        title="Blog posts"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <BlogPostList>
            {' '}
            {renderFilteredPostLinks(props.data, shouldShowPost)}
        </BlogPostList>
    </MainLayout>
)

export default BlogPage

export const query = graphql`
    query {
        allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
            edges {
                node {
                    id
                    excerpt(pruneLength: 150)
                    frontmatter {
                        date(formatString: "MMMM DD, YYYY")
                        slug
                        title
                    }
                }
            }
        }
        file(relativePath: { eq: "thap.jpg" }) {
            ...HeaderImageFragment
        }
    }
`
