---
title: Blog posts
subtitle: What do I write about?
description: What do I write about?
header-img: assets/img/build/blog.jpg
weight: 4
icon: fa-bullhorn
layout: "blog"
---

<!-- VueJS script -->
{% if jekyll.environment == "production" %}
<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.2.6/vue.min.js"></script>
{% else %}
<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.2.6/vue.js"></script>
{% endif %}


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
