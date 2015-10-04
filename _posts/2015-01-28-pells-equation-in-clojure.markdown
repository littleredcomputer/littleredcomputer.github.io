---
layout: post
title: "Pell's equation in Clojure"
date: 2015-01-28 20:35:59 -0800
categories: math clojure
---

And what, after all, is the point of implementing continued fractions
in any language? (We're continuing on from the [previous post][prev]).
Why, to solve Pell's equaiton of course. Not that I
have ever needed to do so in real life. Anyway, Pell's equation asks
for integer solutions of
<span class="equation" data-expr="x^2 - n y^2 = 1"></span>, where
<span class="equation" data-expr="n"></span>
is a nonsquare integer. As Wikipedia explains, the solutions to
this equation are found among the continued fraction convergents to
<span class="equation" data-expr="\sqrt n"></span>
. So first we need to generate that stream of
convergents. [Wik][wik-sqrt] gives us the algorithm, which we render in Clojure
as follows:
{% highlight clojure %}
(defn cf-sqrt [n]
  (let [[a0 _] (nt/exact-integer-sqrt n)]
    (loop [m 0 d 1 a a0 r []]
      (if (= a (* 2 a0))
        (cons a0 (cycle r))
        (let [m' (- (* d a) m)
              d' (/ (- n (* m' m')) d)
              a' (nt/floor (/ (+ a0 m') d'))]
          (recur m' d' a' (conj r a')))))))
{% endhighlight %}
Nice and smooth! We're eager, up 'til the point where we have the
repeating part of the expansion, then switch to laziness (via `cycle`)
after we have computed the part that repeats. It's not quite right,
though, in that if we send in a perfect square we get a divide by
zero exception. Let's fix that:
{% highlight clojure %}
(defn cf-sqrt [n]
  (let [[a0 r0] (nt/exact-integer-sqrt n)]
    (if (zero? r0)
      (list a0)
      (loop [m 0 d 1 a a0 r []]
        (println a0 m d a r (= a (* 2 a0)))
        (if (= a (* 2 a0))
          (cons a0 (cycle r))
          (let [m' (- (* d a) m)
                d' (/ (- n (* m' m')) d)
                a' (nt/floor (/ (+ a0 m') d'))]
            (recur m' d' a' (conj r a'))))))))
{% endhighlight %}
Now we have:
{% highlight clojure %}
(take 10 (cf-sqrt 33))
=> (5 1N 2N 1N 10N 1N 2N 1N 10N 1N)
(take 10 (cf-sqrt 36))
=> (6)
{% endhighlight %}
Perfect! Now all we need to solve Pell's equation is to find out
which of the convergents solves it, as [Wik][wik-pell] explains:
{% highlight clojure %}
(defn pell-solution [n]
  (let [solution? (fn [r]
                    (let [r? (ratio? r)
                          x (if r? (numerator r) r)
                          y (if r? (denominator r) 1)]
                      (= 1 (- (* x x) (* n y y)))))]
    (->> n cf-sqrt convergents (filter solution?) first)))
{% endhighlight %}
Sweet. It's not that I'm overly fond of the threading macro, it's
just that you know you've done it right, functional-programming
style, when the item of interest can be shoved through a chain
of functions to reveal something interesting about it. It's the
last line that makes it all worthwhile.
{% highlight clojure %}
(-> 29 pell-solution println)
; 9801/1820
{% endhighlight %}
which means that
<span class="equation" data-expr="9801^2 - 29\cdot1820^2 = 1"></span>.
This is what I live for!

[gist.][gist]

[gist]: https://gist.github.com/littleredcomputer/b53954fd82badaa52317
[wik-sqrt]: http://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Example.2C_square_root_of_114_as_a_continued_fraction
[wik-pell]: http://en.wikipedia.org/wiki/Pell%27s_equation#Fundamental_solution_via_continued_fractions
[prev]: /blog/2015/01/25/continued-fractions-in-clojure/
