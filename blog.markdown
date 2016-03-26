---
title: Blog posts
weight: 4
subtitle: What do I write about?
icon: fa-bullhorn
---

<div class="container">
  <div class="form-group" id="search-container">
    <input class="form-control input-lg" type="text" id="search-input" placeholder="Search blog posts...">
  </div>

  <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
    {% for post in site.posts %}
      <div class="post-preview">
        <a href="{{post.url}}">
          <h2 class="post-title">
            {{ post.title | escape }}
          </h2>
          <h3 class="post-subtitle">
            {{ post.subtitle | escape }}
          </h3>
        </a>
        <p class="post-meta">
          {{ post.date | date_to_string }}
        </p>
      </div>
      <hr />
    {% endfor %}
  </div>
</div>
