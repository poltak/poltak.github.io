import React from 'react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'
import { ComingSoon } from '../components/coming-soon'

const CVPage = props => (
    <MainLayout
        headerText="Curriculum vitae"
        subHeaderText="Want more detail?"
        title="Curriculum vitae"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <ComingSoon />
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
