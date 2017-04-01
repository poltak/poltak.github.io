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
  <p class="blog-vue__empty" v-if="noPostsFound">Couldn't find any matching posts...</p>
</div>
{% endraw %}

<script>
  /*
   * Debounce function taken from @griffinmichl:
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
    // Main filter function containing the post filtering code
    const filterFn = post => strMatchesSearch(post.title) ||
      strMatchesSearch(post.subtitle) || strMatchesSearch(post.tags) ||
      strMatchesSearch(post.category);

    this.filteredPosts = this.allPosts.filter(filterFn);
    // Set empty state if no posts found
    this.noPostsFound = this.filteredPosts.length === 0;
  }

  // Grab blog posts data from jekyll then format for display (jekyll pre-renders this data)
  const posts = [
    {% for post in site.posts %}
      {
        "title"     : "{{ post.title | escape }}",
        "subtitle"  : "{{ post.subtitle | escape }}",
        "category"  : "{{ post.category }}",
        "tags"      : "{{ post.tags | array_to_sentence_string }}",
        "url"       : "{{ site.baseurl }}{{ post.url }}",
        "date"      : "{{ post.date | date_to_string }}"
      } {% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  // Vue instance
  const blogSearchVue = new Vue({
    el: '#blog-search-vue',
    data: {
      filteredPosts: posts,
      allPosts: posts,
      searchVal: '',
      noPostsFound: false,
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
