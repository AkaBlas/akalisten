This directory contains the Jinja2 template files to render the website.
Rough introduction to the files:

* `index.html.j2`: The main template that needs to be rendered. Imports everything else.
* `render_*.j2`: Files providing special macros to render the sub parts of the website.
* scripts and styling files contain the JavaScript and CSS content used by the website.