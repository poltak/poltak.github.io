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
<div id="blog-search-vue" class="blog-vue">
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
  // Grabs just `DD Mmm YYYY` from UTC string, after parsing jekyll date string
  const formatDateString = dateStr => new Date(dateStr.slice(0, 10)).toUTCString().slice(5, 16);
  /*
   * Taken from @griffinmichl:
   * https://medium.com/@griffinmichl/implementing-debounce-in-javascript-eab51a12311e
   */
  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };

  // The search filtering function (no validation; great code!)
  function handleSearchChange() {
    // Helper functions to handle matching against search term
    const strMatchesSearch = str => str.toLowerCase().includes(this.searchVal.toLowerCase());
    const arrMatchesSearch = arr => arr.map(strMatchesSearch).reduce((a, b) => a && b);
    // Main filter function containing the post filtering code
    const filterFn = post => strMatchesSearch(post.title) ||
      strMatchesSearch(post.subtitle) || arrMatchesSearch(post.tags) ||
      strMatchesSearch(post.category);

    this.filteredPosts = this.allPosts.filter(filterFn);
  }

  // Grab blog posts data from jekyll then format for display
  const posts = {{ site.posts | jsonify }}
  const postsData = posts.map(post => ({
    title: post.title, subtitle: post.subtitle, url: post.url,
    category: post.category, tags: post.tags,
    date: formatDateString(post.date),
  }));

  // Vue instance
  const blogSearchVue = new Vue({
    el: '#blog-search-vue',
    data: {
      filteredPosts: postsData,
      allPosts: postsData,
      searchVal: '',
    },
    methods: {
      handleSearchChange: debounce(handleSearchChange, 100),
    },
    watch: {
      searchVal() {
        this.handleSearchChange(); // Call search handler method wheneve search state changes
      },
    },
  });
</script>
