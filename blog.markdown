---
title: Blog posts
subtitle: What do I write about?
description: What do I write about?
header-img: assets/img/build/blog.jpg
weight: 4
icon: fa-bullhorn
layout: "pages"
---

<!-- VueJS script -->
{% if jekyll.environment == "production" %}
<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.2.6/vue.min.js"></script>
{% else %}
<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.2.6/vue.js"></script>
{% endif %}

{% raw %}
<div id="blog-vue" class="blog-vue">
  <form class="blog-vue__search-form">
    <i class="blog-vue__search-icon fa fa-search"></i>
    <input class="blog-vue__search-input" type="text" placeholder="Search posts..." v-model="searchVal" />
  </form>
  <ul class="blog-vue__list list-group">
    <li class="blog-vue__item list-group-item" v-for="post in filteredPosts">
      <a :href="post.url">
        <h2 class="blog-vue__item-title">{{ post.title }}</h2>
        <h3 class="blog-vue__item-subtitle">{{ post.subtitle }}</h3>
        <p class="blog-vue__item-date">{{ post.date }}</p>
      </a>
    </li>
  </ul>
</div>
{% endraw %}

<script>
  const formatDateString = date => date.toUTCString().substring(5, 16);

  const posts = {{ site.posts | jsonify }}
  const postsData = posts.map(({ title, subtitle, url, date }) => ({
    title, subtitle, url,
    date: formatDateString(new Date(date)),
  }));

  const blogVue = new Vue({
    el: '#blog-vue',
    data: {
      filteredPosts: postsData,
      allPosts: postsData,
      searchVal: '',
    },
  });
</script>
