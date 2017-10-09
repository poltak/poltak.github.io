import React from "react";
import PropTypes from "prop-types";

const SiteHeader = ({ mainText, subText, children }) => (
  <header>
    <nav>{children}</nav>
    <h1>{mainText}</h1>
    <hr />
    <h2>{subText}</h2>
  </header>
);

SiteHeader.propTypes = {
  mainText: PropTypes.string.isRequired,
  subText: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export default SiteHeader;
