import React from 'react'
import propTypes from 'prop-types'
import { navigate } from 'gatsby'
import { Menu, Icon } from 'semantic-ui-react'

class NavItem extends React.PureComponent {
    static propTypes = {
        name: propTypes.string.isRequired,
        href: propTypes.string.isRequired,
        icon: propTypes.string.isRequired,
        location: propTypes.any.isRequired,
        header: propTypes.bool,
    }

    get isActive() {
        return this.props.location.pathname === this.props.href
    }

    handleClick = e => navigate(this.props.href)

    render() {
        return (
            <Menu.Item
                onClick={this.handleClick}
                name={this.props.name}
                header={this.props.header}
                active={this.isActive}
            >
                <Icon name={this.props.icon} /> {this.props.name}
            </Menu.Item>
        )
    }
}

export default NavItem
