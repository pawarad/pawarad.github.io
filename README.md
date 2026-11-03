# Personal site

A small Jekyll site for GitHub Pages. Everything you edit regularly is a short text file.

## Publish it (once)

1. On GitHub, create a **public** repository named exactly `<your-username>.github.io`.
2. Put the contents of this folder at the root of that repository and push.
3. In the repository, open Settings, then Pages, and set Source to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Edit `_config.yml`: set `url` to `https://<your-username>.github.io`.
5. Edit `_data/profile.yml`: fill in your links (empty ones stay hidden).

The site is live a minute or two after each push.

## Update it (every time)

| To add... | Edit |
|---|---|
| A blog post | New file in `_posts/` named `YYYY-MM-DD-short-title.md` (copy the front matter from an existing post) |
| A post you are not ready to publish | Put it in `_drafts/`. It is not built until you move it to `_posts/` |
| A project | Add an entry to `_data/projects.yml` |
| A paper | Add an entry to `_data/publications.yml` (an example is in the file) |
| A talk or poster | `_data/talks.yml` |
| A news line | `_data/news.yml` |
| Bio, tagline, links | `_data/profile.yml` |
| Focus areas | `_data/areas.yml` |

Images for posts go in `assets/img/` and are referenced as `![alt text]({{ '/assets/img/name.png' | relative_url }})`.

## Sharing on LinkedIn and X

Each post carries its own title, description and link preview. Set `description:` in the post's front matter, and add a 1200x630 PNG at `assets/img/og.png` (used as the default preview image). To use a different image for one post, add `image: /assets/img/my-figure.png` to its front matter. If a preview looks stale after you edit a post, re-scrape the link with LinkedIn's Post Inspector.

## Preview on your computer (optional)

```
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.

## Before you publish

- Check every entry in `_data/projects.yml`, `_data/experience.yml` and any post for anything unpublished, confidential or under embargo (unpublished models, patient-level data, internal paths).
- Never include patient data, sample identifiers or credentials. The copy number plot on the home page is simulated and generated in the browser.
