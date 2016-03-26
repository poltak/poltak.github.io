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

  <div class="form-group" id="search-container">
    <ul class="list-group" id="results-container">
      {% for post in site.posts %}
        <a href="{{post.url}}" class="list-group-item">
          <h3 class="list-group-item-heading">
            {{ post.title | escape }}
          </h3>
          <p class="list-group-item-text">
            {{ post.subtitle | escape }}
          </p>
          <p class="list-group-item-text">
            {{ post.date | date_to_string }}
          </p>
        </a>
      {% endfor %}
    </ul>
  </div>
</div>
