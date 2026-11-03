---
layout: post
title: The real win of TITAN on a GPU is not speed
description: Why running many starting points in parallel matters more than making one run faster.
tags: [GPU, TITAN, copy number, ctDNA]
---
DRAFT: edit the claims, add your numbers and figures, then move this file to `_posts/` with a date in the file name (for example `2026-11-10-multi-start-em-on-gpu.md`).

When I started looking at porting TITAN's copy number model to a GPU, the obvious goal was faster iterations. After looking at how the model behaves on cell-free DNA, I think that is the smaller prize.

TITAN fits a hidden Markov model with EM, and EM only finds a local optimum. On low tumor fraction samples, the starting purity and ploidy decide which optimum you land in. The usual remedy is to run several initializations and keep the best one, which on a CPU means waiting for each run in turn.

A GPU changes that trade. Running 50 to 100 initializations side by side costs little more than running a few, so the search over starting points stops being the thing you ration.

What I want to show in this post:

1. A few real samples where a single run picked a poor solution and the multi-start result did not (add the figure).
2. How many starts it takes before the answer stops changing (add your measurement).
3. What cell-free DNA needs on top of that: low-purity initialization, warm starts from ichorCNA, denser allele-frequency SNP panels and larger bins.
