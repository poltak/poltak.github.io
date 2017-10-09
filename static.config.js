import React, { Component } from "react";

export default {
  getRoutes: () => [
    {
      path: "/",
      getProps: () => ({
        title: "poltak.github.io",
        subtitle: "A site about me",
        rank: 0,
      }),
    },
    {
      path: "/about",
      getProps: () => ({
        title: "About me",
        subtitle: "Who I am; what I do",
        rank: 1,
      }),
    },
    {
      path: "/blog",
      getProps: () => ({
        title: "Blog posts",
        subtitle: "What do I write about?",
        rank: 2,
      }),
    },
  ],
  Html: class CustomHtml extends Component {
    render() {
      const { Html, Head, Body, children } = this.props;
      return (
        <Html lang="en-US">
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <link rel="stylesheet" href="/app.css" />
          </Head>
          <Body>{children}</Body>
        </Html>
      );
    }
  },
};
