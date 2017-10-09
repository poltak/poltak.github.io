import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, Redirect, getRouteProps } from "react-static";
//
import SiteHeader from "components/SiteHeader";
import NavLink from "components/NavLink";
import routes from "./routes";

const App = ({ title, subtitle, rank }) => (
  <div className="page">
    <SiteHeader mainText={title} subText={subtitle}>
      {routes.map(({ path, name }, i) => (
        <NavLink key={i} to={path} isActive={i === rank}>
          {name}
        </NavLink>
      ))}
    </SiteHeader>
    <main>
      <Switch>
        {[
          ...routes.map(({ name, ...props }, i) => (
            <Route key={i} {...props} />
          )),
          <Redirect key={routes.length} to="/" />,
        ]}
      </Switch>
    </main>
    <footer>Copyright me</footer>
  </div>
);

App.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  rank: PropTypes.number.isRequired,
};

export default getRouteProps(App);
