import React from 'react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'
import styles from './blog-post.module.css'

export default function BlogPostTemplate({
    data: {
        markdownRemark: { frontmatter, html },
        ...data
    },
    ...props
}) {
    return (
        <MainLayout
            title={frontmatter.title}
            headerText={frontmatter.title}
            backgroundImgSrc={imageSelector(data)}
            {...props}
        >
            <div className={styles.container}>
                <div className={styles.post}>
                    <h2 className={styles.date}>{frontmatter.date}</h2>
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>
            </div>
        </MainLayout>
    )
}

export const pageQuery = graphql`
    query($slug: String!) {
        file(relativePath: { eq: "thap.jpg" }) {
            ...HeaderImageFragment
        }
        markdownRemark(frontmatter: { slug: { eq: $slug } }) {
            html
            frontmatter {
                date(formatString: "MMMM DD, YYYY")
                slug
                title
            }
        }
    }
`
