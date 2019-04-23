import React from 'react'
import { graphql } from 'gatsby'

import MainLayout, { imageSelector } from '../layouts/main'
import { ContactCard } from '../components/contact-card-container'

const ContactPage = props => (
    <MainLayout
        headerText="Contact"
        subHeaderText="Where can you find me?"
        title="Contact"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <p>
            My preferred means of contact is via email, although you can also
            contact me through online social networks that I'm on.
        </p>
        <ContactCard centered />
    </MainLayout>
)

export default ContactPage

export const query = graphql`
    query {
        file(relativePath: { eq: "tra.jpg" }) {
            ...HeaderImageFragment
        }
    }
`
