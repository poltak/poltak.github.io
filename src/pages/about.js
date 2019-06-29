import React from 'react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'
import { ComingSoon } from '../components/coming-soon'

const AboutPage = props => (
    <MainLayout
        headerText="About me"
        subHeaderText="Who I am; what I do"
        title="About me"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <ComingSoon />
    </MainLayout>
)

export default AboutPage

export const query = graphql`
    query {
        file(relativePath: { eq: "cachep.jpg" }) {
            ...HeaderImageFragment
        }
    }
`
