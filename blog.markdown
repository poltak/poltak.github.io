---
title: Blog posts
weight: 4
icon: fa-bullhorn
---

<div class="container">
  <div class="form-group">
    <input class="form-control input-lg" type="text" id="search-input" placeholder="Search blog posts...">
  </div>

  <div class="list-group" id="results-container">
    <!-- This gets dynamically generated. -->
  </div>
</div>

<script src="{{ site.baseurl }}/assets/js/jekyll-search.js"></script>
<script>
  // Generate the blog JSON data using Liquid
  var blogPosts = [
    {% for post in site.posts %}
      {
        "title"     : "{{ post.title | escape }}",
        "category"  : "{{ post.category }}",
        "tags"      : "{{ post.tags | array_to_sentence_string }}",
        "url"       : "{{ site.baseurl }}{{ post.url }}",
        "date"      : "{{ post.date | date_to_string }}"
      } {% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  // Initialise the search script
  SimpleJekyllSearch.init({
    searchInput:          document.getElementById('search-input'),
    resultsContainer:     document.getElementById('results-container'),
    dataSource:           blogPosts,
    searchResultTemplate: '<a href="{url}" class="list-group-item"><h4 class="list-group-item-heading">{title}</h4><p class="list-group-item-text">{date}</p></a>',
    noResultsText:        'no results found',
    fuzzy:                true
  });

  // Basic function that generates all links to blog posts depending on input data
  var generateAllBlogPosts = function(blogData, blogContainerElement) {
    var results = document.getElementById(blogContainerElement);

    blogData.forEach(function(post) {
      var postHTML = '<a href="' + post.url + '" class="list-group-item">';
      postHTML += '<h4 class="list-group-item-heading">' + post.title + '</h4>';
      postHTML += '<p class="list-group-item-text">' + post.date + '</p></a>';
      results.innerHTML += postHTML;
    });
  };

  // Generate the initial blog post list
  generateAllBlogPosts(blogPosts, 'results-container');

</script>