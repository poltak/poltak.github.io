---
title: Blog posts
---

## What is this page?

This will be the main index for my blog posts, when I finally sort out how I am going to do it...

## Actual index

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      {{ post.excerpt }}
    </li>
  {% endfor %}
</ul>