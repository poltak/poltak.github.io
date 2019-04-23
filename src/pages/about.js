import React from 'react'
import { graphql } from 'gatsby'
import { Header } from 'semantic-ui-react'

import MainLayout, { imageSelector } from '../layouts/main'

const AboutPage = props => (
    <MainLayout
        headerText="About me"
        subHeaderText="Who I am; what I do"
        title="About me"
        backgroundImgSrc={imageSelector(props.data)}
        {...props}
    >
        <Header as="h2">Who am I?</Header>
        <p>
            I am an Australian, currently based in Danang, Vietnam. I spend most
            of my time focusing on a few different activities that I enjoy.
            During the week, I work as a software developer and, on the weekend,
            teach English online. I also spend a significant amount of time on
            non-work related activites according to my interests.
        </p>

        <Header as="h3">Language interests</Header>
        <p>
            I have been a student of Vietnamese language since 2015, and of
            Mandarin Chinese since 2013. Language learning has become a real
            passion in my life, and something in which I invest a signficant
            amount of resources, although it's also somewhat of a challenge -
            particularly Vietnamese. Though a challenge in a good way; it is
            something I can clearly observe progression in over time of working
            on it. And that is extremely rewarding.
        </p>

        <p>
            I started studying Mandarin at Monash University in Melbourne,
            before continuing at the
            <a href="https://en.wikipedia.org/wiki/Mandarin_Training_Center">
                Mandarin Training Center
            </a>
            at National Taiwan Normal University (師範大學) in Taipei in 2014. I
            continue to study on my own now, and have also studied Vietnamese by
            myself since I began in 2015. Living in Vietnam means I have ample
            opportunity to practice. Thanks to modern tech, there's so much
            great software aids and the means to easily connect with different
            language speakers which makes self-study of a language completely
            feasible.
        </p>

        <Header as="h3" />
        <p>
            I have recently been working on the WhichTeam App, which I
            co-founded in 2015. WhichTeam provides an online space for football
            fans to discuss and vote on upcoming match results. We are mainly
            targetting the French audience, but have significantly sized groups
            of users in African countries, South East Asian countries, and other
            European countries. More recently, I have been planning a new
            venture, testmate, which is an educational technology aimed at the
            Vietnamese audience.
        </p>

        <p>
            Apart from sitting in front of my laptop, I spend a lot of the time
            exploring the beautiful central Vietnamese countryside on my
            motorbike. If you’re ever in the area, feel free to contact me. I
            also spend a lot of time reading (mainly fiction) and studying
            (mainly languages).
        </p>
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
