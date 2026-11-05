---
layout: post
title: "Vectorless knowledge base Agentic system for clinical genomics"
date: 2026-11-05 09:00:00 -0500
description: How we built an AI assistant that answers clinical-genomics questions from governed data, quickly and safely, and what a biotech team can reuse.
tags: [ai, agents, data-platforms, genomics, ctdna]
---

A translational question sounds simple: *which patients have matched tumor and normal sequencing, structural-variant calls from more than one caller, and plasma drawn before and after treatment?* In most labs, answering it takes a day of messages, spreadsheets and one-off scripts.
The answer then lives in someone's notebook and can't be checked or repeated.

Over the past year I built an assistant that answers questions like this in seconds, with the query that produced each number shown underneath. This post covers the architecture and
the decisions that made it safe enough to trust. A team in biotech or an academic lab could reuse most of it.

## The one principle: the model never touches the data

The language model is never handed the database. It can only call a small set of reviewed tools. Each tool runs a fixed, read-only query with validated inputs. Everything else follows from that.

<pre class="mermaid">
flowchart TD
  U["Researcher<br/>signs in with institutional SSO"] -->|question| R{"Can a reviewed rule<br/>answer it?"}
  R -->|yes| RT["Rule templates<br/>no AI, instant"]
  R -->|no| AG["AI agent<br/>frontier model via approved gateway<br/>fast or strong model, switchable mid-conversation"]
  AG -. "gateway unavailable" .-> LM["Local open-weights model<br/>on in-house GPU"]
  RT --> T
  AG -->|calls only reviewed tools| T
  LM --> T
  subgraph G["Guardrails on every query"]
    T["Schema-validated tools<br/>read-only, row limits, no free-form SQL"]
  end
  T --> REG[("Study registry<br/>subject, study, timepoint, specimen, assay, result")]
  T --> VAR[("Versioned variant and biomarker tables<br/>columnar files, in-process SQL")]
  T --> DOC[("Document index<br/>protocols, decisions, SOPs")]
  REG --> C
  VAR --> C
  DOC --> C
  C["Answer check<br/>every number matched to its source"] --> A["Answer with sources<br/>query shown, audit logged"]
  subgraph I["Data intake, human approved"]
    S["Shared storage<br/>pipeline outputs"] --> P["Dry-run plan<br/>with independent cross-checks"] --> H{"Person approves?"} -->|yes| B["Curated tables and<br/>versioned builds"]
  end
  B --> REG
  B --> VAR
</pre>

## 1. Build a registry before a chatbot

The most useful thing we built isn't AI at all. It's a small relational registry that models the research the way scientists think about it: subject → study → treatment timepoint → specimen (tissue, autopsy, plasma) → assay → tumor–normal pair → analysis run → result. Every row
records which source file it came from and that file's checksum. Without this layer, an AI assistant can only guess. With it, most questions become lookups.
Large results, such as variant calls from several callers, are compiled into versioned columnar files and queried in-process. Filters over these tables return in under a second. Each build has a manifest of its inputs, is checked against the lab's reference results,
and is never edited in place. If a build is wrong, we point back to the previous one.

## 2. Rules first

A large share of real questions follow a pattern: counts, lists, "which samples have…", "what settings did this run use…". These go to plain rule templates written and reviewed by people. They're instant, free and deterministic, and they give the same answer every time. The model
sees only what the rules can't answer.

## 3. An agent with a short list of reviewed tools

For multi-part questions, follow-ups and "why" questions, a frontier model works as an agent. It plans, calls tools and writes the answer. The tools cover describing the data, resolving sample and gene names, querying variants and structural variants, querying the registry, and
searching documents. Each tool checks its inputs against a schema and runs a query someone has reviewed. The model can't write SQL, can't write data, and can't browse the web. If a response uses anything it wasn't offered, the response is thrown away.

## 4. Check every answer

After the model answers, a separate step checks that every number in the text appears in the tool results it was given. An answer that fails the check isn't shown as fact. Every answer shows its route (rule, agent or fallback) and the exact queries behind it. Every question is
written to an audit log with its tools, tokens and cost. Scientists trust a number when they can see where it came from.

## 5. Make model choice boring

The model sits behind an approved, contract-covered gateway. Users pick a fast model or a stronger one for each question, and they can switch mid-conversation without losing context, because the app keeps the conversation history. A local open-weights model on our own GPU is the
fallback. With prompt caching, answers stay cheap, and the stronger model is used only when it's needed.

## 6. People approve every write

New data enters through a dry run. The pipeline outputs on shared storage become a written plan. Independent queries cross-check the plan, and nothing is written until a person approves that exact plan. Runtime errors automatically become tracked issues. An AI drafts a fix, the test
suite runs, and a person merges it or doesn't. Every design choice is recorded as a short decision record, so the next engineer can see why things are the way they are.

## What it changes for research

- **Speed.** "Which patients have plasma at two or more timepoints and a matched tumor with structural-variant calls?" goes from a day to seconds.
- **Consistency.** The same question gets the same answer, from the same data version.
- **Reproducibility.** Every figure can be traced back to a query, a data build and source files.
- **Discovery.** Once the data is in one model, cross-cutting questions become cheap to ask. For example: how ctDNA tumor fraction and clonal structure change over treatment, whether founder events are shared across metastases, or how tissue and plasma agree. Cheap questions get
asked, and that's where new hypotheses come from.

## If you want to build one

1. Model your studies, timepoints, specimens and assays first, with source tracking on every row.
2. Compile large results into versioned, checked, read-only builds.
3. Answer common questions with reviewed rules before any model sees them.
4. Give the model a short list of validated, read-only tools, not your database.
5. Check every number against its source, and show the query.
6. Log every question with its cost, and let users choose the model.
7. Keep a person in the loop for every write, and write down every decision.

## What's next

We're extending the same data model to more studies: longitudinal plasma drawn at serial timepoints during treatment, and multi-omic metastatic cohorts with bulk and single-nucleus RNA-seq. We're also adding a knowledge layer that links studies, biomarkers, pipelines and code, and
access control at the level of each study. The principle stays the same: rules first, models second, checks always.

<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  const dark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  mermaid.initialize({ startOnLoad: true, theme: dark ? "dark" : "default", securityLevel: "strict" });
</script>
