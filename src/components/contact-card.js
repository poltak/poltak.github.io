import React from 'react'
import cx from 'classnames'
import propTypes from 'prop-types'
import { Image, Icon } from 'semantic-ui-react'

import styles from './contact-card.module.css'

export const ContactCardInfoRow = props => (
    <div className={styles.infoRow}>
        <div className={styles.infoRowTitle}>
            <Icon name={props.icon} />
            {props.title}
        </div>
        <a className={styles.infoRowValue} href={props.href}>
            {props.value}
        </a>
    </div>
)

ContactCardInfoRow.propTypes = {
    icon: propTypes.string.isRequired,
    title: propTypes.string.isRequired,
    value: propTypes.string.isRequired,
    href: propTypes.string.isRequired,
}

export class ContactCard extends React.PureComponent {
    static propTypes = {
        className: propTypes.string,
        name: propTypes.string.isRequired,
        email: propTypes.string.isRequired,
        linkedIn: propTypes.string.isRequired,
        github: propTypes.string.isRequired,
        twitter: propTypes.string.isRequired,
        centered: propTypes.bool,
    }

    get avatarHref() {
        return `https://avatars.githubusercontent.com/${this.props.github}`
    }

    get linkedInHref() {
        return `http://www.linkedin.com/in/${this.props.linkedIn}`
    }
    get githubHref() {
        return `https://github.com/${this.props.github}`
    }

    get twitterHref() {
        return `https://www.twitter.com/${this.props.twitter}`
    }

    get emailHref() {
        return `mailto:${this.props.email}`
    }

    render() {
        return (
            <div
                className={cx(styles.container, this.props.className, {
                    [styles.containerCentered]: this.props.centered,
                })}
            >
                <Image className={styles.avatarImg} src={this.avatarHref} />
                <div className={styles.infoContainer}>
                    <h1 className={styles.name}>{this.props.name}</h1>
                    <ContactCardInfoRow
                        icon="mail outline"
                        title="Email"
                        value={this.props.email}
                        href={this.emailHref}
                    />
                    <ContactCardInfoRow
                        icon="linkedin"
                        title="LinkedIn"
                        value={this.props.linkedIn}
                        href={this.linkedInHref}
                    />
                    <ContactCardInfoRow
                        icon="github"
                        title="GitHub"
                        value={this.props.github}
                        href={this.githubHref}
                    />
                    <ContactCardInfoRow
                        icon="twitter"
                        title="Twitter"
                        value={this.props.twitter}
                        href={this.twitterHref}
                    />
                </div>
            </div>
        )
    }
}
