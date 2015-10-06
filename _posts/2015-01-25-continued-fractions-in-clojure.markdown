---
layout: post
title: "Continued Fractions in Clojure"
categories: clojure math
comments: true
date: 2015-01-25 18:29:22 -0800
using: katex
---

One of my favorite things to do, with any language that supports even
a tiny amount of laziness (for example, Python's generators are
sufficient here) is to play around with generating
[continued fraction][cf] convergents. These turn out to be the "best
possible" rational approximations to any given number if what you want
is a small denominator.
<span class="equation" data-expr="22\over 7"></span> is a good example
of an approximation to
<span class="equation" data-expr="\pi"></span>, for example; and it
is also one of its continued fraction convergents.

A number is rational iff its continued fraction expansion is
finite. So why bother with lazy evaluation? Since many irrational
numbers have simple forms as continued fractions. For example,
<span class="equation" data-expr="\varphi"></span>, the golden ratio,
can be approximated starting from an endless sequence of ones.
This fascinates me.

On to the code; it's so simple! Given a sequence of integers
<span class="equation" data-expr="n"></span>,
we define
<span class="equation" data-expr="h_n = a_nh_{n-1} + h_{n-2}"></span> where
<span class="equation" data-expr="h_{-1} = 1"></span> and
<span class="equation" data-expr="h_{-2} = 0"></span>. Similarly, we let
<span class="equation" data-expr="k_n=a_nk_{n-1}+k_{n-2}"></span> where
<span class="equation" data-expr="k_{-1} = 0"></span> and
<span class="equation" data-expr="k_{-2}=1"></span>. The two sequences
differ only in their seed values, so in clojure we could write
{% highlight clojure %}
(defn- step [x-2 x-1 [a & as]]
  (when a
    (let [x (+ (* a x-1) x-2)]
      (cons x (lazy-seq (step x-1 x as))))))
{% endhighlight %}
for both of them, where <span class="equation" data-expr="x"></span> stands for
<span class="equation" data-expr="h"></span> or
<span class="equation" data-expr="k"></span>. Now
all we have to do is create the stream of quotients of the hs and ks:

{% highlight clojure %}
(defn convergents [as]
  (let [c (fn c [[h & hs] [k & ks]]
            (when (and h k)
              (cons (/ h k) (lazy-seq (c hs ks)))))]
    (c (step 0 1 as) (step 1 0 as))))
{% endhighlight %}
So now to get approximations to
<span class="equation" data-expr="\varphi"></span>, we can just
{% highlight clojure %}
(->> 1 repeat convergents (take 20) println)
; (1 2 3/2 5/3 8/5 13/8 21/13 34/21 55/34 89/55 144/89
;  233/144 377/233 610/377 987/610 1597/987 2584/1597
;  4181/2584 6765/4181 10946/6765)
{% endhighlight %}
For instance
<span class="equation" data-expr="\varphi - 377/233 \approx 8.24\cdot 10^{-6}"></span>.
Not bad! You can see the fibonacci sequence playing out in there.
If you plug in the first few terms of the continued fraction expansion for
<span class="equation" data-expr="\pi"></span>, we see that both the grade school approximation of
<span class="equation" data-expr="22\over 7"></span> and the remarkable
<span class="equation" data-expr="335/113"></span> known to 祖沖之 back in the
[fifth century][zu] are present. I'm going to try to memorize that one;
<span class="equation" data-expr="22\over 7"></span> always felt like too much of a
hack to me when I was a kid.
{% highlight clojure %}
(println (convergents '(3 7 15 1 292 1 1 1)))
; (3 22/7 333/106 355/113 103993/33102 104348/33215 208341/66317 312689/99532)
{% endhighlight %}
Gist is [here][gist].

[zu]: http://en.wikipedia.org/wiki/Zu_Chongzhi
[cf]: http://en.wikipedia.org/wiki/Continued_fraction
[gist]: https://gist.github.com/littleredcomputer/cee99c791cadf40e35c3
