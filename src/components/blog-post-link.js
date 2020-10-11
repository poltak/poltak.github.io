import React from 'react'
import { navigate } from 'gatsby'
import { Header, List } from 'semantic-ui-react'

import styles from './blog-post-link.module.css'

export const BlogPostLink = ({ title, date, slug }) => (
    <List.Item className={styles.item} onClick={() => navigate(slug)}>
        <Header as="h2" className={styles.title}>
            {title}
        </Header>
        <span className={styles.date}>{date}</span>
    </List.Item>
)

export const BlogPostList = ({ children }) => (
    <List className={styles.container}>{children}</List>
)
