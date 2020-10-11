---
slug: '/blog/test'
date: '2020-10-10'
title: 'My first blog post'
---

# Hello world

Hello world

## Create static pages using Gatsby’s Node.js `createPage` API

Gatsby exposes a powerful Node.js API, which allows for functionality such as creating dynamic pages. This API is available in the gatsby-node.js file in the root directory of your project, at the same level as gatsby-config.js. Each export found in this file will be run by Gatsby, as detailed in its Node API specification. However, you should only care about one particular API in this instance, createPages.

Use the graphql to query Markdown file data as **below**. Next, use the createPage action creator to create a page for each of the [Markdown files](https://memex.social/a/fr78yvIS2y1wVWzdwXEx) using the blogTemplate.js you created in the previous step.
https://memex.social/a/fr78yvIS2y1wVWzdwXEx

NOTE: Gatsby calls the createPages API _(if present)_ at build time with injected parameters, actions and graphql.

1. one
2. two
3. three

Between text

-   one
-   two
-   three
