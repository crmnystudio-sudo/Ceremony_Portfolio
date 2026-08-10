// CSV Loader and Project Manager
class ProjectManager {
  constructor() {
    this.projects = [];
    this.loaded = false;
  }

  async init() {
    if (this.loaded) return;
    try {
      const response = await fetch('data/projects.csv?t=' + Date.now());
      const csv = await response.text();
      this.projects = this.parseCSV(csv);
      this.loaded = true;
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }

  parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const projects = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parser (handles basic cases)
      const values = this.parseCSVLine(line);
      const project = {};

      headers.forEach((header, idx) => {
        project[header] = values[idx] || '';
      });

      projects.push(project);
    }

    return projects;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  getFeatured() {
    return this.projects
      .filter(p => p.included === 'Y' && p.featured === 'Y')
      .sort((a, b) => parseInt(a.sort_order) - parseInt(b.sort_order));
  }

  getAll() {
    return this.projects
      .filter(p => p.included === 'Y')
      .sort((a, b) => parseInt(a.sort_order) - parseInt(b.sort_order));
  }

  getByTitle(title) {
    return this.projects.find(p => p.title === title);
  }

  getClientLabel(client) {
    return client === 'Ceremony' ? 'Ceremony' : 'Creative Pipeline';
  }

  isVideo(project) {
    const link = project.video_link || '';
    return link.toLowerCase().endsWith('.mp4') ||
           link.toLowerCase().endsWith('.webm') ||
           link.toLowerCase().endsWith('.mov');
  }

  getVideoArray(project) {
    const link = project.video_link || '';
    if (!link) return [];
    return link.split('|').map(v => v.trim()).filter(v => v);
  }

  getFirstVideo(project) {
    const videos = this.getVideoArray(project);
    return videos.length > 0 ? videos[0] : '';
  }
}

// Global instance
const projectManager = new ProjectManager();
