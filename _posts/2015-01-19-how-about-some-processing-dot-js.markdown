---
layout: post
title: "Processing.js with the kids"
date: 2015-01-19 14:10:58 -0800
comments: true
categories:
using: processing
---

So one way to kick this off might be to see if we can embed a
processing design into a post. Here goes:

<canvas data-processing-sources="/public/sketches/Bugs1.pde" width="500" height="500"></canvas>

Wow, that actually worked! I wrote this as a sort of "introduction
to programming" party I threw for my then-teenage daughter and some
friends. I connected my laptop to the projector and sort of built this
applet up, step by step from nothing, explaining how coordinate
geometry played out on the computer. I was using the Processing IDE
and not JS when I did it, so it was pretty fun to have them follow
along and try a few experiments of their own.

I covered too much material, so I left them dazed by the end; but
ultimately the kids are interested in 3D, and to get there, you have
to have the idea of a model having its own local coordinate system.
Anything you do with 3D modelling will require that, so I wanted to
introduce it to them in the simpler world of 2D, where the idea
can be used just as well.

We had fun playing around with opacity and the algorithm for guiding
movement.  The source is
[here](https://gist.github.com/littleredcomputer/64735088d9a86e5b29e0).
