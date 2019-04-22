import React from 'react'

import { MainLayout } from '../layouts'
import img from '../img/canhdong.jpg'
import { ContactCard } from '../components/contact-card-container'

const CVPage = props => (
    <MainLayout
        headerText="Curriculum vitae"
        subHeaderText="Want more detail?"
        title="Curriculum vitae"
        backgroundImgSrc={img}
        {...props}
    >
        <ContactCard centered />
        <p>
            From Richard Hamming’s classic and must-read talk, “
            <a href="http://www.cs.virginia.edu/~robins/YouAndYourResearch.html">
                You and Your Research
            </a>
            ”.
        </p>
        <blockquote>
            <p>
                There is indeed an element of luck, and no, there isn’t. The
                prepared mind sooner or later finds something important and does
                it. So yes, it is luck.{' '}
                <em>
                    The particular thing you do is luck, but that you do
                    something is not.
                </em>
            </p>
        </blockquote>
    </MainLayout>
)

export default CVPage
