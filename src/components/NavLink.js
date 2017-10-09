import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { Link } from "react-static";

const NavLink = ({ isActive = false, children, ...props }) => (
  <div className={cx("nav-link", { "is-active": isActive })}>
    <Link {...props}>{children}</Link>
  </div>
);

NavLink.propTypes = {
  isActive: PropTypes.bool,
  children: PropTypes.string.isRequired,
};

export default NavLink;
