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

<script>
  // Get the blog post JSON data from the Liquid generated JSON file
  var blogPosts = (function() {
      var json = null;
      $.ajax({
        "async": false,
        "global": false,
        "url": "/blogposts.json",
        "dataType": "json",
        "success": function(data) {
          json = data;
        }
      });
      return json;
    })();

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

  // Generate the initial blog post list once the document is ready
  $( document ).ready(function() {
    generateAllBlogPosts(blogPosts, 'results-container');
  });

</script>