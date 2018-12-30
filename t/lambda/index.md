---
layout: page
title: "Lambdaconf 2017 Unconference"
date: 2015-01-28 20:35:59 -0800
---

The book: [Structure and Interpretation of Classical Mechanics][SICM]

Running the code: Just run "lein repl" from the project root. That will drop
you into an environment where all the mathematical overloads have been set up
to begin working with examples from the book or creating your own.

Note that if you run under CIDER, there are some REPL hacks that
aren't installed (algebraic simplification and pretty printing are
handled as middleware): to get around that you can wrap expressions in
(print-expression).

[Feynman][Feynman] on the Principle of Least Action

The [slides] for the talk. 

First demo: The [Double Pendulum].

Second demo (if time permits): The [Driven Pendulum] with Surfaces of Section.

[SICM]: https://mitpress.mit.edu/sites/default/files/titles/content/sicm_edition_2/book.html
[Feynman]: http://www.feynmanlectures.caltech.edu/II_19.html
[Double Pendulum]: /math/js/2017/02/11/double-pendulum.html
[Driven Pendulum]: /math/js/2017/02/09/driven-pendulum.html
[slides]: Functional%20Physics.key
