---
title: Blog posts
weight: 4
icon: fa-bullhorn
---

<div class="list-group">
  {% for post in site.posts %}
    <a href="{{ post.url }}" class="list-group-item">
      <h4 class="list-group-item-heading">
        {{ post.date | date_to_string }}: {{ post.title }}
      </h4>
      <p class="list-group-item-text">
        {{ post.excerpt | strip_html | truncatewords:50 }}
      </p>
    </a>
  {% endfor %}
</div>