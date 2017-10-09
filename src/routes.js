export default [
  {
    path: "/",
    name: "Home",
    exact: true,
    component: require("./containers/Home").default,
  },
  {
    path: "/about",
    name: "About",
    component: require("./containers/About").default,
  },
  {
    path: "/blog",
    name: "Blog",
    component: require("./containers/Blog").default,
  },
];
