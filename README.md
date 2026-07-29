# Ceremony Portfolio

A password-protected portfolio website featuring dynamic project loading from CSV data.

## Features

- **Password Protected**: Secure entry with session storage
- **Dynamic Content**: Projects loaded from `data/projects.csv`
- **Responsive Design**: 5-column grid (featured), full grid (works)
- **Case Studies**: Modal-based project galleries
- **Multiple Pages**: Home, Works, About, Contact
- **Static Deployment**: Optimized for Vercel/GitHub Pages

## Deployment

### Vercel

1. Push to GitHub
2. Import repository to [Vercel](https://vercel.com)
3. Vercel auto-detects static site
4. Deploy on push

### GitHub Pages

1. Enable in repository Settings → Pages
2. Select `main` branch as source
3. Site deploys to `https://username.github.io/ceremony-portfolio`

## Password

Default password: `ceremony`

## Files

- `index.html` - Password entry page
- `home.html` - Featured projects (8 items)
- `works.html` - All projects with case studies
- `about.html` - Studio information
- `contact.html` - Contact details
- `data/projects.csv` - Project data
- `Assets/` - Images, videos, fonts

## Development

Serve locally:

```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

## Media Files

Large files (videos, images) are tracked with Git LFS. Ensure Git LFS is installed:

```bash
git lfs install
```
