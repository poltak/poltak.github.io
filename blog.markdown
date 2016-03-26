---
title: Blog posts
weight: 4
subtitle: What do I write about?
icon: fa-bullhorn
---

<div class="container">
  <div class="form-group" id="search-container">
    <input class="form-control input-lg" type="text" id="search-input" placeholder="Search blog posts...">

    <ul class="list-group" id="results-container">
      <!-- This gets dynamically generated. -->
    </ul>
  </div>
</div>

<script src="{{ site.baseurl }}/assets/js/jekyll-search.js" type="text/javascript"></script>
<script type="text/javascript">
  var template = '<a href="{url}" class="list-group-item"><h4 class="list-group-item-heading">{title}</h4><p class="list-group-item-text">{date}</p></a>';

  // Initialise the search script
  SimpleJekyllSearch({
    searchInput:          document.getElementById('search-input'),
    resultsContainer:     document.getElementById('results-container'),
    json:                 '/search.json',
    searchResultTemplate: template,
    noResultsText:        'No posts found.',
    fuzzy:                true,
  });
</script>
